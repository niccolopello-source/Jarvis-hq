/** Synthetic diagnostics; no storage or coefficient mutation. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {choosePolicy} from './policy-preview.mjs';
const [rootArg,outArg,modeArg]=process.argv.slice(2);
if(modeArg && modeArg!=="--policies-only")throw Error("unknown audit mode"); if(!rootArg||!outArg)throw Error('usage: causal-audit.mjs APP_ROOT OUT_DIR');
const root=resolve(rootArg),out=resolve(outArg); mkdirSync(out,{recursive:true});
const load=p=>import(pathToFileURL(resolve(root,p)).href);
const E=await load('src/lib/pivot/engine.ts'),R=await load('src/lib/pivot/rng.ts'),P=await load('src/lib/pivot/peak.ts'),L=await load('src/lib/pivot/legacy.ts');
Date.now=()=>1794081600000;
const policyProfiles=['best','worst','morale-up','morale-down'];
const profiles=modeArg==='--policies-only'?policyProfiles:['random',...policyProfiles,'star','role','low-initial-morale','high-initial-morale'];
const rows=[],sensitivity=[];

let index=0;
for(const role of ['PG','SG','SF','PF','C'])for(const path of ['NCAA','Europa','G-League'])for(const difficulty of ['esordio','pro','allstar','leggenda'])for(let replica=0;replica<2;replica++,index++){
const seed=940000+index*97;
for(const profile of profiles){
const job=E.openCareerSim({name:'Causal synthetic',role,path,difficulty,seed,nationality:'ITA',number:23,engineVersion:'2.25.0',draft:profile==='star'?'best':profile==='role'?'worst':'random',...(profile==='star'?{potential:97}:profile==='role'?{potential:66}:{}),...(['best','worst','morale-up','morale-down'].includes(profile)?{choose:choosePolicy(profile,E,R)}:{})});
job.s.careerId=`causal-${seed}`;
if(profile==='low-initial-morale')job.s.morale=10;
if(profile==='high-initial-morale')job.s.morale=100;
if(profile==='random')for(const morale of [10,55,100]){
const s=structuredClone(job.s),rng=R.createRng(seed);rng.setState(job.rng.getState());s.morale=morale;
const startRng=rng.getState(),beforeOverall=s.overall;const row=R.runWithRng(rng,()=>E.simulateRegularSeason(s,1));
sensitivity.push({seed,role,path,difficulty,morale,startRng,endRng:rng.getState(),beforeOverall,min:row.min,ppg:row.ppg,overall:s.overall,gp:row.gp});}
let done=false,steps=0;while(steps++<24){if(E.advanceCareerSim(job)){done=true;break;}}assert.ok(done,`${seed}/${profile} terminated`);
const s=job.s,h=s.seasonHistory;assert.ok(h.length>0);assert.ok(h.every(r=>Number.isFinite(r.overall)&&r.age<=36&&r.overall>=0&&r.overall<=99));assert.ok(Object.values(s.attrs).every(v=>Number.isFinite(v)&&v>=0&&v<=100));
rows.push({seed,role,path,difficulty,replica,profile,potential:s.potential,apex:s.apexAge,peak:Math.max(...h.map(r=>P.displayOverall(r.overall))),retirement:P.careerEndAge(s),roy:!!s.roy,mvp:s.mvpCount,hof:L.hofTier(s),finalRng:job.rng.getState(),seasons:h.map(r=>({age:r.age,ovr:r.overall,min:r.min,ppg:r.ppg,gp:r.gp})),choices:s.choiceLog.map(c=>({season:c.season,title:c.title,pick:c.pick}))});
}console.error(`completed ${index+1}/120`);}
const sha=s=>createHash('sha256').update(s).digest('hex');
for(const [name,data]of[['careers.json',rows],['sensitivity.json',sensitivity]])writeFileSync(resolve(out,name),JSON.stringify(data)+'\n');
writeFileSync(resolve(out,'run-manifest.json'),JSON.stringify({node:process.version,at:new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',dateStyle:'short',timeStyle:'long'}).format(new Date())+' Europe/Rome',root,profiles,seedFormula:'940000+index*97',careers:rows.length,singleSeasons:sensitivity.length,harnessSha256:sha(readFileSync(new URL(import.meta.url))),previewModuleSha256:sha(readFileSync(new URL('./policy-preview.mjs',import.meta.url))),mode:modeArg??'all',files:Object.fromEntries(['careers.json','sensitivity.json'].map(f=>[f,sha(readFileSync(resolve(out,f)))]))},null,2)+'\n');
