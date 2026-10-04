/**
 * Test-only: plays careers through the same engine calls the screen makes and collects every
 * string the player can read (story cards, choices, outcomes, recaps, playoffs, market, summer,
 * league tables, finale, archive). Coverage tests feed these texts to the translator.
 * The harness has its own RNG streams; it never touches a real save.
 */
import {
  acceptForcedPreseasonTrade,
  acceptOffer,
  acceptTrade,
  allDraftRounds,
  applyAutoOffseason,
  applyDraftCard,
  applyFx,
  beginPlayoffs,
  buildFaOffers,
  buildTradeOffer,
  eventAfterMarket,
  fillTemplate,
  finishDraft,
  freshPlayer,
  hiddenHints,
  isContractYear,
  offseasonStep,
  pickPlayoffOpponent,
  pickStoryEvent,
  playoffChoicesFor,
  playoffRounds,
  qualifiesPlayoffs,
  refreshOverall,
  refuseTrade,
  resolvePlayoffRound,
  revealDraftLanding,
  scaledDraftCard,
  scriptedSeasonEvent,
  shouldForceTrade,
  shouldOfferTrade,
  simulateRegularSeason,
  startProPath,
  storyEventById,
  tickContract,
  toArchive,
  verdictOf,
} from "../engine.ts";
import { careerCommentary, hofLabel, palmares } from "../legacy.ts";
import { settleYearTitle } from "../league.ts";
import { COACH_NAMES, NATIONALITIES, RIVAL_NAMES, STORY_POOL } from "../data.ts";
import { doorLine, faDeskLine, noAwardLine, pathFeel, playoffNerves, draftWho, summerFeel } from "../feel.ts";
import { personalAwardBrief } from "../awards-helpers.ts";
import { createRng, pick, randInt, runWithRng } from "../rng.ts";
import { CHARACTER_ROUNDS } from "../draft-character.ts";
import { endSentence, tidyText } from "../../../components/pivot/presentation.ts";
import type { DifficultyId, PlayerState, Role, SeasonRow } from "../types.ts";

export type Seen = { where: string; text: string };

const ROLES_ALL: Role[] = ["PG", "SG", "SF", "PF", "C"];
const PATHS = ["NCAA", "Europa", "G-League"] as const;
const DIFFS: DifficultyId[] = ["esordio", "pro", "allstar", "leggenda"];

function withOvr(text: string, before: number, after: number) {
  const b = Math.round(before);
  const a = Math.round(after);
  const d = a - b;
  if (d === 0) return tidyText(text);
  return tidyText(`${text} Overall ${b} → ${a} (${d > 0 ? "+" : ""}${d}).`);
}

function rowTexts(out: Seen[], row: SeasonRow) {
  const add = (where: string, text: unknown) => typeof text === "string" && text && out.push({ where, text });
  add("row.team", row.team);
  add("row.playoff", row.playoff);
  add("row.mood", row.mood);
  row.awards.forEach((a) => {
    add("row.award", a);
    add("award.brief", personalAwardBrief(row, a));
  });
  row.seriesLog?.forEach((sr) => add("series.label", sr.label));
  const lg = row.league;
  if (lg) {
    lg.awards.forEach((a) => {
      add("league.award", a.title);
      add("league.awardNote", a.note);
    });
    lg.leaders.forEach((l) => add("league.leader", l.stat));
    [...lg.east, ...lg.west, ...lg.euro].forEach((r) => {
      add("standing.note", r.note);
      add("standing.city", r.city);
    });
    lg.mvpBoard?.forEach((v) => add("vote.line", v.line));
    lg.nbaBoard?.forEach((v) => add("vote.line", v.line));
  }
}

/** One career played the way the screen plays it, with a seeded chooser. */
export function playCareerTexts(seed: number, difficulty: DifficultyId = "pro"): Seen[] {
  const out: Seen[] = [];
  const add = (where: string, text: unknown) => typeof text === "string" && text && out.push({ where, text });
  const rng = createRng(seed);
  runWithRng(rng, () => {
    const role = pick(ROLES_ALL);
    const nat = pick(NATIONALITIES).id;
    const s: PlayerState = freshPlayer(seed % 3 === 0 ? "Il Rookie" : "Marco Ferrara", role, nat, randInt(0, 99), difficulty, seed);
    s.rivalName = pick(RIVAL_NAMES);
    s.coachName = pick(COACH_NAMES);
    refreshOverall(s);
    const rounds = allDraftRounds();
    for (let r = 0; r < rounds.length; r++) {
      s.draftHand.forEach((c) => {
        const card = scaledDraftCard(s.role, c);
        add("draft.card", card.name);
        add("draft.desc", card.desc);
      });
      applyDraftCard(s, r, randInt(0, Math.max(0, s.draftHand.length - 1)));
    }
    finishDraft(s);
    add("intro", `Il Draft si avvicina. ${s.name}, ${draftWho(s.role, s.nationality)}, deve scegliere i primi passi da professionista.`);
    const path = pick([...PATHS]);
    const before0 = s.overall;
    startProPath(s, path);
    const land = revealDraftLanding(s);
    add("call.flavor", `${pathFeel(path, s.team.name, s)} Sei la ${land.pick}ª scelta. Contratto: ${s.contract.years} ${s.contract.years === 1 ? "anno" : "anni"} a ${s.contract.annualM} milioni.`);
    add("path.body", `${path}. Il mestiere si è mosso: overall ${before0} → ${s.overall}. Poi squilla il telefono: ${land.pick}ª scelta, ${s.team.name}.`);
    add("team.note", s.team.note);
    for (let n = 1; n <= 20; n++) {
      s.season = n;
      let ev = scriptedSeasonEvent(s, n);
      if (ev && !s.usedEventIds.includes(ev.id)) s.usedEventIds.push(ev.id);
      if (!ev && shouldOfferTrade(s, n) && n !== 12) {
        const t = buildTradeOffer(s);
        add("trade.pitch", t.pitch);
        const before = s.overall;
        if (shouldForceTrade(s)) {
          const from = acceptForcedPreseasonTrade(s, t.team, n);
          add("trade.forced", `La dirigenza ha deciso: da ${from} a ${t.team.name}. ${t.pitch}`);
        } else if (randInt(0, 1)) {
          const old = acceptTrade(s, t.team);
          add("trade.yes", withOvr(`Lo scambio si fa: da ${old} a ${s.team.name}.`, before, s.overall));
        } else {
          refuseTrade(s);
          add("trade.no", withOvr(`Rifiuti. Resti a ${s.team.name}, che apprezza la fedeltà.`, before, s.overall));
        }
        ev = eventAfterMarket(s).event;
      }
      ev ??= pickStoryEvent(s, n);
      add("story.title", fillTemplate(ev.title, s));
      add("story.subtitle", fillTemplate(ev.subtitle, s));
      ev.choices.forEach((c) => {
        add("story.label", fillTemplate(c.label, s));
        add("story.detail", fillTemplate(c.detail, s));
      });
      const ch = pick(ev.choices);
      const before = s.overall;
      const fx = ch.fx(s);
      applyFx(s, fx);
      add("story.flavor", withOvr(fillTemplate(fx.flavor, s), before, s.overall));
      const row = simulateRegularSeason(s, n);
      rowTexts(out, row);
      const qualified = qualifiesPlayoffs(s, row);
      if (!row.awards.length) add("recap.noAward", noAwardLine(s));
      add("recap.door", qualified ? (row.seed ? doorLine(s, "in-seed", row.seed, row.conf) : doorLine(s, "in")) : doorLine(s, "out"));
      if (qualified) {
        beginPlayoffs(s);
        const rounds2 = playoffRounds(s);
        for (let round = 0; round < rounds2.length; round++) {
          const opp = pickPlayoffOpponent(s, round);
          add("playoff.round", rounds2[round]);
          add("playoff.nerves", playoffNerves(s, rounds2[round] || "Playoff", opp.name));
          const choices = playoffChoicesFor(s, round);
          choices.forEach((c) => {
            add("playoff.label", c.label);
            add("playoff.detail", c.detail);
          });
          const b = s.overall;
          const res = resolvePlayoffRound(s, n, round, randInt(0, Math.max(0, choices.length - 1)), opp);
          add("playoff.flavor", withOvr(res.flavor, b, s.overall));
          if (res.series) add("series.label", res.series.label);
          if (res.champion || !res.win) break;
        }
      } else {
        row.playoff = "Fuori";
        settleYearTitle(s, false);
      }
      rowTexts(out, row);
      const step = offseasonStep(s);
      if (step === "finish") break;
      if (step === "offer") s.extraSeason = true;
      const dev = applyAutoOffseason(s, n);
      add("summer.label", dev.label);
      add("summer.line", dev.line);
      add("summer.result", withOvr(`${endSentence(summerFeel(s, dev.label))} ${dev.line || "Mantenimento"}.`, dev.before, dev.after));
      tickContract(s);
      if (isContractYear(s, n + 1) || s.contract.yearsRemaining <= 0) {
        const offers = buildFaOffers(s);
        add("fa.desk", faDeskLine(s, offers.some((o) => o.kind === "extension"), s.team.name));
        offers.forEach((o) => add("fa.pitch", o.pitch));
        if (offers.length) {
          const offer = pick(offers);
          const b = s.overall;
          const old = acceptOffer(s, offer);
          add("fa.result", withOvr(old === s.team.name ? `Resti a ${s.team.name}: ${offer.years} anni a $${offer.annualM}M a stagione.` : `Lasci ${old} per ${s.team.name}: ${offer.years} anni a $${offer.annualM}M a stagione.`, b, s.overall));
        }
      } else if (dev.tradeDest) {
        add("summer.trade", dev.line || `${dev.tradeDest.name} è sul foglio. Puoi salire o restare.`);
        add("summer.trade", `${dev.tradeDest.city} ha chiuso senza chiederti il permesso.`);
      }
    }
    hiddenHints(s).forEach((h) => add("hints", h));
    s.milestones.forEach((m) => add("milestone", m.label));
    s.devLog.forEach((d) => {
      add("dev.label", d.label);
      add("dev.line", d.line);
    });
    s.choiceLog.forEach((c) => {
      add("choice.title", c.title);
      add("choice.pick", c.pick);
    });
    s.world?.events.forEach((e) => add("world.event", e.text));
    const v = verdictOf(s);
    add("verdict", v.verdict);
    add("closing", v.closing);
    add("commentary", careerCommentary(s));
    const p = palmares(s);
    add("hof", p.hofLabel);
    add("hof", hofLabel(p.hof));
    const a = toArchive(s);
    add("archive.role", a.role);
    add("archive.verdict", a.verdict);
  });
  return out;
}

/** Every story card in the pools, as several different players would see it. */
export function storyPoolTexts(): Seen[] {
  const out: Seen[] = [];
  const add = (where: string, text: unknown) => typeof text === "string" && text && out.push({ where, text });
  const rng = createRng(4242);
  runWithRng(rng, () => {
    for (const [i, role] of ROLES_ALL.entries()) {
      const s = freshPlayer("Marco Ferrara", role, NATIONALITIES[i * 3]!.id, 23, DIFFS[i % 4]!, 900 + i);
      s.rivalName = RIVAL_NAMES[i]!;
      s.coachName = COACH_NAMES[i]!;
      startProPath(s, PATHS[i % 3]!);
      revealDraftLanding(s);
      for (const age of [21, 27, 34]) {
        s.age = age;
        for (const ev of STORY_POOL) {
          add("pool.title", fillTemplate(ev.title, s));
          add("pool.subtitle", fillTemplate(ev.subtitle, s));
          for (const c of ev.choices) {
            add("pool.label", fillTemplate(c.label, s));
            add("pool.detail", fillTemplate(c.detail, s));
            add("pool.flavor", fillTemplate(c.fx(structuredClone(s)).flavor, s));
          }
        }
        const ids: [string | undefined, string | undefined][] = [
          [undefined, "rookie"], [undefined, "rival"], [undefined, "injury"], [undefined, "nation"], [undefined, "late"], [undefined, "quiet"],
          ...["corpo", "sfida", "contratto", "freddo", "caldo", "panchina", "anni", "numeri", "ruolo"].map((k) => [`proc-${k}-${age}`, undefined] as [string, undefined]),
        ];
        for (const [id, script] of ids) {
          const ev = storyEventById(s, id, script as never);
          add("script.title", fillTemplate(ev.title, s));
          add("script.subtitle", fillTemplate(ev.subtitle, s));
          ev.choices.forEach((c) => {
            add("script.label", fillTemplate(c.label, s));
            add("script.detail", fillTemplate(c.detail, s));
            add("script.flavor", fillTemplate(c.fx(structuredClone(s)).flavor, s));
          });
        }
      }
    }
    for (const r of CHARACTER_ROUNDS) {
      add("character", r.label);
      add("character", r.prompt);
      r.cards.forEach((c) => {
        add("character", c.name);
        add("character", c.desc);
      });
    }
  });
  return out;
}
