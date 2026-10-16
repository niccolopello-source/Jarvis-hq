import assert from "node:assert/strict";
import test from "node:test";
import { playCareerTexts } from "./harness.ts";
import { onFillVarsMiss } from "../voice.ts";
import { NARRATIVE_EN } from "./catalog-en.ts";

/* Demo hardening 2026-10-16: no rendered text may carry an unresolved template token, and
   fillVars must never have to silently drop a `$VAR`. Observation only: output and RNG untouched. */

const SEEDS = Array.from({ length: 60 }, (_, i) => 91000 + 13 * i);
const LEFTOVER = /__[A-Z0-9_]+__|\$[A-Z][A-Z0-9_]*|\$\{[^}]*\}|\{\d+\}|\{[A-Z][A-Z0-9_]*\}|\bundefined\b|\bNaN\b|\[object Object\]/;

test("rendered career texts carry no leftover template tokens", () => {
  const bad: string[] = [];
  for (const seed of SEEDS) for (const s of playCareerTexts(seed)) if (LEFTOVER.test(s.text)) bad.push(`${seed} ${s.where}: ${s.text.slice(0, 90)}`);
  assert.deepEqual(bad.slice(0, 20), []);
});

test("fillVars never silently drops an unknown $VAR while playing careers", () => {
  const misses = new Map<string, string>();
  onFillVarsMiss((tok, line) => { if (!misses.has(`${tok} | ${line}`)) misses.set(`${tok} | ${line}`, tok); });
  try {
    for (const seed of SEEDS) playCareerTexts(seed);
  } finally {
    onFillVarsMiss(null);
  }
  assert.deepEqual([...misses.keys()].slice(0, 30).map((k) => k.slice(0, 120)), []);
});

test("the observer does not change fillVars output", async () => {
  const { fillVars } = await import("../voice.ts");
  const off = fillVars("$NAME va a $DEST con $UNKNOWN.", { NAME: "Rossi", DEST: "Boston" });
  let seen = "";
  onFillVarsMiss((tok) => { seen += tok; });
  const on = fillVars("$NAME va a $DEST con $UNKNOWN.", { NAME: "Rossi", DEST: "Boston" });
  onFillVarsMiss(null);
  assert.equal(on, off);
  assert.equal(seen, "$UNKNOWN");
});

test("English catalog values carry no raw template leftovers", () => {
  // `${2}M` is a dollar sign before slot {2}; `__RIVAL__` is an engine token, allowed only if the Italian key has it too.
  const bad: string[] = [];
  for (const [k, v] of Object.entries(NARRATIVE_EN)) {
    if (/\$\{(?!\d+\})|\bundefined\b|\[object Object\]/.test(v)) bad.push(k.slice(0, 60));
    for (const m of v.matchAll(/__[A-Z0-9_]+__/g)) if (!k.includes(m[0])) bad.push(`${k.slice(0, 60)} -> ${m[0]}`);
  }
  assert.deepEqual(bad, []);
});
