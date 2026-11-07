/** Synthetic cross156→copy gate. Run with node --import=tsx THIS TARGET_APP OUT.json.gz.
 * No string removal/normalization. Clock/UUID fixed at input; display differences kept separately.
 */
import {pathToFileURL} from 'node:url';import{resolve}from'node:path';import{existsSync,writeFileSync}from'node:fs';import{gzipSync}from'node:zlib';import{createHash}from'node:crypto';import{firstDiff}from'./json-diff.mjs';
const [target,out]=process.argv.slice(2);if(!target||!out)throw Error('TARGET_APP and OUT required');
Date.now=()=>1794081600000;let uuid=0;globalThis.crypto.randomUUID=()=>`00000000-0000-4000-8000-${String(++uuid).padStart(12,'0')}`;
const imp=f=>import(pathToFileURL(resolve(target,'src/lib/pivot',f)).href);
const e=await imp('engine.ts'),r=await imp('rng.ts'),save=await imp('save.ts'),n=await imp('narrative/index.ts');await n.loadNarrativeEn();
const copy=existsSync(resolve(target,'src/lib/pivot/copy-context.ts'))?await imp('copy-context.ts'):null;
const labels=await imp('legacy-i18n.ts');const clone=x=>JSON.parse(JSON.stringify(x));const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const cases=[...['NCAA','Europa','G-League'].map((path,i)=>({id:`natural-${path}`,path,seed:777001+i,role:['PG','SG','SF'][i]})),
 ...[{id:'negative-present',delta:-3,rival:true,age:21},{id:'zero-absent',delta:0,rival:false,age:21},{id:'fractional-negative',delta:-.25,rival:true,age:34},{id:'age-missing',delta:0,rival:false},{id:'legacy-archive-present',delta:1,rival:true,age:19},{id:'legacy-archive-absent',delta:-1,rival:false,age:20}].map((c,i)=>({...c,path:['NCAA','Europa','G-League'][i%3],seed:880010+i,role:['PF','C'][i%2],edge:true}))];
const rows=[],display=[];
for(const c of cases){
 const audit=[];const opts={seed:c.seed,name:'Cross copy synthetic',role:c.role,path:c.path,nationality:'Italia',difficulty:'pro',draft:'mixed',retirement:'retire',engineVersion:'2.24.0-beta',choose:(_p,ev,season)=>{const index=season%2?ev.choices.length-1:0;audit.push({season,eventId:ev.id,title:ev.title,index,pick:ev.choices[index].label??ev.choices[index].text??clone(ev.choices[index])});return index;}};
 const job=e.openCareerSim(opts);
 if(c.edge){if(!c.rival)delete job.s.rivalName;job.s.choiceLog=[{season:1,title:'In sala video, tre azioni di __RIVAL__, una tua',pick:'Chiedi le tue tre, dopo — __RIVAL__'}];
 if(c.rival)job.s.choiceLog.unshift({season:1,title:`Lo scontro con ${job.s.rivalName}`,pick:'Gioco di squadra'});
 job.s.devLog=[{season:1,label:'Estate di mobilità, già fatta',line:"Hai lavorato dove non si vede. A ottobre il passo è più lungo.",before:62,after:62+c.delta},{season:2,label:'La tregua del corpo, tenuta per intero',line:"Arrivare a ottobre intero: a quest'età è l'unico orgoglio che conta.",before:62,after:63}];}
 function checkpoint(stage,done=false){
  const log=audit.map((a,i)=>({id:String(i+1),kind:'story',title:a.title,chosen:typeof a.pick==='string'?a.pick:JSON.stringify(a.pick),resolved:true}));
  const archive=clone(e.toArchive(job.s));if(c.id.startsWith('legacy-archive')){delete archive.card;delete archive.fingerprint;delete archive.archiveSchema;} // legacy INPUT, not comparison filtering
  const canonical=()=>({player:clone(job.s),envelope:save.buildLiveSave(job.s,null,log,'career','career',log.length+1),n:job.n,opts:{...opts,choose:'alternating first/last; callback recorded in audit'},choiceAudit:clone(audit),log:clone(log),archive:clone(archive),activeRng:job.rng.getState(),savedRng:job.s.rngState??null,fallbackDraws:r.fallbackDraws(),rawEnding:done?e.verdictOf(job.s):null});
  const before=canonical();const rendered={};r.runWithRng(job.rng,()=>{if(r.currentRng()!==job.rng)throw Error('active RNG missing');
   for(const lang of ['it','en']){const ctx=copy?.contextualText??((t,l)=>n.nx(t,l));const rival=copy?.archivedRival(archive.choices);
    rendered[lang]={titlesAndPicks:job.s.choiceLog.map(v=>({title:ctx(v.title,lang,{rivalName:job.s.rivalName}),pick:ctx(v.pick,lang,{rivalName:job.s.rivalName})})),
     development:job.s.devLog.map(v=>copy?copy.developmentText(v,lang,c.edge?c.age:job.s.seasonHistory.find(h=>h.season===v.season)?.age):n.nx(v.line,lang)),
     archivedTitlesAndPicks:archive.choices.map(v=>({title:ctx(v.title,lang,{rivalName:rival}),pick:ctx(v.pick,lang,{rivalName:rival})})),
     awards:job.s.milestones.map(v=>labels.legacyAwardLabel(v.label,lang)),ending:done?n.nx(e.verdictOf(job.s).closing,lang):null};}
  });const after=canonical();const mismatch=firstDiff(before,after);if(mismatch)throw Error(`${c.id}/${stage}: render mutated ${mismatch}`);
  rows.push({id:c.id,stage,canonical:after,fullCanonicalSha256:hash(after)});display.push({id:c.id,stage,rendered});
 }
 checkpoint('input');let done=false,step=0;while(!done){done=e.advanceCareerSim(job);checkpoint(`step-${++step}`,done);if(step>30)throw Error('loop guard');}
}
writeFileSync(out,gzipSync(JSON.stringify({clock:1794081600000,uuidInput:'fixed deterministic sequence',normalization:'NONE; all canonical persisted strings/count/order/state/envelope/checksum/RNG retained',cases,rows,display}),{mtime:0}));
console.log(JSON.stringify({cases:cases.length,checkpoints:rows.length,finals:rows.filter(x=>x.stage===rows.filter(y=>y.id===x.id).at(-1)?.stage).length,allRenderImmutable:true,out}));
