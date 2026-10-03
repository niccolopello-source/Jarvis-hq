
import { useSyncExternalStore } from "react";

export type Lang = "it" | "en" | "es";

/** Languages offered in the demo. Spanish stays in the dictionary for a later phase. */
export const DEMO_LANGS = ["it", "en"] as const;

export function demoLang(stored: string | null | undefined): "it" | "en" {
  return stored === "en" ? "en" : "it";
}

const KEY = "pivot-lang";

const IT = {
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
    seeEnd: "Rivedi il finale",
    nlTitleRunning: "Iniziare una nuova vita?",
    nlBodyRunning: "La carriera di {name} è ancora in corso ({seasons}). Se inizi una nuova vita, questa carriera viene cancellata da questo browser e non potrai riprenderla.",
    nlKeepArchive: "Le carriere già concluse nell'archivio restano dove sono.",
    nlTitleUnarchived: "Questa carriera non è nell'archivio",
    nlBodyUnarchived: "Il browser non ha salvato la carriera di {name} nell'archivio (memoria piena o non disponibile). Se inizi una nuova vita adesso, questa carriera si perde.",
    nlCancel: "Annulla, tengo la carriera",
    nlConfirm: "Cancella e inizia una nuova vita",
    nlRetryArchive: "Riprova a salvare nell'archivio",
    nlDeleteFailed: "Non è stato possibile cancellare la carriera dal browser. Niente è stato perso: riprova o ricarica la pagina.",
    nlRetryFailed: "L'archivio non è ancora scrivibile. La carriera resta aperta in questa scheda.",
    nlRetryOk: "Carriera salvata nell'archivio.",
    storageOff: "Questo browser non permette di salvare. La carriera resta solo finché questa scheda è aperta.",
    loadCorrupt: "Abbiamo trovato un salvataggio danneggiato che non si può aprire.",
    loadFuture: "Abbiamo trovato un salvataggio creato da una versione più recente di PIVOT 23. Non si può aprire qui.",
    loadIncompatible: "Abbiamo trovato un salvataggio di una versione precedente che questa versione non sa convertire.",
    loadBackedUp: "Non è stato cancellato: una copia è conservata nel browser.",
    loadNotBackedUp: "Non è stato cancellato, ma il browser non ha spazio per una copia di riserva: iniziare una nuova vita lo sovrascrive.",
    loadMigrated: "Il salvataggio è stato aggiornato al formato attuale. L'originale è conservato come copia.",
    otherTab: "Un'altra scheda ha salvato una carriera diversa. Vale l'ultimo salvataggio: se continui qui, questa scheda sovrascrive l'altra.",
    archiveEvicted: "L'archivio tiene {limit} carriere: per fare spazio è uscita la più vecchia, {name}.",
    archiveFullSoon: "L'archivio è pieno ({limit} carriere). Quando chiuderai questa carriera, uscirà la più vecchia: {name}.",
    archiveUnsaved: "La carriera non è entrata nell'archivio del browser. Resta visibile in questa scheda; il salvataggio in corso non è stato cancellato.",
    dismiss: "Chiudi avviso",
  /*@@IT@@*/
} as const;

export type Msg = keyof typeof IT;

const EN: Record<Msg, string> = {
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
    seeEnd: "See the ending",
    nlTitleRunning: "Start a new career?",
    nlBodyRunning: "{name}'s career is still in progress ({seasons}). If you start a new career, this one is deleted from this browser and cannot be resumed.",
    nlKeepArchive: "Finished careers in the archive stay where they are.",
    nlTitleUnarchived: "This career is not in the archive",
    nlBodyUnarchived: "The browser did not save {name}'s career to the archive (storage full or unavailable). If you start a new career now, this career is lost.",
    nlCancel: "Cancel, keep this career",
    nlConfirm: "Delete and start a new career",
    nlRetryArchive: "Try saving to the archive again",
    nlDeleteFailed: "The career could not be deleted from the browser. Nothing was lost: try again or reload the page.",
    nlRetryFailed: "The archive still cannot be written. The career stays open in this tab.",
    nlRetryOk: "Career saved to the archive.",
    storageOff: "This browser does not allow saving. The career only lasts while this tab is open.",
    loadCorrupt: "We found a damaged save that cannot be opened.",
    loadFuture: "We found a save made by a newer version of PIVOT 23. It cannot be opened here.",
    loadIncompatible: "We found a save from an older version that this version cannot convert.",
    loadBackedUp: "It was not deleted: a copy is kept in the browser.",
    loadNotBackedUp: "It was not deleted, but the browser has no room for a backup copy: starting a new career overwrites it.",
    loadMigrated: "The save was updated to the current format. The original is kept as a copy.",
    otherTab: "Another tab saved a different career. The latest save wins: if you continue here, this tab overwrites the other one.",
    archiveEvicted: "The archive keeps {limit} careers: the oldest, {name}, was removed to make room.",
    archiveFullSoon: "The archive is full ({limit} careers). When this career ends, the oldest one leaves: {name}.",
    archiveUnsaved: "The career did not reach the browser archive. It stays visible in this tab; the live save was not deleted.",
    dismiss: "Dismiss notice",
  /*@@EN@@*/
};

/** Spanish is not offered in the demo (D-014). Missing keys fall back to Italian; see spanishGaps(). */
const ES: Partial<Record<Msg, string>> = {
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
};

const DICT: Record<Lang, Partial<Record<Msg, string>>> = { it: IT, en: EN, es: ES };

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
  return DICT[lang][key] ?? IT[key];
}

/** t() with {placeholders}: tf("archiveEvicted", { name: "Rossi" }). */
export function tf(key: Msg, vars: Record<string, string | number>, lang: Lang = current): string {
  return t(key, lang).replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
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

/** Missing or empty keys in the demo languages (Italian and English). Must be empty. */
export function chromeGaps(langs: readonly Lang[] = DEMO_LANGS): string[] {
  const keys = Object.keys(IT) as Msg[];
  const gaps: string[] = [];
  for (const lang of langs) {
    for (const key of keys) {
      const value = DICT[lang][key];
      if (typeof value !== "string" || value.trim().length === 0) gaps.push(`${lang}.${key}`);
    }
  }
  return gaps;
}

/** Spanish keys still missing: the size of the Spanish phase for the interface chrome. */
export function spanishGaps(): Msg[] {
  return (Object.keys(IT) as Msg[]).filter((k) => !ES[k]?.trim());
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
