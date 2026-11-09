// Point5 controlled experiment (harness only, src untouched): override TUNING.ovrCurve225 keys in memory
// (argv[2] JSON, {} = original) and measure CRITERIA A1-A3 on seed set SB plus the ovr-curve-225.stats gate seeds.
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const root=process.env.APP_ROOT??'.',SB=Number(process.env.SB)||970000,label=process.argv[3]??'';
const load=p=>import(pathToFileURL(resolve(root,p)).href);
const T=await load('src/lib/pivot/tuning.ts'),E=await load('src/lib/pivot/engine.ts'),P=await load('src/lib/pivot/peak.ts');
Object.assign(T.TUNING.ovrCurve225,JSON.parse(process.argv[2]??'{}'));
Date.now=()=>1794081600000;
const roles=['PG','SG','SF','PF','C'],diffs=['esordio','pro','allstar','leggenda'],paths=['NCAA','Europa','G-League'];
let barHits=0;
const res=[];
for(const path of paths)for(const difficulty of diffs)for(let i=0;i<100;i++){
  const seed=SB+i*101;const job=E.openCareerSim({name:'R',role:roles[i%5],path,difficulty,seed,nationality:'ITA',number:23,engineVersion:'2.25.0',draft:'random'});
  let k=0;while(k++<40&&!E.advanceCareerSim(job));const s=job.s,h=s.seasonHistory;
  // which rule closed it: re-read the final summer with the minutes bar only
  const last=h.at(-1),bar=(T.TUNING.ovrCurve225.lateMinutesBar[s.age]??11.5);
  const byBar=s.age>=33&&s.age<=36&&last&&last.min<=bar;if(byBar)barHits++;
  res.push({path,end:P.careerEndAge(s),peak:Math.max(...h.map(r=>P.displayOverall(r.overall))),endOvr:P.displayOverall(last.overall),byBar});}
const gate={};for(const path of paths){const ends=[];for(let i=0;i<450;i++){const job=E.openCareerSim({name:'M',role:roles[i%5],nationality:'ITA',number:23,path,seed:730000+i,engineVersion:'2.25.0',difficulty:diffs[i%4],draft:'random'});for(let k=0;k<5000&&!E.advanceCareerSim(job);k++);ends.push(P.careerEndAge(job.s));}ends.sort((a,b)=>a-b);gate[path]={med:ends[225],max:Math.max(...ends),r35:+(ends.filter(e=>e>=35).length/450).toFixed(3)};}
const n=res.length,sh=(xs,f)=>+(xs.filter(f).length/xs.length).toFixed(3);
const band=(lo,hi)=>sh(res.filter(r=>r.peak>=lo&&r.peak<=hi),r=>r.end>=35);
const med=xs=>{const e=xs.map(r=>r.end).sort((a,b)=>a-b),m=e.length>>1;return e.length%2?e[m]:(e[m-1]+e[m])/2;};
const cnt={};for(const r of res)cnt[r.end]=(cnt[r.end]??0)+1;const mode=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
const bands=[band(0,65),band(66,74),band(75,84),band(85,99)];
const out={label,SB,override:JSON.parse(process.argv[2]??'{}'),A1:sh(res,r=>r.end>=35&&r.endOvr<60),bands,A2gap:+(bands[3]-bands[0]).toFixed(3),
  med:med(res),medPath:Object.fromEntries(paths.map(p=>[p,med(res.filter(r=>r.path===p))])),le31:sh(res,r=>r.end<=31),at36:sh(res,r=>r.end===36),mode:[+mode[0],+(mode[1]/n).toFixed(3)],ge35:sh(res,r=>r.end>=35),finalSummerUnderBar:barHits,gate};
const ok=out.A1<=0.10&&out.A2gap>=0.15&&bands.every((b,i)=>i===0||b>=bands[i-1])&&out.med===34&&Object.values(out.medPath).every(m=>m===34)&&out.le31<=0.12&&out.at36<=0.15&&out.mode[1]<=0.35&&out.ge35>=0.28&&out.ge35<=0.38&&Object.values(gate).every(g=>g.med===34&&g.max<=36&&g.r35>=0.28&&g.r35<=0.38);
out.allCriteria=ok;console.log(JSON.stringify(out));
