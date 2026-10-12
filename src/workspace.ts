import {isClient, readClients, storageKey, type Client} from './data';

export type Advisor = {
  id: string; name: string; surname: string; company: string; phone: string;
  email: string; address: string; vatNumber: string; logo: string;
};
export type AssignedClient = Client & {advisorId: string};
export type Workspace = {
  version: 2; profiles: Advisor[]; activeProfileId: string; clients: AssignedClient[];
  legacySnapshot: string | null;
};
export const workspaceKey = 'energy-advisor-pro:workspace:v2';
export const primaryProfileId = 'advisor-primary';
export function emptyAdvisor(id: string): Advisor {
  return {id, name:'', surname:'', company:'', phone:'', email:'', address:'', vatNumber:'', logo:''};
}
export function advisorName(profile: Advisor): string {
  return [profile.name,profile.surname].filter(Boolean).join(' ') || profile.company
    || (profile.id === primaryProfileId ? 'Consulente principale' : 'Consulente senza nome');
}
export function isAdvisor(value: unknown): value is Advisor {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return ['id','name','surname','company','phone','email','address','vatNumber','logo'].every(key => typeof p[key] === 'string')
    && !!p.id && (p.logo === '' || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(String(p.logo)))
    && String(p.logo).length <= 350000;
}
export function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const w = value as Workspace;
  if (w.version !== 2 || !Array.isArray(w.profiles) || !w.profiles.length || !w.profiles.every(isAdvisor)
    || !Array.isArray(w.clients) || !(w.legacySnapshot === null || typeof w.legacySnapshot === 'string')) return false;
  const ids = new Set(w.profiles.map(profile => profile.id));
  return ids.size === w.profiles.length && ids.has(w.activeProfileId)
    && w.clients.every(client => isClient(client) && typeof client.advisorId === 'string' && ids.has(client.advisorId));
}
export type WorkspaceLoad = {workspace: Workspace | null; raw: string | null; error: string; migrated: boolean};
/** One atomic write for migration; the original client key is never changed or deleted. */
export function loadWorkspace(): WorkspaceLoad {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(workspaceKey);
    if (raw !== null) {
      const workspace: unknown = JSON.parse(raw);
      if (!isWorkspace(workspace)) throw Error('Archivio profili non leggibile.');
      return {workspace, raw, error:'', migrated:false};
    }
    const legacy = readClients();
    if (legacy.error) throw Error(legacy.error);
    const workspace: Workspace = {
      version:2, profiles:[emptyAdvisor(primaryProfileId)], activeProfileId:primaryProfileId,
      clients:legacy.clients.map(client => ({...client, advisorId:primaryProfileId})), legacySnapshot:legacy.raw,
    };
    if (!isWorkspace(workspace)) throw Error('Migrazione non valida.');
    const saved = persistWorkspace(workspace,null);
    return {workspace, raw:saved, error:'', migrated:true};
  } catch {
    return {workspace:null, raw, migrated:false, error:'Archivio non disponibile o salvataggio non riuscito. I dati esistenti sono stati conservati. Esporta il backup completo e verifica lo spazio del browser; nessun archivio verrà sovrascritto.'};
  }
}
export function persistWorkspace(workspace: Workspace, expectedRaw: string | null): string {
  if (!isWorkspace(workspace)) throw Error('Archivio non valido: nessuna modifica salvata.');
  if (localStorage.getItem(workspaceKey) !== expectedRaw) {
    throw Error('Archivio aggiornato in un’altra scheda. Ricarica la pagina prima di salvare.');
  }
  if (localStorage.getItem(storageKey) !== workspace.legacySnapshot) {
    throw Error('Il vecchio archivio è stato modificato da un’altra versione dell’app. I due archivi sono conservati: esporta il backup completo prima di procedere.');
  }
  const raw = JSON.stringify(workspace);
  localStorage.setItem(workspaceKey,raw);
  return raw;
}
export function clientsFor(workspace: Workspace, advisorId = workspace.activeProfileId): AssignedClient[] {
  return workspace.clients.filter(client => client.advisorId === advisorId);
}
export function selectAdvisor(workspace: Workspace, id: string): Workspace {
  if (!workspace.profiles.some(profile => profile.id === id)) throw Error('Consulente non trovato.');
  return {...workspace,activeProfileId:id};
}
export function upsertAdvisor(workspace: Workspace, profile: Advisor): Workspace {
  if (!isAdvisor(profile)) throw Error('Profilo non valido.');
  const exists = workspace.profiles.some(previous => previous.id === profile.id);
  return {...workspace, profiles: exists ? workspace.profiles.map(previous => previous.id === profile.id ? profile : previous) : [...workspace.profiles,profile], activeProfileId:profile.id};
}
export function upsertClient(workspace: Workspace, client: Client, editingId?: string): Workspace {
  const assigned: AssignedClient = {...client,advisorId:client.advisorId || workspace.activeProfileId};
  if (!workspace.profiles.some(profile => profile.id === assigned.advisorId)) throw Error('Consulente non trovato.');
  if (editingId) {
    const previous = workspace.clients.find(c => c.id === editingId && c.advisorId === workspace.activeProfileId);
    if (!previous || client.id !== editingId) throw Error('Cliente non presente nell’archivio del consulente attivo.');
    return {...workspace,clients:workspace.clients.map(c => c === previous ? assigned : c)};
  }
  if (workspace.clients.some(c => c.id === client.id)) throw Error('Identificativo cliente già esistente.');
  return {...workspace,clients:[assigned,...workspace.clients]};
}
/** Future reports can use the customer's associated advisor, independent of the active profile. */
export function reportContext(workspace: Workspace, clientId: string) {
  const client = workspace.clients.find(c => c.id === clientId);
  if (!client) throw Error('Cliente non trovato.');
  const advisor = workspace.profiles.find(profile => profile.id === client.advisorId)!;
  return {client,advisor};
}
