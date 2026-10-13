/** Decimal -> scaled integer, without binary floating point arithmetic. Half-up, away from zero. */
export function roundRatio(n:bigint,d:bigint):bigint {
 if(d<=0n)throw Error('Divisore non valido.');return n<0n?-roundRatio(-n,d):(n+d/2n)/d;
}
export function scaled(value:number|string,digits=2):bigint {
 const s=String(value).trim();const m=s.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
 if(!m)throw Error('Importo decimale non valido.');
 const fraction=m[3]||'',exponent=Number(m[4]||0);if(Math.abs(exponent)>20)throw Error('Importo fuori limite.');
 const coefficient=BigInt(m[2]+fraction)*(m[1]==='-'?-1n:1n);const power=digits+exponent-fraction.length;
 return power>=0?coefficient*10n**BigInt(power):roundRatio(coefficient,10n**BigInt(-power));
}
export const euroCents=(value:number|string)=>scaled(value,2);
export const percent=(value:number)=>scaled(value,2);
export function euros(value:bigint|string):number {const cents=BigInt(value);if(cents>BigInt(Number.MAX_SAFE_INTEGER)||cents<-BigInt(Number.MAX_SAFE_INTEGER))throw Error('Importo fuori limite.');return Number(cents)/100;}
export const multiply=(cents:bigint,quantity:number)=>roundRatio(cents*scaled(quantity,4),10000n);
export const rate=(cents:bigint,basisPoints:number)=>roundRatio(cents*BigInt(basisPoints),10000n);
export const isCents=(v:unknown):v is string=>typeof v==='string'&&/^(0|[1-9]\d*)$/.test(v)&&BigInt(v)<=BigInt(Number.MAX_SAFE_INTEGER);
export function allocateCents(total:bigint,weights:bigint[]):bigint[] {
 const sum=weights.reduce((n,v)=>n+v,0n);if(sum===0n)return weights.map(()=>0n);
 const allocated=weights.map(w=>total*w/sum);let remaining=total-allocated.reduce((n,v)=>n+v,0n);
 const order=weights.map((w,index)=>({index,remainder:total*w%sum})).sort((a,b)=>a.remainder===b.remainder?a.index-b.index:a.remainder>b.remainder?-1:1);
 for(const item of order){if(remaining===0n)break;allocated[item.index]++;remaining--;}
 return allocated;
}
export function moneyLabel(value:bigint|string):string {
 const n=BigInt(value),absolute=n<0n?-n:n;
 return `${n<0n?'-':''}${new Intl.NumberFormat('it-IT').format(absolute/100n)},${(absolute%100n).toString().padStart(2,'0')} €`;
}
