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
