import {commercialEconomics} from './commercialRules';
import {currency,type Quote} from './commerce';
import {euros,moneyLabel} from './money';
export default function EconomicsSummary({quote}:{quote:Quote}) {
 if(!quote.commercial)return <p className="commerce-help">Preventivo storico: nessuna provvigione ricalcolata automaticamente.</p>;
 try {const result=commercialEconomics(quote),e=result.snapshot;
 return <section className="internal-economics"><h3>Riepilogo economico interno · regole v{quote.commercial.version}</h3><div className="pricing-summary">{[['Minimo netto','minimumNet'],['Over lordo inserito','overGross'],['Over netto','overNet'],['Prezzo finale IVA inclusa','customerTotal'],['Provvigione base 10%','baseCommission'],['Provvigione over 60%','overCommission'],['Provvigione teorica totale','theoretical'],['Quota azienda over 40%','companyOver']].map(([label,key])=><div key={key}><small>{label}</small><strong>{moneyLabel(e[key as keyof typeof e])}</strong></div>)}</div>{result.violations.map(message=><p className="notice" role="alert" key={message}>{message} · Bozza salvabile, finalizzazione bloccata.</p>)}<p className="commerce-help">IVA riferimento 10%. Provvigione teorica sul minimo e sull’over inseriti secondo le formule confermate. Gli sconti riducono il prezzo cliente; non introducono una rettifica automatica della provvigione. Firma e incassi non fanno maturare automaticamente il compenso. Questi dati non sono inclusi nei documenti cliente.</p></section>;
 }catch{return <p className="notice">Completa le righe economiche per visualizzare il riepilogo.</p>;}
}
