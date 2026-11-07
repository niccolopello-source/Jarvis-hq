import test from "node:test";
import assert from "node:assert/strict";
import { firstDiff } from "./json-diff.mjs";
test("full JSON diff includes RNG, contracts, pending and world without gameplay projection",()=>{
 const a={player:{rngState:7,contract:{years:2},world:{events:[{id:"a"}]}},pending:{kind:"story"}};
 for(const [edit,path] of [[b=>b.player.rngState++,"$.player.rngState"],[b=>b.player.contract.years++,"$.player.contract.years"],[b=>b.player.world.events[0].id="b","$.player.world.events.0.id"],[b=>b.pending.kind="fa","$.pending.kind"]]) { const b=structuredClone(a);edit(b);assert.equal(firstDiff(a,b),path); }
});
test("first JSON path includes absent fields, array length and primitive type changes",()=>{
 assert.equal(firstDiff({x:0},{}),"$.x");assert.equal(firstDiff([1],[1,2]),"$.1");assert.equal(firstDiff({x:"2"},{x:2}),"$.x");assert.equal(firstDiff(null,{}),"$");
});
test("object key order is not state normalization; all values still compared",()=>{
 assert.equal(firstDiff({a:1,b:[null,2]},{b:[null,2],a:1}),null);
});
