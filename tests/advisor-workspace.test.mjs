import {test,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temporary=mkdtempSync(join(tmpdir(),'energy-advisor-tests-'));
writeFileSync(join(temporary,'package.json'),'{"type":"module"}');
for (const name of ['clientSchema','data','workspace']) {
  const source=readFileSync(new URL(`../src/${name}.ts`,import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '(.\/[^']+)'/g,"from '$1.js'");
  writeFileSync(join(temporary,`${name}.js`),compiled);
}
const api=await import(pathToFileURL(join(temporary,'workspace.js')));
const {demo,storageKey}=await import(pathToFileURL(join(temporary,'data.js')));
let values;
beforeEach(()=>{values=new Map();globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};});
after(()=>{rmSync(temporary,{recursive:true,force:true});delete globalThis.localStorage;});
const profileB=()=>({...api.emptyAdvisor('DEMO-B'),name:'Consulente fittizio B',company:'Azienda demo'});

test('Migration preserves every legacy client and unknown detail; original bytes remain unchanged',()=>{
 const legacy=structuredClone(demo);legacy[0].details={advisorNotes:'Nota fittizia',futureField:'da conservare'};legacy[0].unknownProject={value:'demo'};
 const raw=JSON.stringify(legacy,null,2);values.set(storageKey,raw);
 const result=api.loadWorkspace();assert.equal(result.error,'');assert.equal(result.migrated,true);
 assert.equal(values.get(storageKey),raw);
 assert.deepEqual(result.workspace.clients.map(({advisorId,...client})=>client),legacy);
 assert.ok(result.workspace.clients.every(c=>c.advisorId===api.primaryProfileId));
 assert.equal(result.workspace.legacySnapshot,raw);
});

test('Repeated loading is idempotent and empty legacy archives stay empty',()=>{
 values.set(storageKey,'[]');const first=api.loadWorkspace(),second=api.loadWorkspace();
 assert.equal(first.workspace.clients.length,0);assert.equal(second.migrated,false);assert.equal(second.raw,first.raw);
 assert.equal(second.workspace.profiles.length,1);assert.equal(values.get(storageKey),'[]');
});

test('New profiles start empty; each client appears only for its associated advisor',()=>{
 const loaded=api.loadWorkspace();let workspace=api.upsertAdvisor(loaded.workspace,profileB());
 assert.deepEqual(api.clientsFor(workspace),[]);
 const newClient={...demo[0],id:'DEMO-CLIENT-B',name:'Cliente fittizio B'};
 workspace=api.upsertClient(workspace,newClient);
 assert.equal(api.clientsFor(workspace).length,1);assert.equal(api.clientsFor(workspace)[0].advisorId,'DEMO-B');
 assert.equal(api.clientsFor(workspace,api.primaryProfileId).length,demo.length);
 const raw=api.persistWorkspace(workspace,loaded.raw);const reopened=api.loadWorkspace();
 assert.equal(reopened.raw,raw);assert.equal(reopened.workspace.activeProfileId,'DEMO-B');
 assert.deepEqual(api.clientsFor(reopened.workspace),api.clientsFor(workspace));
});

test('Editing a profile retains other profiles, client associations and a stored logo',()=>{
 const initial=api.loadWorkspace();let workspace=api.upsertAdvisor(initial.workspace,{...profileB(),logo:'data:image/png;base64,AA=='});
 const clients=structuredClone(workspace.clients),primary=structuredClone(workspace.profiles[0]);
 workspace=api.upsertAdvisor(workspace,{...workspace.profiles[1],phone:'Numero demo',vatNumber:'Partita IVA demo'});
 api.persistWorkspace(workspace,initial.raw);const result=api.loadWorkspace().workspace;
 assert.deepEqual(result.clients,clients);assert.deepEqual(result.profiles[0],primary);
 assert.equal(result.profiles[1].logo,'data:image/png;base64,AA==');assert.equal(result.profiles[1].phone,'Numero demo');
});

test('Profile selection never reassigns clients; report advisor follows the client',()=>{
 let workspace=api.upsertAdvisor(api.loadWorkspace().workspace,profileB());
 const clients=structuredClone(workspace.clients);
 assert.equal(api.reportContext(workspace,demo[0].id).advisor.id,api.primaryProfileId);
 workspace=api.selectAdvisor(workspace,api.primaryProfileId);assert.deepEqual(workspace.clients,clients);
 assert.throws(()=>api.selectAdvisor(workspace,'MISSING'));
});

test('An explicit client transfer preserves its data and all other clients',()=>{
 let workspace=api.upsertAdvisor(api.loadWorkspace().workspace,profileB());
 workspace=api.selectAdvisor(workspace,api.primaryProfileId);
 const original=structuredClone(workspace.clients);
 workspace=api.upsertClient(workspace,{...workspace.clients[0],advisorId:'DEMO-B'},workspace.clients[0].id);
 assert.equal(api.clientsFor(workspace).length,demo.length-1);assert.equal(api.clientsFor(workspace,'DEMO-B').length,1);
 assert.deepEqual(workspace.clients.slice(1),original.slice(1));
 assert.deepEqual({...workspace.clients[0],advisorId:api.primaryProfileId},original[0]);
 assert.throws(()=>api.upsertClient(workspace,workspace.clients[0],workspace.clients[0].id),/attivo/);
});

test('Quota failure during migration leaves legacy bytes and all client data untouched',()=>{
 const raw=JSON.stringify(demo);values.set(storageKey,raw);localStorage.setItem=()=>{throw Error('Quota exceeded');};
 const result=api.loadWorkspace();assert.notEqual(result.error,'');assert.equal(result.workspace,null);
 assert.equal(values.get(storageKey),raw);assert.equal(values.has(api.workspaceKey),false);
});

test('Corrupt old or new archives block migration instead of silently resetting data',()=>{
 values.set(storageKey,'corrupt legacy');assert.equal(api.loadWorkspace().workspace,null);
 assert.equal(values.get(storageKey),'corrupt legacy');assert.equal(values.has(api.workspaceKey),false);
 values.set(api.workspaceKey,'corrupt workspace');assert.equal(api.loadWorkspace().workspace,null);
 assert.equal(values.get(api.workspaceKey),'corrupt workspace');
});

test('Stale writes and edits from old app versions cannot overwrite newer archives',()=>{
 const initial=api.loadWorkspace();const next=api.upsertAdvisor(initial.workspace,profileB());
 api.persistWorkspace(next,initial.raw);
 assert.throws(()=>api.persistWorkspace(initial.workspace,initial.raw),/altra/);
 assert.equal(api.loadWorkspace().workspace.profiles.length,2);
 const loaded=api.loadWorkspace();values.set(storageKey,JSON.stringify([{...demo[0],name:'Modifica demo legacy'}]));
 assert.throws(()=>api.persistWorkspace(loaded.workspace,loaded.raw),/vecchio archivio/);
 assert.equal(api.loadWorkspace().raw,loaded.raw);
});

test('Invalid associations and external logo URLs cannot be persisted',()=>{
 const initial=api.loadWorkspace();
 assert.throws(()=>api.persistWorkspace({...initial.workspace,clients:[{...demo[0],advisorId:'UNKNOWN'}]},initial.raw));
 assert.throws(()=>api.upsertAdvisor(initial.workspace,{...profileB(),logo:'https://example.invalid/logo.png'}));
 assert.equal(api.loadWorkspace().raw,initial.raw);
});
