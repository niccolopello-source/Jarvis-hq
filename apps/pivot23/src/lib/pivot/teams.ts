
import type { Conference, Team, TeamTier } from "./types";

function t(
  name: string,
  abbr: string,
  city: string,
  color: string,
  secondary: string,
  conf: Conference,
  div: string,
  power: number,
  star: string,
  note: string,
): Team {
  const tier: TeamTier = power >= 80 ? "contender" : power >= 66 ? "mid" : "rebuilding";
  return { name, abbr, city, color, secondary, conf, div, power, star, tier, note };
}

/** Potere 2025-26: snapshot competitivo, poi deriva stagione per stagione. */
export const NBA_TEAMS: Team[] = [
  t("Boston Celtics", "BOS", "Boston", "#007A33", "#BA9653", "East", "Atlantic", 84, "Ellis Ward", "Ciclo d'oro ancora vivo. Il riferimento dell'Est, parquet verde e standard alti."),
  t("New York Knicks", "NYK", "New York", "#F58426", "#006BB6", "East", "Atlantic", 83, "Jonah Hale", "Madison conta di nuovo. Un progetto da titolo, non da nostalgia."),
  t("Philadelphia 76ers", "PHI", "Philadelphia", "#006BB6", "#ED174C", "East", "Atlantic", 64, "Marcus Veld", "Talento in alto, salute in basso. Ogni aprile è una scommessa."),
  t("Brooklyn Nets", "BKN", "Brooklyn", "#000000", "#FFFFFF", "East", "Atlantic", 50, "Tariq Bell", "Ricostruzione nera. Minuti per chi vuole un ruolo, non un anello."),
  t("Toronto Raptors", "TOR", "Toronto", "#CE1141", "#000000", "East", "Atlantic", 62, "Devon Marsh", "Identità difensiva, classifica a metà. Un posto dove imparare il mestiere."),
  t("Cleveland Cavaliers", "CLE", "Cleveland", "#860038", "#FDBB30", "East", "Central", 85, "Andre Kellerman", "L'Est passa da qui: ritmo, difesa, ambizione da testata."),
  t("Detroit Pistons", "DET", "Detroit", "#C8102E", "#1D42BA", "East", "Central", 77, "Kalen Ibe", "La risalita è vera. Giovani che non chiedono permesso."),
  t("Milwaukee Bucks", "MIL", "Milwaukee", "#00471B", "#EEE1C6", "East", "Central", 74, "Riko Tanaka", "Un contendente che invecchia con classe — e con urgenza."),
  t("Indiana Pacers", "IND", "Indianapolis", "#002D62", "#FDBB30", "East", "Central", 76, "Mateo Ruiz", "Pace alto, coraggio alto. I playoff li cercano, non li aspettano."),
  t("Chicago Bulls", "CHI", "Chicago", "#CE1141", "#000000", "East", "Central", 66, "Nico Halvorsen", "Mercato enorme, roster a metà. La maglia pesa più della classifica."),
  t("Orlando Magic", "ORL", "Orlando", "#0077C0", "#C4CED4", "East", "Southeast", 78, "Elijah Voss", "Lunghi, lunghi, lunghi. Un Sud-est costruito per aprile."),
  t("Atlanta Hawks", "ATL", "Atlanta", "#E03A3E", "#C1D32F", "East", "Southeast", 73, "Tomas Vukovic", "Talento da highlight, difesa da lavoro. Sempre un passo dal salto."),
  t("Miami Heat", "MIA", "Miami", "#98002E", "#F9A01B", "East", "Southeast", 72, "Luis Navarro", "La cultura Heat: minuti guadagnati, mai regalati. Playoff nel DNA."),
  t("Charlotte Hornets", "CHA", "Charlotte", "#1D1160", "#00788C", "East", "Southeast", 58, "Pavel Holm", "Talento giovane, classifica ostile. Un posto dove crescere in fretta."),
  t("Washington Wizards", "WAS", "Washington", "#002B5C", "#E31837", "East", "Southeast", 48, "Chris Adeyemi", "Ricostruzione lunga. I minuti ci sono, le vittorie no."),
  t("Oklahoma City Thunder", "OKC", "Oklahoma City", "#007AC1", "#EF3B24", "West", "Northwest", 92, "Soren Blake", "La macchina del West. Giovani, profondità, il metro della lega."),
  t("Denver Nuggets", "DEN", "Denver", "#0E2240", "#FEC524", "West", "Northwest", 83, "Milan Kovac", "Il gioco più intelligente della lega. Un contendente che non alza la voce."),
  t("Minnesota Timberwolves", "MIN", "Minneapolis", "#0C2340", "#236192", "West", "Northwest", 81, "Ilya Petrov", "Difesa da élite, Nord freddo, ambizioni calde."),
  t("Portland Trail Blazers", "POR", "Portland", "#E03A3E", "#000000", "West", "Northwest", 60, "Jamal Crowe", "Ricostruire sotto la pioggia. Il futuro è più vicino della classifica."),
  t("Utah Jazz", "UTA", "Salt Lake City", "#002B5C", "#F9A01B", "West", "Northwest", 52, "Owen Drake", "Tank e futuro. Lo Jazz aspetta il prossimo ciclo, minuti per tutti."),
  t("Houston Rockets", "HOU", "Houston", "#CE1141", "#000000", "West", "Southwest", 82, "Darius Cole", "Atletismo, lunghezza, un West che li teme di nuovo."),
  t("Dallas Mavericks", "DAL", "Dallas", "#00538C", "#B8C4CA", "West", "Southwest", 78, "Stefan Popovic", "Un palazzetto che chiede l'anello. Talento da copertina, roster da equilibrare."),
  t("San Antonio Spurs", "SAS", "San Antonio", "#000000", "#C4CED4", "West", "Southwest", 76, "Rafael Mendes", "Il futuro ha già un volto. Gli Spurs tornano a insegnare e a vincere."),
  t("Memphis Grizzlies", "MEM", "Memphis", "#5D76A9", "#12173F", "West", "Southwest", 71, "Kwame Rivers", "Grit and grind aggiornato. Quando sono interi, contano."),
  t("New Orleans Pelicans", "NOP", "New Orleans", "#0C2340", "#C8102E", "West", "Southwest", 58, "Etienne Bourg", "Salute e 'se'. Un roster da playoff in una città che aspetta."),
  t("Los Angeles Lakers", "LAL", "Los Angeles", "#552583", "#FDB927", "West", "Pacific", 77, "Miles Navarro", "Il marchio più pesante. Ogni stagione è una vetrina, e una scadenza."),
  t("Golden State Warriors", "GSW", "San Francisco", "#1D428A", "#FFC72C", "West", "Pacific", 74, "Kenji Sato", "Il tiro che ha cambiato la lega. Un ciclo che resiste, non si arrende."),
  t("LA Clippers", "LAC", "Los Angeles", "#C8102E", "#1D428A", "West", "Pacific", 72, "Omar Grant", "Finestre strette, stipendi alti. I playoff restano l'unico giudizio."),
  t("Phoenix Suns", "PHX", "Phoenix", "#1D1160", "#E56020", "West", "Pacific", 67, "Felix Ortega", "Deserto, stelle, e una classifica che non perdona i dettagli."),
  t("Sacramento Kings", "SAC", "Sacramento", "#5A2D81", "#63727A", "West", "Pacific", 66, "Harvey Quinn", "Ritmo, pubblico, play-in. Sempre a un possesso dal salto."),
];

export const EURO_TEAMS: Team[] = [
  t("Real Madrid", "RMA", "Madrid", "#FFFFFF", "#00529F", "Euro", "Eurolega", 88, "Sergio Varela", "La casa dei titoli. Chi arriva qui impara a vincere, o a uscire."),
  t("FC Barcelona", "BAR", "Barcellona", "#A50044", "#004D98", "Euro", "Eurolega", 84, "Nikola Ristic", "Palau, orgoglio, un ciclo che non accetta secondi posti."),
  t("Olympiacos", "OLY", "Pireo", "#D21034", "#FFFFFF", "Euro", "Eurolega", 86, "Kostas Elia", "Il Pireo di notte è un altro sport. Difesa, cuore, Final Four."),
  t("Panathinaikos", "PAO", "Atene", "#006437", "#FFFFFF", "Euro", "Eurolega", 85, "Dimitris Vlachos", "Il derby come mestiere. Verdi, esigenti, sempre nel giro titolo."),
  t("Fenerbahce", "FNB", "Istanbul", "#FFED00", "#003399", "Euro", "Eurolega", 80, "Can Erdem", "Istanbul non perdona. Un palazzetto che chiede l'Eurolega ogni anno."),
  t("Anadolu Efes", "EFS", "Istanbul", "#002D72", "#CE1126", "Euro", "Eurolega", 78, "Arda Yilmaz", "Scuola di tiro e di letture. Un progetto che sa cos'è un anello."),
  t("EA7 Olimpia Milano", "OLM", "Milano", "#E41B23", "#FFFFFF", "Euro", "Eurolega", 76, "Lorenzo Bianchi", "Il Forum, la Serie A, l'Europa. Casa per chi vuole restare grande in Italia."),
  t("Virtus Bologna", "VIR", "Bologna", "#000000", "#FFFFFF", "Euro", "Eurolega", 74, "Marco Neri", "Nera, orgogliosa, un'altra idea di Italia. Palazzetto che morde."),
  t("AS Monaco", "ASM", "Monaco", "#C8102E", "#FFFFFF", "Euro", "Eurolega", 79, "Alpha Diallo", "Principato, athleticism, un roster costruito per aprile."),
  t("Zalgiris Kaunas", "ZAL", "Kaunas", "#006633", "#FFFFFF", "Euro", "Eurolega", 70, "Jonas Petrauskas", "Kaunas non è un mercato. È una religione verde."),
  t("Partizan Belgrado", "PAR", "Belgrado", "#000000", "#FFFFFF", "Euro", "Eurolega", 72, "Luka Jovanovic", "Belgrado a mezzanotte. Intensità che i numeri non spiegano."),
  t("Maccabi Tel Aviv", "MTA", "Tel Aviv", "#1C3F94", "#FDB913", "Euro", "Eurolega", 68, "Gal Rosen", "Giallo, storia, un club che ha insegnato l'Europa a metà continente."),
  t("Baskonia", "BAS", "Vitoria", "#C8102E", "#00A650", "Euro", "Eurolega", 69, "Iker Sanz", "Vitoria forma giocatori. Poi li manda in NBA, o li tiene a vincere."),
  t("Bayern Monaco", "BAY", "Monaco di Baviera", "#DC052D", "#FFFFFF", "Euro", "Eurolega", 71, "Leon Krüger", "Bundesliga e Eurolega, stesso orgoglio. Un club che spende per restare."),
  t("Crvena Zvezda", "CZV", "Belgrado", "#C8102E", "#FFFFFF", "Euro", "Eurolega", 73, "Marko Ilic", "Stella Rossa: il derby, la curva, un'altra idea di playoff."),
  t("ALBA Berlino", "ALB", "Berlino", "#005CA9", "#F7C200", "Euro", "Eurolega", 62, "Tim Schafer", "Scuola tedesca, minuti per i giovani, un progetto più che un titolo."),
];

export function allTeams(): Team[] {
  return [...NBA_TEAMS, ...EURO_TEAMS];
}

export function findTeam(abbrOrName: string): Team | undefined {
  return allTeams().find((x) => x.abbr === abbrOrName || x.name === abbrOrName);
}

export function cloneTeam(team: Team, power?: number): Team {
  const p = power ?? team.power;
  const tier: TeamTier = p >= 80 ? "contender" : p >= 66 ? "mid" : "rebuilding";
  return { ...team, power: p, tier };
}

export function powerToTier(power: number): TeamTier {
  return power >= 80 ? "contender" : power >= 66 ? "mid" : "rebuilding";
}

/** Nessuna maglia: prima del percorso sei svincolato, non un Celtic per errore. */
export const UNSIGNED_TEAM: Team = {
  name: "Svincolato",
  abbr: "UND",
  color: "#1d1d1f",
  secondary: "#d2d2d7",
  city: "—",
  conf: "East",
  div: "",
  power: 50,
  star: "",
  note: "In attesa del Draft.",
  tier: "rebuilding",
};

export function isUnsigned(team: { abbr?: string } | null | undefined) {
  return !team || team.abbr === "UND";
}

export const ROOKIE_NAMES = [
  "Asher Quinn",
  "Malik Crowe",
  "Luka Petrovic",
  "Jalen Voss",
  "Enzo Moretti",
  "Caleb Okoye",
  "Theo Marais",
  "Isaiah Flint",
  "Mateo Silva",
  "Noah Berg",
  "Kobe Daramy",
  "Pavel Novak",
];

export const NAT_ORIGIN: Record<
  string,
  { attrs: Partial<Record<"shooting" | "handle" | "passing" | "defense" | "rebounding" | "athleticism" | "strength" | "iq", number>>; hidden?: Partial<Record<"clutch" | "durability" | "workEthic" | "ego" | "chemistry" | "consistency" | "motor" | "mediaSavvy", number>> }
> = {
  Italia: { attrs: { passing: 2, iq: 2, shooting: 1 }, hidden: { chemistry: 3 } },
  Spagna: { attrs: { passing: 3, iq: 1.5 }, hidden: { chemistry: 2 } },
  Francia: { attrs: { defense: 2, athleticism: 2 }, hidden: { motor: 3 } },
  Serbia: { attrs: { shooting: 2, iq: 2 }, hidden: { consistency: 2 } },
  Grecia: { attrs: { passing: 2, iq: 1.5, handle: 0.5 } },
  Lituania: { attrs: { shooting: 2.5, rebounding: 1 }, hidden: { workEthic: 2 } },
  Germania: { attrs: { strength: 2, defense: 1.5 }, hidden: { consistency: 2 } },
  Slovenia: { attrs: { handle: 2, shooting: 1.5 }, hidden: { clutch: 2 } },
  Croazia: { attrs: { passing: 1.5, shooting: 1, iq: 1 } },
  Turchia: { attrs: { rebounding: 1.5, strength: 1.5 } },
  Lettonia: { attrs: { shooting: 3 }, hidden: { consistency: 2 } },
  Georgia: { attrs: { strength: 2.5, rebounding: 1.5 } },
  USA: { attrs: { athleticism: 3, handle: 1 }, hidden: { mediaSavvy: 3 } },
  Canada: { attrs: { athleticism: 2, defense: 1.5 }, hidden: { motor: 2 } },
  Brasile: { attrs: { handle: 2.5, athleticism: 1 }, hidden: { chemistry: 2 } },
  Argentina: { attrs: { passing: 2, iq: 1.5 }, hidden: { clutch: 2 } },
  Australia: { attrs: { strength: 1.5, defense: 1.5, iq: 1 }, hidden: { workEthic: 3 } },
  Nigeria: { attrs: { athleticism: 2.5, strength: 2 }, hidden: { motor: 2 } },
};
