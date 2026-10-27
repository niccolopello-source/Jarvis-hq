import { writeFileSync } from "node:fs";
import { advanceCareerSim, openCareerSim } from "../src/lib/pivot/engine";
import { careerEndAge, displayOverall } from "../src/lib/pivot/peak";
const [out, N="250", ENG="2.23.0-beta", base0="730000"] = process.argv.slice(2);
const roles = ["PG","SG","SF","PF","C"] as const, paths = ["NCAA","Europa","G-League"] as const;
const lines = ["cohort,diff,path,seed,age,ovr,min,ppg,per,awards,endAge"];
const cohorts: [string, Record<string, unknown>][] = [];
for (const d of ["esordio","pro","allstar","leggenda"]) cohorts.push([`rand`, { difficulty:d, draft:"random" }]);
for (const d of ["pro"]) { cohorts.push(["strong",{difficulty:d,draft:"best",potential:97}]); cohorts.push(["weak",{difficulty:d,draft:"worst",potential:66}]); }
for (const [c,o] of cohorts) for (let i=0;i<+N;i++){
  const seed=+base0+i; const path=paths[i%3];
  const job=openCareerSim({name:"M",role:roles[i%5],nationality:"ITA",number:23,path,seed,engineVersion:ENG,...o});
  for(let k=0;k<5000&&!advanceCareerSim(job);k++);
  const end=careerEndAge(job.s);
  for(const r of job.s.seasonHistory) lines.push([c,o.difficulty,path,seed,r.age,displayOverall(r.overall),r.min,r.ppg,r.per,(r.awards||[]).join("|").replace(/,/g,";"),end].join(","));
}
writeFileSync(out, lines.join("\n")); console.log("rows", lines.length-1);
