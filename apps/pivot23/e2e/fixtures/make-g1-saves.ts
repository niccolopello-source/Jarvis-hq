/**
 * G1 fixed-seed mid-career saves: one pending playoff game, one free-agency desk and one trade offer.
 * Real engine states built with the functions PivotApp calls (no engine change, SAVE_VERSION untouched).
 * Seeds are searched in a fixed range, so the output is byte-stable.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  advanceCareerSim, beginPlayoffs, playCareerSim, toArchive, buildFaOffers, buildTradeOffer, isContractYear, openCareerSim,
  pickPlayoffOpponent, playoffRounds, qualifiesPlayoffs, simulateRegularSeason, withPlayer,
} from "../../src/lib/pivot/engine.ts";
import { faDeskLine, playoffNerves } from "../../src/lib/pivot/feel.ts";
import { buildLiveSave } from "../../src/lib/pivot/save.ts";
import type { PlayerState, SavedPending } from "../../src/lib/pivot/types.ts";

const out: Record<string, { seed: number; season: number; save: unknown }> = {};
const clone = <T,>(x: T): T => structuredClone(x);
function live(s: PlayerState, pending: SavedPending) {
  s.simulated = false;
  s.careerId = `00000000-0000-4000-8000-${String(s.seed).padStart(12, "0")}`;
  return buildLiveSave(s, pending, [], "career", "log", 1);
}
for (let seed = 4200; seed < 4400 && Object.keys(out).length < 3; seed += 1) {
  const job = openCareerSim({ name: `G1 ${seed}`, seed, difficulty: "pro", draft: "random" });
  for (let guard = 0; guard < 30; guard += 1) {
    const n = job.n;
    const base = clone(job.s);
    if (!out.trade && n > 2) {
      const s = clone(base);
      s.season = n;
      const t = buildTradeOffer(s);
      if (t.team.name !== s.team.name) out.trade = { seed, season: n, save: live(s, { kind: "trade", team: t.team, pitch: t.pitch }) };
    }
    if (!out.fa && n > 2 && (isContractYear(base, n) || base.contract.yearsRemaining <= 0)) {
      const s = clone(base);
      const offers = buildFaOffers(s);
      if (offers.length >= 2) {
        const desk = withPlayer(s, () => faDeskLine(s, offers.some((o) => o.kind === "extension"), s.team.name));
        out.fa = { seed, season: n, save: live(s, { kind: "fa", offers, desk }) };
      }
    }
    if (!out.playoff) {
      const s = clone(base);
      s.season = n;
      const row = withPlayer(s, () => simulateRegularSeason(s, n));
      if (qualifiesPlayoffs(s, row)) {
        withPlayer(s, () => beginPlayoffs(s));
        const opp = withPlayer(s, () => pickPlayoffOpponent(s, 0));
        const nerves = withPlayer(s, () => playoffNerves(s, playoffRounds(s)[0] ?? "Playoff", opp.name));
        out.playoff = { seed, season: n, save: live(s, { kind: "playoff", round: 0, opponent: opp, nerves }) };
      }
    }
    if (advanceCareerSim(job)) break;
  }
}
const need = ["playoff", "fa", "trade"];
const missing = need.filter((k) => !out[k]);
if (missing.length) throw new Error(`no seed in 4200-4399 produced: ${missing.join(", ")}`);
// A finished career whose summary was edited after archiving (titles/ppg no longer match the card).
const done = toArchive(playCareerSim({ seed: 4242, difficulty: "pro", name: "G1 Archivio" }));
const tampered = JSON.stringify([{ ...done, id: "g1-tampered", savedAt: 1, titles: 99, ppg: 99 }]);
const target = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "g1-saves.json");
writeFileSync(target, JSON.stringify({ ...Object.fromEntries(need.map((k) => [k, JSON.stringify(out[k]!.save)])), archiveTampered: tampered }));
console.log("wrote g1 saves", Object.fromEntries(need.map((k) => [k, `seed ${out[k]!.seed} season ${out[k]!.season}`])));
