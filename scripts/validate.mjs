import {readFile,readdir,stat} from 'node:fs/promises';import path from 'node:path';
const html=await readFile('index.html','utf8');
const refs=[...html.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)].map(m=>m[1]);
let missing=[];for(const ref of refs){try{await stat(ref)}catch{missing.push(ref)}}
if(missing.length){console.error('Missing local assets:',[...new Set(missing)]);process.exit(1)}
for(const forbidden of ['CODEBASE INDEX //','build-topology.svg','visual-scan']){if(html.includes(forbidden)){console.error(`Forbidden legacy UI token remains: ${forbidden}`);process.exit(1)}}
console.log(`Validated ${new Set(refs).size} referenced assets; no retired scanner/index UI remains.`);
