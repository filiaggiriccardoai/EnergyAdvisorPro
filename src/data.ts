import {validateDetails, type ClientDetails} from './clientSchema';
export type Client={id:string;name:string;city:string;system:string;status:'In analisi'|'Preventivo inviato'|'Completato';kwh:number;cost:number;details?:ClientDetails};
export const demo:Client[]=[{id:'EA-001',name:'Marco Rossi',city:'Verona, VR',system:'Fotovoltaico + accumulo',status:'In analisi',kwh:4800,cost:14800},{id:'EA-002',name:'Laura Bianchi',city:'Padova, PD',system:'Full electric',status:'Preventivo inviato',kwh:6200,cost:24500},{id:'EA-003',name:'Officine Verdi S.r.l.',city:'Vicenza, VI',system:'Fotovoltaico',status:'In analisi',kwh:28500,cost:38000},{id:'EA-004',name:'Giuseppe Ferrari',city:'Brescia, BS',system:'Pompa di calore ibrida',status:'Completato',kwh:3900,cost:12600}];
export const roadmap=[['Bollette','Importazione e validazione di consumi luce e gas, fasce e costi.'],['Impianti','Dimensionamento fotovoltaico, batterie e pompe di calore full electric o ibride.'],['Incentivi','Incentivi fiscali e Conto Termico 3.0: regole, requisiti e cumulabilità da verificare su fonti ufficiali.'],['Scenari economici','Confronto di flussi di cassa, tempi di ritorno e sensibilità ai prezzi.'],['Integrazioni','PUN/PSV, PVGIS, geolocalizzazione, analisi satellitare del tetto e disposizione pannelli.']];
export const storageKey='energy-advisor-pro:clients:v1';
export function readClients(): {clients: Client[]; error: string; raw: string | null} {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey);
    if (raw === null) return {clients: demo, error: '', raw};
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || !data.every(c => c && typeof c.id === 'string'
      && typeof c.name === 'string' && typeof c.city === 'string' && typeof c.system === 'string'
      && ['In analisi','Preventivo inviato','Completato'].includes(c.status)
      && Number.isFinite(c.kwh) && Number.isFinite(c.cost)
      && (c.details === undefined || validateDetails(c.details)))) throw Error();
    return {clients: data, error: '', raw};
  } catch {
    return {clients: [], raw, error: 'Archivio locale non leggibile. Nessun dato è stato modificato. Il salvataggio è bloccato per proteggere i clienti esistenti.'};
  }
}
export function persistClients(clients: Client[], expectedRaw: string | null): string {
  if (localStorage.getItem(storageKey) !== expectedRaw) {
    throw new Error('Archivio modificato in un’altra scheda. Ricarica la pagina prima di salvare; le modifiche non sono state scritte.');
  }
  const next = JSON.stringify(clients);
  localStorage.setItem(storageKey, next);
  return next;
}
export function electricityValue(client: Client): number | null {
  if (client.details && Object.hasOwn(client.details, 'electricityKwh')) {
    return client.details.electricityKwh === '' ? null : Number(client.details.electricityKwh);
  }
  return client.kwh === 0 ? null : client.kwh;
}
