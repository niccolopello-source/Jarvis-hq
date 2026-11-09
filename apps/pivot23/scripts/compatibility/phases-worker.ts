/** Paired engine-API fixtures: uninterrupted vs save/load before the next action. */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createWriteStream } from "node:fs";
import { once } from "node:events";
import { createGzip } from "node:zlib";
import type { PlayerState, SavedPending } from "../../src/lib/pivot/types.ts";
const [root,out]=process.argv.slice(2);
if(!root || !out)throw new Error("usage: phases-worker.ts APP_ROOT OUT.gz");
const url=(p:string)=>pathToFileURL(resolve(root,p)).href;
const E: typeof import("../../src/lib/pivot/engine.ts")=await import(url("src/lib/pivot/engine.ts"));
const S: typeof import("../../src/lib/pivot/save.ts")=await import(url("src/lib/pivot/save.ts"));
const R: typeof import("../../src/lib/pivot/rng.ts")=await import(url("src/lib/pivot/rng.ts"));
class Mem implements Storage {
 values=new Map<string,string>();get length(){return this.values.size;}clear(){this.values.clear();}getItem(k:string){return this.values.get(k)??null;}key(i:number){return [...this.values.keys()][i]??null;}removeItem(k:string){this.values.delete(k);}setItem(k:string,v:string){this.values.set(k,String(v));}
}
const local=new Mem(),session=new Mem();
Object.defineProperty(globalThis,"localStorage",{configurable:true,value:local});Object.defineProperty(globalThis,"sessionStorage",{configurable:true,value:session});Date.now=()=>1794081600000;
const gzip=createGzip(),dest=createWriteStream(out);gzip.pipe(dest);
async function emit(id:string,value:unknown){if(!gzip.write(JSON.stringify({id,value})+"\n"))await once(gzip,"drain");}
for(let minor=12;minor<=24;minor++)for(const seed of [72101,72198]) {
 const version=`2.${minor}.0-beta`,rngA=R.createRng(seed),rngB=R.createRng(seed);
 const make=()=>E.freshPlayer("Phase Pair Synthetic","SG","Italia",23,"pro",seed,version);
 const a=R.runWithRng(rngA,make);let b=R.runWithRng(rngB,make);
 a.careerId=b.careerId=`paired-phase-${version}-${seed}`;
 function both<T>(fn:(p:PlayerState)=>T):[T,T]{return [R.runWithRng(rngA,()=>fn(a)),R.runWithRng(rngB,()=>fn(b))];}
 let pendingA:SavedPending|null=null,pendingB:SavedPending|null=null;
 async function phase(label:string,pa:SavedPending|null=null,pb:SavedPending|null=pa,screen:"draft"|"career"="career") {
  a.rngState=rngA.getState();b.rngState=rngB.getState();pendingA=pa;pendingB=pb;
  const snap=(s:PlayerState,p:SavedPending|null)=>({player:s,rng:s.rngState,envelope:S.buildLiveSave(s,p,[],screen,"log",1)});
  await emit(`${version}/paired-phase/${seed}/${label}/before`,{uninterrupted:snap(a,pendingA),resumed:snap(b,pendingB)});
  S.clearLive();local.clear();session.clear();
  assert.equal(S.saveLive({player:b,pending:pendingB,log:[],screen,tab:"log",logSeq:1}),true);
  const raw=local.getItem(S.SAVE_KEY),loaded=S.loadLive();assert.ok(loaded);assert.equal(local.getItem(S.SAVE_KEY),raw);
  b=loaded.player;pendingB=loaded.pending;rngB.setState(b.rngState);
  await emit(`${version}/paired-phase/${seed}/${label}/after-load`,{uninterrupted:snap(a,pendingA),resumed:snap(b,pendingB)});
 }
 const rounds=E.allDraftRounds();for(let i=0;i<rounds.length;i++){await phase(`draft-${i}`,null,null,"draft");both(p=>E.applyDraftCard(p,i,seed%2?0:p.draftHand.length-1));}
 both(p=>{E.finishDraft(p);E.startProPath(p,seed%2?"Europa":"G-League");E.revealDraftLanding(p);});
 await phase("path-call",{kind:"call",pick:a.draftPick,flavor:"Synthetic"},{kind:"call",pick:b.draftPick,flavor:"Synthetic"});
 const [evA,evB]=both(p=>E.pickStoryEvent(p,1));
 const pending=(ev:typeof evA):SavedPending=>({kind:"story",eventId:ev.id,title:ev.title,subtitle:ev.subtitle,options:ev.choices.map(c=>({label:c.label,detail:c.detail}))});
 await phase("pending-story",pending(evA),pending(evB));
 R.runWithRng(rngA,()=>E.applyChoiceFx(a,evA.choices[0]!.fx(a),evA.id));R.runWithRng(rngB,()=>E.applyChoiceFx(b,evB.choices[0]!.fx(b),evB.id));
 const [rowA,rowB]=both(p=>E.simulateRegularSeason(p,1));
 const recap=(p:PlayerState,row:typeof rowA):SavedPending=>({kind:"recap",row,qualified:E.qualifiesPlayoffs(p,row),awardNote:"Synthetic",door:"Synthetic"});
 await phase("season-recap",recap(a,rowA),recap(b,rowB));
 // Synthetic branch fixture: guarantee a real qualified bracket rather than only a pending label.
 both(p=>{
  assert.ok(p.currentLeague);
  p.currentLeague=structuredClone(p.currentLeague);
  const table=p.league==="EuroLega"?p.currentLeague.euro:p.team.conf==="East"?p.currentLeague.east:p.currentLeague.west;
  const mine=table.find(r=>r.abbr===p.team.abbr);assert.ok(mine);
  const first=table.find(r=>r.seed===1);
  if(first && first!==mine)first.seed=mine.seed;
  mine.seed=1;
  assert.ok(E.beginPlayoffs(p),"forced seeded fixture must reach a real bracket");
 });const [oppA,oppB]=both(p=>E.pickPlayoffOpponent(p,0));
 await phase("postseason-forced",{kind:"playoff",round:0,opponent:oppA,nerves:"Synthetic"},{kind:"playoff",round:0,opponent:oppB,nerves:"Synthetic"});
 R.runWithRng(rngA,()=>E.resolvePlayoffRound(a,1,0,0,oppA));R.runWithRng(rngB,()=>E.resolvePlayoffRound(b,1,0,0,oppB));
 await phase("postseason-resolved",{kind:"hold",next:"offseason",season:1});
 const [faA,faB]=both(p=>E.buildFaOffers(p));await phase("pending-fa",{kind:"fa",offers:faA,desk:"Synthetic"},{kind:"fa",offers:faB,desk:"Synthetic"});
 both(p=>E.applyAutoOffseason(p,1));
 a.age=b.age=35;a.season=b.season=17;await phase("retirement-35-forced",{kind:"retire"});
 both(p=>{E.recordRetirementChoice(p,true);p.extraSeason=true;});await phase("retirement-continue",{kind:"hold",next:"offseason",season:17});
}
gzip.end();await once(dest,"close");
