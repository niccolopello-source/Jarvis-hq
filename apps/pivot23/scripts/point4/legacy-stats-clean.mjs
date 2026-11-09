// Harness-only re-measure of src/lib/pivot/choices-depth-225.stats.test.ts (unchanged, frozen):
// same N=240, seeds 910000+i, roles[i%5], paths[i%3], difficulty pro, draft random, 2.25.0,
// same scores; ONLY the preview differs. Mode "legacy" reproduces the test's c.fx(structuredClone(s))
// on the job RNG; mode "clean" uses previewChoice (isolated RNG + live-state restore).
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync,mkdirSync} from 'node:fs';
import {previewChoice} from './policy-preview.mjs';
const [rootArg,outArg,mode]=process.argv.slice(2);
if(!rootArg||!outArg||!['legacy','clean'].includes(mode))throw Error('usage: legacy-stats-clean.mjs APP_ROOT OUT_DIR legacy|clean');
const load=p=>import(pathToFileURL(resolve(rootArg,p)).href);
const E=await load('src/lib/pivot/engine.ts'),R=await load('src/lib/pivot/rng.ts'),P=await load('src/lib/pivot/peak.ts');
const roles=['PG','SG','SF','PF','C'],paths=['NCAA','Europa','G-League'];
const fxOf=(s,c)=>mode==='clean'?previewChoice(s,c,R):c.fx(structuredClone(s));
const pol=(score,sign)=>(s,ev)=>{let best=0,bv=-Infinity;ev.choices.forEach((c,i)=>{const v=sign*score(fxOf(s,c),s);if(v>bv){bv=v;best=i;}});return best;};
const pulse=(fx,s)=>E.contextualPulse(structuredClone(s),fx),mood=fx=>Number(fx.morale??0);
function peaks(choose,N=240){const out=[];for(let i=0;i<N;i++){const job=E.openCareerSim({name:'M',role:roles[i%5],nationality:'ITA',number:23,path:paths[i%3],seed:910000+i,engineVersion:'2.25.0',difficulty:'pro',draft:'random',choose});for(let k=0;k<5000&&!E.advanceCareerSim(job);k++);out.push(Math.max(...job.s.seasonHistory.map(r=>P.displayOverall(r.overall))));}return out;}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
function ci(d){const m=mean(d),sd=Math.sqrt(d.reduce((x,y)=>x+(y-m)**2,0)/(d.length-1));const h=1.9699*sd/Math.sqrt(d.length);return [m-h,m+h];}
const res={mode,N:240,seeds:'910000+i',difficulty:'pro',engineVersion:'2.25.0'};
for(const [name,score,lo,hi] of [['bestWorst',pulse,1.2,3.5],['moraleUpDown',mood,0.5,2.5]]){
  const up=peaks(pol(score,1)),down=peaks(pol(score,-1)),d=up.map((x,i)=>x-down[i]);
  const gap=mean(up)-mean(down);
  res[name]={gap,ci95paired:ci(d),threshold:[lo,hi],withinThreshold:gap>=lo&&gap<=hi,meanUp:mean(up),meanDown:mean(down),pos:d.filter(x=>x>0).length,zero:d.filter(x=>x===0).length,neg:d.filter(x=>x<0).length};
  console.error(mode,name,gap.toFixed(3));
}
mkdirSync(outArg,{recursive:true});writeFileSync(resolve(outArg,`legacy-stats-${mode}.json`),JSON.stringify(res,null,2)+'\n');
console.log(JSON.stringify(res,null,2));
