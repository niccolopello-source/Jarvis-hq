// Point5 retirement measurement (harness only). Usage: measure.mjs APP_ROOT OUT.json VERSION N [seedBase]
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const [root,out,V,Narg,baseArg]=process.argv.slice(2);
const N=Number(Narg),base=Number(baseArg??970000);
const load=p=>import(pathToFileURL(resolve(root,p)).href);
const E=await load('src/lib/pivot/engine.ts'),P=await load('src/lib/pivot/peak.ts');
Date.now=()=>1794081600000;
const roles=['PG','SG','SF','PF','C'],rows=[];
for(const path of ['NCAA','Europa','G-League'])for(const difficulty of ['esordio','pro','allstar','leggenda'])for(let i=0;i<N;i++){
  const seed=base+i*101;
  const job=E.openCareerSim({name:'Retire synthetic',role:roles[i%5],path,difficulty,seed,nationality:'ITA',number:23,engineVersion:V,draft:'random'});
  job.s.careerId=`ret-${seed}`;
  let steps=0;while(steps++<40&&!E.advanceCareerSim(job));
  const s=job.s,h=s.seasonHistory,last=h.at(-1);
  const peak=Math.max(...h.map(r=>P.displayOverall(r.overall)));
  const sig=P.careerEndingSignal(s);
  rows.push({seed,path,difficulty,role:roles[i%5],end:P.careerEndAge(s),peak,peakAge:h.find(r=>P.displayOverall(r.overall)===peak)?.age,endOvr:P.displayOverall(last.overall),lastMin:last.min,lastPpg:last.ppg,signal:sig,seasons:h.length,extra:!!s.extraSeason,allStar:s.allStarCount??0,mvp:s.mvpCount??0,titles:s.titleCount??0,ovrAt:Object.fromEntries(h.map(r=>[r.age,P.displayOverall(r.overall)])),minAt:Object.fromEntries(h.map(r=>[r.age,r.min])),finalRng:job.rng.getState()});
}
writeFileSync(out,JSON.stringify(rows)+'\n');console.error('done',rows.length);
