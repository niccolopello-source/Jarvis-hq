const { openCareerSim, advanceCareerSim } = await import("../src/lib/pivot/engine.ts");
const { TUNING } = await import("../src/lib/pivot/tuning.ts");
if (process.env.TUNE) Object.assign(TUNING.statsOvr, JSON.parse(process.env.TUNE));
const d = process.env.D || "pro"; const eng = process.env.ENGINE;
const by: Record<number, number[]> = {}; const pots: number[] = []; const peaks:number[]=[]; const pa:number[]=[]; const end:number[]=[];
for (let i = 0; i < 300; i++) {
  const job = openCareerSim({ role: ["PG","SG","SF","PF","C"][i%5] as any, nationality: "ITA", difficulty: d as any, path: (["NCAA","Europa","G-League"] as any)[i%3], seed: 910000 + i, draft: "random", ...(eng?{engineVersion:eng}:{}) });
  for (let k = 0; k < 5000 && !advanceCareerSim(job); k++);
  let b=-1,ba=0; for (const r of job.s.seasonHistory) { (by[r.age] ??= []).push(r.overall); if(r.overall>b){b=r.overall;ba=r.age;} }
  pots.push(job.s.potential); peaks.push(b); pa.push(ba); end.push(job.s.age);
}
const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log("pot", med(pots), "peak", med(peaks), "peakAge", med(pa), "end", med(end), "e29-32", end.filter(a=>a>=29&&a<=32).length/300);
console.log(Object.entries(by).map(([a, v]) => `${a}:${med(v)}(${v.length})`).join(" "));
