import { test } from "node:test";
import assert from "node:assert/strict";
import { advanceCareerSim, eventRebuildOf, openCareerSim, pickStoryEvent, storyEventById } from "./engine";

/**
 * Procedural audit P1: late-* / quiet-* cards are generated, not looked up, so a resumed save must
 * rebuild them from the RNG state (and heard-lines list) they were built from. Without that info
 * (old saves) the previous behaviour is kept.
 */
type Ev = ReturnType<typeof pickStoryEvent>;
const text = (e: Ev) => JSON.stringify([e.id, e.title, e.subtitle, e.choices.map((c) => [c.label, c.detail])]);

function collect(limit: number) {
  const out: { kind: string; ev: Ev; saved: string; rebuild: ReturnType<typeof eventRebuildOf> }[] = [];
  for (let i = 0; i < 120 && out.length < limit; i++) {
    const job = openCareerSim({ seed: 9100 + i * 37, difficulty: "pro" });
    while (!advanceCareerSim(job)) {
      if (!job.s.seasonHistory.length) continue;
      const s = structuredClone(job.s);
      s.season = job.n;
      const ev = pickStoryEvent(s, job.n);
      const kind = ev.id.split("-")[0]!;
      if (kind !== "late" && kind !== "quiet") continue;
      out.push({ kind, ev, saved: JSON.stringify(s), rebuild: eventRebuildOf(s, ev.id) });
    }
  }
  return out;
}

const cases = collect(160);

test("P1: there are late-* and quiet-* cards to check", () => {
  assert.ok(cases.filter((c) => c.kind === "late").length >= 20);
  assert.ok(cases.filter((c) => c.kind === "quiet").length >= 20);
});

test("P1: with the stored rebuild info a resumed card is the same card and the career RNG does not move", () => {
  for (const c of cases) {
    assert.ok(c.rebuild, `${c.ev.id}: rebuild info recorded`);
    const s = JSON.parse(c.saved);
    const rng = s.rngState;
    const heard = JSON.stringify(s.heardLines);
    const used = JSON.stringify(s.usedEventIds);
    const re = storyEventById(s, c.ev.id, c.kind as "late" | "quiet", JSON.parse(JSON.stringify(c.rebuild)));
    assert.equal(text(re), text(c.ev), `${c.ev.id}: same text`);
    assert.equal(s.rngState, rng, `${c.ev.id}: rngState untouched`);
    assert.equal(JSON.stringify(s.heardLines), heard, `${c.ev.id}: heard lines untouched`);
    assert.equal(JSON.stringify(s.usedEventIds), used, `${c.ev.id}: used ids untouched`);
  }
});

test("P1: an old save without rebuild info keeps the old path (rebuild from the live RNG)", () => {
  let moved = 0;
  for (const c of cases) {
    const s = JSON.parse(c.saved);
    const rng = s.rngState;
    const re = storyEventById(s, c.ev.id, c.kind as "late" | "quiet");
    assert.ok(re.id.startsWith(c.kind));
    if (s.rngState !== rng) moved++;
  }
  assert.ok(moved > 0, "the legacy path still draws from the career RNG");
});

test("P1: bad rebuild info falls back to the old path instead of a wrong card", () => {
  const c = cases[0]!;
  const s = JSON.parse(c.saved);
  const re = storyEventById(s, "late-does-not-exist", "late", { rng: 1, pop: 0, back: [] });
  assert.ok(re.id.startsWith("late"));
});

test("P1: the live save keeps valid rebuild info and drops malformed info", async () => {
  const { buildLiveSave } = await import("./save");
  const c = cases[0]!;
  const s = JSON.parse(c.saved);
  const story = (rebuild: unknown) =>
    ({ kind: "story", title: "t", subtitle: "s", script: c.kind, eventId: c.ev.id, options: [], rebuild }) as never;
  const ok = buildLiveSave(s, story(c.rebuild), [], "career", "career" as never, 0).pending as { rebuild?: unknown };
  assert.deepEqual(ok.rebuild, c.rebuild);
  for (const bad of [null, 3, { rng: 1.5, pop: 0, back: [] }, { rng: 1, pop: -1, back: [] }, { rng: 1, pop: 0, back: [["x", "y"]] }]) {
    const p = buildLiveSave(s, story(bad), [], "career", "career" as never, 0).pending as { rebuild?: unknown };
    assert.equal(p.rebuild, undefined);
  }
});
