
import { Component, memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, ChevronLeft, ClipboardList, RotateCcw, Trophy, Table2 } from "lucide-react";
import { LeaguePanel, PersonalAwards, RoyBoard, TeamDossier } from "@/components/pivot/LeaguePanel";
import { CourtMark, FlagMark, TeamCrest, TeamMark } from "@/components/pivot/TeamMark";
import { chipsFromFx, chipsFromSnapshot, consequenceSchedule, formatCareerTotal, getSeasonDisplayLabel, tidyText, isGenuineFinalsRound, isHighStakesPresentation, NBA_FINALS_LABEL, seasonCountLabel } from "@/components/pivot/presentation";
import { MiniGuide } from "@/components/pivot/Guide";
import { DIFFICULTIES, diffOf } from "@/lib/pivot/difficulty";
import { pathFeel, playoffNerves, ROLE_ARTICLE, summerFeel, noAwardLine, doorLine, faDeskLine } from "@/lib/pivot/feel";
import {
  ATTR_LABELS,
  COACH_NAMES,
  HIDDEN_LABELS,
  NATIONALITIES,
  RIVAL_NAMES,
  ROLES,
  natAdj,
} from "@/lib/pivot/data";
import {
  acceptForcedPreseasonTrade,
  acceptForcedSummerTrade,
  acceptOffer,
  acceptTrade,
  allDraftRounds,
  applyAutoOffseason,
  applyDraftCard,
  applyFx,
  ARCHIVE_LIMIT,
  archiveStateOf,
  beginPlayoffs,
  buildFaOffers,
  buildTradeOffer,
  careerCardOf,
  displayOverall,
  fillTemplate,
  finishDraft,
  freshPlayer,
  hiddenHints,
  idealCurveSeries,
  isArchivePersisted,
  isContractYear,
  lastArchiveEvicted,
  loadArchive,
  offseasonStep,
  pick,


  pickPlayoffOpponent,
  pickStoryEvent,
  eventAfterMarket,
  openCareerSim,
  advanceCareerSim,
  playoffChoicesFor,
  playoffRounds,
  qualifiesPlayoffs,
  refreshOverall,
  refuseTrade,
  recordRetirementChoice,
  resolvePlayoffRound,
  revealDraftLanding,
  saveArchive,
  scaledDraftCard,
  scriptedSeasonEvent,
  scriptedSeasonSlot,
  shouldForceTrade,
  shouldOfferTrade,
  simulateRegularSeason,
  START_OVERALL,
  startProPath,
  storyEventById,
  tickContract,
  toArchive,
  verdictOf,
  withPlayer,
} from "@/lib/pivot/engine";
import { initLang, setLang, t, tf, useLang, awardLabel, DEMO_LANGS, difficultyFace } from "@/lib/pivot/i18n";
import { newLifeAsk, type NewLifeAsk } from "@/lib/pivot/new-life";
import { ModalDialog } from "@/components/pivot/Dialog";
import { LazyChunk } from "@/components/pivot/ChunkBoundary";
import { attrLabel, confLabel, hiddenLabel, nationLabel, playoffResultLabel, roleLabel, roundLabel } from "@/lib/pivot/labels";

const loadCareerChart = () => import("@/components/pivot/CareerChart");
const pickCareerChart = (m: typeof import("@/components/pivot/CareerChart")) => m.CareerChart;
import { HOLD_FINALS_MS, HOLD_MARKET_MS, HOLD_RECAP_MS, HOLD_TITLE_MS } from "@/lib/pivot/config";
import { EURO_TEAMS, NBA_TEAMS } from "@/lib/pivot/teams";

function SaveGlyph() {
  return (
    <svg className="save-glyph" width="18" height="18" viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r="26" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.28" />
      <path className="save-glyph-arc" d="M40 14 A26 26 0 0 1 66 40" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function clubByName(name: string) {
  return NBA_TEAMS.find((t) => t.name === name) ?? EURO_TEAMS.find((t) => t.name === name);
}
import { advancedOf } from "@/lib/pivot/peak";
import { defensiveMarks } from "@/lib/pivot/awards-helpers";
import { clearLive, hasLiveSave, lastLoadReport, loadLive, loadSwipe, logSeqFrom, persistentStorageAvailable, saveLive, saveSwipe, watchLiveConflicts, type LiveLoadReport } from "@/lib/pivot/save";
import { CAREER_TABS, SwipeTrack } from "@/components/pivot/SwipePager";
import { careerCommentary, hofTier, palmares } from "@/lib/pivot/legacy";
import { settleYearTitle } from "@/lib/pivot/league";
import type {
  ArchiveCareer,
  AttrKey,
  CareerTab,
  DifficultyId,
  HiddenKey,
  LogEntry,
  MarketOffer,
  PlayerState,
  Role,
  SavedPending,
  SavedStoryScript,
  SeasonRow,
  SeriesResult,
  StandingRow,
  Team,
  Fx,
} from "@/lib/pivot/types";

type Screen = "intro" | "setup" | "draft" | "career" | "result" | "archive";
type Tab = CareerTab;
type Pending =
  | { kind: "path" }
  | { kind: "call"; pick: number; flavor: string }
  | { kind: "story"; title: string; subtitle: string; options: Opt[]; script?: SavedStoryScript; eventId?: string }
  | { kind: "recap"; row: SeasonRow; qualified: boolean; awardNote: string; door: string }
  | { kind: "playoff"; round: number; opponent: Team; nerves: string }
  | { kind: "fa"; offers: MarketOffer[]; desk: string }
  | { kind: "trade"; team: Team; pitch: string }
  | { kind: "trade-notice"; team: Team; from: string; pitch: string }
  | { kind: "retire" };

type Opt = { label: string; detail: string; run: (s: PlayerState) => { flavor: string; chips: string[] } };

class CareerGuard extends Component<{ children: ReactNode }, { crashed: boolean; error: Error | null }> {
  state = { crashed: false, error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { crashed: true, error };
  }
  componentDidCatch(error: Error, info: import("react").ErrorInfo) {
    if (import.meta.env.DEV) console.error("PIVOT 23 career view failed to render", error, info.componentStack);
  }
  render() {
    if (this.state.crashed) {
      return <CrashFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

function CrashFallback({ error }: { error: Error | null }) {
  return (
    <main className="min-h-screen bg-bg text-wood grid place-items-center p-6">
      <section className="max-w-md rounded-xl border border-line bg-panel p-6 shadow-sm" role="alert">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">PIVOT 23</p>
        <h1 className="mt-2 text-2xl font-semibold">{t("crashTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("crashBody")}</p>
        {import.meta.env.DEV && error && (
          <pre className="mt-4 overflow-auto rounded-lg bg-panel-2 p-3 text-xs text-muted" role="note">
            {error.message}
          </pre>
        )}
        <button
          className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.location.reload()}
        >
          {t("crashReload")}
        </button>
      </section>
    </main>
  );
}

let logId = 1;
function nid() {
  return `l${logId++}`;
}

function optsFromEvent(
  ev: { id?: string; choices: { label: string; detail: string; fx: (s: PlayerState) => Fx }[] },
  s: PlayerState,
): Opt[] {
  return ev.choices.map((c) => ({
    label: fillTemplate(c.label, s),
    detail: fillTemplate(c.detail, s),
    run: (p) => {
      const fx = c.fx(p);
      const chips = chipsFromFx(fx, ATTR_LABELS);
      applyFx(p, fx);
      return { flavor: fillTemplate(fx.flavor, p), chips };
    },
  }));
}

function pendingFromEvent(
  ev: { id: string; title: string; subtitle: string; choices: { label: string; detail: string; fx: (s: PlayerState) => import("@/lib/pivot/types").Fx }[] },
  script: SavedStoryScript,
  s: PlayerState,
): Pending {
  return {
    kind: "story",
    title: fillTemplate(ev.title, s),
    subtitle: fillTemplate(ev.subtitle, s),
    script,
    eventId: ev.id,
    options: optsFromEvent(ev, s),
  };
}

function hydratePending(raw: SavedPending | Pending | null, s: PlayerState): Pending | null {
  if (!raw) return null;
  if (raw.kind === "hold") return null;
  if (raw.kind === "story") {
    const ev = storyEventById(s, raw.eventId, raw.script);
    const runs = optsFromEvent(ev, s);
    const options = (raw.options.length ? raw.options : ev.choices).map((o, i) => {
      const label = fillTemplate(o.label, s);
      const match = runs.find((r) => r.label === label || r.label === o.label) ?? runs[i];
      return {
        label,
        detail: fillTemplate(o.detail, s),
        run: match?.run ?? ((p) => {
          applyFx(p, { flavor: "Si va avanti." });
          return { flavor: "La pagina si è persa. Si va avanti.", chips: [] };
        }),
      };
    });
    return { kind: "story", title: raw.title, subtitle: raw.subtitle, script: raw.script, eventId: raw.eventId, options };
  }
  return raw as Pending;
}

let bootReport: LiveLoadReport = { state: "none", version: undefined, backedUp: false };

type NewLifeOrigin = "intro" | "replay";
type NewLifeDialog = { ask: Exclude<NewLifeAsk, "none">; origin: NewLifeOrigin; error: string | null };

export function PivotApp() {
  const bootRef = useRef<ReturnType<typeof loadLive> | undefined>(undefined);
  if (bootRef.current === undefined) {
    let live: ReturnType<typeof loadLive> = null;
    if (typeof window !== "undefined") {
      try {
        live = loadLive();
        bootReport = lastLoadReport();
        // A finished career already safe in the archive is not a career to resume.
        if (live) {
          const done = archiveStateOf(live.player.careerId);
          if (done.finished && done.archived && clearLive()) live = null;
        }
      } catch {
        live = null;
      }
    }
    bootRef.current = live;
    if (live) logId = Math.max(logId, live.logSeq || 1);
  }
  const boot = bootRef.current;
  const [screen, setScreen] = useState<Screen>(
    boot?.screen === "draft" || boot?.screen === "career" ? boot.screen : "intro",
  );
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      const sw = loadSwipe();
      if (sw?.tab === "log" || sw?.tab === "season" || sw?.tab === "league" || sw?.tab === "career") return sw.tab;
    }
    return (boot?.tab as Tab) || "log";
  });
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("PG");
  const [nat, setNat] = useState("Italia");
  const [number, setNumber] = useState(23);
  const [difficulty, setDifficulty] = useState<DifficultyId>("pro");
  const [premiere, setPremiere] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  // The premiere plays once per page load. Leaving the home before it ends (Inizia, Archivio, a resumed
  // career) closes it, so coming back to the home never replays it from the start.
  if (premiere && screen !== "intro") setPremiere(false);
  const [player, setPlayer] = useState<PlayerState | null>(boot?.player ?? null);
  const [pending, setPending] = useState<Pending | null>(() => {
    if (!boot?.player) return null;
    try {
      const next = withPlayer(boot.player, () => hydratePending(boot.pending as SavedPending | null, boot.player));
      if (next) return next;
    } catch {
      return null;
    }
    if (boot.screen !== "career") return null;
    return {
      kind: "story",
      title: t("resumeTitle"),
      subtitle: t("resumeSub"),
      options: [
        {
          label: t("resumeGo"),
          detail: t("resumeGoDetail"),
          run: (p) => {
            applyFx(p, { flavor: "Si va avanti." });
            return { flavor: "Si va avanti.", chips: [] };
          },
        },
      ],
    };
  });
  const [log, setLog] = useState<LogEntry[]>(boot?.log || []);
  const [fxChips, setFxChips] = useState<Record<string, string[]>>({});
  const chipTimers = useRef<number[]>([]);
  const [locked, setLocked] = useState(false);
  const holdTimer = useRef(0);
  const gestureUntil = useRef(0);
  const gestureToken = useRef("");
  const consumedDraftRound = useRef<number | null>(null);
  const finishedCareerKey = useRef<string | null>(null);
  const simTimer = useRef(0);
  const [archive, setArchive] = useState<ArchiveCareer[]>(() => {
    try {
      return loadArchive();
    } catch {
      return [];
    }
  });

  function holdThen(ms: number, fn: () => void) {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    setLocked(true);
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = 0;
      setLocked(false);
      fn();
    }, ms);
  }
  const [viewing, setViewing] = useState<ArchiveCareer | null>(null);
  const [simBusy, setSimBusy] = useState(false);
  const [simShow, setSimShow] = useState(false);
  const [simSlow, setSimSlow] = useState(false);
  const [saveMissed, setSaveMissed] = useState(false);
  const simJob = useRef<ReturnType<typeof openCareerSim> | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const saveGen = useRef(0);
  const lang = useLang();
  const [newLife, setNewLife] = useState<NewLifeDialog | null>(null);
  const newLifeBusy = useRef(false);
  const [storageOff] = useState(() => typeof window !== "undefined" && !persistentStorageAvailable());
  const [loadNotice, setLoadNotice] = useState<LiveLoadReport | null>(() =>
    bootReport.state === "corrupt" || bootReport.state === "future" || bootReport.state === "incompatible" || bootReport.state === "migrated"
      ? bootReport
      : null,
  );
  const [otherTab, setOtherTab] = useState(false);
  const [archiveNote, setArchiveNote] = useState<string | null>(null);
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(
    () => watchLiveConflicts(() => playerRef.current?.careerId ?? null, () => setOtherTab(true)),
    [],
  );

  // Finished = this career already has an archive entry (persisted or only in memory).
  const playerDone = !!player?.careerId && archive.some((c) => c.careerId === player.careerId);

  useLayoutEffect(() => {
    document.documentElement.classList.remove("pivot-live", "pivot-ready");
    initLang();
  }, []);

  useEffect(() => {
    const lean =
      typeof navigator !== "undefined" && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2;
    document.documentElement.classList.toggle("pivot-lean", lean);
  }, []);

  useEffect(() => {
    const sync = () => document.documentElement.classList.toggle("pivot-asleep", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    const last = { t: 0, x: 0, y: 0 };
    const onClick = (event: MouseEvent) => {
      const now = performance.now();
      const dist = Math.hypot(event.clientX - last.x, event.clientY - last.y);
      if (last.t > 0 && now - last.t < 120 && dist < 12) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      last.t = now;
      last.x = event.clientX;
      last.y = event.clientY;
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (simTimer.current) window.clearTimeout(simTimer.current);
    chipTimers.current.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (screen !== "career" || !pending) return;
    const el = document.querySelector("[data-pending]");
    if (el) el.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [pending, log.length, screen]);

  const tabRef = useRef(tab);
  tabRef.current = tab;

  useEffect(() => {
    if (screen !== "draft" && screen !== "career") return;
    const prev = loadSwipe();
    saveSwipe({ tab, dir: prev?.dir || "next", hint: prev?.hint ?? false });
  }, [tab, screen]);

  useEffect(() => {
    if ((screen !== "draft" && screen !== "career") || !player) return;
    const gen = ++saveGen.current;
    const run = () => {
      if (gen !== saveGen.current) return;
      const wrote = saveLive({
        player,
        pending: pending && pending.kind !== "call" ? (pending as never) : pending,
        log,
        screen,
        tab: tabRef.current,
        logSeq: logSeqFrom(log),
      });
      if (gen === saveGen.current) setSaveMissed(!wrote);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idle = 0;
    const t = window.setTimeout(() => {
      if (gen !== saveGen.current) return;
      if (w.requestIdleCallback) idle = w.requestIdleCallback(run, { timeout: 900 });
      else run();
    }, 360);
    return () => {
      window.clearTimeout(t);
      if (idle && w.cancelIdleCallback) w.cancelIdleCallback(idle);
    };
  }, [player, pending, log, screen]);

  useEffect(() => {
    if (screen === "career") return;
    chipTimers.current.forEach((id) => window.clearTimeout(id));
    chipTimers.current = [];
  }, [screen]);

  function takeGesture(token: string) {
    const now = performance.now();
    if (gestureToken.current === token && now < gestureUntil.current) return false;
    gestureToken.current = token;
    gestureUntil.current = now + 600;
    return true;
  }

  function pushLog(e: Omit<LogEntry, "id">, chips?: string[]) {
    const id = nid();
    const clean = {
      ...e,
      ...(typeof e.body === "string" ? { body: tidyText(e.body) } : {}),
      ...(typeof e.result === "string" ? { result: tidyText(e.result) } : {}),
    };
    setLog((prev) => [...prev, { ...clean, id }]);
    if (!chips?.length) return;
    setFxChips((prev) => ({ ...prev, [id]: chips }));
    const born = performance.now();
    const schedule = consequenceSchedule(born);
    const timer = window.setTimeout(() => {
      setFxChips((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, schedule.removeAt - born);
    chipTimers.current.push(timer);
  }

  function startDraft() {
    const s = freshPlayer(
      name.trim() || "Il Rookie",
      role,
      nat,
      Number.isFinite(number) ? Math.max(0, Math.min(99, number)) : 23,
      difficulty,
    );
    withPlayer(s, () => {
      s.rivalName = pick(RIVAL_NAMES);
      s.coachName = pick(COACH_NAMES);
    });
    refreshOverall(s);
    setPlayer(s);
    setScreen("draft");
  }

  function identity() {
    return {
      name: name.trim() || "Il Rookie",
      role,
      nationality: nat,
      number: Number.isFinite(number) ? Math.max(0, Math.min(99, number)) : 23,
    };
  }

  function cancelSim() {
    simJob.current = null;
    setSimBusy(false);
    setSimShow(false);
    setSimSlow(false);
  }

  function runOneSim() {
    if (simBusy) return;
    setSimBusy(true);
    setSimShow(false);
    setSimSlow(false);
    let job: ReturnType<typeof openCareerSim>;
    try {
      job = openCareerSim({ ...identity(), difficulty });
    } catch {
      cancelSim();
      return;
    }
    simJob.current = job;
    const t0 = performance.now();
    const pump = () => {
      if (simJob.current !== job) return;
      const elapsed = performance.now() - t0;
      if (elapsed >= 1000) setSimShow(true);
      if (elapsed >= 10000) setSimSlow(true);
      try {
        const done = advanceCareerSim(job);
        if (!done) {
          window.setTimeout(pump, 0);
          return;
        }
        const entry = toArchive(job.s);
        const all = saveArchive(entry);
        noteArchive(entry.id);
        simJob.current = null;
        setArchive(all);
        setPlayer(job.s);
        setPending(null);
        setLog([]);
        setSimBusy(false);
        setSimShow(false);
        setSimSlow(false);
        // A quick sim never had a live save of its own; only an archived career may clear one.
        if (isArchivePersisted(entry.id)) clearLive();
        setScreen("result");
      } catch {
        cancelSim();
      }
    };
    window.setTimeout(pump, 0);
  }

  function chooseDraft(cardIndex: number) {
    if (!player || !takeGesture("draft")) return;
    if (consumedDraftRound.current === player.round) return;
    consumedDraftRound.current = player.round;
    const s = structuredClone(player);
    applyDraftCard(s, s.round, cardIndex);
    if (s.round >= allDraftRounds().length) finishDraft(s);
    setPlayer(s);
  }

  function beginCareer() {
    if (!player || !takeGesture("begin")) return;
    const s = structuredClone(player);
    s.overall = START_OVERALL;
    s.peakOverall = START_OVERALL;
    setLog([]);
    setTab("log");
    setScreen("career");
    setPlayer(s);
    setPending({ kind: "path" });
    pushLog({
      kind: "narrative",
      body: `Il Draft si avvicina. ${s.name}, ${ROLE_ARTICLE[s.role] || "un "}${ROLES[s.role].label.toLowerCase()} ${natAdj(s.role, s.nationality)}, deve scegliere i primi passi da professionista.`,
    });
  }

  function afterPath(path: "NCAA" | "Europa" | "G-League") {
    if (!player || !takeGesture("path")) return;
    const s = structuredClone(player);
    const beforeTeam = s.overall;
    const landed = withPlayer(s, () => {
      startProPath(s, path);
      const land = revealDraftLanding(s);
      s.choiceLog.push({ season: 0, title: "Percorso", pick: path });
      s.choiceLog.push({ season: 0, title: "Chiamata", pick: `${land.pick}ª` });
      const flavor = `${pathFeel(path, s.team.name, s)} Sei la ${land.pick}ª scelta. Contratto: ${s.contract.years} ${s.contract.years === 1 ? "anno" : "anni"} a ${s.contract.annualM} milioni.`;
      return { pick: land.pick, flavor };
    });
    setPlayer(s);
    setPending({ kind: "call", pick: landed.pick, flavor: landed.flavor });
    pushLog({
      kind: "narrative",
      body: `${path}. Il mestiere si è mosso: overall ${displayOverall(beforeTeam)} → ${displayOverall(s.overall)}. Poi squilla il telefono: ${landed.pick}ª scelta, ${s.team.name}.`,
    });
  }

  function afterCall() {
    if (!player || !takeGesture("call")) return;
    const s = structuredClone(player);
    s.season = 1;
    setPlayer(s);
    queuePreseason(s, 1);
  }

  function queuePreseason(s: PlayerState, n: number, intro?: string) {
    if (intro) pushLog({ kind: "narrative", body: intro });
    s.season = n;
    withPlayer(s, () => queuePreseasonInner(s, n));
  }

  function queuePreseasonInner(s: PlayerState, n: number) {
    const scripted = scriptedSeasonEvent(s, n);
    if (scripted) {
      if (!s.usedEventIds.includes(scripted.id)) s.usedEventIds.push(scripted.id);
      const script: SavedStoryScript = scriptedSeasonSlot(s, n) ?? "pool";
      setPending(pendingFromEvent(scripted, script, s));
      return;
    }
    if (shouldOfferTrade(s, n) && n !== 12) {
      const t = buildTradeOffer(s);
      if (shouldForceTrade(s)) {
        const dest = t.team;
        const from = acceptForcedPreseasonTrade(s, dest, n);
        setPlayer(s);
        setPending({ kind: "trade-notice", team: dest, from, pitch: t.pitch });
        return;
      }
      setPending({ kind: "trade", team: t.team, pitch: t.pitch });
      return;
    }
    const ev = pickStoryEvent(s, n);
    const script: SavedStoryScript = ev.id.startsWith("late-")
      ? "late"
      : ev.id.startsWith("quiet-")
        ? "quiet"
        : "pool";
    setPending(pendingFromEvent(ev, script, s));
  }
  function runSeason(s: PlayerState) {
    const n = s.season || 1;
    withPlayer(s, () => {
      const row = simulateRegularSeason(s, n);
      const qualified = qualifiesPlayoffs(s, row);
      const rec = teamRecord(row);
      const awardNote = row.awards.length ? "" : noAwardLine(s);
      const door = qualified
        ? rec.seed
          ? doorLine(s, "in-seed", rec.seed, rec.conf)
          : doorLine(s, "in")
        : doorLine(s, "out");
      setPlayer(s);
      setPending({ kind: "recap", row, qualified, awardNote, door });
      setTab("log");
    });
  }

  function continueAfterRecap(qualified: boolean) {
    if (!player || !takeGesture("recap")) return;
    holdThen(HOLD_RECAP_MS, () => continueAfterRecapInner(qualified));
  }

  function continueAfterRecapInner(qualified: boolean) {
    if (!player) return;
    const s = structuredClone(player);
    const last = s.seasonHistory[s.seasonHistory.length - 1];
    pushLog({
      kind: "recap",
      title: last ? `Stagione ${last.season} · ${getSeasonDisplayLabel(last.season)}` : "Stagione",
      extraClass: "recap",
      resolved: true,
      row: last,
      result: pending?.kind === "recap" ? pending.door : qualified
        ? "Dentro. I playoff partono."
        : "Fuori. Si gira pagina.",
    });
    withPlayer(s, () => {
      if (qualified) {
        beginPlayoffs(s);
        const opp = pickPlayoffOpponent(s, 0);
        setPlayer(s);
        setPending(openPlayoff(s, 0, opp));
        return;
      }
      if (last && !last.playoff) last.playoff = "Fuori";
      settleYearTitle(s, false);
      setPlayer(s);
      goOffseasonOrEnd(s);
    });
  }

  function pickPlayoff(choiceIndex: number) {
    if (!player || pending?.kind !== "playoff" || !takeGesture("playoff")) return;
    const s = structuredClone(player);
    const { round, opponent } = pending;
    const before = s.overall;
    const beforeAttrs = {
      attrs: { ...s.attrs },
      morale: s.morale,
      overall: s.overall,
    };
    const choice = playoffChoicesFor(s, round)[choiceIndex];
    const res = withPlayer(s, () => resolvePlayoffRound(s, s.season, round, choiceIndex, opponent));
    const chips = chipsFromSnapshot(beforeAttrs, s, ATTR_LABELS);
    s.choiceLog.push({
      season: s.season,
      title: playoffRounds(s)[round] || "Playoff",
      pick: choice?.label || "Scelta",
    });
    setPlayer(s);
    pushLog({
      kind: "playoff",
      title: playoffRounds(s)[round],
      body: `vs ${opponent.name}`,
      chosen: choice?.label,
      result: withOvr(res.flavor, before, s.overall),
      resolved: true,
      extraClass: res.champion ? "title-win" : "playoff",
      ovrBefore: before,
      ovrAfter: s.overall,
      series: res.series,
    }, chips);
    if (res.champion) {
      setPending(null);
      holdThen(HOLD_FINALS_MS, () => goOffseasonOrEnd(s));
      return;
    }
    if (!res.win) {
      goOffseasonOrEnd(s);
      return;
    }
    const nextOpp = withPlayer(s, () => pickPlayoffOpponent(s, round + 1));
    holdThen(HOLD_RECAP_MS, () => setPending(openPlayoff(s, round + 1, nextOpp)));
  }

  function goOffseasonOrEnd(s: PlayerState) {
    const step = offseasonStep(s);
    if (step === "finish") {
      finish(s);
      return;
    }
    if (step === "offer") {
      setPlayer(s);
      setPending({ kind: "retire" });
      return;
    }
    if (step === "play-final") {
      const next = s.season + 1;
      queuePreseason(s, next);
      setPlayer({ ...s, season: next });
      return;
    }
    continueAfterSummer(s);
  }

  function continueAfterSummer(s: PlayerState) {
    const step = offseasonStep(s);
    if (step === "finish") {
      finish(s);
      return;
    }
    if (step === "play-final") {
      const next = s.season + 1;
      queuePreseason(s, next);
      setPlayer({ ...s, season: next });
      return;
    }
    const row = applyAutoOffseason(s, s.season);
    const feel = withPlayer(s, () => summerFeel(s, row.label));
    pushLog({
      kind: "offseason",
      title: "Estate",
      result: withOvr(`${feel} ${row.line || "Mantenimento"}.`, row.before, row.after),
      resolved: true,
      extraClass: "offseason",
      ovrBefore: row.before,
      ovrAfter: row.after,
    });
    tickContract(s);
    setPlayer(s);
    if (isContractYear(s, s.season + 1) || s.contract.yearsRemaining <= 0) {
      const offers = buildFaOffers(s);
      setPending({
        kind: "fa",
        offers,
        desk: withPlayer(s, () => faDeskLine(s, offers.some((o) => o.kind === "extension"), s.team.name)),
      });
      return;
    }
    if (row.tradeDest) {
      const completedSeason = s.season;
      s.season = completedSeason + 1;
      if (row.tradeForced) {
        const dest = row.tradeDest;
        const from = acceptForcedSummerTrade(s, dest, completedSeason);
        setPlayer(s);
        setPending({
          kind: "trade-notice",
          team: dest,
          from,
          pitch: row.line || `${dest.city} ha chiuso senza chiederti il permesso.`,
        });
        return;
      }
      setPlayer(s);
      setPending({
        kind: "trade",
        team: row.tradeDest,
        pitch: row.line || `${row.tradeDest.name} è sul foglio. Puoi salire o restare.`,
      });
      return;
    }
    const next = s.season + 1;
    queuePreseason(s, next);
    setPlayer({ ...s, season: next });
  }

  function pickOffer(offer: MarketOffer) {
    if (!player || !takeGesture("offer")) return;
    const s = structuredClone(player);
    const before = s.overall;
    const old = acceptOffer(s, offer);
    s.choiceLog.push({
      season: s.season,
      title: "Agenzia libera",
      pick: `${offer.team.name} · ${offer.years}×$${offer.annualM}M`,
    });
    const staying = old === s.team.name || offer.kind === "extension";
    pushLog({
      kind: "market",
      title: staying ? "Rinnovo" : "Trasferimento",
      result: staying
        ? withOvr(`Resti a ${s.team.name}: ${offer.years} anni a $${offer.annualM}M a stagione.`, before, s.overall)
        : withOvr(`Lasci ${old} per ${s.team.name}: ${offer.years} anni a $${offer.annualM}M a stagione.`, before, s.overall),
      resolved: true,
      extraClass: staying ? "market" : "market-move",
      ovrBefore: before,
      ovrAfter: s.overall,
    });
    const next = s.season + 1;
    s.season = next;
    setPlayer(s);
    setPending(null);
    holdThen(HOLD_MARKET_MS, () => queuePreseason(s, next));
  }

  function onTrade(go: boolean) {
    if (!player || pending?.kind !== "trade" || !takeGesture("trade")) return;
    const s = structuredClone(player);
    const before = s.overall;
    if (go) {
      const old = acceptTrade(s, pending.team);
      s.choiceLog.push({ season: s.season, title: "Scambio", pick: pending.team.name });
      pushLog({
        kind: "market",
        title: "Trasferimento",
        result: withOvr(`Lo scambio si fa: da ${old} a ${s.team.name}.`, before, s.overall),
        resolved: true,
        extraClass: "market-move",
        ovrBefore: before,
        ovrAfter: s.overall,
      });
    } else {
      refuseTrade(s);
      s.choiceLog.push({ season: s.season, title: "Scambio", pick: "Resto" });
      pushLog({
        kind: "market",
        result: withOvr(`Rifiuti. Resti a ${s.team.name}, che apprezza la fedeltà.`, before, s.overall),
        resolved: true,
        extraClass: "market",
        ovrBefore: before,
        ovrAfter: s.overall,
      });
    }
    setPlayer(s);
    const nextPending = withPlayer(s, () => {
      const { event, script } = eventAfterMarket(s);
      return pendingFromEvent(event, script, s);
    });
    setPending(null);
    holdThen(HOLD_MARKET_MS, () => setPending(nextPending));
  }

  function onForcedTradeAck() {
    if (!player || pending?.kind !== "trade-notice" || !takeGesture("trade-ack")) return;
    const s = structuredClone(player);
    pushLog({
      kind: "market",
      title: "Scambio chiuso",
      result: `La dirigenza ha deciso: da ${pending.from} a ${pending.team.name}. ${pending.pitch}`,
      resolved: true,
      extraClass: "market-move",
    });
    const { event, script } = withPlayer(s, () => eventAfterMarket(s));
    setPlayer(s);
    setPending(pendingFromEvent(event, script, s));
  }

  function onStory(opt: Opt) {
    if (!player || !takeGesture("story")) return;
    const s = structuredClone(player);
    const before = s.overall;
    const outcome = withPlayer(s, () => opt.run(s));
    s.choiceLog.push({ season: s.season, title: pending?.kind === "story" ? pending.title : "Scelta", pick: opt.label });
    setPlayer(s);
    pushLog({
      kind: "decision",
      title: pending && pending.kind === "story" ? pending.title : "Decisione",
      chosen: opt.label,
      result: withOvr(outcome.flavor, before, s.overall),
      resolved: true,
      ovrBefore: before,
      ovrAfter: s.overall,
    }, outcome.chips);
    const snapshot = s;
    holdThen(HOLD_TITLE_MS, () => runSeason(snapshot));
  }

  function onRetire(extra: boolean) {
    if (!player || pending?.kind !== "retire" || !takeGesture("retire")) return;
    const s = structuredClone(player);
    recordRetirementChoice(s, extra);
    if (extra) {
      s.extraSeason = true;
      withPlayer(s, () => applyFx(s, { development: 0.4, form: 1, flavor: "Un'altra stagione." }));
      setPlayer(s);
      continueAfterSummer(s);
      return;
    }
    finish(s);
  }

  function finish(s: PlayerState) {
    const key = `${s.seed}:${s.seasonHistory.length}:${s.age}`;
    if (finishedCareerKey.current === key) return;
    finishedCareerKey.current = key;
    const entry = toArchive(s);
    const all = saveArchive(entry);
    noteArchive(entry.id);
    setArchive(all);
    setPlayer(s);
    setPending(null);
    // The live save goes only once the archive copy is in storage that outlives the tab.
    if (isArchivePersisted(entry.id)) clearLive();
    setScreen("result");
  }

  /** Tells the player when the archive did not persist or pushed an old career out. */
  function noteArchive(id: string) {
    if (!isArchivePersisted(id)) {
      setArchiveNote(t("archiveUnsaved", lang));
      return;
    }
    const gone = lastArchiveEvicted()[0];
    setArchiveNote(gone ? tf("archiveEvicted", { limit: ARCHIVE_LIMIT, name: gone.name }, lang) : null);
  }

  function careerFacts() {
    const careerId = player?.careerId ?? loadLive()?.player.careerId ?? null;
    const done = archiveStateOf(careerId);
    return { hasLive: !!player || hasLiveSave(), finished: done.finished, archived: done.archived };
  }

  /** "Nuova vita" / "Un'altra vita": asks first whenever something could be lost. */
  function requestNewLife(origin: NewLifeOrigin) {
    if (newLifeBusy.current || newLife) return;
    const ask = newLifeAsk(careerFacts());
    if (ask === "none") {
      startNewLife(origin, false);
      return;
    }
    setNewLife({ ask, origin, error: null });
  }

  function startNewLife(origin: NewLifeOrigin, confirmed: boolean) {
    if (newLifeBusy.current) return;
    newLifeBusy.current = true;
    try {
      const cleared = clearLive();
      if (!cleared && confirmed) {
        // Nothing was deleted: say so and keep the career.
        setNewLife((d) => (d ? { ...d, error: t("nlDeleteFailed", lang) } : d));
        return;
      }
      setNewLife(null);
      setArchiveNote(null);
      setOtherTab(false);
      finishedCareerKey.current = null;
      setPlayer(null);
      setPending(null);
      setLog([]);
      setScreen(origin === "intro" ? "setup" : "intro");
    } finally {
      newLifeBusy.current = false;
    }
  }

  function retryArchive() {
    if (!player || newLifeBusy.current) return;
    newLifeBusy.current = true;
    try {
      const entry = loadArchive().find((c) => c.careerId === player.careerId);
      if (entry) setArchive(saveArchive(entry));
      if (entry && isArchivePersisted(entry.id)) {
        setNewLife(null);
        setArchiveNote(t("nlRetryOk", lang));
      } else {
        setNewLife((d) => (d ? { ...d, error: t("nlRetryFailed", lang) } : d));
      }
    } finally {
      newLifeBusy.current = false;
    }
  }

  const chartData = useMemo(() => {
    if (!player) return [];
    const curve = idealCurveSeries(player);
    const byAge = new Map(player.seasonHistory.map((r) => [r.age, r.overall]));
    return curve.map((c) => ({
      age: c.age,
      curva: c.curva,
      overall: byAge.get(c.age),
    }));
  }, [player]);

  return (
    <div className="pivot-stage">
      <aside className="ad-rail" aria-hidden="true"><span>{t("adReserved", lang)}</span></aside>
      <div className={screen === "career" ? "pivot-app career-mode" : "pivot-app"}>
      <div className="app-notices" role="status" aria-live="polite">
        {storageOff && screen !== "result" && screen !== "archive" ? <p className="app-notice">{t("storageOff", lang)}</p> : null}
        {loadNotice && screen === "intro" ? (
          <div className="app-notice">
            <p>
              {t(loadNotice.state === "future" ? "loadFuture" : loadNotice.state === "incompatible" ? "loadIncompatible" : loadNotice.state === "migrated" ? "loadMigrated" : "loadCorrupt", lang)}
              {loadNotice.state !== "migrated" ? ` ${t(loadNotice.backedUp ? "loadBackedUp" : "loadNotBackedUp", lang)}` : ""}
            </p>
            <button type="button" className="ghost-btn" onClick={() => setLoadNotice(null)}>{t("dismiss", lang)}</button>
          </div>
        ) : null}
        {otherTab && (screen === "career" || screen === "draft") ? <p className="app-notice">{t("otherTab", lang)}</p> : null}
        {saveMissed && screen === "draft" ? <p className="app-notice">{t("saveMiss", lang)}</p> : null}
        {screen === "career" && pending?.kind === "retire" && archive.length >= ARCHIVE_LIMIT && !archive.some((c) => c.careerId && c.careerId === player?.careerId) ? (
          <p className="app-notice">{tf("archiveFullSoon", { limit: ARCHIVE_LIMIT, name: archive[archive.length - 1]!.name }, lang)}</p>
        ) : null}
        {archiveNote && (screen === "result" || screen === "intro") ? <p className="app-notice">{archiveNote}</p> : null}
      </div>
      {screen === "intro" && (
        <section className="intro-hero home-screen">
          {premiere ? (
            <button type="button" className="cine-skip" onClick={() => setPremiere(false)}>
              {t("skip", lang)}
            </button>
          ) : null}
          <div
            onAnimationEnd={(event) => {
              if (event.animationName === "cineReveal") setPremiere(false);
            }}
          >
            <CourtMark number={23} size={132} brand premiere={premiere} />
          </div>
          <span className="eyebrow">{t("eyebrow", lang)}</span>
          <h1 className="display-title">PIVOT</h1>
          <p className="lede">{t("lede", lang)}</p>
          <div className="lang-row" role="group" aria-label={t("lang", lang)}>
            {DEMO_LANGS.map((id) => (
              <button
                key={id}
                type="button"
                className={`lang-btn ${lang === id ? "on" : ""}`}
                aria-pressed={lang === id}
                lang={id}
                onClick={() => setLang(id)}
              >
                {id === "it" ? "Italiano" : "English"}
              </button>
            ))}
          </div>
          {lang === "en" ? <p className="text-[12.5px] text-muted mt-2">{t("enNarrativeNote", lang)}</p> : null}
          {player && (playerDone || player.originPath || player.round > 0) ? (
            <>
              {playerDone ? (
                <button className="primary-btn" onClick={() => setScreen("result")}>
                  {t("seeEnd", lang)}
                </button>
              ) : (
                <button
                  className="primary-btn"
                  onClick={() =>
                    setScreen(!player.originPath && player.round < allDraftRounds().length ? "draft" : "career")
                  }
                >
                  {t("resume", lang)}
                </button>
              )}
              <button
                className="ghost-btn mt-2.5"
                aria-haspopup="dialog"
                onClick={() => requestNewLife("intro")}
              >
                {t("newLife", lang)}
              </button>
            </>
          ) : (
            <button className="primary-btn" onClick={() => setScreen("setup")}>
              {t("start", lang)}
            </button>
          )}
          <button className="ghost-btn mt-2.5" onClick={() => setGuideOpen(true)}>
            {t("how", lang)}
          </button>
          {archive.length > 0 && (
            <button className="ghost-btn mt-2.5" onClick={() => { setViewing(null); setScreen("archive"); }}>
              {t("archive", lang)} · {archive.length}
            </button>
          )}
          <p className="totem-credit totem-home">Powered by Totem</p>
        </section>
      )}

      {screen === "setup" && (
        <section className="fade-in">
          <button className="back-link" onClick={() => setScreen("intro")}>
            <ChevronLeft className="size-4" aria-hidden="true" /> {t("home", lang)}
          </button>
          <h2 className="page-title">{t("setupTitle", lang)}</h2>
          <p className="lede">{t("setupLede", lang)}</p>
          <label className="group-label" htmlFor="setup-name">{t("setupName", lang)}</label>
          <div className="group-card">
            <input id="setup-name" className="text-input" maxLength={20} autoComplete="off" placeholder={t("namePlaceholder", lang)} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <span className="group-label" id="setup-role-label">{t("setupRole", lang)}</span>
          <div className="grid grid-cols-2 gap-2 mb-6" role="group" aria-labelledby="setup-role-label">
            {(Object.keys(ROLES) as Role[]).map((r) => (
              <button key={r} className={`pill-btn ${role === r ? "selected" : ""}`} aria-pressed={role === r} onClick={() => setRole(r)}>
                {roleLabel(r, lang)}
              </button>
            ))}
          </div>
          <span className="group-label" id="setup-from-label">{t("setupFrom", lang)}</span>
          <div className="grid grid-cols-3 gap-2 mb-6" role="group" aria-labelledby="setup-from-label">
            {NATIONALITIES.map((n) => (
              <button
                key={n.id}
                className={`pill-btn nat-pill ${nat === n.id ? "selected" : ""}`}
                aria-pressed={nat === n.id}
                onClick={() => setNat(n.id)}
              >
                <span aria-hidden="true">
                  <FlagMark nation={n.id} size={16} />
                </span>
                {nationLabel(n.id, lang)}
              </button>
            ))}
          </div>
          <label className="group-label" htmlFor="setup-number">{t("setupNumber", lang)}</label>
          <div className="jersey-hero">
            <CourtMark number={Number.isFinite(number) ? number : 23} size={88} brand={number === 23} />
            <div>
              <div className="num tabular">{Number.isFinite(number) ? number : 23}</div>
              <div className="hint" id="setup-number-hint">{t("setupHint", lang)}</div>
            </div>
          </div>
          <input id="setup-number" aria-describedby="setup-number-hint" className="text-input mb-6 w-24 text-center" type="number" inputMode="numeric" min={0} max={99} value={number} onChange={(e) => setNumber(parseInt(e.target.value, 10) || 0)} />
          <span className="group-label" id="setup-diff-label">{t("setupDiff", lang)}</span>
          <div className="flex flex-col gap-2 mb-6" role="group" aria-labelledby="setup-diff-label">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className={`diff-card ${difficulty === d.id ? "selected" : ""}`}
                aria-pressed={difficulty === d.id}
                onClick={() => setDifficulty(d.id)}
              >
                <span className="diff-head">
                  <b>{difficultyFace(d.id, lang).label}</b>
                  <em>{difficultyFace(d.id, lang).tag}</em>
                </span>
                <span className="diff-desc">{difficultyFace(d.id, lang).desc}</span>
              </button>
            ))}
          </div>
          <button className="primary-btn" onClick={startDraft} disabled={simBusy || name.trim().length < 1}>
            {t("setupDraft", lang)}
          </button>
          <button className="ghost-btn mt-2.5" onClick={runOneSim} disabled={simBusy || name.trim().length < 1}>
            {simShow ? <SaveGlyph /> : `${t("setupSim", lang)} · ${difficultyFace(difficulty, lang).label}`}
          </button>
          {simSlow ? (
            <div className="sim-note">
              <p>{t("simSlow", lang)}</p>
              <button type="button" className="ghost-btn mt-2.5" onClick={cancelSim}>{t("simCancel", lang)}</button>
            </div>
          ) : null}
        </section>
      )}

      {screen === "draft" && player && (
        <DraftView player={player} onPick={chooseDraft} onStart={beginCareer} />
      )}

      {screen === "career" && player && (
        <CareerGuard>
        <CareerView
          player={player}
          tab={tab}
          setTab={setTab}
          log={log}
          chips={fxChips}
          pending={pending}
          locked={locked}
          chartData={chartData}
          onPath={afterPath}
          onCall={afterCall}
          onStory={onStory}
          onRecap={continueAfterRecap}
          onPlayoff={pickPlayoff}
          onOffer={pickOffer}
          onTrade={onTrade}
          onForcedTradeAck={onForcedTradeAck}
          onRetire={onRetire}
          saveMissed={saveMissed}
        />
        </CareerGuard>
      )}

      {screen === "result" && player && (
        <ResultView player={player} onReplay={() => requestNewLife("replay")} onArchive={() => { setViewing(null); setScreen("archive"); }} />
      )}

      {screen === "archive" && (
        <ArchiveView
          archive={archive}
          viewing={viewing}
          setViewing={setViewing}
          onBack={() => { setViewing(null); setScreen("intro"); }}
        />
      )}
      <MiniGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
      <ModalDialog
        open={!!newLife}
        className="confirm-sheet"
        title={t(newLife?.ask === "unarchived" ? "nlTitleUnarchived" : "nlTitleRunning", lang)}
        onCancel={() => setNewLife(null)}
        actions={
          <>
            <button type="button" className="guide-next" onClick={() => setNewLife(null)}>
              {t("nlCancel", lang)}
            </button>
            {newLife?.ask === "unarchived" ? (
              <button type="button" className="guide-skip" onClick={retryArchive}>
                {t("nlRetryArchive", lang)}
              </button>
            ) : null}
            <button type="button" className="guide-danger" onClick={() => newLife && startNewLife(newLife.origin, true)}>
              {t("nlConfirm", lang)}
            </button>
          </>
        }
      >
        <p>
          {newLife?.ask === "unarchived"
            ? tf("nlBodyUnarchived", { name: player?.name ?? "" }, lang)
            : tf("nlBodyRunning", { name: player?.name ?? "", seasons: seasonsText(player?.seasonHistory.length ?? 0, lang) }, lang)}
        </p>
        <p>{t("nlKeepArchive", lang)}</p>
        {newLife?.error ? <p className="confirm-error" role="alert">{newLife.error}</p> : null}
      </ModalDialog>
      </div>
      <aside className="ad-rail" aria-hidden="true"><span>{t("adReserved", lang)}</span></aside>
      <div className="ad-foot">
        <p className="totem-credit">Powered by Totem</p>
      </div>
    </div>
  );
}

function seasonsText(n: number, lang: string) {
  if (lang === "en") return n === 1 ? "1 season played" : `${n} seasons played`;
  return n === 1 ? "1 stagione giocata" : `${n} stagioni giocate`;
}

function withOvr(text: string, before: number, after: number) {
  const b = Math.round(before);
  const a = Math.round(after);
  const d = a - b;
  if (d === 0) return tidyText(text);
  const sign = d > 0 ? "+" : "";
  return tidyText(`${text} Overall ${b} → ${a} (${sign}${d}).`);
}

function openPlayoff(s: PlayerState, round: number, opponent: Team): Pending {
  const label = playoffRounds(s)[round] || "Playoff";
  return { kind: "playoff", round, opponent, nerves: withPlayer(s, () => playoffNerves(s, label, opponent.name)) };
}

function teamRecord(row: SeasonRow) {
  const snap = row.league;
  if (snap) {
    const t = [...snap.east, ...snap.west, ...snap.euro].find((x) => x.abbr === row.teamAbbr);
    if (t) return { w: t.w, l: t.l, seed: t.seed, conf: t.conf };
  }
  return { w: row.wins, l: row.losses, seed: row.seed, conf: row.conf };
}

function DraftView({
  player,
  onPick,
  onStart,
}: {
  player: PlayerState;
  onPick: (i: number) => void;
  onStart: () => void;
}) {
  const lang = useLang();
  if (player.round >= allDraftRounds().length) {
    return (
      <section className="fade-in">
        <div className="text-[13px] text-wood mb-1">{t("profileReady", lang)}</div>
        <h2 className="page-title">{t("playerReady", lang)}</h2>
        <p className="text-muted text-[14px] mb-4">
          {tf("playerReadyLede", { name: player.name, role: roleLabel(player.role, lang) }, lang)}
        </p>
        <AttrBars attrs={player.attrs} />
        <button className="primary-btn mt-6" onClick={onStart}>
          {t("startCareer", lang)}
        </button>
      </section>
    );
  }
  const r = allDraftRounds()[player.round]!;
  const hand = player.draftHand.length ? player.draftHand : r.cards.slice(0, 3);
  const total = allDraftRounds().length;
  return (
    <section className="fade-in">
      <div className="text-[13px] text-wood mb-1">{tf("draftRound", { n: player.round + 1, total }, lang)}</div>
      <div className="draft-pips" aria-hidden="true">
        {allDraftRounds().map((_, i) => (
          <span key={i} className={i < player.round ? "done" : i === player.round ? "now" : ""} />
        ))}
      </div>
      <h2 className="page-title">{r.label}</h2>
      <p className="text-muted text-[14px] mb-4">{r.prompt} {t("draftThree", lang)}</p>
      <div className="flex flex-col gap-2.5">
        {hand.map((c, i) => {
          const shown = scaledDraftCard(player.role, c);
          return (
            <button
              key={c.name}
              className="draft-card"
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => onPick(i)}
            >
              <div className="font-display text-[19px] font-semibold">{c.name}</div>
              <div className="text-[13px] text-muted leading-snug">{c.desc}</div>
              <div className="text-[12.5px] text-wood mt-1">
                {shown.primary.delta > 0 ? "+" : ""}
                {shown.primary.delta.toFixed(0)} {attrLabel(shown.primary.key, lang)}
                {shown.secondary.map((sec) => `, ${sec.delta > 0 ? "+" : ""}${sec.delta.toFixed(0)} ${attrLabel(sec.key, lang)}`).join("")}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-4 pt-3.5 border-t border-line">
        {(Object.keys(ATTR_LABELS) as AttrKey[]).map((k) => (
          <span key={k} className="text-[11px] text-muted bg-panel border border-line px-2 py-1 rounded-sm">
            {attrLabel(k, lang)} <b className="text-chalk">{player.attrs[k].toFixed(0)}</b>
          </span>
        ))}
      </div>
    </section>
  );
}

function CareerView(props: {
  player: PlayerState;
  tab: Tab;
  setTab: (t: Tab) => void;
  log: LogEntry[];
  chips: Record<string, string[]>;
  pending: Pending | null;
  locked: boolean;
  chartData: { age: number; overall?: number; curva: number }[];
  onPath: (p: "NCAA" | "Europa" | "G-League") => void;
  onCall: () => void;
  onStory: (o: Opt) => void;
  onRecap: (q: boolean) => void;
  onPlayoff: (i: number) => void;
  onOffer: (o: MarketOffer) => void;
  onTrade: (go: boolean) => void;
  onForcedTradeAck: () => void;
  onRetire: (extra: boolean) => void;
  saveMissed: boolean;
}) {
  const lang = useLang();
  const { player, tab, setTab, pending } = props;
  const last = player.seasonHistory[player.seasonHistory.length - 1];
  const [hint, setHint] = useState(() => loadSwipe()?.hint !== true);
  const [fullLog, setFullLog] = useState(false);
  const logShown = fullLog || props.log.length <= 24 ? props.log : props.log.slice(-24);
  function goTab(next: Tab, dir: "next" | "prev") {
    if (next === tab) return;
    setTab(next);
    saveSwipe({ tab: next, dir, hint: true });
    if (hint) setHint(false);
  }
  return (
    <div
      className="career-view"
      style={{ ["--team" as string]: player.team.color }}
    >
      <div className="career-chrome">
        {props.saveMissed ? (
          <p className="save-miss" role="alert">{t("saveMiss", lang)}</p>
        ) : null}
        <div
          className="flex justify-between items-center gap-2.5 py-2.5 border-b border-line"
          style={{ boxShadow: `inset 0 -2px 0 ${player.team.color}` }}
        >
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <TeamMark team={player.team} size={52} number={player.number} />
            <div className="min-w-0">
              <div className="font-display text-[22px] leading-tight truncate">{player.name}</div>
              <div className="hud-meta">
                <FlagMark nation={player.nationality} size={24} />
                <span>{roleLabel(player.role, lang)}</span>
                <span className="hud-age">{tf("ageYears", { n: player.age }, lang)}</span>
                <span className="hud-year">{getSeasonDisplayLabel(player.season || 1)}</span>
              </div>
              <div className="hud-club">
                <TeamCrest team={player.team} size={16} />
                <span>
                  {player.team.name} · {player.league === "EuroLega" ? t("leagueEuro", lang) : "NBA"}
                </span>
              </div>
              {last ? (
                <div className="hud-line tabular">
                  {last.ppg.toFixed(1)}
                  <span>/</span>
                  {last.rpg.toFixed(1)}
                  <span>/</span>
                  {last.apg.toFixed(1)}
                  <span>{t("lastSeason", lang)}</span>
                </div>
              ) : null}
              <div className="hud-contract">
                {player.contract.yearsRemaining === 1 ? t("contractYear", lang) : tf("contractYears", { n: player.contract.yearsRemaining }, lang)} × ${player.contract.annualM}M
                {last ? (() => {
                  const rec = teamRecord(last);
                  return rec.seed ? ` · ${rec.seed}° ${confLabel(rec.conf, lang)}` : "";
                })() : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
          <div
            className="text-center ovr-orb"
            style={{ boxShadow: `0 8px 22px color-mix(in oklab, ${player.team.color} 28%, transparent)` }}
          >
            <div className="font-display text-[22px] text-wood leading-none tabular ovr-orb-num" key={displayOverall(player.overall)}>
              {displayOverall(player.overall)}
            </div>
            <div className="text-[9px] text-muted tracking-wider mt-0.5">OVR</div>
          </div>
          </div>
        </div>
        <div className="seg-track" role="group" aria-label={t("careerTabs", lang)}>
          {(
            [
              ["log", t("tabLog", lang), BookOpen],
              ["season", t("tabYear", lang), ClipboardList],
              ["league", t("tabLeague", lang), Table2],
              ["career", t("tabLife", lang), Trophy],
            ] as const
          ).map(([id, lab, Icon]) => (
            <button
              key={id}
              className={tab === id ? "on" : ""}
              aria-pressed={tab === id}
              onClick={() => {
                const from = CAREER_TABS.indexOf(tab);
                const to = CAREER_TABS.indexOf(id);
                goTab(id, to >= from ? "next" : "prev");
              }}
            >
              <Icon className="size-3.5" /> {lab}
            </button>
          ))}
        </div>
        {hint && <p className="swipe-hint">{t("swipeHint", lang)}</p>}
      </div>

      <SwipeTrack tab={tab} onTab={goTab} labels={[t("tabLog", lang), t("tabYear", lang), t("tabLeague", lang), t("tabLife", lang)]}>
        {[
          <div key="log" className="pt-3.5">
            {!fullLog && props.log.length > 24 && (
              <button type="button" className="ghost-btn mb-3" onClick={() => setFullLog(true)}>
                {t("showFullLog", lang)}
              </button>
            )}
            {logShown.map((e) => (
              <LogBlock key={e.id} e={e} chips={props.chips[e.id]} />
            ))}
            {pending && (
              <div data-pending className={props.locked ? "pending-beat is-held" : "pending-beat"}>
                <PendingBlock
                  player={player}
                  pending={pending}
                  onPath={props.onPath}
                  onCall={props.onCall}
                  onStory={props.onStory}
                  onRecap={props.onRecap}
                  onPlayoff={props.onPlayoff}
                  onOffer={props.onOffer}
                  onTrade={props.onTrade}
                  onForcedTradeAck={props.onForcedTradeAck}
                  onRetire={props.onRetire}
                />
              </div>
            )}
          </div>,
          <SeasonSheet key="season" player={player} />,
          <LeaguePanel key="league" player={player} />,
          <div key="career">
            <StatsTab player={player} chartData={props.chartData} />
            <ReviewTab player={player} />
          </div>,
        ]}
      </SwipeTrack>
    </div>
  );
}

const LogBlock = memo(function LogBlock({ e, chips }: { e: LogEntry; chips?: string[] }) {
  const lang = useLang();
  if (e.kind === "narrative") {
    return (
      <div className="mb-4">
        <p className="text-[14.5px] text-muted leading-relaxed italic">{e.body}</p>
      </div>
    );
  }
  if (e.kind === "recap" && e.row) {
    return <RecapSummary row={e.row} result={e.result} />;
  }
  const cls = [
    e.extraClass === "title-win"
      ? "title-win playoff beat-wow stake-gold"
      : e.extraClass === "market-move"
        ? "market market-move beat-major"
        : e.extraClass === "playoff"
          ? "playoff beat-major"
          : e.extraClass === "offseason"
            ? "offseason"
            : e.extraClass === "market"
              ? "market beat-major"
              : e.kind === "recap"
                ? "recap"
                : e.kind === "decision"
                  ? "beat-important"
                  : "",
  ].join(" ");
  return (
    <div className={`log-card ${cls}`}>
      {e.extraClass === "title-win" && <p className="title-kicker">{t("finalChampion", lang)}</p>}
      {e.title && <h3 className="text-xl mb-1">{e.title}</h3>}
      {e.body && <p className="text-[13.5px] text-muted mb-2">{e.body}</p>}
      {e.chosen && <p className="text-[13px] text-chalk">{tf("choiceMade", { x: e.chosen }, lang)}</p>}
      {chips && chips.length > 0 && (
        <p className="delta-row" aria-live="polite">
          {chips.map((chip) => (
            <span key={chip} className="delta-chip">{chip}</span>
          ))}
        </p>
      )}
      {e.series && <SeriesStrip series={e.series} />}
      {e.result && (
        <p className={e.extraClass === "title-win" ? "focus-line mt-2" : "text-[13.5px] text-wood italic mt-2"}>
          {e.result}
        </p>
      )}
    </div>
  );
});

function SeriesStrip({ series }: { series: SeriesResult }) {
  const lang = useLang();
  const singleGame = series.games.length === 1;
  const game = series.games[0];
  return (
    <div className="series-strip">
      <div className="series-score">
        {singleGame && game ? `${game.us}-${game.them}` : `${series.wins}-${series.losses}`} · {t(singleGame ? (series.won ? "gameWon" : "gameLost") : (series.won ? "seriesWon" : "seriesLost"), lang)} vs {series.opponent.abbr}
      </div>
      <div className="series-games">
        {series.games.map((g) => (
          <span key={g.n} className={g.win ? "gw" : "gl"}>
            G{g.n} {g.us}-{g.them}
          </span>
        ))}
      </div>
    </div>
  );
}

function PendingBlock(props: {
  player: PlayerState;
  pending: Pending;
  onPath: (p: "NCAA" | "Europa" | "G-League") => void;
  onCall: () => void;
  onStory: (o: Opt) => void;
  onRecap: (q: boolean) => void;
  onPlayoff: (i: number) => void;
  onOffer: (o: MarketOffer) => void;
  onTrade: (go: boolean) => void;
  onForcedTradeAck: () => void;
  onRetire: (extra: boolean) => void;
}) {
  const { pending, player } = props;
  const lang = useLang();
  if (pending.kind === "path") {
    return (
      <Decision
        title={t("pathTitle", lang)}
        sub={t("pathSub", lang)}
        options={[
          { label: t("pathNcaa", lang), detail: t("pathNcaaDetail", lang), run: () => props.onPath("NCAA") },
          { label: t("pathEuro", lang), detail: t("pathEuroDetail", lang), run: () => props.onPath("Europa") },
          { label: t("pathGl", lang), detail: t("pathGlDetail", lang), run: () => props.onPath("G-League") },
        ]}
      />
    );
  }
  if (pending.kind === "call") {
    return (
      <div className="log-card beat-important" data-pending>
        <p className="text-[13px] text-wood mb-1">{t("theCall", lang)}</p>
        <h3 className="text-xl mb-2">{tf("pickN", { n: pending.pick }, lang)}</h3>
        <div className="flex items-center gap-3 mb-3">
          <TeamMark team={player.team} size={56} number={player.number} />
          <div>
            <p className="font-display text-[18px]">{player.team.name}</p>
            <p className="text-[13px] text-muted">{tf("overallN", { n: displayOverall(player.overall) }, lang)}</p>
          </div>
        </div>
        <p className="feel-line">{pending.flavor}</p>
        <button className="primary-btn mt-4" onClick={props.onCall}>
          {t("enterGym", lang)}
        </button>
      </div>
    );
  }
  if (pending.kind === "story") {
    return (
      <Decision
        cls={isHighStakesPresentation({ title: pending.title }) ? "vignette beat-important stake-gold" : undefined}
        title={pending.title}
        sub={pending.subtitle}
        options={pending.options.map((o) => ({
          label: o.label,
          detail: o.detail,
          run: () => props.onStory(o),
        }))}
      />
    );
  }
  if (pending.kind === "recap") {
    return (
      <RecapCard
        row={pending.row}
        qualified={pending.qualified}
        awardNote={pending.awardNote}
        door={pending.door}
        onGo={() => props.onRecap(pending.qualified)}
      />
    );
  }
  if (pending.kind === "playoff") {
    const label = playoffRounds(player)[pending.round] || "Playoff";
    const choices = playoffChoicesFor(player, pending.round);
    const snap = player.currentLeague;
    const oppRow: StandingRow | undefined = snap
      ? [...snap.east, ...snap.west, ...snap.euro].find((r) => r.abbr === pending.opponent.abbr)
      : undefined;
    const seed = player.playoff?.seed;
    const oppSeed = oppRow?.seed;
    const genuineFinals = isGenuineFinalsRound(label);
    return (
      <div className={`log-card playoff ${genuineFinals ? "finals beat-wow stake-gold" : "beat-major"}`} data-pending>
        {label === NBA_FINALS_LABEL && <p className="eyebrow">{t("bestOfSeven", lang)}</p>}
        <h3 className="text-xl mb-2">{roundLabel(label, lang)}</h3>
        {oppRow ? (
          <TeamDossier row={oppRow} />
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <TeamMark team={pending.opponent} size={56} />
            <div>
              <p className="text-[13px] text-muted">
                {seed ? `${seed}°` : "Playoff"} vs {oppSeed ? `${oppSeed}°` : ""} {pending.opponent.name}
              </p>
            </div>
          </div>
        )}
        <p className="feel-line">
          {pending.nerves}
        </p>
        <div className="flex flex-col gap-2">
          {choices.map((c, i) => (
            <button key={c.label} className="choice-btn" onClick={() => props.onPlayoff(i)}>
              <span className="font-display font-semibold text-base text-chalk">{c.label}</span>
              <span className="text-[12.5px] text-muted">{c.detail}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (pending.kind === "fa") {
    return (
      <div className="log-card market beat-major">
        <h3 className="text-[20px] mb-1">{t("summerMarket", lang)}</h3>
        <p className="text-[13.5px] text-muted mb-3">
          {pending.desk}
        </p>
        <div className="flex flex-col gap-2">
          {pending.offers.map((o) => (
            <button
              key={o.id}
              className={`choice-btn offer-btn ${o.kind === "extension" ? "ext" : ""}`}
              style={{ ["--club" as string]: o.team.color }}
              onClick={() => props.onOffer(o)}
            >
              <span className="flex items-center gap-2.5">
                <TeamMark team={o.team} size={40} />
                <span>
                  <span className="font-display font-semibold text-[16px] block">
                    {o.kind === "extension" ? t("offerExtension", lang) : o.kind === "ring" ? t("offerRing", lang) : o.kind === "max" ? t("offerMax", lang) : ""}
                    {o.team.name}
                  </span>
                  <span className="text-[12.5px] text-wood">
                    ${o.annualM}M × {o.years === 1 ? t("contractYear", lang) : tf("contractYears", { n: o.years }, lang)} · {o.team.city}
                  </span>
                </span>
              </span>
              <span className="text-[12.5px] text-muted">{o.pitch}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (pending.kind === "trade") {
    const from = player.team;
    const to = pending.team;
    return (
      <div className="log-card market beat-major" data-pending>
        <p className="title-kicker">{t("market", lang)}</p>
        <h3 className="text-[20px] mb-2">{t("tradeRumors", lang)}</h3>
        <div className="transfer-strip" aria-hidden>
          <TeamMark team={from} size={52} number={player.number} />
          <span className="transfer-arrow">→</span>
          <TeamMark team={to} size={52} number={player.number} />
        </div>
        <p className="feel-line">{pending.pitch}</p>
        <div className="flex flex-col gap-2">
          <button className="choice-btn offer-btn" style={{ ["--club" as string]: to.color }} onClick={() => props.onTrade(true)}>
            <span className="font-display font-semibold text-[16px] text-chalk">{tf("tradeAccept", { team: to.name }, lang)}</span>
            <span className="text-[12.5px] text-muted">{tf("tradeAcceptDetail", { city: to.city }, lang)}</span>
          </button>
          <button className="choice-btn" onClick={() => props.onTrade(false)}>
            <span className="font-display font-semibold text-[16px] text-chalk">{tf("tradeRefuse", { team: from.name }, lang)}</span>
            <span className="text-[12.5px] text-muted">{t("tradeRefuseDetail", lang)}</span>
          </button>
        </div>
      </div>
    );
  }
  if (pending.kind === "trade-notice") {
    const from = clubByName(pending.from);
    return (
      <div className="log-card market market-move beat-major" data-pending>
        <p className="title-kicker">{t("market", lang)}</p>
        <h3 className="text-xl mb-2">{t("tradeDone", lang)}</h3>
        <div className="transfer-strip">
          {from ? <TeamMark team={from} size={52} /> : <span className="text-[13px] text-muted">{pending.from}</span>}
          <span className="transfer-arrow">→</span>
          <TeamMark team={pending.team} size={56} number={player.number} />
        </div>
        <p className="feel-line">{t("tradeForced", lang)} {pending.pitch}</p>
        <button className="primary-btn mt-4" onClick={props.onForcedTradeAck}>
          {t("tradeEnterLocker", lang)}
        </button>
      </div>
    );
  }
  if (pending.kind === "retire") {
    return (
      <Decision
        cls="beat-wow finale"
        title={t("retireTitle", lang)}
        sub={t("retireSub", lang)}
        options={[
          { label: t("retirePlay", lang), detail: t("retirePlayDetail", lang), run: () => props.onRetire(true) },
          { label: t("retireNow", lang), detail: t("retireNowDetail", lang), run: () => props.onRetire(false) },
        ]}
      />
    );
  }
  return (
    <div className="log-card pending-beat">
      <h3 className="text-xl mb-1">{t("moveOn", lang)}</h3>
      <p className="text-[13.5px] text-muted mb-2">{t("moveOnSub", lang)}</p>
      <button className="primary-btn mt-2" onClick={props.onCall}>
        {t("continue", lang)}
      </button>
    </div>
  );
}

function Decision({
  title,
  sub,
  options,
  cls,
}: {
  title: string;
  sub: string;
  cls?: string;
  options: { label: string; detail: string; run: () => void }[];
}) {
  return (
    <div className={`log-card ${cls || "vignette beat-important"}`}>
      <h3 className="text-[20px] mb-1">{title}</h3>
      <p className="feel-line">{sub}</p>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <button key={o.label} className="choice-btn" onClick={o.run}>
            <span className="font-display font-semibold text-[16px] text-chalk">{o.label}</span>
            <span className="text-[12.5px] text-muted">{o.detail}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RecapCard({
  row,
  qualified,
  awardNote,
  door,
  onGo,
}: {
  row: SeasonRow;
  qualified: boolean;
  awardNote: string;
  door: string;
  onGo: () => void;
}) {
  const lang = useLang();
  const rec = teamRecord(row);
  const mvpCard = isHighStakesPresentation({ awards: row.awards });
  return (
    <div className={`log-card recap ${qualified ? "in" : "out"}${mvpCard ? " stake-gold" : ""}`}>
      <h3 className="text-xl mb-0.5">
        {tf("seasonN", { n: row.season }, lang)} · {getSeasonDisplayLabel(row.season)}
      </h3>
      <p className="text-[12px] text-muted mb-2">
        <TeamCrest team={{ abbr: row.teamAbbr, color: row.teamColor, secondary: row.teamSecondary || row.teamColor }} size={16} />
        {" "}
        <span>
          {tf("ageYears", { n: row.age }, lang)} · {row.team} · {rec.w}-{rec.l}
          {rec.seed ? ` · ${rec.seed}° ${confLabel(rec.conf, lang)}` : ""} · OVR {displayOverall(row.overall)}
        </span>
      </p>
      <div className="totals-strip mb-3">
        {[
          [row.ppg.toFixed(1), "PPG"],
          [row.rpg.toFixed(1), "RPG"],
          [row.apg.toFixed(1), "APG"],
        ].map(([v, l]) => (
          <div key={l} className="totals-cell">
            <div className="tv">{v}</div>
            <div className="tl">{l}</div>
          </div>
        ))}
      </div>
      <div className="font-display text-[13px] mb-2 tabular text-muted">
        {row.gp} GP · {row.min.toFixed(1)} MIN
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] text-muted mb-2">
        <StatMini l="STL" v={row.spg.toFixed(1)} />
        <StatMini l="BLK" v={row.bpg.toFixed(1)} />
        <StatMini l="TOV" v={row.tov.toFixed(1)} />
        <StatMini l="FG%" v={(row.fg * 100).toFixed(1)} />
        <StatMini l="3P%" v={(row.tp * 100).toFixed(1)} />
        <StatMini l="FT%" v={(row.ft * 100).toFixed(1)} />
        <StatMini l="TS%" v={(row.ts * 100).toFixed(1)} />
        <StatMini l="PER" v={row.per.toFixed(1)} />
        <StatMini l="+/-" v={`${row.plusMinus > 0 ? "+" : ""}${row.plusMinus.toFixed(1)}`} />
      </div>
      {(() => {
        const adv = advancedOf(row);
        return (
          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] text-muted mb-2">
            <StatMini l="USG%" v={adv.usg.toFixed(1)} />
            <StatMini l="AST%" v={adv.astPct.toFixed(1)} />
            <StatMini l="eFG%" v={(adv.efg * 100).toFixed(1)} />
            <StatMini l="TOV%" v={adv.tovPct.toFixed(1)} />
            <StatMini l="BPM" v={`${adv.bpm > 0 ? "+" : ""}${adv.bpm.toFixed(1)}`} />
            <StatMini l="VORP" v={`${adv.vorp > 0 ? "+" : ""}${adv.vorp.toFixed(1)}`} />
          </div>
        );
      })()}
      {row.awards.length ? (
        <div className="league-awards-mini">
          {row.awards.map((a) => (
            <span key={a} className="yours">{awardLabel(a, lang)}</span>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted mb-3 italic">{awardNote}</p>
      )}
      {row.league && row.league.awards.length > 0 && (
        <div className="league-awards-mini">
          {row.league.awards.map((a) => (
            <span key={a.title} className={a.isPlayer ? "yours" : ""}>
              {awardLabel(a.title, lang)} · {a.name}
            </span>
          ))}
        </div>
      )}
      {row.season === 1 && row.league?.royRace?.length ? <RoyBoard race={row.league.royRace} /> : null}
      {row.mood && (
        <p className="feel-line">{row.mood}</p>
      )}
      <p className="feel-line door">{door}</p>
      <button className="ghost-btn" onClick={onGo}>
        {t(qualified ? "enterPlayoffs" : "nextSeason", lang)}
      </button>
    </div>
  );
}

function RecapSummary({ row, result }: { row: SeasonRow; result?: string }) {
  const lang = useLang();
  return (
    <div className="log-card recap">
      <h3 className="text-xl mb-0.5">
        {tf("seasonN", { n: row.season }, lang)} · {getSeasonDisplayLabel(row.season)}
      </h3>
      <p className="text-[12px] text-muted mb-2">
        <TeamCrest team={{ abbr: row.teamAbbr, color: row.teamColor, secondary: row.teamSecondary || row.teamColor }} size={16} />
        {" "}
        <span>
          {tf("ageYears", { n: row.age }, lang)} · {row.team} · {teamRecord(row).w}-{teamRecord(row).l}
          {teamRecord(row).seed ? ` · ${teamRecord(row).seed}° ${confLabel(teamRecord(row).conf, lang)}` : ""} · OVR {displayOverall(row.overall)}
        </span>
      </p>
      <div className="font-display text-[17px] mb-1 tabular">
        {row.ppg.toFixed(1)} / {row.rpg.toFixed(1)} / {row.apg.toFixed(1)}
        <span className="text-muted text-[13px] font-sans"> · {row.gp} GP · PER {row.per.toFixed(1)}</span>
      </div>
      {row.awards.length > 0 && (
        <p className="text-[13px] text-wood mb-1">{row.awards.map((a) => awardLabel(a, lang)).join(" · ")}</p>
      )}
      {row.mood && <p className="feel-line">{row.mood}</p>}
      {result && <p className="text-[13px] text-muted italic">{result}</p>}
    </div>
  );
}

function StatMini({ l, v }: { l: string; v: string }) {
  return (
    <div className="bg-panel-2 rounded py-1.5">
      <div className="font-display text-[15px] text-chalk">{v}</div>
      <div>{l}</div>
    </div>
  );
}

function SeasonSheet({ player }: { player: PlayerState }) {
  const history = player.seasonHistory;
  const lang = useLang();
  const [idx, setIdx] = useState(Math.max(0, history.length - 1));
  const row = history[Math.min(idx, history.length - 1)];
  if (!row) {
    return <p className="empty-hint pt-3">{t("seasonEmpty", lang)}</p>;
  }
  const rec = teamRecord(row);
  const snap = row.league;
  return (
    <div className="pt-3 fade-in">
      {history.length > 1 && (
        <div className="year-chips">
          {history.map((h, i) => (
            <button
              key={h.season}
              className={`year-chip ${i === idx ? "on" : ""}`}
              onClick={() => setIdx(i)}
            >
              {getSeasonDisplayLabel(h.season)}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <TeamMark
          team={{ abbr: row.teamAbbr, color: row.teamColor, secondary: row.teamSecondary || row.teamColor }}
          size={56}
          number={player.number}
        />
        <div>
          <h3 className="font-display text-[22px]">{getSeasonDisplayLabel(row.season)}</h3>
          <p className="text-[13px] text-muted">
            {row.team} · {rec.w}-{rec.l}
            {rec.seed ? ` · ${rec.seed}° ${confLabel(rec.conf, lang)}` : ` · ${t("outOfPlayoffs", lang)}`} · OVR {displayOverall(row.overall)}
          </p>
        </div>
      </div>
      <div className="totals-strip mb-3">
        {[
          [row.ppg.toFixed(1), "PPG"],
          [row.rpg.toFixed(1), "RPG"],
          [row.apg.toFixed(1), "APG"],
        ].map(([v, l]) => (
          <div key={l} className="totals-cell">
            <div className="tv">{v}</div>
            <div className="tl">{l}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] text-muted mb-3">
        <StatMini l="GP" v={String(row.gp)} />
        <StatMini l="MIN" v={row.min.toFixed(1)} />
        <StatMini l="PER" v={row.per.toFixed(1)} />
        <StatMini l="TS%" v={(row.ts * 100).toFixed(1)} />
        <StatMini l="STL" v={row.spg.toFixed(1)} />
        <StatMini l="BLK" v={row.bpg.toFixed(1)} />
        <StatMini l="FG%" v={(row.fg * 100).toFixed(1)} />
        <StatMini l="3P%" v={(row.tp * 100).toFixed(1)} />
        <StatMini l="+/-" v={`${row.plusMinus > 0 ? "+" : ""}${row.plusMinus.toFixed(1)}`} />
      </div>
      <p className="stat-legend">{t("statLegend", lang)}</p>
      <details className="adv-stats">
        <summary>{t("advStats", lang)}</summary>
      {(() => {
        const adv = advancedOf(row);
        const def = defensiveMarks(row);
        return (
          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] text-muted mb-3">
            <StatMini l="USG%" v={adv.usg.toFixed(1)} />
            <StatMini l="AST%" v={adv.astPct.toFixed(1)} />
            <StatMini l="REB%" v={adv.rebPct.toFixed(1)} />
            <StatMini l="eFG%" v={(adv.efg * 100).toFixed(1)} />
            <StatMini l="TOV%" v={adv.tovPct.toFixed(1)} />
            <StatMini l="STL%" v={def.stlPct.toFixed(1)} />
            <StatMini l="BLK%" v={def.blkPct.toFixed(1)} />
            <StatMini l="DWS" v={def.dws.toFixed(1)} />
            <StatMini l="DBPM" v={`${def.dbpm > 0 ? "+" : ""}${def.dbpm.toFixed(1)}`} />
            <StatMini l="BPM" v={`${adv.bpm > 0 ? "+" : ""}${adv.bpm.toFixed(1)}`} />
            <StatMini l="WS" v={adv.ws.toFixed(1)} />
            <StatMini l="VORP" v={`${adv.vorp > 0 ? "+" : ""}${adv.vorp.toFixed(1)}`} />
          </div>
        );
      })()}
      </details>
      {row.awards.length > 0 && <PersonalAwards title={t("yearAwards", lang)} rows={[row]} />}
      {row.season === 1 && <RoyBoard player={player} race={row.league?.royRace} />}
      {row.seriesLog && row.seriesLog.length > 0 && (
        <>
          <h4 className="stats-heading">{t("playoffPath", lang)}</h4>
          {row.seriesLog.map((s) => {
            const oppSnap = snap ? [...snap.east, ...snap.west, ...snap.euro].find((x) => x.abbr === s.opponent.abbr) : undefined;
            return (
              <div key={s.round} className="log-card playoff">
                {oppSnap ? <TeamDossier row={oppSnap} compact /> : (
                  <div className="flex items-center gap-2 mb-1">
                    <TeamMark team={s.opponent} size={36} />
                    <div>
                      <b className="font-display">{roundLabel(s.label, lang)}</b>
                      <p className="text-[12px] text-muted">
                        vs {s.opponentSeed}° {s.opponent.name}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-[12px] text-muted mt-2">{roundLabel(s.label, lang)}</p>
                <SeriesStrip series={s} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

const StatsTab = memo(function StatsTab({
  player,
  chartData,
}: {
  player: PlayerState;
  chartData: { age: number; overall?: number; curva: number }[];
}) {
  const lang = useLang();
  return (
    <div className="pt-3 fade-in">
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          [formatCareerTotal(player.careerPoints, lang), t("statPoints", lang)],
          [formatCareerTotal(player.careerRebounds, lang), t("statRebounds", lang)],
          [formatCareerTotal(player.careerAssists, lang), t("statAssists", lang)],
        ].map(([v, l]) => (
          <div key={String(l)} className="bg-panel border border-line rounded p-3 text-center">
            <div className="font-display text-[24px] text-wood">{v}</div>
            <div className="text-[9.5px] text-muted tracking-wide">{l}</div>
          </div>
        ))}
      </div>
      <h4 className="font-display text-[19px] mb-2">{t("ovrCurve", lang)}</h4>
      <p className="text-[12px] text-muted mb-2">{t("ovrCurveCap", lang)}</p>
      <div className="h-44 bg-panel border border-line rounded p-2 mb-4">
        <LazyChunk
          load={loadCareerChart}
          pick={pickCareerChart}
          props={{ data: chartData }}
          label={t("chartName", lang)}
          fallback={<div className="grid h-full place-items-center text-xs text-muted" role="status">{t("chartLoading", lang)}</div>}
        />
      </div>
      <PersonalAwards title={t("lifeAwards", lang)} rows={player.seasonHistory} />
      <h4 className="font-display text-[19px] mb-2">{t("bySeason", lang)}</h4>
      {player.seasonHistory.length === 0 && <p className="text-muted text-[12.5px] italic">{t("noRows", lang)}</p>}
      {player.seasonHistory.map((r) => (
        <div key={r.season} className="flex justify-between gap-2 py-2 border-b border-line text-[13px]">
          <div>
            <div className="font-display text-[15px] text-chalk">
              {getSeasonDisplayLabel(r.season)} · OVR {displayOverall(r.overall)}
            </div>
            <div className="text-[11.5px] text-muted">
              {r.teamAbbr} · {tf("ageShort", { n: r.age }, lang)} · {teamRecord(r).w}-{teamRecord(r).l}
              {teamRecord(r).seed ? ` · ${teamRecord(r).seed}°` : ""} · {r.gp} GP
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-wood text-[15px]">
              {r.ppg.toFixed(1)}/{r.rpg.toFixed(1)}/{r.apg.toFixed(1)}
            </div>
            <span className="text-[10.5px] text-muted">
              {playoffResultLabel(r.playoff, lang) || "—"}
              {r.awards.length ? ` · ${r.awards.map((a) => awardLabel(a, lang)).join(" · ")}` : ""}
            </span>
          </div>
        </div>
      ))}
      <h4 className="font-display text-[19px] mt-4 mb-2">{t("summerDev", lang)}</h4>
      {player.devLog.length === 0 && <p className="text-muted text-[12.5px] italic">{t("summerDevEmpty", lang)}</p>}
      {player.devLog.map((d) => (
        <div key={d.season + d.label} className="flex gap-2.5 py-1.5 text-[13px] border-b border-line">
          <span className="text-wood font-display min-w-[36px]">{tf("seasonShort", { n: d.season }, lang)}</span>
          <span>
            {d.label} — {d.line} · {d.before.toFixed(1)}→{d.after.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
});

const ReviewTab = memo(function ReviewTab({ player }: { player: PlayerState }) {
  const hints = hiddenHints(player);
  const lang = useLang();
  return (
    <div className="pt-3 fade-in review-pane">
      <p className="text-[13px] text-muted mb-3">{t("reviewLede", lang)}</p>
      {hints.length > 0 && (
        <div className="log-card mb-4">
          <h4 className="font-display text-[18px] mb-2">{t("feelings", lang)}</h4>
          {hints.map((h, i) => (
            <p
              key={`${i}-${h.slice(0, 24)}`}
              className="review-hint text-[13.5px] text-muted italic mb-2 leading-relaxed"
              style={{ animationDelay: `${80 + i * 90}ms` }}
            >
              {h}
            </p>
          ))}
        </div>
      )}
      <h4 className="font-display text-[19px] mb-2">{t("choices", lang)}</h4>
      {player.choiceLog.length === 0 && <p className="text-muted italic text-[13px]">{t("noChoices", lang)}</p>}
      {player.choiceLog.map((c, i) => (
        <div key={i} className="flex gap-2 py-1.5 text-[13px] border-b border-line">
          <span className="text-wood font-display min-w-[36px]">{tf("seasonShort", { n: c.season }, lang)}</span>
          <span>
            <span className="text-muted">{c.title}: </span>
            {c.pick}
          </span>
        </div>
      ))}
      <h4 className="font-display text-[19px] mt-4 mb-2">{t("milestonesH", lang)}</h4>
      {player.milestones.length === 0 && <p className="text-muted italic text-[13px]">{t("noMilestones", lang)}</p>}
      {player.milestones.length > 0 && (
        <div className="life-timeline">
          {player.milestones.map((m, i) => (
            <div key={`${m.season}-${m.label}-${i}`} className="life-node">
              <i aria-hidden="true" />
              <div>
                <b>{getSeasonDisplayLabel(m.season)}</b>
                <span>{m.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <h4 className="font-display text-[19px] mt-4 mb-2">{t("visibleAttrs", lang)}</h4>
      <AttrBars attrs={player.attrs} />
    </div>
  );
});

function AttrBars({ attrs }: { attrs: Record<AttrKey, number> }) {
  const lang = useLang();
  return (
    <div>
      {(Object.keys(ATTR_LABELS) as AttrKey[]).map((k) => (
        <div key={k} className="mb-2.5">
          <div className="flex justify-between text-[12.5px] text-muted mb-0.5">
            <span>{attrLabel(k, lang)}</span>
            <b className="text-chalk">{attrs[k].toFixed(1)}</b>
          </div>
          <div className="attr-bar-track">
            <div className="attr-bar-fill" style={{ width: `${attrs[k]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultView({
  player,
  onReplay,
  onArchive,
}: {
  player: PlayerState;
  onReplay: () => void;
  onArchive: () => void;
}) {
  const v = verdictOf(player);
  const p = palmares(player);
  const comment = careerCommentary(player);
  const hof = hofTier(player);
  const lang = useLang();
  const [fullYears, setFullYears] = useState(false);
  const jerseys = useMemo(() => {
    const seen: { abbr: string; color: string; secondary: string; name: string }[] = [];
    for (const r of player.seasonHistory) {
      if (seen.some((t) => t.abbr === r.teamAbbr)) continue;
      seen.push({
        abbr: r.teamAbbr,
        color: r.teamColor,
        secondary: r.teamSecondary || r.teamColor,
        name: r.team,
      });
    }
    return seen;
  }, [player.seasonHistory]);
  const years = fullYears ? player.seasonHistory : player.seasonHistory.slice(-8);
  return (
    <section className="result-view finale-sheet">
      <div className={`result-card ${v.card}`}>
        <CourtMark number={23} size={72} brand />
        {jerseys.length > 0 ? (
          <div className="result-mark">
            <TeamMark team={jerseys[jerseys.length - 1]!} size={72} number={player.number} />
          </div>
        ) : null}
        <div className="eyebrow">
          {t("end", lang)}
          {player.simulated ? ` · ${t("simulated", lang)}` : ""} · {difficultyFace(diffOf(player).id, lang).label}
        </div>
        <h2 className="page-title text-chalk">{v.verdict}</h2>
        <div className="result-name">
          {player.name} · N.{player.number}
        </div>
        <div className="result-span">
          {roleLabel(player.role, lang)} · {p.startAge}–{p.endAge} {t("years", lang)} · {seasonCountLabel(p.seasons, lang)} · {t("peak", lang)} {displayOverall(p.peak)}
        </div>
        <div className={`hof-seal ${hof}`}>{t(hof === "hall" ? "hofHall" : hof === "borderline" ? "hofBorder" : "hofOut", lang)}</div>
        <p className="result-close">{v.closing}</p>
        {jerseys.length > 0 && (
          <div className="result-jerseys" aria-label={t("jerseysWorn", lang)}>
            {jerseys.map((t) => (
              <span key={t.abbr} title={t.name}>
                <TeamMark team={t} size={36} number={player.number} />
              </span>
            ))}
          </div>
        )}
        <div className="career-complete">
          <h3>{t("careerDone", lang)}</h3>
          {hof === "hall" ? <p>{t("hofIn", lang)}</p> : null}
        </div>
        <div className="result-stats">
          {[
            [p.avgPpg.toFixed(1), "PPG"],
            [p.avgRpg.toFixed(1), "RPG"],
            [p.avgApg.toFixed(1), "APG"],
            [formatCareerTotal(p.points, lang), t("points", lang)],
            [formatCareerTotal(p.titles, lang), t("titles", lang)],
            [formatCareerTotal(p.mvp, lang), t("mvp", lang)],
          ].map(([val, lab]) => (
            <div key={String(lab)} className="result-stat">
              <div className="tv">{val}</div>
              <div className="tl">{lab}</div>
            </div>
          ))}
        </div>
        <div className="result-chips">
          {[
            p.allStar ? `${p.allStar}× ${t("allStar", lang)}` : null,
            p.allNba ? `${p.allNba}× ${t("allNba", lang)}` : null,
            p.fmvp ? `${p.fmvp}× ${t("fmvp", lang)}` : null,
            p.dpoy ? `${p.dpoy}× ${t("dpoy", lang)}` : null,
            p.roy ? t("roy", lang) : null,
            player.medal ? t("medal", lang) : null,
            jerseys.length ? `${jerseys.length} ${t(jerseys.length === 1 ? "jerseyOne" : "jerseyMany", lang)}` : null,
          ]
            .filter(Boolean)
            .map((t) => (
              <span key={String(t)} className="result-chip">
                {t}
              </span>
            ))}
        </div>
        {p.best && (
          <p className="result-best">
            {t("bestYear", lang)}: {getSeasonDisplayLabel(p.best.season)} · {p.best.teamAbbr} · {p.best.ppg.toFixed(1)} PPG · OVR {displayOverall(p.best.overall)}
            {p.best.awards.length ? ` · ${awardLabel(p.best.awards[0]!, lang)}` : ""}
          </p>
        )}
        <p className="feel-line">{comment}</p>
      </div>
      <CareerCardPanel
        card={careerCardOf(player)}
        history={player.seasonHistory}
        choices={player.choiceLog}
        careerId={player.careerId}
      />
      <h4 className="stats-heading">{t("winters", lang)}</h4>
      {years.map((r) => (
        <div
          key={r.season}
          className="year-line"
          style={{ ["--club" as string]: r.teamColor }}
        >
          <TeamMark
            team={{ abbr: r.teamAbbr, color: r.teamColor, secondary: r.teamSecondary || r.teamColor }}
            size={28}
            number={player.number}
          />
          <div>
            <div className="year-line-title">{getSeasonDisplayLabel(r.season)}</div>
            <div className="year-line-sub">
              {r.teamAbbr} · {displayOverall(r.overall)} · {playoffResultLabel(r.playoff, lang) || "—"}
            </div>
          </div>
          <div className="year-line-box">
            {r.ppg.toFixed(1)}/{r.rpg.toFixed(1)}/{r.apg.toFixed(1)}
          </div>
        </div>
      ))}
      {!fullYears && player.seasonHistory.length > 8 && (
        <button type="button" className="ghost-btn mt-2.5" onClick={() => setFullYears(true)}>
          {tf("wholeCareer", { n: player.seasonHistory.length }, lang)}
        </button>
      )}
      <h4 className="stats-heading">{t("traitsRevealed", lang)}</h4>
      {(Object.keys(HIDDEN_LABELS) as HiddenKey[]).map((k) => (
        <div key={k} className="mb-2">
          <div className="flex justify-between text-[12.5px] text-muted">
            <span>{hiddenLabel(k, lang)}</span>
            <b className="text-chalk">{player.hidden[k].toFixed(0)}</b>
          </div>
          <div className="attr-bar-track">
            <div className="attr-bar-fill" style={{ width: `${player.hidden[k]}%` }} />
          </div>
        </div>
      ))}
      <h4 className="stats-heading">{t("finalAttrs", lang)}</h4>
      <AttrBars attrs={player.attrs} />
      <button className="primary-btn mt-6" onClick={onReplay}>
        <RotateCcw className="inline size-4 mr-1" aria-hidden="true" /> {t("anotherLife", lang)}
      </button>
      <button className="ghost-btn mt-2.5" onClick={onArchive}>
        {t("archive", lang)}
      </button>
    </section>
  );
}

function ArchiveView({
  archive,
  viewing,
  setViewing,
  onBack,
}: {
  archive: ArchiveCareer[];
  viewing: ArchiveCareer | null;
  setViewing: (c: ArchiveCareer | null) => void;
  onBack: () => void;
}) {
  const lang = useLang();
  if (viewing) {
    return (
      <section className="fade-in">
        <button className="back-link" onClick={() => setViewing(null)}>
          <ChevronLeft className="size-4" aria-hidden="true" /> {t("archive", lang)}
        </button>
        <h2 className="page-title">{viewing.name}</h2>
        <p className="text-muted text-[13px] mb-4">
          {roleLabel(viewing.role, lang)} · {viewing.verdict} · {t("peak", lang)} {displayOverall(viewing.peak)}
          {viewing.apexAge ? tf("atAge", { n: viewing.apexAge }, lang) : ""} · {viewing.titles} {t(viewing.titles === 1 ? "titleOne" : "titleMany", lang)}
          {viewing.difficulty ? ` · ${difficultyFace(viewing.difficulty, lang).label}` : ""}
        </p>
        <p className="italic text-muted text-[14px] mb-4">{viewing.closing}</p>
        <CareerCardPanel
          card={viewing.card}
          history={viewing.history}
          choices={viewing.choices}
          careerId={viewing.careerId}
        />
        {viewing.history.map((r) => (
          <div key={r.season} className="flex justify-between py-2 border-b border-line text-[13px]">
            <span>
              {getSeasonDisplayLabel(r.season)} · {r.teamAbbr}
            </span>
            <span className="text-wood font-display">
              {r.ppg.toFixed(1)}/{r.rpg.toFixed(1)}/{r.apg.toFixed(1)}
            </span>
          </div>
        ))}
        <h4 className="font-display text-[18px] mt-4 mb-2">{t("choices", lang)}</h4>
        {viewing.choices.map((c, i) => (
          <div key={i} className="text-[13px] py-1 text-muted">
            {tf("seasonShort", { n: c.season }, lang)} {c.title}: <span className="text-chalk">{c.pick}</span>
          </div>
        ))}
      </section>
    );
  }
  return (
    <section className="fade-in">
      <button className="back-link" onClick={onBack}>
        <ChevronLeft className="size-4" aria-hidden="true" /> {t("home", lang)}
      </button>
      <h2 className="page-title">{t("archive", lang)}</h2>
      {archive.length === 0 && <p className="text-muted">{t("archiveEmpty", lang)}</p>}
      {archive.map((c) => (
        <button
          key={c.id}
          className="choice-btn archive-card mb-2"
          data-career-id={c.careerId || undefined}
          onClick={() => setViewing(c)}
        >
          <span className="font-display text-[18px]">{c.name}</span>
          <span className="text-[12.5px] text-muted">
            {c.history[0]?.season && c.history[c.history.length - 1]?.season
              ? `${getSeasonDisplayLabel(c.history[0].season)} → ${getSeasonDisplayLabel(c.history[c.history.length - 1]!.season)}`
              : seasonCountLabel(c.seasons, lang)}
            {" · "}
            {roleLabel(c.role, lang)} · {c.verdict}
            {c.titles ? ` · ${c.titles} ${t(c.titles === 1 ? "titleOne" : "titleMany", lang)}` : ""}
            {c.difficulty ? ` · ${difficultyFace(c.difficulty, lang).label}` : ""}
            {c.simulated ? " · sim" : ""}
          </span>
        </button>
      ))}
    </section>
  );
}

function CareerCardPanel({
  card,
  history,
  choices,
  careerId,
}: {
  card: ReturnType<typeof careerCardOf> | undefined;
  history: ArchiveCareer["history"];
  choices: ArchiveCareer["choices"];
  careerId?: string;
}) {
  const lang = useLang();
  if (!card) return null;
  const draft = choices.find((choice) => choice.title === "Chiamata");
  const teams = [...new Set(history.map((season) => season.team))];
  const awards = new Map<string, number>();
  for (const season of history) {
    for (const award of season.awards || []) awards.set(award, (awards.get(award) ?? 0) + 1);
  }

  return (
    <section
      className={`result-card career-collectible ${card.legacyTier}`}
      data-career-card
      data-career-id={careerId || undefined}
      role="region"
      aria-label="Career Card"
    >
      <div className="eyebrow">Career Card · {card.engineVersion}</div>
      <h3 className="page-title text-chalk">{card.playerName}</h3>
      <p className="result-name">{roleLabel(card.role, lang)} · {card.nationality}</p>
      <p className="result-span">
        {t("age", lang)} {card.ageStart}–{card.ageEnd} · {seasonCountLabel(card.seasons, lang)} · {t("peak", lang)} {displayOverall(card.peakOverall)}
      </p>
      <div className="result-stats">
        {[
          [card.ppg.toFixed(1), "PPG"],
          [card.rpg.toFixed(1), "RPG"],
          [card.apg.toFixed(1), "APG"],
          [formatCareerTotal(card.championships, lang), t("titles", lang)],
          [formatCareerTotal(card.allStars, lang), "All-Star"],
          [formatCareerTotal(card.mvps, lang), "MVP"],
        ].map(([value, label]) => (
          <div key={String(label)} className="result-stat">
            <div className="tv">{value}</div>
            <div className="tl">{label}</div>
          </div>
        ))}
      </div>
      <p className="feel-line">{tf("draftLine", { v: draft?.pick ?? t("noData", lang) }, lang)}</p>
      <p className="feel-line">{tf("teamsLine", { v: teams.length ? teams.join(" → ") : t("noData", lang) }, lang)}</p>
      {awards.size > 0 && (
        <p className="feel-line">
          {tf("seasonAwardsLine", { v: [...awards].map(([name, count]) => `${count}× ${awardLabel(name, lang)}`).join(" · ") }, lang)}
        </p>
      )}
      {card.milestones.length > 0 && (
        <div className="result-chips" aria-label={t("milestonesH", lang)}>
          {card.milestones.map((milestone) => <span key={milestone} className="result-chip">{milestone}</span>)}
        </div>
      )}
      <p className="result-close">{card.verdict} · Legacy {card.legacyTier}</p>
    </section>
  );
}
