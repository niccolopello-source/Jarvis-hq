
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

function legacyChecksum(seed: number, seq: number, state: number): string {
  return sha256(`${seed}:${seq}:${state}`).slice(0, 16);
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

function writeStore(s: Storage, key: string, value: string): boolean {
  const memory = remembered(s);
  if (memory.get(key) === value) return true;
  try {
    s.setItem(key, value);
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
        memory.set(key, value);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

function writeAll(key: string, value: string): boolean {
  let ok = false;
  const failed: Storage[] = [];
  for (const s of stores()) {
    if (!s) continue;
    if (writeStore(s, key, value)) ok = true;
    else failed.push(s);
  }
  if (ok && key !== SAVE_KEY) {
    for (const s of failed) {
      try {
        s.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }
  return ok;
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

function removeAll(key: string) {
  for (const s of stores()) {
    if (!s) continue;
    try {
      s.removeItem(key);
    } catch {
      /* ignore */
    }
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
      if (writeAll(SAVE_KEY, json)) {
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
  if (rec.c !== undefined && typeof rec.c !== "string") return false;

  const { c, ...body } = rec;
  const seq = finite(rec.logSeq) ? rec.logSeq : 0;
  const rng = finite(state.rngState) ? state.rngState : state.seed as number;
  const validLegacy = c === legacyChecksum(state.seed as number, seq, rng);
  if (c !== undefined && c !== payloadChecksum(body) && !validLegacy) return false;
  return true;
}

function revive(parsed: LiveSave): LiveSave {
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

export function loadLive(): LiveSave | null {
  try {
    const found: LiveSave[] = [];
    for (const s of stores()) {
      if (!s) continue;
      try {
        const raw = s.getItem(SAVE_KEY);
        if (!raw) continue;
        const parsed: unknown = JSON.parse(raw);
        if (isLiveSave(parsed)) found.push(parsed);
      } catch {
        /* ignore */
      }
    }
    let parsed: LiveSave | null = null;
    if (found.length) {
      parsed = found[0]!;
      for (let i = 1; i < found.length; i++) parsed = fresher(found[i]!, parsed);
    }
    if (parsed) {
      const { c, ...body } = parsed as unknown as Record<string, unknown>;
      const needsChecksumUpgrade = c !== payloadChecksum(body);
      const live = revive(parsed);
      MEM = live;
      if (needsChecksumUpgrade) {
        saveLive({
          player: live.player,
          pending: live.pending,
          log: live.log,
          screen: live.screen,
          tab: live.tab,
          logSeq: live.logSeq,
        });
        return MEM ?? live;
      }
      return live;
    }
  } catch {
    /* prova la memoria */
  }
  if (MEM && isLiveSave(MEM)) return MEM;
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

export function clearLive() {
  writeGen += 1;
  MEM = null;
  removeAll(SAVE_KEY);
  removeAll(HINT_KEY);
  removeAll(SWIPE_KEY);
  if (typeof document !== "undefined") document.documentElement.classList.remove("pivot-live");
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
