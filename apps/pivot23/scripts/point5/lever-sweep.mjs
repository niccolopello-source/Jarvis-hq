import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const root=process.env.APP_ROOT??'.'; // Harness only: overrides TUNING.ovrCurve225 in memory with argv[2] JSON; never edits src.
const load=p=>import(pathToFileURL(resolve(root,p)).href);
const T=await load('src/lib/pivot/tuning.ts');const E=await load('src/lib/pivot/engine.ts'),P=await load('src/lib/pivot/peak.ts');
Object.assign(T.TUNING.ovrCurve225,JSON.parse(process.argv[2]));
Date.now=()=>1794081600000;
const roles=['PG','SG','SF','PF','C'],diffs=['esordio','pro','allstar','leggenda'];
const res=[];
for(const path of ['NCAA','Europa','G-League'])for(const difficulty of diffs)for(let i=0;i<100;i++){const seed=(Number(process.env.SB)||970000)+i*101;const job=E.openCareerSim({name:'R',role:roles[i%5],path,difficulty,seed,nationality:'ITA',number:23,engineVersion:'2.25.0',draft:'random'});let k=0;while(k++<40&&!E.advanceCareerSim(job));const h=job.s.seasonHistory;res.push({end:P.careerEndAge(job.s),peak:Math.max(...h.map(r=>P.displayOverall(r.overall))),endOvr:P.displayOverall(h.at(-1).overall)});}
const gate={};for(const path of ['NCAA','Europa','G-League']){const ends=[];for(let i=0;i<450;i++){const job=E.openCareerSim({name:'M',role:roles[i%5],nationality:'ITA',number:23,path,seed:730000+i,engineVersion:'2.25.0',difficulty:diffs[i%4],draft:'random'});for(let k=0;k<5000&&!E.advanceCareerSim(job);k++);ends.push(P.careerEndAge(job.s));}ends.sort((a,b)=>a-b);gate[path]=[ends[225],+(ends.filter(e=>e>=35).length/450).toFixed(3)];}
const n=res.length,sh=f=>+(res.filter(f).length/n).toFixed(3);
const band=(lo,hi)=>{const b=res.filter(r=>r.peak>=lo&&r.peak<=hi);return +(b.filter(r=>r.end>=35).length/b.length).toFixed(3);};
const ends=res.map(r=>r.end).sort((a,b)=>a-b);
console.log(process.argv[2],JSON.stringify({A1:sh(r=>r.end>=35&&r.endOvr<60),bands:[band(0,65),band(66,74),band(75,84),band(85,99)],med:ends[n>>1],le31:sh(r=>r.end<=31),at36:sh(r=>r.end==36),ge35:sh(r=>r.end>=35),h33:sh(r=>r.end==33),h32:sh(r=>r.end==32),gate}));
