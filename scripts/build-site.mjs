import { mkdir, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive:true, force:true });
await mkdir('dist');
for (const path of ['index.html','styles.css','script.js','portal.css','assets','titles','careers','team','js','CNAME']) await cp(path,`dist/${path}`,{recursive:true});
console.log('Static site prepared in dist/.');
