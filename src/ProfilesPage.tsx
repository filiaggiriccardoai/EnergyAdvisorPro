import {useEffect, useRef, useState} from 'react';
import {Check, Pencil, Plus, Save, Upload, UserRound, X} from 'lucide-react';
import {advisorName, clientsFor, emptyAdvisor, type Advisor, type Workspace} from './workspace';
import {prepareLogo} from './logo';

type Props = {workspace: Workspace; onSelect: (id: string) => boolean; onSave: (profile: Advisor) => boolean};
export default function ProfilesPage({workspace,onSelect,onSave}: Props) {
  const [draft,setDraft] = useState<Advisor | null>(null);
  const [dirty,setDirty] = useState(false);
  const [logoBusy,setLogoBusy] = useState(false);
  const [formError,setFormError] = useState('');
  const dirtyRef = useRef(dirty); dirtyRef.current = dirty;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const beforeUnload = (event: BeforeUnloadEvent) => {if (dirtyRef.current) {event.preventDefault(); event.returnValue = '';}};
    window.addEventListener('beforeunload',beforeUnload);
    return () => {mounted.current = false;window.removeEventListener('beforeunload',beforeUnload);};
  },[]);
  function canLeave() {return !dirty || window.confirm('Ci sono modifiche al profilo non salvate. Vuoi scartarle?');}
  function open(profile: Advisor) {
    if (logoBusy || !canLeave()) return;
    setDraft({...profile});setDirty(false);setFormError('');
  }
  async function logo(file?: File) {
    if (!file) return;
    setLogoBusy(true);setFormError('');
    try {
      const image = await prepareLogo(file);
      if (mounted.current) {setDraft(previous => previous ? {...previous,logo:image} : previous);setDirty(true);}
    } catch (failure) {if (mounted.current) setFormError(failure instanceof Error ? failure.message : 'Logo non leggibile.');}
    finally {if (mounted.current) setLogoBusy(false);}
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();if (!draft || logoBusy) return;
    const profile = {...draft};
    for (const key of ['name','surname','company','phone','email','address','vatNumber'] as const) profile[key] = profile[key].trim();
    if (!profile.name && !profile.surname && !profile.company) {setFormError('Inserisci almeno un nome, un cognome o il nome azienda per riconoscere il profilo.');return;}
    if (onSave(profile)) {setDraft(null);setDirty(false);setFormError('');}
  }
  const fields: {key: 'name'|'surname'|'company'|'phone'|'email'|'address'|'vatNumber';label: string;type?: string}[] = [
    {key:'name',label:'Nome'}, {key:'surname',label:'Cognome'}, {key:'company',label:'Nome azienda'},
    {key:'phone',label:'Telefono',type:'tel'}, {key:'email',label:'Email',type:'email'},
    {key:'address',label:'Indirizzo'}, {key:'vatNumber',label:'Partita IVA (facoltativa)'},
  ];
  return <section className="profiles-page"><div className="profile-explanation"><UserRound size={22}/><div><strong>Uno spazio di lavoro per ogni consulente</strong><p>I profili sono locali e non richiedono password. Separano gli archivi nell’interfaccia, ma non sono un sistema di autenticazione o una barriera di sicurezza. Chi usa questo browser può selezionare qualsiasi profilo.</p></div></div>
    <div className="section-heading profile-page-heading"><div><h3>Profili su questo dispositivo</h3><p>{workspace.profiles.length} profili · nessuna sincronizzazione online</p></div><button className="primary" onClick={()=>open(emptyAdvisor(`advisor-${crypto.randomUUID()}`))} disabled={logoBusy}><Plus size={16}/>Nuovo profilo</button></div>
    <div className="advisor-cards">{workspace.profiles.map(profile => <article key={profile.id} className={`card advisor-card ${workspace.activeProfileId === profile.id ? 'current' : ''}`}><div className="advisor-card-top"><span className="advisor-avatar">{profile.logo ? <img src={profile.logo} alt={`Logo ${profile.company || advisorName(profile)}`}/> : <UserRound size={23}/>}</span><div><h3>{advisorName(profile)}</h3><p>{profile.company || 'Azienda da completare'}</p></div>{workspace.activeProfileId === profile.id && <span className="active-profile-tag"><Check size={12}/>Attivo</span>}</div><p className="advisor-client-count">{clientsFor(workspace,profile.id).length} clienti associati</p><div className="advisor-card-actions"><button className="secondary" onClick={()=>open(profile)} disabled={logoBusy}><Pencil size={15}/>Modifica</button><button className="primary" disabled={logoBusy || workspace.activeProfileId === profile.id} onClick={()=>{if (canLeave() && onSelect(profile.id)) {setDraft(null);setDirty(false);}}}>Usa profilo</button></div></article>)}</div>
    {draft && <section className="card advisor-editor"><div className="section-heading"><h3>{workspace.profiles.some(p=>p.id===draft.id) ? 'Modifica profilo consulente' : 'Nuovo profilo consulente'}</h3><button className="icon" aria-label="Chiudi modifica profilo" disabled={logoBusy} onClick={()=>{if(canLeave()){setDraft(null);setDirty(false);}}}><X size={20}/></button></div><p className="editor-help">Inserisci almeno un nome o l’azienda; gli altri dati, inclusa la partita IVA, possono essere completati in seguito.</p><form onSubmit={submit}>
      {formError && <p className="notice" role="alert">{formError}</p>}
      <div className="field-grid">{fields.map(field => <label key={field.key} htmlFor={`advisor-${field.key}`}><span>{field.label}</span><input id={`advisor-${field.key}`} type={field.type || 'text'} maxLength={field.key === 'address' ? 500 : 200} value={draft[field.key]} onChange={e=>{setDraft({...draft,[field.key]:e.target.value});setDirty(true);}}/></label>)}</div>
      <div className="logo-editor"><span className="advisor-avatar logo-preview">{draft.logo ? <img src={draft.logo} alt="Anteprima logo aziendale"/> : <Upload size={25}/>}</span><div><label htmlFor="advisor-logo">Logo aziendale</label><input id="advisor-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={logoBusy} onChange={e=>{void logo(e.target.files?.[0]);e.target.value='';}}/><p>PNG, JPEG o WebP · massimo 2 MB. Il logo viene elaborato e salvato soltanto sul dispositivo.</p>{draft.logo && <button type="button" className="text-button" disabled={logoBusy} onClick={()=>{setDraft({...draft,logo:''});setDirty(true);}}>Rimuovi logo</button>}</div></div>
      <div className="profile-editor-actions"><span>{logoBusy ? 'Elaborazione logo…' : dirty ? 'Modifiche da salvare' : 'Dati del profilo locale'}</span><button type="submit" className="primary" disabled={logoBusy}><Save size={16}/>Salva profilo</button></div>
    </form></section>}
  </section>;
}
