/** Probe P1: rebuilds each picked event with storyEventById and compares it (seeds 7000+i*31, Pro). */
import { openCareerSim, advanceCareerSim, pickStoryEvent, storyEventById } from "../src/lib/pivot/engine.ts";
const diff: Record<string,[number,number]> = {}; const ex: string[] = [];
for (let i=0;i<300;i++){ const job=openCareerSim({seed:7000+i*31,difficulty:"pro"}); 
 while(!advanceCareerSim(job)) { const s=structuredClone(job.s); if (s.seasonHistory.length===0) continue;
   s.season=job.n; const ev=pickStoryEvent(s,job.n); const k=ev.id.replace(/-\d.*$/,"");
   const re=storyEventById(structuredClone(s),ev.id);
   const same = re.title===ev.title && re.subtitle===ev.subtitle && re.choices.map(c=>c.label).join()===ev.choices.map(c=>c.label).join();
   diff[k] ??= [0,0]; diff[k][same?0:1]++; if(!same && ex.length<4) ex.push(`${ev.id}: "${ev.title}" -> "${re.title}" | ${ev.choices.map(c=>c.label)} -> ${re.choices.map(c=>c.label)}`);
 }}
console.log(diff, ex);
