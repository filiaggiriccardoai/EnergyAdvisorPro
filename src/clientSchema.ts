export type Field = { key: string; label: string; type?: 'number' | 'email' | 'tel' | 'date' | 'textarea'; options?: string[]; max?: number; step?: string };
export const clientSections: { title: string; description: string; fields: Field[] }[] = [
  { title: 'Anagrafica e contatti', description: 'Le informazioni identificative e i recapiti del cliente.', fields: [
    { key: 'surname', label: 'Cognome' }, { key: 'birthDate', label: 'Data di nascita', type: 'date' },
    { key: 'taxCode', label: 'Codice fiscale' }, { key: 'vatNumber', label: 'Partita IVA' },
    { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Telefono', type: 'tel' },
  ] },
  { title: 'Indirizzo dell’immobile', description: 'Il luogo a cui si riferisce la consulenza energetica.', fields: [
    { key: 'address', label: 'Indirizzo e numero civico' }, { key: 'postalCode', label: 'CAP' },
    { key: 'municipality', label: 'Comune' }, { key: 'province', label: 'Provincia (sigla)' },
  ] },
  { title: 'Caratteristiche dell’abitazione', description: 'Dati di partenza per valutare gli interventi.', fields: [
    { key: 'floorArea', label: 'Superficie riscaldata (m²)', type: 'number', step: '0.01' },
    { key: 'constructionYear', label: 'Anno di costruzione', type: 'number', step: '1', max: new Date().getFullYear() },
    { key: 'buildingType', label: 'Tipo di edificio', options: ['Appartamento', 'Casa indipendente', 'Villetta a schiera', 'Condominio', 'Edificio commerciale', 'Altro'] },
    { key: 'insulation', label: 'Isolamento', options: ['Assente', 'Parziale', 'Cappotto esterno', 'Isolamento interno', 'Elevato', 'Altro'] },
    { key: 'windows', label: 'Infissi', options: ['Vetro singolo', 'Doppio vetro', 'Triplo vetro', 'Misti', 'Altro'] },
    { key: 'buildingNotes', label: 'Dettagli su edificio, isolamento e infissi', type: 'textarea' },
  ] },
  { title: 'Consumi elettrici', description: 'Se non conosci un valore, lascia il campo vuoto. Zero indica un consumo o una spesa effettivamente nulli.', fields: [
    { key: 'electricityKwh', label: 'Consumo elettrico annuo (kWh)', type: 'number', step: '0.01' },
    { key: 'electricitySource', label: 'Origine del consumo elettrico', options: ['Effettivo', 'Stimato'] },
    { key: 'electricityCost', label: 'Spesa elettrica annua (€)', type: 'number', step: '0.01' },
    { key: 'electricityCostSource', label: 'Origine della spesa elettrica', options: ['Effettiva', 'Stimata'] },
    { key: 'electricityPeriod', label: 'Periodo o riferimento delle bollette luce' },
  ] },
  { title: 'Consumi gas', description: 'Registra separatamente consumo e spesa, indicando se sono rilevati o stimati.', fields: [
    { key: 'gasSmc', label: 'Consumo gas annuo (Smc)', type: 'number', step: '0.01' },
    { key: 'gasSource', label: 'Origine del consumo gas', options: ['Effettivo', 'Stimato'] },
    { key: 'gasCost', label: 'Spesa gas annua (€)', type: 'number', step: '0.01' },
    { key: 'gasCostSource', label: 'Origine della spesa gas', options: ['Effettiva', 'Stimata'] },
    { key: 'gasPeriod', label: 'Periodo o riferimento delle bollette gas' },
  ] },
  { title: 'Riscaldamento esistente', description: 'Generatore e distribuzione del calore attualmente presenti.', fields: [
    { key: 'heatingType', label: 'Tipologia di riscaldamento', options: ['Autonomo', 'Centralizzato', 'Pompa di calore full electric', 'Sistema ibrido', 'Teleriscaldamento', 'Stufa / biomassa', 'Assente', 'Altro'] },
    { key: 'boiler', label: 'Caldaia esistente: marca, modello e combustibile' },
    { key: 'boilerPower', label: 'Potenza caldaia (kW)', type: 'number', step: '0.01' },
    { key: 'boilerYear', label: 'Anno installazione caldaia', type: 'number', step: '1', max: new Date().getFullYear() },
  ] },
  { title: 'Impianti esistenti', description: 'Presenza, potenza e caratteristiche degli impianti già installati.', fields: [
    { key: 'pvPresence', label: 'Fotovoltaico esistente', options: ['Presente', 'Assente'] },
    { key: 'pvPower', label: 'Potenza fotovoltaico (kWp)', type: 'number', step: '0.01' },
    { key: 'pvNotes', label: 'Dettagli fotovoltaico', type: 'textarea' },
    { key: 'batteryPresence', label: 'Batteria esistente', options: ['Presente', 'Assente'] },
    { key: 'batteryCapacity', label: 'Capacità accumulo (kWh)', type: 'number', step: '0.01' },
    { key: 'batteryNotes', label: 'Dettagli accumulo', type: 'textarea' },
    { key: 'acPresence', label: 'Climatizzatori esistenti', options: ['Presenti', 'Assenti'] },
    { key: 'acCount', label: 'Numero climatizzatori', type: 'number', step: '1' },
    { key: 'acNotes', label: 'Marca, modello e caratteristiche climatizzatori', type: 'textarea' },
  ] },
  { title: 'Obiettivi e note', description: 'Esigenze del cliente e osservazioni utili alla consulenza.', fields: [
    { key: 'goals', label: 'Obiettivi energetici del cliente', type: 'textarea' },
    { key: 'advisorNotes', label: 'Note del consulente', type: 'textarea' },
  ] },
];
export type ClientDetails = Record<string, string>;
export const terminalOptions = ['Radiatori', 'Pavimento radiante', 'Fan coil', 'Altro'];
export function validateDetails(details: unknown): details is ClientDetails {
  return !!details && typeof details === 'object' && !Array.isArray(details)
    && Object.values(details).every(value => typeof value === 'string');
}
