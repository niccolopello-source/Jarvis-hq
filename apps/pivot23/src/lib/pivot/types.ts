
export type AttrKey =
  | "shooting"
  | "handle"
  | "passing"
  | "defense"
  | "rebounding"
  | "athleticism"
  | "strength"
  | "iq";

export type HiddenKey =
  | "clutch"
  | "durability"
  | "workEthic"
  | "ego"
  | "chemistry"
  | "consistency"
  | "motor"
  | "mediaSavvy";

export type Role = "PG" | "SG" | "SF" | "PF" | "C";
export type TeamTier = "contender" | "mid" | "rebuilding";
export type Conference = "East" | "West" | "Euro";
export type DifficultyId = "esordio" | "pro" | "allstar" | "leggenda";
export type Screen = "intro" | "setup" | "draft" | "career" | "result" | "archive";
export type CareerTab = "log" | "season" | "league" | "career";
export type LogKind =
  | "narrative"
  | "decision"
  | "recap"
  | "playoff"
  | "offseason"
  | "market";

export type TeamIdentity =
  | "pace"
  | "halfCourt"
  | "threePoint"
  | "isolation"
  | "ballMovement"
  | "defense"
  | "physical"
  | "development"
  | "veteran";

export type TeamAmbition = "rebuild" | "development" | "competitive" | "contender" | "championship";

export type CpuArchetype =
  | "slasher"
  | "shooter"
  | "playmaker"
  | "twoWay"
  | "rimProtector"
  | "stretch"
  | "scorer";

export interface CpuStar {
  id: string;
  name: string;
  teamAbbr: string;
  role: Role;
  age: number;
  overall: number;
  potential: number;
  workEthic: number;
  durability: number;
  archetype: CpuArchetype;
  retired: boolean;
  ppg: number;
  rpg: number;
  apg: number;
  gp: number;
  lateBloomer?: boolean;
  bust?: boolean;
}

export interface WorldTeam {
  abbr: string;
  identity: TeamIdentity;
  ambition: TeamAmbition;
  chemistry: number;
  health: number;
  experience: number;
}

export interface WorldEvent {
  yearLabel: string;
  kind: "trade" | "retire" | "draft" | "fa" | "coach" | "dynasty";
  text: string;
}

export interface LeagueWorld {
  year: number;
  stars: CpuStar[];
  teams: Record<string, WorldTeam>;
  events: WorldEvent[];
  draftQuality: number;
}

export interface Team {
  name: string;
  tier: TeamTier;
  abbr: string;
  color: string;
  secondary: string;
  city: string;
  conf: Conference;
  div: string;
  power: number;
  star: string;
  note: string;
}

export interface DraftCard {
  name: string;
  desc: string;
  primary: { key: AttrKey; delta: number };
  secondary: { key: AttrKey; delta: number }[];
  hidden?: Partial<Record<HiddenKey, number>>;
}

export interface Contract {
  teamName: string;
  years: number;
  yearsRemaining: number;
  annualM: number;
  kind: "rookie" | "extension" | "fa" | "midlevel";
}

export interface Fx {
  attrs?: Partial<Record<AttrKey, number>>;
  hidden?: Partial<Record<HiddenKey, number>>;
  development?: number;
  form?: number;
  injuryRisk?: number;
  injuryDrag?: number;
  publicImage?: number;
  coachTrust?: number;
  rivalry?: number;
  morale?: number;
  gamesPenalty?: number;
  flavor: string;
}

export interface Choice {
  label: string;
  detail: string;
  fx: (s: PlayerState) => Fx;
}

export interface StoryEvent {
  id: string;
  phase: "rookie" | "prime" | "veteran" | "any";
  title: string;
  subtitle: string;
  choices: Choice[];
}

export interface OffseasonFocus {
  id: string;
  label: string;
  desc: string;
  gains: { key: AttrKey; base: number }[];
  hidden?: Partial<Record<HiddenKey, number>>;
  injury: number;
  development: number;
  roles: Role[];
}

export interface StandingRow {
  abbr: string;
  name: string;
  city: string;
  color: string;
  secondary: string;
  conf: Conference;
  div: string;
  w: number;
  l: number;
  seed: number | null;
  power: number;
  star: string;
  ppg: number;
  oppPpg: number;
  rpg: number;
  apg: number;
  netRtg: number;
  pace: number;
  note: string;
  starPpg: number;
  starRpg: number;
  starApg: number;
  identity?: TeamIdentity;
  ambition?: TeamAmbition;
}

export interface LeagueAward {
  title: string;
  name: string;
  team: string;
  teamAbbr: string;
  note: string;
  isPlayer: boolean;
}

export interface StatLeader {
  stat: string;
  name: string;
  team: string;
  value: string;
  isPlayer: boolean;
}

export interface RoyCandidate {
  name: string;
  team: string;
  teamAbbr: string;
  teamColor: string;
  ppg: number;
  rpg: number;
  apg: number;
  score: number;
  isPlayer: boolean;
}

export interface VoteRow {
  name: string;
  abbr: string;
  color: string;
  score: number;
  line: string;
  isPlayer: boolean;
  trophy?: boolean;
}

export interface DpoyCandidate {
  name: string;
  team: string;
  teamAbbr: string;
  teamColor: string;
  spg: number;
  bpg: number;
  score: number;
  isPlayer: boolean;
}

export interface GameLine {
  n: number;
  us: number;
  them: number;
  win: boolean;
}

export interface SeriesResult {
  round: number;
  label: string;
  opponent: Team;
  opponentSeed: number;
  userSeed: number;
  wins: number;
  losses: number;
  won: boolean;
  games: GameLine[];
}

export interface BracketPair {
  a: StandingRow;
  b: StandingRow;
  winnerAbbr?: string;
}

export interface PlayoffState {
  conf: Conference;
  seed: number;
  round: number;
  pairs: BracketPair[];
  otherChamp?: StandingRow;
  /** Written once when the player's series ends. Later title reads must not reroll it. */
  settledChampion?: StandingRow;
}

export interface TitleEntry {
  yearLabel: string;
  team: string;
  teamAbbr: string;
  teamColor: string;
  star: string;
  isPlayer: boolean;
  league: "NBA" | "EuroLega";
}

export interface LeagueSnapshot {
  yearLabel: string;
  east: StandingRow[];
  west: StandingRow[];
  euro: StandingRow[];
  awards: LeagueAward[];
  leaders: StatLeader[];
  royRace: RoyCandidate[];
  dpoyRace?: DpoyCandidate[];
  /** Classifica reale del voto, con lo stesso punteggio che assegna il premio. */
  mvpBoard?: VoteRow[];
  nbaBoard?: VoteRow[];
  champion?: TitleEntry;
}

export interface SeasonRow {
  season: number;
  yearLabel: string;
  age: number;
  team: string;
  teamAbbr: string;
  teamColor: string;
  teamSecondary: string;
  overall: number;
  gp: number;
  min: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  fg: number;
  tp: number;
  ft: number;
  tov: number;
  ts: number;
  per: number;
  plusMinus: number;
  wins: number;
  losses: number;
  seed: number | null;
  conf: Conference;
  awards: string[];
  playoff: string;
  salaryM: number;
  league?: LeagueSnapshot;
  seriesLog?: SeriesResult[];
  mood?: string;
}

export interface DevRow {
  season: number;
  label: string;
  line: string;
  before: number;
  after: number;
  tradeDest?: Team;
  tradeForced?: boolean;
}

export interface Milestone {
  season: number;
  label: string;
}

export interface LogEntry {
  id: string;
  kind: LogKind;
  title?: string;
  body?: string;
  resolved?: boolean;
  chosen?: string;
  result?: string;
  extraClass?: string;
  row?: SeasonRow;
  ovrBefore?: number;
  ovrAfter?: number;
  series?: SeriesResult;
}

export interface MarketOffer {
  id: string;
  team: Team;
  years: number;
  annualM: number;
  pitch: string;
  kind: "extension" | "max" | "ring" | "fair" | "euro" | "prove";
}

export interface PlayoffChoice {
  label: string;
  detail: string;
  bonus: (s: PlayerState) => number;
  fx: Fx;
}

export interface PlayerState {
  name: string;
  role: Role;
  nationality: string;
  number: number;
  attrs: Record<AttrKey, number>;
  hidden: Record<HiddenKey, number>;
  age: number;
  talent: number;
  development: number;
  form: number;
  injuryRisk: number;
  injuryDrag: number;
  gamesPenalty: number;
  publicImage: number;
  coachTrust: number;
  rivalry: number;
  morale: number;
  overall: number;
  peakOverall: number;
  /** Età personale del picco (ruolo, etica, percorso). Sempre 26, 27 o 28. */
  apexAge: number;
  /** Chiamata al draft NBA, 1–60. 0 se non ancora assegnata. */
  draftPick: number;
  /** Impronta da carte draft: pesa sulla prontezza da rookie / ROY. */
  rookReady: number;
  /** Scarto delle carte scelte rispetto alla mano. 0 = indifferente. */
  draftEdge?: number;
  team: Team;
  league: "NBA" | "EuroLega";
  contract: Contract;
  originPath: string;
  rivalName: string;
  coachName: string;
  round: number;
  draftHand: DraftCard[];
  choiceOvr: number;
  season: number;
  extraSeason: boolean;
  international: boolean;
  medal: boolean;
  allStarCount: number;
  mvpCount: number;
  allNbaCount: number;
  dpoyCount: number;
  roy: boolean;
  titleCount: number;
  fmvpCount: number;
  careerPoints: number;
  careerRebounds: number;
  careerAssists: number;
  careerSteals: number;
  careerBlocks: number;
  seasonHistory: SeasonRow[];
  milestones: Milestone[];
  devLog: DevRow[];
  usedEventIds: string[];
  heardLines: string[];
  lastOffseasonId: string;
  choiceLog: { season: number; title: string; pick: string }[];
  yearsOnTeam: number;
  teamPower: Record<string, number>;
  currentLeague: LeagueSnapshot | null;
  playoff: PlayoffState | null;
  royClass: RoyCandidate[];
  potential: number;
  startAge: number;
  championLog: TitleEntry[];
  difficulty: DifficultyId;
  /** Lingua scelta in home. Le scene generate la rispettano. */
  lang?: "it" | "en" | "es";
  simulated: boolean;
  /** Storage identity. Not an RNG input and not derived from `seed`. */
  careerId: string;
  seed: number;
  rngState: number;
  engineVersion: string;
  world?: LeagueWorld;
}

export interface ArchiveCareer {
  id: string;
  savedAt: number;
  version: number;
  name: string;
  role: string;
  verdict: string;
  seasons: number;
  peak: number;
  apexAge?: number;
  titles: number;
  ppg: number;
  closing: string;
  history: SeasonRow[];
  milestones: Milestone[];
  choices: { season: number; title: string; pick: string }[];
  finalAttrs: Record<AttrKey, number>;
  finalHidden: Record<HiddenKey, number>;
  difficulty?: DifficultyId;
  simulated?: boolean;
  seed?: number;
  /** Stable career identity. Absent on archives written before it existed. */
  careerId?: string;
  engineVersion?: string;
  /** Cold archive sheet. Absent on archives written before compaction. */
  archiveSchema?: number;
  /** Fotografia stabile. Non è il salvataggio e non è un NFT. */
  card?: import("./card").CareerCard;
  fingerprint?: string;
}

export interface Nationality {
  id: string;
  label: string;
  region: string;
}

export type SavedStoryScript = "rookie" | "rival" | "injury" | "nation" | "pool" | "late" | "quiet";

export type HoldNext = "season" | "offseason" | "preseason" | "story-after-trade";

export type SavedPending =
  | { kind: "path" }
  | { kind: "call"; pick: number; flavor: string }
  | {
      kind: "story";
      title: string;
      subtitle: string;
      script?: SavedStoryScript;
      eventId?: string;
      options: { label: string; detail: string }[];
    }
  | { kind: "recap"; row: SeasonRow; qualified: boolean; awardNote: string; door: string }
  | { kind: "playoff"; round: number; opponent: Team; nerves: string }
  | { kind: "fa"; offers: MarketOffer[]; desk: string }
  | { kind: "trade"; team: Team; pitch: string }
  | { kind: "trade-notice"; team: Team; from: string; pitch: string }
  | { kind: "retire" }
  | { kind: "hold"; next: HoldNext; season?: number };

/** Snapshot di una vita in corso. Una chiave, un resume. */
export interface LiveSave {
  v: number;
  screen: Screen;
  tab: CareerTab;
  player: PlayerState;
  pending: SavedPending | null;
  log: LogEntry[];
  logSeq: number;
  /** Impronta di seed, sequenza e stato casuale. Assente nei salvataggi già scritti. */
  c?: string;
}
