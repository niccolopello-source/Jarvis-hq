import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fingerprintOf, sha256 } from "./card";
import { playCareerSim, toArchive } from "./engine";
import { careerBust } from "./bust";
import { buildLegacyReport, cardFaceOf, legacyFactsOf, sanitizeLegacyFacts, withLegacyFacts } from "./legacy-report";
import { legacyKeys, narrativeOf, timelineLine } from "./legacy-i18n";
import { CARD_THEMES, CARD_THEME_KEY, checkout, COSMETIC_FLAGS, isUsableTheme, loadCardTheme, saveCardTheme, visibleThemes } from "./cosmetics";
import type { ArchiveCareer } from "./types";

// Seeds 1..40 consecutively: no hand-picked seeds.
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

function careerOf(seed: number) {
  const s = playCareerSim({ seed });
  return { s, entry: withLegacyFacts(toArchive(s), s) };
}

const stateHash = (seed: number) => {
  const s = playCareerSim({ seed });
  const copy = { ...s, careerId: "" };
  return sha256(JSON.stringify(copy));
};

test("report numbers come from the career, not a second engine", () => {
  for (const seed of SEEDS) {
    const { s, entry } = careerOf(seed);
    const r = buildLegacyReport(entry);
    assert.equal(r.seasons, s.seasonHistory.length);
    assert.deepEqual(r.averages, { ppg: entry.card!.ppg, rpg: entry.card!.rpg, apg: entry.card!.apg });
    assert.equal(r.totals.points, s.careerPoints);
    assert.equal(r.totals.rebounds, s.careerRebounds);
    assert.equal(r.totals.games, s.seasonHistory.reduce((a, x) => a + x.gp, 0));
    assert.equal(r.titles, s.titleCount);
    assert.equal(r.number, s.number);
    const last = s.seasonHistory.at(-1)!;
    assert.equal(r.ageEnd, last.age, `ageEnd ${seed}`);
    assert.equal(r.ageEnd, entry.card!.ageEnd, `card ageEnd ${seed}`);
    assert.equal(r.lastYear, last.yearLabel);
    assert.equal(r.timeline.at(-1)!.value, last.age);
    assert.equal(r.draftPick, s.draftPick);
    assert.equal(r.bust, careerBust(s).bust, `bust ${seed}`);
    // Awards: counts equal the recorded season awards, nothing invented.
    const recorded = new Map<string, number>();
    for (const row of s.seasonHistory) for (const a of row.awards) recorded.set(a, (recorded.get(a) ?? 0) + 1);
    for (const [id, n] of r.awards) {
      if (id === "Rookie of the Year" && !recorded.has(id)) assert.equal(s.roy, true);
      else assert.equal(n, recorded.get(id), `${seed} ${id}`);
    }
    assert.equal(r.awards.filter(([id]) => id === "All-Star")[0]?.[1] ?? 0, s.allStarCount, `allstar ${seed}`);
    assert.equal(r.regular.wins, s.seasonHistory.reduce((a, x) => a + x.wins, 0));
    assert.equal(r.titles, s.seasonHistory.filter((x) => x.playoff === "Campione").length, `titles ${seed}`);
    // Records are real seasons.
    for (const rec of r.records) assert.ok(s.seasonHistory.some((row) => row.yearLabel === rec.yearLabel && row.teamAbbr === rec.teamAbbr));
    // Card face uses the same report.
    const face = cardFaceOf(r);
    assert.deepEqual(face.averages, r.averages);
    assert.equal(face.titles, r.titles);
  }
});

test("timeline has no duplicates and is in season order", () => {
  for (const seed of SEEDS) {
    const r = buildLegacyReport(careerOf(seed).entry);
    const keys = r.timeline.map((x) => `${x.kind}|${x.subject}|${x.yearLabel}`);
    assert.equal(new Set(keys).size, keys.length);
    const awards = r.timeline.filter((x) => x.kind === "award").map((x) => x.subject);
    assert.equal(new Set(awards).size, awards.length);
    const idx = r.timeline.map((x) => r.rows.findIndex((row) => row.yearLabel === x.yearLabel));
    assert.deepEqual([...idx].sort((a, b) => a - b), idx);
    assert.equal(r.timeline.at(-1)?.kind, "retire");
  }
});

test("narrative and labels read naturally in Italian and English", () => {
  const bad = /undefined|NaN|null|\{\w+\}|\s[,.]|\.\.| {2}/;
  const italian = /\b(stagion[ei]|squadr[ae]|scelta|titol[oi]|con una)\b/i;
  for (const seed of SEEDS) {
    const r = buildLegacyReport(careerOf(seed).entry);
    for (const lang of ["it", "en"] as const) {
      const lines = [...narrativeOf(r, lang), ...r.timeline.map((x) => timelineLine(x, lang))];
      for (const line of lines) {
        assert.doesNotMatch(line, bad, `${seed} ${lang}: ${line}`);
        if (lang === "en") assert.doesNotMatch(line, italian, `${seed}: ${line}`);
        assert.match(line, /^[A-Z0-9ÀÈÉÌÒÙ]/u, line);
      }
      if (lang === "en") for (const line of narrativeOf(r, lang)) assert.doesNotMatch(line, /the the|(^|[^0-9])1 seasons|(^|[^0-9])1 teams/);
      if (lang === "it") for (const line of narrativeOf(r, lang)) assert.doesNotMatch(line, /(^|[^0-9])1 stagioni|(^|[^0-9])1 squadre/);
    }
  }
  const k = legacyKeys();
  assert.deepEqual(k.en, k.it);
});

test("a legacy entry without facts omits fields instead of guessing", () => {
  const { entry } = careerOf(7);
  const old: ArchiveCareer = { ...entry, choices: [] };
  delete old.legacy;
  const r = buildLegacyReport(old);
  assert.equal(r.number, null);
  assert.equal(r.draftPick, null);
  assert.equal(r.bust, null, "no draft pick → bust not evaluated");
  assert.equal(r.draftTeam, null);
  assert.equal(r.totals.points, undefined);
  assert.equal(r.timeline.some((x) => x.kind === "draft"), false);
  for (const lang of ["it", "en"] as const) for (const line of narrativeOf(r, lang)) assert.doesNotMatch(line, /undefined|null|NaN/);
  // No card at all: averages are omitted, not zero.
  const bare: ArchiveCareer = { ...old };
  delete bare.card;
  assert.equal(buildLegacyReport(bare).averages, null);
});

test("damaged legacy facts lose only the bad parts", () => {
  assert.equal(sanitizeLegacyFacts(null), null);
  assert.equal(sanitizeLegacyFacts({ v: 2 }), null);
  const f = sanitizeLegacyFacts({ v: 1, number: "23", draftPick: 99, points: -4, rebounds: 812, roleCode: "XX", draftTeam: "Utah Jazz" });
  assert.deepEqual(f, { v: 1, rebounds: 812, draftTeam: "Utah Jazz" });
});

test("legacy facts do not change the card, its fingerprint or the player", () => {
  const s = playCareerSim({ seed: 11 });
  const before = JSON.stringify(s);
  const plain = toArchive(s);
  const rich = withLegacyFacts(plain, s);
  assert.equal(JSON.stringify(s), before);
  assert.deepEqual(rich.card, plain.card);
  assert.equal(rich.fingerprint, plain.fingerprint);
  assert.equal(fingerprintOf(rich.card!), rich.fingerprint);
  assert.deepEqual(legacyFactsOf(s), rich.legacy);
});

test("legacy facts survive a JSON round trip as stored in the archive", () => {
  const { entry } = careerOf(29930);
  const back = JSON.parse(JSON.stringify(entry)) as ArchiveCareer;
  assert.deepEqual(buildLegacyReport(back), buildLegacyReport(entry));
});

test("no theme alters the simulation: same seed, same state hash, same fingerprint", () => {
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  for (const seed of [7, 29930]) {
    const baseline = stateHash(seed);
    const card = careerOf(seed).entry.fingerprint;
    for (const theme of CARD_THEMES) {
      saveCardTheme(theme.id, store);
      assert.equal(stateHash(seed), baseline, `${theme.id} changed the state`);
      const { entry } = careerOf(seed);
      assert.equal(entry.fingerprint, card);
      assert.equal(JSON.stringify(entry).includes(theme.id === "standard" ? "\"theme\"" : theme.id), false);
    }
  }
});

test("cosmetic modules never import the engine, RNG or sporting state writers", () => {
  for (const file of ["cosmetics.ts", "legacy-report.ts", "legacy-i18n.ts"]) {
    const src = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    assert.doesNotMatch(src, /from "\.\/(engine|rng|world|tuning|config|summer|league)"/, file);
  }
  const ui = readFileSync(new URL("../../components/pivot/legacy/LegacyExperience.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(ui, /lib\/pivot\/(engine|rng|world|tuning|config)"/);
});

test("catalog: standard is free, prototypes are hidden and cannot be bought or kept", () => {
  assert.equal(COSMETIC_FLAGS.previewCatalog, false);
  assert.equal(COSMETIC_FLAGS.storefront, false);
  assert.deepEqual(visibleThemes().map((t) => t.availability), visibleThemes().map(() => "free"));
  assert.ok(visibleThemes().some((t) => t.id === "standard"));
  assert.ok(visibleThemes({ previewCatalog: true, storefront: false }).some((t) => t.availability === "prototype"));
  for (const t of CARD_THEMES) {
    const r = checkout(t.id);
    assert.equal(r.ok, false);
    assert.equal(isUsableTheme(t.id), t.availability === "free");
    // No price or provider fields anywhere in the catalog.
    assert.doesNotMatch(JSON.stringify(t), /price|eur|usd|stripe|paypal|sku|rarity|unique|authentic/i);
  }
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  assert.equal(saveCardTheme("parquet", store), false);
  assert.equal(loadCardTheme(store), "standard");
  assert.equal(saveCardTheme("obsidian", store), true);
  assert.equal(mem.get(CARD_THEME_KEY), "obsidian");
  assert.equal(loadCardTheme(store), "obsidian");
  mem.set(CARD_THEME_KEY, "bronze-frame");
  assert.equal(loadCardTheme(store), "standard");
  assert.equal(loadCardTheme({ getItem: () => { throw new Error("blocked"); } }), "standard");
});
