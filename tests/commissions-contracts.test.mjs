import {test,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const temporary=mkdtempSync(join(tmpdir(),'energy-commission-tests-'));
writeFileSync(join(temporary,'package.json'),'{"type":"module"}');
symlinkSync(resolve('node_modules'),join(temporary,'node_modules'),'junction');
for(const name of ['clientSchema','data','workspace','money','commercialRules','customerDocument','commerce','contracts','QuotePreview','quotePdf']){
 const source=readFileSync(new URL(`../src/${name}.${name==='QuotePreview'?'tsx':'ts'}`,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{fileName:`${name}.${name==='QuotePreview'?'tsx':'ts'}`,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from '(.\/[^']+)'/g,"from '$1.js'");
 writeFileSync(join(temporary,`${name}.js`),compiled);
}
const load=name=>import(pathToFileURL(join(temporary,`${name}.js`)));
const money=await load('money'),rules=await load('commercialRules'),commerce=await load('commerce'),ledger=await load('contracts'),ws=await load('workspace');
const {demo,storageKey}=await load('data');const {customerDocument}=await load('customerDocument');
const {quotePdf}=await load('quotePdf');const {default:Preview}=await load('QuotePreview');
let values;
beforeEach(()=>{values=new Map();globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};});
after(()=>{rmSync(temporary,{recursive:true,force:true});delete globalThis.localStorage;});
const profile=()=>({...ws.emptyAdvisor('DEMO-A'),name:'Consulente fittizio'});
function offer(){const q=rules.enableCommercial(commerce.newQuote(profile(),{...demo[0],advisorId:'DEMO-A',name:'Cliente fittizio'}));q.date='2026-01-01';q.validUntil='2026-12-31';q.lines=[rules.prepareCommercialLine({...commerce.demoProducts()[0],id:'DEMO-IMPIANTO',name:'Impianto fittizio',category:'Pacchetto',lineId:'DEMO-LINE',quantity:1,minimumNet:10000,overGross:2200,minimumMandatory:true,components:[],vat:10})];return q;}
function finalOffer(){return {...offer(),status:'final'};}
function contract(){return ledger.createContract({version:1,advisorId:'DEMO-A',contracts:[]},finalOffer(),'2026-03-01','Operatore demo').contracts[0];}
const receipt=()=>({...ledger.receiptDraft(),expectedCents:'500000',expectedDate:'2026-03-02',actualCents:'500000',actualDate:'2026-03-02',reference:'DEMO-INC-1'});
const payment=()=>({...ledger.paymentDraft(),amountCents:'50000',date:'2026-03-03',reference:'DEMO-PAG-1'});

test('Mandatory commercial example: 10000 net + 2200 gross over = correct commissions and 13200 sale',()=>{
 const expected={minimumNet:'1000000',overGross:'220000',overNet:'200000',baseCommission:'100000',overCommission:'120000',theoretical:'220000',companyOver:'80000',customerTotal:'1320000'};
 assert.deepEqual(rules.commissionCalculation(10000,2200),expected);
 assert.deepEqual(rules.commercialEconomics(offer()).snapshot,expected);
 assert.equal(commerce.quoteTotals(offer()).total,13200);
});
test('Decimal cent calculations round consistently without binary float multiplication',()=>{
 assert.equal(money.euroCents(1.005),101n);assert.equal(money.euroCents('0.1'),10n);assert.equal(money.euroCents('1e2'),10000n);
 for(let n=0;n<500;n++){const e=rules.commissionCalculation('10000',(n/100).toFixed(2));assert.equal(BigInt(e.overCommission)+BigInt(e.companyOver),BigInt(e.overNet));}
});
test('Total over is converted once; cent allocation across rows preserves exact aggregate',()=>{
 const q=offer();q.lines=Array.from({length:100},(_,i)=>({...q.lines[0],id:'p'+i,lineId:'l'+i,minimumNet:0,overGross:0.01}));
 const e=rules.commercialEconomics(q);assert.equal(e.snapshot.overGross,'100');assert.equal(e.snapshot.overNet,'91');assert.equal(e.snapshot.customerTotal,'100');
 assert.equal(money.euroCents(e.totals.net),91n);
});
test('Minimum violation preserves draft but blocks finalization and definitive PDF',async()=>{
 const q=offer();q.discount=50;const store={version:1,advisorId:'DEMO-A',products:[],quotes:[]};
 assert.equal(commerce.upsertQuote(store,q).quotes.length,1);assert.ok(rules.finalizationProblems(q).length);
 assert.throws(()=>commerce.finalizeQuote(store,q),/minimo/);await assert.rejects(()=>quotePdf({...q,status:'final'}));
 const draft=await quotePdf(q);assert.ok(draft.output().includes('BOZZA'));
});
test('Package components are not billed twice; overlapping manual rows block finalization',()=>{
 const q=offer();q.lines[0].components=[{productId:'part',quantity:1}];q.lines.push({...q.lines[0],id:'part',category:'Fotovoltaico',components:undefined,lineId:'part-line'});
 assert.ok(rules.finalizationProblems(q).some(s=>s.includes('duplicati')));
 q.lines=q.lines.slice(0,1);assert.deepEqual(rules.finalizationProblems(q),[]);
});
test('Final quotes and price/rule snapshots remain immutable when catalog changes',()=>{
 const q=offer();let store={version:1,advisorId:'DEMO-A',products:[],quotes:[]};store=commerce.finalizeQuote(store,q);
 const raw=commerce.persistCommerce(store,null);const final=store.quotes[0];
 assert.throws(()=>commerce.upsertQuote(store,{...final,title:'mutated'}),/immutabile/);
 assert.throws(()=>commerce.persistCommerce({...store,quotes:[{...final,title:'mutated'}]},raw),/definitivi/);
 assert.equal(commerce.loadCommerce('DEMO-A').raw,raw);
});
test('Legacy quote math and raw archives are preserved without automatic repricing',()=>{
 const q=offer();delete q.commercial;delete q.lines[0].minimumNet;delete q.lines[0].overGross;q.lines[0].sale=100;q.lines[0].vat=22;
 const legacy={version:1,advisorId:'DEMO-A',products:[],quotes:[q]};const raw=JSON.stringify(legacy);values.set(commerce.commercePrefix+'DEMO-A',raw);
 assert.deepEqual(commerce.loadCommerce('DEMO-A').data,legacy);assert.equal(values.get(commerce.commercePrefix+'DEMO-A'),raw);
 assert.equal(commerce.quoteTotals(q).total,122);assert.ok(rules.finalizationProblems(q).length);
});
test('Contract linked to finalized offer: unique origin, frozen amounts, no maturation at signature',()=>{
 const q=finalOffer(),empty={version:1,advisorId:'DEMO-A',contracts:[]};const data=ledger.createContract(empty,q,'2026-03-01','Operatore demo');const c=data.contracts[0];
 assert.equal(c.quoteId,q.id);assert.equal(c.economics.theoretical,'220000');assert.equal(ledger.contractBalances(c).confirmed,0n);assert.ok(ledger.contractBalances(c).verification);
 assert.throws(()=>ledger.createContract(data,q,'2026-03-01','Operatore demo'),/già/);
 assert.throws(()=>ledger.updateContract(data,{...c,economics:{...c.economics,theoretical:'1'}}),/immutabile/);
});
test('Company transfers and finance payments never automatically mature commission',()=>{
 let c=contract();const r=receipt();c=ledger.recordReceipt(c,r,'Operatore demo');c=ledger.recordReceipt(c,{...receipt(),reference:'DEMO-FIN-1',mode:'Finanziaria convenzionata'},'Operatore demo');
 const b=ledger.contractBalances(c);assert.equal(b.received,1000000n);assert.equal(b.companyResidual,320000n);assert.equal(b.confirmed,0n);assert.equal(b.theory,220000n);assert.ok(b.verification);
});
test('Editing a tranche updates instead of adding; duplicate references and IDs do not double count',()=>{
 let c=contract();const r=receipt();c=ledger.recordReceipt(c,r,'Operatore demo');c=ledger.recordReceipt(c,{...r,actualCents:'600000'},'Operatore demo');
 assert.equal(c.receipts.length,1);assert.equal(ledger.contractBalances(c).received,600000n);
 assert.throws(()=>ledger.recordReceipt(c,{...r,id:'different'},'Operatore demo'),/già/);
});
test('Maturation confirmation is manual, reasoned, append-only, and replaces confirmed total',()=>{
 let c=contract();assert.throws(()=>ledger.confirmMaturation(c,1000,'2026-03-03','','Operatore demo'));
 c=ledger.confirmMaturation(c,1000,'2026-03-03','Conferma fittizia','Operatore demo');assert.equal(ledger.contractBalances(c).unverified,120000n);
 c=ledger.confirmMaturation(c,1500,'2026-03-04','Verifica fittizia','Operatore demo',true);
 assert.equal(c.confirmations.length,2);assert.equal(ledger.contractBalances(c).confirmed,150000n);assert.equal(ledger.contractBalances(c).unverified,0n);
 assert.throws(()=>ledger.confirmMaturation(c,1500,'2026-03-04','Ripetizione','Operatore demo',true),/già/);
});
test('Partial consultant payments yield correct residual; same payment edits do not add twice',()=>{
 let c=ledger.confirmMaturation(contract(),2200,'2026-03-03','Conferma demo','Operatore demo',true);const p=payment();c=ledger.recordPayment(c,p,'Operatore demo');c=ledger.recordPayment(c,{...p,amountCents:'70000'},'Operatore demo');
 assert.equal(c.payments.length,1);assert.equal(ledger.contractBalances(c).paid,70000n);assert.equal(ledger.contractBalances(c).residual,150000n);
 assert.throws(()=>ledger.recordPayment(c,{...p,id:'duplicate'},'Operatore demo'),/già/);
});
test('Incidents are separate and never reduce theory, manual confirmations or payments',()=>{
 let c=ledger.confirmMaturation(contract(),2200,'2026-03-03','Conferma demo','Operatore demo');const before=ledger.contractBalances(c);
 const incident={...ledger.incidentDraft(),amountCents:'50000',date:'2026-03-03',status:'Confermato',kind:'Cestello'};
 c=ledger.recordIncident(c,incident,'Operatore demo');const b=ledger.contractBalances(c);assert.equal(b.incidents,50000n);assert.equal(b.theory,before.theory);assert.equal(b.confirmed,before.confirmed);
 c=ledger.recordIncident(c,{...incident,status:'Annullato'},'Operatore demo');assert.equal(ledger.contractBalances(c).incidents,0n);assert.equal(ledger.contractBalances(c).confirmed,before.confirmed);
});
test('Stage transitions are traced; backwards/duplicate transitions are blocked, cancellation retains cash',()=>{
 let c=ledger.recordReceipt(contract(),receipt(),'Operatore demo');c=ledger.transition(c,'Installazione','Operatore demo','Programmata');
 assert.throws(()=>ledger.transition(c,'Sopralluogo','Operatore demo','ritorno'));c=ledger.transition(c,'Annullato','Operatore demo','Annullamento fittizio');
 assert.equal(ledger.contractBalances(c).received,500000n);assert.throws(()=>ledger.transition(c,'Completato','Operatore demo','ritorno'));
 const stats=ledger.dashboardContracts([c],'2026','03').stats;assert.equal(stats.count,0);assert.equal(stats.received,500000n);
});
test('A reference cannot be accounted twice across contracts in one advisor profile',()=>{
 const c=ledger.recordReceipt(contract(),receipt(),'Operatore demo');let second=contract();const store={version:1,advisorId:'DEMO-A',contracts:[c,second]};
 second=ledger.recordReceipt(second,receipt(),'Operatore demo');assert.throws(()=>ledger.updateContract(store,second),/altro contratto/);
});
test('Contract writes preserve clients, profiles and commerce bytes; quota/stale writes are non-destructive',()=>{
 values.set(storageKey,JSON.stringify(demo));ws.loadWorkspace();const workspaceRaw=values.get(ws.workspaceKey),legacyRaw=values.get(storageKey);
 const commerceRaw=JSON.stringify({version:1,advisorId:'DEMO-A',products:[],quotes:[finalOffer()]});values.set(commerce.commercePrefix+'DEMO-A',commerceRaw);
 const data={version:1,advisorId:'DEMO-A',contracts:[contract()]};const raw=ledger.persistContracts(data,null);
 assert.equal(values.get(ws.workspaceKey),workspaceRaw);assert.equal(values.get(storageKey),legacyRaw);assert.equal(values.get(commerce.commercePrefix+'DEMO-A'),commerceRaw);
 assert.throws(()=>ledger.persistContracts(data,null),/altra/);localStorage.setItem=()=>{throw Error('quota');};assert.throws(()=>ledger.persistContracts(data,raw),/quota/);assert.equal(values.get(ledger.contractsPrefix+'DEMO-A'),raw);
});
test('Contract audit and maturity history cannot be silently overwritten',()=>{
 const c=ledger.confirmMaturation(contract(),2200,'2026-03-03','Conferma demo','Operatore demo');const data={version:1,advisorId:'DEMO-A',contracts:[c]};const raw=ledger.persistContracts(data,null);
 assert.throws(()=>ledger.persistContracts({...data,contracts:[{...c,confirmations:[],audit:[]}]},raw),/storico/);
});
test('Month/year/advisor filters are isolated and calculations distinguish theoretical/confirmed/paid',()=>{
 const c=contract();const stats=ledger.dashboardContracts([c],'2026','03').stats;assert.equal(stats.toVerify,220000n);assert.equal(stats.confirmed,0n);assert.equal(stats.paid,0n);assert.equal(ledger.dashboardContracts([c],'2026','04').stats.count,0);
 ledger.persistContracts({version:1,advisorId:'DEMO-A',contracts:[c]},null);assert.equal(ledger.loadContracts('DEMO-B').data.contracts.length,0);
});
test('Customer projection, preview and PDF including metadata exclude private money/rules',async()=>{
 const q=finalOffer();q.lines[0].purchase=777777;q.lines[0].minimumNet=9876.54;q.lines[0].overGross=2345.67;
 const projection=JSON.stringify(customerDocument(q));assert.ok(!projection.includes('minimum'));assert.ok(!projection.includes('overGross'));assert.ok(!projection.includes('commercial'));
 const html=renderToStaticMarkup(createElement(Preview,{quote:q}));assert.ok(!html.includes('9.876,54'));assert.ok(!html.includes('2.345,67'));assert.ok(!html.includes('Provvigione'));assert.ok(!html.includes('777777'));
 const doc=await quotePdf(q),pdf=doc.output();for(const term of ['minimumNet','overGross','Provvigione','theoretical','777777','9.876,54','2.345,67'])assert.ok(!pdf.includes(term),term);
 assert.equal(doc.getNumberOfPages()>0,true);assert.ok(pdf.includes('DEFINITIVO'));
});
