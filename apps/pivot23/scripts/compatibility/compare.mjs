/** Compare full JSON snapshots, including RNG and envelope; never normalize gameplay. */
import { createReadStream, writeFileSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { createHash } from "node:crypto";
const [main,draft,prefix] = process.argv.slice(2);
if (!main || !draft || !prefix) throw new Error("usage: compare.mjs MAIN.jsonl.gz DRAFT.jsonl.gz OUT_PREFIX");
function lines(p) { return createInterface({input:createReadStream(p).pipe(createGunzip()),crlfDelay:Infinity})[Symbol.asyncIterator](); }
import { firstDiff } from "./json-diff.mjs";
const hash=(v)=>createHash("sha256").update(JSON.stringify(v)).digest("hex");
const a=lines(main),b=lines(draft), rows=[], mismatches=[], resume=[], diagnostics=[];
const perVersion={}; const coverage={paths:new Set(),roles:new Set(),difficulties:new Set(),seeds:new Set(),careers:new Set(),ages:new Set(),injuryDragPositiveCheckpoints:0,playoffs:0,retirement36:0};
let total=0;
while(true) {
 const [aa,bb]=await Promise.all([a.next(),b.next()]);
 if(aa.done || bb.done) { if(aa.done!==bb.done) throw new Error("snapshot length differs"); break; }
 const left=JSON.parse(aa.value),right=JSON.parse(bb.value);if(left.id!==right.id)throw new Error(`checkpoint order mismatch ${left.id} vs ${right.id}`);
 const d=firstDiff(left.value,right.value);total++;
 const row={id:left.id,status:d?"FAIL":"PASS",firstMismatch:d,main:hash(left.value),draft:hash(right.value)};rows.push(row);
 if(d && mismatches.length<10)mismatches.push({id:left.id,path:d,main:left.value,draft:right.value});
 const ver=left.id.split("/")[0]; if(ver.startsWith("2.")){perVersion[ver]??={checkpoints:0,pass:0,fail:0};perVersion[ver].checkpoints++;perVersion[ver][d?"fail":"pass"]++;}
 if(left.value.uninterrupted) {
   for(const [revision,v] of [["main",left.value],["draft",right.value]]) {
     const full=firstDiff(v.uninterrupted,v.resumed);
     // Additional comparison of the actual persisted envelope is explicit, not a replacement for the full comparison.
     const persisted=firstDiff(v.uninterrupted.envelope,v.resumed.envelope);
     const rng=firstDiff(v.uninterrupted.rng,v.resumed.rng);
     resume.push({id:left.id,revision,fullStatus:full?"FAIL":"PASS",firstMismatch:full,persistedStatus:persisted?"FAIL":"PASS",persistedMismatch:persisted,rngStatus:rng?"FAIL":"PASS"});
   }
   const p=left.value.uninterrupted.player;
   coverage.paths.add(p.originPath);coverage.roles.add(p.role);coverage.difficulties.add(p.difficulty);coverage.seeds.add(p.seed);coverage.ages.add(p.age);coverage.careers.add(`${ver}/${p.seed}`);
   if(p.injuryDrag>0)coverage.injuryDragPositiveCheckpoints++;
   if(p.playoff)coverage.playoffs++;
   if(p.age===36)coverage.retirement36++;
 } else if(left.id.startsWith("engine-version/") || left.id.startsWith("recovery/") || left.id==="missing-rng") diagnostics.push({id:left.id,main:left.value,draft:right.value});
}
const summary={fullCrossRevision:{checkpoints:total,pass:rows.filter(r=>r.status==="PASS").length,fail:rows.filter(r=>r.status==="FAIL").length},perVersion,coverage:Object.fromEntries(Object.entries(coverage).map(([k,v])=>[k,v instanceof Set?[...v]:v])),resume:{checks:resume.length,fullPass:resume.filter(r=>r.fullStatus==="PASS").length,fullFail:resume.filter(r=>r.fullStatus==="FAIL").length,persistedFail:resume.filter(r=>r.persistedStatus==="FAIL").length,rngFail:resume.filter(r=>r.rngStatus==="FAIL").length},diagnostics};
writeFileSync(`${prefix}-summary.json`,JSON.stringify(summary,null,2));
writeFileSync(`${prefix}-checkpoints.jsonl`,rows.map(r=>JSON.stringify(r)).join("\n")+"\n");
writeFileSync(`${prefix}-resume.jsonl`,resume.map(r=>JSON.stringify(r)).join("\n")+"\n");
writeFileSync(`${prefix}-mismatches.json`,JSON.stringify(mismatches,null,2));
console.log(JSON.stringify({...summary,diagnostics:undefined},null,2));
if(summary.fullCrossRevision.fail)process.exitCode=1;
