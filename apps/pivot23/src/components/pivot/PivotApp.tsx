
import { Component, lazy, memo, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, ChevronLeft, ClipboardList, RotateCcw, Trophy, Table2 } from "lucide-react";
import { LeaguePanel, PersonalAwards, RoyBoard, TeamDossier } from "@/components/pivot/LeaguePanel";
import { CourtMark, FlagMark, TeamCrest, TeamMark } from "@/components/pivot/TeamMark";
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
  confIt,
  natAdj,
  awardIt,
} from "@/lib/pivot/data";
import {
  acceptForcedSummerTrade,
  acceptOffer,
  acceptTrade,
  allDraftRounds,
  applyAutoOffseason,
  applyDraftCard,
  applyFx,
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
  isCareerOver,
  isContractYear,
  shouldOfferExtraYear,
  loadArchive,
  isArchivePersisted,
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
import { initLang, setLang, t, useLang, awardLabel, type Lang } from "@/lib/pivot/i18n";

const CareerChart = lazy(() => import("@/components/pivot/CareerChart").then((m) => ({ default: m.CareerChart })));
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
import { clearLive, loadLive, loadSwipe, logSeqFrom, saveLive, saveSwipe } from "@/lib/pivot/save";
import { CAREER_TABS, SwipeTrack } from "@/components/pivot/SwipePager";
import { careerCommentary, hofLabel, hofTier, palmares } from "@/lib/pivot/legacy";
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

type Opt = { label: string; detail: string; run: (s: PlayerState) => string };

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
        <h1 className="mt-2 text-2xl font-semibold">Si è verificato un problema</h1>
        <p className="mt-2 text-sm text-muted">Ricarica PIVOT 23 per riprovare. La carriera salvata nel browser resta disponibile.</p>
        {import.meta.env.DEV && error && (
          <pre className="mt-4 overflow-auto rounded-lg bg-panel-2 p-3 text-xs text-muted" role="note">
            {error.message}
          </pre>
        )}
        <button
          className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
          onClick={() => window.location.reload()}
        >
          Ricarica PIVOT 23
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
  ev: { id?: string; choices: { label: string; detail: string; fx: (s: PlayerState) => import("@/lib/pivot/types").Fx }[] },
  s: PlayerState,
): Opt[] {
  return ev.choices.map((c) => ({
    label: fillTemplate(c.label, s),
    detail: fillTemplate(c.detail, s),
    run: (p) => {
      const fx = c.fx(p);
      applyFx(p, fx);
      return fillTemplate(fx.flavor, p);
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
          return "La pagina si è persa. Si va avanti.";
        }),
      };
    });
    return { kind: "story", title: raw.title, subtitle: raw.subtitle, script: raw.script, eventId: raw.eventId, options };
  }
  return raw as Pending;
}

export function PivotApp() {
  const bootRef = useRef<ReturnType<typeof loadLive> | undefined>(undefined);
  if (bootRef.current === undefined) {
    let live: ReturnType<typeof loadLive> = null;
    if (typeof window !== "undefined") {
      try {
        live = loadLive();
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
      title: "Si rientra in palestra",
      subtitle: "Il gruppo è già in campo. Manca solo il tuo nome sul referto.",
      options: [
        {
          label: "Entra in campo",
          detail: "La stagione riprende da qui.",
          run: (p) => {
            applyFx(p, { flavor: "Si va avanti." });
            return "Si va avanti.";
          },
        },
      ],
    };
  });
  const [log, setLog] = useState<LogEntry[]>(boot?.log || []);
  const [locked, setLocked] = useState(false);
  const holdTimer = useRef(0);
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
  const simJob = useRef<ReturnType<typeof openCareerSim> | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const saveGen = useRef(0);
  const lang = useLang();

  useLayoutEffect(() => {
    document.documentElement.classList.remove("pivot-live", "pivot-ready");
    initLang();
  }, []);

  useEffect(() => {
    const lean =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (typeof navigator !== "undefined" && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
    document.documentElement.classList.toggle("pivot-lean", lean);
  }, []);

  useEffect(() => {
    const sync = () => document.documentElement.classList.toggle("pivot-asleep", document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (simTimer.current) window.clearTimeout(simTimer.current);
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
      saveLive({
        player,
        pending: pending && pending.kind !== "call" ? (pending as never) : pending,
        log,
        screen,
        tab: tabRef.current,
        logSeq: logSeqFrom(log),
      });
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

  function pushLog(e: Omit<LogEntry, "id">) {
    setLog((prev) => [...prev, { ...e, id: nid() }]);
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
        simJob.current = null;
        setArchive(all);
        setPlayer(job.s);
        setPending(null);
        setLog([]);
        setSimBusy(false);
        setSimShow(false);
        setSimSlow(false);
        if (isArchivePersisted(entry.id)) clearLive();
        setScreen("result");
      } catch {
        cancelSim();
      }
    };
    window.setTimeout(pump, 0);
  }

  function chooseDraft(cardIndex: number) {
    if (!player) return;
    const s = structuredClone(player);
    applyDraftCard(s, s.round, cardIndex);
    if (s.round >= allDraftRounds().length) finishDraft(s);
    setPlayer(s);
  }

  function beginCareer() {
    if (!player) return;
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
    if (!player) return;
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
    if (!player) return;
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
      const script: SavedStoryScript =
        n === 1 ? "rookie" : n === 6 ? "rival" : n === 8 ? "injury" : n === 10 ? "nation" : "pool";
      setPending(pendingFromEvent(scripted, script, s));
      return;
    }
    if (shouldOfferTrade(s, n) && n !== 12) {
      const t = buildTradeOffer(s);
      if (shouldForceTrade(s)) {
        const from = s.team.name;
        acceptTrade(s, t.team);
        setPlayer(s);
        setPending({ kind: "trade-notice", team: t.team, from, pitch: t.pitch });
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
    if (!player) return;
    holdThen(HOLD_RECAP_MS, () => continueAfterRecapInner(qualified));
  }

  function continueAfterRecapInner(qualified: boolean) {
    if (!player) return;
    const s = structuredClone(player);
    const last = s.seasonHistory[s.seasonHistory.length - 1];
    pushLog({
      kind: "recap",
      title: last ? `Stagione ${last.season} · ${last.yearLabel}` : "Stagione",
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
    if (!player || pending?.kind !== "playoff") return;
    const s = structuredClone(player);
    const { round, opponent } = pending;
    const before = s.overall;
    const choice = playoffChoicesFor(s, round)[choiceIndex];
    const res = withPlayer(s, () => resolvePlayoffRound(s, s.season, round, choiceIndex, opponent));
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
    });
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
    if (shouldOfferExtraYear(s)) {
      setPlayer(s);
      setPending({ kind: "retire" });
      return;
    }
    if (isCareerOver(s)) {
      finish(s);
      return;
    }
    continueAfterSummer(s);
  }

  function continueAfterSummer(s: PlayerState) {
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
    if (!player) return;
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
    if (!player || pending?.kind !== "trade") return;
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
    if (!player || pending?.kind !== "trade-notice") return;
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
    if (!player) return;
    const s = structuredClone(player);
    const before = s.overall;
    const flavor = withPlayer(s, () => opt.run(s));
    s.choiceLog.push({ season: s.season, title: pending?.kind === "story" ? pending.title : "Scelta", pick: opt.label });
    setPlayer(s);
    pushLog({
      kind: "decision",
      title: pending && pending.kind === "story" ? pending.title : "Decisione",
      chosen: opt.label,
      result: withOvr(flavor, before, s.overall),
      resolved: true,
      ovrBefore: before,
      ovrAfter: s.overall,
    });
    const snapshot = s;
    holdThen(HOLD_TITLE_MS, () => runSeason(snapshot));
  }

  function onRetire(extra: boolean) {
    if (!player) return;
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
    const entry = toArchive(s);
    const all = saveArchive(entry);
    setArchive(all);
    setPlayer(s);
    setPending(null);
    if (isArchivePersisted(entry.id)) clearLive();
    setScreen("result");
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
    <div className={screen === "career" ? "pivot-app career-mode" : "pivot-app"}>
      {screen === "intro" && (
        <section className="intro-hero home-screen">
          <CourtMark number={23} size={132} brand />
          <span className="eyebrow">{t("eyebrow", lang)}</span>
          <h1 className="display-title">PIVOT</h1>
          <p className="lede">{t("lede", lang)}</p>
          <div className="lang-row" role="group" aria-label={t("lang", lang)}>
            {(["it", "en", "es"] as Lang[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`lang-btn ${lang === id ? "on" : ""}`}
                onClick={() => setLang(id)}
              >
                {id === "it" ? "Italiano" : id === "en" ? "English" : "Español"}
              </button>
            ))}
          </div>
          {player && (player.originPath || player.round > 0) ? (
            <>
              <button
                className="primary-btn"
                onClick={() =>
                  setScreen(!player.originPath && player.round < allDraftRounds().length ? "draft" : "career")
                }
              >
                {t("resume", lang)}
              </button>
              <button
                className="ghost-btn mt-2.5"
                onClick={() => {
                  clearLive();
                  setPlayer(null);
                  setPending(null);
                  setLog([]);
                  setScreen("setup");
                }}
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
        </section>
      )}

      {screen === "setup" && (
        <section className="fade-in">
          <button className="back-link" onClick={() => setScreen("intro")}>
            <ChevronLeft className="size-4" /> Home
          </button>
          <h2 className="page-title">Chi sei sul parquet</h2>
          <p className="lede">Nome, ruolo, maglia. Poi la difficoltà — e il mestiere.</p>
          <span className="group-label">Nome</span>
          <div className="group-card">
            <input className="text-input" maxLength={20} placeholder="Es. Marco Ferrara" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <span className="group-label">Ruolo</span>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(Object.keys(ROLES) as Role[]).map((r) => (
              <button key={r} className={`pill-btn ${role === r ? "selected" : ""}`} onClick={() => setRole(r)}>
                {ROLES[r].label}
              </button>
            ))}
          </div>
          <span className="group-label">Provenienza</span>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {NATIONALITIES.map((n) => (
              <button
                key={n.id}
                className={`pill-btn nat-pill ${nat === n.id ? "selected" : ""}`}
                onClick={() => setNat(n.id)}
              >
                <span aria-hidden="true">
                  <FlagMark nation={n.id} size={16} />
                </span>
                {n.label}
              </button>
            ))}
          </div>
          <span className="group-label">Numero</span>
          <div className="jersey-hero">
            <CourtMark number={Number.isFinite(number) ? number : 23} size={88} brand={number === 23} />
            <div>
              <div className="num tabular">{Number.isFinite(number) ? number : 23}</div>
              <div className="hint">Il numero sulla maglia. Da 0 a 99.</div>
            </div>
          </div>
          <input className="text-input mb-6 w-24 text-center" type="number" min={0} max={99} value={number} onChange={(e) => setNumber(parseInt(e.target.value, 10) || 0)} />
          <span className="group-label">Difficoltà</span>
          <div className="flex flex-col gap-2 mb-6">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className={`diff-card ${difficulty === d.id ? "selected" : ""}`}
                onClick={() => setDifficulty(d.id)}
              >
                <span className="diff-head">
                  <b>{d.label}</b>
                  <em>{d.tag}</em>
                </span>
                <span className="diff-desc">{d.desc}</span>
              </button>
            ))}
          </div>
          <button className="primary-btn" onClick={startDraft} disabled={simBusy || name.trim().length < 1}>
            Gioca il Draft
          </button>
          <button className="ghost-btn mt-2.5" onClick={runOneSim} disabled={simBusy || name.trim().length < 1}>
            {simShow ? <SaveGlyph /> : `Simula la carriera · ${DIFFICULTIES.find((d) => d.id === difficulty)?.label}`}
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
        />
        </CareerGuard>
      )}

      {screen === "result" && player && (
        <ResultView player={player} onReplay={() => { clearLive(); setPlayer(null); setLog([]); setPending(null); setScreen("intro"); }} onArchive={() => { setViewing(null); setScreen("archive"); }} />
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
    </div>
  );
}

function withOvr(text: string, before: number, after: number) {
  const b = Math.round(before);
  const a = Math.round(after);
  const d = a - b;
  if (d === 0) return text;
  const sign = d > 0 ? "+" : "";
  return `${text} Overall ${b} → ${a} (${sign}${d}).`;
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
  if (player.round >= allDraftRounds().length) {
    return (
      <section className="fade-in">
        <div className="text-[13px] text-wood mb-1">Profilo pronto</div>
        <h2 className="page-title">Il tuo giocatore è pronto</h2>
        <p className="text-muted text-[14px] mb-4">
          {player.name} — {ROLES[player.role].label}. I tratti restano. Poi il percorso, poi la maglia.
        </p>
        <AttrBars attrs={player.attrs} />
        <button className="primary-btn mt-6" onClick={onStart}>
          Inizia la carriera
        </button>
      </section>
    );
  }
  const r = allDraftRounds()[player.round]!;
  const hand = player.draftHand.length ? player.draftHand : r.cards.slice(0, 3);
  const total = allDraftRounds().length;
  return (
    <section className="fade-in">
      <div className="text-[13px] text-wood mb-1">Round {player.round + 1} di {total}</div>
      <div className="draft-pips" aria-hidden="true">
        {allDraftRounds().map((_, i) => (
          <span key={i} className={i < player.round ? "done" : i === player.round ? "now" : ""} />
        ))}
      </div>
      <h2 className="page-title">{r.label}</h2>
      <p className="text-muted text-[14px] mb-4">{r.prompt} Tre strade. Una resta fuori.</p>
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
                {shown.primary.delta.toFixed(0)} {ATTR_LABELS[shown.primary.key]}
                {shown.secondary.map((sec) => `, ${sec.delta > 0 ? "+" : ""}${sec.delta.toFixed(0)} ${ATTR_LABELS[sec.key]}`).join("")}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-4 pt-3.5 border-t border-line">
        {(Object.keys(ATTR_LABELS) as AttrKey[]).map((k) => (
          <span key={k} className="text-[11px] text-muted bg-panel border border-line px-2 py-1 rounded-sm">
            {ATTR_LABELS[k]} <b className="text-chalk">{player.attrs[k].toFixed(0)}</b>
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
        <div
          className="flex justify-between items-center gap-2.5 py-2.5 border-b border-line"
          style={{ boxShadow: `inset 0 -2px 0 ${player.team.color}` }}
        >
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <TeamMark team={player.team} size={52} number={player.number} />
            <div className="min-w-0">
              <div className="font-display text-[22px] leading-tight truncate">{player.name}</div>
              <div className="text-[11.5px] text-muted flex items-center gap-1.5">
                <FlagMark nation={player.nationality} size={24} />
                {ROLES[player.role].label} · {player.age} anni
                {player.draftPick ? ` · ${player.draftPick}ª scelta` : ""}
              </div>
              <div className="text-[12px] mt-1 flex items-center">
                <TeamCrest team={player.team} size={16} />
                <span className="ml-1.5">
                  {player.team.name} · {player.league === "EuroLega" ? "Eurolega" : "NBA"}
                </span>
              </div>
              <div className="text-[11px] text-muted mt-0.5">
                {player.contract.yearsRemaining} {player.contract.yearsRemaining === 1 ? "anno" : "anni"} × ${player.contract.annualM}M
                {last ? (() => {
                  const rec = teamRecord(last);
                  return rec.seed ? ` · ${rec.seed}° ${confIt(rec.conf)}` : "";
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
        <div className="seg-track">
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
        {hint && <p className="swipe-hint">Scorri tra Storia, Anno, Lega, Vita</p>}
      </div>

      <SwipeTrack tab={tab} onTab={goTab}>
        {[
          <div key="log" className="pt-3.5">
            {!fullLog && props.log.length > 24 && (
              <button type="button" className="ghost-btn mb-3" onClick={() => setFullLog(true)}>
                Mostra tutta la storia
              </button>
            )}
            {logShown.map((e) => (
              <LogBlock key={e.id} e={e} />
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

const LogBlock = memo(function LogBlock({ e }: { e: LogEntry }) {
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
  const cls =
    e.extraClass === "title-win"
      ? "title-win playoff"
      : e.extraClass === "market-move"
        ? "market market-move"
        : e.extraClass === "playoff"
          ? "playoff"
          : e.extraClass === "offseason"
            ? "offseason"
            : e.extraClass === "market"
              ? "market"
              : e.kind === "recap"
                ? "recap"
                : "";
  return (
    <div className={`log-card ${cls}`}>
      {e.extraClass === "title-win" && <p className="title-kicker">Finale · Campione</p>}
      {e.title && <h3 className="text-xl mb-1">{e.title}</h3>}
      {e.body && <p className="text-[13.5px] text-muted mb-2">{e.body}</p>}
      {e.chosen && <p className="text-[13px] text-chalk">Scelta: {e.chosen}</p>}
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
  const singleGame = series.games.length === 1;
  const game = series.games[0];
  return (
    <div className="series-strip">
      <div className="series-score">
        {singleGame && game ? `${game.us}-${game.them}` : `${series.wins}-${series.losses}`} · {singleGame ? (series.won ? "Partita vinta" : "Partita persa") : (series.won ? "Serie vinta" : "Serie persa")} vs {series.opponent.abbr}
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
  if (pending.kind === "path") {
    return (
      <Decision
        title="Il percorso verso il professionismo"
        sub="Come arrivi al grande salto. Poi arriva la chiamata, e la maglia."
        options={[
          { label: "College NCAA, Stati Uniti", detail: "Fondamentali solidi. Arrivi a 21 anni.", run: () => props.onPath("NCAA") },
          { label: "Accademia europea", detail: "Crescita paziente, più intelligenza cestistica.", run: () => props.onPath("Europa") },
          { label: "Salto in G League", detail: "Talento grezzo, minuti subito.", run: () => props.onPath("G-League") },
        ]}
      />
    );
  }
  if (pending.kind === "call") {
    return (
      <div className="log-card" data-pending>
        <p className="text-[13px] text-wood mb-1">La chiamata</p>
        <h3 className="text-xl mb-2">{pending.pick}ª scelta</h3>
        <div className="flex items-center gap-3 mb-3">
          <TeamMark team={player.team} size={56} number={player.number} />
          <div>
            <p className="font-display text-[18px]">{player.team.name}</p>
            <p className="text-[13px] text-muted">Overall {displayOverall(player.overall)}</p>
          </div>
        </div>
        <p className="feel-line">{pending.flavor}</p>
        <button className="primary-btn mt-4" onClick={props.onCall}>
          Entra in palestra
        </button>
      </div>
    );
  }
  if (pending.kind === "story") {
    return (
      <Decision
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
    return (
      <div className="log-card playoff" data-pending>
        <h3 className="text-xl mb-2">{label}</h3>
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
      <div className="log-card market">
        <h3 className="text-[20px] mb-1">Mercato estivo</h3>
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
                    {o.kind === "extension" ? "Rinnovo · " : o.kind === "ring" ? "Anello · " : o.kind === "max" ? "Massimo · " : ""}
                    {o.team.name}
                  </span>
                  <span className="text-[12.5px] text-wood">
                    ${o.annualM}M × {o.years} {o.years === 1 ? "anno" : "anni"} · {o.team.city}
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
      <div className="log-card market" data-pending>
        <p className="title-kicker">Mercato</p>
        <h3 className="text-[20px] mb-2">Voci di scambio</h3>
        <div className="transfer-strip" aria-hidden>
          <TeamMark team={from} size={52} number={player.number} />
          <span className="transfer-arrow">→</span>
          <TeamMark team={to} size={52} number={player.number} />
        </div>
        <p className="feel-line">{pending.pitch}</p>
        <div className="flex flex-col gap-2">
          <button className="choice-btn offer-btn" style={{ ["--club" as string]: to.color }} onClick={() => props.onTrade(true)}>
            <span className="font-display font-semibold text-[16px] text-chalk">Accetti: {to.name}</span>
            <span className="text-[12.5px] text-muted">{to.city} · il contratto ti segue.</span>
          </button>
          <button className="choice-btn" onClick={() => props.onTrade(false)}>
            <span className="font-display font-semibold text-[16px] text-chalk">Rifiuti, resti a {from.name}</span>
            <span className="text-[12.5px] text-muted">Fedeltà. Lo staff se lo ricorda.</span>
          </button>
        </div>
      </div>
    );
  }
  if (pending.kind === "trade-notice") {
    const from = clubByName(pending.from);
    return (
      <div className="log-card market market-move" data-pending>
        <p className="title-kicker">Mercato</p>
        <h3 className="text-xl mb-2">Scambio chiuso</h3>
        <div className="transfer-strip">
          {from ? <TeamMark team={from} size={52} /> : <span className="text-[13px] text-muted">{pending.from}</span>}
          <span className="transfer-arrow">→</span>
          <TeamMark team={pending.team} size={56} number={player.number} />
        </div>
        <p className="feel-line">La dirigenza ha deciso senza chiederti il permesso. {pending.pitch}</p>
        <button className="primary-btn mt-4" onClick={props.onForcedTradeAck}>
          Entra nello spogliatoio nuovo
        </button>
      </div>
    );
  }
  if (pending.kind === "retire") {
    return (
      <Decision
        title="L'ultimo inverno"
        sub="Hai chiuso i 35. Puoi scendere a 36, o lasciare il parquet qui."
        options={[
          { label: "Gioca a 36 anni", detail: "Un'ultima stagione. Poi, basta.", run: () => props.onRetire(true) },
          { label: "Chiudi ora", detail: "A testa alta, senza l'anno di troppo.", run: () => props.onRetire(false) },
        ]}
      />
    );
  }
  return (
    <div className="log-card pending-beat">
      <h3 className="text-xl mb-1">Si va avanti</h3>
      <p className="text-[13.5px] text-muted mb-2">La carta non ha un bivio. Il calendario, sì.</p>
      <button className="primary-btn mt-2" onClick={props.onCall}>
        Continua
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
    <div className={`log-card ${cls || "vignette"}`}>
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
  const rec = teamRecord(row);
  return (
    <div className={`log-card recap ${qualified ? "in" : "out"}`}>
      <h3 className="text-xl mb-0.5">
        Stagione {row.season} · {row.yearLabel}
      </h3>
      <p className="text-[12px] text-muted mb-2">
        <TeamCrest team={{ abbr: row.teamAbbr, color: row.teamColor, secondary: row.teamSecondary || row.teamColor }} size={16} />
        {" "}
        <span>
          {row.age} anni · {row.team} · {rec.w}-{rec.l}
          {rec.seed ? ` · ${rec.seed}° ${confIt(rec.conf)}` : ""} · OVR {displayOverall(row.overall)}
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
            <span key={a} className="yours">{awardIt(a)}</span>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted mb-3 italic">{awardNote}</p>
      )}
      {row.league && row.league.awards.length > 0 && (
        <div className="league-awards-mini">
          {row.league.awards.map((a) => (
            <span key={a.title} className={a.isPlayer ? "yours" : ""}>
              {awardIt(a.title)} · {a.name}
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
        {qualified ? "Entra nei playoff" : "Prossima stagione"}
      </button>
    </div>
  );
}

function RecapSummary({ row, result }: { row: SeasonRow; result?: string }) {
  return (
    <div className="log-card recap">
      <h3 className="text-xl mb-0.5">
        Stagione {row.season} · {row.yearLabel}
      </h3>
      <p className="text-[12px] text-muted mb-2">
        <TeamCrest team={{ abbr: row.teamAbbr, color: row.teamColor, secondary: row.teamSecondary || row.teamColor }} size={16} />
        {" "}
        <span>
          {row.age} anni · {row.team} · {teamRecord(row).w}-{teamRecord(row).l}
          {teamRecord(row).seed ? ` · ${teamRecord(row).seed}° ${confIt(teamRecord(row).conf)}` : ""} · OVR {displayOverall(row.overall)}
        </span>
      </p>
      <div className="font-display text-[17px] mb-1 tabular">
        {row.ppg.toFixed(1)} / {row.rpg.toFixed(1)} / {row.apg.toFixed(1)}
        <span className="text-muted text-[13px] font-sans"> · {row.gp} GP · PER {row.per.toFixed(1)}</span>
      </div>
      {row.awards.length > 0 && (
        <p className="text-[13px] text-wood mb-1">{row.awards.map(awardIt).join(" · ")}</p>
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

const SeasonSheet = memo(function SeasonSheet({ player }: { player: PlayerState }) {
  const history = player.seasonHistory;
  const lang = useLang();
  const [idx, setIdx] = useState(Math.max(0, history.length - 1));
  const row = history[Math.min(idx, history.length - 1)];
  if (!row) {
    return <p className="empty-hint pt-3">Dopo la prima stagione qui trovi la scheda completa dell'anno.</p>;
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
              {h.yearLabel}
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
          <h3 className="font-display text-[22px]">{row.yearLabel}</h3>
          <p className="text-[13px] text-muted">
            {row.team} · {rec.w}-{rec.l}
            {rec.seed ? ` · ${rec.seed}° ${confIt(rec.conf)}` : " · fuori"} · OVR {displayOverall(row.overall)}
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
      {row.awards.length > 0 && <PersonalAwards title={t("yearAwards", lang)} rows={[row]} />}
      {row.season === 1 && <RoyBoard player={player} race={row.league?.royRace} />}
      {row.seriesLog && row.seriesLog.length > 0 && (
        <>
          <h4 className="stats-heading">Percorso playoff</h4>
          {row.seriesLog.map((s) => {
            const oppSnap = snap ? [...snap.east, ...snap.west, ...snap.euro].find((x) => x.abbr === s.opponent.abbr) : undefined;
            return (
              <div key={s.round} className="log-card playoff">
                {oppSnap ? <TeamDossier row={oppSnap} compact /> : (
                  <div className="flex items-center gap-2 mb-1">
                    <TeamMark team={s.opponent} size={36} />
                    <div>
                      <b className="font-display">{s.label}</b>
                      <p className="text-[12px] text-muted">
                        vs {s.opponentSeed}° {s.opponent.name}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-[12px] text-muted mt-2">{s.label}</p>
                <SeriesStrip series={s} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
});

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
          [player.careerPoints, "PUNTI"],
          [player.careerRebounds, "RIMBALZI"],
          [player.careerAssists, "ASSIST"],
        ].map(([v, l]) => (
          <div key={String(l)} className="bg-panel border border-line rounded p-3 text-center">
            <div className="font-display text-[24px] text-wood">{v}</div>
            <div className="text-[9.5px] text-muted tracking-wide">{l}</div>
          </div>
        ))}
      </div>
      <h4 className="font-display text-[19px] mb-2">Curva overall</h4>
      <p className="text-[12px] text-muted mb-2">
        Picco osservato tra 26 e 28 anni. La linea piena è il tuo overall; quella tratteggiata è la traiettoria.
      </p>
      <div className="h-44 bg-panel border border-line rounded p-2 mb-4">
        <Suspense fallback={<div className="grid h-full place-items-center text-xs text-muted" role="status">Caricamento grafico…</div>}>
          <CareerChart data={chartData} />
        </Suspense>
      </div>
      <PersonalAwards title={t("lifeAwards", lang)} rows={player.seasonHistory} />
      <h4 className="font-display text-[19px] mb-2">Stagione per stagione</h4>
      {player.seasonHistory.length === 0 && <p className="text-muted text-[12.5px] italic">Ancora nessuna riga.</p>}
      {player.seasonHistory.map((r) => (
        <div key={r.season} className="flex justify-between gap-2 py-2 border-b border-line text-[13px]">
          <div>
            <div className="font-display text-[15px] text-chalk">
              {r.yearLabel} · OVR {displayOverall(r.overall)}
            </div>
            <div className="text-[11.5px] text-muted">
              {r.teamAbbr} · {r.age}a · {teamRecord(r).w}-{teamRecord(r).l}
              {teamRecord(r).seed ? ` · ${teamRecord(r).seed}°` : ""} · {r.gp} GP
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-wood text-[15px]">
              {r.ppg.toFixed(1)}/{r.rpg.toFixed(1)}/{r.apg.toFixed(1)}
            </div>
            <span className="text-[10.5px] text-muted">
              {r.playoff || "—"}
              {r.awards.length ? ` · ${r.awards.map((a) => awardLabel(a, lang)).join(" · ")}` : ""}
            </span>
          </div>
        </div>
      ))}
      <h4 className="font-display text-[19px] mt-4 mb-2">Sviluppo estivo</h4>
      {player.devLog.length === 0 && <p className="text-muted text-[12.5px] italic">Dopo la prima stagione vedrai la crescita estiva.</p>}
      {player.devLog.map((d) => (
        <div key={d.season + d.label} className="flex gap-2.5 py-1.5 text-[13px] border-b border-line">
          <span className="text-wood font-display min-w-[36px]">S.{d.season}</span>
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
  return (
    <div className="pt-3 fade-in review-pane">
      <p className="text-[13px] text-muted mb-3">
        Diario della carriera in corso. I tratti nascosti restano coperti fino al verdetto — restano le sensazioni.
      </p>
      {hints.length > 0 && (
        <div className="log-card mb-4">
          <h4 className="font-display text-[18px] mb-2">Sensazioni</h4>
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
      <h4 className="font-display text-[19px] mb-2">Scelte</h4>
      {player.choiceLog.length === 0 && <p className="text-muted italic text-[13px]">Nessuna scelta ancora.</p>}
      {player.choiceLog.map((c, i) => (
        <div key={i} className="flex gap-2 py-1.5 text-[13px] border-b border-line">
          <span className="text-wood font-display min-w-[36px]">S.{c.season}</span>
          <span>
            <span className="text-muted">{c.title}: </span>
            {c.pick}
          </span>
        </div>
      ))}
      <h4 className="font-display text-[19px] mt-4 mb-2">Traguardi</h4>
      {player.milestones.length === 0 && <p className="text-muted italic text-[13px]">Ancora niente da appendere.</p>}
      {player.milestones.map((m, i) => (
        <div key={i} className="flex gap-2 py-1.5 text-[13px] border-b border-line">
          <span className="text-wood font-display min-w-[36px]">S.{m.season}</span>
          <span>{m.label}</span>
        </div>
      ))}
      <h4 className="font-display text-[19px] mt-4 mb-2">Attributi visibili</h4>
      <AttrBars attrs={player.attrs} />
    </div>
  );
});

function AttrBars({ attrs }: { attrs: Record<AttrKey, number> }) {
  return (
    <div>
      {(Object.keys(ATTR_LABELS) as AttrKey[]).map((k) => (
        <div key={k} className="mb-2.5">
          <div className="flex justify-between text-[12.5px] text-muted mb-0.5">
            <span>{ATTR_LABELS[k]}</span>
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
    <section className="result-view">
      <div className={`result-card ${v.card}`}>
        <CourtMark number={23} size={72} brand />
        {jerseys.length > 0 ? (
          <div className="result-mark">
            <TeamMark team={jerseys[jerseys.length - 1]!} size={72} number={player.number} />
          </div>
        ) : null}
        <div className="eyebrow">
          {t("end", lang)}
          {player.simulated ? " · simulata" : ""} · {diffOf(player).label}
        </div>
        <h2 className="page-title text-chalk">{v.verdict}</h2>
        <div className="result-name">
          {player.name} · N.{player.number}
        </div>
        <div className="result-span">
          {ROLES[player.role].label} · {p.startAge}–{p.endAge} anni · {p.seasons} stagioni · picco {displayOverall(p.peak)}
        </div>
        <div className={`hof-seal ${hof}`}>{hofLabel(hof)}</div>
        <p className="result-close">{v.closing}</p>
        {jerseys.length > 0 && (
          <div className="result-jerseys" aria-label="Maglie indossate">
            {jerseys.map((t) => (
              <span key={t.abbr} title={t.name}>
                <TeamMark team={t} size={36} number={player.number} />
              </span>
            ))}
          </div>
        )}
        <div className="result-stats">
          {[
            [p.avgPpg.toFixed(1), "PPG"],
            [p.avgRpg.toFixed(1), "RPG"],
            [p.avgApg.toFixed(1), "APG"],
            [p.points, "Punti"],
            [p.titles, "Titoli"],
            [p.mvp, t("mvp", lang)],
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
            player.medal ? "Medaglia" : null,
            jerseys.length ? `${jerseys.length} ${jerseys.length === 1 ? "maglia" : "maglie"}` : null,
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
            Miglior anno: {p.best.yearLabel} · {p.best.teamAbbr} · {p.best.ppg.toFixed(1)} PPG · OVR {displayOverall(p.best.overall)}
            {p.best.awards.length ? ` · ${p.best.awards[0]}` : ""}
          </p>
        )}
        <p className="feel-line">{comment}</p>
      </div>
      <CareerCardPanel card={careerCardOf(player)} history={player.seasonHistory} choices={player.choiceLog} />
      <h4 className="stats-heading">Gli inverni</h4>
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
            <div className="year-line-title">{r.yearLabel}</div>
            <div className="year-line-sub">
              {r.teamAbbr} · {displayOverall(r.overall)} · {r.playoff || "—"}
            </div>
          </div>
          <div className="year-line-box">
            {r.ppg.toFixed(1)}/{r.rpg.toFixed(1)}/{r.apg.toFixed(1)}
          </div>
        </div>
      ))}
      {!fullYears && player.seasonHistory.length > 8 && (
        <button type="button" className="ghost-btn mt-2.5" onClick={() => setFullYears(true)}>
          Tutta la carriera · {player.seasonHistory.length} anni
        </button>
      )}
      <h4 className="stats-heading">Tratti svelati</h4>
      {(Object.keys(HIDDEN_LABELS) as HiddenKey[]).map((k) => (
        <div key={k} className="mb-2">
          <div className="flex justify-between text-[12.5px] text-muted">
            <span>{HIDDEN_LABELS[k]}</span>
            <b className="text-chalk">{player.hidden[k].toFixed(0)}</b>
          </div>
          <div className="attr-bar-track">
            <div className="attr-bar-fill" style={{ width: `${player.hidden[k]}%` }} />
          </div>
        </div>
      ))}
      <h4 className="stats-heading">Attributi finali</h4>
      <AttrBars attrs={player.attrs} />
      <button className="primary-btn mt-6" onClick={onReplay}>
        <RotateCcw className="inline size-4 mr-1" /> Un'altra vita
      </button>
      <button className="ghost-btn mt-2.5" onClick={onArchive}>
        Archivio
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
  if (viewing) {
    return (
      <section className="fade-in">
        <button className="back-link" onClick={() => setViewing(null)}>
          <ChevronLeft className="size-4" /> Archivio
        </button>
        <h2 className="page-title">{viewing.name}</h2>
        <p className="text-muted text-[13px] mb-4">
          {viewing.role} · {viewing.verdict} · picco {displayOverall(viewing.peak)}
          {viewing.apexAge ? ` a ${viewing.apexAge} anni` : ""} · {viewing.titles} titoli
          {viewing.difficulty ? ` · ${DIFFICULTIES.find((d) => d.id === viewing.difficulty)?.label ?? ""}` : ""}
        </p>
        <p className="italic text-muted text-[14px] mb-4">{viewing.closing}</p>
        <CareerCardPanel card={viewing.card} history={viewing.history} choices={viewing.choices} />
        {viewing.history.map((r) => (
          <div key={r.season} className="flex justify-between py-2 border-b border-line text-[13px]">
            <span>
              {r.yearLabel} · {r.teamAbbr}
            </span>
            <span className="text-wood font-display">
              {r.ppg.toFixed(1)}/{r.rpg.toFixed(1)}/{r.apg.toFixed(1)}
            </span>
          </div>
        ))}
        <h4 className="font-display text-[18px] mt-4 mb-2">Scelte</h4>
        {viewing.choices.map((c, i) => (
          <div key={i} className="text-[13px] py-1 text-muted">
            S.{c.season} {c.title}: <span className="text-chalk">{c.pick}</span>
          </div>
        ))}
      </section>
    );
  }
  return (
    <section className="fade-in">
      <button className="back-link" onClick={onBack}>
        <ChevronLeft className="size-4" /> Home
      </button>
      <h2 className="page-title">Archivio</h2>
      {archive.length === 0 && <p className="text-muted">Nessuna carriera salvata su questo dispositivo.</p>}
      {archive.map((c) => (
        <button key={c.id} className="choice-btn mb-2" onClick={() => setViewing(c)}>
          <span className="font-display text-[18px]">{c.name}</span>
          <span className="text-[12.5px] text-muted">
            {c.role} · {c.verdict} · {c.seasons} stagioni · picco {displayOverall(c.peak)}
            {c.apexAge ? ` a ${c.apexAge}` : ""}
            {c.difficulty ? ` · ${DIFFICULTIES.find((d) => d.id === c.difficulty)?.label}` : ""}
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
}: {
  card: ReturnType<typeof careerCardOf> | undefined;
  history: ArchiveCareer["history"];
  choices: ArchiveCareer["choices"];
}) {
  if (!card) return null;
  const draft = choices.find((choice) => choice.title === "Chiamata");
  const teams = [...new Set(history.map((season) => season.team))];
  const awards = new Map<string, number>();
  for (const season of history) {
    for (const award of season.awards || []) awards.set(award, (awards.get(award) ?? 0) + 1);
  }

  return (
    <section className={`result-card ${card.legacyTier}`} data-career-card role="region" aria-label="Career Card">
      <div className="eyebrow">Career Card · {card.engineVersion}</div>
      <h3 className="page-title text-chalk">{card.playerName}</h3>
      <p className="result-name">{card.role} · {card.nationality}</p>
      <p className="result-span">
        Età {card.ageStart}–{card.ageEnd} · {card.seasons} stagioni · picco {displayOverall(card.peakOverall)}
      </p>
      <div className="result-stats">
        {[
          [card.ppg.toFixed(1), "PPG"],
          [card.rpg.toFixed(1), "RPG"],
          [card.apg.toFixed(1), "APG"],
          [card.championships, "Titoli"],
          [card.allStars, "All-Star"],
          [card.mvps, "MVP"],
        ].map(([value, label]) => (
          <div key={String(label)} className="result-stat">
            <div className="tv">{value}</div>
            <div className="tl">{label}</div>
          </div>
        ))}
      </div>
      <p className="feel-line">Draft: {draft?.pick ?? "dato non disponibile"}</p>
      <p className="feel-line">Squadre: {teams.length ? teams.join(" → ") : "dato non disponibile"}</p>
      {awards.size > 0 && (
        <p className="feel-line">
          Premi stagionali: {[...awards].map(([name, count]) => `${count}× ${name}`).join(" · ")}
        </p>
      )}
      {card.milestones.length > 0 && (
        <div className="result-chips" aria-label="Traguardi">
          {card.milestones.map((milestone) => <span key={milestone} className="result-chip">{milestone}</span>)}
        </div>
      )}
      <p className="result-close">{card.verdict} · Legacy {card.legacyTier}</p>
    </section>
  );
}
