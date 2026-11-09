import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../../src/lib/pivot/engine.ts';
import * as R from '../../src/lib/pivot/rng.ts';
import * as P from '../../src/lib/pivot/peak.ts';
import {TUNING} from '../../src/lib/pivot/tuning.ts';
const job=(version='2.25.0')=>E.openCareerSim({name:'Contract synthetic',role:'SG',nationality:'ITA',number:23,path:'NCAA',difficulty:'pro',seed:940000,engineVersion:version,draft:'random'});
test('attribute-only Fx has no duplicate statsPulse, both 2.24 and dormant 2.25',()=>{
for(const version of ['2.24.0-beta','2.25.0']){const s=job(version).s;assert.equal(E.statsPulse(s,{attrs:{shooting:3},flavor:''}),0);assert.equal(E.statsPulse(s,{flavor:''}),0);}
});
test('no discrete training or contextual-pulse age gate between 25 and 26',()=>{
const s=job().s;
for(const key of Object.keys(s.attrs)){s.age=25;const a=E.ageTrainMult(s,key);s.age=26;assert.equal(E.ageTrainMult(s,key),a);}
for(const morale of [-5,5]){s.age=25;const a=E.contextualPulse(s,{morale,flavor:''});s.age=26;assert.equal(E.contextualPulse(s,{morale,flavor:''}),a);}
assert.ok(P.naturalCurveAt(s,26)>=P.naturalCurveAt(s,25));
});
test('experience saturates at the existing symmetric cap and choices draw no extra RNG',()=>{
for(const sign of [-1,1]){const j=job(),start=j.rng.getState();for(let i=0;i<100;i++)R.runWithRng(j.rng,()=>E.applyChoiceFx(j.s,{morale:10*sign,coachTrust:5*sign,form:sign,flavor:''},'synthetic-bounds'));assert.ok(Math.abs(j.s.expOvr)<=TUNING.depth225.expCap);assert.equal(j.rng.getState(),start);assert.ok(Number.isFinite(j.s.overall));}
});
test('representative same seed/actions replay includes full PlayerState and active RNG',()=>{
const realNow=Date.now;Date.now=()=>1794081600000;
try{const a=job(),b=job();a.s.careerId=b.s.careerId='contract-synthetic';assert.notEqual(a.s,b.s);for(let k=0;k<4;k++){assert.deepEqual(a.s,b.s);assert.equal(a.rng.getState(),b.rng.getState());assert.equal(E.advanceCareerSim(a),E.advanceCareerSim(b));}}finally{Date.now=realNow;}
});

// Regression uses the REAL runtime event: both an5 alternatives draw a coach.
import {STORY_POOL} from '../../src/lib/pivot/data.ts';
import {previewChoice, choosePolicy} from './policy-preview.mjs';
const an5=STORY_POOL.find(event=>event.id==='an5');
assert.ok(an5);

test('REAL an5 policy previews preserve job cursor and full input player',()=>{
  for(const profile of ['best','worst','morale-up','morale-down']){
    const j=job();for(let k=0;k<7;k++)j.rng.next();
    const cursor=j.rng.getState(),before=structuredClone(j.s);
    R.runWithRng(j.rng,()=>choosePolicy(profile,E,R)(j.s,an5));
    assert.equal(j.rng.getState(),cursor,`${profile} preview cannot spend job RNG`);
    assert.deepEqual(j.s,before);
  }
});

test('REAL an5 alternatives preview actual next coach; real choice spends exactly one draw',()=>{
  for(const choice of an5.choices){
    const j=job();for(let k=0;k<11;k++)j.rng.next();
    const cursor=j.rng.getState();
    const expected=R.runWithRng(j.rng,()=>previewChoice(j.s,choice,R));
    assert.equal(j.rng.getState(),cursor);
    const reference=R.createRng(j.rng.seed);reference.setState(cursor);reference.next();
    const actual=R.runWithRng(j.rng,()=>choice.fx(j.s));
    assert.deepEqual(actual,expected,'preview must use the current cursor, not restart seed');
    assert.equal(j.rng.getState(),reference.getState());
    assert.ok(actual.flavor.includes(j.s.coachName));
  }
});

test('REAL an5 throwing preview restores nested RNG context and leaves job untouched',()=>{
  const j=job(),cursor=j.rng.getState();
  R.runWithRng(j.rng,()=>{
    assert.throws(()=>previewChoice(j.s,{fx:s=>{an5.choices[0].fx(s);throw Error('preview failed');}},R),/preview failed/);
    assert.equal(R.currentRng(),j.rng);
    assert.equal(j.rng.getState(),cursor);
  });
});

test('REAL an5 preview supports exact zero cursor despite setState zero sentinel',()=>{
  const j=job();j.rng.setState((-0x6d2b79f5)>>>0);j.rng.next();
  assert.equal(j.rng.getState(),0);
  const expected=R.runWithRng(j.rng,()=>previewChoice(j.s,an5.choices[0],R));
  assert.equal(j.rng.getState(),0);
  const actual=R.runWithRng(j.rng,()=>an5.choices[0].fx(j.s));
  assert.deepEqual(actual,expected);
});

// Whole-career guard: previews of ALL event kinds (an5, rival, nation, late, quiet, injury, proc…)
// must leave the active career identical to a replay of the same picks without any preview.
test('full policy careers equal preview-free replay of the same picks (state + active RNG)',()=>{
  const realNow=Date.now;Date.now=()=>1794081600000;
  try{
    for(const seed of [940000,940097,940194])for(const profile of ['best','worst','morale-up','morale-down']){
      const open=choose=>E.openCareerSim({name:'Contract synthetic',role:'SG',nationality:'ITA',number:23,path:'NCAA',difficulty:'pro',seed,engineVersion:'2.25.0',draft:'random',choose});
      const picks=[],policy=choosePolicy(profile,E,R);
      const a=open((s,ev,n,drawn)=>{const i=policy(s,ev,n,drawn);picks.push(i);return i;});
      let k=0;const b=open(()=>picks[k++]);
      a.s.careerId=b.s.careerId='contract-synthetic';
      for(let step=0;step<24;step++){const da=E.advanceCareerSim(a),db=E.advanceCareerSim(b);assert.equal(da,db);assert.equal(a.rng.getState(),b.rng.getState(),`${seed}/${profile} step ${step}`);if(da)break;}
      assert.ok(picks.length>0);assert.equal(k,picks.length);
      assert.deepEqual(a.s,b.s);
    }
  }finally{Date.now=realNow;}
});
