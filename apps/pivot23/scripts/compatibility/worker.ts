/** Synthetic cross-revision probe. No browser storage or user data is accessed. */
import assert from "node:assert/strict";
import { createWriteStream } from "node:fs";
import { once } from "node:events";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createGzip } from "node:zlib";
import type { PlayerState, SavedPending, Role, DifficultyId } from "../../src/lib/pivot/types.ts";
import type { CareerSimJob, SimOpts } from "../../src/lib/pivot/engine.ts";
const [root, out] = process.argv.slice(2);
if (!root || !out) throw new Error("usage: worker.ts APP_ROOT OUT.jsonl.gz");
const url = (p: string) => pathToFileURL(resolve(root, p)).href;
const E: typeof import("../../src/lib/pivot/engine.ts") = await import(url("src/lib/pivot/engine.ts"));
const S: typeof import("../../src/lib/pivot/save.ts") = await import(url("src/lib/pivot/save.ts"));
const R: typeof import("../../src/lib/pivot/rng.ts") = await import(url("src/lib/pivot/rng.ts"));
const T: typeof import("../../src/lib/pivot/tuning.ts") = await import(url("src/lib/pivot/tuning.ts"));
class Mem implements Storage {
  values = new Map<string,string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(k: string) { return this.values.get(k) ?? null; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  removeItem(k: string) { this.values.delete(k); }
  setItem(k: string,v: string) { this.values.set(k,String(v)); }
}
const local = new Mem(), session = new Mem();
Object.defineProperty(globalThis,"localStorage",{configurable:true,value:local});
Object.defineProperty(globalThis,"sessionStorage",{configurable:true,value:session});
// Inputs are fixed before any save/checksum is made; no state field is omitted in comparison.
Date.now = () => 1794081600000;
const gzip = createGzip(); const dest = createWriteStream(out); gzip.pipe(dest);
async function emit(id: string, value: unknown) {
  if (!gzip.write(JSON.stringify({id,value})+"\n")) await once(gzip,"drain");
}
function reset() { S.clearLive(); local.clear(); session.clear(); E.resetArchiveMemory(); }
const versions = Array.from({length:13},(_,i)=>`2.${12+i}.0-beta`);
function rngState(s: PlayerState, rng: ReturnType<typeof R.createRng>) { s.rngState = rng.getState(); }
function envelope(s: PlayerState, pending: SavedPending | null = null, screen: "draft" | "career" = "career") {
  return S.buildLiveSave(s,pending,[],screen,"log",1);
}
function reload(s: PlayerState,pending: SavedPending | null = null,screen: "draft" | "career" = "career") {
  reset();
  const saved = S.saveLive({player:s,pending,log:[],screen,tab:"log",logSeq:1});
  assert.equal(saved,true);
  const before = local.getItem(S.SAVE_KEY);
  const loaded = S.loadLive(); assert.ok(loaded);
  assert.equal(local.getItem(S.SAVE_KEY),before,"read must not rewrite primary bytes");
  assert.equal(loaded.player.engineVersion,s.engineVersion);
  assert.equal(loaded.player.rngState,s.rngState);
  return loaded;
}
for (const version of versions) {
  // 3 paths x 4 difficulties x 2 explicit choice policies = 24 per version.
  let index = 0;
  for (const path of ["NCAA","Europa","G-League"] as const) for (const difficulty of ["esordio","pro","allstar","leggenda"] as DifficultyId[]) for (const policy of ["first","last"] as const) {
    const seed = 61200 + index*97;
    const role = (["PG","SG","SF","PF","C"] as Role[])[index%5]!;
    const opts: SimOpts = {seed,role,path,difficulty,name:"Compat Synthetic",nationality:"Italia",number:23,engineVersion:version,draft:index%2?"mixed":"random",trade:index%2?"refuse":"accept",retirement:index%2?"retire":"play36",choose:(_s,ev)=>policy==="first"?0:ev.choices.length-1};
    const a = E.openCareerSim(opts), b = E.openCareerSim({...opts});
    const id = `${version}/seed=${seed}/${path}/${difficulty}/${role}/${policy}`;
    a.s.careerId = b.s.careerId = `synthetic-${version}-${seed}`;
    assert.notEqual(a.s,b.s); assert.notEqual(a.rng,b.rng);
    for (let step=0;step<24;step++) {
      rngState(a.s,a.rng); rngState(b.s,b.rng);
      const snap = (job: CareerSimJob) => ({n:job.n,rng:job.rng.getState(),player:job.s,envelope:envelope(job.s)});
      await emit(`${id}/step=${step}`,{uninterrupted:snap(a),resumed:snap(b)});
      const doneA = E.advanceCareerSim(a), doneB = E.advanceCareerSim(b);
      assert.equal(doneA,doneB,"resume must finish on same step (not full equality claim)");
      if (doneA) {
        rngState(a.s,a.rng); rngState(b.s,b.rng);
        await emit(`${id}/final`,{uninterrupted:snap(a),resumed:snap(b)});
        break;
      }
      // Cold storage roundtrip each season, not cloning the uninterrupted object.
      rngState(b.s,b.rng);
      const loaded = reload(b.s);
      b.s = loaded.player;
      b.rng = R.createRng(seed); b.rng.setState(b.s.rngState!);
      if (step===23) throw new Error("bounded campaign did not terminate");
    }
    index++;
  }
  // Engine-level phase fixtures. These are not UI hydratePending/e2e tests.
  for (const seed of [71101,71198]) {
    reset(); const rng = R.createRng(seed);
    let s = R.runWithRng(rng,()=>E.freshPlayer("Phase Synthetic","PG","Italia",23,"pro",seed,version));
    s.careerId = `phase-${version}-${seed}`;
    async function phase(label: string,pending: SavedPending | null, screen: "draft"|"career"="career") {
      rngState(s,rng);
      const before = {player:s,envelope:envelope(s,pending,screen),rng:rng.getState()};
      // Capture before by JSON, so later mutations cannot rewrite prior evidence.
      await emit(`${version}/phase/${seed}/${label}/before`,before);
      const loaded = reload(s,pending,screen);
      await emit(`${version}/phase/${seed}/${label}/loaded`,{player:loaded.player,envelope:loaded,rng:loaded.player.rngState});
      s = loaded.player; rng.setState(s.rngState!);
    }
    const rounds=E.allDraftRounds();
    for(let i=0;i<rounds.length;i++) { await phase(`draft-${i}`,null,"draft"); R.runWithRng(rng,()=>E.applyDraftCard(s,i,seed%2?0:s.draftHand.length-1)); }
    R.runWithRng(rng,()=>{ E.finishDraft(s); E.startProPath(s,seed%2?"Europa":"NCAA"); E.revealDraftLanding(s); });
    await phase("call",{kind:"call",pick:s.draftPick,flavor:"Synthetic"});
    const ev = R.runWithRng(rng,()=>E.pickStoryEvent(s,1));
    await phase("pending-story",{kind:"story",eventId:ev.id,title:ev.title,subtitle:ev.subtitle,options:ev.choices.map(c=>({label:c.label,detail:c.detail}))});
    const row=R.runWithRng(rng,()=>{E.applyChoiceFx(s,ev.choices[0]!.fx(s),ev.id);return E.simulateRegularSeason(s,1);});
    await phase("recap",{kind:"recap",row,qualified:E.qualifiesPlayoffs(s,row),awardNote:"Synthetic",door:"Synthetic"});
    // Force entry only in synthetic fixture to exercise postseason envelope/engine API.
    R.runWithRng(rng,()=>E.beginPlayoffs(s));
    const opponent=R.runWithRng(rng,()=>E.pickPlayoffOpponent(s,0));
    await phase("pending-playoff-forced",{kind:"playoff",round:0,opponent,nerves:"Synthetic"});
    R.runWithRng(rng,()=>E.resolvePlayoffRound(s,1,0,0,opponent));
    await phase("postseason",{kind:"hold",next:"offseason",season:1});
    const offers=R.runWithRng(rng,()=>E.buildFaOffers(s));
    await phase("pending-fa",{kind:"fa",offers,desk:"Synthetic"});
    const trade=R.runWithRng(rng,()=>E.buildTradeOffer(s));
    await phase("pending-trade",{kind:"trade",team:trade.team,pitch:trade.pitch});
    s.age=35; s.season=17; await phase("retirement-35-forced",{kind:"retire"});
    R.runWithRng(rng,()=>E.recordRetirementChoice(s,true)); s.extraSeason=true;
    await phase("retirement-accepted",{kind:"hold",next:"offseason",season:17});
  }
}
// Boundary fixtures supplement natural careers; synthetic forced states, not frequency estimates.
for (const version of versions) for (const age of [29,31,33,35,36]) for (const mode of ["low-minutes","injury-forced","healthy-star"] as const) {
  const seed=91000+age;
  const j=E.openCareerSim({seed,engineVersion:version,path:"NCAA",role:"C",difficulty:"leggenda",experiment:{minutes:mode==="low-minutes"?8:34,injury:mode==="injury-forced"?"forced":"off"}});
  j.s.careerId=`boundary-${version}-${age}-${mode}`; j.s.age=age;
  if(mode==="healthy-star") { j.s.overall=90;j.s.potential=97; }
  else {j.s.overall=58;j.s.potential=66;}
  rngState(j.s,j.rng);
  await emit(`${version}/boundary/${age}/${mode}/before`,{player:j.s,rng:j.rng.getState(),envelope:envelope(j.s)});
  R.runWithRng(j.rng,()=>{E.applyAging(j.s);E.simulateRegularSeason(j.s,12);});
  rngState(j.s,j.rng);
  await emit(`${version}/boundary/${age}/${mode}/after`,{player:j.s,rng:j.rng.getState(),envelope:envelope(j.s)});
}
// Characterization only: do NOT introduce a future-engine acceptance/recovery policy here.
const versionCases: [string,unknown][] = [["225-beta","2.25.0-beta"],["225","2.25.0"],["300","3.0.0"],["2.9","2.9.0"],["224","2.24.0-beta"],["absent",undefined],["null",null],["number",225],["empty",""],["garbage","garbage"]];
for (const [label,v] of versionCases) {
 reset(); const job=E.openCareerSim({seed:81001,engineVersion:"2.24.0-beta"}); job.s.careerId="future-synthetic";
 const p=JSON.parse(JSON.stringify(job.s)); if(v===undefined) delete p.engineVersion; else p.engineVersion=v;
 const raw=JSON.stringify(envelope(p)); local.setItem(S.SAVE_KEY,raw);
 const loaded=S.loadLive(); const bytesAfterLoad=local.getItem(S.SAVE_KEY)===raw;
 // Probe the same autosave API using synthetic data, never user stores.
 const wrote=S.saveLive({player:job.s,pending:null,log:[],screen:"career",tab:"log",logSeq:2});
 await emit(`engine-version/${label}`,{loaded:!!loaded,engine:loaded?.player.engineVersion,loadReport:S.lastLoadReport(),bytesAfterLoad,writeAccepted:wrote,bytesAfterWrite:local.getItem(S.SAVE_KEY)===raw,numericAtLeast225:T.versionAtLeast(v,"2.25.0")});
}
for (const primaryKind of ["legacy","corrupt","future-schema","future-engine","checksum","incomplete"]) for(const secondKind of ["none","legacy","corrupt","future-schema","future-engine"]) for(const backupKind of ["none","legacy","corrupt","future-schema","future-engine"]) {
 reset(); const j=E.openCareerSim({seed:81002,engineVersion:"2.24.0-beta"}); j.s.careerId="matrix-synthetic";
 const legacy=JSON.stringify(envelope(j.s));
 function raw(kind:string) { const v=JSON.parse(legacy); if(kind==="future-schema")v.v=3; if(kind==="future-engine"){v.player.engineVersion="3.0.0"; return JSON.stringify(envelope(v.player));} if(kind==="corrupt")return "{"; if(kind==="checksum")v.player.overall++;if(kind==="incomplete")delete v.player;return JSON.stringify(v); }
 const primary=raw(primaryKind); local.setItem(S.SAVE_KEY,primary);
 if(secondKind!=="none") session.setItem(S.SAVE_KEY,raw(secondKind));
 // Existing recovery backup is a third, independent source. It is not silently loaded.
 const oldBackup=JSON.stringify({v:1,at:1794081600000,reason:"corrupt",raw:raw(backupKind)}); if(backupKind!=="none")local.setItem(S.BACKUP_KEY,oldBackup);
 const loads=[];
 for(let attempt=0;attempt<3;attempt++) {
   // Simulated restart: keep persistent/tab bytes, invalidate in-memory live cache.
   const l=new Map(local.values),t=new Map(session.values);
   S.clearLive(); local.values=l; session.values=t;
   const loaded=S.loadLive(); loads.push({loaded:!!loaded,engine:loaded?.player.engineVersion,report:S.lastLoadReport(),primaryIntact:local.getItem(S.SAVE_KEY)===primary,backupRaw:S.readLiveBackup()?.raw,previousBackup:local.getItem(S.BACKUP_PREV_KEY)});
 }
 const restored=S.restoreLiveBackup();
 await emit(`recovery/primary=${primaryKind}/session=${secondKind}/backup=${backupKind}`,{loads,restored,rawAfterExplicitRestore:local.getItem(S.SAVE_KEY)});
}
reset(); const missing=E.openCareerSim({seed:81003,engineVersion:"2.24.0-beta"});
for(let i=0;i<4;i++)E.advanceCareerSim(missing); missing.s.careerId="missing-rng-synthetic"; Reflect.deleteProperty(missing.s,"rngState");
const withoutRng=JSON.stringify(envelope(missing.s)); local.setItem(S.SAVE_KEY,withoutRng);
const fallback=S.loadLive(); await emit("missing-rng",{seed:missing.s.seed,actualStream:missing.rng.getState(),restoredStream:fallback?.player.rngState,primaryIntact:local.getItem(S.SAVE_KEY)===withoutRng,loaded:!!fallback});
gzip.end(); await once(dest,"close");
