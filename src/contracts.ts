import {isQuote,newId,localDate,type Quote} from './commerce';
import {commercialEconomics,finalizationProblems} from './commercialRules';
import {isCents,euroCents,euros} from './money';
export const contractStages=['Preventivo','Contratto firmato','Sopralluogo','Installazione','Collaudo','Completato','Annullato'] as const;
export type ContractStage=typeof contractStages[number];
export type Receipt={id:string;mode:'Bonifico'|'Finanziaria convenzionata'|'Altro';expectedCents:string;expectedDate:string;actualCents:string;actualDate:string;reference:string;notes:string};
export type Payment={id:string;amountCents:string;date:string;reference:string;notes:string};
export type Incident={id:string;kind:'Cestello'|'Canaline extra'|'Adeguamenti'|'Altro';description:string;amountCents:string;date:string;status:'Previsto'|'Confermato'|'Annullato';impact:string};
export type Confirmation={id:string;amountCents:string;date:string;reason:string;actor:string;createdAt:string;complete:boolean};
export type Audit={id:string;createdAt:string;actor:string;action:string;detail:string};
export type Contract={id:string;advisorId:string;quoteId:string;signedOn:string;quote:Quote;economics:ReturnType<typeof commercialEconomics>['snapshot'];stage:ContractStage;receipts:Receipt[];payments:Payment[];incidents:Incident[];confirmations:Confirmation[];audit:Audit[]};
export type ContractStore={version:1;advisorId:string;contracts:Contract[]};
export const contractsPrefix='energy-advisor-pro:contracts:v1:';
const date=(value:unknown,optional=false)=>typeof value==='string'&&(optional&&value===''||/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value);
const strings=(v:unknown,keys:string[])=>!!v&&typeof v==='object'&&keys.every(key=>typeof (v as Record<string,unknown>)[key]==='string');
const unique=(items:{id:string}[])=>items.every(i=>!!i.id)&&new Set(items.map(i=>i.id)).size===items.length;
export function isReceipt(v:unknown):v is Receipt {const r=v as Receipt;return !!r&&strings(r,['id','mode','reference','notes'])&&['Bonifico','Finanziaria convenzionata','Altro'].includes(r.mode)&&isCents(r.expectedCents)&&isCents(r.actualCents)&&(BigInt(r.expectedCents)>0n||BigInt(r.actualCents)>0n)&&date(r.expectedDate,true)&&date(r.actualDate,r.actualCents==='0');}
export function isPayment(v:unknown):v is Payment {const p=v as Payment;return !!p&&strings(p,['id','reference','notes'])&&isCents(p.amountCents)&&BigInt(p.amountCents)>0n&&date(p.date);}
export function isIncident(v:unknown):v is Incident {const i=v as Incident;return !!i&&strings(i,['id','description','impact'])&&['Cestello','Canaline extra','Adeguamenti','Altro'].includes(i.kind)&&['Previsto','Confermato','Annullato'].includes(i.status)&&isCents(i.amountCents)&&date(i.date);}
export function isConfirmation(v:unknown):v is Confirmation {const c=v as Confirmation;return !!c&&strings(c,['id','reason','actor','createdAt'])&&!!c.reason.trim()&&!!c.actor.trim()&&typeof c.complete==='boolean'&&isCents(c.amountCents)&&date(c.date)&&!Number.isNaN(Date.parse(c.createdAt));}
export function isContract(value:unknown,owner:string):value is Contract {
 const c=value as Contract;if(!c||c.advisorId!==owner||!strings(c,['id','quoteId'])||!date(c.signedOn)||!contractStages.includes(c.stage)||!isQuote(c.quote,owner)||c.quote.id!==c.quoteId||c.quote.status!=='final')return false;
 if(!c.economics||!['minimumNet','overGross','overNet','baseCommission','overCommission','theoretical','companyOver','customerTotal'].every(k=>isCents((c.economics as unknown as Record<string,unknown>)[k])))return false;
 return Array.isArray(c.receipts)&&c.receipts.every(isReceipt)&&unique(c.receipts)&&Array.isArray(c.payments)&&c.payments.every(isPayment)&&unique(c.payments)&&Array.isArray(c.incidents)&&c.incidents.every(isIncident)&&unique(c.incidents)&&Array.isArray(c.confirmations)&&c.confirmations.every(isConfirmation)&&unique(c.confirmations)&&Array.isArray(c.audit)&&c.audit.every(a=>strings(a,['id','createdAt','actor','action','detail']))&&unique(c.audit);
}
export function isContractStore(v:unknown,owner:string):v is ContractStore {
 const d=v as ContractStore;if(!d||d.version!==1||d.advisorId!==owner||!Array.isArray(d.contracts)||!d.contracts.every(c=>isContract(c,owner))||!unique(d.contracts)||new Set(d.contracts.map(c=>c.quoteId)).size!==d.contracts.length)return false;
 const receipts=d.contracts.flatMap(c=>c.receipts),payments=d.contracts.flatMap(c=>c.payments);
 const refs=(entries:{reference:string}[])=>{const list=entries.map(e=>e.reference.trim().toLowerCase()).filter(Boolean);return new Set(list).size===list.length;};
 return unique(receipts)&&unique(payments)&&refs(receipts)&&refs(payments);
}
export function loadContracts(owner:string):{data:ContractStore|null;raw:string|null;error:string} {
 let raw:string|null=null;try{raw=localStorage.getItem(contractsPrefix+owner);if(raw===null)return {data:{version:1,advisorId:owner,contracts:[]},raw,error:''};const data:unknown=JSON.parse(raw);if(!isContractStore(data,owner))throw Error();return {data,raw,error:''};}catch{return {data:null,raw,error:'Archivio contratti non leggibile. Nessun dato è stato cancellato: esporta un backup completo.'};}
}
export function persistContracts(data:ContractStore,expected:string|null):string {
 if(!isContractStore(data,data.advisorId))throw Error('Dati del contratto non validi.');
 const key=contractsPrefix+data.advisorId;if(localStorage.getItem(key)!==expected)throw Error('Contratti aggiornati in un’altra scheda. Ricarica prima di salvare.');
 if(expected!==null){const previous=JSON.parse(expected) as ContractStore;for(const old of previous.contracts){const next=data.contracts.find(c=>c.id===old.id);if(!next||JSON.stringify(next.quote)!==JSON.stringify(old.quote)||JSON.stringify(next.economics)!==JSON.stringify(old.economics)||next.signedOn!==old.signedOn)throw Error('Fotografia del contratto non modificabile.');if(old.audit.some((a,index)=>JSON.stringify(a)!==JSON.stringify(next.audit[index]))||old.confirmations.some((c,index)=>JSON.stringify(c)!==JSON.stringify(next.confirmations[index])))throw Error('Registro storico non modificabile: aggiungi una nuova conferma.');}}
 const raw=JSON.stringify(data);localStorage.setItem(key,raw);return raw;
}
function audit(actor:string,action:string,detail:string):Audit {if(!actor.trim())throw Error('Operatore non specificato.');return {id:newId(),createdAt:new Date().toISOString(),actor,action,detail};}
export function createContract(data:ContractStore,q:Quote,signedOn:string,actor:string):ContractStore {
 if(q.advisorId!==data.advisorId||q.status!=='final'||!isQuote(q,data.advisorId)||finalizationProblems(q).length||!date(signedOn))throw Error('Seleziona un preventivo definitivo valido e una data firma.');
 if(data.contracts.some(c=>c.quoteId===q.id))throw Error('Esiste già un contratto per questo preventivo.');
 const contract:Contract={id:newId(),advisorId:data.advisorId,quoteId:q.id,signedOn,quote:structuredClone(q),economics:commercialEconomics(q).snapshot,stage:'Contratto firmato',receipts:[],payments:[],incidents:[],confirmations:[],audit:[audit(actor,'Contratto registrato',`Firma ${signedOn}. Maturazione da verificare.`)]};
 return {...data,contracts:[contract,...data.contracts]};
}
export function updateContract(data:ContractStore,c:Contract):ContractStore {
 const old=data.contracts.find(previous=>previous.id===c.id);if(!old||c.advisorId!==data.advisorId)throw Error('Contratto non trovato nel profilo attivo.');
 for(const other of data.contracts.filter(previous=>previous.id!==c.id)){
  if(c.receipts.some(r=>other.receipts.some(x=>r.id===x.id||(r.reference.trim()&&x.reference.trim().toLowerCase()===r.reference.trim().toLowerCase()))))throw Error('Incasso/riferimento già registrato su un altro contratto.');
  if(c.payments.some(p=>other.payments.some(x=>p.id===x.id||(p.reference.trim()&&x.reference.trim().toLowerCase()===p.reference.trim().toLowerCase()))))throw Error('Pagamento/riferimento già registrato su un altro contratto.');
 }
 if(JSON.stringify(old.quote)!==JSON.stringify(c.quote)||JSON.stringify(old.economics)!==JSON.stringify(c.economics)||old.quoteId!==c.quoteId||old.signedOn!==c.signedOn)throw Error('La fotografia del contratto è immutabile.');
 return {...data,contracts:data.contracts.map(previous=>previous.id===c.id?c:previous)};
}
export function transition(c:Contract,next:ContractStage,actor:string,reason:string):Contract {
 if(!reason.trim())throw Error('Indica una motivazione per il cambio stato.');
 if(!contractStages.includes(next)||next===c.stage||c.stage==='Annullato'||(next!=='Annullato'&&contractStages.indexOf(next)<contractStages.indexOf(c.stage)))throw Error('Transizione di stato non consentita.');
 return {...c,stage:next,audit:[...c.audit,audit(actor,'Cambio stato',`${c.stage} → ${next}: ${reason}`)]};
}
export function confirmMaturation(c:Contract,value:number|string,date:string,reason:string,actor:string,complete=false):Contract {
 const amount=euroCents(value);if(amount<0n||!isCents(amount.toString())||!reason.trim()||!dateValid(date))throw Error('Indica importo, data e motivazione della conferma manuale.');
 const last=c.confirmations.at(-1);if(last?.amountCents===amount.toString()&&last.date===date&&last.complete===complete)throw Error('Conferma identica già registrata.');
 const confirmation:Confirmation={id:newId(),amountCents:amount.toString(),date,reason:reason.trim(),actor,createdAt:new Date().toISOString(),complete};
 return {...c,confirmations:[...c.confirmations,confirmation],audit:[...c.audit,audit(actor,'Maturazione confermata manualmente',JSON.stringify({before:last??null,after:confirmation}))]};
}
const dateValid=(d:string)=>date(d);
export function recordReceipt(c:Contract,r:Receipt,actor:string):Contract {
 if(!isReceipt(r))throw Error('Importi/date dell’incasso non validi.');
 const duplicate=c.receipts.find(x=>x.id!==r.id&&((r.reference.trim()&&x.reference.trim().toLowerCase()===r.reference.trim().toLowerCase())||(!r.reference.trim()&&!x.reference.trim()&&r.actualCents!=='0'&&x.actualCents===r.actualCents&&x.actualDate===r.actualDate&&x.mode===r.mode)));
 if(duplicate)throw Error('Operazione già registrata. Per tranche distinte usa riferimenti diversi.');
 return {...c,receipts:upsert(c.receipts,r),audit:[...c.audit,audit(actor,'Incasso azienda registrato/modificato',JSON.stringify({before:c.receipts.find(x=>x.id===r.id)??null,after:r}))]};
}
export function recordPayment(c:Contract,p:Payment,actor:string):Contract {
 if(!isPayment(p))throw Error('Importo/data pagamento non validi.');
 if(c.payments.some(x=>x.id!==p.id&&((p.reference.trim()&&x.reference.trim().toLowerCase()===p.reference.trim().toLowerCase())||(!p.reference.trim()&&!x.reference.trim()&&x.amountCents===p.amountCents&&x.date===p.date))))throw Error('Pagamento già registrato. Per operazioni distinte usa riferimenti diversi.');
 return {...c,payments:upsert(c.payments,p),audit:[...c.audit,audit(actor,'Pagamento consulente registrato/modificato',JSON.stringify({before:c.payments.find(x=>x.id===p.id)??null,after:p}))]};
}
export function recordIncident(c:Contract,i:Incident,actor:string):Contract {
 if(!isIncident(i))throw Error('Imprevisto non valido.');
 return {...c,incidents:upsert(c.incidents,i),audit:[...c.audit,audit(actor,'Imprevisto registrato/modificato',JSON.stringify({before:c.incidents.find(x=>x.id===i.id)??null,after:i}))]};
}
function upsert<T extends {id:string}>(items:T[],entry:T):T[] {return items.some(x=>x.id===entry.id)?items.map(x=>x.id===entry.id?entry:x):[...items,entry];}
export function contractBalances(c:Contract) {
 const sum=<T>(items:T[],getter:(entry:T)=>string)=>items.reduce((n,item)=>n+BigInt(getter(item)),0n);
 const received=sum(c.receipts,r=>r.actualCents),expected=sum(c.receipts,r=>r.expectedCents),paid=sum(c.payments,p=>p.amountCents),confirmed=BigInt(c.confirmations.at(-1)?.amountCents??'0'),theory=BigInt(c.economics.theoretical),sale=BigInt(c.economics.customerTotal);
 const incidents=sum(c.incidents.filter(i=>i.status==='Confermato'),i=>i.amountCents);
 return {received,expected,paid,confirmed,theory,sale,companyResidual:sale>received?sale-received:0n,companyExcess:received>sale?received-sale:0n,residual:confirmed>paid?confirmed-paid:0n,excess:paid>confirmed?paid-confirmed:0n,incidents,verification:!c.confirmations.at(-1)?.complete,unverified:c.confirmations.at(-1)?.complete?0n:theory>confirmed?theory-confirmed:0n};
}
export function dashboardContracts(contracts:Contract[],year:string,month:string) {
 const selected=contracts.filter(c=>(!year||c.signedOn.slice(0,4)===year)&&(!month||c.signedOn.slice(5,7)===month));
 const active=selected.filter(c=>!['Preventivo','Annullato'].includes(c.stage));
 const stats={count:active.length,sales:0n,theory:0n,toVerify:0n,confirmed:0n,paid:0n,residual:0n,received:0n};
 for(const c of selected){const b=contractBalances(c);stats.received+=b.received;stats.confirmed+=b.confirmed;stats.paid+=b.paid;stats.residual+=b.residual;if(active.includes(c)){stats.sales+=b.sale;stats.theory+=b.theory;if(b.verification)stats.toVerify+=b.unverified;}}
 return {selected,stats};
}
export function receiptDraft():Receipt {return {id:newId(),mode:'Bonifico',expectedCents:'0',expectedDate:'',actualCents:'0',actualDate:'',reference:'',notes:''};}
export function paymentDraft():Payment {return {id:newId(),amountCents:'0',date:localDate(),reference:'',notes:''};}
export function incidentDraft():Incident {return {id:newId(),kind:'Altro',description:'',amountCents:'0',date:localDate(),status:'Previsto',impact:'Da definire: nessuna rettifica automatica'};}
export {euros};
