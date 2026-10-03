
/** Resume mid-vita: una chiave, stesso seed, stessa carta. */

import { pruneWorld, WORLD_EVENT_CAP } from "./world";
import { sha256 } from "./card";
import { cloneTeam, findTeam } from "./teams";
import type {
  CareerTab,
  DevRow,
  LeagueSnapshot,
  LiveSave,
  LogEntry,
  MarketOffer,
  PlayerState,
  SavedPending,
  SeasonRow,
  Team,
} from "./types";

export const SAVE_KEY = "pivot-v2-save";
export const LIVE_SAVE_VERSION = 2;
export const SWIPE_KEY = "pivot-v2-swipe";
export const HINT_KEY = "pivot-v2-hint";
/** Offerte FA tenute sotto quota: tre fogli, non il mercato intero. */
export const FA_OFFER_KEEP = 3;
/** Giornale compact: più stretto del cap mondo. */
const SAVE_EVENT_KEEP = 10;

function payloadChecksum(payload: object): string {
  return sha256(JSON.stringify(payload)).slice(0, 16);
}

let careerIdFallback = 0;

/** Storage identity of one career. Never the simulation seed. */
export function newCareerId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  careerIdFallback += 1;
  return `career-${Date.now()}-${careerIdFallback}`;
}

export type SwipePersist = {
  tab: CareerTab;
  dir: "next" | "prev";
  hint: boolean;
};

const TABS: CareerTab[] = ["log", "season", "league", "career"];
const OFFER_KINDS = new Set<MarketOffer["kind"]>(["extension", "max", "ring", "fair", "euro", "prove"]);
const TEAM_TIERS = new Set(["contender", "mid", "rebuilding"]);
const CONFS = new Set(["East", "West", "Euro"]);


function isQuota(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { name?: string; code?: number };
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    err.code === 22 ||
    err.code === 1014
  );
}

function isShrinkable(e: unknown): boolean {
  if (isQuota(e)) return true;
  return e instanceof RangeError;
}

function storage(): Storage | null {
  try {
    const g = globalThis as typeof globalThis & { localStorage?: Storage };
    if (!g.localStorage) return null;
    return g.localStorage;
  } catch {
    return null;
  }
}

function sessionStore(): Storage | null {
  try {
    const g = globalThis as typeof globalThis & { sessionStorage?: Storage };
    if (!g.sessionStorage) return null;
    return g.sessionStorage;
  } catch {
    return null;
  }
}

function stores(): (Storage | null)[] {
  return [storage(), sessionStore()];
}

let writeGen = 0;
const lastWrite = new WeakMap<Storage, { gen: number; map: Map<string, string> }>();

function remembered(s: Storage): Map<string, string> {
  let box = lastWrite.get(s);
  if (!box || box.gen !== writeGen) {
    box = { gen: writeGen, map: new Map() };
    lastWrite.set(s, box);
  }
  return box.map;
}

/** True only when the store now holds exactly `value`. Another tab may have written since. */
function holds(s: Storage, key: string, value: string): boolean {
  try {
    return s.getItem(key) === value;
  } catch {
    return false;
  }
}

function writeStore(s: Storage, key: string, value: string): boolean {
  const memory = remembered(s);
  /* The cache is only a hint: a second tab or a second module instance can overwrite the key.
     Skip the write only when the store really holds the same string. */
  if (memory.get(key) === value && holds(s, key, value)) return true;
  memory.delete(key);
  try {
    s.setItem(key, value);
    if (!holds(s, key, value)) return false;
    memory.set(key, value);
    return true;
  } catch (e) {
    if (!isQuota(e)) return false;
    /* Non toccare SAVE_KEY: quota piena non deve cancellare l'ultimo buono.
       Hint e swipe si possono sacrificare per far entrare la vita. */
    if (key === SAVE_KEY) {
      try {
        s.removeItem(HINT_KEY);
      } catch {
        /* ignore */
      }
      try {
        s.removeItem(SWIPE_KEY);
      } catch {
        /* ignore */
      }
      try {
        s.setItem(key, value);
        if (!holds(s, key, value)) return false;
        memory.set(key, value);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/** Writes to localStorage and sessionStorage. `persistent` is true only when localStorage holds the value. */
function writeEach(key: string, value: string): { any: boolean; persistent: boolean } {
  const local = storage();
  const session = sessionStore();
  let persistent = false;
  let any = false;
  const failed: Storage[] = [];
  for (const s of [local, session]) {
    if (!s) continue;
    if (writeStore(s, key, value)) {
      any = true;
      if (s === local) persistent = true;
    } else failed.push(s);
  }
  if (any && key !== SAVE_KEY) {
    for (const s of failed) {
      try {
        s.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }
  return { any, persistent };
}

function writeAll(key: string, value: string): boolean {
  return writeEach(key, value).any;
}

function readFirst(key: string): string | null {
  for (const s of stores()) {
    if (!s) continue;
    try {
      const v = s.getItem(key);
      if (v) return v;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/** Removes `key` from every store. True only when no store still holds it. */
function removeAll(key: string): boolean {
  let clean = true;
  for (const s of stores()) {
    if (!s) continue;
    try {
      s.removeItem(key);
    } catch {
      /* checked below */
    }
    try {
      if (s.getItem(key) !== null) clean = false;
    } catch {
      clean = false;
    }
  }
  return clean;
}

/** Can this browser keep a career after the tab closes? Probes localStorage with a throwaway key. */
export function persistentStorageAvailable(): boolean {
  const s = storage();
  if (!s) return false;
  const probe = "pivot-v2-probe";
  try {
    s.setItem(probe, "1");
    const ok = s.getItem(probe) === "1";
    s.removeItem(probe);
    return ok;
  } catch {
    return false;
  }
}

/** Memoria di processo: sopravvive all'HMR del chrome se questo modulo resta. */
let MEM: LiveSave | null = null;

export function stripStandings(snap: LeagueSnapshot): LeagueSnapshot {
  return {
    yearLabel: snap.yearLabel,
    east: [],
    west: [],
    euro: [],
    awards: snap.awards ?? [],
    leaders: snap.leaders ?? [],
    royRace: snap.royRace ?? [],
    dpoyRace: snap.dpoyRace ?? [],
    champion: snap.champion,
  };
}

function shrinkRow(row: SeasonRow, dropStandings: boolean): SeasonRow {
  if (!row.league || !dropStandings) return row;
  return { ...row, league: stripStandings(row.league) };
}

export function shrinkHistorySnapshots(s: PlayerState) {
  if (!s.seasonHistory?.length) return;
  s.seasonHistory = s.seasonHistory.map((row) => shrinkRow(row, true));
}

function shrinkLog(log: LogEntry[], dropStandings: boolean, dropRows: boolean): LogEntry[] {
  let out = log;
  if (dropRows) {
    out = log.map((e) => {
      if (!e.row && !e.series) return e;
      const next = { ...e };
      delete next.row;
      delete next.series;
      return next;
    });
  } else if (dropStandings) {
    out = log.map((e) => (e.row ? { ...e, row: shrinkRow(e.row, true) } : e));
  }
  if (out.length > 48) out = out.slice(-48);
  return out;
}

function shrinkPending(pending: SavedPending | null, level: number): SavedPending | null {
  if (!pending) return null;
  /* recap: non strippare la riga stagione corrente */
  if (pending.kind === "fa") {
    const offers = Array.isArray(pending.offers) ? pending.offers : [];
    if (level >= 2 && offers.length > FA_OFFER_KEEP) {
      return { ...pending, offers: offers.slice(0, FA_OFFER_KEEP) };
    }
    return { ...pending, offers };
  }
  return pending;
}

function tail<T>(v: unknown, n: number): T[] {
  return (Array.isArray(v) ? v : []).slice(-n) as T[];
}

function keepTradeDest(rows: DevRow[]): DevRow[] {
  const out: DevRow[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    if (!row.tradeDest) {
      out.push(row);
      continue;
    }
    const dest = teamPlain(row.tradeDest);
    out.push(dest ? { ...row, tradeDest: dest } : { ...row, tradeDest: row.tradeDest });
  }
  return out;
}

export function compactPlayer(s: PlayerState, level: number): PlayerState {
  if (s.world) {
    try {
      pruneWorld(s.world);
    } catch {
      /* world rotto: tieni il save */
    }
    try {
      if (!Array.isArray(s.world.events)) s.world.events = [];
      const cap = Math.min(SAVE_EVENT_KEEP, WORLD_EVENT_CAP);
      if (s.world.events.length > cap) s.world.events.length = cap;
    } catch {
      /* ignore */
    }
  }
  if (s.seasonHistory?.length) {
    const last = s.seasonHistory.length - 1;
    s.seasonHistory = s.seasonHistory.map((row, i) =>
      i === last && level < 2 ? row : shrinkRow(row, true),
    );
  }
  s.heardLines = tail(s.heardLines, level >= 3 ? 180 : 360);
  s.choiceLog = tail(s.choiceLog, 80);
  s.championLog = tail(s.championLog, 16);
  s.devLog = keepTradeDest(tail<DevRow>(s.devLog, 20));
  s.milestones = tail(s.milestones, 32);
  s.usedEventIds = tail(s.usedEventIds, 48);
  if (level >= 1 && s.currentLeague) s.currentLeague = stripStandings(s.currentLeague);
  if (level >= 2) s.currentLeague = null;
  return s;
}

function cloneJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function storyOptionsPlain(options: unknown): { label: string; detail: string }[] {
  if (!Array.isArray(options)) return [];
  const out: { label: string; detail: string }[] = [];
  for (const o of options) {
    if (!o || typeof o !== "object") continue;
    const rec = o as { label?: unknown; detail?: unknown };
    out.push({
      label: typeof rec.label === "string" ? rec.label : "",
      detail: typeof rec.detail === "string" ? rec.detail : "",
    });
  }
  return out;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Team JSON-safe: niente metodi, campi noti. Null se manca abbr/name. */
function teamPlain(team: unknown): Team | null {
  if (typeof team === "string") {
    const found = findTeam(team);
    return found ? cloneTeam(found) : null;
  }
  if (!team || typeof team !== "object") return null;
  const rec = team as Record<string, unknown>;
  const abbr = str(rec.abbr);
  const name = str(rec.name);
  const found = abbr || name ? findTeam(abbr || name) : undefined;
  if (!abbr && !name && !found) return null;
  const base = found ? cloneTeam(found) : null;
  const tier = TEAM_TIERS.has(String(rec.tier))
    ? (rec.tier as Team["tier"])
    : (base?.tier ?? "mid");
  const conf = CONFS.has(String(rec.conf))
    ? (rec.conf as Team["conf"])
    : (base?.conf ?? "East");
  return {
    name: name || base?.name || abbr,
    tier,
    abbr: abbr || base?.abbr || "",
    color: str(rec.color, base?.color ?? "#000"),
    secondary: str(rec.secondary, base?.secondary ?? "#fff"),
    city: str(rec.city, base?.city ?? ""),
    conf,
    div: str(rec.div, base?.div ?? ""),
    power: num(rec.power, base?.power ?? 50),
    star: str(rec.star, base?.star ?? ""),
    note: str(rec.note, base?.note ?? ""),
  };
}

function offerPlain(o: unknown): MarketOffer | null {
  if (!o || typeof o !== "object") return null;
  const rec = o as Record<string, unknown>;
  const team = teamPlain(rec.team);
  if (!team) return null;
  const kind = OFFER_KINDS.has(rec.kind as MarketOffer["kind"])
    ? (rec.kind as MarketOffer["kind"])
    : "fair";
  return {
    id: str(rec.id),
    team,
    years: Math.max(1, Math.round(num(rec.years, 1))),
    annualM: num(rec.annualM, 0),
    pitch: str(rec.pitch),
    kind,
  };
}

function faOffersPlain(offers: unknown): MarketOffer[] {
  if (!Array.isArray(offers)) return [];
  const out: MarketOffer[] = [];
  for (const o of offers) {
    const plain = offerPlain(o);
    if (plain) out.push(plain);
  }
  return out;
}

/** Pending JSON-safe: niente run/fx. Story, fa, trade, trade-notice round-trip. */
function sanitizePending(pending: SavedPending | null): SavedPending | null {
  if (!pending) return null;
  if (pending.kind === "story") {
    return {
      kind: "story",
      title: pending.title,
      subtitle: pending.subtitle,
      script: pending.script,
      eventId: pending.eventId,
      options: storyOptionsPlain(pending.options),
    };
  }
  if (pending.kind === "fa") {
    return {
      kind: "fa",
      desk: str(pending.desk),
      offers: faOffersPlain(pending.offers),
    };
  }
  if (pending.kind === "trade") {
    const team = teamPlain(pending.team);
    if (!team) return { kind: "trade", team: pending.team, pitch: str(pending.pitch) };
    return { kind: "trade", team, pitch: str(pending.pitch) };
  }
  if (pending.kind === "trade-notice") {
    const team = teamPlain(pending.team) ?? cloneJson(pending.team);
    return {
      kind: "trade-notice",
      team,
      from: pending.from,
      pitch: pending.pitch,
    };
  }
  try {
    return cloneJson(pending);
  } catch {
    return null;
  }
}

export function buildLiveSave(
  player: PlayerState,
  pending: SavedPending | null,
  log: LogEntry[],
  screen: LiveSave["screen"],
  tab: LiveSave["tab"],
  logSeq: number,
  level = 0,
): LiveSave {
  const s = cloneJson(player);
  compactPlayer(s, level);
  const payload = {
    v: LIVE_SAVE_VERSION,
    screen,
    tab,
    player: s,
    pending: shrinkPending(sanitizePending(pending), level),
    log: shrinkLog(cloneJson(log), true, level >= 2),
    logSeq,
  };
  const c = payloadChecksum(payload);
  return { ...payload, c };
}

export function saveLive(data: {
  player: PlayerState;
  pending: SavedPending | null;
  log: LogEntry[];
  screen: LiveSave["screen"];
  tab: LiveSave["tab"];
  logSeq: number;
}): boolean {
  let last: LiveSave | null = null;
  for (const level of [0, 1, 2, 3]) {
    try {
      const payload = buildLiveSave(data.player, data.pending, data.log, data.screen, data.tab, data.logSeq, level);
      last = payload;
      const json = JSON.stringify(payload);
      /* Success means the browser will still have this career after the tab closes. */
      if (writeEach(SAVE_KEY, json).persistent) {
        MEM = payload;
        writeHint(payload);
        const prev = loadSwipe();
        saveSwipe({
          tab: data.tab,
          dir: prev?.dir || "next",
          hint: prev?.hint ?? false,
        });
        return true;
      }
    } catch (e) {
      if (!isShrinkable(e)) {
        if (last) {
          MEM = last;
          writeHint(last);
        }
        return false;
      }
    }
  }
  if (last) {
    MEM = last;
    writeHint(last);
  }
  return false;
}

function writeHint(payload: LiveSave) {
  try {
    writeAll(
      HINT_KEY,
      JSON.stringify({
        v: LIVE_SAVE_VERSION,
        screen: payload.screen,
        tab: payload.tab,
        seed: payload.player.seed,
      }),
    );
  } catch {
    /* hint è di cortesia */
  }
}

function isLiveSave(value: unknown): value is LiveSave {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const rec = value as Record<string, unknown>;
  // Versione diversa: si scarta. Non si migra una carriera a metà motore.
  if (rec.v !== LIVE_SAVE_VERSION) return false;
  if (rec.screen !== "draft" && rec.screen !== "career") return false;
  const player = rec.player;
  if (!player || typeof player !== "object" || Array.isArray(player)) return false;
  const state = player as Record<string, unknown>;
  const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  const object = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  const numericFields = [
    "number", "age", "talent", "development", "form", "injuryRisk", "injuryDrag", "gamesPenalty",
    "publicImage", "coachTrust", "rivalry", "morale", "overall", "peakOverall", "apexAge", "draftPick",
    "rookReady", "choiceOvr", "season", "allStarCount", "mvpCount", "allNbaCount", "dpoyCount",
    "titleCount", "fmvpCount", "careerPoints", "careerRebounds", "careerAssists", "careerSteals",
    "careerBlocks", "yearsOnTeam", "potential", "startAge", "seed",
  ];
  if (!numericFields.every((key) => finite(state[key]))) return false;
  if (state.rngState !== undefined && !finite(state.rngState)) return false;
  if (state.draftEdge !== undefined && !finite(state.draftEdge)) return false;
  if (state.careerId !== undefined && (typeof state.careerId !== "string" || state.careerId.length === 0)) return false;
  if (!["name", "nationality", "originPath", "rivalName", "coachName", "lastOffseasonId", "engineVersion"]
    .every((key) => typeof state[key] === "string")) return false;
  if (!["PG", "SG", "SF", "PF", "C"].includes(String(state.role))) return false;
  if (!["esordio", "pro", "allstar", "leggenda"].includes(String(state.difficulty))) return false;
  if (state.league !== "NBA" && state.league !== "EuroLega") return false;
  if (!["extraSeason", "international", "medal", "roy", "simulated"]
    .every((key) => typeof state[key] === "boolean")) return false;
  const attrs = ["shooting", "handle", "passing", "defense", "rebounding", "athleticism", "strength", "iq"];
  const hidden = ["clutch", "durability", "workEthic", "ego", "chemistry", "consistency", "motor", "mediaSavvy"];
  const stateAttrs = state.attrs;
  const stateHidden = state.hidden;
  if (!object(stateAttrs) || !attrs.every((key) => finite(stateAttrs[key]))) return false;
  if (!object(stateHidden) || !hidden.every((key) => finite(stateHidden[key]))) return false;
  if (!object(state.team) || typeof state.team.name !== "string" || typeof state.team.abbr !== "string") return false;
  const stateContract = state.contract;
  if (!object(stateContract)
    || typeof stateContract.teamName !== "string"
    || !["years", "yearsRemaining", "annualM"].every((key) => finite(stateContract[key]))) return false;
  const arrays = ["draftHand", "seasonHistory", "milestones", "devLog", "usedEventIds", "heardLines", "choiceLog", "championLog", "royClass"];
  if (!arrays.every((key) => Array.isArray(state[key]))) return false;
  const seasonHistory = state.seasonHistory as unknown[];
  const seasonNumbers = ["season", "age", "overall", "gp", "min", "ppg", "rpg", "apg"];
  if (!seasonHistory.every((row) => object(row)
    && seasonNumbers.every((key) => finite(row[key]))
    && typeof row.yearLabel === "string"
    && typeof row.team === "string"
    && typeof row.teamAbbr === "string")) return false;
  if (!(state.choiceLog as unknown[]).every((choice) => object(choice)
    && finite(choice.season)
    && typeof choice.title === "string"
    && typeof choice.pick === "string")) return false;
  if (!(state.milestones as unknown[]).every((milestone) => object(milestone)
    && finite(milestone.season)
    && typeof milestone.label === "string")) return false;
  if (!(state.usedEventIds as unknown[]).every((id) => typeof id === "string")) return false;
  if (!(state.heardLines as unknown[]).every((line) => typeof line === "string")) return false;
  if (!object(state.teamPower) || !Object.values(state.teamPower).every(finite)) return false;
  if (!(state.currentLeague === null || object(state.currentLeague))) return false;
  if (!(state.playoff === null || object(state.playoff))) return false;
  if (state.world !== undefined && !object(state.world)) return false;
  if (!Array.isArray(rec.log) || !rec.log.every((entry) => object(entry)
    && typeof entry.id === "string"
    && typeof entry.kind === "string")) return false;
  if (!(rec.pending === null || object(rec.pending))) return false;
  if (rec.logSeq !== undefined && !finite(rec.logSeq)) return false;
  if (rec.tab !== undefined && (typeof rec.tab !== "string" || !TABS.includes(rec.tab as CareerTab))) return false;
  if (typeof rec.c !== "string" || rec.c.length === 0) return false;

  const { c, ...body } = rec;
  if (c !== payloadChecksum(body)) return false;
  return true;
}

function revive(parsed: LiveSave): LiveSave {
  if (typeof parsed.player.careerId !== "string" || parsed.player.careerId.length === 0) {
    parsed.player.careerId = newCareerId();
  }
  if (typeof parsed.player.rngState !== "number" || !Number.isFinite(parsed.player.rngState)) {
    parsed.player.rngState = parsed.player.seed;
  }
  if (!Array.isArray(parsed.log)) parsed.log = [];
  if (typeof parsed.logSeq !== "number" || !Number.isFinite(parsed.logSeq)) {
    parsed.logSeq = logSeqFrom(parsed.log);
  }
  if (typeof parsed.tab !== "string" || !TABS.includes(parsed.tab)) parsed.tab = "log";
  try {
    compactPlayer(parsed.player, 0);
  } catch {
    if (parsed.player.world) {
      try {
        pruneWorld(parsed.player.world);
      } catch {
        /* world rotto: tieni il save */
      }
    }
  }
  try {
    parsed.pending = sanitizePending(parsed.pending ?? null);
  } catch {
    parsed.pending = parsed.pending ?? null;
  }
  parsed.log = shrinkLog(parsed.log, true, false);
  return parsed;
}

function fresher(a: LiveSave, b: LiveSave): LiveSave {
  if (a.player.seed === b.player.seed) {
    const as = a.logSeq ?? 0;
    const bs = b.logSeq ?? 0;
    if (as !== bs) return as > bs ? a : b;
    const ar = a.player.rngState ?? 0;
    const br = b.player.rngState ?? 0;
    if (ar !== br) return ar > br ? a : b;
    return a;
  }
  return (a.logSeq ?? 0) >= (b.logSeq ?? 0) ? a : b;
}

/* ------------------------------------------------------------------ */
/* Versions and migrations                                             */
/* ------------------------------------------------------------------ */

/**
 * Raw copy of a save that could not be opened as-is (damaged, from a newer build, from an older
 * schema, or before a migration). It is written before anything else happens to that save.
 */
export const BACKUP_KEY = "pivot-v2-save-backup";

export type LiveLoadState = "none" | "ok" | "migrated" | "corrupt" | "future" | "incompatible";

export interface LiveLoadReport {
  state: LiveLoadState;
  /** Version field found in the stored JSON, when it was readable. */
  version: unknown;
  /** True when the unreadable or migrated original is safe under BACKUP_KEY. */
  backedUp: boolean;
}

type RawSave = Record<string, unknown>;

/**
 * Sequential migrations: LIVE_MIGRATIONS[n] turns a version-n save into version n+1.
 *
 * Git history of this repository has only ever shipped LIVE_SAVE_VERSION = 2 (checked on every
 * commit that touched save.ts, from b04fff9 to 778a561). No earlier schema is known, so no
 * migration is registered. Add one here only for a schema that really shipped, with a fixture.
 */
export const LIVE_MIGRATIONS: Record<number, (raw: RawSave) => RawSave> = {};

let LAST_LOAD: LiveLoadReport = { state: "none", version: undefined, backedUp: false };

/** What the last loadLive() found. The UI uses it to explain why a career did not open. */
export function lastLoadReport(): LiveLoadReport {
  return { ...LAST_LOAD };
}

function backupRaw(raw: string, reason: LiveLoadState): boolean {
  const s = storage() ?? sessionStore();
  if (!s) return false;
  try {
    const prev = s.getItem(BACKUP_KEY);
    if (prev) {
      const rec = JSON.parse(prev) as { raw?: unknown };
      if (rec && rec.raw === raw) return true;
    }
  } catch {
    /* overwrite an unreadable backup */
  }
  const value = JSON.stringify({ v: 1, reason, at: Date.now(), raw });
  try {
    s.setItem(BACKUP_KEY, value);
    return s.getItem(BACKUP_KEY) === value;
  } catch {
    return false;
  }
}

/** Raw backup string, if one exists. */
export function readLiveBackup(): { reason: string; at: number; raw: string } | null {
  for (const s of stores()) {
    if (!s) continue;
    try {
      const prev = s.getItem(BACKUP_KEY);
      if (!prev) continue;
      const rec = JSON.parse(prev) as { reason?: unknown; at?: unknown; raw?: unknown };
      if (typeof rec.raw === "string") {
        return { reason: String(rec.reason ?? ""), at: Number(rec.at) || 0, raw: rec.raw };
      }
    } catch {
      /* try the other store */
    }
  }
  return null;
}

/**
 * Puts the backed-up original back under SAVE_KEY, exactly as it was. Returns true only when the
 * store now holds it. The backup itself is kept.
 */
export function restoreLiveBackup(): boolean {
  const backup = readLiveBackup();
  if (!backup) return false;
  writeGen += 1;
  MEM = null;
  return writeEach(SAVE_KEY, backup.raw).persistent;
}

type Classified =
  | { state: "ok"; save: LiveSave }
  | { state: "migrated"; save: LiveSave }
  | { state: "corrupt" | "future" | "incompatible"; version: unknown };

function classify(raw: string): Classified {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: "corrupt", version: undefined };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { state: "corrupt", version: undefined };
  const rec = parsed as RawSave;
  const v = rec.v;
  if (v === LIVE_SAVE_VERSION) {
    return isLiveSave(rec) ? { state: "ok", save: rec as unknown as LiveSave } : { state: "corrupt", version: v };
  }
  if (typeof v !== "number" || !Number.isInteger(v)) return { state: "corrupt", version: v };
  if (v > LIVE_SAVE_VERSION) return { state: "future", version: v };
  let cur: RawSave = rec;
  for (let n = v; n < LIVE_SAVE_VERSION; n++) {
    const step = LIVE_MIGRATIONS[n];
    if (!step) return { state: "incompatible", version: v };
    try {
      cur = step(JSON.parse(JSON.stringify(cur)) as RawSave);
    } catch {
      return { state: "incompatible", version: v };
    }
  }
  const { c: _drop, ...body } = cur;
  void _drop;
  const migrated = { ...body, v: LIVE_SAVE_VERSION, c: payloadChecksum({ ...body, v: LIVE_SAVE_VERSION }) };
  return isLiveSave(migrated) ? { state: "migrated", save: migrated as unknown as LiveSave } : { state: "incompatible", version: v };
}

const PROBLEM_RANK: Record<string, number> = { corrupt: 1, incompatible: 2, future: 3 };

export function loadLive(): LiveSave | null {
  const report: LiveLoadReport = { state: "none", version: undefined, backedUp: false };
  try {
    const local = storage();
    const found: { save: LiveSave; session: boolean; migrated: boolean }[] = [];
    for (const s of stores()) {
      if (!s) continue;
      let raw: string | null = null;
      try {
        raw = s.getItem(SAVE_KEY);
      } catch {
        raw = null;
      }
      if (!raw) continue;
      const c = classify(raw);
      if (c.state === "ok" || c.state === "migrated") {
        if (c.state === "migrated" && !backupRaw(raw, "migrated")) {
          /* Never transform a save whose original could not be kept. */
          if ((PROBLEM_RANK[report.state] ?? 0) < PROBLEM_RANK.incompatible!) {
            report.state = "incompatible";
            report.version = JSON.parse(raw).v;
          }
          continue;
        }
        found.push({ save: c.save, session: s !== local, migrated: c.state === "migrated" });
      } else if ((PROBLEM_RANK[c.state] ?? 0) > (PROBLEM_RANK[report.state] ?? 0)) {
        report.state = c.state;
        report.version = c.version;
        report.backedUp = backupRaw(raw, c.state);
      }
    }
    if (found.length) {
      /* Two tabs can hold two different careers: localStorage has the last writer,
         sessionStorage has this tab's own career. Prefer this tab's career. */
      const ids = new Set(found.map((f) => f.save.player.careerId ?? `seed:${f.save.player.seed}`));
      let pool = found;
      if (ids.size > 1 && found.some((f) => f.session)) pool = found.filter((f) => f.session);
      let pick = pool[0]!;
      for (let i = 1; i < pool.length; i++) {
        pick = fresher(pool[i]!.save, pick.save) === pool[i]!.save ? pool[i]! : pick;
      }
      const live = revive(pick.save);
      MEM = live;
      LAST_LOAD = { state: pick.migrated ? "migrated" : "ok", version: LIVE_SAVE_VERSION, backedUp: pick.migrated };
      return live;
    }
  } catch {
    /* prova la memoria */
  }
  LAST_LOAD = report;
  if (MEM && isLiveSave(MEM)) {
    LAST_LOAD = { state: "ok", version: LIVE_SAVE_VERSION, backedUp: false };
    return MEM;
  }
  return null;
}

export function hasLiveHint(): boolean {
  if (MEM && isLiveSave(MEM)) return true;
  try {
    const raw = readFirst(HINT_KEY) || readFirst(SAVE_KEY);
    return Boolean(raw);
  } catch {
    return false;
  }
}

/**
 * Deletes the live career from every store. Returns true only when the save key is gone everywhere.
 * On failure the in-memory copy is kept, so the caller can tell the player nothing was lost.
 */
export function clearLive(): boolean {
  writeGen += 1;
  const gone = removeAll(SAVE_KEY);
  removeAll(HINT_KEY);
  removeAll(SWIPE_KEY);
  if (!gone) return false;
  MEM = null;
  if (typeof document !== "undefined") document.documentElement.classList.remove("pivot-live");
  return true;
}

/**
 * Copy of a live save that made the app crash while rendering, put aside by the player from the
 * error screen. Separate from BACKUP_KEY so it never overwrites an older backup.
 */
export const CRASH_BACKUP_KEY = "pivot-v2-save-crashed";

/**
 * Error-screen escape hatch. A save can pass the checksum and the shape checks and still break the
 * interface (for example after a deploy changed what the screens expect): without this, "Ricarica"
 * reopens the same career and crashes again. Each store's raw save is first copied, byte for byte,
 * under CRASH_BACKUP_KEY in that same store; the live save is removed only if every copy was
 * verified. Returns true when the home will open clean on reload.
 */
export function setAsideLive(): boolean {
  let held = false;
  for (const s of stores()) {
    if (!s) continue;
    let raw: string | null;
    try {
      raw = s.getItem(SAVE_KEY);
    } catch {
      return false;
    }
    if (!raw) continue;
    held = true;
    const value = JSON.stringify({ v: 1, reason: "crashed", at: Date.now(), raw });
    try {
      s.setItem(CRASH_BACKUP_KEY, value);
      if (s.getItem(CRASH_BACKUP_KEY) !== value) return false;
    } catch {
      return false;
    }
  }
  if (!held) {
    MEM = null;
    return true;
  }
  return clearLive();
}

/** True when a readable live save exists in a store or in memory. */
export function hasLiveSave(): boolean {
  return loadLive() !== null;
}

/**
 * Calls `onOther` when another tab writes a different career to the live key.
 * The newest write wins. This only warns; it never locks.
 */
export function watchLiveConflicts(careerId: () => string | null, onOther: () => void): () => void {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key !== SAVE_KEY || event.newValue === null) return;
    writeGen += 1;
    const mine = careerId();
    if (!mine) return;
    try {
      const parsed = JSON.parse(event.newValue) as { player?: { careerId?: unknown } };
      const other = parsed?.player?.careerId;
      if (typeof other === "string" && other !== mine) onOther();
    } catch {
      /* unreadable write from another tab: the next save will replace it */
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function saveSwipe(state: SwipePersist): boolean {
  const tab = TABS.includes(state.tab) ? state.tab : "log";
  const payload: SwipePersist = {
    tab,
    dir: state.dir === "prev" ? "prev" : "next",
    hint: Boolean(state.hint),
  };
  try {
    return writeAll(SWIPE_KEY, JSON.stringify(payload));
  } catch {
    return false;
  }
}

export function loadSwipe(): SwipePersist | null {
  try {
    const raw = readFirst(SWIPE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const rec = parsed as { tab?: unknown; dir?: unknown; hint?: unknown };
    if (typeof rec.tab !== "string" || !TABS.includes(rec.tab as CareerTab)) return null;
    return {
      tab: rec.tab as CareerTab,
      dir: rec.dir === "prev" ? "prev" : "next",
      hint: rec.hint === true,
    };
  } catch {
    return null;
  }
}

export function logSeqFrom(log: LogEntry[]): number {
  let max = 0;
  for (const e of log) {
    const m = /^l(\d+)$/.exec(e.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}
