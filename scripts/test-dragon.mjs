// Real procedural mesh: anatomy, finite coordinates and deterministic topology.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const sandbox=vm.createContext({});
vm.runInContext(readFileSync('assets/ui/dragon-sculpture.js','utf8'),sandbox);
const mesh=sandbox.DragonGeometry(),repeat=sandbox.DragonGeometry();
assert.deepEqual([...mesh.faces],[...repeat.faces]);
assert.equal(mesh.faces.length%12,0);
assert.ok(mesh.faces.length>10000&&mesh.edges.length>1000);
for(const part of ['wings','horns','tail','head','claws','teeth'])assert.ok(mesh.parts[part]>0,part);
for(const coordinate of mesh.faces)assert.ok(Number.isFinite(coordinate));
for(const edge of mesh.edges)for(const p of [edge.a,edge.b]){
  assert.equal(p.length,3);
  for(const n of p)assert.ok(Number.isFinite(n)&&Math.abs(n)<3);
}
const html=readFileSync('index.html','utf8');
assert.ok(html.indexOf('dragon-sculpture.js')<html.indexOf('assets/ui/ambience.js'));
console.log('Dragon mesh passed: deterministic anatomy, finite geometry and renderer load order.');
