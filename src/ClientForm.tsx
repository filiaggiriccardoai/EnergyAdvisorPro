import {useEffect, useRef, useState} from 'react';
import {Download, Save, X, UserRound, ChevronDown} from 'lucide-react';
import {clientSections, terminalOptions, type ClientDetails, type Field} from './clientSchema';
import {electricityValue, type Client} from './data';

type Props = {client: Client | null; onSave: (client: Client) => boolean; onClose: () => void; onPdf: (client: Client) => void; error: string; blocked: boolean};
export default function ClientForm({client, onSave, onClose, onPdf, error, blocked}: Props) {
  const [name, setName] = useState(client?.name ?? '');
  const [details, setDetails] = useState<ClientDetails>(() => {
    const previous = client?.details ?? {};
    const city = client?.city ?? '';
    const match = city.match(/^(.*),\s*([A-Za-z]{2})$/);
    const value = client ? electricityValue(client) : null;
    return {
      municipality: match ? match[1] : city,
      province: match ? match[2].toUpperCase() : '',
      electricityKwh: value === null ? '' : String(value),
      ...previous,
    };
  });
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const closeRef = useRef(onClose);
  const dirtyRef = useRef(dirty);
  closeRef.current = onClose; dirtyRef.current = dirty;
  const heading = client ? 'Scheda cliente' : 'Nuova scheda cliente';
  function close() {
    if (!dirty || window.confirm('Ci sono modifiche non salvate. Vuoi chiudere la scheda e scartarle?')) onClose();
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!dirtyRef.current || window.confirm('Ci sono modifiche non salvate. Vuoi scartarle?')) closeRef.current();
      }
      if (event.key === 'Tab') {
        const elements = [...(formRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea') ?? [])].filter(el => el.getClientRects().length > 0);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
        if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
      }
    }
    function unload(event: BeforeUnloadEvent) {if (dirtyRef.current) {event.preventDefault(); event.returnValue = '';}}
    window.addEventListener('keydown', key); window.addEventListener('beforeunload', unload);
    return () => {document.body.style.overflow = bodyOverflow; window.removeEventListener('keydown', key); window.removeEventListener('beforeunload', unload); previous?.focus();};
  }, []);
  function change(key: string, value: string) {setDetails(current => ({...current, [key]: value})); setDirty(true);}
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, value.trim()]));
    normalized.province = normalized.province?.toUpperCase() ?? '';
    const next: Client = {
      ...(client ?? {id: `EA-${crypto.randomUUID()}`, system: 'Da dimensionare', status: 'In analisi', cost: 0}),
      name: name.trim(),
      city: [normalized.municipality, normalized.province].filter(Boolean).join(', '),
      kwh: normalized.electricityKwh === '' ? 0 : Number(normalized.electricityKwh),
      details: normalized,
    };
    if (onSave(next)) setDirty(false);
  }
  function field(field: Field) {
    const id = `client-${field.key}`;
    const value = details[field.key] ?? '';
    return <label key={field.key} className={field.type === 'textarea' ? 'wide-field' : ''} htmlFor={id}>
      <span>{field.label}</span>
      {field.options ? <select id={id} value={value} onChange={e => change(field.key,e.target.value)}>
        <option value="">Non disponibile / non specificato</option>
        {value && !field.options.includes(value) && <option value={value}>{value}</option>}
        {field.options.map(option => <option key={option}>{option}</option>)}
      </select> : field.type === 'textarea' ? <textarea id={id} rows={3} maxLength={10000} value={value} onChange={e => change(field.key,e.target.value)}/>
        : <input id={id} type={field.type ?? 'text'} min={field.key.endsWith('Year') ? 1000 : field.type === 'number' ? 0 : undefined} max={field.max} step={field.step} maxLength={field.key === 'province' ? 2 : field.type === 'number' ? undefined : 200} pattern={field.key === 'province' ? '[A-Za-z]{2}' : field.key === 'postalCode' ? '[0-9]{5}' : undefined} value={value} onChange={e => change(field.key,e.target.value)}/>}
    </label>;
  }
  const terminals = (details.terminals ?? '').split('|').filter(Boolean);
  return <div className="backdrop client-backdrop"><section className="client-sheet" role="dialog" aria-modal="true" aria-labelledby="client-sheet-title">
    <form ref={formRef} onSubmit={submit}>
      <div className="sheet-header"><div className="sheet-heading"><span className="sheet-icon"><UserRound size={22}/></span><div><span className="eyebrow">{client?.id ?? 'ARCHIVIO LOCALE'}</span><h2 id="client-sheet-title">{heading}</h2></div></div><button type="button" className="icon" aria-label="Chiudi scheda cliente" onClick={close}><X/></button></div>
      <div className="sheet-body"><p className="sheet-intro">Tutti i campi sono facoltativi. Compila ciò che conosci e aggiorna la scheda nel tempo. I dati restano nel browser di questo dispositivo.</p>
        {error && <p className="notice" role="alert">{error}</p>}
        <label className="client-display-name" htmlFor="client-name"><span>Nome o ragione sociale</span><input id="client-name" maxLength={200} value={name} onChange={e => {setName(e.target.value);setDirty(true);}} placeholder="Facoltativo: puoi completarlo in seguito"/></label>
        {clientSections.map((section,index) => <details className="sheet-section" key={section.title} open>
          <summary><span className="section-number">{String(index + 1).padStart(2,'0')}</span><span>{section.title}<small>{section.description}</small></span><ChevronDown size={17}/></summary>
          <div className="field-grid">{section.fields.map(field)}
            {section.title === 'Riscaldamento esistente' && <fieldset className="terminal-fields wide-field"><legend>Terminali esistenti (selezione multipla)</legend>{terminalOptions.map(option => <label key={option}><input type="checkbox" checked={terminals.includes(option)} onChange={e => change('terminals',(e.target.checked ? [...terminals,option] : terminals.filter(t => t !== option)).join('|'))}/>{option}</label>)}<small>Nessuna selezione: informazione non disponibile.</small></fieldset>}
          </div>
        </details>)}
        <p className="sheet-note">I consumi senza origine specificata sono classificati come «Origine non specificata». I dati dell’archivio precedente non vengono automaticamente considerati effettivi.</p>
      </div>
      <div className="sheet-actions"><span>{dirty ? 'Modifiche da salvare' : 'Archivio locale · campi facoltativi'}</span><div>{client && <button type="button" className="secondary" onClick={() => onPdf(client)} disabled={dirty} title={dirty ? 'Salva prima le modifiche per scaricare il PDF' : 'PDF dimostrativo'}><Download size={16}/>PDF demo</button>}<button className="secondary" type="button" onClick={close}>Annulla</button><button className="primary" type="submit" disabled={blocked}><Save size={16}/>Salva scheda</button></div></div>
    </form>
  </section></div>;
}
