import {test,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const temporary=mkdtempSync(join(tmpdir(),'energy-commerce-tests-'));
writeFileSync(join(temporary,'package.json'),'{"type":"module"}');
symlinkSync(resolve('node_modules'),join(temporary,'node_modules'),'dir');
for(const name of ['clientSchema','data','workspace','commerce','QuotePreview','quotePdf']){
 const path=`../src/${name}.${name==='QuotePreview'?'tsx':'ts'}`;
 const source=readFileSync(new URL(path,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from '(.\/[^']+)'/g,"from '$1.js'");
 writeFileSync(join(temporary,`${name}.js`),compiled);
}
const api=await import(pathToFileURL(join(temporary,'commerce.js')));
const ws=await import(pathToFileURL(join(temporary,'workspace.js')));
const {demo,storageKey}=await import(pathToFileURL(join(temporary,'data.js')));
const {quotePdf}=await import(pathToFileURL(join(temporary,'quotePdf.js')));
const {default:Preview}=await import(pathToFileURL(join(temporary,'QuotePreview.js')));
let values;
beforeEach(()=>{values=new Map();globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};});
after(()=>{rmSync(temporary,{recursive:true,force:true});delete globalThis.localStorage;});
const advisor=()=>({...ws.emptyAdvisor('DEMO-A'),name:'Consulente fittizio',company:'Azienda demo',email:'demo@example.invalid'});
const client=()=>({...demo[0],advisorId:'DEMO-A',name:'Cliente fittizio'});
function quote(){const q=api.newQuote(advisor(),client());q.lines=[{...api.demoProducts()[0],lineId:'LINE-DEMO'}];return q;}

test('Catalog/quote writes never modify existing clients, advisors or migration backups',()=>{
 values.set(storageKey,JSON.stringify(demo));const existing=ws.loadWorkspace();const old=values.get(storageKey),raw=values.get(ws.workspaceKey);
 const loaded=api.loadCommerce('DEMO-A');assert.ok(loaded.data.products.every(p=>p.demo));
 api.persistCommerce(api.upsertQuote(loaded.data,quote()),null);
 assert.equal(values.get(storageKey),old);assert.equal(values.get(ws.workspaceKey),raw);assert.deepEqual(ws.loadWorkspace().workspace,existing.workspace);
});
test('Different advisors have independent catalogs and quotes across reloads',()=>{
 const a=api.loadCommerce('DEMO-A'),b=api.loadCommerce('DEMO-B');
 api.persistCommerce(api.upsertQuote(a.data,quote()),a.raw);
 assert.equal(api.loadCommerce('DEMO-A').data.quotes.length,1);assert.equal(api.loadCommerce('DEMO-B').data.quotes.length,0);
 assert.equal(b.raw,null);assert.throws(()=>api.upsertQuote(b.data,quote()),/consulente/);
 assert.throws(()=>api.newQuote(advisor(),{...client(),advisorId:'DEMO-B'}));
});
test('Bozzas persist multiple offers per client and allow later edits',()=>{
 const loaded=api.loadCommerce('DEMO-A');let data=api.upsertQuote(loaded.data,quote());const second=quote();data=api.upsertQuote(data,second);
 const saved=api.persistCommerce(data,loaded.raw);assert.equal(api.loadCommerce('DEMO-A').data.quotes.length,2);
 const edited={...second,conditions:'Condizioni demo aggiornate',lines:second.lines.map(l=>({...l,quantity:20,sale:175}))};
 api.persistCommerce(api.upsertQuote(data,edited),saved);
 const restored=api.loadCommerce('DEMO-A').data;assert.equal(restored.quotes.find(q=>q.id===second.id).lines[0].quantity,20);assert.equal(restored.quotes.length,2);
});
test('Catalog edits, deactivation and deletion do not change saved quotes or party snapshots',()=>{
 const loaded=api.loadCommerce('DEMO-A');const q=quote();const data=api.upsertQuote(loaded.data,q);
 const raw=api.persistCommerce({...data,products:[]},loaded.raw);
 const restored=api.loadCommerce('DEMO-A').data;assert.equal(restored.products.length,0);assert.deepEqual(restored.quotes[0],q);
 assert.equal(api.loadCommerce('DEMO-A').raw,raw);assert.equal(restored.quotes[0].advisor.name,'Consulente fittizio');
});
test('Mixed VAT, two discounts and installation use consistent cent rounding and net margin',()=>{
 const base=api.demoProducts()[0];const lines=[{...base,lineId:'a',quantity:2,sale:100,installationSale:20,purchase:70,installationPurchase:10,discount:10,vat:22},
 {...base,id:'service',lineId:'b',category:'Servizio',quantity:1,sale:50,installationSale:0,purchase:30,installationPurchase:0,discount:0,vat:10}];
 const t=api.quoteTotals({lines,discount:5});
 assert.equal(t.gross,290);assert.equal(t.discount,37.3);assert.equal(t.net,252.7);assert.equal(t.vat,49.89);assert.equal(t.total,302.59);assert.equal(t.cost,190);assert.equal(t.margin,62.7);
 assert.deepEqual(t.vatGroups,[{rate:10,net:47.5,vat:4.75},{rate:22,net:205.2,vat:45.14}]);
});
test('Zero sale, full discount and negative margins are handled without division errors',()=>{
 const q=quote();q.lines[0].sale=0;let t=api.quoteTotals(q);assert.equal(t.net,0);assert.equal(t.marginPercent,null);assert.ok(t.margin<0);
 q.lines[0].sale=100;q.discount=100;t=api.quoteTotals(q);assert.equal(t.total,0);assert.equal(t.marginPercent,null);
});
test('Hardware sizes aggregate panel count, kWp and usable battery capacity',()=>{
 const catalog=api.demoProducts();const lines=[{...catalog[0],lineId:'pv'},{...catalog[2],lineId:'bat'}];
 assert.deepEqual(api.systemSizes(lines),{panels:13,pvKwp:5.85,batteryKwh:10,thermalKw:0});
});
test('Invalid economic data, impossible dates and cross-profile party snapshots are rejected',()=>{
 const q=quote();for(const bad of [-1,101,NaN,Infinity]){assert.throws(()=>api.quoteTotals({...q,discount:bad}));}
 assert.equal(api.isQuote({...q,date:'2026-02-30'},'DEMO-A'),false);
 assert.equal(api.isQuote({...q,validUntil:'2000-01-01'},'DEMO-A'),false);
 assert.equal(api.isQuote({...q,client:{...q.client,advisorId:'DEMO-B'}},'DEMO-A'),false);
 assert.equal(api.isProduct({...q.lines[0],quantity:1.5}),false);
});
test('Corrupt storage, quota failure and stale saves preserve saved commerce data',()=>{
 const loaded=api.loadCommerce('DEMO-A');const raw=api.persistCommerce(loaded.data,null);
 assert.throws(()=>api.persistCommerce({...loaded.data,products:[]},null),/altra/);
 localStorage.setItem=()=>{throw Error('quota');};assert.throws(()=>api.persistCommerce({...loaded.data,products:[]},raw),/quota/);assert.equal(values.get(api.commercePrefix+'DEMO-A'),raw);
 values.set(api.commercePrefix+'DEMO-A','corrupt');const invalid=api.loadCommerce('DEMO-A');assert.equal(invalid.data,null);assert.equal(values.get(api.commercePrefix+'DEMO-A'),'corrupt');
});
test('Customer preview contains DEMO labeling and totals, excluding internal cost/margin',()=>{
 const q=quote();q.lines[0].purchase=777777;
 const html=renderToStaticMarkup(createElement(Preview,{quote:q}));
 assert.ok(html.includes('Cliente fittizio'));assert.ok(html.includes('DEMO'));assert.ok(html.includes('Totale offerta'));
 assert.ok(!html.includes('777777'));assert.ok(!html.includes('Margine'));assert.ok(!html.includes('Costo interno'));
});
test('Professional PDF is generated, multipage content retained and internal costs excluded',async()=>{
 const q=quote();q.lines[0].purchase=777777;q.notes='Nota fittizia lunga. '.repeat(500)+' FINE-NOTE-DEMO';
 const doc=await quotePdf(q);assert.ok(doc.getNumberOfPages()>1);const pdf=doc.output();
 assert.ok(pdf.startsWith('%PDF-'));assert.ok(pdf.includes('FINE-NOTE-DEMO'));assert.ok(pdf.includes('DEMO'));assert.ok(!pdf.includes('777777'));assert.ok(!pdf.includes('Margine'));
});

test('Hardware accepts positive whole quantities; services accept fractional quantities',()=>{
 const hardware=api.demoProducts()[0];
 assert.equal(api.isProduct({...hardware,quantity:1}),true);
 assert.equal(api.isProduct({...hardware,quantity:13}),true);
 assert.equal(api.isProduct({...hardware,quantity:0}),false);
 assert.equal(api.isProduct({...hardware,quantity:0.01}),false);
 assert.equal(api.isProduct({...hardware,quantity:1.5}),false);
 assert.equal(api.isProduct({...hardware,category:'Servizio',quantity:0.01}),true);
});
