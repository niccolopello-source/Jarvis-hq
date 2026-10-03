
import { useSyncExternalStore } from "react";

export type Lang = "it" | "en" | "es";

/** Languages offered in the demo. Spanish stays in the dictionary for a later phase. */
export const DEMO_LANGS = ["it", "en"] as const;

export function demoLang(stored: string | null | undefined): "it" | "en" {
  return stored === "en" ? "en" : "it";
}

const KEY = "pivot-lang";

const DICT = {
  it: {
    eyebrow: "Simulatore di carriera",
    lede: "Una vita. Un parquet. Il resto lo scrivi tu.",
    start: "Inizia",
    resume: "Riprendi la vita",
    newLife: "Nuova vita",
    how: "Come si gioca",
    archive: "Archivio",
    lang: "Lingua",
    tabLog: "Storia",
    tabYear: "Anno",
    tabLeague: "Lega",
    tabLife: "Vita",
    seasonOn: "Stagione in corso",
    simSlow: "Pivot 23 sta impiegando più tempo del previsto.",
    simCancel: "Annulla",
    end: "Fine corsa",
    mvp: "MVP",
    allStar: "All-Star",
    allNba: "All-NBA",
    fmvp: "Finals MVP",
    dpoy: "Defensive Player of the Year",
    roy: "Rookie of the Year",
    mip: "Most Improved Player",
    sixth: "Sixth Man of the Year",
    raceMvp: "Corsa all'MVP",
    raceMvpCap: "Punti, vittorie e PER. Almeno 58 partite, e devi essere All-Star.",
    raceNba: "Corsa all'All-NBA",
    raceNbaCap: "Punti, PER e plus/minus. I primi tre gradini sono i tre All-NBA.",
    raceMip: "Corsa al Most Improved Player",
    raceMipCap: "Il salto di punti rispetto all'anno prima. Non vale se sei già una stella.",
    yours: "I tuoi premi, quest'anno",
    yearAwards: "Premi di quest'anno",
    lifeAwards: "Premi personali",
    careerDone: "Carriera conclusa",
    hofIn: "Nella Hall",
    saveMiss: "Questa stagione non è stata scritta nel browser. Se ricarichi, torni all'ultimo salvataggio riuscito. Quello già scritto non viene cancellato.",
    statLegend: "PPG punti, RPG rimbalzi, APG assist, a partita.",
    advStats: "Statistiche avanzate",
    skip: "Salta",
    setupTitle: "Chi sei sul parquet",
    setupLede: "Nome, ruolo, maglia. Poi la difficoltà — e il mestiere.",
    setupName: "Nome",
    setupRole: "Ruolo",
    setupFrom: "Provenienza",
    setupNumber: "Numero",
    setupHint: "Il numero sulla maglia. Da 0 a 99.",
    setupDiff: "Difficoltà",
    setupDraft: "Gioca il Draft",
    setupSim: "Simula la carriera",
    simulated: "simulata",
    years: "anni",
    peak: "picco",
    age: "Età",
    titles: "Titoli",
    guide1Title: "Una vita",
    guide1Body: "Entri al Draft. Dieci round, tre schede su quattro. Poi scegli il percorso: NCAA, Europa o G-League. Lì si muove l'overall, prima della maglia.",
    guide2Title: "La chiamata",
    guide2Body: "Vedi solo il numero, dalla 1ª alla 60ª. La società ti prende per roster, città, progetto. Non per la difficoltà che hai scelto.",
    guide3Title: "Gli inverni",
    guide3Body: "Ogni stagione lascia un segno. Le porte dei playoff cambiano. L'estate decide da sola. A giugno può ancora dire di no.",
    guide4Title: "Il picco",
    guide4Body: "Il mestiere sale verso i 26, 27, 28 anni, poi cala. Una vita alla volta. Se chiudi, riparti esatto dalla stessa carta.",
    guideDone: "Ho capito",
    guideNext: "Avanti",
  },
  en: {
    eyebrow: "Career simulator",
    lede: "One life. One floor. You write the rest.",
    start: "Start",
    resume: "Resume this life",
    newLife: "New life",
    how: "How to play",
    archive: "Archive",
    lang: "Language",
    tabLog: "Story",
    tabYear: "Year",
    tabLeague: "League",
    tabLife: "Life",
    seasonOn: "Season underway",
    simSlow: "Pivot 23 is taking longer than expected.",
    simCancel: "Cancel",
    end: "End of the road",
    mvp: "MVP",
    allStar: "All-Star",
    allNba: "All-NBA",
    fmvp: "Finals MVP",
    dpoy: "Defensive Player of the Year",
    roy: "Rookie of the Year",
    mip: "Most Improved Player",
    sixth: "Sixth Man of the Year",
    raceMvp: "MVP race",
    raceMvpCap: "Points, wins and PER. At least 58 games, and you must be an All-Star.",
    raceNba: "All-NBA race",
    raceNbaCap: "Points, PER and plus-minus. The top three steps are the three All-NBA teams.",
    raceMip: "Most Improved Player race",
    raceMipCap: "The jump in points from last year. It does not go to a star who is already there.",
    yours: "Your awards, this year",
    yearAwards: "This year's awards",
    lifeAwards: "Personal awards",
    careerDone: "Career complete",
    hofIn: "Hall of Fame",
    saveMiss: "This season was not written in the browser. A reload returns to the last save that succeeded. That save is not deleted.",
    statLegend: "PPG points, RPG rebounds, APG assists, per game.",
    advStats: "Advanced stats",
    skip: "Skip",
    setupTitle: "Who you are on the floor",
    setupLede: "Name, position, number. Then the difficulty, and the work.",
    setupName: "Name",
    setupRole: "Position",
    setupFrom: "From",
    setupNumber: "Number",
    setupHint: "The number on the jersey. From 0 to 99.",
    setupDiff: "Difficulty",
    setupDraft: "Enter the Draft",
    setupSim: "Simulate the career",
    simulated: "simulated",
    years: "years",
    peak: "peak",
    age: "Age",
    titles: "Titles",
    guide1Title: "A life",
    guide1Body: "You enter the Draft. Ten rounds, three cards out of four. Then you choose the path: NCAA, Europe or the G League. The overall moves there, before the jersey.",
    guide2Title: "The call",
    guide2Body: "You only see the number, from 1st to 60th. The team takes you for the roster, the city, the plan. Not for the difficulty you picked.",
    guide3Title: "The winters",
    guide3Body: "Every season leaves a mark. The playoff doors change. Summer decides on its own. In June it can still say no.",
    guide4Title: "The peak",
    guide4Body: "The craft climbs toward 26, 27, 28, then falls. One life at a time. If you close it, you start again from the same card.",
    guideDone: "Got it",
    guideNext: "Next",
  },
  es: {
    eyebrow: "Simulador de carrera",
    lede: "Una vida. Un parqué. El resto lo escribes tú.",
    start: "Empezar",
    resume: "Reanudar la carrera",
    newLife: "Nueva vida",
    how: "Cómo se juega",
    archive: "Archivo",
    lang: "Idioma",
    tabLog: "Historia",
    tabYear: "Año",
    tabLeague: "Liga",
    tabLife: "Vida",
    seasonOn: "Temporada en curso",
    simSlow: "Pivot 23 está tardando más de lo previsto.",
    simCancel: "Cancelar",
    end: "Fin del camino",
    mvp: "MVP",
    allStar: "All-Star",
    allNba: "All-NBA",
    fmvp: "Finals MVP",
    dpoy: "Defensive Player of the Year",
    roy: "Rookie of the Year",
    mip: "Most Improved Player",
    sixth: "Sixth Man of the Year",
    raceMvp: "Carrera al MVP",
    raceMvpCap: "Puntos, victorias y PER. Al menos 58 partidos, y tienes que ser All-Star.",
    raceNba: "Carrera al All-NBA",
    raceNbaCap: "Puntos, PER y plus-minus. Los tres primeros escalones son los tres All-NBA.",
    raceMip: "Carrera al Most Improved Player",
    raceMipCap: "El salto de puntos respecto al año anterior. No vale si ya eres una estrella.",
    yours: "Tus premios, este año",
    yearAwards: "Premios de este año",
    lifeAwards: "Premios personales",
    careerDone: "Carrera concluida",
    hofIn: "En el Hall of Fame",
    saveMiss: "Esta temporada no se ha guardado en el navegador. Si recargas, vuelves al último guardado que sí se escribió. Ese no se borra.",
    statLegend: "PPG puntos, RPG rebotes, APG asistencias, por partido.",
    advStats: "Estadísticas avanzadas",
    skip: "Saltar",
    setupTitle: "Quién eres en la cancha",
    setupLede: "Nombre, posición, dorsal. Luego la dificultad, y el oficio.",
    setupName: "Nombre",
    setupRole: "Posición",
    setupFrom: "Origen",
    setupNumber: "Dorsal",
    setupHint: "El número de la camiseta. Del 0 al 99.",
    setupDiff: "Dificultad",
    setupDraft: "Jugar el Draft",
    setupSim: "Simular la carrera",
    simulated: "simulada",
    years: "años",
    peak: "pico",
    age: "Edad",
    titles: "Títulos",
    guide1Title: "Una vida",
    guide1Body: "Entras al Draft. Diez rondas, tres cartas de cuatro. Luego eliges el camino: NCAA, Europa o G League. Ahí se mueve el overall, antes de la camiseta.",
    guide2Title: "La llamada",
    guide2Body: "Solo ves el número, del 1 al 60. El equipo te elige por plantilla, ciudad y proyecto. No por la dificultad que escogiste.",
    guide3Title: "Los inviernos",
    guide3Body: "Cada temporada deja una marca. Las puertas de los playoff cambian. El verano decide solo. En junio todavía puede decir que no.",
    guide4Title: "El pico",
    guide4Body: "El oficio sube hacia los 26, 27, 28 y luego baja. Una vida cada vez. Si la cierras, vuelves a empezar desde la misma carta.",
    guideDone: "Entendido",
    guideNext: "Siguiente",
  },
} as const;

export type Msg = keyof (typeof DICT)["it"];

let current: Lang = "it";
const listeners = new Set<() => void>();

function readStored(): Lang {
  if (typeof window === "undefined") return "it";
  try {
    return demoLang(window.localStorage.getItem(KEY));
  } catch {
    /* lingua di cortesia */
  }
  return "it";
}

export function initLang() {
  current = readStored();
  if (typeof document !== "undefined") document.documentElement.lang = current;
}

export function setLang(next: Lang) {
  current = demoLang(next);
  try {
    window.localStorage.setItem(KEY, current);
  } catch {
    /* resta in memoria */
  }
  if (typeof document !== "undefined") document.documentElement.lang = current;
  listeners.forEach((fn) => fn());
}

export function getLang(): Lang {
  return current;
}

export function useLang(): Lang {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getLang,
    () => "it" as Lang,
  );
}

export function t(key: Msg, lang: Lang = current): string {
  return DICT[lang][key];
}

const OFFICIAL_AWARD: Record<string, string> = {
  "Rookie of the Year": "Rookie of the Year",
  ROY: "Rookie of the Year",
  DPOY: "Defensive Player of the Year",
  FMVP: "Finals MVP",
  "Finals MVP": "Finals MVP",
  MIP: "Most Improved Player",
  "Most Improved Player": "Most Improved Player",
  "6MOY": "Sixth Man of the Year",
  "Sixth Man": "Sixth Man of the Year",
  "All-NBA First Team": "All-NBA First Team",
  "All-NBA Second Team": "All-NBA Second Team",
  "All-NBA Third Team": "All-NBA Third Team",
  "NBA Champion": "NBA Champion",
  "EuroLeague Champion": "EuroLeague Champion",
  MVP: "MVP",
  "All-Star": "All-Star",
};

export function awardLabel(title: string, _lang: Lang = current): string {
  return OFFICIAL_AWARD[title] ?? title;
}

export function chromeGaps(): string[] {
  const keys = Object.keys(DICT.it) as Msg[];
  const gaps: string[] = [];
  for (const lang of ["it", "en", "es"] as const) {
    for (const key of keys) {
      const value = DICT[lang][key];
      if (typeof value !== "string" || value.trim().length === 0) gaps.push(`${lang}.${key}`);
    }
  }
  return gaps;
}

const DIFF_FACE = {
  it: {
    esordio: { label: "Esordio", tag: "Facile", desc: "Crescita generosa, infortuni rari, playoff più aperti. Per imparare il mestiere." },
    pro: { label: "Pro", tag: "Normale", desc: "Il bilancio della lega. Niente sconti, niente ostacoli extra." },
    allstar: { label: "All-Star", tag: "Difficile", desc: "Crescita lenta, roster ostili. I premi si guadagnano sul serio." },
    leggenda: { label: "Leggenda", tag: "Estremo", desc: "Infortuni, playoff da guerra. Solo i fenomeni restano in piedi." },
  },
  en: {
    esordio: { label: "Debut", tag: "Easy", desc: "Generous growth, rare injuries, a more open playoff. For learning the job." },
    pro: { label: "Pro", tag: "Normal", desc: "The league's own balance. No discounts and no extra obstacles." },
    allstar: { label: "All-Star", tag: "Hard", desc: "Slow growth, hostile rosters. Awards have to be earned." },
    leggenda: { label: "Legend", tag: "Extreme", desc: "Injuries, and a playoff that is a fight. Only the rare ones stay standing." },
  },
  es: {
    esordio: { label: "Debut", tag: "Fácil", desc: "Crecimiento generoso, lesiones raras, playoff más abiertos. Para aprender el oficio." },
    pro: { label: "Pro", tag: "Normal", desc: "El equilibrio de la liga. Sin descuentos ni obstáculos de más." },
    allstar: { label: "All-Star", tag: "Difícil", desc: "Crecimiento lento, plantillas hostiles. Los premios se ganan de verdad." },
    leggenda: { label: "Leyenda", tag: "Extremo", desc: "Lesiones y unos playoff duros. Solo los fenómenos siguen en pie." },
  },
} as const;

export type DifficultyFaceId = keyof (typeof DIFF_FACE)["it"];

export function difficultyFace(id: string, lang: Lang = current) {
  const table = DIFF_FACE[lang] ?? DIFF_FACE.it;
  if (id in table) return table[id as DifficultyFaceId];
  return table.pro;
}
