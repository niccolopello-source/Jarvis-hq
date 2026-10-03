
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
    allNba: "Quintetto",
    fmvp: "MVP delle Finals",
    dpoy: "Difensore dell'anno",
    roy: "Matricola dell'anno",
    mip: "Più migliorato",
    sixth: "Sesto uomo",
    raceMvp: "Corsa all'MVP",
    raceMvpCap: "Punti, vittorie e PER. Almeno 58 partite, e devi essere All-Star.",
    raceNba: "Corsa al quintetto",
    raceNbaCap: "Punti, PER e plus/minus. I primi tre gradini sono i tre quintetti.",
    raceMip: "Corsa al più migliorato",
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
    allNba: "All-League",
    fmvp: "Finals MVP",
    dpoy: "Defensive Player of the Year",
    roy: "Rookie of the Year",
    mip: "Most Improved",
    sixth: "Sixth Man",
    raceMvp: "MVP race",
    raceMvpCap: "Points, wins and PER. At least 58 games, and you must be an All-Star.",
    raceNba: "All-League race",
    raceNbaCap: "Points, PER and plus-minus. The top three steps are the three teams.",
    raceMip: "Most Improved race",
    raceMipCap: "The jump in points from last year. It does not go to a star who is already there.",
    yours: "Your awards, this year",
    yearAwards: "This year's awards",
    lifeAwards: "Personal awards",
    careerDone: "Career Completed",
    hofIn: "Hall of Fame",
    saveMiss: "This season was not written in the browser. A reload returns to the last save that succeeded. That save is not deleted.",
    statLegend: "PPG points, RPG rebounds, APG assists, per game.",
    advStats: "Advanced stats",
  },
  es: {
    eyebrow: "Simulador de carrera",
    lede: "Una vida. Un parqué. El resto lo escribes tú.",
    start: "Empezar",
    resume: "Seguir la vida",
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
    allNba: "Quinteto",
    fmvp: "MVP de las Finales",
    dpoy: "Defensor del año",
    roy: "Novato del año",
    mip: "Más mejorado",
    sixth: "Sexto hombre",
    raceMvp: "Carrera al MVP",
    raceMvpCap: "Puntos, victorias y PER. Al menos 58 partidos, y tienes que ser All-Star.",
    raceNba: "Carrera al quinteto",
    raceNbaCap: "Puntos, PER y plus-minus. Los tres primeros escalones son los tres quintetos.",
    raceMip: "Carrera al más mejorado",
    raceMipCap: "El salto de puntos respecto al año anterior. No vale si ya eres una estrella.",
    yours: "Tus premios, este año",
    yearAwards: "Premios de este año",
    lifeAwards: "Premios personales",
    careerDone: "Carrera concluida",
    hofIn: "En el Hall",
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

const AWARD: Record<Lang, Record<string, string>> = {
  it: {
    "Rookie of the Year": "Matricola dell'anno",
    ROY: "Matricola dell'anno",
    DPOY: "Difensore dell'anno",
    FMVP: "MVP delle Finals",
    "Finals MVP": "MVP delle Finals",
    MIP: "Più migliorato",
    "Most Improved Player": "Più migliorato",
    "6MOY": "Sesto uomo",
    "Sixth Man": "Sesto uomo",
    "All-NBA First Team": "Primo quintetto",
    "All-NBA Second Team": "Secondo quintetto",
    "All-NBA Third Team": "Terzo quintetto",
    MVP: "MVP",
    "All-Star": "All-Star",
  },
  en: {
    "Rookie of the Year": "Rookie of the Year",
    ROY: "Rookie of the Year",
    DPOY: "Defensive Player of the Year",
    FMVP: "Finals MVP",
    "Finals MVP": "Finals MVP",
    MIP: "Most Improved",
    "Most Improved Player": "Most Improved",
    "6MOY": "Sixth Man",
    "Sixth Man": "Sixth Man",
    "All-NBA First Team": "First team",
    "All-NBA Second Team": "Second team",
    "All-NBA Third Team": "Third team",
    MVP: "MVP",
    "All-Star": "All-Star",
  },
  es: {
    "Rookie of the Year": "Novato del año",
    ROY: "Novato del año",
    DPOY: "Defensor del año",
    FMVP: "MVP de las Finales",
    "Finals MVP": "MVP de las Finales",
    MIP: "Más mejorado",
    "Most Improved Player": "Más mejorado",
    "6MOY": "Sexto hombre",
    "Sixth Man": "Sexto hombre",
    "All-NBA First Team": "Primer quinteto",
    "All-NBA Second Team": "Segundo quinteto",
    "All-NBA Third Team": "Tercer quinteto",
    MVP: "MVP",
    "All-Star": "All-Star",
  },
};

export function awardLabel(title: string, lang: Lang = current): string {
  const hit = AWARD[lang][title];
  if (hit) return hit;
  if (title.startsWith("All-NBA")) {
    if (lang === "en") return title.replace("All-NBA", "All-League");
    if (lang === "es") return title.replace("All-NBA", "Quinteto");
    return title.replace("All-NBA", "Quintetto");
  }
  return title;
}
