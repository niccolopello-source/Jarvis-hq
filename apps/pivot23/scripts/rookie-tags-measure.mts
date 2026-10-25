const root = process.argv[2];
const { openCareerSim, advanceCareerSim } = await import(root + "/apps/pivot23/src/lib/pivot/engine.ts");
const IDS=["rk1","rk5","rk8","rk10"]; const N=250;
for (const v of ["2.22.0-beta","2.23.0-beta"]) for (const d of ["esordio","pro","allstar","leggenda"]) {
  const c:Record<string,number>={rk1:0,rk5:0,rk8:0,rk10:0}; let any=0;
  for (let seed=5001; seed<5001+N; seed++){
    const job=openCareerSim({name:"Rk",role:["PG","SG","SF","PF","C"][seed%5],nationality:"ITA",number:23,difficulty:d,path:["NCAA","Europa","G-League"][seed%3],seed,draft:"random"});
    job.s.engineVersion=v; let k=0; while(!advanceCareerSim(job) && k++<5000);
    const u:string[]=job.s.usedEventIds; let a=false; for(const id of IDS) if(u.includes(id)){c[id]++;a=true;} if(a)any++;
  }
  console.log([v,d,...IDS.map(i=>`${i}=${c[i]}`),`almenoUno=${any}/${N}`].join("\t"));
}
