/**
 * Hand-written entries the extractor cannot see: single lower-case words that the engine slots
 * into larger sentences (ambition labels, series kind, units), and the role/nationality phrase
 * of the draft intro, generated from the same tables the engine uses.
 */
import { EURO_ROUNDS, NAT_ADJECTIVE, NBA_ROUNDS, ROLES } from "../../data.ts";
import { draftWho } from "../../feel.ts";

const NAT_EN: Record<string, string> = {
  Italia: "Italian",
  Spagna: "Spanish",
  Francia: "French",
  Serbia: "Serbian",
  Grecia: "Greek",
  Lituania: "Lithuanian",
  Germania: "German",
  Slovenia: "Slovenian",
  Croazia: "Croatian",
  Turchia: "Turkish",
  Lettonia: "Latvian",
  Georgia: "Georgian",
  USA: "American",
  Canada: "Canadian",
  Brasile: "Brazilian",
  Argentina: "Argentine",
  Australia: "Australian",
  Nigeria: "Nigerian",
};

const ROLE_EN: Record<string, string> = {
  PG: "point guard",
  SG: "shooting guard",
  SF: "small forward",
  PF: "power forward",
  C: "center",
};

function rolePhrases(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const role of Object.keys(ROLES) as (keyof typeof ROLES)[]) {
    for (const nat of Object.keys(NAT_ADJECTIVE)) {
      const it = draftWho(role, nat);
      const adj = NAT_EN[nat] ?? nat;
      out[it] = `${/^[AEIOU]/.test(adj) ? "an" : "a"} ${adj} ${ROLE_EN[role]}`;
    }
  }
  return out;
}

const ROUND_EN: Record<string, string> = {
  "Primo turno": "First Round",
  "Semifinali Est/Ovest": "Conference Semifinals",
  "Finali Est/Ovest": "Conference Finals",
  "Finali NBA": "NBA Finals",
  "Quarti di finale": "Quarterfinals",
  "Semifinale Final Four": "Final Four Semifinal",
  "Finale Eurolega": "EuroLeague Final",
};

/** Season-row playoff results "Elim. <round> <score>" (engine.ts), one entry per round. */
function eliminations(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of [...NBA_ROUNDS, ...EURO_ROUNDS]) out[`Elim. ${r} {0}`] = `Out in the ${ROUND_EN[r] ?? r} {0}`;
  return out;
}

export const EN_MANUAL: Record<string, string> = {
  // Units and small words slotted into templates.
  anno: "year",
  anni: "years",
  partita: "game",
  serie: "series",
  // Team ambitions (world.ts labelAmbition) and draft-class quality.
  ricostruzione: "rebuild",
  sviluppo: "development",
  playoff: "playoffs",
  contendere: "contention",
  titolo: "title",
  generazionale: "generational",
  // Team identities (world.ts labelIdentity), slotted into coaching and system news.
  "ritmo alto": "high pace",
  "metà campo": "half court",
  "tiro da tre": "three-point shooting",
  isolamento: "isolation",
  "movimento di palla": "ball movement",
  difesa: "defense",
  fisicità: "physicality",
  crescita: "development",
  veterani: "veterans",
  // Role words in engine.ts "{age} anni da {guardia|ala}".
  guardia: "guard",
  ala: "wing",
  solido: "solid",
  opaco: "thin",
  // engine.ts appends this sentence to an existing dev line; on its own once segmented.
  "{0} ({1}) è nel foglio.": "{0} ({1}) is on the sheet.",
  ...rolePhrases(),
  ...eliminations(),
};
