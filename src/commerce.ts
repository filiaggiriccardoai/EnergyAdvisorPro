import {isClient, type Client} from './data';
import {isAdvisor, type Advisor} from './workspace';
export const categories = ['Fotovoltaico','Inverter','Batteria','Pompa di calore','Accessorio','Servizio'] as const;
export type Category = typeof categories[number];
export type Product = {
 id:string; name:string; category:Category; brand:string; model:string; kind:string; size:number; unit:string;
 quantity:number; purchase:number; sale:number; installationPurchase:number; installationSale:number;
 discount:number; vat:number; active:boolean; demo:boolean;
};
export type QuoteLine = Product & {lineId:string};
export type Quote = {
 id:string; advisorId:string; clientId:string; number:string; title:string; date:string; validUntil:string;
 advisor:Advisor; client:Client; lines:QuoteLine[]; discount:number; notes:string; exclusions:string; conditions:string;
 status:'draft'; updatedAt:string;
};
export type Commerce = {version:1; advisorId:string; products:Product[]; quotes:Quote[]};
export const commercePrefix='energy-advisor-pro:commerce:v1:';
export const currency=(n:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n);
export function newId() {return crypto.randomUUID();}
export function emptyProduct():Product {
 return {id:newId(),name:'',category:'Fotovoltaico',brand:'',model:'',kind:'',size:0,unit:'pz',quantity:1,purchase:0,sale:0,installationPurchase:0,installationSale:0,discount:0,vat:22,active:true,demo:false};
}
export function demoProducts():Product[] {
 const defaults={brand:'DEMO',model:'Esempio',kind:'',unit:'pz',quantity:1,installationPurchase:0,installationSale:0,discount:0,vat:22,active:true,demo:true};
 return [
  {id:'demo-panel',name:'DEMO · Modulo 450 Wp',category:'Fotovoltaico',size:450,purchase:90,sale:160,quantity:13},
  {id:'demo-inverter',name:'DEMO · Inverter 6 kW',category:'Inverter',size:6,purchase:900,sale:1400,kind:'Ibrido'},
  {id:'demo-battery',name:'DEMO · Batteria 5 kWh utili',category:'Batteria',size:5,purchase:1500,sale:2200,quantity:2},
  {id:'demo-heatpump',name:'DEMO · Pompa di calore 8 kW',category:'Pompa di calore',size:8,purchase:3500,sale:5000,kind:'Full electric'},
  {id:'demo-hybrid',name:'DEMO · Pompa di calore 10 kW',category:'Pompa di calore',size:10,purchase:4200,sale:5900,kind:'Ibrida'},
  {id:'demo-structure',name:'DEMO · Strutture di supporto',category:'Accessorio',size:0,purchase:250,sale:400,unit:'lotto'},
  {id:'demo-panelboard',name:'DEMO · Quadri e protezioni',category:'Accessorio',size:0,purchase:180,sale:300,unit:'lotto'},
  {id:'demo-install',name:'DEMO · Installazione e manodopera',category:'Servizio',size:0,purchase:700,sale:1100,unit:'lotto'},
  {id:'demo-paperwork',name:'DEMO · Pratiche amministrative',category:'Servizio',size:0,purchase:150,sale:250,unit:'pratica'},
 ].map(p=>({...defaults,...p} as Product));
}
const finite=(value:unknown,min=0,max=1000000):value is number=>typeof value==='number' && Number.isFinite(value) && value>=min && value<=max;
export function isProduct(value:unknown):value is Product {
 if(!value||typeof value!=='object')return false;
 const p=value as Product;
 return ['id','name','brand','model','kind','unit'].every(k=>typeof (p as unknown as Record<string,unknown>)[k]==='string')
  && !!p.id && !!p.name.trim() && !!p.unit.trim() && categories.includes(p.category) && finite(p.size)
  && finite(p.quantity,0.01,100000) && (!['Fotovoltaico','Inverter','Batteria','Pompa di calore'].includes(p.category)||Number.isInteger(p.quantity))
  && [p.purchase,p.sale,p.installationPurchase,p.installationSale].every(v=>finite(v))
  && finite(p.discount,0,100) && finite(p.vat,0,100) && typeof p.active==='boolean' && typeof p.demo==='boolean';
}
const dateValid=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
export function isQuote(value:unknown,owner:string):value is Quote {
 if(!value||typeof value!=='object')return false;
 const q=value as Quote;
 return ['id','clientId','number','title','date','validUntil','notes','exclusions','conditions','updatedAt'].every(k=>typeof (q as unknown as Record<string,unknown>)[k]==='string')
  && !!q.id && !!q.number.trim() && !!q.title.trim() && q.advisorId===owner && q.status==='draft'
  && isAdvisor(q.advisor)&&q.advisor.id===owner&&isClient(q.client)&&q.client.id===q.clientId&&q.client.advisorId===owner
  && dateValid(q.date)&&(q.validUntil===''||(dateValid(q.validUntil)&&q.validUntil>=q.date))
  && finite(q.discount,0,100) && Array.isArray(q.lines)&&q.lines.length>0&&q.lines.length<=200
  && q.lines.every(l=>isProduct(l)&&typeof l.lineId==='string'&&!!l.lineId)
  && new Set(q.lines.map(l=>l.lineId)).size===q.lines.length;
}
export function isCommerce(value:unknown,owner:string):value is Commerce {
 if(!value||typeof value!=='object')return false;
 const c=value as Commerce;
 return c.version===1&&c.advisorId===owner&&Array.isArray(c.products)&&c.products.every(isProduct)
  && new Set(c.products.map(p=>p.id)).size===c.products.length&&Array.isArray(c.quotes)&&c.quotes.every(q=>isQuote(q,owner))
  && new Set(c.quotes.map(q=>q.id)).size===c.quotes.length;
}
export function loadCommerce(advisorId:string):{data:Commerce|null;raw:string|null;error:string} {
 let raw:string|null=null;
 try {
  raw=localStorage.getItem(commercePrefix+advisorId);
  if(raw===null)return {data:{version:1,advisorId,products:demoProducts(),quotes:[]},raw,error:''};
  const data:unknown=JSON.parse(raw);if(!isCommerce(data,advisorId))throw Error();
  return {data,raw,error:''};
 }catch{return {data:null,raw,error:'Archivio catalogo/preventivi non leggibile. Nessun dato è stato cancellato. Esporta un backup completo prima di procedere.'};}
}
export function persistCommerce(data:Commerce,expectedRaw:string|null):string {
 if(!isCommerce(data,data.advisorId))throw Error('Dati non validi: controlla articoli, quantità, prezzi, sconti, IVA e date.');
 const key=commercePrefix+data.advisorId;
 if(localStorage.getItem(key)!==expectedRaw)throw Error('Catalogo o preventivi aggiornati in un’altra scheda. Ricarica prima di salvare.');
 const raw=JSON.stringify(data);localStorage.setItem(key,raw);return raw;
}
export function upsertQuote(data:Commerce,quote:Quote):Commerce {
 if(!isQuote(quote,data.advisorId))throw Error('Preventivo non valido o associato a un altro consulente.');
 return {...data,quotes:data.quotes.some(q=>q.id===quote.id)?data.quotes.map(q=>q.id===quote.id?quote:q):[quote,...data.quotes]};
}
export function localDate(date=new Date()):string {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function newQuote(advisor:Advisor,client:Client):Quote {
 if(client.advisorId!==advisor.id)throw Error('Il cliente non appartiene al consulente attivo.');
 const id=newId(),date=new Date(),expiry=new Date(date);expiry.setDate(expiry.getDate()+30);
 return {id,advisorId:advisor.id,clientId:client.id,number:`PREV-${date.getFullYear()}-${id.slice(0,8).toUpperCase()}`,title:'Proposta impianto energetico',date:localDate(date),validUntil:localDate(expiry),advisor:structuredClone(advisor),client:structuredClone(client),lines:[],discount:0,notes:'',exclusions:'',conditions:'',status:'draft',updatedAt:''};
}
const cents=(n:number)=>Math.round((n+Number.EPSILON)*100);
export function quoteTotals(quote:Pick<Quote,'lines'|'discount'>) {
 if(!finite(quote.discount,0,100)||!quote.lines.every(isProduct))throw Error('Valori economici non validi.');
 const lines=quote.lines.map(line=>{
  const gross=cents(line.quantity*(line.sale+line.installationSale));
  const rowNet=cents(gross/100*(1-line.discount/100));
  const net=cents(rowNet/100*(1-quote.discount/100));
  const vat=cents(net/100*line.vat/100);
  const cost=cents(line.quantity*(line.purchase+line.installationPurchase));
  return {lineId:line.lineId,gross:gross/100,rowDiscount:(gross-rowNet)/100,offerDiscount:(rowNet-net)/100,net:net/100,vat:vat/100,total:(net+vat)/100,cost:cost/100,rate:line.vat};
 });
 const sum=(key:'gross'|'net'|'vat'|'total'|'cost'|'rowDiscount'|'offerDiscount')=>lines.reduce((n,l)=>n+cents(l[key]),0)/100;
 const net=sum('net'),cost=sum('cost');
 const vatGroups=[...new Set(lines.map(l=>l.rate))].sort((a,b)=>a-b).map(rate=>({rate,net:lines.filter(l=>l.rate===rate).reduce((n,l)=>n+cents(l.net),0)/100,vat:lines.filter(l=>l.rate===rate).reduce((n,l)=>n+cents(l.vat),0)/100}));
 return {lines,gross:sum('gross'),discount:cents(sum('rowDiscount')+sum('offerDiscount'))/100,net,vat:sum('vat'),total:sum('total'),cost,margin:cents(net-cost)/100,marginPercent:net===0?null:(net-cost)/net*100,vatGroups};
}
export function systemSizes(lines:QuoteLine[]) {
 return {panels:lines.filter(l=>l.category==='Fotovoltaico').reduce((n,l)=>n+l.quantity,0),pvKwp:lines.filter(l=>l.category==='Fotovoltaico').reduce((n,l)=>n+l.size*l.quantity,0)/1000,batteryKwh:lines.filter(l=>l.category==='Batteria').reduce((n,l)=>n+l.size*l.quantity,0),thermalKw:lines.filter(l=>l.category==='Pompa di calore').reduce((n,l)=>n+l.size*l.quantity,0)};
}
export function sizeLabel(p:Product):string {
 return p.size && ['Fotovoltaico','Inverter','Batteria','Pompa di calore'].includes(p.category) ? `${p.size} ${p.category==='Fotovoltaico'?'Wp':p.category==='Batteria'?'kWh utili':'kW nominali'}` : '';
}
