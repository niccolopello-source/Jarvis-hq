import assert from "node:assert/strict";
import test from "node:test";
import { NBA_TEAMS } from "../teams.ts";
import { agreeTeamsEn } from "./agreement.ts";
import { playCareerTexts } from "./harness.ts";
import { loadNarrativeEn, nx } from "./index.ts";

/* Copy review 2026-10-11 (Bible §7.1): grammar guards on text the player actually reads. */

await loadNarrativeEn();

test("English treats NBA team names as plural subjects, and only as subjects", () => {
  assert.equal(agreeTeamsEn("Indiana Pacers hands you the ball."), "Indiana Pacers hand you the ball.");
  assert.equal(agreeTeamsEn("The series slips away. Detroit Pistons was more ready tonight."), "The series slips away. Detroit Pistons were more ready tonight.");
  assert.equal(agreeTeamsEn("Miami Heat isn't waiting, and Boston Celtics wants you."), "Miami Heat aren't waiting, and Boston Celtics want you.");
  assert.equal(agreeTeamsEn("Utah Jazz pushes the pace."), "Utah Jazz push the pace.");
  // Not a subject, or not an NBA plural: unchanged.
  assert.equal(agreeTeamsEn("Staying with Boston Celtics is one door."), "Staying with Boston Celtics is one door.");
  assert.equal(agreeTeamsEn("You leave Boston Celtics for Miami Heat."), "You leave Boston Celtics for Miami Heat.");
  assert.equal(agreeTeamsEn("Real Madrid wants you."), "Real Madrid wants you.");
});

test("a one-sentence template ending on a slot does not swallow the next sentence", () => {
  const it = "La piazza di Memphis ha una voce. Quest'anno la senti anche quando il palazzetto è mezzo vuoto.";
  assert.equal(nx(it, "en"), "The Memphis crowd has a voice. This year you hear it even when the arena is half empty.");
});

const TEAMS = NBA_TEAMS.map((t) => t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
const CHECKS: [string, "it" | "en", RegExp][] = [
  ["it plural after 1", "it", /(?<![\d.,])\b1 (stagioni|anni|partite|titoli|premi|scelte|volte)\b/],
  ["it singular after 2+", "it", /\b([2-9]|\d{2,}) (stagione|anno|partita|titolo|premio|volta)\b/],
  ["en plural after 1", "en", /(?<![\d.,])\b1 (seasons|years|games|titles|awards|times)\b/],
  ["en singular after 2+", "en", /\b([02-9]|\d{2,}) (season|year|game|title|award|time)\b(?!-)/],
  ["en team + singular verb", "en", new RegExp(`(^|[.!?]\\s+)(${TEAMS}) (is|was|has|wants|hands|asks|offers|keeps|knows|signs|takes|gives)\\b`)],
  ["slot swallowed a sentence", "en", /\. [a-z]+\.?$|\bThe (?:Memphis|Boston|Miami|Denver|Phoenix) has a voice/],
  ["unfilled slot", "it", /\{[\w$]+\}|undefined|NaN|\[object/],
  ["unfilled slot", "en", /\{[\w$]+\}|undefined|NaN|\[object/],
  ["double punctuation", "it", /(?<!\.)\.\.(?!\.)|,,|\.,|,\./],
  ["double punctuation", "en", /(?<!\.)\.\.(?!\.)|,,|\.,|,\./],
];

test("rendered careers in Italian and English pass the copy checks", () => {
  const bad = new Map<string, string>();
  let seen = 0;
  for (const d of ["esordio", "leggenda"] as const) {
    for (let i = 1; i <= 10; i++) {
      for (const x of playCareerTexts(i * 101 + 7, d)) {
        const text = { it: x.text, en: nx(x.text, "en") };
        seen++;
        for (const [name, lang, re] of CHECKS) if (re.test(text[lang]) && !bad.has(name)) bad.set(name, `${x.where}: ${text[lang].slice(0, 160)}`);
      }
    }
  }
  assert.ok(seen > 5000, `only ${seen} rendered strings`);
  assert.deepEqual([...bad], []);
});

/* Copy review IT/EN 2026-10-13: English is rewritten by meaning; the Italian source (stored in saves) is untouched. */
test("copy review 2026-10-13: priority narrative lines read as idiomatic English", () => {
  const cases: [string, string][] = [
    ["Il primo tempo morto perso", "The first timeout that's on you"],
    ["Parla il campo, non la voce.", "Let your game do the talking."],
    ["Una gara da 40 punti, zero vittoria", "40 points in a loss"],
    ["Meno gioco in post, più transizione. I tifosi comprano le schiacciate.", "Less post play, more transition. Dunks sell tickets."],
    ["Studi i possessi sul tavolino", "You study film on the tray table"],
    ["Meno possessi, più senso. I giovani ascoltano.", "Fewer touches, more meaning. The young guys listen."],
    ["Durare è già un mestiere.", "Lasting is a skill in itself."],
  ];
  for (const [it, en] of cases) {
    assert.equal(nx(it, "it"), it);
    assert.equal(nx(it, "en"), en);
  }
});

test("copy review 2026-10-13: 'craft' is no longer the default for il mestiere", async () => {
  const { NARRATIVE_EN } = await import("./catalog-en.ts");
  const left = Object.entries(NARRATIVE_EN).filter(([, v]) => /\bcraft\b/i.test(v)).map(([k]) => k);
  // Two lines are still open as NEEDS SEMANTIC VERIFICATION in the register.
  assert.ok(left.length <= 2, left.join(" | "));
  for (const v of Object.values(NARRATIVE_EN)) {
    assert.doesNotMatch(v, /Fans buy dunks|zero win\b|first lost timeout|not your mouth|playoff doors/i);
  }
});
