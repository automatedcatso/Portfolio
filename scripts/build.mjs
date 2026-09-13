import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const name of ['index.html','styles.css','app.js','favicon.svg','LICENSE','.nojekyll','robots.txt','assets']){
  const src=path.join(root,name); if(!existsSync(src)) continue;
  await cp(src,path.join(dist,name),{recursive:true});
}
console.log('Built static portfolio → dist/');
