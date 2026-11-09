// Mirrors src/lib/pivot/ovr-curve-225.stats.test.ts retirement shape (N450/path, seeds 730000+i) to read margins.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const [root]=process.argv.slice(2);
const load=p=>import(pathToFileURL(resolve(root,p)).href);
const E=await load('src/lib/pivot/engine.ts'),P=await load('src/lib/pivot/peak.ts');
const roles=['PG','SG','SF','PF','C'],diffs=['esordio','pro','allstar','leggenda'],N=450,out={};
for(const path of ['NCAA','Europa','G-League']){const ends=[];for(let i=0;i<N;i++){const job=E.openCareerSim({name:'M',role:roles[i%5],nationality:'ITA',number:23,path,seed:730000+i,engineVersion:'2.25.0',difficulty:diffs[i%4],draft:'random'});for(let k=0;k<5000&&!E.advanceCareerSim(job);k++);ends.push(P.careerEndAge(job.s));}
ends.sort((a,b)=>a-b);out[path]={median:ends[Math.floor(N/2)],max:Math.max(...ends),r35:ends.filter(e=>e>=35).length/N};}
console.log(JSON.stringify(out));
