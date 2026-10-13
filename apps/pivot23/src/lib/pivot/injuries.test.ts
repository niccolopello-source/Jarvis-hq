import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, ENGINE_VERSION, eventAfterMarket, openCareerSim, playCareerSim, scriptedSeasonSlot, storyEventById, withPlayer } from "./engine.ts";
import { INJURY_EVENTS_SINCE, INJURY_KINDS, INJURY_MAX_PER_CAREER, injuryHazard, loadInjuryAt, priorInjuries, usesInjuryEvents } from "./injuries.ts";
import { versionAtLeast } from "./tuning.ts";
import type { PlayerState } from "./types.ts";

const ROLES = ["PG", "SG", "SF", "PF", "C"] as const;
const PATHS = ["NCAA", "Europa", "G-League"] as const;
const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
const opts = (seed: number, d: (typeof DIFFS)[number] = "pro") => ({
  name: "Inf", role: ROLES[seed % 5], nationality: "ITA", number: 23, difficulty: d, path: PATHS[seed % 3], seed, draft: "random" as const,
});
const injuries = (s: PlayerState) => s.usedEventIds.filter((id) => /^injury-\d+/.test(id));

test("P1-INJ gate: only careers created on 2.19.0 or later (2.18 shipped without them)", () => {
  assert.equal(INJURY_EVENTS_SINCE, "2.19.0");
  assert.equal(versionAtLeast(ENGINE_VERSION, INJURY_EVENTS_SINCE), true, "new careers get load-based injuries");
  for (const v of ["2.11.0-beta", "2.12.0", "2.13.0-beta", "2.14.0-beta", "2.15.0-beta", "2.16.0-beta", "2.16.9", "2.17.0-beta", "2.18.0-beta", "2.18.0", undefined]) assert.equal(usesInjuryEvents({ engineVersion: v }), false, String(v));
  for (const v of ["2.19.0-beta", "2.19.0", "3.0.0"]) assert.equal(usesInjuryEvents({ engineVersion: v }), true, v);
});

test("P1-INJ: 2.14/2.15/2.16/2.18 careers keep the 7–9 seed window and the single legacy card", () => {
  for (let seed = 500; seed < 540; seed++) {
    const job = openCareerSim(opts(seed));
    job.s.engineVersion = ["2.14.0-beta", "2.15.0-beta", "2.16.0-beta", "2.18.0-beta"][seed % 4]!;
    while (!advanceCareerSim(job));
    const ids = injuries(job.s);
    assert.equal(ids.length, 1, `seed ${seed}`);
    assert.match(ids[0]!, /^injury-[789]$/, `seed ${seed}`);
  }
});

test("P1-INJ: 2.17 injuries are capped, spaced, never the same body part twice", () => {
  for (let seed = 600; seed < 760; seed++) {
    const s = playCareerSim(opts(seed, DIFFS[seed % 4]));
    const ids = injuries(s).map((id) => /^injury-(\d+)-([a-z]+)$/.exec(id));
    assert.ok(ids.every(Boolean), `seed ${seed}: ${injuries(s)}`);
    assert.ok(ids.length <= INJURY_MAX_PER_CAREER, `seed ${seed}`);
    const kinds = ids.map((m) => m![2]!);
    assert.equal(new Set(kinds).size, kinds.length, `seed ${seed}: repeated ${kinds}`);
    for (const k of kinds) assert.ok((INJURY_KINDS as readonly string[]).includes(k));
    const seasons = ids.map((m) => Number(m![1]));
    for (let i = 1; i < seasons.length; i++) assert.ok(seasons[i]! - seasons[i - 1]! >= 3, `seed ${seed}: ${seasons}`);
    assert.ok(seasons.every((n) => n >= 2), "never in the rookie season");
  }
});

test("P1-INJ: the slot only reads finished seasons, so the game, a reload and a recount agree", () => {
  for (let seed = 800; seed < 840; seed++) {
    const job = openCareerSim(opts(seed));
    const live: (string | null)[] = [];
    while (true) {
      const n = job.n;
      if (n <= 20) live[n] = scriptedSeasonSlot(job.s, n);
      if (advanceCareerSim(job)) break;
    }
    const s = job.s;
    for (let n = 2; n <= s.seasonHistory.length; n++) assert.equal(scriptedSeasonSlot(s, n), live[n], `seed ${seed} season ${n}`);
    for (const id of injuries(s)) {
      const n = Number(id.split("-")[1]);
      const again = storyEventById({ ...s, season: n }, id, "injury");
      assert.equal(again.id, id, "reload rebuilds the same card");
      const kind = id.split("-")[2]!;
      assert.equal(loadInjuryAt(s, n), kind, "recount names the same body part");
      assert.notEqual(again.title, "Un infortunio serio");
    }
  }
});

test("P1-INJ: eventAfterMarket follows the load slot and stores the injury script", () => {
  let checked = 0;
  for (let seed = 900; seed < 960 && checked < 5; seed++) {
    const s = playCareerSim(opts(seed));
    const id = injuries(s)[0];
    if (!id) continue;
    const n = Number(id.split("-")[1]);
    const at = { ...s, season: n, usedEventIds: s.usedEventIds.filter((x) => !x.startsWith(`injury-${n}`)) } as PlayerState;
    const r = withPlayer(at, () => eventAfterMarket(at));
    assert.equal(r.script, "injury");
    assert.equal(r.event.id, id);
    checked++;
  }
  assert.ok(checked >= 3);
});

test("P1-INJ: the hazard grows with load and age, and age alone does not schedule it", () => {
  const row = (age: number, min: number, gp: number) => ({ age, min, gp, teamAbbr: "BOS", seriesLog: [] }) as unknown as PlayerState["seasonHistory"][number];
  const at = (rows: ReturnType<typeof row>[], ids: string[] = []) =>
    injuryHazard({ seasonHistory: rows, usedEventIds: ids, difficulty: "pro" } as unknown as PlayerState, rows.length + 1);
  const bench = at([row(24, 14, 60), row(25, 14, 60)]);
  const starter = at([row(24, 34, 78), row(25, 34, 78)]);
  const vetStarter = at([row(31, 34, 78), row(32, 34, 78)]);
  const vetBench = at([row(31, 14, 60), row(32, 14, 60)]);
  assert.ok(starter > bench * 2, `${starter} vs ${bench}`);
  assert.ok(vetStarter > starter);
  assert.ok(vetBench < starter, "a 33-year-old in a light role is safer than a loaded 26-year-old");
  assert.ok(at([row(24, 34, 78), row(25, 34, 78), row(26, 34, 78)], ["injury-2-caviglia"]) > starter, "recent injury raises the risk");
  assert.equal(priorInjuries({ usedEventIds: ["injury-8", "injury-3-coscia", "proc-1-2"] }, 9).length, 2);
});

test("P1-INJ: across careers the injury is not anchored to one career year or one text", () => {
  const years: number[] = [];
  const titles = new Set<string>();
  for (let seed = 1000; seed < 1200; seed++) {
    const s = playCareerSim(opts(seed, DIFFS[seed % 4]));
    for (const id of injuries(s)) {
      const n = Number(id.split("-")[1]);
      years.push(n);
      titles.add(s.choiceLog.find((c) => c.season === n && storyEventById({ ...s, season: n }, id, "injury").title === c.title)?.title ?? "");
    }
  }
  const top = Math.max(...Array.from(new Set(years), (y) => years.filter((x) => x === y).length));
  assert.ok(years.length >= 120, `cards ${years.length}`);
  assert.ok(top / years.length < 0.2, `top career year share ${top / years.length}`);
  assert.ok(new Set(years).size >= 12, `distinct years ${new Set(years).size}`);
  titles.delete("");
  assert.ok(titles.size >= 6, `distinct titles ${titles.size}`);
});
