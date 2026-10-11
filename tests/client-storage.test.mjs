import {test, beforeEach, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

// Run the actual TypeScript storage functions with a browser storage substitute.
const temporary = mkdtempSync(join(tmpdir(), 'energy-client-tests-'));
writeFileSync(join(temporary, 'package.json'), '{"type":"module"}');
for (const name of ['clientSchema', 'data']) {
  const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText.replace("'./clientSchema'", "'./clientSchema.js'");
  writeFileSync(join(temporary, `${name}.js`), compiled);
}
const {readClients, persistClients, electricityValue, storageKey, demo} = await import(pathToFileURL(join(temporary, 'data.js')));
let values;
beforeEach(() => {
  values = new Map();
  globalThis.localStorage = {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key,value)};
});
after(() => {rmSync(temporary, {recursive:true, force:true}); delete globalThis.localStorage;});

test('Legacy clients and unrelated project information survive a complete-sheet edit and reload', () => {
  const legacy = structuredClone(demo);
  legacy[0].customProjectField = 'demo extra';
  const raw = JSON.stringify(legacy);
  values.set(storageKey,raw);
  const archive = readClients();
  assert.equal(archive.error,'');
  assert.equal(values.get(storageKey),raw); // Reading does not migrate or overwrite.
  const details = {electricityKwh:'5100',electricitySource:'Effettivo',electricityCost:'1200.50',electricityCostSource:'Stimata',gasSmc:'800',gasSource:'Stimato',goals:'Obiettivo dimostrativo'};
  const edited = {...archive.clients[0],kwh:5100,details};
  const next = archive.clients.map(client => client.id===edited.id ? edited : client);
  persistClients(next,archive.raw);
  const reopened = readClients();
  assert.equal(reopened.clients.length,legacy.length);
  assert.deepEqual(reopened.clients[0].details,details);
  assert.equal(reopened.clients[0].customProjectField,'demo extra');
  assert.deepEqual(reopened.clients.slice(1),legacy.slice(1));
});

test('Blank consumption and explicit zero are distinct; legacy zero remains unknown', () => {
  assert.equal(electricityValue({...demo[0],kwh:0}),null);
  assert.equal(electricityValue({...demo[0],details:{electricityKwh:''}}),null);
  assert.equal(electricityValue({...demo[0],details:{electricityKwh:'0'}}),0);
  assert.equal(electricityValue(demo[0]),4800);
});

test('A client can be stored with all personal and technical information unknown', () => {
  const client = {id:'DEMO-OPTIONAL',name:'',city:'',system:'Da dimensionare',status:'In analisi',kwh:0,cost:0,details:{electricityKwh:''}};
  persistClients([client],null);
  assert.equal(readClients().error,'');
  assert.deepEqual(readClients().clients,[client]);
});

test('Repeated edits and a new client preserve all previously saved clients', () => {
  values.set(storageKey,JSON.stringify(demo));
  let archive = readClients();
  persistClients([{...demo[0],id:'DEMO-NEW',name:'Cliente fittizio'},...archive.clients],archive.raw);
  archive = readClients();
  const edited = archive.clients.map(client => client.id==='DEMO-NEW' ? {...client,details:{advisorNotes:'Nota di test'}} : client);
  persistClients(edited,archive.raw);
  const result = readClients();
  assert.equal(result.clients.length,demo.length+1);
  assert.deepEqual(result.clients.slice(1),demo);
});

test('Malformed or incompatible storage is not replaced with demo records', () => {
  for (const raw of ['invalid JSON',JSON.stringify([{id:'incomplete'}])]) {
    values.set(storageKey,raw);
    const archive = readClients();
    assert.notEqual(archive.error,'');
    assert.deepEqual(archive.clients,[]);
    assert.equal(values.get(storageKey),raw);
  }
});

test('A stale tab cannot silently overwrite the latest client archive', () => {
  const archive = readClients();
  values.set(storageKey,JSON.stringify(demo));
  assert.throws(() => persistClients([],archive.raw),/altra/);
  assert.deepEqual(readClients().clients,demo);
});

test('Storage failures leave the previous archive unchanged', () => {
  const raw=JSON.stringify(demo);
  values.set(storageKey,raw);
  localStorage.setItem=()=>{throw new Error('Quota exceeded');};
  assert.throws(()=>persistClients([],raw),/Quota/);
  assert.equal(values.get(storageKey),raw);
});
