
import { IDENTITY_MOD, SIM } from "./config";
import { chance, gaussTrim, gaussian, pick, rand, randInt } from "./rng";
import { fillVars } from "./voice";
import { cloneTeam, NBA_TEAMS, EURO_TEAMS, ROOKIE_NAMES } from "./teams";
import type {
  CpuArchetype,
  CpuStar,
  LeagueWorld,
  PlayerState,
  Role,
  TeamAmbition,
  TeamIdentity,
  WorldEvent,
  WorldTeam,
} from "./types";

const FIRST = [
  "Asher", "Malik", "Luka", "Jalen", "Enzo", "Caleb", "Theo", "Isaiah", "Mateo", "Noah",
  "Kobe", "Pavel", "Dario", "Nico", "Andre", "Miles", "Soren", "Ellis", "Rafa", "Kenji",
  "Omar", "Tomas", "Ilija", "Jamal", "Devin", "Cole", "Nasir", "Pietro", "Hugo", "Levi",
];
const LAST = [
  "Quinn", "Crowe", "Petrovic", "Voss", "Moretti", "Okoye", "Marais", "Flint", "Silva", "Berg",
  "Daramy", "Novak", "Blake", "Ward", "Vance", "Hale", "Okoro", "Santos", "Ilic", "Nakamura",
  "Grant", "Rossi", "Diallo", "Kemp", "Frost", "Ndiaye", "Costa", "Jensen", "Park", "Morrow",
];
const ARCH: CpuArchetype[] = ["slasher", "shooter", "playmaker", "twoWay", "rimProtector", "stretch", "scorer"];
const IDENT: TeamIdentity[] = [
  "pace", "halfCourt", "threePoint", "isolation", "ballMovement", "defense", "physical", "development", "veteran",
];
const ROLES: Role[] = ["PG", "SG", "SF", "PF", "C"];
const COACH_LAST = [
  "Marchetti", "Voss", "Ellison", "Rivas", "Kovacs", "Hartley",
  "Okoye", "Bellini", "Kruger", "Santos", "Ibarra", "Novak",
  "Hale", "Diallo", "Petrov", "Moretti",
];

const COPY_FA = [
  `$NAME firma da svincolato a $DEST. Lascia $FROM.`,
  `Mercato: $NAME sceglie $DEST. Addio $FROM.`,
  `$NAME cambia casacca: da $FROM a $DEST, da svincolato.`,
  `$DEST ($GOAL) chiama $NAME dal mercato. $FROM resta senza volto.`,
  `$NAME, $AGE anni, sceglie $DEST. $FROM lo lascia partire.`,
  `$NAME lascia $FROM a parametro zero. Prima firma: $DEST.`,
  `Colpo di mercato: $DEST chiude $NAME. $FROM non allinea l'offerta.`,
  `Niente rinnovo a $FROM. $NAME accetta $DEST e chiude.`,
  `Da $FROM a $DEST, da svincolato: $NAME cambia aria.`,
  `$DEST ($GOAL) vince il mercato su $NAME. $FROM resta a guardare.`,
];
const COPY_FA_YOUNG = [
  `$NAME, ancora $AGE anni, sceglie $DEST per crescere. Addio $FROM.`,
  `$DEST ($GOAL) investe su $NAME. $FROM lo lascia partire giovane.`,
  `Promessa in movimento: $NAME ($AGE) firma a $DEST. $FROM non trattiene.`,
  `$NAME cambia piazza da ragazzo. $DEST lo prende, $FROM lo saluta.`,
];
const COPY_FA_VET = [
  `$NAME, $AGE anni, va a $DEST per $GOAL. $FROM chiude un ciclo.`,
  `Veterano in movimento: $NAME firma a $DEST. $FROM cambia volto.`,
  `$DEST chiama mestiere. $NAME, $AGE anni, lascia $FROM.`,
  `Fine di un ciclo a $FROM: $NAME atterra a $DEST, progetto $GOAL.`,
];
const COPY_FA_STAR = [
  `$NAME, volto di $FROM, si svincola e sceglie $DEST.`,
  `Terremoto di mercato: $DEST strappa $NAME. $FROM perde la faccia.`,
  `$NAME non rinnova a $FROM. Firma da stella a $DEST ($GOAL).`,
  `La stella cambia sponda: $NAME, da $FROM a $DEST, a parametro zero.`,
];
const COPY_TRADE = [
  `$A ($PTS punti) va a $TO. $B arriva a $FROM.`,
  `Scambio: $A verso $TO, $B verso $FROM.`,
  `$FROM e $TO si scambiano le facce: $A per $B.`,
  `$A cambia sponda ($TO). $B fa il percorso inverso, a $FROM.`,
  `$TO ($GOAL) pesca $A. $FROM ($NEED) prende $B.`,
  `$FROM molla $A a $TO e riceve $B, in ottica $NEED.`,
  `Uno per uno tra $FROM e $TO: $A contro $B, senza giri di parole.`,
  `$A porta i suoi $PTS punti a $TO. $FROM si tiene $B e chiude.`,
  `$TO prende $A. $FROM risponde con $B. Pratica chiusa.`,
  `$A, volto di $FROM, finisce a $TO. Di ritorno arriva $B.`,
];
const COPY_TRADE_AGE = [
  `Cambio di ciclo: $A ($YA anni) verso $TO, $B ($YB anni) verso $FROM.`,
  `$FROM cede gli anni, $TO cede il mestiere: $A per $B.`,
  `Giovane per veterano: $A a $TO, $B a $FROM. Due progetti, uno scambio.`,
  `$TO ($GOAL) pesca $A, $YA anni. $FROM ($NEED) si tiene $B.`,
];
const COPY_TRADE_STAR = [
  `$TO strappa $A, il volto. $FROM accetta $B e tira dritto.`,
  `Scambio da testata: $A va a $TO. $B, in cambio, a $FROM.`,
  `$A ($PTS punti) cambia sponda. $TO vince il colpo, $FROM prende $B.`,
  `$FROM molla la stella. $A finisce a $TO, $B fa il percorso inverso.`,
];
const COPY_TRADE_REBUILD = [
  `Operazione da $NEED: $FROM cede $A e punta su $B.`,
  `$FROM smonta il volto. $A va a $TO, in cambio $B.`,
  `$TO accelera per $GOAL. Arriva $A, parte $B verso $FROM.`,
  `Ricostruzione in corso: $FROM prende $B, $TO si tiene $A.`,
];
const COPY_COACH_HIRE = [
  `A $CITY arriva $COACH. Nuovo copione: $SYS.`,
  `$CITY cambia voce in panchina. $COACH, sistema $SYS.`,
  `Panchina nuova a $CITY: $COACH. Si gioca a $SYS.`,
  `$COACH siede a $CITY. Via il vecchio copione, adesso $SYS.`,
  `La dirigenza di $CITY chiama $COACH. Obiettivo $GOAL, mezzo $SYS.`,
  `$CITY, in ottica $GOAL, affida la squadra a $COACH ($SYS).`,
  `Nuovo tecnico a $CITY. $COACH chiude $OLD e apre $SYS.`,
  `$COACH a $CITY: panchina nuova, stesso palazzetto, altro basket ($SYS).`,
];
const COPY_COACH_FIRE = [
  `Esonero a $CITY. Via il tecnico, resta il dubbio.`,
  `$CITY caccia l'allenatore. In panchina, per ora, il vuoto.`,
  `Fine corsa in panchina a $CITY. La piazza chiede un altro volto.`,
  `A $CITY saltano il tecnico. $STAR resta, lo staff no.`,
  `Esonero lampo a $CITY. La dirigenza non aspetta aprile.`,
  `$CITY chiude la panchina e riapre il discorso internamente.`,
  `Esonero a $CITY. Il nuovo staff prova $SYS.`,
  `$CITY gira pagina: via il tecnico, si gioca a $SYS.`,
];
const COPY_COACH_SHIFT = [
  `$CITY cambia sistema: $SYS.`,
  `Nuovo sistema a $CITY — $SYS.`,
  `$CITY gira pagina tattica: $SYS.`,
  `A $CITY non si tocca il roster. Cambia il copione: $SYS.`,
  `$CITY abbandona $OLD. Adesso si gioca a $SYS.`,
  `Rivoluzione tattica a $CITY: da $OLD a $SYS.`,
  `$CITY, progetto $GOAL, punta su $SYS.`,
  `Cambio di identità a $CITY. Il palazzetto vedrà $SYS.`,
  `La piazza di $CITY chiede un altro basket. Arriva $SYS.`,
  `$CITY cambia idea di gioco. $STAR resta, il sistema no: $SYS.`,
];
const COPY_DYNASTY = [
  `Dinastia $NAME: tre titoli di fila.`,
  `Tre anelli di fila per $NAME. Non è un ciclo, è un regno.`,
  `$NAME non molla l'anello: tris consecutivo.`,
  `Tris di titoli, stessa maglia: $NAME scrive la dinastia.`,
  `$NAME, tre giugno di fila. Il resto della lega prende atto.`,
  `Dinastia $NAME. Tre titoli, una sola piazza.`,
  `$STAR e $NAME: il tris che chiude le discussioni.`,
  `Terzo titolo di fila, $NAME. La lega gira intorno a $STAR.`,
];


/** Giornale, non almanacco. I più recenti restano. */
export const WORLD_EVENT_CAP = 16;
/** Ritirati visibili: alcuni, non l'almanacco. */
export const WORLD_RETIRED_CAP = 24;

const ROLE_BOX: Record<Role, { s: number; r: number; a: number }> = {
  PG: { s: 0.92, r: 0.52, a: 1.58 },
  SG: { s: 1.14, r: 0.62, a: 0.88 },
  SF: { s: 1.02, r: 0.92, a: 0.9 },
  PF: { s: 0.94, r: 1.28, a: 0.62 },
  C: { s: 0.86, r: 1.42, a: 0.48 },
};

const ARCH_BOX: Record<CpuArchetype, { s: number; r: number; a: number; age: number }> = {
  slasher: { s: 1.08, r: 0.95, a: 0.92, age: 1.18 },
  shooter: { s: 1.12, r: 0.82, a: 0.9, age: 0.78 },
  playmaker: { s: 0.9, r: 0.85, a: 1.28, age: 0.72 },
  twoWay: { s: 0.96, r: 1.02, a: 0.95, age: 0.92 },
  rimProtector: { s: 0.82, r: 1.22, a: 0.7, age: 0.95 },
  stretch: { s: 1.06, r: 1.08, a: 0.82, age: 0.88 },
  scorer: { s: 1.16, r: 0.88, a: 0.86, age: 1.08 },
};

function newId() {
  return `c${Math.floor(rand() * 1e9).toString(36)}`;
}

function newName(used: Set<string>) {
  for (let i = 0; i < 24; i++) {
    const n = `${pick(FIRST)} ${pick(LAST)}`;
    if (!used.has(n)) {
      used.add(n);
      return n;
    }
  }
  return `${pick(ROOKIE_NAMES)} ${randInt(2, 9)}`;
}

function ambitionFromPower(power: number): TeamAmbition {
  if (power >= 86) return "championship";
  if (power >= 78) return "contender";
  if (power >= 70) return "competitive";
  if (power >= 62) return "development";
  return "rebuild";
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/** Medie ridotte: una riga, non un box score completo. */
export function fillStarBox(p: CpuStar) {
  const role = ROLE_BOX[p.role];
  const arch = ARCH_BOX[p.archetype];
  const ovr = p.overall;
  const wear = p.age >= 33 ? 0.9 : p.age >= 31 ? 0.96 : 1;
  p.ppg = round1(clamp((8.2 + (ovr - 60) * 0.56) * role.s * arch.s * wear + gaussian(0, 0.55), 5.5, 33.8));
  p.rpg = round1(clamp((3.1 + (ovr - 60) * 0.1) * role.r * arch.r + gaussian(0, 0.28), 1.4, 15.4));
  p.apg = round1(clamp((2.0 + (ovr - 60) * 0.09) * role.a * arch.a + gaussian(0, 0.24), 0.6, 11.8));
  const miss =
    ((100 - p.durability) / 100) * 9 +
    Math.max(0, p.age - 32) * 2.4 +
    (p.bust ? 4 : 0) +
    gaussian(0, 2.2);
  p.gp = Math.round(clamp(82 - miss, 38, 82));
}

function makeStar(teamAbbr: string, power: number, used: Set<string>, ageBias = 0): CpuStar {
  const age = clamp(randInt(22, 32) + ageBias, 19, 35);
  const lateBloomer = chance(SIM.development.lateBloomRate);
  const bust = !lateBloomer && chance(SIM.development.bustRate);
  let pot = clamp(power + gaussTrim(4, 5, 2.2), 68, 98);
  let ovr = clamp(pot - Math.max(0, 27 - age) * 1.1 - Math.max(0, age - 30) * 1.4 + gaussTrim(0, 2.2, 2.2), 62, 97);
  let workEthic = randInt(35, 92);
  if (lateBloomer) {
    pot = clamp(pot + 6, 82, 98);
    ovr = clamp(ovr - 7, 60, 82);
    workEthic = randInt(72, 94);
  }
  if (bust) {
    workEthic = randInt(22, 42);
    ovr = clamp(ovr - 4, 58, 88);
  }
  const p: CpuStar = {
    id: newId(),
    name: newName(used),
    teamAbbr,
    role: pick(ROLES),
    age,
    overall: round1(ovr),
    potential: round1(pot),
    workEthic,
    durability: randInt(32, 90),
    archetype: pick(ARCH),
    retired: false,
    ppg: 0,
    rpg: 0,
    apg: 0,
    gp: 82,
    lateBloomer,
    bust,
  };
  fillStarBox(p);
  return p;
}

export function createWorld(teamPower: Record<string, number>): LeagueWorld {
  const used = new Set<string>();
  const stars: CpuStar[] = [];
  const teams: Record<string, WorldTeam> = {};
  for (const t of [...NBA_TEAMS, ...EURO_TEAMS]) {
    const power = teamPower[t.abbr] ?? t.power;
    stars.push(makeStar(t.abbr, power, used, 0));
    teams[t.abbr] = {
      abbr: t.abbr,
      identity: pick(IDENT),
      ambition: ambitionFromPower(power),
      chemistry: randInt(42, 78),
      health: randInt(55, 90),
      experience: randInt(40, 80),
    };
  }
  return {
    year: 2026,
    stars,
    teams,
    events: [],
    draftQuality: round1(0.35 + rand() * 0.45),
  };
}

export function liveStars(w: LeagueWorld, abbr: string) {
  return w.stars.filter((p) => p.teamAbbr === abbr && !p.retired);
}

export function liveStar(w: LeagueWorld | undefined, abbr: string) {
  if (!w) return undefined;
  return liveStars(w, abbr).sort((a, b) => b.overall - a.overall)[0];
}

export function teamStrength(s: PlayerState, abbr: string): number {
  const w = s.world;
  const star = liveStar(w, abbr);
  const tm = w?.teams[abbr];
  const power = s.teamPower[abbr] ?? 70;
  const talent = abbr === s.team.abbr ? s.overall : star ? star.overall : power;
  const starting = talent;
  const depth = power * 0.92;
  const c = SIM.team;
  let v =
    talent * c.talent +
    starting * c.starting +
    depth * c.depth +
    power * c.offense * 0.5 +
    power * c.defense * 0.5 +
    (tm?.chemistry ?? 55) * c.fit +
    (tm?.chemistry ?? 55) * c.chemistry +
    (tm?.health ?? 70) * c.health +
    (tm?.experience ?? 55) * c.experience +
    50 * c.form;
  if (abbr === s.team.abbr) {
    v += Math.max(0, s.overall - 60) * 0.18;
    v += (s.hidden.chemistry - 50) * 0.04;
    v += (s.form ?? 0) * 0.12;
  }
  if (tm?.identity === "defense") v += 1.5;
  if (tm?.identity === "veteran" && (tm.experience ?? 0) > 68) v += 1.1;
  if (tm?.identity === "development") v -= 0.7;
  if (tm?.identity === "pace") v += 0.4;
  return clamp(v, 42, 96);
}

function pushEvent(w: LeagueWorld, kind: WorldEvent["kind"], text: string) {
  const t = text.length > 140 ? `${text.slice(0, 137)}…` : text;
  if (!Array.isArray(w.events)) w.events = [];
  w.events.unshift({ yearLabel: String(w.year), kind, text: t });
  if (w.events.length > WORLD_EVENT_CAP) w.events.length = WORLD_EVENT_CAP;
}

/** Toglie i buchi, tiene le stelle vive e un anello di ritirati. In-place, O(n). */
export function pruneWorld(w: LeagueWorld) {
  if (!w) return;
  if (!Array.isArray(w.stars)) w.stars = [];
  if (!Array.isArray(w.events)) w.events = [];
  if (!w.teams || typeof w.teams !== "object" || Array.isArray(w.teams)) w.teams = {};
  if (!Number.isFinite(w.year)) w.year = 2026;
  const stars = w.stars;
  let liveN = 0;
  const dead: CpuStar[] = [];
  for (let i = 0; i < stars.length; i++) {
    const p = stars[i];
    if (!p) continue;
    if (p.retired) {
      dead.push(p);
      continue;
    }
    if (liveN !== i) stars[liveN] = p;
    liveN++;
  }
  /* Dopo un prune i ritirati stanno in coda. I nuovi (ancora in testa) restano. */
  const keep = Math.min(dead.length, WORLD_RETIRED_CAP);
  let n = liveN;
  for (let i = 0; i < keep; i++) stars[n++] = dead[i]!;
  if (n !== stars.length) stars.length = n;
  if (w.events.length > WORLD_EVENT_CAP) w.events.length = WORLD_EVENT_CAP;
}

function voiceOf(_s: PlayerState | undefined, pool: readonly string[], vars: Record<string, string>) {
  return fillVars(pick([...pool]), vars);
}

function identitiesFor(ambition: TeamAmbition): TeamIdentity[] {
  if (ambition === "rebuild") return ["development", "pace", "threePoint"];
  if (ambition === "development") return ["development", "pace", "ballMovement", "threePoint"];
  if (ambition === "competitive") return ["ballMovement", "halfCourt", "physical", "threePoint", "pace"];
  if (ambition === "contender") return ["defense", "isolation", "veteran", "ballMovement", "physical"];
  return ["veteran", "defense", "isolation", "halfCourt"];
}

function applyIdentityShift(wt: WorldTeam): { from: TeamIdentity; to: TeamIdentity } {
  const from = wt.identity;
  const preferred = identitiesFor(wt.ambition).filter((id) => id !== from);
  const fallback = IDENT.filter((id) => id !== from);
  const pool = preferred.length ? preferred : fallback.length ? fallback : IDENT;
  const to = pick(pool);
  wt.identity = to;
  return { from, to };
}

function faCopyPool(p: CpuStar): readonly string[] {
  if (p.age <= 23) return COPY_FA_YOUNG;
  if (p.age >= 30) return COPY_FA_VET;
  if (p.overall >= 84) return COPY_FA_STAR;
  return COPY_FA;
}

function tradeCopyPool(a: CpuStar, b: CpuStar, ta: WorldTeam, tb: WorldTeam): readonly string[] {
  const ageSwap = (a.age <= 24 && b.age >= 28) || (b.age <= 24 && a.age >= 28);
  if (ageSwap) return COPY_TRADE_AGE;
  if (a.overall >= 84 || b.overall >= 84) return COPY_TRADE_STAR;
  if (ta.ambition === "rebuild" || tb.ambition === "rebuild") return COPY_TRADE_REBUILD;
  return COPY_TRADE;
}

function tickBench(w: LeagueWorld, s: PlayerState) {
  const all = [...NBA_TEAMS, ...EURO_TEAMS];
  const n = chance(0.22) ? 2 : chance(0.72) ? 1 : 0;
  const ranked = all
    .map((t) => {
      const wt = w.teams[t.abbr];
      let sc = rand();
      if (t.abbr === s.team.abbr) sc -= 0.45;
      if (wt && wt.chemistry < 45) sc += 1.4;
      if (wt && wt.health < 50) sc += 0.55;
      if (wt && (wt.ambition === "rebuild" || wt.ambition === "championship")) sc += 0.35;
      return { t, wt, sc };
    })
    .sort((a, b) => b.sc - a.sc);

  const taken = new Set<string>();
  let made = 0;
  const want = n > 0 ? n : 0;
  for (const { t, wt } of ranked) {
    if (!wt || taken.has(t.abbr)) continue;
    const crash = wt.chemistry < 36 && !taken.size;
    if (made >= want && !crash) continue;
    if (made >= want + 1) break;
    taken.add(t.abbr);
    const star = liveStar(w, t.abbr);
    const coach = pick(COACH_LAST);
    const mode: "hire" | "fire" | "shift" = chance(0.4) ? "hire" : chance(0.48) ? "shift" : "fire";
    const oldSys = labelIdentity(wt.identity);
    if (mode !== "fire" || chance(0.62)) applyIdentityShift(wt);
    const sys = labelIdentity(wt.identity);
    const vars = {
      CITY: t.city,
      TEAM: t.abbr,
      SYS: sys,
      OLD: oldSys,
      COACH: coach,
      STAR: star?.name ?? t.star,
      GOAL: labelAmbition(wt.ambition),
    };
    if (mode === "hire") {
      wt.chemistry = clamp(wt.chemistry + randInt(2, 14), 28, 90);
      pushEvent(w, "coach", voiceOf(s, COPY_COACH_HIRE, vars));
    } else if (mode === "fire") {
      wt.chemistry = clamp(wt.chemistry + randInt(-4, 11), 28, 90);
      pushEvent(w, "coach", voiceOf(s, COPY_COACH_FIRE, vars));
    } else {
      wt.chemistry = clamp(wt.chemistry + randInt(-5, 8), 28, 90);
      pushEvent(w, "coach", voiceOf(s, COPY_COACH_SHIFT, vars));
    }
    made += 1;
  }
}


function developStar(p: CpuStar) {
  const remain = p.potential - p.overall;
  const ethic = p.workEthic / 100;
  const arch = ARCH_BOX[p.archetype];
  const bloom =
    p.lateBloomer && p.age >= SIM.development.lateBloomAge[0] && p.age <= SIM.development.lateBloomAge[1] && remain > 2;
  const bustDrag = p.bust ? 0.45 : 1;
  if (p.age <= 24 && remain > 1) {
    const jump = (0.55 + ethic * 1.45) * Math.min(3.4, remain * 0.36) * bustDrag;
    p.overall = round1(clamp(p.overall + jump + (bloom ? 1.4 : 0) + gaussian(0, 0.45), 55, 98));
  } else if (p.age <= 27 && remain > 0) {
    const jump = (0.22 + ethic * 0.75) * Math.min(1.9, remain * 0.3) * bustDrag;
    p.overall = round1(clamp(p.overall + jump + (bloom ? 1.1 : 0) + gaussian(0, 0.35), 55, 98));
  } else if (p.age <= 30) {
    p.overall = round1(clamp(p.overall + gaussian(0.04, 0.32) * bustDrag, 55, 97));
  } else {
    const drop = (0.65 + (p.age - 30) * 0.42 + (1 - p.durability / 100) * 0.75 - ethic * 0.22) * arch.age;
    p.overall = round1(clamp(p.overall - drop + gaussian(0, 0.28), 48, 94));
  }
  p.age += 1;
  if (p.age >= SIM.overall.maxAge) p.retired = true;
  fillStarBox(p);
}

function retirementScore(p: CpuStar) {
  if (p.age < 32) return 0;
  if (p.age >= SIM.overall.maxAge) return 1;
  let sc = (p.age - 31) * 0.13 + (76 - p.overall) * 0.013 + (100 - p.durability) * 0.0045;
  if (p.overall >= 88) sc *= 0.42;
  if (p.bust) sc += 0.08;
  return clamp(sc, 0, 0.78);
}

/** Rebuild pesca giovani; contender/championship pesca veterani utili. */
function starAmbitionFit(p: CpuStar, ambition: TeamAmbition): number {
  const young = p.age <= 24;
  const vet = p.age >= 28;
  const useful = p.overall >= 78;
  const upside = p.potential - p.overall;
  if (ambition === "rebuild") {
    let sc = young ? 8 + Math.min(10, upside) : 0;
    if (p.age <= 22) sc += 3;
    if (vet) sc -= useful ? 6 : 2;
    if (p.age >= 32) sc -= 8;
    return sc;
  }
  if (ambition === "development") {
    let sc = young || p.age <= 26 ? 5 + Math.min(6, upside) : 1;
    if (p.age >= 31) sc -= 5;
    return sc;
  }
  if (ambition === "competitive") {
    return (useful ? 4 : 1) - (p.age >= 33 ? 3 : 0);
  }
  if (ambition === "contender") {
    let sc = 0;
    if (vet && useful) sc += 8;
    if (young && p.overall < 76) sc -= 4;
    if (p.overall >= 82) sc += 5;
    return sc;
  }
  let sc = 0;
  if (p.overall >= 84) sc += 10;
  if (vet && useful) sc += 6;
  if (young && p.overall < 80) sc -= 5;
  if (p.age >= 34 && p.overall < 86) sc -= 4;
  return sc;
}

function pickDestByAmbition(w: LeagueWorld, candidates: { abbr: string }[], p: CpuStar): string {
  let best = candidates[0]!.abbr;
  let bestSc = -1e9;
  for (const t of candidates) {
    const amb = w.teams[t.abbr]?.ambition ?? "competitive";
    const sc = starAmbitionFit(p, amb) + gaussian(0, 1.4);
    if (sc > bestSc) {
      bestSc = sc;
      best = t.abbr;
    }
  }
  return best;
}

function relocateStar(w: LeagueWorld, p: CpuStar, avoid: string, event = true, s?: PlayerState) {
  const nba = new Set(NBA_TEAMS.map((t) => t.abbr));
  const pool = nba.has(p.teamAbbr) || nba.has(avoid) ? NBA_TEAMS : EURO_TEAMS;
  const blocked = new Set<string>([avoid, p.teamAbbr]);
  if (s?.team?.abbr && s.team.abbr !== "UND") blocked.add(s.team.abbr);
  const empty = pool.filter((t) => !blocked.has(t.abbr) && liveStars(w, t.abbr).length === 0);
  if (empty.length) {
    const dest = pickDestByAmbition(w, empty, p);
    const from = p.teamAbbr;
    p.teamAbbr = dest;
    if (event) {
      pushEvent(
        w,
        "fa",
        voiceOf(s, [
          `$NAME trova casa a $DEST. Lascia $FROM.`,
          `$NAME firma a $DEST. $FROM resta senza volto.`,
          `Da $FROM a $DEST: $NAME cambia sponda.`,
          `$DEST ($GOAL) accoglie $NAME. $FROM lo lascia partire.`,
          `$NAME, svincolato, atterra a $DEST. $FROM chiude il capitolo.`,
          `Piazza nuova per $NAME: $DEST, progetto $GOAL. Addio $FROM.`,
        ], { NAME: p.name, DEST: dest, FROM: from, GOAL: labelAmbition(w.teams[dest]?.ambition ?? "competitive") }),
      );
    }
    return;
  }
  const occupied = pool.filter((t) => !blocked.has(t.abbr));
  let weakest: CpuStar | undefined;
  let weakScore = 1e9;
  for (const t of occupied) {
    const cur = liveStar(w, t.abbr);
    if (!cur) continue;
    const amb = w.teams[t.abbr]?.ambition ?? "competitive";
    const sc = cur.overall + starAmbitionFit(cur, amb) - starAmbitionFit(p, amb);
    if (sc < weakScore) {
      weakScore = sc;
      weakest = cur;
    }
  }
  const destAmb = weakest ? (w.teams[weakest.teamAbbr]?.ambition ?? "competitive") : "competitive";
  const destWants = weakest ? starAmbitionFit(p, destAmb) - starAmbitionFit(weakest, destAmb) : -99;
  if (weakest && (p.overall > weakest.overall + 1.5 || destWants > 2)) {
    const dest = weakest.teamAbbr;
    weakest.retired = true;
    const from = p.teamAbbr;
    p.teamAbbr = dest;
    if (event) {
      pushEvent(
        w,
        "trade",
        voiceOf(s, [
          `$NAME prende il posto a $DEST. $OLD esce di scena.`,
          `$DEST sceglie $NAME. Per $OLD è finita.`,
          `$NAME arriva a $DEST. $OLD cede il passo, senza rumore.`,
          `$DEST punta su $NAME. $OLD resta fuori dal quadro.`,
          `Cambio di faccia a $DEST: entra $NAME, esce $OLD.`,
        ], { NAME: p.name, DEST: dest, OLD: weakest.name }),
      );
    }
    return;
  }
  p.retired = true;
  if (event) {
    pushEvent(
      w,
      "retire",
      voiceOf(s, [
        `$NAME chiude. Non c'era più un ruolo da stella.`,
        `$NAME si ferma. Il mestiere, per lui, è finito.`,
        `Niente nuova maglia per $NAME. Solo la chiusura.`,
      ], { NAME: p.name }),
    );
  }
}

/** Il protagonista occupa lo slot della sua squadra: una faccia, non due. */
export function occupyTeamSlot(s: PlayerState) {
  if (!s.world || !s.team || s.team.abbr === "UND") return;
  const w = s.world;
  let extras = liveStars(w, s.team.abbr);
  for (let guard = 0; extras.length && guard < 3; guard++) {
    for (const p of extras) relocateStar(w, p, s.team.abbr, true, s);
    extras = liveStars(w, s.team.abbr);
  }
  if (extras.length) {
    for (const p of extras) p.retired = true;
  }
  const used = new Set(w.stars.map((p) => p.name));
  fillVacancies(w, used, s.team.abbr);
  pruneWorld(w);
}

function fillVacancies(w: LeagueWorld, used: Set<string>, playerAbbr?: string) {
  for (const p of w.stars) if (p?.name) used.add(p.name);
  for (const t of [...NBA_TEAMS, ...EURO_TEAMS]) {
    if (playerAbbr && t.abbr === playerAbbr) continue;
    if (liveStars(w, t.abbr).length === 0) {
      const amb = w.teams[t.abbr]?.ambition;
      const ageBias =
        amb === "rebuild" || amb === "development" ? -6 : amb === "contender" || amb === "championship" ? 4 : chance(0.35) ? -6 : 0;
      const kid = makeStar(t.abbr, 70 + gaussian(0, 6), used, ageBias);
      w.stars.push(kid);
    }
  }
}

function ensureOneStarPerTeam(w: LeagueWorld, s?: PlayerState) {
  const playerAbbr = s?.team?.abbr && s.team.abbr !== "UND" ? s.team.abbr : undefined;
  for (const t of [...NBA_TEAMS, ...EURO_TEAMS]) {
    if (playerAbbr && t.abbr === playerAbbr) {
      for (const extra of liveStars(w, t.abbr)) relocateStar(w, extra, t.abbr, false, s);
      continue;
    }
    const live = liveStars(w, t.abbr).sort((a, b) => b.overall - a.overall);
    for (const extra of live.slice(1)) relocateStar(w, extra, t.abbr, false, s);
  }
}

export function tickWorld(s: PlayerState) {
  if (!s.world) s.world = createWorld(s.teamPower);
  const w = s.world;
  for (const p of w.stars) {
    if (!p.ppg && !p.retired) fillStarBox(p);
  }
  w.year += 1;
  const used = new Set(w.stars.map((p) => p.name));

  for (const p of w.stars) {
    if (p.retired) continue;
    developStar(p);
    if (!p.retired && chance(retirementScore(p))) {
      p.retired = true;
      pushEvent(
        w,
        "retire",
        voiceOf(s, [
          `$NAME si ritira a $AGE anni. $TEAM perde la sua faccia.`,
          `$NAME appende le scarpe a $AGE anni. $TEAM deve trovare un altro volto.`,
          `Fine corsa per $NAME, $AGE anni. $TEAM resta senza stella.`,
          `$NAME chiude a $AGE anni. A $TEAM cambia il nome sulla maglia.`,
        ], { NAME: p.name, AGE: String(p.age), TEAM: p.teamAbbr }),
      );
    }
  }

  w.draftQuality = round1(clamp(0.22 + rand() * 0.7, 0.15, 0.95));
  const nbaPower = NBA_TEAMS.map((t) => ({ abbr: t.abbr, power: s.teamPower[t.abbr] ?? t.power })).sort(
    (a, b) => a.power - b.power,
  );
  const lottery = nbaPower.filter((t) => t.abbr !== s.team.abbr).slice(0, 8);
  const nStars = w.draftQuality > 0.78 ? randInt(2, 3) : w.draftQuality > 0.45 ? randInt(1, 2) : chance(0.35) ? 1 : 0;
  const drafted: string[] = [];
  for (let i = 0; i < nStars; i++) {
    const slot = lottery[i];
    if (!slot) break;
    const kid = makeStar(slot.abbr, 74 + w.draftQuality * 18, used, -6);
    kid.age = randInt(19, 21);
    kid.overall = round1(clamp(62 + w.draftQuality * 16 + gaussian(0, 3), 60, 88));
    kid.potential = round1(clamp(kid.overall + 8 + w.draftQuality * 14, 72, 98));
    fillStarBox(kid);
    const old = liveStar(w, slot.abbr);
    if (old) {
      old.retired = true;
      pushEvent(
        w,
        "retire",
        voiceOf(s, [
          `$OLD cede il passo. A $TEAM arriva la nuova generazione.`,
          `$OLD esce. $TEAM punta su un nome nuovo dal draft.`,
          `Cambio di faccia a $TEAM: $OLD fa spazio.`,
        ], { OLD: old.name, TEAM: slot.abbr }),
      );
    }
    w.stars.push(kid);
    drafted.push(`${kid.name} (${slot.abbr})`);
    const wtDraft = w.teams[slot.abbr];
    if (wtDraft && wtDraft.identity !== "development" && chance(0.34)) {
      const oldSys = labelIdentity(wtDraft.identity);
      wtDraft.identity = "development";
      const city = NBA_TEAMS.find((t) => t.abbr === slot.abbr)?.city ?? slot.abbr;
      pushEvent(
        w,
        "coach",
        voiceOf(s, [
          `A $CITY il draft spinge verso la crescita. $STAR è il volto, si gioca a $SYS.`,
          `$CITY gira pagina dopo il draft: da $OLD a $SYS, con $STAR in vetrina.`,
          `Nuovo volto, nuovo copione: $CITY chiama $STAR e punta su $SYS.`,
        ], { CITY: city, STAR: kid.name, SYS: labelIdentity(wtDraft.identity), OLD: oldSys }),
      );
    }
  }
  if (drafted.length) {
    const q = w.draftQuality > 0.7 ? "generazionale" : w.draftQuality > 0.4 ? "solido" : "opaco";
    pushEvent(
      w,
      "draft",
      voiceOf(s, [
        `Classe $Q al draft: $WHO.`,
        `Al draft, classe $Q — $WHO.`,
        `Chiamati al draft ($Q): $WHO.`,
      ], { Q: q, WHO: drafted.join(", ") }),
    );
  }

  const live = w.stars.filter((p) => !p.retired && p.teamAbbr !== s.team.abbr);
  const nTrades = randInt(SIM.world.tradesPerYear.min, SIM.world.tradesPerYear.max);
  for (let i = 0; i < nTrades; i++) {
    const a = pick(live);
    const bPool = live.filter((p) => p.teamAbbr !== a.teamAbbr);
    if (!bPool.length) continue;
    const ta = w.teams[a.teamAbbr];
    if (!ta) continue;
    let bestB = bPool[0]!;
    let bestSc = -1e9;
    for (const cand of bPool) {
      const tbCand = w.teams[cand.teamAbbr];
      if (!tbCand) continue;
      const taGain = starAmbitionFit(cand, ta.ambition) - starAmbitionFit(a, ta.ambition);
      const tbGain = starAmbitionFit(a, tbCand.ambition) - starAmbitionFit(cand, tbCand.ambition);
      const gap = Math.abs(a.overall - cand.overall);
      const sc = taGain + tbGain - (gap > 14 ? 6 : 0) + gaussian(0, 1.1);
      if (sc > bestSc) {
        bestSc = sc;
        bestB = cand;
      }
    }
    const b = bestB;
    const tb = w.teams[b.teamAbbr];
    if (!tb) continue;
    if (bestSc < 0) {
      /* random-vs-random: championship vuole 28+, rebuild vuole <=24 */
      const champKid =
        (ta.ambition === "championship" && b.age < 28) ||
        (tb.ambition === "championship" && a.age < 28);
      const rebuildVet =
        (ta.ambition === "rebuild" && b.age > 24) ||
        (tb.ambition === "rebuild" && a.age > 24);
      if (champKid || rebuildVet) continue;
      if (chance(0.72)) continue;
    }
    if (Math.abs(a.overall - b.overall) > 14 && chance(0.7)) continue;
    const from = a.teamAbbr;
    const to = b.teamAbbr;
    a.teamAbbr = to;
    b.teamAbbr = from;
    pushEvent(
      w,
      "trade",
      voiceOf(s, tradeCopyPool(a, b, ta, tb), {
        A: a.name,
        B: b.name,
        PTS: a.ppg.toFixed(1),
        TO: to,
        FROM: from,
        GOAL: labelAmbition(tb.ambition),
        NEED: labelAmbition(ta.ambition),
        YA: String(a.age),
        YB: String(b.age),
      }),
    );
    ta.chemistry = clamp(ta.chemistry + randInt(-8, 4), 28, 90);
    tb.chemistry = clamp(tb.chemistry + randInt(-8, 4), 28, 90);
  }

  const nFa = randInt(SIM.world.faMovesPerYear.min, SIM.world.faMovesPerYear.max);
  const market = NBA_TEAMS.filter((t) => t.abbr !== s.team.abbr).map((t) => t.abbr);
  const free = live.filter((p) => p.overall >= 74);
  for (let i = 0; i < nFa && free.length && market.length; i++) {
    const p = free.splice(randInt(0, free.length - 1), 1)[0]!;
    const fromT = w.teams[p.teamAbbr];
    if (fromT) {
      const keepYouth = (fromT.ambition === "rebuild" || fromT.ambition === "development") && p.age <= 24;
      const keepVet = (fromT.ambition === "contender" || fromT.ambition === "championship") && p.age >= 28 && p.overall >= 82;
      if (keepYouth && chance(0.72)) continue;
      if (keepVet && chance(0.62)) continue;
    }
    const destCands = market.filter((abbr) => abbr !== p.teamAbbr).map((abbr) => ({ abbr }));
    if (!destCands.length) continue;
    const dest = pickDestByAmbition(w, destCands, p);
    if (dest === p.teamAbbr) continue;
    const destAmb = w.teams[dest]?.ambition ?? "competitive";
    if (starAmbitionFit(p, destAmb) < 0 && chance(0.78)) continue;
    const from = p.teamAbbr;
    const destStar = liveStar(w, dest);
    p.teamAbbr = dest;
    if (destStar) destStar.teamAbbr = from;
    pushEvent(
      w,
      "fa",
      voiceOf(s, faCopyPool(p), {
        NAME: p.name,
        DEST: dest,
        FROM: from,
        GOAL: labelAmbition(destAmb),
        AGE: String(p.age),
      }),
    );
  }

  tickBench(w, s);

  ensureOneStarPerTeam(w, s);
  occupyTeamSlot(s);

  for (const t of [...NBA_TEAMS, ...EURO_TEAMS]) {
    const star = liveStar(w, t.abbr);
    const base = s.teamPower[t.abbr] ?? t.power;
    const mean = 70;
    const revert = (mean - base) * 0.07;
    const face = t.abbr === s.team.abbr ? s.overall : star?.overall ?? 70;
    const starPull = (face - 78) * 0.22;
    const noise = gaussian(0, 2.4);
    s.teamPower[t.abbr] = clamp(base + revert + starPull + noise, 42, 96);
    const wt = w.teams[t.abbr];
    if (wt) {
      wt.ambition = ambitionFromPower(s.teamPower[t.abbr]!);
      wt.health = clamp(wt.health + randInt(-6, 6), 40, 95);
      const age = t.abbr === s.team.abbr ? s.age : (star?.age ?? 27);
      wt.experience = clamp((wt.experience + age * 2) / 2, 30, 90);
    }
  }

  const p = s.teamPower[s.team.abbr] ?? s.team.power;
  s.team = cloneTeam(s.team, p);

  const titles = (s.championLog ?? []).filter((c) => c.league === "NBA");
  const last3 = titles.slice(-3);
  if (last3.length === 3 && last3.every((c) => c.teamAbbr === last3[0]!.teamAbbr)) {
    const name = last3[0]!.team;
    if (!w.events.some((e) => e.kind === "dynasty" && e.text.includes(name))) {
      pushEvent(
        w,
        "dynasty",
        voiceOf(s, COPY_DYNASTY, { NAME: name, STAR: last3[0]!.star || name }),
      );
    }
  }
  pruneWorld(w);
}

export function starOf(s: PlayerState, abbr: string, fallback: string) {
  if (s.team.abbr === abbr) return s.name;
  const star = liveStar(s.world, abbr);
  return star?.name ?? fallback;
}

const ZERO_ID = { pace: 0, ppg: 0, opp: 0, rpg: 0, apg: 0, starPpg: 0 };

export function identityModOf(id?: TeamIdentity) {
  if (!id) return ZERO_ID;
  return IDENTITY_MOD[id] ?? ZERO_ID;
}

export function labelIdentity(id: TeamIdentity): string {
  const map: Record<TeamIdentity, string> = {
    pace: "ritmo alto",
    halfCourt: "metà campo",
    threePoint: "tiro da tre",
    isolation: "isolamento",
    ballMovement: "movimento di palla",
    defense: "difesa",
    physical: "fisicità",
    development: "crescita",
    veteran: "veterani",
  };
  return map[id];
}

export function labelAmbition(a: TeamAmbition): string {
  const map: Record<TeamAmbition, string> = {
    rebuild: "ricostruzione",
    development: "sviluppo",
    competitive: "playoff",
    contender: "contendere",
    championship: "titolo",
  };
  return map[a];
}

export function offerFit(s: PlayerState, abbr: string): number {
  const wt = s.world?.teams[abbr];
  const power = s.teamPower[abbr] ?? 70;
  let score = s.overall * 0.6 + (100 - Math.abs(power - s.overall)) * 0.2;
  if (!wt) return score;
  if (wt.ambition === "championship" && s.overall >= 82) score += 14;
  if (wt.ambition === "contender" && s.overall >= 78) score += 8;
  if (wt.ambition === "rebuild" && s.age <= 24) score += 12;
  if (wt.ambition === "rebuild" && s.age >= 30) score -= 10;
  if (wt.ambition === "development" && s.age <= 25) score += 6;
  score -= Math.max(0, s.age - 32) * 2.2;
  score -= s.hidden.ego * 0.04;
  score += s.hidden.chemistry * 0.03;
  if (wt.identity === "threePoint") score += (s.attrs.shooting - 50) * 0.12;
  if (wt.identity === "defense") score += (s.attrs.defense - 50) * 0.12;
  if (wt.identity === "ballMovement") score += (s.attrs.passing - 50) * 0.1;
  if (wt.identity === "isolation") score += (s.attrs.handle - 50) * 0.1;
  if (wt.identity === "physical") score += (s.attrs.strength - 50) * 0.08;
  if (wt.identity === "pace") score += (s.attrs.athleticism - 50) * 0.08;
  return score;
}

/** Quanto il sistema della squadra ti alimenta (moltiplicatore piccolo sulle medie). */
export function identityFit(s: PlayerState): { ppg: number; rpg: number; apg: number; min: number } {
  const id = s.world?.teams[s.team.abbr]?.identity;
  const out = { ppg: 1, rpg: 1, apg: 1, min: 1 };
  if (!id) return out;
  const a = s.attrs;
  if (id === "threePoint" && a.shooting >= 54) out.ppg += 0.06;
  else if (id === "threePoint" && a.shooting < 42) out.ppg -= 0.05;
  if (id === "isolation" && a.handle >= 54) out.ppg += 0.05;
  if (id === "pace" && a.athleticism >= 54) {
    out.ppg += 0.035;
    out.min += 0.025;
  } else if (id === "pace" && a.athleticism < 42) {
    out.min -= 0.03;
  }
  if (id === "ballMovement" && a.passing >= 54) out.apg += 0.08;
  if (id === "physical" && a.strength >= 54) out.rpg += 0.07;
  if (id === "defense" && a.defense >= 54) out.min += 0.04;
  else if (id === "defense" && a.defense < 42) out.min -= 0.04;
  if (id === "halfCourt" && a.iq >= 54) out.apg += 0.035;
  if (id === "development" && s.age <= 23) out.min += 0.045;
  if (id === "veteran" && s.age >= 30) out.min += 0.025;
  if (id === "isolation" && a.passing < 45) out.apg -= 0.05;
  return out;
}

export function mvpScore(
  production: number,
  wins: number,
  efficiency: number,
  impact: number,
  gp: number,
  games: number,
  consistency: number,
  narrative: number,
) {
  const a = SIM.awards;
  const avail = (gp / Math.max(1, games)) * 100;
  return (
    production * a.production +
    wins * a.teamSuccess +
    efficiency * a.efficiency +
    impact * a.impact +
    avail * a.availability +
    consistency * a.consistency +
    narrative * a.narrative
  );
}
