import {allocateCents,euroCents,euros,multiply,percent,rate,roundRatio} from './money';
import type {Quote,QuoteLine} from './commerce';
export type CommercialRules={version:1;vatBps:1000;baseBps:1000;overSellerBps:6000;overCompanyBps:4000;discountPolicy:'quoted-over'};
export const confirmedRules=():CommercialRules=>({version:1,vatBps:1000,baseBps:1000,overSellerBps:6000,overCompanyBps:4000,discountPolicy:'quoted-over'});
export function isRules(value:unknown):value is CommercialRules {const r=value as CommercialRules;return !!r&&r.version===1&&r.vatBps===1000&&r.baseBps===1000&&r.overSellerBps===6000&&r.overCompanyBps===4000&&r.discountPolicy==='quoted-over';}
export function commissionCalculation(minimum:number|string,overGross:number|string,rules=confirmedRules()) {
 if(!isRules(rules))throw Error('Regole economiche non supportate.');
 const min=euroCents(minimum),gross=euroCents(overGross);if(min<0n||gross<0n)throw Error('Gli importi non possono essere negativi.');
 const net=roundRatio(gross*10000n,10000n+BigInt(rules.vatBps));
 const base=rate(min,rules.baseBps),seller=rate(net,rules.overSellerBps),company=net-seller;
 return {minimumNet:min.toString(),overGross:gross.toString(),overNet:net.toString(),baseCommission:base.toString(),overCommission:seller.toString(),theoretical:(base+seller).toString(),companyOver:company.toString(),customerTotal:(min+rate(min,rules.vatBps)+gross).toString()};
}
export function prepareCommercialLine(line:QuoteLine):QuoteLine {
 return {...line,minimumNet:line.minimumNet??euros(euroCents(line.sale)+euroCents(line.installationSale)),minimumMandatory:line.minimumMandatory??true,overGross:line.overGross??0,vat:10};
}
export function enableCommercial(q:Quote):Quote {return {...q,commercial:confirmedRules(),lines:q.lines.map(prepareCommercialLine)};}
export function packageConflicts(lines:QuoteLine[]):string[] {
 const occupied=new Map<string,{id:string;pack:boolean}>();const conflicts=new Set<string>();
 for(const line of lines){const ids=line.category==='Pacchetto'?[line.id,...(line.components??[]).map(c=>c.productId)]:[line.id];
  for(const id of new Set(ids)){const previous=occupied.get(id);if(previous&&previous.id!==line.lineId&&(previous.pack||line.category==='Pacchetto'))conflicts.add(`Componenti duplicati tra pacchetto/articolo: ${line.name}`);occupied.set(id,{id:line.lineId,pack:line.category==='Pacchetto'});}}
 return [...conflicts];
}
export function commercialEconomics(q:Pick<Quote,'lines'|'discount'|'commercial'>) {
 const rules=q.commercial;if(!isRules(rules))throw Error('Attiva le regole commerciali prima di procedere.');
 if(q.discount<0||q.discount>100||!Number.isFinite(q.discount))throw Error('Sconto non valido.');
 const overWeights=q.lines.map(line=>multiply(euroCents(line.overGross??0),line.quantity));
 const totalOverGross=overWeights.reduce((n,v)=>n+v,0n);
 const totalOverNet=roundRatio(totalOverGross*10000n,11000n);
 const shares=allocateCents(totalOverNet,overWeights);
 const calculated=q.lines.map((line,index)=>{
  if(line.discount<0||line.discount>100||line.quantity<=0||!Number.isFinite(line.quantity))throw Error('Riga non valida.');
  const min=multiply(euroCents(line.minimumNet??euros(euroCents(line.sale)+euroCents(line.installationSale))),line.quantity);
  const grossOver=multiply(euroCents(line.overGross??0),line.quantity);if(min<0n||grossOver<0n)throw Error('Importi non validi.');
  const over=shares[index],gross=min+over;
  const afterLine=roundRatio(gross*(10000n-percent(line.discount)),10000n);
  const net=roundRatio(afterLine*(10000n-percent(q.discount)),10000n);
  // Derive gross customer amount from the quoted gross over; the undiscounted result is exact.
  const beforeVat=min+rate(min,rules.vatBps)+grossOver;
  const afterLineVat=roundRatio(beforeVat*(10000n-percent(line.discount)),10000n);
  const total=roundRatio(afterLineVat*(10000n-percent(q.discount)),10000n);
  const vat=total-net;
  const cost=multiply(euroCents(line.purchase)+euroCents(line.installationPurchase),line.quantity);
  return {lineId:line.lineId,minimum:min,overGross:grossOver,overNet:over,gross,afterLine,net,vat,total,cost,violated:(line.minimumMandatory??true)&&net<min};
 });
 const sum=(key:'minimum'|'overGross'|'overNet'|'gross'|'afterLine'|'net'|'vat'|'total'|'cost')=>calculated.reduce((n,l)=>n+l[key],0n);
 const minimum=sum('minimum'),grossOver=sum('overGross'),overNet=sum('overNet');
 const base=rate(minimum,rules.baseBps),seller=rate(overNet,rules.overSellerBps);
 const violations=calculated.filter(l=>l.violated).map(l=>`Prezzo sotto il minimo obbligatorio: ${q.lines.find(line=>line.lineId===l.lineId)?.name}`);
 violations.push(...packageConflicts(q.lines));
 const net=sum('net'),vat=sum('vat'),cost=sum('cost');
 const snapshot={minimumNet:minimum.toString(),overGross:grossOver.toString(),overNet:overNet.toString(),baseCommission:base.toString(),overCommission:seller.toString(),theoretical:(base+seller).toString(),companyOver:(overNet-seller).toString(),customerTotal:sum('total').toString()};
 const totals={lines:calculated.map(l=>({lineId:l.lineId,gross:euros(l.gross),rowDiscount:euros(l.gross-l.afterLine),offerDiscount:euros(l.afterLine-l.net),net:euros(l.net),vat:euros(l.vat),total:euros(l.total),cost:euros(l.cost),rate:10})),gross:euros(sum('gross')),discount:euros(sum('gross')-net),net:euros(net),vat:euros(vat),total:euros(sum('total')),cost:euros(cost),margin:euros(net-cost),marginPercent:net===0n?null:Number(net-cost)/Number(net)*100,vatGroups:[{rate:10,net:euros(net),vat:euros(vat)}]};
 return {rules,snapshot,violations,totals};
}
export function finalizationProblems(q:Quote):string[] {
 if(!q.commercial)return ['Preventivo storico: attiva esplicitamente le regole commerciali su una copia/bozza prima di finalizzare.'];
 try {return commercialEconomics(q).violations;}catch{return ['Valori economici non validi.'];}
}
