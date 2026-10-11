/**
 * Deterministic mid-career saves for the browser demo gate (no engine change, SAVE_VERSION untouched).
 * Each save is a real engine state: a seeded career is advanced with the engine's own season stepper,
 * then the next season is played with the same functions PivotApp calls, and the save is written with
 * the pending decision the app would show. Seeds are searched in a fixed range, so output is stable.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  advanceCareerSim, beginPlayoffs, buildFaOffers, isContractYear, openCareerSim, pickPlayoffOpponent,
  qualifiesPlayoffs, scriptedSeasonEvent, scriptedSeasonSlot, simulateRegularSeason, withPlayer,
} from "../../src/lib/pivot/engine.ts";
import { faDeskLine, noAwardLine, playoffNerves, doorLine } from "../../src/lib/pivot/feel.ts";
import { playoffRounds } from "../../src/lib/pivot/engine.ts";
import { buildLiveSave } from "../../src/lib/pivot/save.ts";
import type { PlayerState, SavedPending } from "../../src/lib/pivot/types.ts";

type Found = { seed: number; season: number; save: unknown };
const out: Record<string, Found> = {};
const clone = <T,>(x: T): T => structuredClone(x);

function live(s: PlayerState, pending: SavedPending) {
  s.simulated = false;
  return buildLiveSave(s, pending, [], "career", "log", 1);
}

for (let seed = 4200; seed < 4400 && Object.keys(out).length < 4; seed += 1) {
  const job = openCareerSim({ name: `Fixture ${seed}`, seed, difficulty: "pro", draft: "random" });
  for (let guard = 0; guard < 30; guard += 1) {
    const n = job.n;
    const base = clone(job.s);
    if (!out.injury && scriptedSeasonSlot(base, n) === "injury") {
      const s = clone(base);
      s.season = n;
      const ev = withPlayer(s, () => scriptedSeasonEvent(s, n))!;
      if (!s.usedEventIds.includes(ev.id)) s.usedEventIds.push(ev.id);
      out.injury = { seed, season: n, save: live(s, { kind: "story", title: ev.title, subtitle: ev.subtitle, script: "injury", eventId: ev.id, options: ev.choices.map((c) => ({ label: c.label, detail: c.detail })) }) };
    }
    if (!out.fa && n > 2 && (isContractYear(base, n) || base.contract.yearsRemaining <= 0)) {
      const s = clone(base);
      const offers = buildFaOffers(s);
      if (offers.length >= 2) {
        const desk = withPlayer(s, () => faDeskLine(s, offers.some((o) => o.kind === "extension"), s.team.name));
        out.fa = { seed, season: n, save: live(s, { kind: "fa", offers, desk }) };
      }
    }
    if (!out.awardsPlayoffs || !out.playoffFinals) {
      const s = clone(base);
      s.season = n;
      const row = withPlayer(s, () => simulateRegularSeason(s, n));
      const q = qualifiesPlayoffs(s, row);
      if (!out.awardsPlayoffs && q && row.awards.length > 0) {
        const door = withPlayer(s, () => doorLine(s, "in"));
        out.awardsPlayoffs = { seed, season: n, save: live(clone(s), { kind: "recap", row, qualified: true, awardNote: "", door }) };
      }
      if (!out.playoffFinals && q && s.team.tier === "contender") {
        withPlayer(s, () => beginPlayoffs(s));
        const opp = withPlayer(s, () => pickPlayoffOpponent(s, 0));
        const nerves = withPlayer(s, () => playoffNerves(s, playoffRounds(s)[0] ?? "Playoff", opp.name));
        out.playoffFinals = { seed, season: n, save: live(s, { kind: "playoff", round: 0, opponent: opp, nerves }) };
      }
      void noAwardLine;
    }
    if (advanceCareerSim(job)) break;
  }
}
const need = ["injury", "fa", "awardsPlayoffs", "playoffFinals"];
const missing = need.filter((k) => !out[k]);
if (missing.length) throw new Error(`no seed in 4200-4399 produced: ${missing.join(", ")}`);
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), "path-saves.json"), JSON.stringify(Object.fromEntries(need.map((k) => [k, JSON.stringify(out[k]!.save)]))));
console.log("wrote path saves", Object.fromEntries(need.map((k) => [k, `seed ${out[k]!.seed} season ${out[k]!.season}`])));
