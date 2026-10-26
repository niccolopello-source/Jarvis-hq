const root = process.argv[2];
const { openCareerSim, advanceCareerSim } = await import(root + "/apps/pivot23/src/lib/pivot/engine.ts");
import { createHash } from "node:crypto"; import { readFileSync } from "node:fs";
const MAP: [string,string][] = process.env.MAP ? JSON.parse(readFileSync(process.env.MAP,"utf8")).map((r: [string, string])=>[JSON.stringify(r[0]).slice(1,-1),JSON.stringify(r[1]).slice(1,-1)]) : [];
const norm=(t:string)=>MAP.reduce((a,[o,w])=>a.split(o).join(w),t);
const all = createHash("sha256"); let n=0;
for (const v of ["2.20.0-beta","2.21.0-beta","2.22.0-beta"])
 for (const d of ["esordio","pro","allstar","leggenda"])
  for (let seed=1; seed<=100; seed++){
   const job=openCareerSim({name:"Fp",role:["PG","SG","SF","PF","C"][seed%5],nationality:"ITA",number:23,difficulty:d,path:["NCAA","Europa","G-League"][seed%3],seed,draft:"random",engineVersion:v});
   job.s.engineVersion=v; let k=0; while(!advanceCareerSim(job) && k++<5000);
   all.update(norm(JSON.stringify({...job.s,careerId:0}))); n++;
  }
console.log(n, "careers", all.digest("hex"));
