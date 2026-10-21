/**
 * PROCEDURAL DEPTH 1–3 — causal career memory, contextual event scoring, choice trade-offs.
 *
 * Compatibility: the whole layer is OFF unless the career carries `memory` (set by freshPlayer for
 * new careers) AND was created by engine DEPTH_SINCE or later. Saves written before this change have
 * no `memory` field and replay exactly as before. The field is optional and additive: no
 * LIVE_SAVE_VERSION, fingerprint or ENGINE_VERSION change. A malformed field is ignored (legacy rules).
 *
 * Nothing here draws from the RNG: consequences fire on engine state, scores are deterministic,
 * the only random draw stays the existing weighted pick in pickStoryEvent (same number of draws).
 */
import type { Fx, PlayerState, StoryEvent } from "./types";
import { versionAtLeast } from "./tuning";

export const DEPTH_SINCE = "2.19.0";
export const MEMORY_ITEM_CAP = 16;
export const MEMORY_APPLIED_CAP = 40;
export const MEMORY_TRAIL_CAP = 24;

export type MemoryKind =
  | "injury-scar" // serious injury: shapes recovery and staff trust next season
  | "overload" // pushed load for growth: pays off or costs depending on durability
  | "role-sacrifice" // took a smaller/system role: stability if the coach trusts you
  | "spotlight" // went public: visibility, reputation follows the results
  | "rivalry-heat" // open rivalry arc: evolves over seasons, cools with a move
  | "loyalty"; // refused to leave: trust grows if you stay, image if you are traded later

export type MemoryStatus = "open" | "resolved" | "expired";

export interface MemoryItem {
  /** Stable id: `${kind}-${season}`. */
  id: string;
  kind: MemoryKind;
  /** What created it (event id or engine step). */
  cause: string;
  /** Season of origin. */
  season: number;
  status: MemoryStatus;
  /** First season the consequence may fire. */
  due: number;
  /** Last season it can fire; past it the item expires. */
  until: number;
  /** Team abbreviation at origin (moves close or flip some arcs). */
  team: string;
}

export interface MemoryTrail {
  season: number;
  itemId: string;
  /** Consequence branch actually applied. */
  branch: string;
  fx: Omit<Fx, "flavor">;
}

export interface SelectionLog {
  season: number;
  eventId: string;
  score: number;
  reasons: string[];
  excluded: number;
}

export interface CareerMemory {
  v: 1;
  items: MemoryItem[];
  /** `${itemId}@${branch}#${season}` keys already applied. Guards resume / reload. */
  applied: string[];
  trail: MemoryTrail[];
  lastPick?: SelectionLog;
}

export function newMemory(): CareerMemory {
  return { v: 1, items: [], applied: [], trail: [] };
}

function validMemory(m: unknown): m is CareerMemory {
  if (!m || typeof m !== "object") return false;
  const r = m as Record<string, unknown>;
  return r.v === 1 && Array.isArray(r.items) && Array.isArray(r.applied) && Array.isArray(r.trail)
    && (r.items as unknown[]).every((i) => !!i && typeof (i as MemoryItem).id === "string" && typeof (i as MemoryItem).season === "number");
}

/** The live memory, or null when the career plays the legacy rules. */
export function memoryOf(s: PlayerState): CareerMemory | null {
  if (!versionAtLeast(s.engineVersion, DEPTH_SINCE)) return null;
  return validMemory(s.memory) ? s.memory : null;
}

export function usesDepth(s: PlayerState): boolean {
  return memoryOf(s) !== null;
}

export function compactMemory(m: CareerMemory) {
  const open = m.items.filter((i) => i.status === "open");
  const closed = m.items.filter((i) => i.status !== "open");
  m.items = [...closed, ...open].slice(-MEMORY_ITEM_CAP);
  m.applied = m.applied.slice(-MEMORY_APPLIED_CAP);
  m.trail = m.trail.slice(-MEMORY_TRAIL_CAP);
}

function remember(s: PlayerState, m: CareerMemory, kind: MemoryKind, cause: string, delay: number, life: number) {
  const id = `${kind}-${s.season}`;
  if (m.items.some((i) => i.id === id)) return; // idempotent: same season, same fact
  // One open arc per kind: a new one supersedes the old (no stacking of the same consequence).
  for (const i of m.items) if (i.kind === kind && i.status === "open") i.status = "expired";
  m.items.push({ id, kind, cause, season: s.season, status: "open", due: s.season + delay, until: s.season + delay + life, team: s.team?.abbr ?? "" });
  compactMemory(m);
}

/* ─────────────── Phase 3: what a choice really does ─────────────── */

/** Mechanical class of a choice, from its Fx numbers (never from text). */
export function classifyChoice(fx: Fx): MemoryKind[] {
  const out: MemoryKind[] = [];
  const attrSum = Object.values(fx.attrs ?? {}).reduce((a, b) => a + Math.max(0, b ?? 0), 0);
  const h = fx.hidden ?? {};
  if ((fx.injuryDrag ?? 0) >= 2 || (fx.gamesPenalty ?? 0) >= 15) out.push("injury-scar");
  if ((fx.injuryRisk ?? 0) > 0 && ((fx.development ?? 0) > 0 || attrSum > 0 || (fx.form ?? 0) > 0)) out.push("overload");
  if ((fx.coachTrust ?? 0) >= 3 && ((h.ego ?? 0) < 0 || (h.chemistry ?? 0) > 0)) out.push("role-sacrifice");
  if ((fx.publicImage ?? 0) >= 3 || (h.ego ?? 0) >= 2) out.push("spotlight");
  if ((fx.rivalry ?? 0) >= 3) out.push("rivalry-heat");
  return out;
}

/** Records the deferred side of a choice the engine has just applied. */
export function recordChoice(s: PlayerState, fx: Fx, cause: string) {
  const m = memoryOf(s);
  if (!m) return [] as MemoryKind[];
  const kinds = classifyChoice(fx);
  for (const k of kinds) remember(s, m, k, cause, 1, k === "rivalry-heat" ? 3 : 1);
  return kinds;
}

/** Engine step memories (trade refusal → loyalty). */
export function recordLoyalty(s: PlayerState) {
  const m = memoryOf(s);
  if (m) remember(s, m, "loyalty", "trade-refused", 1, 2);
}

/* ─────────────── Phase 1: consequences on real engine conditions ─────────────── */

interface Branch {
  branch: string;
  fx: Omit<Fx, "flavor">;
  /** true when the arc ends with this branch. */
  close: boolean;
}

/** Pure: which consequence (if any) an open item produces in season n for state s. */
export function consequenceFor(s: PlayerState, item: MemoryItem, n: number): Branch | null {
  const lastRow = s.seasonHistory[s.seasonHistory.length - 1];
  const moved = !!item.team && s.team?.abbr !== item.team;
  switch (item.kind) {
    case "injury-scar":
      return s.injuryDrag >= 2
        ? { branch: "lingering", fx: { coachTrust: -2, injuryRisk: 2, morale: -1 }, close: true }
        : { branch: "recovered", fx: { coachTrust: 1, morale: 2 }, close: true };
    case "overload":
      return s.hidden.durability < 52 || s.injuryDrag >= 3
        ? { branch: "wear", fx: { injuryRisk: 3, form: -0.6 }, close: true }
        : { branch: "payoff", fx: { development: 0.3 }, close: true };
    case "role-sacrifice":
      if (moved) return { branch: "reset", fx: { morale: -1 }, close: true };
      return s.coachTrust >= 60
        ? { branch: "trusted", fx: { development: 0.25, coachTrust: 1 }, close: true }
        : { branch: "overlooked", fx: { morale: -2 }, close: true };
    case "spotlight": {
      const prev = s.seasonHistory[s.seasonHistory.length - 2];
      const backed = !!lastRow && (!prev || lastRow.ppg >= prev.ppg);
      return backed
        ? { branch: "backed", fx: { publicImage: 2 }, close: true }
        : { branch: "exposed", fx: { publicImage: -3, coachTrust: -1 }, close: true };
    }
    case "rivalry-heat":
      if (moved) return { branch: "cooled", fx: { rivalry: -4 }, close: true };
      if (s.rivalry >= 55) return { branch: "fuel", fx: { form: 0.4, hidden: { clutch: 1 } }, close: n >= item.until };
      return n >= item.until ? { branch: "faded", fx: { rivalry: -2 }, close: true } : null;
    case "loyalty":
      return moved
        ? { branch: "betrayed", fx: { morale: -2, publicImage: 1 }, close: true }
        : { branch: "rooted", fx: { coachTrust: 2, hidden: { chemistry: 1 } }, close: true };
  }
  return null;
}

/** Visible echo of each branch (Italian source; English in narrative/en/memory.ts via nx). */
const NOTE: Record<string, string> = {
  "injury-scar:lingering": "Il vecchio infortunio pesa ancora: lo staff ti dosa i minuti.",
  "injury-scar:recovered": "Il recupero ha tenuto. Lo staff si fida di nuovo del tuo corpo.",
  "overload:wear": "Il carico dell'anno scorso presenta il conto.",
  "overload:payoff": "Il lavoro extra dell'anno scorso rende.",
  "role-sacrifice:trusted": "Il ruolo accettato ti ha dato credito con lo staff.",
  "role-sacrifice:overlooked": "Il passo indietro non è stato notato.",
  "role-sacrifice:reset": "Nuova squadra: il sacrificio fatto altrove non conta qui.",
  "spotlight:backed": "Le parole di allora sono state sostenute dal campo.",
  "spotlight:exposed": "Ti eri esposto, e le cifre non ti hanno coperto.",
  "rivalry-heat:fuel": "La rivalità ti tiene acceso.",
  "rivalry-heat:cooled": "Il trasferimento raffredda la rivalità.",
  "rivalry-heat:faded": "La rivalità si spegne da sola.",
  "loyalty:rooted": "Essere rimasto ha rafforzato il legame con la squadra.",
  "loyalty:betrayed": "Eri rimasto per lealtà. La dirigenza no.",
};

export function noteOf(kind: MemoryKind, branch: string) {
  return NOTE[`${kind}:${branch}`] ?? "";
}

/**
 * Season-start settlement. Applies each due consequence once (guarded by `applied`), records it in
 * the trail, closes or expires arcs. `apply` is the engine's applyFx (injected to avoid a cycle).
 * Returns the notes for the visible log.
 */
export function settleMemory(s: PlayerState, n: number, apply: (s: PlayerState, fx: Fx) => void): string[] {
  const m = memoryOf(s);
  if (!m) return [];
  const notes: string[] = [];
  for (const item of m.items) {
    if (item.status !== "open" || n < item.due) continue;
    if (n > item.until) {
      item.status = "expired";
      continue;
    }
    const b = consequenceFor(s, item, n);
    if (!b) continue;
    const key = `${item.id}@${b.branch}#${n}`;
    if (!m.applied.includes(key)) {
      apply(s, { ...b.fx, flavor: "" });
      m.applied.push(key);
      m.trail.push({ season: n, itemId: item.id, branch: b.branch, fx: b.fx });
      const note = noteOf(item.kind, b.branch);
      if (note) notes.push(note);
    }
    if (b.close) item.status = "resolved";
  }
  compactMemory(m);
  return notes;
}

/* ─────────────── Phase 2: contextual event score ─────────────── */

export type EventTag = "ego" | "coach" | "injury" | "veteran" | "work" | "locker" | "contract" | "rival";

const TAG_RX: [EventTag, RegExp][] = [
  ["ego", /ego|giornale|media|riflettor|intervist/],
  ["coach", /allenator|coach|sistema|panchina|staff/],
  ["injury", /infortun|ginocchio|fisico|gamba|corpo|caviglia/],
  ["veteran", /veteran|ritir|ultimo anno|ultima stagione/],
  ["work", /palestra|lavoro|estate|ripetiz|allenament/],
  ["locker", /spogliatoio|gruppo|compagn/],
  ["contract", /contratt|rinnov|mercato|agente/],
  ["rival", /rival/],
];

/** Theme tags of a pool event (its authored text is the only metadata the pool carries). */
export function eventTags(e: StoryEvent): EventTag[] {
  const t = `${e.title} ${e.subtitle}`.toLowerCase();
  return TAG_RX.filter(([, rx]) => rx.test(t)).map(([k]) => k);
}

/** Hard exclusions: an event incompatible with the current state never enters the pool. */
export function excludedBy(e: StoryEvent, s: PlayerState): string | null {
  const tags = eventTags(e);
  if (tags.includes("veteran") && s.age < 29) return "veteran-theme-too-young";
  if (tags.includes("injury") && s.injuryDrag >= 6 && s.gamesPenalty >= 30) return "already-sidelined";
  return null;
}

const DIFF_RISK: Record<string, number> = { esordio: 0.85, pro: 1, allstar: 1.1, leggenda: 1.2 };

/**
 * Readable, bounded score (0.35–3.5). Each reason is a named term so tests can assert it.
 * Difficulty only shifts how often risky themes (injury, media, contract pressure) come up:
 * it changes opportunities and risks, not stats.
 */
export function contextScore(e: StoryEvent, s: PlayerState, recent: EventTag[][]): { score: number; reasons: string[] } {
  const tags = eventTags(e);
  const reasons: string[] = [];
  let w = 1;
  const add = (cond: boolean, k: number, why: string) => {
    if (cond) {
      w *= k;
      reasons.push(why);
    }
  };
  const m = memoryOf(s);
  const open = new Set((m?.items ?? []).filter((i) => i.status === "open").map((i) => i.kind));
  const last = s.seasonHistory[s.seasonHistory.length - 1];
  add(tags.includes("ego") && s.hidden.ego >= 60, 1.6, "ego-high");
  add(tags.includes("ego") && open.has("spotlight"), 1.4, "arc-spotlight");
  add(tags.includes("coach") && s.coachTrust <= 42, 1.7, "coach-trust-low");
  add(tags.includes("coach") && !!last && last.min < 22, 1.3, "low-minutes");
  add(tags.includes("injury") && (s.injuryRisk >= 45 || s.injuryDrag >= 2), 1.7, "body-flag");
  add(tags.includes("injury") && open.has("overload"), 1.3, "arc-overload");
  add(tags.includes("veteran") && s.age >= 32, 1.5, "late-career");
  add(tags.includes("work") && s.hidden.workEthic >= 68, 1.3, "work-ethic");
  add(tags.includes("work") && s.age <= 24, 1.2, "young-growth");
  add(tags.includes("locker") && s.hidden.chemistry <= 42, 1.4, "chemistry-low");
  add(tags.includes("locker") && open.has("role-sacrifice"), 1.2, "arc-role");
  add(tags.includes("contract") && s.contract.yearsRemaining <= 1, 1.5, "contract-year");
  add(tags.includes("rival") && (s.rivalry >= 55 || open.has("rivalry-heat")), 1.5, "rivalry-live");
  const risky = tags.some((t) => t === "injury" || t === "ego" || t === "contract");
  const dr = DIFF_RISK[s.difficulty] ?? 1;
  add(risky && dr !== 1, dr, "difficulty-risk:" + s.difficulty);
  // Repetition: same theme as one of the last two picks is damped.
  const rep = recent.slice(-2).some((r) => r.some((t) => tags.includes(t)));
  add(rep && tags.length > 0, 0.6, "theme-repeat");
  return { score: Math.round(Math.min(3.5, Math.max(0.35, w)) * 1000) / 1000, reasons };
}

export function logSelection(s: PlayerState, e: StoryEvent, score: number, reasons: string[], excluded: number) {
  const m = memoryOf(s);
  if (m) m.lastPick = { season: s.season, eventId: e.id, score, reasons, excluded };
}

/** Tags of the last pool picks (from usedEventIds), for repetition control. */
export function recentTags(s: PlayerState, pool: readonly StoryEvent[]): EventTag[][] {
  return s.usedEventIds.slice(-3).map((id) => {
    const e = pool.find((p) => p.id === id);
    return e ? eventTags(e) : [];
  });
}
