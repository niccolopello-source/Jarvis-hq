
import { EXTRA_STORY } from "./story-extra";
import { FEEL_STORY } from "./story-feel";
import { pick } from "./rng";
import type {
  AttrKey,
  DraftCard,
  Nationality,
  OffseasonFocus,
  PlayerState,
  Role,
  StoryEvent,
} from "./types";

export { EURO_TEAMS, NBA_TEAMS } from "./teams";

export const ATTR_LABELS: Record<AttrKey, string> = {
  shooting: "Tiro",
  handle: "Palleggio",
  passing: "Passaggio",
  defense: "Difesa",
  rebounding: "Rimbalzo",
  athleticism: "Atletismo",
  strength: "Fisico",
  iq: "IQ cestistico",
};

export const HIDDEN_LABELS = {
  clutch: "Clutch",
  durability: "Tenuta",
  workEthic: "Etica del lavoro",
  ego: "Ego",
  chemistry: "Chimica",
  consistency: "Costanza",
  motor: "Motore",
  mediaSavvy: "Media",
} as const;

export const ROLES: Record<
  Role,
  {
    label: string;
    weights: Record<AttrKey, number>;
    scoreF: number;
    reboundF: number;
    passF: number;
    stlF: number;
    blkF: number;
  }
> = {
  PG: {
    label: "Playmaker",
    weights: {
      shooting: 0.14,
      handle: 0.2,
      passing: 0.24,
      defense: 0.1,
      rebounding: 0.03,
      athleticism: 0.1,
      strength: 0.04,
      iq: 0.15,
    },
    scoreF: 0.88,
    reboundF: 0.52,
    passF: 1.52,
    stlF: 1.15,
    blkF: 0.35,
  },
  SG: {
    label: "Guardia",
    weights: {
      shooting: 0.24,
      handle: 0.14,
      passing: 0.1,
      defense: 0.14,
      rebounding: 0.05,
      athleticism: 0.16,
      strength: 0.06,
      iq: 0.11,
    },
    scoreF: 1.12,
    reboundF: 0.62,
    passF: 0.88,
    stlF: 1.05,
    blkF: 0.45,
  },
  SF: {
    label: "Ala piccola",
    weights: {
      shooting: 0.16,
      handle: 0.12,
      passing: 0.1,
      defense: 0.15,
      rebounding: 0.08,
      athleticism: 0.18,
      strength: 0.1,
      iq: 0.11,
    },
    scoreF: 1.02,
    reboundF: 0.82,
    passF: 0.9,
    stlF: 1.0,
    blkF: 0.7,
  },
  PF: {
    label: "Ala forte",
    weights: {
      shooting: 0.11,
      handle: 0.05,
      passing: 0.06,
      defense: 0.15,
      rebounding: 0.22,
      athleticism: 0.13,
      strength: 0.18,
      iq: 0.1,
    },
    scoreF: 0.92,
    reboundF: 1.28,
    passF: 0.62,
    stlF: 0.7,
    blkF: 1.1,
  },
  C: {
    label: "Centro",
    weights: {
      shooting: 0.06,
      handle: 0.03,
      passing: 0.04,
      defense: 0.18,
      rebounding: 0.26,
      athleticism: 0.12,
      strength: 0.21,
      iq: 0.1,
    },
    scoreF: 0.78,
    reboundF: 1.62,
    passF: 0.5,
    stlF: 0.55,
    blkF: 1.35,
  },
};

export function roleGroup(role: Role) {
  return role === "PG" || role === "SG" ? "guard" : role === "SF" ? "wing" : "big";
}

export const NATIONALITIES: Nationality[] = [
  { id: "Italia", label: "Italia", region: "Europa" },
  { id: "Spagna", label: "Spagna", region: "Europa" },
  { id: "Francia", label: "Francia", region: "Europa" },
  { id: "Serbia", label: "Serbia", region: "Europa" },
  { id: "Grecia", label: "Grecia", region: "Europa" },
  { id: "Lituania", label: "Lituania", region: "Europa" },
  { id: "Germania", label: "Germania", region: "Europa" },
  { id: "Slovenia", label: "Slovenia", region: "Europa" },
  { id: "Croazia", label: "Croazia", region: "Europa" },
  { id: "Turchia", label: "Turchia", region: "Europa" },
  { id: "Lettonia", label: "Lettonia", region: "Europa" },
  { id: "Georgia", label: "Georgia", region: "Europa" },
  { id: "USA", label: "USA", region: "Americhe" },
  { id: "Canada", label: "Canada", region: "Americhe" },
  { id: "Brasile", label: "Brasile", region: "Americhe" },
  { id: "Argentina", label: "Argentina", region: "Americhe" },
  { id: "Australia", label: "Australia", region: "Mondo" },
  { id: "Nigeria", label: "Nigeria", region: "Mondo" },
];

export const RIVAL_NAMES = [
  "Devon Marsh",
  "Kalen Ibe",
  "Tomas Vukovic",
  "Andre Kellerman",
  "Riko Tanaka",
  "Elijah Voss",
  "Mateo Ruiz",
  "Nico Halvorsen",
];
export const COACH_NAMES = [
  "Coach Ferretti",
  "Coach Whitfield",
  "Coach Delgado",
  "Coach Okafor",
  "Coach Lindqvist",
  "Coach Brennan",
];

export const NAT_ADJECTIVE: Record<string, string> = {
  Italia: "italiana",
  Spagna: "spagnola",
  Francia: "francese",
  Serbia: "serba",
  Grecia: "greca",
  Lituania: "lituana",
  Germania: "tedesca",
  Slovenia: "slovena",
  Croazia: "croata",
  Turchia: "turca",
  Lettonia: "lettone",
  Georgia: "georgiana",
  USA: "statunitense",
  Canada: "canadese",
  Brasile: "brasiliana",
  Argentina: "argentina",
  Australia: "australiana",
  Nigeria: "nigeriana",
};

/** Concordanza di genere con il ruolo: guardia/ala al femminile, play/centro al maschile. */
export function natAdj(role: Role, nationality: string) {
  const fem = NAT_ADJECTIVE[nationality] || nationality.toLowerCase();
  if (role === "SG" || role === "SF" || role === "PF") return fem;
  if (fem.endsWith("ese") || fem.endsWith("nte") || fem.endsWith("one")) return fem;
  if (fem.endsWith("a")) return fem.slice(0, -1) + "o";
  return fem;
}

export const NBA_ROUNDS = [
  "Primo turno",
  "Semifinali Est/Ovest",
  "Finali Est/Ovest",
  "Finali NBA",
];
export const EURO_ROUNDS = ["Playoff", "Final Four", "Finale Eurolega"];

/** Stagione regolare e tabellone: NBA 82, Eurolega 34, seed playoff 1–8. */
export const NBA_GAMES = 82;
export const EURO_GAMES = 34;
export const PLAYOFF_SEEDS = 8;

export function confIt(c?: string) {
  if (c === "East") return "Est";
  if (c === "West") return "Ovest";
  if (c === "Euro") return "Eurolega";
  return "";
}

/** Etichette premio per lo schermo. Gli id restano inglesi nel motore. */
const AWARD_IT: Record<string, string> = {
  "Rookie of the Year": "Matricola dell'anno",
  ROY: "Matricola dell'anno",
  DPOY: "Difensore dell'anno",
  FMVP: "MVP delle Finals",
  "Finals MVP": "MVP delle Finals",
  MIP: "Giocatore più migliorato",
  "Most Improved Player": "Giocatore più migliorato",
  "6MOY": "Sesto uomo",
  "Sixth Man": "Sesto uomo",
  "All-NBA First Team": "Primo quintetto",
  "All-NBA Second Team": "Secondo quintetto",
  "All-NBA Third Team": "Terzo quintetto",
  "NBA Champion": "Campione NBA",
  "EuroLeague Champion": "Campione Eurolega",
};

export function awardIt(label: string) {
  if (AWARD_IT[label]) return AWARD_IT[label]!;
  if (label.startsWith("All-NBA")) return label.replace("All-NBA", "Quintetto");
  return label;
}

/** Note premio: niente sigle inglesi a schermo. */
export function awardNoteIt(note: string) {
  return String(note || "")
    .replace(/\bSTL\b/g, "palle rubate")
    .replace(/\bBLK\b/g, "stoppate")
    .replace(/\bPPG\b/g, "punti")
    .replace(/\bRPG\b/g, "rimbalzi")
    .replace(/\bAPG\b/g, "assist");
}

export const DRAFT_ROUNDS: {
  key: AttrKey;
  label: string;
  prompt: string;
  cards: DraftCard[];
}[] = [
  {
    key: "shooting",
    label: "Tiro",
    prompt: "Come vuoi segnare i tuoi punti?",
    cards: [
      {
        name: "Il Cecchino",
        desc: "Tiro implacabile dal perimetro; in difesa lasci qualche scopertura.",
        primary: { key: "shooting", delta: 14 },
        secondary: [{ key: "defense", delta: -3 }],
        hidden: { clutch: 6, consistency: 4, chemistry: -2 },
      },
      {
        name: "La Guardia Completa",
        desc: "Tiro solido unito a una mente lucida in campo.",
        primary: { key: "shooting", delta: 9 },
        secondary: [{ key: "iq", delta: 4 }],
        hidden: { consistency: 5, clutch: 2 },
      },
      {
        name: "Il Tiratore Dinamico",
        desc: "Meno preciso, ma rapido nel palleggio e nel salto.",
        primary: { key: "shooting", delta: 5 },
        secondary: [
          { key: "athleticism", delta: 3 },
          { key: "handle", delta: 3 },
        ],
        hidden: { motor: 5, consistency: -2 },
      },
      {
        name: "Il tiratore da ricezione",
        desc: "Tiri puliti, senza palleggiare. Dipendi da chi ti trova.",
        primary: { key: "shooting", delta: 10 },
        secondary: [
          { key: "iq", delta: 2 },
          { key: "passing", delta: -1 },
        ],
        hidden: { chemistry: 5, clutch: 3, ego: -2 },
      },
    ],
  },
  {
    key: "handle",
    label: "Palleggio",
    prompt: "Che rapporto hai con il pallone in mano?",
    cards: [
      {
        name: "Il Funambolo",
        desc: "Palleggio ipnotico, ma gioca spesso da solo.",
        primary: { key: "handle", delta: 14 },
        secondary: [{ key: "passing", delta: -3 }],
        hidden: { ego: 8, chemistry: -4, clutch: 3 },
      },
      {
        name: "Il Playmaker Nato",
        desc: "Controllo di palla e visione di gioco crescono insieme.",
        primary: { key: "handle", delta: 9 },
        secondary: [{ key: "passing", delta: 4 }],
        hidden: { chemistry: 6, ego: -2 },
      },
      {
        name: "Il Tuttofare di Palla",
        desc: "Meno spettacolare, ma utile in più situazioni.",
        primary: { key: "handle", delta: 5 },
        secondary: [
          { key: "iq", delta: 3 },
          { key: "athleticism", delta: 3 },
        ],
        hidden: { consistency: 4, workEthic: 3 },
      },
      {
        name: "Il Ritmo Controllato",
        desc: "Palla bassa, testa alta. Meno spettacolo, più possessi puliti.",
        primary: { key: "handle", delta: 8 },
        secondary: [
          { key: "passing", delta: 3 },
          { key: "iq", delta: 2 },
        ],
        hidden: { chemistry: 4, ego: -3, consistency: 3 },
      },
    ],
  },
  {
    key: "passing",
    label: "Passaggio",
    prompt: "Come fai rendere meglio i tuoi compagni?",
    cards: [
      {
        name: "Il Regista Puro",
        desc: "Visione di gioco superiore, ma trascura la palestra.",
        primary: { key: "passing", delta: 14 },
        secondary: [{ key: "strength", delta: -3 }],
        hidden: { chemistry: 7, durability: -3 },
      },
      {
        name: "La Mente Lucida",
        desc: "Passaggi precisi guidati da una grande lettura del gioco.",
        primary: { key: "passing", delta: 9 },
        secondary: [{ key: "iq", delta: 4 }],
        hidden: { clutch: 4, consistency: 3 },
      },
      {
        name: "Il Facilitatore",
        desc: "Crea spazi anche con palleggio e tiro.",
        primary: { key: "passing", delta: 5 },
        secondary: [
          { key: "handle", delta: 3 },
          { key: "shooting", delta: 3 },
        ],
        hidden: { chemistry: 4 },
      },
      {
        name: "Il Passaggio in Corsa",
        desc: "Assist in transizione. Il gioco si allarga quando corri.",
        primary: { key: "passing", delta: 8 },
        secondary: [
          { key: "athleticism", delta: 3 },
          { key: "handle", delta: 2 },
        ],
        hidden: { motor: 4, chemistry: 3 },
      },
    ],
  },
  {
    key: "defense",
    label: "Difesa",
    prompt: "Come fermi i tuoi avversari?",
    cards: [
      {
        name: "Il Muro",
        desc: "Difensore implacabile, ma il tiro ne risente.",
        primary: { key: "defense", delta: 14 },
        secondary: [{ key: "shooting", delta: -3 }],
        hidden: { motor: 6, ego: 3 },
      },
      {
        name: "Lo Stopper Intelligente",
        desc: "Legge le giocate avversarie prima che accadano.",
        primary: { key: "defense", delta: 9 },
        secondary: [{ key: "iq", delta: 4 }],
        hidden: { clutch: 3, chemistry: 3 },
      },
      {
        name: "La Presenza Fisica",
        desc: "Difende con corpo e posizione più che con reattività.",
        primary: { key: "defense", delta: 5 },
        secondary: [
          { key: "strength", delta: 3 },
          { key: "rebounding", delta: 3 },
        ],
        hidden: { durability: 4 },
      },
      {
        name: "Il Ladruncolo",
        desc: "Mani veloci, raddoppi, palle rubate. Qualche fallo di troppo.",
        primary: { key: "defense", delta: 8 },
        secondary: [
          { key: "athleticism", delta: 3 },
          { key: "handle", delta: 2 },
        ],
        hidden: { motor: 5, consistency: -2 },
      },
    ],
  },
  {
    key: "rebounding",
    label: "Rimbalzo",
    prompt: "Come domini il vetro?",
    cards: [
      {
        name: "Il Dominatore del Vetro",
        desc: "Rimbalzista nato, ma poco a suo agio palla in mano.",
        primary: { key: "rebounding", delta: 14 },
        secondary: [{ key: "handle", delta: -3 }],
        hidden: { motor: 5, consistency: 3 },
      },
      {
        name: "Il Lottatore",
        desc: "Combatte ogni rimbalzo con forza pura.",
        primary: { key: "rebounding", delta: 9 },
        secondary: [{ key: "strength", delta: 4 }],
        hidden: { workEthic: 6, durability: -2 },
      },
      {
        name: "Il Rimbalzista Mobile",
        desc: "Copre più campo grazie all'atletismo.",
        primary: { key: "rebounding", delta: 5 },
        secondary: [
          { key: "athleticism", delta: 3 },
          { key: "defense", delta: 3 },
        ],
        hidden: { motor: 4 },
      },
      {
        name: "Il Box-out Silenzioso",
        desc: "Posizione prima del salto. I rimbalzi arrivano senza rumore.",
        primary: { key: "rebounding", delta: 8 },
        secondary: [
          { key: "iq", delta: 3 },
          { key: "strength", delta: 2 },
        ],
        hidden: { consistency: 4, workEthic: 3 },
      },
    ],
  },
  {
    key: "athleticism",
    label: "Atletismo",
    prompt: "Qual è la tua arma fisica migliore?",
    cards: [
      {
        name: "Lo Schiacciatore",
        desc: "Esplosività pura, ma a volte gioca d'istinto.",
        primary: { key: "athleticism", delta: 14 },
        secondary: [{ key: "iq", delta: -3 }],
        hidden: { motor: 7, consistency: -4, clutch: 2 },
      },
      {
        name: "L'Atleta Puro",
        desc: "Un fisico costruito per reggere ogni scontro.",
        primary: { key: "athleticism", delta: 9 },
        secondary: [{ key: "strength", delta: 4 }],
        hidden: { durability: 5, workEthic: 3 },
      },
      {
        name: "Il Volo Silenzioso",
        desc: "Usa l'atletismo al servizio di tiro e difesa.",
        primary: { key: "athleticism", delta: 5 },
        secondary: [
          { key: "shooting", delta: 3 },
          { key: "defense", delta: 3 },
        ],
        hidden: { consistency: 3 },
      },
      {
        name: "Il Primo Passo",
        desc: "Lo scatto sul palleggio. Arrivi dove gli altri pensano.",
        primary: { key: "athleticism", delta: 8 },
        secondary: [
          { key: "handle", delta: 3 },
          { key: "shooting", delta: 2 },
        ],
        hidden: { motor: 4, clutch: 2 },
      },
    ],
  },
  {
    key: "strength",
    label: "Fisico",
    prompt: "Come reggi il contatto sotto canestro?",
    cards: [
      {
        name: "Il Bisonte",
        desc: "Forza bruta, ma perde un po' di esplosività.",
        primary: { key: "strength", delta: 14 },
        secondary: [{ key: "athleticism", delta: -3 }],
        hidden: { durability: 6, motor: -3 },
      },
      {
        name: "Il Combattente",
        desc: "Forza messa al servizio della lotta a rimbalzo.",
        primary: { key: "strength", delta: 9 },
        secondary: [{ key: "rebounding", delta: 4 }],
        hidden: { workEthic: 5 },
      },
      {
        name: "La Roccia Flessibile",
        desc: "Fisico equilibrato tra difesa e rimbalzo.",
        primary: { key: "strength", delta: 5 },
        secondary: [
          { key: "defense", delta: 3 },
          { key: "rebounding", delta: 3 },
        ],
        hidden: { durability: 4, consistency: 2 },
      },
      {
        name: "Il Pivot Basso",
        desc: "Spalle al canestro, piede perno, contatto continuo.",
        primary: { key: "strength", delta: 8 },
        secondary: [
          { key: "handle", delta: 2 },
          { key: "iq", delta: 3 },
        ],
        hidden: { consistency: 3, chemistry: 2 },
      },
    ],
  },
  {
    key: "iq",
    label: "IQ Cestistico",
    prompt: "Cosa ti rende un giocatore intelligente?",
    cards: [
      {
        name: "Il Professore",
        desc: "Legge il gioco come nessun altro, ma trascura la palestra.",
        primary: { key: "iq", delta: 14 },
        secondary: [{ key: "strength", delta: -3 }],
        hidden: { clutch: 6, mediaSavvy: 4, motor: -2 },
      },
      {
        name: "La Mente della Squadra",
        desc: "Intelligenza cestistica al servizio dei compagni.",
        primary: { key: "iq", delta: 9 },
        secondary: [{ key: "passing", delta: 4 }],
        hidden: { chemistry: 7, ego: -4 },
      },
      {
        name: "Il Veterano Precoce",
        desc: "Esperienza applicata a tiro e difesa.",
        primary: { key: "iq", delta: 5 },
        secondary: [
          { key: "shooting", delta: 3 },
          { key: "defense", delta: 3 },
        ],
        hidden: { consistency: 5, clutch: 3 },
      },
      {
        name: "L'Anticipo",
        desc: "Leggi la linea di passaggio un secondo prima. Poi rubi o chiudi.",
        primary: { key: "iq", delta: 8 },
        secondary: [
          { key: "defense", delta: 3 },
          { key: "handle", delta: 2 },
        ],
        hidden: { clutch: 4, motor: 2 },
      },
    ],
  },
];

export const OFFSEASON_FOCUSES: OffseasonFocus[] = [
  {
    id: "shooting",
    label: "Mille tiri al giorno",
    desc: "Ripeti il gesto finché diventa automatico.",
    gains: [
      { key: "shooting", base: 3.6 },
      { key: "iq", base: 0.8 },
    ],
    hidden: { consistency: 2 },
    injury: 2,
    development: 0.7,
    roles: ["PG", "SG", "SF"],
  },
  {
    id: "handle",
    label: "Laboratorio di palleggio",
    desc: "Due palle, specchio, uscite strette.",
    gains: [
      { key: "handle", base: 3.6 },
      { key: "passing", base: 0.8 },
    ],
    hidden: { motor: 1 },
    injury: 1,
    development: 0.55,
    roles: ["PG", "SG", "SF"],
  },
  {
    id: "passing",
    label: "Film e visione di gioco",
    desc: "Ore di video per anticipare la seconda linea.",
    gains: [
      { key: "passing", base: 3.4 },
      { key: "iq", base: 1.6 },
    ],
    hidden: { chemistry: 3 },
    injury: 0,
    development: 0.6,
    roles: ["PG", "SG", "SF", "PF"],
  },
  {
    id: "defense",
    label: "Campo di difesa",
    desc: "Slide, mano attiva, comunicazioni.",
    gains: [
      { key: "defense", base: 3.6 },
      { key: "iq", base: 0.8 },
    ],
    hidden: { motor: 2 },
    injury: 2,
    development: 0.55,
    roles: ["SG", "SF", "PF", "C"],
  },
  {
    id: "rebounding",
    label: "Guerra a rimbalzo",
    desc: "Box-out, tempismo, secondo salto.",
    gains: [
      { key: "rebounding", base: 3.6 },
      { key: "strength", base: 0.9 },
    ],
    hidden: { workEthic: 2 },
    injury: 3,
    development: 0.5,
    roles: ["SF", "PF", "C"],
  },
  {
    id: "athleticism",
    label: "Pliometria e primo passo",
    desc: "Esplosività pura. Il corpo paga il conto.",
    gains: [
      { key: "athleticism", base: 3.8 },
      { key: "handle", base: 0.6 },
    ],
    hidden: { motor: 3, durability: -1 },
    injury: 5,
    development: 0.65,
    roles: ["PG", "SG", "SF", "PF"],
  },
  {
    id: "strength",
    label: "Sala pesi",
    desc: "Massa utile per il contatto.",
    gains: [
      { key: "strength", base: 3.6 },
      { key: "rebounding", base: 0.8 },
    ],
    hidden: { durability: 2 },
    injury: 2,
    development: 0.45,
    roles: ["SF", "PF", "C"],
  },
  {
    id: "iq",
    label: "Studio con lo staff",
    desc: "Schemi, scouting, letture pre-possesso.",
    gains: [
      { key: "iq", base: 3.5 },
      { key: "passing", base: 0.9 },
    ],
    hidden: { clutch: 2, chemistry: 1 },
    injury: 0,
    development: 0.7,
    roles: ["PG", "SG", "SF", "PF", "C"],
  },
  {
    id: "two-way",
    label: "Lavoro two-way",
    desc: "Tiro in uscita e chiusura sul perimetro, stesso pomeriggio.",
    gains: [
      { key: "shooting", base: 2.1 },
      { key: "defense", base: 2.1 },
    ],
    hidden: { workEthic: 3 },
    injury: 2,
    development: 0.8,
    roles: ["SG", "SF"],
  },
  {
    id: "clutch",
    label: "Possessi al buio",
    desc: "Ripeti gli ultimi otto secondi finché il polso non trema più.",
    gains: [
      { key: "shooting", base: 1.6 },
      { key: "iq", base: 1.4 },
    ],
    hidden: { clutch: 6, ego: 2 },
    injury: 1,
    development: 0.5,
    roles: ["PG", "SG", "SF", "PF", "C"],
  },
  {
    id: "recovery",
    label: "Recupero e prevenzione",
    desc: "Meno carico, più anni davanti.",
    gains: [
      { key: "iq", base: 0.8 },
      { key: "strength", base: 0.6 },
    ],
    hidden: { durability: 5, motor: -1 },
    injury: -12,
    development: 0.15,
    roles: ["PG", "SG", "SF", "PF", "C"],
  },
];

export const STORY_EVENTS: StoryEvent[] = [
  {
    id: "rk1",
    phase: "rookie",
    title: "Il primo scontro con un veterano",
    subtitle: "Un giocatore esperto ti mette alla prova nel primo allenamento.",
    choices: [
      {
        label: "Rispondi con rispetto",
        detail: "Impari, non attacchi.",
        fx: () => ({
          coachTrust: 6,
          hidden: { chemistry: 4, ego: -3 },
          attrs: { iq: 0.6 },
          flavor: "Il tuo atteggiamento non passa inosservato allo staff.",
        }),
      },
      {
        label: "Ti fai valere subito",
        detail: "Vuoi minuti da subito.",
        fx: () => ({
          publicImage: 4,
          coachTrust: -4,
          flavor: "Fai rumore. Qualcuno nello spogliatoio storce il naso.",
        }),
      },
    ],
  },
  {
    id: "rk2",
    phase: "rookie",
    title: "La stampa ti etichetta già «il predestinato»",
    subtitle: "Le aspettative crescono più in fretta di te.",
    choices: [
      {
        label: "Abbassi le aspettative",
        detail: "Giochi con calma i riflettori.",
        fx: () => ({
          publicImage: 2,
          coachTrust: 4,
          attrs: { iq: 0.5, passing: 0.3 },
          hidden: { mediaSavvy: 4, consistency: 2 },
          flavor: "L'allenatore apprezza la testa sulle spalle.",
        }),
      },
      {
        label: "Accetti la pressione",
        detail: "Ti prendi la responsabilità.",
        fx: () => ({
          publicImage: 7,
          development: 0.4,
          form: 0.8,
          attrs: { shooting: 0.5, handle: 0.3 },
          hidden: { clutch: 3, ego: 3 },
          flavor: "Il pubblico inizia ad affezionarsi al tuo coraggio.",
        }),
      },
    ],
  },
  {
    id: "rk3",
    phase: "rookie",
    title: "Un fastidio ai polpacci ti fa saltare qualche allenamento",
    subtitle: "Niente di grave, ma va gestito.",
    choices: [
      {
        label: "Forzi il rientro",
        detail: "Non vuoi perdere minuti.",
        fx: () => ({
          injuryRisk: 9,
          form: 0.6,
          gamesPenalty: 2,
          attrs: { athleticism: 0.4, strength: -0.2 },
          hidden: { durability: -3, motor: 2 },
          flavor: "Torni prima. Il fisico prende nota.",
        }),
      },
      {
        label: "Segui i fisioterapisti",
        detail: "Meglio prevenire.",
        fx: () => ({
          injuryRisk: -5,
          attrs: { iq: 0.4, strength: 0.3 },
          hidden: { durability: 4, workEthic: 2 },
          flavor: "Costruisci abitudini che pagheranno più avanti.",
        }),
      },
    ],
  },
  {
    id: "rk4",
    phase: "rookie",
    title: "Battaglia per i minuti con un altro giovane",
    subtitle: "C'è un solo posto in rotazione che conta.",
    choices: [
      {
        label: "Arrivi primo in palestra",
        detail: "Etica prima della politica.",
        fx: () => ({
          coachTrust: 5,
          attrs: { athleticism: 0.5, iq: 0.4 },
          hidden: { workEthic: 6 },
          development: 0.35,
          flavor: "Lo staff inizia a fidarsi dei tuoi orari.",
        }),
      },
      {
        label: "Chiedi spiegazioni sul ruolo",
        detail: "Vuoi chiarezza, non silenzio.",
        fx: () => ({
          coachTrust: -2,
          form: 0.5,
          attrs: { shooting: 0.4, handle: 0.3 },
          hidden: { ego: 3, mediaSavvy: 2 },
          flavor: "Ottieni risposte. Non tutte ti piacciono.",
        }),
      },
    ],
  },
  {
    id: "pr1",
    phase: "prime",
    title: "Il tuo rivale ti supera in una classifica di riviste",
    subtitle: "__RIVAL__ è ovunque, in questi giorni.",
    choices: [
      {
        label: "Rispondi sul campo",
        detail: "Lasci parlare le partite.",
        fx: () => ({
          rivalry: 12,
          form: 1.4,
          development: 0.5,
          attrs: { shooting: 0.7, athleticism: 0.3 },
          hidden: { clutch: 3 },
          flavor: "Trasformi la classifica in benzina.",
        }),
      },
      {
        label: "Non gli dai peso",
        detail: "Zero polemiche.",
        fx: () => ({
          rivalry: 4,
          publicImage: 3,
          attrs: { iq: 0.5, passing: 0.3 },
          hidden: { mediaSavvy: 3, ego: -2 },
          flavor: "La tua calma viene letta come sicurezza.",
        }),
      },
    ],
  },
  {
    id: "pr2",
    phase: "prime",
    title: "L'allenatore ti chiede di sacrificare punti",
    subtitle: "__COACH__ vuole più equilibrio in squadra.",
    choices: [
      {
        label: "Accetti il sacrificio",
        detail: "Meno numeri, più squadra.",
        fx: () => ({
          coachTrust: 9,
          form: -0.8,
          hidden: { chemistry: 6, ego: -4 },
          attrs: { passing: 0.7, iq: 0.5 },
          flavor: "Il gruppo funziona meglio. Le tue medie no.",
        }),
      },
      {
        label: "Chiedi più libertà offensiva",
        detail: "Vuoi essere il riferimento.",
        fx: () => ({
          coachTrust: -6,
          form: 1.6,
          development: 0.45,
          hidden: { ego: 5, chemistry: -3 },
          flavor: "Ottieni più palloni. La fiducia dello staff cala.",
        }),
      },
    ],
  },
  {
    id: "pr3",
    phase: "prime",
    title: "Un compagno attraversa un momento difficile",
    subtitle: "Il rendimento della squadra ne risente.",
    choices: [
      {
        label: "Lo supporti pubblicamente",
        detail: "Ti esponi per lui.",
        fx: () => ({
          publicImage: 5,
          coachTrust: 4,
          attrs: { passing: 0.4, iq: 0.3 },
          hidden: { chemistry: 7, mediaSavvy: 2 },
          flavor: "Diventi un punto di riferimento anche fuori dal campo.",
        }),
      },
      {
        label: "Ti concentri solo sul tuo gioco",
        detail: "Non è compito tuo.",
        fx: () => ({
          form: 0.7,
          attrs: { shooting: 0.5, handle: 0.3 },
          hidden: { chemistry: -4, ego: 2 },
          flavor: "Resti concentrato. Qualcuno nota la distanza.",
        }),
      },
    ],
  },
  {
    id: "pr4",
    phase: "prime",
    title: "Una dichiarazione diventa virale per i motivi sbagliati",
    subtitle: "I social non perdonano.",
    choices: [
      {
        label: "Chiarisci in conferenza",
        detail: "Meglio di petto.",
        fx: () => ({
          publicImage: 5,
          attrs: { iq: 0.4 },
          hidden: { mediaSavvy: 5 },
          flavor: "La situazione si sgonfia in fretta.",
        }),
      },
      {
        label: "Lasci correre",
        detail: "Non alimenti la polemica.",
        fx: () => ({
          publicImage: -4,
          coachTrust: 3,
          attrs: { iq: 0.3 },
          hidden: { mediaSavvy: -2 },
          flavor: "Lo staff apprezza il basso profilo. Il pubblico un po' meno.",
        }),
      },
    ],
  },
  {
    id: "pr5",
    phase: "prime",
    title: "Dolore cronico al ginocchio",
    subtitle: "Niente di grave, ma fastidioso. Gestirlo farà la differenza.",
    choices: [
      {
        label: "Giochi ogni partita",
        detail: "Non vuoi saltare nulla.",
        fx: () => ({
          injuryRisk: 12,
          publicImage: 4,
          form: 0.4,
          gamesPenalty: 0,
          attrs: { athleticism: 0.3, strength: 0.2 },
          hidden: { durability: -5, motor: 2 },
          flavor: "I tifosi ti chiamano instancabile. Il fisico paga in silenzio.",
        }),
      },
      {
        label: "Accetti un turno di riposo",
        detail: "Pensi al lungo periodo.",
        fx: () => ({
          injuryRisk: -6,
          gamesPenalty: 6,
          attrs: { iq: 0.5, shooting: 0.25 },
          hidden: { durability: 4 },
          form: -0.3,
          flavor: "Una scelta poco spettacolare, ma saggia.",
        }),
      },
    ],
  },
  {
    id: "pr6",
    phase: "prime",
    title: "Il rivale ti provoca prima della sfida diretta",
    subtitle: "__RIVAL__ non le manda a dire.",
    choices: [
      {
        label: "Rispondi a tono",
        detail: "Alzi lo scontro.",
        fx: () => ({
          rivalry: 14,
          form: 1.1,
          attrs: { shooting: 0.5, athleticism: 0.3 },
          hidden: { ego: 4, clutch: 2 },
          flavor: "La rivalità infiamma i titoli.",
        }),
      },
      {
        label: "Ignori, parla il campo",
        detail: "Zero distrazioni.",
        fx: () => ({
          rivalry: 5,
          coachTrust: 4,
          attrs: { iq: 0.5, defense: 0.3 },
          hidden: { consistency: 3 },
          flavor: "La freddezza paga in spogliatoio.",
        }),
      },
    ],
  },
  {
    id: "pr7",
    phase: "prime",
    title: "Snobbato per l'All-Star",
    subtitle: "I numeri c'erano. La chiamata no.",
    choices: [
      {
        label: "Usalo come combustibile",
        detail: "Ogni allenamento ha un nome.",
        fx: () => ({
          form: 1.8,
          development: 0.6,
          attrs: { shooting: 0.6, athleticism: 0.4 },
          hidden: { workEthic: 4, ego: 2 },
          flavor: "Chiudi il telefono. Apri la palestra.",
        }),
      },
      {
        label: "Parli con i media del torto",
        detail: "Vuoi che si sappia.",
        fx: () => ({
          publicImage: 3,
          coachTrust: -3,
          attrs: { handle: 0.3 },
          hidden: { mediaSavvy: 3, chemistry: -2 },
          flavor: "Fai discutere. Non tutti sono dalla tua parte.",
        }),
      },
    ],
  },
  {
    id: "vt1",
    phase: "veteran",
    title: "I più giovani ti guardano come mentore",
    subtitle: "Il tuo ruolo in squadra sta cambiando.",
    choices: [
      {
        label: "Abbracci il ruolo di leader",
        detail: "Investi tempo sui più giovani.",
        fx: () => ({
          coachTrust: 8,
          publicImage: 5,
          hidden: { chemistry: 8, ego: -3 },
          attrs: { iq: 0.8, passing: 0.4 },
          flavor: "Diventi il punto fermo dello spogliatoio.",
        }),
      },
      {
        label: "Resti concentrato sul tuo gioco",
        detail: "Non è il momento di insegnare.",
        fx: () => ({
          form: 0.9,
          development: 0.3,
          attrs: { shooting: 0.5, handle: 0.3 },
          hidden: { chemistry: -3 },
          flavor: "Efficiente come sempre. Un po' più solo.",
        }),
      },
    ],
  },
  {
    id: "vt2",
    phase: "veteran",
    title: "Il fisico non risponde più come una volta",
    subtitle: "Gli anni si fanno sentire.",
    choices: [
      {
        label: "Adatti lo stile",
        detail: "Meno strappi, più lettura.",
        fx: () => ({
          injuryRisk: -7,
          attrs: { iq: 1.2, athleticism: -0.4, shooting: 0.6 },
          hidden: { consistency: 4, motor: -2 },
          development: 0.4,
          flavor: "Diventi più letale da fermo, meno spettacolare in transizione.",
        }),
      },
      {
        label: "Continui a spingere",
        detail: "Non cambi un gioco che ha funzionato.",
        fx: () => ({
          injuryRisk: 11,
          form: 0.5,
          attrs: { athleticism: 0.4, strength: -0.2 },
          hidden: { ego: 4, durability: -4 },
          flavor: "Il pubblico ama l'ostinazione. Il corpo un po' meno.",
        }),
      },
    ],
  },
  {
    id: "vt3",
    phase: "veteran",
    title: "Il rivale storico annuncia il ritiro",
    subtitle: "Un'era, quella con __RIVAL__, sta per chiudersi.",
    choices: [
      {
        label: "Parole di rispetto pubblico",
        detail: "Chiudi il cerchio con eleganza.",
        fx: () => ({
          publicImage: 9,
          attrs: { passing: 0.4, iq: 0.3 },
          hidden: { mediaSavvy: 5, ego: -3 },
          flavor: "Il gesto viene applaudito da tutta la lega.",
        }),
      },
      {
        label: "Resti in silenzio",
        detail: "La rivalità è stata solo sul campo.",
        fx: () => ({
          rivalry: -8,
          attrs: { shooting: 0.35, iq: 0.25 },
          hidden: { clutch: 2 },
          flavor: "Non tutti capiscono. Tu sai che è stato reale.",
        }),
      },
    ],
  },
  {
    id: "vt4",
    phase: "veteran",
    title: "Lo staff propone un ruolo ridotto",
    subtitle: "Meno minuti, più impatto a partita in corso.",
    choices: [
      {
        label: "Accetti il sesto uomo di lusso",
        detail: "Il bene della squadra.",
        fx: () => ({
          coachTrust: 7,
          form: -0.6,
          attrs: { shooting: 0.4, iq: 0.35 },
          hidden: { chemistry: 5, ego: -5 },
          flavor: "Esci dalla titolarità. Entri nelle partite che contano.",
        }),
      },
      {
        label: "Pretendi i minuti da titolare",
        detail: "Hai ancora qualcosa da dire.",
        fx: () => ({
          coachTrust: -6,
          form: 0.8,
          injuryRisk: 4,
          attrs: { athleticism: 0.35, handle: 0.3 },
          hidden: { ego: 5 },
          flavor: "Ottieni i minuti. Ogni possesso costa di più.",
        }),
      },
    ],
  },
  {
    id: "an1",
    phase: "any",
    title: "Uno sponsor ti propone un contratto ingombrante",
    subtitle: "Più soldi, più visibilità, meno tempo libero.",
    choices: [
      {
        label: "Accetti",
        detail: "Più visibilità mediatica.",
        fx: () => ({
          publicImage: 6,
          attrs: { handle: 0.25 },
          hidden: { mediaSavvy: 5, workEthic: -2 },
          flavor: "Il tuo volto inizia a comparire ovunque.",
        }),
      },
      {
        label: "Rifiuti",
        detail: "Vuoi restare concentrato sul campo.",
        fx: () => ({
          coachTrust: 3,
          attrs: { shooting: 0.4, iq: 0.3 },
          hidden: { workEthic: 3, mediaSavvy: -1 },
          development: 0.25,
          flavor: "Lo staff apprezza le priorità chiare.",
        }),
      },
    ],
  },
  {
    id: "an2",
    phase: "any",
    title: "Un giornalista ti fa una domanda scomoda sullo spogliatoio",
    subtitle: "Il rapporto con __COACH__ finisce sotto i riflettori.",
    choices: [
      {
        label: "Difendi l'allenatore",
        detail: "Fai quadrato.",
        fx: () => ({
          coachTrust: 7,
          publicImage: 2,
          attrs: { passing: 0.35, iq: 0.25 },
          hidden: { chemistry: 4 },
          flavor: "Il gruppo si compatta attorno a te.",
        }),
      },
      {
        label: "Eviti di esporti",
        detail: "Non è il momento.",
        fx: () => ({
          attrs: { iq: 0.3 },
          hidden: { mediaSavvy: 2 },
          flavor: "Una risposta diplomatica, presto dimenticata.",
        }),
      },
    ],
  },
  {
    id: "an3",
    phase: "any",
    title: "Piccolo infortunio alla caviglia in allenamento",
    subtitle: "Va gestito con attenzione.",
    choices: [
      {
        label: "Ti alleni a carico ridotto",
        detail: "Non vuoi fermarti.",
        fx: () => ({
          injuryRisk: 5,
          form: 0.3,
          attrs: { athleticism: 0.25 },
          hidden: { durability: -2 },
          flavor: "Tieni il ritmo, con un po' di rischio in più.",
        }),
      },
      {
        label: "Ti fermi qualche giorno",
        detail: "Meglio sicuri.",
        fx: () => ({
          injuryRisk: -5,
          gamesPenalty: 3,
          attrs: { iq: 0.3, strength: 0.2 },
          hidden: { durability: 3 },
          flavor: "Una pausa breve, utile più avanti.",
        }),
      },
    ],
  },
  {
    id: "an4",
    phase: "any",
    title: "Una vecchia intervista del rivale riemerge",
    subtitle: "Le parole di __RIVAL__ tornano di moda.",
    choices: [
      {
        label: "La usi come motivazione",
        detail: "Parole in benzina.",
        fx: () => ({
          rivalry: 7,
          form: 1,
          development: 0.25,
          attrs: { shooting: 0.4, athleticism: 0.25 },
          flavor: "Ogni allenamento ha un significato in più.",
        }),
      },
      {
        label: "Non gli dai importanza",
        detail: "Solo parole vecchie.",
        fx: () => ({
          rivalry: 1,
          attrs: { iq: 0.45, passing: 0.2 },
          hidden: { consistency: 2 },
          flavor: "Resti concentrato su cose più importanti.",
        }),
      },
    ],
  },
  {
    id: "an5",
    phase: "any",
    title: "La società esonera l'allenatore",
    subtitle: "__COACH__ lascia la panchina: la squadra volta pagina.",
    choices: [
      {
        label: "Accogli il cambiamento",
        detail: "Un nuovo inizio.",
        fx: (s) => {
          const pool = COACH_NAMES.filter((c) => c !== s.coachName);
          s.coachName = pick(pool);
          s.coachTrust = 52;
          return {
            form: 0.4,
            attrs: { athleticism: 0.35, handle: 0.25 },
            hidden: { chemistry: -2 },
            flavor: `Arriva ${s.coachName}: il rapporto di fiducia riparte da zero.`,
          };
        },
      },
      {
        label: "Rimpiangi il vecchio sistema",
        detail: "Fai più fatica ad adattarti.",
        fx: (s) => {
          const pool = COACH_NAMES.filter((c) => c !== s.coachName);
          s.coachName = pick(pool);
          s.coachTrust = 36;
          return {
            form: -0.8,
            development: -0.2,
            attrs: { iq: -0.2, shooting: 0.2 },
            flavor: `Con ${s.coachName} l'ambientamento è più lento del previsto.`,
          };
        },
      },
    ],
  },
  {
    id: "an6",
    phase: "any",
    title: "Notte in bianco prima di una gara in nazionale mediatica",
    subtitle: "Il corpo chiede sonno, la testa gira.",
    choices: [
      {
        label: "Chiudi tutto e dormi",
        detail: "Recupero prima della luce.",
        fx: () => ({
          form: 0.6,
          attrs: { iq: 0.35, shooting: 0.2 },
          hidden: { consistency: 2 },
          flavor: "Arrivi lucido. Poco contenuto per i social.",
        }),
      },
      {
        label: "Accetti l'evento e paghi dopo",
        detail: "Visibilità ora, gambe dopo.",
        fx: () => ({
          publicImage: 4,
          form: -0.7,
          attrs: { athleticism: -0.25, handle: 0.2 },
          hidden: { mediaSavvy: 3, motor: -2 },
          flavor: "Sei ovunque. In riscaldamento le gambe pesano.",
        }),
      },
    ],
  },
  {
    id: "rk5",
    phase: "rookie",
    title: "Il veterano della panchina ti prende da parte",
    subtitle: "Ti offre un consiglio che non tutti ricevono.",
    choices: [
      {
        label: "Ascolti e applichi",
        detail: "Angoli, tempi, dettagli da chi c'è già passato.",
        fx: () => ({
          coachTrust: 4,
          attrs: { iq: 0.8, passing: 0.4 },
          hidden: { chemistry: 4, workEthic: 2 },
          development: 0.3,
          flavor: "Una frase in corridoio vale più di un filmato.",
        }),
      },
      {
        label: "Sorridi e fai a modo tuo",
        detail: "Hai già un'idea di chi sei.",
        fx: () => ({
          form: 0.6,
          attrs: { handle: 0.5, shooting: 0.3 },
          hidden: { ego: 3, chemistry: -2 },
          flavor: "Restano due strade parallele nello stesso spogliatoio.",
        }),
      },
      {
        label: "Gli chiedi di allenarti dopo",
        detail: "Due ore extra, ogni giorno.",
        fx: () => ({
          injuryRisk: 3,
          attrs: { defense: 0.6, iq: 0.5 },
          hidden: { workEthic: 5, motor: 2 },
          development: 0.45,
          flavor: "Il parquet vuoto, dopo gli altri, diventa la tua scuola.",
        }),
      },
    ],
  },
  {
    id: "pr8",
    phase: "prime",
    title: "Un nuovo sistema offensivo",
    subtitle: "__COACH__ cambia tutto a metà stagione: meno isolamento, più movimento.",
    choices: [
      {
        label: "Ti adatti per primo",
        detail: "Diventi il traduttore dello schema.",
        fx: () => ({
          coachTrust: 7,
          attrs: { passing: 0.8, iq: 0.7, shooting: 0.2 },
          hidden: { chemistry: 4, consistency: 2 },
          flavor: "Il nuovo attacco gira intorno alle tue letture.",
        }),
      },
      {
        label: "Chiedi i tuoi isolamenti",
        detail: "Il tuo gioco ha portato fin qui.",
        fx: () => ({
          coachTrust: -4,
          form: 0.9,
          attrs: { handle: 0.6, shooting: 0.5 },
          hidden: { ego: 4, chemistry: -3 },
          flavor: "Ottieni possessi. Lo staff segna la resistenza.",
        }),
      },
      {
        label: "Studi in silenzio",
        detail: "Niente dichiarazioni, solo compiti.",
        fx: () => ({
          attrs: { iq: 0.6, defense: 0.3 },
          hidden: { consistency: 4, workEthic: 2 },
          development: 0.25,
          flavor: "Nessun titolo. Un giocatore diverso a marzo.",
        }),
      },
    ],
  },
  {
    id: "pr9",
    phase: "prime",
    title: "Una stella arriva in città",
    subtitle: "La società manda a prendere un all-star. I minuti non si inventano.",
    choices: [
      {
        label: "Accogli il nuovo riferimento",
        detail: "Meno palloni, più anelli possibili.",
        fx: () => ({
          coachTrust: 5,
          form: -0.4,
          attrs: { passing: 0.7, defense: 0.5, shooting: -0.2 },
          hidden: { chemistry: 6, ego: -4 },
          flavor: "Il tuo ruolo cambia. La finestra del titolo si apre.",
        }),
      },
      {
        label: "Pretendi chiarezza sul tuo uso",
        detail: "Non vuoi sparire nel sistema.",
        fx: () => ({
          coachTrust: -3,
          form: 0.5,
          attrs: { shooting: 0.5, handle: 0.4 },
          hidden: { ego: 3, mediaSavvy: 2 },
          flavor: "Ottieni un incontro. Non tutte le risposte ti piacciono.",
        }),
      },
      {
        label: "Alzi il livello in allenamento",
        detail: "Se c'è una gerarchia, la vuoi guadagnare.",
        fx: () => ({
          injuryRisk: 3,
          development: 0.55,
          attrs: { athleticism: 0.5, defense: 0.4, shooting: 0.3 },
          hidden: { workEthic: 5, motor: 2 },
          flavor: "Lo spogliatoio nota chi arriva prima e resta dopo.",
        }),
      },
    ],
  },
  {
    id: "pr10",
    phase: "prime",
    title: "La gestione dei carichi: il dibattito",
    subtitle: "Lo staff propone di saltare il secondo di un back-to-back.",
    choices: [
      {
        label: "Accetti il piano",
        detail: "Aprile vale più di gennaio.",
        fx: () => ({
          injuryRisk: -7,
          gamesPenalty: 8,
          attrs: { iq: 0.4, shooting: 0.3 },
          hidden: { durability: 4, ego: -2 },
          flavor: "I tifosi fischiano. Il ginocchio ringrazia.",
        }),
      },
      {
        label: "Giochi tutte",
        detail: "Il tuo nome è sulla maglia, non sul protocollo.",
        fx: () => ({
          injuryRisk: 9,
          publicImage: 5,
          attrs: { athleticism: 0.35 },
          hidden: { motor: 3, durability: -3 },
          flavor: "Il pubblico alza i cartelli. Il fisico prende nota.",
        }),
      },
      {
        label: "Decidi gara per gara",
        detail: "Un compromesso con i fisioterapisti.",
        fx: () => ({
          injuryRisk: -2,
          gamesPenalty: 3,
          attrs: { iq: 0.35, defense: 0.2 },
          hidden: { consistency: 2, mediaSavvy: 2 },
          flavor: "Né eroe né assenteista. Una stagione gestita.",
        }),
      },
    ],
  },
  {
    id: "vt5",
    phase: "veteran",
    title: "Un rookie ti chiede di diventare il suo mentore",
    subtitle: "Ti guarda come tu guardavi i veterani, anni fa.",
    choices: [
      {
        label: "Lo prendi sotto il tuo ala",
        detail: "Film, palestre vuote, telefonate a mezzanotte.",
        fx: () => ({
          coachTrust: 6,
          publicImage: 4,
          attrs: { passing: 0.6, iq: 0.7 },
          hidden: { chemistry: 7, ego: -3 },
          flavor: "Inizi a lasciare qualcosa che non sta nel box score.",
        }),
      },
      {
        label: "Lo fai lavorare, senza sconti",
        detail: "La lezione è il livello, non la tenerezza.",
        fx: () => ({
          form: 0.5,
          attrs: { defense: 0.5, strength: 0.3 },
          hidden: { workEthic: 3, chemistry: 2 },
          flavor: "Lui cresce. Tu resti tagliente.",
        }),
      },
      {
        label: "Non è il tuo mestiere",
        detail: "Hai ancora una carriera da chiudere.",
        fx: () => ({
          form: 0.8,
          attrs: { shooting: 0.5, handle: 0.3 },
          hidden: { chemistry: -3, ego: 2 },
          flavor: "Efficiente. Un po' più solo, in fondo al bus.",
        }),
      },
    ],
  },
  {
    id: "vt6",
    phase: "veteran",
    title: "Una città ti offre la panchina, un giorno",
    subtitle: "Non ora. Ma il nome gira già tra i dirigenti.",
    choices: [
      {
        label: "Inizi a pensarti allenatore",
        detail: "Più schemi, meno strappi.",
        fx: () => ({
          attrs: { iq: 1.1, passing: 0.5, athleticism: -0.3 },
          hidden: { chemistry: 4, clutch: 2 },
          development: 0.3,
          flavor: "Vedi il campo da un'altra altezza, già da giocatore.",
        }),
      },
      {
        label: "Sei ancora un giocatore",
        detail: "Il resto arriverà, se arriverà.",
        fx: () => ({
          form: 0.7,
          attrs: { shooting: 0.5, athleticism: 0.25 },
          hidden: { ego: 2, motor: 2 },
          flavor: "Chiudi la porta all'ufficio. Apri quella della palestra.",
        }),
      },
    ],
  },
  {
    id: "an7",
    phase: "any",
    title: "Una notte fuori finisce sui tabloid",
    subtitle: "Niente illegale. Abbastanza per i titoli.",
    choices: [
      {
        label: "Ti scusi e sparisci",
        detail: "Una settimana di silenzio, poi il lavoro.",
        fx: () => ({
          publicImage: -3,
          coachTrust: 4,
          attrs: { iq: 0.25 },
          hidden: { mediaSavvy: 3, workEthic: 2, ego: -2 },
          flavor: "La notizia muore. Lo staff respira.",
        }),
      },
      {
        label: "Rispondi a tono sui social",
        detail: "Non sei un santo, e non fai finta.",
        fx: () => ({
          publicImage: 2,
          coachTrust: -5,
          attrs: { handle: 0.25 },
          hidden: { mediaSavvy: -2, ego: 5 },
          flavor: "Una parte del pubblico applaude. I veterani no.",
        }),
      },
      {
        label: "Trasformi tutto in beneficenza",
        detail: "Visibilità pagata in un altro modo.",
        fx: () => ({
          publicImage: 6,
          attrs: { iq: 0.3 },
          hidden: { mediaSavvy: 5, chemistry: 2 },
          flavor: "I tabloid restano. Cambia il sottotitolo.",
        }),
      },
    ],
  },
  {
    id: "an8",
    phase: "any",
    title: "Il fisico ti chiede un mese diverso",
    subtitle: "Meno carico, o un'estate da record. Non entrambi.",
    choices: [
      {
        label: "Scarico e prevenzione",
        detail: "Arrivi intero a ottobre.",
        fx: () => ({
          injuryRisk: -8,
          attrs: { strength: 0.4, iq: 0.3, athleticism: -0.15 },
          hidden: { durability: 5, motor: -1 },
          flavor: "Niente highlight estivi. Un ottobre pulito.",
        }),
      },
      {
        label: "Un laboratorio tecnico",
        detail: "Tre nuovi movimenti, un costo fisico.",
        fx: () => ({
          injuryRisk: 4,
          development: 0.5,
          attrs: { shooting: 0.7, handle: 0.6 },
          hidden: { workEthic: 3, consistency: 1 },
          flavor: "A settembre il tiro ha un'altra uscita.",
        }),
      },
      {
        label: "Campo e pesi, senza sconti",
        detail: "Vuoi il primo passo di due anni fa.",
        fx: () => ({
          injuryRisk: 7,
          attrs: { athleticism: 0.8, strength: 0.5 },
          hidden: { motor: 3, durability: -3 },
          flavor: "I numeri in palestra salgono. Qualcosa scricchiola.",
        }),
      },
    ],
  },
];

export const STORY_POOL: StoryEvent[] = [...STORY_EVENTS, ...EXTRA_STORY, ...FEEL_STORY];
