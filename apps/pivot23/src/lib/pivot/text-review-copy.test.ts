/**
 * Text review 2026-11-23: leaked brackets/placeholders, Italian left in English,
 * unclear "nudo" Italian, HUD club/contract lines. Display-only: engine state is
 * compared with the same fingerprint used by engine-invariants.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { clubLine, contractLine } from "./copy-display.ts";
import { playCareerSim, type SimOpts } from "./engine.ts";
import { t } from "./i18n.ts";
import { formatPlayoffScoreLine, italianTeamArticle, nbaNeedsGli, playoffResultLabel } from "./labels.ts";
import { loadNarrativeEn, nx } from "./narrative/index.ts";
import { playCareerTexts } from "./narrative/harness.ts";
import { resetRules } from "./rules.ts";
import { NBA_TEAMS, UNSIGNED_TEAM } from "./teams.ts";
import type { Contract, PlayerState, Team } from "./types.ts";

await loadNarrativeEn();

const RAW = /\$[A-Z][A-Z0-9_]*|__[A-Z0-9_]+__|\{[a-zA-Z][a-zA-Z0-9_.]*\}|\bundefined\b|\bNaN\b|\[object Object\]/;
const IT_LEAK = /\b(Fuori Elim\.|in sette, o meno|\(noi–)/;
const EN_BAD = /\b(Svincolato|nudo|nuda|mestiere|Fuori Elim\.|in seven, or fewer|\(us vs\.|\(noi–)/i;
const ES_ZH_LEAK = /\b(Svincolato|nudo|nuda|mestiere nudo|Fuori Elim\.|in sette, o meno|\(noi–|\(us vs\.)/i;
const IT_NUDO = /\bnud[oaie]\b/i;

function fingerprint(s: PlayerState) {
  return JSON.stringify([s.seasonHistory, s.choiceLog, s.milestones, s.championLog, s.attrs, s.hidden, s.rngState, s.royClass, s.world?.stars]);
}

const dummy: Contract = { teamName: "", years: 3, yearsRemaining: 3, annualM: 4.2, kind: "rookie" };

const celtics: Team = {
  name: "Boston Celtics",
  abbr: "BOS",
  color: "#000",
  secondary: "#fff",
  city: "Boston",
  conf: "East",
  div: "Atlantic",
  power: 80,
  star: "",
  note: "",
  tier: "contender",
};

test("HUD: unsigned start shows awaiting the Draft and hides the dummy contract", () => {
  const player = { team: { ...UNSIGNED_TEAM }, league: "NBA", contract: dummy };
  assert.equal(clubLine(player, "it"), "In attesa del Draft");
  assert.equal(clubLine(player, "en"), "Awaiting the Draft");
  assert.equal(clubLine(player, "es"), t("awaitingDraft", "es"));
  assert.equal(clubLine(player, "zh"), t("awaitingDraft", "zh"));
  assert.doesNotMatch(clubLine(player, "it"), /NBA/);
  assert.doesNotMatch(clubLine(player, "en"), /Svincolato|NBA/);
  assert.equal(contractLine(player, "it"), "");
  assert.equal(contractLine(player, "en"), "");
});

test("HUD: expired contract reads as free agent, not 0 years × $…", () => {
  const player = {
    team: celtics,
    league: "NBA",
    contract: { teamName: "Boston Celtics", years: 3, yearsRemaining: 0, annualM: 22, kind: "fa" as const },
  };
  assert.equal(clubLine(player, "en"), "Boston Celtics · NBA");
  assert.equal(contractLine(player, "it"), "Svincolato");
  assert.equal(contractLine(player, "en"), "Free agent");
  assert.doesNotMatch(contractLine(player, "en"), /0 years|\$22/);
  assert.equal(contractLine({ ...player, contract: { ...player.contract, yearsRemaining: 2 } }, "en"), "2 years × $22M");
});

test("HUD: atypical team abbr without a signed deal does not invent a salary", () => {
  // Real jersey, empty teamName, leftover dummy years: hide the dollars.
  const hanging = { team: celtics, league: "NBA", contract: { ...dummy, yearsRemaining: 3, annualM: 4.2 } };
  assert.equal(clubLine(hanging, "en"), "Boston Celtics · NBA");
  assert.equal(contractLine(hanging, "en"), "");
  assert.equal(contractLine(hanging, "it"), "");
  // Real jersey, empty teamName, years already run out: free agent, not a blank or "0 years × $…".
  const expired = { team: celtics, league: "NBA", contract: { ...dummy, yearsRemaining: 0, annualM: 22 } };
  assert.equal(contractLine(expired, "it"), "Svincolato");
  assert.equal(contractLine(expired, "en"), "Free agent");
  assert.doesNotMatch(contractLine(expired, "en"), /0 years|\$22/);
});

test("Italian display: Fuori Elim, parenthetical scores, in sette o meno, nudo", () => {
  assert.equal(
    nx("Fuori Elim. Primo turno 2-4. Ottobre lo sa, anche se tu fai finta di no.", "it"),
    "Eliminato al primo turno (2-4). Ottobre lo sa, anche se tu fai finta di no.",
  );
  assert.equal(
    nx("4-0 (noi–Cleveland Cavaliers, serie) in sette, o meno. Il dito pesa, e la città canta.", "it"),
    "4-0 sui Cleveland Cavaliers. Il dito dell'anello pesa, e la città canta.",
  );
  assert.equal(
    nx("1-4 (noi–Boston Celtics, serie). Si torna a casa con i possessi sbagliati, e nient'altro da dire.", "it"),
    "1-4 contro i Boston Celtics. Si torna a casa con i possessi sbagliati, e nient'altro da dire.",
  );
  assert.equal(
    nx("4-0 (noi–Atlanta Hawks, serie). Il dito pesa, e la città canta.", "it"),
    "4-0 sugli Atlanta Hawks. Il dito dell'anello pesa, e la città canta.",
  );
  assert.equal(
    nx("2-4 (noi–Houston Rockets, serie). Fine.", "it"),
    "2-4 contro gli Houston Rockets. Fine.",
  );
  assert.match(nx("A 34 anni non corri come prima. Chiudi meglio. Il premio è questo, nudo.", "it"), /Il premio è tutto qui/);
  assert.doesNotMatch(nx("A 34 anni non corri come prima. Chiudi meglio. Il premio è questo, nudo.", "it"), IT_NUDO);
  assert.equal(nx("Il lutto, fatto mestiere.", "it"), "Trasformi l'eliminazione in lavoro.");
  assert.equal(nx("Il lutto, a modo tuo.", "it"), "Vivi la sconfitta a modo tuo.");
  assert.equal(nx("L'isolamento è una responsabilità, nuda.", "it"), "In isolamento, tocca solo a te.");
  assert.match(nx("Prima del salto conti un possesso. Poi Portland Trail Blazers, e il resto è mestiere nudo.", "it"), /il resto si decide in campo/);
});

test("English display: no leftover Italian, brackets, or 'in seven, or fewer' after a sweep", async () => {
  assert.doesNotMatch(nx("Svincolato", "en"), /Svincolato/);
  assert.equal(nx("Svincolato", "en"), "Free agent");
  const title = nx("4-0 (noi–Cleveland Cavaliers, serie) in sette, o meno. Il dito pesa, e la città canta.", "en");
  assert.equal(title, "4-0 over the Cleveland Cavaliers. Your ring finger feels heavy, and the city sings.");
  assert.doesNotMatch(title, /\(us vs\.|in seven, or fewer|noi–/);
  assert.match(
    nx("1-4 (noi–Boston Celtics, serie). Si torna a casa con i possessi sbagliati, e nient'altro da dire.", "en"),
    /^1-4 against the Boston Celtics/,
  );
  assert.doesNotMatch(nx("A 34 anni non corri come prima. Chiudi meglio. Il premio è questo, nudo.", "en"), /\bbare\b|nudo/);
  assert.match(nx("A 34 anni non corri come prima. Chiudi meglio. Il premio è questo, nudo.", "en"), /Nothing more/);
  assert.equal(nx("Il lutto, a modo tuo.", "en"), "Take the loss your way.");
  assert.equal(nx("L'isolamento è una responsabilità, nuda.", "en"), "In isolation, it's all on you.");
  assert.equal(nx("Elim. Primo turno 2-4", "en"), "Out in the first round, 2-4");
  assert.equal(playoffResultLabel("Elim. Primo turno 2-4", "en"), "Out in the first round, 2-4");
});

test("playoff score articles: i/gli for every NBA team, over/sui only when the series is won", () => {
  const gli = NBA_TEAMS.filter((team) => nbaNeedsGli(team.name)).map((team) => team.name);
  assert.deepEqual(gli.sort(), [
    "Atlanta Hawks",
    "Houston Rockets",
    "Indiana Pacers",
    "Oklahoma City Thunder",
    "Orlando Magic",
    "Utah Jazz",
  ]);
  for (const team of NBA_TEAMS) {
    const art = italianTeamArticle(team.name);
    assert.ok(art === "i" || art === "gli", team.name);
    const won = formatPlayoffScoreLine("4-0", team.name, "serie", "it");
    const lost = formatPlayoffScoreLine("2-4", team.name, "serie", "it");
    const game = formatPlayoffScoreLine("112-108", team.name, "partita", "it");
    if (art === "gli") {
      assert.equal(won, `4-0 sugli ${team.name}`);
      assert.equal(lost, `2-4 contro gli ${team.name}`);
      assert.equal(game, `112-108 contro gli ${team.name}`);
    } else {
      assert.equal(won, `4-0 sui ${team.name}`);
      assert.equal(lost, `2-4 contro i ${team.name}`);
      assert.equal(game, `112-108 contro i ${team.name}`);
    }
    assert.equal(formatPlayoffScoreLine("4-0", team.name, "serie", "en"), `4-0 over the ${team.name}`);
    assert.equal(formatPlayoffScoreLine("2-4", team.name, "serie", "en"), `2-4 against the ${team.name}`);
    assert.equal(formatPlayoffScoreLine("4-0", team.name, "serie", "es"), `4-0 ante los ${team.name}`);
    assert.equal(formatPlayoffScoreLine("2-4", team.name, "serie", "es"), `2-4 contra los ${team.name}`);
    assert.equal(formatPlayoffScoreLine("4-0", team.name, "serie", "zh"), `4-0击败${team.name}`);
    assert.equal(formatPlayoffScoreLine("2-4", team.name, "serie", "zh"), `2-4，对${team.name}`);
  }
  assert.equal(formatPlayoffScoreLine("3-1", "Olympiacos", "serie", "it"), "3-1 sull'Olympiacos");
  assert.equal(formatPlayoffScoreLine("1-3", "Olympiacos", "serie", "it"), "1-3 contro l'Olympiacos");
  assert.equal(formatPlayoffScoreLine("3-1", "Virtus Bologna", "serie", "it"), "3-1 sulla Virtus Bologna");
});

test("rendered careers: no leftover tokens, no nudo in Italian, no Italian leaks in EN/ES/ZH", () => {
  const bad: string[] = [];
  for (let i = 0; i < 24; i++) {
    const seed = 91000 + 13 * i;
    const playerName = seed % 3 === 0 ? "Il Rookie" : "Marco Ferrara";
    const stripName = (s: string) => s.replaceAll(playerName, "NAME");
    for (const s of playCareerTexts(seed, "pro")) {
      const it = nx(s.text, "it");
      const en = nx(s.text, "en");
      const es = nx(s.text, "es");
      const zh = nx(s.text, "zh");
      const rawScan = [it, en, es, zh, s.text].map(stripName);
      if (rawScan.some((line) => RAW.test(line))) bad.push(`token ${seed} ${s.where}: ${s.text.slice(0, 100)}`);
      // "Il Rookie" is the harness player name on some seeds, and "Il Rookie of the Year" is the award.
      // After stripping the name, any other "Il Rookie" is a leaked default.
      if (rawScan.some((line) => /Il Rookie(?! of the Year)/.test(line))) bad.push(`Il Rookie ${seed} ${s.where}: ${s.text.slice(0, 100)}`);
      if (IT_NUDO.test(it) || IT_LEAK.test(it)) bad.push(`it ${seed} ${s.where}: ${it.slice(0, 120)}`);
      if (EN_BAD.test(en)) bad.push(`en ${seed} ${s.where}: ${en.slice(0, 120)}`);
      if (ES_ZH_LEAK.test(es)) bad.push(`es ${seed} ${s.where}: ${es.slice(0, 120)}`);
      if (ES_ZH_LEAK.test(zh)) bad.push(`zh ${seed} ${s.where}: ${zh.slice(0, 120)}`);
    }
  }
  assert.deepEqual(bad.slice(0, 15), []);
});

/* Same seeds and hash as engine-invariants.test.ts GOLDEN (live 2.24). A display-only
   change must not move these; an engine change must update both pins on purpose. */
const INVARIANT_GOLDEN = ["34f34b4458745985", "e9b12be7132f6760", "b5651d6dbbf16910"];
const DIFFS = ["esordio", "pro", "allstar", "leggenda"] as const;
const PATHS = ["NCAA", "Europa", "G-League"] as const;
const DRAFTS = ["random", "best", "worst", "mixed"] as const;
function invariantOpts(i: number): SimOpts {
  return { seed: (i * 7919) >>> 0, difficulty: DIFFS[i % 4], path: PATHS[i % 3], draft: DRAFTS[(i >> 2) % 4] };
}

test("same seed still yields the engine-invariants GOLDEN career fingerprints", () => {
  resetRules();
  const hash = (o: SimOpts) => createHash("sha256").update(fingerprint(playCareerSim(o))).digest("hex").slice(0, 16);
  assert.deepEqual([invariantOpts(1), invariantOpts(2), invariantOpts(3)].map(hash), INVARIANT_GOLDEN);
});
