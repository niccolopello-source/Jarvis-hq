/** Read two existing worktrees; never fetch, checkout, or modify either source tree. */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const [baselineArg,outArg,pr152Arg] = process.argv.slice(2);
if (!baselineArg || !outArg) throw new Error("usage: node scripts/compatibility/run.mjs BASELINE_APP_ROOT OUT_DIR [PR152_APP_ROOT]");
const here=dirname(fileURLToPath(import.meta.url));
const draft=resolve(here,"../.."),baseline=resolve(baselineArg),out=resolve(outArg);
mkdirSync(out,{recursive:true});
function command(bin,args,cwd) { const r=spawnSync(bin,args,{cwd,encoding:"utf8",maxBuffer:8*1024*1024}); if(r.status!==0)throw new Error(`${bin} exited ${r.status}: ${r.stderr || r.stdout}`);return r.stdout.trim(); }
if(command("git",["status","--porcelain"],baseline))throw new Error("baseline must have a clean worktree");
const mainSha=command("git",["rev-parse","HEAD"],baseline);
if(mainSha!=="33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f")throw new Error("baseline must be pinned main 33810f7");
command("git",["merge-base","--is-ancestor","3393f524fd32c3f1b9a42a9341e7c9295ba54a03","HEAD"],draft);
const manifest={baseline:mainSha,draft:command("git",["rev-parse","HEAD"],draft),draftWorkingChanges:command("git",["status","--short"],draft),node:process.version,startedEuropeRome:new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Rome",dateStyle:"short",timeStyle:"long"}).format(new Date())+" Europe/Rome",versions:Array.from({length:13},(_,i)=>`2.${12+i}.0-beta`),scenariosPerVersion:24,seedFormula:"61200 + index*97; index order: paths NCAA/Europa/G-League, difficulties esordio/pro/allstar/leggenda, policy first/last",normalization:"none; fixed synthetic careerId before checksums, fixed Date.now input; JSON serialization boundary, all JSON fields retained"};
manifest.probeSha256=Object.fromEntries(["worker.ts","phases-worker.ts","compare.mjs","json-diff.mjs"].map(p=>[p,createHash("sha256").update(readFileSync(resolve(here,p))).digest("hex")]));
manifest.runtimeDiffFrom153=command("git",["diff","--name-only","3393f524fd32c3f1b9a42a9341e7c9295ba54a03","--","src"],draft);
const targets=[["main",baseline],["draft",draft]];
if(pr152Arg){const pr152=resolve(pr152Arg);if(command("git",["status","--porcelain"],pr152))throw new Error("PR152 must have a clean worktree");const sha=command("git",["rev-parse","HEAD"],pr152);if(sha!=="490bc861f44a48d9b22cdf1aec63bf8c30ec0705")throw new Error("PR152 must be pinned at 490bc86");manifest.pr152=sha;targets.push(["pr152",pr152]);}
writeFileSync(resolve(out,"manifest.json"),JSON.stringify(manifest,null,2));
for(const [name,root] of targets) {
 console.log(`Running ${name}`);
 command(process.execPath,["--import=tsx",resolve(here,"worker.ts"),root,resolve(out,`${name}.jsonl.gz`)],root);
 command(process.execPath,["--import=tsx",resolve(here,"phases-worker.ts"),root,resolve(out,`${name}-phases.jsonl.gz`)],root);
}
for(const [name] of targets.filter(([name])=>name!=="main"))for(const suffix of ["","-phases"]) {
 console.log(command(process.execPath,[resolve(here,"compare.mjs"),resolve(out,`main${suffix}.jsonl.gz`),resolve(out,`${name}${suffix}.jsonl.gz`),resolve(out,`comparison-${name}${suffix}`)],draft));
}
