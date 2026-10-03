
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
  },
  en: {
    eyebrow: "Career simulator",
    lede: "One life. One floor. You write the rest.",
    start: "Start",
    resume: "Resume career",
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
