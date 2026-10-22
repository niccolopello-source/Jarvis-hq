/**
 * Career Legacy Report: a read-only view over a finished, archived career.
 *
 * Rules (Missione 2):
 * - Everything here is derived from the archived career (ArchiveCareer + its card) and from the
 *   optional `legacy` facts copied from PlayerState at archive time. No parallel stats engine:
 *   averages come from the card the engine already computed, totals from the engine counters.
 * - A missing fact is omitted (null / empty list), never guessed.
 * - Nothing here imports the engine or touches RNG, formulas or the saved sporting state.
 */
import type { ArchiveCareer, PlayerState, Role, SeasonRow } from "./types";
import { careerBust } from "./bust";
import { ROLES } from "./data";
import { isUnsigned } from "./teams";

/** Facts copied verbatim from the finished PlayerState. Additive, optional archive field. */
export interface LegacyFacts {
  v: 1;
  number?: number;
  nationality?: string;
  roleCode?: Role;
  draftPick?: number;
  draftTeam?: string;
  originPath?: string;
  points?: number;
  rebounds?: number;
  assists?: number;
  steals?: number;
  blocks?: number;
  allNba?: number;
  dpoy?: number;
  fmvp?: number;
  roy?: boolean;
  medal?: boolean;
}

const DRAFT_RE = /^(\d{1,2})ª(?: · (.+))?$/;

function draftFromChoices(choices: ArchiveCareer["choices"]): { pick?: number; team?: string } {
  const c = choices.find((x) => x.season === 0 && x.title === "Chiamata");
  const m = c ? DRAFT_RE.exec(c.pick.trim()) : null;
  if (!m) return {};
  const pick = Number(m[1]);
  return { pick: pick >= 1 && pick <= 60 ? pick : undefined, team: m[2]?.trim() || undefined };
}

/** Copies facts from the finished player. Pure: does not mutate the player. */
export function legacyFactsOf(s: PlayerState): LegacyFacts {
  const fromLog = draftFromChoices(s.choiceLog);
  const pick = s.draftPick >= 1 && s.draftPick <= 60 ? s.draftPick : fromLog.pick;
  const facts: LegacyFacts = {
    v: 1,
    number: s.number,
    nationality: s.nationality,
    roleCode: s.role,
    draftPick: pick,
    draftTeam: fromLog.team,
    originPath: s.originPath || undefined,
    points: s.careerPoints,
    rebounds: s.careerRebounds,
    assists: s.careerAssists,
    steals: s.careerSteals,
    blocks: s.careerBlocks,
    allNba: s.allNbaCount,
    dpoy: s.dpoyCount,
    fmvp: s.fmvpCount,
    roy: s.roy,
    medal: s.medal,
  };
  return sanitizeLegacyFacts(facts) ?? { v: 1 };
}

/** Archive entry with the legacy facts attached. The card and its fingerprint are untouched. */
export function withLegacyFacts(entry: ArchiveCareer, s: PlayerState): ArchiveCareer {
  return { ...entry, legacy: legacyFactsOf(s) };
}

const nonNegInt = (v: unknown, max = 1e7) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v) : undefined;
const shortStr = (v: unknown) => (typeof v === "string" && v.trim() && v.length <= 80 ? v.trim() : undefined);

/** Reads the optional field defensively: a damaged value loses only the bad parts. */
export function sanitizeLegacyFacts(raw: unknown): LegacyFacts | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.v !== 1) return null;
  const pick = nonNegInt(r.draftPick, 60);
  const num = nonNegInt(r.number, 99);
  const out: LegacyFacts = {
    v: 1,
    number: num,
    nationality: shortStr(r.nationality),
    roleCode: typeof r.roleCode === "string" && r.roleCode in ROLES ? (r.roleCode as Role) : undefined,
    draftPick: pick && pick >= 1 ? pick : undefined,
    draftTeam: shortStr(r.draftTeam),
    originPath: shortStr(r.originPath),
    points: nonNegInt(r.points),
    rebounds: nonNegInt(r.rebounds),
    assists: nonNegInt(r.assists),
    steals: nonNegInt(r.steals),
    blocks: nonNegInt(r.blocks),
    allNba: nonNegInt(r.allNba, 40),
    dpoy: nonNegInt(r.dpoy, 40),
    fmvp: nonNegInt(r.fmvp, 40),
    roy: typeof r.roy === "boolean" ? r.roy : undefined,
    medal: typeof r.medal === "boolean" ? r.medal : undefined,
  };
  for (const k of Object.keys(out) as (keyof LegacyFacts)[]) if (out[k] === undefined) delete out[k];
  return out;
}

export interface Stint {
  team: string;
  abbr: string;
  color: string;
  secondary: string;
  from: string;
  to: string;
  seasons: number;
}

export interface RecordLine {
  key: "ppg" | "rpg" | "apg" | "spg" | "bpg" | "per" | "wins";
  value: number;
  yearLabel: string;
  teamAbbr: string;
}

export type TimelineKind = "draft" | "debut" | "move" | "award" | "title" | "finals" | "best" | "retire";

export interface TimelineItem {
  kind: TimelineKind;
  yearLabel: string;
  /** Team name (move/debut/draft), award id (award), or empty. Rendered by the view. */
  subject: string;
  /** Draft pick, season PPG, … depending on kind. */
  value?: number;
}

export interface LegacyReport {
  name: string;
  number: number | null;
  roleCode: Role | null;
  roleLabel: string;
  nationality: string | null;
  originPath: string | null;
  draftPick: number | null;
  draftTeam: string | null;
  firstYear: string | null;
  lastYear: string | null;
  ageStart: number | null;
  ageEnd: number | null;
  seasons: number;
  stints: Stint[];
  averages: { ppg: number; rpg: number; apg: number } | null;
  totals: { games: number; points?: number; rebounds?: number; assists?: number; steals?: number; blocks?: number };
  regular: { wins: number; losses: number; playoffYears: number; nbaSeasons: number };
  titles: number;
  finals: number;
  deepest: string | null;
  peak: number;
  /** Award id → count, in first-won order. Only from recorded season awards and engine flags. */
  awards: [string, number][];
  records: RecordLine[];
  timeline: TimelineItem[];
  rows: SeasonRow[];
  verdict: string;
  closing: string;
  engineVersion: string | null;
  simulated: boolean;
  /**
   * D-08 bust label (end of career only). null = not evaluated (no draft pick on the archive).
   * Derived via careerBust() from draft pick, All-Star count and starter seasons; never invents data.
   */
  bust: boolean | null;
}

function roleCodeOf(entry: ArchiveCareer, facts: LegacyFacts | null): Role | null {
  if (facts?.roleCode) return facts.roleCode;
  const hit = (Object.keys(ROLES) as Role[]).find((r) => r === entry.role || ROLES[r].label === entry.role);
  return hit ?? null;
}

/** A stored team colour is only used if it is a hex string: a damaged archive row must not break the Career Card. */
const hexOr = (v: unknown, fallback: string) => (typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v) ? v : fallback);

export function stintsOf(rows: SeasonRow[]): Stint[] {
  const out: Stint[] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.abbr === r.teamAbbr) {
      last.to = r.yearLabel;
      last.seasons += 1;
    } else {
      const color = hexOr(r.teamColor, "#3a3a3c");
      out.push({ team: r.team || r.teamAbbr, abbr: r.teamAbbr, color, secondary: hexOr(r.teamSecondary, color), from: r.yearLabel, to: r.yearLabel, seasons: 1 });
    }
  }
  return out;
}

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isTitle = (p: string) => p === "Campione";
const isFinalsLoss = (p: string) => /^Elim\. Finali NBA /.test(p);
const madePlayoffs = (p: string) => !!p && p !== "Fuori";

/** Playoff outcome rank, for "deepest run". Unknown strings rank lowest. */
function playoffDepth(p: string): number {
  if (isTitle(p)) return 5;
  if (isFinalsLoss(p)) return 4;
  if (/Finali Est\/Ovest/.test(p)) return 3;
  if (/Semifinali/.test(p)) return 2;
  if (/Primo turno|Play-in/i.test(p)) return 1;
  return madePlayoffs(p) ? 0.5 : 0;
}

/** Award display order: most distinctive first. */
const AWARD_ORDER = ["MVP", "Finals MVP", "DPOY", "Rookie of the Year", "All-NBA First Team", "All-NBA Second Team", "All-NBA Third Team", "All-Star"];

export function buildLegacyReport(entry: ArchiveCareer): LegacyReport {
  const facts = sanitizeLegacyFacts(entry.legacy);
  const rows = entry.history;
  const card = entry.card;
  const fromLog = draftFromChoices(entry.choices);
  const roleCode = roleCodeOf(entry, facts);

  const awardCount = new Map<string, number>();
  for (const r of rows) for (const a of r.awards || []) awardCount.set(a, (awardCount.get(a) ?? 0) + 1);
  // Engine flags recorded outside season rows: add only when the season list does not already carry them.
  if (facts?.roy && !awardCount.has("Rookie of the Year")) awardCount.set("Rookie of the Year", 1);
  const awards = [...awardCount].sort((a, b) => {
    const ia = AWARD_ORDER.indexOf(a[0]);
    const ib = AWARD_ORDER.indexOf(b[0]);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || b[1] - a[1];
  });

  const nbaRows = rows.filter((r) => r.conf !== "Euro");
  let wins = 0, losses = 0, playoffYears = 0, finals = 0;
  let deepest: string | null = null;
  let depth = 0;
  for (const r of rows) {
    if (finite(r.wins)) wins += r.wins;
    if (finite(r.losses)) losses += r.losses;
    if (madePlayoffs(r.playoff)) playoffYears += 1;
    if (isTitle(r.playoff) || isFinalsLoss(r.playoff)) finals += 1;
    const d = playoffDepth(r.playoff);
    if (d > depth) { depth = d; deepest = r.playoff; }
  }

  const records: RecordLine[] = [];
  const best = (key: RecordLine["key"], pick: (r: SeasonRow) => number, min = 0) => {
    let top: SeasonRow | null = null;
    for (const r of rows) {
      const v = pick(r);
      if (!finite(v) || v <= min) continue;
      if (!top || v > pick(top)) top = r;
    }
    if (top) records.push({ key, value: pick(top), yearLabel: top.yearLabel, teamAbbr: top.teamAbbr });
  };
  best("ppg", (r) => r.ppg);
  best("rpg", (r) => r.rpg);
  best("apg", (r) => r.apg);
  best("spg", (r) => r.spg, 0.3);
  best("bpg", (r) => r.bpg, 0.3);
  best("per", (r) => r.per, 0);
  best("wins", (r) => r.wins, 0);

  const timeline: TimelineItem[] = [];
  const draftPick = facts?.draftPick ?? fromLog.pick ?? null;
  const draftTeam = facts?.draftTeam ?? fromLog.team ?? null;
  if (draftPick && rows[0]) timeline.push({ kind: "draft", yearLabel: rows[0].yearLabel, subject: draftTeam ?? "", value: draftPick });
  const stints = stintsOf(rows);
  stints.filter((s) => !isUnsigned(s)).forEach((s, i) => timeline.push({ kind: i === 0 ? "debut" : "move", yearLabel: s.from, subject: s.team }));
  const seen = new Set<string>();
  for (const r of rows) {
    for (const a of r.awards || []) {
      if (seen.has(a)) continue;
      seen.add(a);
      timeline.push({ kind: "award", yearLabel: r.yearLabel, subject: a, value: awardCount.get(a) });
    }
    if (isTitle(r.playoff)) timeline.push({ kind: "title", yearLabel: r.yearLabel, subject: r.team });
    else if (isFinalsLoss(r.playoff)) timeline.push({ kind: "finals", yearLabel: r.yearLabel, subject: r.team });
  }
  const top = records.find((x) => x.key === "ppg");
  if (top && rows.length > 1) timeline.push({ kind: "best", yearLabel: top.yearLabel, subject: top.teamAbbr, value: top.value });
  const lastRow = rows[rows.length - 1];
  if (lastRow) timeline.push({ kind: "retire", yearLabel: lastRow.yearLabel, subject: "", value: lastRow.age });
  const order = new Map(rows.map((r, i) => [r.yearLabel, i]));
  const kindOrder: TimelineKind[] = ["draft", "debut", "move", "best", "award", "finals", "title", "retire"];
  timeline.sort((a, b) => (order.get(a.yearLabel) ?? 0) - (order.get(b.yearLabel) ?? 0) || kindOrder.indexOf(a.kind) - kindOrder.indexOf(b.kind));

  const games = rows.reduce((a, r) => a + (finite(r.gp) ? r.gp : 0), 0);

  return {
    name: entry.name,
    number: facts?.number ?? null,
    roleCode,
    roleLabel: entry.role,
    nationality: facts?.nationality ?? card?.nationality ?? null,
    originPath: facts?.originPath ?? null,
    draftPick,
    draftTeam,
    firstYear: rows[0]?.yearLabel ?? null,
    lastYear: lastRow?.yearLabel ?? null,
    ageStart: card?.ageStart ?? rows[0]?.age ?? null,
    // Age on the last recorded season row (TASKS.md): not PlayerState.age after an offseason bump.
    ageEnd: lastRow?.age ?? card?.ageEnd ?? null,
    seasons: rows.length,
    stints,
    averages: card && rows.length ? { ppg: card.ppg, rpg: card.rpg, apg: card.apg } : null,
    totals: rows.length ? {
      games,
      points: facts?.points,
      rebounds: facts?.rebounds,
      assists: facts?.assists,
      steals: facts?.steals,
      blocks: facts?.blocks,
    } : { games: 0 },
    regular: { wins, losses, playoffYears, nbaSeasons: nbaRows.length },
    titles: entry.titles,
    finals,
    deepest,
    peak: entry.peak,
    awards,
    records,
    timeline,
    rows,
    verdict: entry.verdict,
    closing: entry.closing,
    engineVersion: entry.engineVersion ?? card?.engineVersion ?? null,
    simulated: !!entry.simulated,
    bust: draftPick !== null
      ? careerBust({
          draftPick,
          allStarCount: awardCount.get("All-Star") ?? (typeof card?.allStars === "number" && Number.isFinite(card.allStars) ? card.allStars : 0),
          seasonHistory: rows,
        }).bust
      : null,
  };
}

/** The few numbers on the collectible card. Same source as the report: no second computation. */
export function cardFaceOf(r: LegacyReport) {
  const honors = r.awards.filter(([id]) => id !== "All-NBA Third Team" || r.awards.length < 3).slice(0, 3);
  return {
    name: r.name,
    number: r.number,
    roleCode: r.roleCode,
    roleLabel: r.roleLabel,
    nationality: r.nationality,
    span: r.firstYear && r.lastYear ? `${r.firstYear.slice(0, 4)}–${Number(r.lastYear.slice(0, 4)) + 1}` : null,
    seasons: r.seasons,
    ages: r.ageStart !== null && r.ageEnd !== null ? `${r.ageStart}–${r.ageEnd}` : null,
    averages: r.averages,
    titles: r.titles,
    peak: r.peak,
    honors,
    teams: r.stints.filter((s, i, all) => !isUnsigned(s) && all.findIndex((x) => x.abbr === s.abbr) === i).map((s) => ({ abbr: s.abbr, color: s.color, secondary: s.secondary, name: s.team })),
    verdict: r.verdict,
  };
}
export type CardFace = ReturnType<typeof cardFaceOf>;
