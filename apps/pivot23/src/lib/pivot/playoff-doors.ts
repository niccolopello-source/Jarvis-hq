
import { labelIdentity } from "./world";
import type { Fx, PlayoffChoice, PlayerState, Role, TeamIdentity } from "./types";

/** Porte playoff: tre, sempre diverse per età / turno di serie / identità. Deterministiche sul seed. */

type Lane = "shot" | "pass" | "defend" | "body" | "mind" | "voice" | "ident";
type AgeBand = "young" | "prime" | "vet";
type RoundBand = "early" | "conf" | "finals";

interface DoorSrc {
  id: string;
  lane: Lane;
  ages: AgeBand[];
  rounds: RoundBand[];
  identities?: TeamIdentity[];
  roles?: Role[];
  label: string;
  detail: string;
  flavor: string;
  bonus: PlayoffChoice["bonus"];
  fx: Omit<Fx, "flavor">;
}

const ALL_AGES: AgeBand[] = ["young", "prime", "vet"];
const ALL_ROUNDS: RoundBand[] = ["early", "conf", "finals"];

function mix(n: number): number {
  n = Math.imul(n ^ (n >>> 16), 2246822507);
  n = Math.imul(n ^ (n >>> 13), 3266489917);
  return (n ^ (n >>> 16)) >>> 0;
}

function doorRng(s: PlayerState, round: number): () => number {
  let h = mix((s.seed || 1) ^ 0x9e3779b9);
  h = mix(h ^ mix((s.season || 1) * 0x85ebca6b));
  h = mix(h ^ mix((round + 3) * 0xc2b2ae35));
  h = mix(h ^ mix((s.age + 7) * 0x27d4eb2d));
  h = mix(h ^ mix((s.overall | 0) * 0x165667b1));
  const id = s.world?.teams[s.team.abbr]?.identity ?? "none";
  for (let i = 0; i < id.length; i++) h = mix(h ^ (id.charCodeAt(i) << (i % 16)));
  h = mix(h ^ (s.role.charCodeAt(0) * 16777619));
  h = mix(h ^ ((s.hidden.clutch | 0) * 0x7feb352d));
  return () => {
    h = mix(h + 0x6c078965);
    return h / 4294967296;
  };
}

export function ageBandOf(s: PlayerState): AgeBand {
  if (s.age <= 23) return "young";
  if (s.age >= 31) return "vet";
  return "prime";
}

export function roundBandOf(s: PlayerState, round: number): RoundBand {
  if (s.league === "EuroLega") {
    if (round >= 2) return "finals";
    if (round >= 1) return "conf";
    return "early";
  }
  if (round >= 3) return "finals";
  if (round >= 2) return "conf";
  return "early";
}

const bShot: PlayoffChoice["bonus"] = (s) =>
  (s.attrs.shooting - 50) * 0.004 + (s.hidden.clutch - 50) * 0.003;
const bPass: PlayoffChoice["bonus"] = (s) =>
  (s.attrs.passing + s.attrs.iq - 100) * 0.0025 + (s.hidden.chemistry - 50) * 0.002;
const bDef: PlayoffChoice["bonus"] = (s) =>
  (s.attrs.defense - 50) * 0.004 + (s.hidden.motor - 50) * 0.002;
const bBody: PlayoffChoice["bonus"] = (s) =>
  (s.attrs.strength + s.attrs.rebounding - 100) * 0.0022;
const bMind: PlayoffChoice["bonus"] = (s) =>
  (s.coachTrust - 50) * 0.003 + (s.attrs.iq - 50) * 0.003;
const bVoice: PlayoffChoice["bonus"] = (s) =>
  (s.hidden.chemistry - 45) * 0.004 + (s.attrs.passing - 48) * 0.003;
const bIso: PlayoffChoice["bonus"] = (s) =>
  (s.attrs.shooting - 48) * 0.004 + (s.hidden.clutch - 48) * 0.0035 + (s.hidden.ego - 40) * 0.001;
const bWar: PlayoffChoice["bonus"] = (s) =>
  (s.hidden.motor - 48) * 0.0035 + (s.attrs.defense - 50) * 0.0035;
const bClutch: PlayoffChoice["bonus"] = (s) =>
  (s.hidden.clutch - 45) * 0.0045 + (s.attrs.shooting - 50) * 0.004;
const bMatch: PlayoffChoice["bonus"] = (s) =>
  (s.attrs.defense - 50) * 0.0045 + (s.hidden.motor - 50) * 0.002;

function fx(partial: Omit<Fx, "flavor">): Omit<Fx, "flavor"> {
  return partial;
}

const POOL: DoorSrc[] = [
  // —— giovani, primi turni ——
  {
    id: "y-ask",
    lane: "shot",
    ages: ["young"],
    rounds: ["early"],
    label: "Chiedi il possesso, anche se trema",
    detail: "Non ti nascondi. Il primo aprile è un esame.",
    flavor: "Alzi la mano, anche se trema. Qualcuno in panchina alza un sopracciglio. Poi la palla arriva, e il primo aprile è già un esame.",
    bonus: bShot,
    fx: fx({ form: 0.3, hidden: { clutch: 2, ego: 2 }, attrs: { shooting: 0.3, handle: 0.2 } }),
  },
  {
    id: "y-follow",
    lane: "pass",
    ages: ["young"],
    rounds: ["early", "conf"],
    label: "Segui i veterani, possesso dopo possesso",
    detail: "Loro questa serie la sanno a memoria. Tu copi il passo, possesso dopo possesso, senza chiedere il permesso di esistere.",
    flavor: "Un passaggio in più, un tempo morto ascoltato fino in fondo. Il palazzetto capisce dopo; lo staff, subito.",
    bonus: bPass,
    fx: fx({ coachTrust: 2, hidden: { chemistry: 3, ego: -1 }, attrs: { passing: 0.35, iq: 0.3 } }),
  },
  {
    id: "y-dirty",
    lane: "defend",
    ages: ["young"],
    rounds: ["early"],
    label: "Prendi il compito sporco sul loro giovane",
    detail: "Stessa età, un altro contratto. Chiudi lui.",
    flavor: "Il loro ragazzo suda. Tu anche. È un inizio.",
    bonus: bDef,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2, workEthic: 1 }, attrs: { defense: 0.4 } }),
  },
  {
    id: "y-box",
    lane: "body",
    ages: ["young"],
    rounds: ["early"],
    label: "Ogni rimbalzo, come se fosse l'ultimo",
    detail: "Il corpo è nuovo. Usalo, senza risparmiarti.",
    flavor: "Chiusura sul rimbalzo, secondo salto, un fallo che vale. Le ginocchia annotano.",
    bonus: bBody,
    fx: fx({ injuryRisk: 3, hidden: { motor: 2 }, attrs: { strength: 0.35, rebounding: 0.3 } }),
  },
  {
    id: "y-listen",
    lane: "mind",
    ages: ["young"],
    rounds: ["early", "conf", "finals"],
    label: "Ascolta il tempo morto, poi esegui",
    detail: "Niente invenzioni. Il piano è già scritto.",
    flavor: "Ripeti lo schema a voce bassa, come una preghiera laica. Entri. Lo staff non sorride: annuisce, e basta.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { consistency: 2 }, attrs: { iq: 0.4 } }),
  },
  {
    id: "y-hunger",
    lane: "shot",
    ages: ["young"],
    rounds: ["conf", "finals"],
    label: "La fame, nuda, sul possesso largo",
    detail: "Se arrivi fin qui da ragazzo, non restare educato. La fame, nuda, vale più del copione.",
    flavor: "Un tiro che a novembre non avresti preso. Stasera sì.",
    bonus: bClutch,
    fx: fx({ form: 0.45, hidden: { clutch: 3, ego: 2 }, attrs: { shooting: 0.45, handle: 0.2 } }),
  },
  {
    id: "y-voice-late",
    lane: "voice",
    ages: ["young"],
    rounds: ["conf", "finals"],
    label: "Parla tu, anche se la voce trema",
    detail: "Un cerchio, tre secondi, una frase. Basta quella, e il gruppo si stringe intorno.",
    flavor: "Dici poco. Il gruppo si stringe. Qualcuno più vecchio di te annuisce.",
    bonus: bVoice,
    fx: fx({ hidden: { chemistry: 3, clutch: 1 }, attrs: { passing: 0.3, iq: 0.2 }, coachTrust: 2 }),
  },
  {
    id: "y-rotate",
    lane: "defend",
    ages: ["young"],
    rounds: ["conf"],
    label: "Ruota, aiuta, non cercare il contrasto",
    detail: "Il loro veterano è più furbo. Tu copri gli spazi.",
    flavor: "Un aiuto in tempo. Lo staff non sorride: annota.",
    bonus: bDef,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2, chemistry: 1 }, attrs: { defense: 0.4, iq: 0.2 } }),
  },
  {
    id: "y-glass",
    lane: "body",
    ages: ["young"],
    rounds: ["finals"],
    label: "Il tabellone, anche se non è il tuo mestiere",
    detail: "Un corpo in più sotto. Basta quello.",
    flavor: "Un rimbalzo sporco. Le mani bruciano. Resta.",
    bonus: bBody,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2 }, attrs: { rebounding: 0.35, strength: 0.2 } }),
  },

  // —— prime, primi turni ——
  {
    id: "p-iso",
    lane: "shot",
    ages: ["prime"],
    rounds: ["early"],
    label: "Uno contro uno, sul possesso decisivo",
    detail: "Te la giochi tu, in prima persona.",
    flavor: "Il possesso è tuo. Il palazzetto lo sa prima del fischio, e tu non puoi fare finta di non sentirlo.",
    bonus: bShot,
    fx: fx({ form: 0.35, hidden: { clutch: 2, ego: 1 }, attrs: { shooting: 0.35, handle: 0.2 } }),
  },
  {
    id: "p-extra",
    lane: "pass",
    ages: ["prime"],
    rounds: ["early"],
    label: "Il passaggio in più, anche a tre secondi",
    detail: "Ti fidi del sistema e del compagno libero.",
    flavor: "Il passaggio arriva pulito. Il palazzetto capisce dopo.",
    bonus: bPass,
    fx: fx({ coachTrust: 2, hidden: { chemistry: 2, ego: -1 }, attrs: { passing: 0.4, iq: 0.25 } }),
  },
  {
    id: "p-wall",
    lane: "defend",
    ages: ["prime"],
    rounds: ["early"],
    label: "Alza il muro, ogni uscita",
    detail: "Partita da spogliatoio, non da copertina.",
    flavor: "Il fiato brucia. Loro sentono il contatto prima del canestro.",
    bonus: bDef,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2 }, attrs: { defense: 0.45 } }),
  },
  {
    id: "p-phys",
    lane: "body",
    ages: ["prime"],
    rounds: ["early"],
    label: "Gioco fisico, ogni possesso",
    detail: "Contatto, blocco sul rimbalzo, niente regali.",
    flavor: "Ogni rimbalzo è una piccola guerra. La vinci sporca.",
    bonus: bBody,
    fx: fx({ injuryRisk: 3, hidden: { durability: -1 }, attrs: { strength: 0.4, rebounding: 0.3 } }),
  },
  {
    id: "p-read",
    lane: "mind",
    ages: ["prime"],
    rounds: ["early", "conf"],
    label: "Leggi il loro tempo morto meglio di loro",
    detail: "Hanno un piano. Tu hai visto i possessi, a volume basso, e li hai tenuti.",
    flavor: "Cambi un abbinamento a voce. Lo staff, per una volta, ti lascia fare.",
    bonus: bMind,
    fx: fx({ coachTrust: 2, hidden: { consistency: 2 }, attrs: { iq: 0.4, passing: 0.2 } }),
  },
  {
    id: "p-volume",
    lane: "shot",
    ages: ["prime"],
    rounds: ["conf"],
    label: "Prendi il controllo della serie",
    detail: "Più uso, più responsabilità. Se sbagli, è tua.",
    flavor: "La serie cambia spalla. Ora è sulla tua.",
    bonus: bIso,
    fx: fx({ form: 0.5, hidden: { clutch: 3, ego: 2 }, attrs: { shooting: 0.5, handle: 0.25 } }),
  },
  {
    id: "p-staff",
    lane: "mind",
    ages: ["prime"],
    rounds: ["conf"],
    label: "Fidati dello staff, senza eroismi",
    detail: "Esegui il piano. Niente copertine.",
    flavor: "Il piano tiene. Tu tieni il piano.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { chemistry: 3, consistency: 2 }, attrs: { iq: 0.45, passing: 0.25 } }),
  },
  {
    id: "p-match",
    lane: "defend",
    ages: ["prime"],
    rounds: ["conf"],
    label: "Cambia gli abbinamenti in difesa",
    detail: "Chiedi i compiti sporchi sul loro migliore.",
    flavor: "Il loro migliore suda di più. È già qualcosa.",
    bonus: bMatch,
    fx: fx({ injuryRisk: 3, hidden: { motor: 2, workEthic: 1 }, attrs: { defense: 0.5, iq: 0.2 } }),
  },
  {
    id: "p-shot",
    lane: "shot",
    ages: ["prime"],
    rounds: ["finals"],
    label: "Il tiro che ti definirà",
    detail: "Quando la palla arriva, non la passi. Il palazzetto lo sa prima di te, e tu tiri lo stesso.",
    flavor: "Il palazzetto trattiene il fiato con te. Tu non tremi: tiri, e il mondo, per un secondo, aspetta.",
    bonus: bClutch,
    fx: fx({ form: 0.6, hidden: { clutch: 4, ego: 2 }, attrs: { shooting: 0.6 } }),
  },
  {
    id: "p-make",
    lane: "voice",
    ages: ["prime"],
    rounds: ["finals"],
    label: "Fai grandi i compagni",
    detail: "L'anello è di tutti, o non è di nessuno.",
    flavor: "L'assist che chiude una serie pesa come un canestro.",
    bonus: bVoice,
    fx: fx({ coachTrust: 4, hidden: { chemistry: 4, ego: -2 }, attrs: { passing: 0.5, iq: 0.35 } }),
  },
  {
    id: "p-war",
    lane: "body",
    ages: ["prime"],
    rounds: ["finals"],
    label: "Partita da guerra",
    detail: "Ogni rimbalzo, ogni uscita, ogni secondo.",
    flavor: "Finisci con le ginocchia sporche. È il modo giusto.",
    bonus: bWar,
    fx: fx({ injuryRisk: 4, hidden: { motor: 3, durability: -1 }, attrs: { defense: 0.4, rebounding: 0.35, strength: 0.2 } }),
  },
  {
    id: "p-silence",
    lane: "mind",
    ages: ["prime"],
    rounds: ["finals"],
    label: "Chiudi la bocca, apri il campo",
    detail: "Niente dichiarazioni. Solo possessi puliti.",
    flavor: "Il silenzio, stavolta, è un piano. Tiene fino all'ultimo fischio.",
    bonus: bMind,
    fx: fx({ hidden: { consistency: 3, clutch: 2 }, attrs: { iq: 0.35, shooting: 0.25 } }),
  },

  // —— veterani ——
  {
    id: "v-less",
    lane: "mind",
    ages: ["vet"],
    rounds: ["early"],
    label: "Pochi possessi, quelli giusti",
    detail: "Non corri come a ventiquattro. Non serve.",
    flavor: "Due decisioni, nient'altro. La serie, per una sera, ha il tuo orario.",
    bonus: bMind,
    fx: fx({ coachTrust: 2, hidden: { consistency: 3, ego: -1 }, attrs: { iq: 0.4, passing: 0.25 } }),
  },
  {
    id: "v-spot",
    lane: "shot",
    ages: ["vet"],
    rounds: ["early", "conf"],
    label: "Il tiro che hai guadagnato in dieci anni",
    detail: "Non è fame. È mestiere, al momento giusto.",
    flavor: "I piedi sanno già dove. Il palazzetto, un attimo dopo.",
    bonus: bShot,
    fx: fx({ form: 0.3, hidden: { clutch: 3 }, attrs: { shooting: 0.4, iq: 0.2 } }),
  },
  {
    id: "v-cover",
    lane: "defend",
    ages: ["vet"],
    rounds: ["early"],
    label: "Copri i buchi, non i titoli",
    detail: "Aiuti, rotazioni, la voce giusta.",
    flavor: "Un aiuto in ritardo di un passo, arrivato lo stesso. Lo staff lo vede.",
    bonus: bDef,
    fx: fx({ hidden: { chemistry: 3, motor: 1 }, attrs: { defense: 0.35, iq: 0.3 } }),
  },
  {
    id: "v-body",
    lane: "body",
    ages: ["vet"],
    rounds: ["early"],
    label: "Il corpo sa giugno. Ascoltalo",
    detail: "Contatto scelto, non sprecato.",
    flavor: "Un blocco sul rimbalzo, non due. Basta quello, e le ginocchia restano tue.",
    bonus: bBody,
    fx: fx({ injuryRisk: 1, hidden: { durability: 1 }, attrs: { rebounding: 0.3, strength: 0.2 } }),
  },
  {
    id: "v-voice",
    lane: "voice",
    ages: ["vet"],
    rounds: ["early", "conf", "finals"],
    label: "Il tempo morto lo dici tu, piano",
    detail: "La voce che hai guadagnato. Usala.",
    flavor: "Due dita sul petto, un compito a testa. Il cerchio si chiude.",
    bonus: bVoice,
    fx: fx({ coachTrust: 3, hidden: { chemistry: 4, ego: -1 }, attrs: { passing: 0.4, iq: 0.3 } }),
  },
  {
    id: "v-space",
    lane: "pass",
    ages: ["vet"],
    rounds: ["conf", "finals"],
    label: "Fai spazio, poi chiudi tu il cerchio",
    detail: "I giovani corrono. Tu decidi quando fermarsi.",
    flavor: "Un passaggio in più, poi il tiro tuo. L'ordine, stavolta, è quello.",
    bonus: bPass,
    fx: fx({ hidden: { chemistry: 3, clutch: 2 }, attrs: { passing: 0.45, shooting: 0.25 } }),
  },
  {
    id: "v-series",
    lane: "shot",
    ages: ["vet"],
    rounds: ["conf"],
    label: "Una serie da adulti",
    detail: "Niente urla. I possessi, tenuti.",
    flavor: "Chiudi un quarto con un gesto piccolo. Pesano più dei trenta punti.",
    bonus: bIso,
    fx: fx({ form: 0.35, hidden: { clutch: 3, consistency: 2 }, attrs: { shooting: 0.4, iq: 0.25 } }),
  },
  {
    id: "v-match",
    lane: "defend",
    ages: ["vet"],
    rounds: ["conf", "finals"],
    label: "Prendi il loro, anche se costa",
    detail: "Il compito che i giovani non vogliono.",
    flavor: "Il loro migliore ti guarda diverso al terzo quarto. È il rispetto giusto.",
    bonus: bMatch,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2, workEthic: 2 }, attrs: { defense: 0.4, iq: 0.25 } }),
  },
  {
    id: "v-last",
    lane: "shot",
    ages: ["vet"],
    rounds: ["finals"],
    label: "Un possesso, la voce che hai guadagnato",
    detail: "Se arriva a te, è perché deve. A quest'età il coraggio è un possesso tenuto, non un urlo.",
    flavor: "Non tremi. Non esulti. Tiri, e il mondo aspetta, come se il mestiere, per una volta, fosse una preghiera.",
    bonus: bClutch,
    fx: fx({ form: 0.5, hidden: { clutch: 4 }, attrs: { shooting: 0.5, iq: 0.2 } }),
  },
  {
    id: "v-war",
    lane: "body",
    ages: ["vet"],
    rounds: ["finals"],
    label: "Ginocchia sporche, ancora una volta",
    detail: "Il corpo firma dopo. Tu firmi adesso.",
    flavor: "Un rimbalzo all'ultimo. Le articolazioni presenteranno il conto a luglio.",
    bonus: bWar,
    fx: fx({ injuryRisk: 4, hidden: { motor: 2, durability: -2 }, attrs: { defense: 0.3, rebounding: 0.35, strength: 0.2 } }),
  },
  {
    id: "v-give",
    lane: "voice",
    ages: ["vet"],
    rounds: ["finals"],
    label: "L'anello è di chi arriva terzo",
    detail: "Fai grande chi deve chiudere. Poi, se resta, chiudi tu.",
    flavor: "L'assist, poi il blocco sul rimbalzo. Il dito, se arriva, pesa lo stesso.",
    bonus: bVoice,
    fx: fx({ coachTrust: 4, hidden: { chemistry: 5, ego: -2 }, attrs: { passing: 0.5, iq: 0.3 } }),
  },
  {
    id: "v-hold",
    lane: "mind",
    ages: ["vet"],
    rounds: ["early", "conf"],
    label: "Tieni il posto, non la copertina",
    detail: "A quest'età il ruolo è già una vittoria.",
    flavor: "Due possessi, tenuti. Lo staff non applaude: annota che ci sei ancora.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { consistency: 3, ego: -1 }, attrs: { iq: 0.35, passing: 0.2 } }),
  },
  {
    id: "v-clock",
    lane: "body",
    ages: ["vet"],
    rounds: ["conf", "finals"],
    label: "Il corpo ha un orario. Rispettalo",
    detail: "Contatto scelto, recupero vero, niente eroismo vuoto.",
    flavor: "Un contatto sì, il secondo no. A giugno le ginocchia te ne sono grate.",
    bonus: bBody,
    fx: fx({ injuryRisk: -1, hidden: { durability: 2, consistency: 2 }, attrs: { rebounding: 0.2, iq: 0.25 } }),
  },
  {
    id: "v-clear",
    lane: "voice",
    ages: ["vet"],
    rounds: ["finals"],
    label: "Gli ultimi minuti, detti chiaro",
    detail: "La voce, usata poco, quando serve.",
    flavor: "Un tempo morto, due nomi, niente teatro. La serie, per un attimo, ha il tuo passo.",
    bonus: bVoice,
    fx: fx({ coachTrust: 3, hidden: { chemistry: 4, clutch: 2 }, attrs: { passing: 0.3, iq: 0.35 } }),
  },

  // —— identità: difesa ——
  {
    id: "id-def-palm",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["defense"],
    label: "Prima il palmo, poi il resto",
    detail: "Qui il patto è questo. Tienilo, tutta la serie.",
    flavor: "Niente tiri facili. Il tabellone degli altri resta basso, e basta.",
    bonus: bDef,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2, chemistry: 1 }, attrs: { defense: 0.5, iq: 0.2 } }),
  },
  {
    id: "id-def-talk",
    lane: "voice",
    ages: ["prime", "vet"],
    rounds: ["conf", "finals"],
    identities: ["defense"],
    label: "Parla in copertura, ogni rotazione",
    detail: "Il talento senza voce, in questa piazza, non basta.",
    flavor: "Due voci, un aiuto. La loro stella resta a due palleggi dal ferro.",
    bonus: bVoice,
    fx: fx({ hidden: { chemistry: 3 }, attrs: { defense: 0.35, passing: 0.2, iq: 0.25 } }),
  },
  {
    id: "id-def-no3",
    lane: "defend",
    ages: ALL_AGES,
    rounds: ["early", "conf"],
    identities: ["defense"],
    label: "Niente tre facili, questo è il patto",
    detail: "Uscita lunga, mano alta, il resto è commento.",
    flavor: "L'angolo resta muto. Lo staff non esulta: conta.",
    bonus: bMatch,
    fx: fx({ hidden: { motor: 2 }, attrs: { defense: 0.4, athleticism: 0.2 } }),
  },

  // —— identità: tre punti ——
  {
    id: "id-3-line",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["threePoint"],
    label: "Spacca la linea, ogni uscita",
    detail: "Il tiro da tre non è un lusso. Qui è il pane.",
    flavor: "Piedi pronti, ricezione, via. Il palazzetto è già in piedi.",
    bonus: bShot,
    fx: fx({ form: 0.35, hidden: { consistency: 2 }, attrs: { shooting: 0.5, iq: 0.15 } }),
  },
  {
    id: "id-3-extra",
    lane: "pass",
    ages: ALL_AGES,
    rounds: ["early", "conf", "finals"],
    identities: ["threePoint"],
    label: "Il passaggio in più verso l'angolo",
    detail: "Qui è legge, non cortesia.",
    flavor: "Il canestro arriva dal lato debole. Lo schema, per una sera, è una preghiera esaudita.",
    bonus: bPass,
    fx: fx({ hidden: { chemistry: 3, ego: -1 }, attrs: { passing: 0.4, shooting: 0.2 } }),
  },
  {
    id: "id-3-nohes",
    lane: "shot",
    ages: ["young", "prime"],
    rounds: ["conf", "finals"],
    identities: ["threePoint"],
    label: "Nessuna esitazione sulla linea",
    detail: "Se i piedi sono pronti, tiri. Punto.",
    flavor: "Un tre che a novembre avresti finto. Stasera no.",
    bonus: bClutch,
    fx: fx({ form: 0.4, hidden: { clutch: 3 }, attrs: { shooting: 0.45 } }),
  },

  // —— identità: isolamento ——
  {
    id: "id-iso-side",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["isolation"],
    label: "Svuota il lato, decidi tu",
    detail: "Uno contro uno. Il resto della squadra guarda.",
    flavor: "Il campo si svuota. Il tempo morto avversario arriva quando tieni tu.",
    bonus: bIso,
    fx: fx({ form: 0.4, hidden: { clutch: 2, ego: 2 }, attrs: { handle: 0.35, shooting: 0.3 } }),
  },
  {
    id: "id-iso-late",
    lane: "shot",
    ages: ["prime", "vet"],
    rounds: ["conf", "finals"],
    identities: ["isolation"],
    label: "L'ultimo possesso, nudo",
    detail: "Niente alibi di circolazione.",
    flavor: "Un metro quadro, un difensore, il resto a guardare. Così si chiude, qui.",
    bonus: bClutch,
    fx: fx({ form: 0.5, hidden: { clutch: 4, ego: 2 }, attrs: { shooting: 0.5, handle: 0.25 } }),
  },
  {
    id: "id-iso-read",
    lane: "mind",
    ages: ALL_AGES,
    rounds: ["early", "conf"],
    identities: ["isolation"],
    label: "Leggi il corpo davanti, non il copione",
    detail: "L'isolamento è una responsabilità, nuda.",
    flavor: "Una finta, un passo. Il canestro è una conseguenza, non un urlo.",
    bonus: bMind,
    fx: fx({ hidden: { clutch: 2 }, attrs: { iq: 0.35, handle: 0.3 } }),
  },

  // —— identità: movimento di palla ——
  {
    id: "id-ball-out",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["ballMovement"],
    label: "La palla deve uscire",
    detail: "Se la tieni, lo schema si offende.",
    flavor: "Due passaggi in più, un ferro più gentile. Qui la pazienza è un atletismo.",
    bonus: bPass,
    fx: fx({ coachTrust: 2, hidden: { chemistry: 3, ego: -2 }, attrs: { passing: 0.5, iq: 0.25 } }),
  },
  {
    id: "id-ball-third",
    lane: "pass",
    ages: ALL_AGES,
    rounds: ["conf", "finals"],
    identities: ["ballMovement"],
    label: "Il canestro è di chi arriva terzo",
    detail: "Ricevi, leggi, dai. Poi, se resta, tira.",
    flavor: "L'assist in ritardo di un secondo. Il palazzetto, per una volta, capisce lo schema.",
    bonus: bVoice,
    fx: fx({ hidden: { chemistry: 4 }, attrs: { passing: 0.45, iq: 0.3 } }),
  },
  {
    id: "id-ball-clock",
    lane: "mind",
    ages: ["prime", "vet"],
    rounds: ["early", "conf"],
    identities: ["ballMovement"],
    label: "Lo schema è un orologio. Non fermarlo",
    detail: "Chi tiene la lancetta si sente, e non in bene.",
    flavor: "Gira, gira, il tiro pulito. Lo staff conta i passaggi prima dei punti.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { consistency: 2 }, attrs: { iq: 0.4, passing: 0.3 } }),
  },

  // —— identità: ritmo ——
  {
    id: "id-pace-run",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["pace"],
    label: "Primo passo, niente set lunghi",
    detail: "Corrono. Tu stai nel loro respiro, o resti indietro.",
    flavor: "Rimbalzo, uscita, canestro in dieci secondi. Il resto è commento.",
    bonus: (s) => (s.attrs.athleticism - 50) * 0.004 + (s.hidden.motor - 50) * 0.0025,
    fx: fx({ injuryRisk: 2, hidden: { motor: 3 }, attrs: { athleticism: 0.35, handle: 0.25 } }),
  },
  {
    id: "id-pace-push",
    lane: "shot",
    ages: ["young", "prime"],
    rounds: ["early", "conf"],
    identities: ["pace"],
    label: "Spingi, anche dopo il canestro loro",
    detail: "Il ritmo non si negozia.",
    flavor: "Partono in quattro. Tu sei il quinto. Il tabellone corre.",
    bonus: bWar,
    fx: fx({ form: 0.3, hidden: { motor: 2 }, attrs: { athleticism: 0.3, shooting: 0.2 } }),
  },
  {
    id: "id-pace-breath",
    lane: "body",
    ages: ["prime", "vet"],
    rounds: ["conf", "finals"],
    identities: ["pace"],
    label: "Tieni il fiato quando gli altri lo perdono",
    detail: "Il quinto fallo arriva tardi. Tu no.",
    flavor: "Un contropiede a tre minuti dalla fine. Le gambe dicono ancora sì.",
    bonus: bWar,
    fx: fx({ injuryRisk: 3, hidden: { motor: 3, durability: -1 }, attrs: { athleticism: 0.25, defense: 0.2 } }),
  },

  // —— identità: fisico ——
  {
    id: "id-phys-chest",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["physical"],
    label: "Un metro col petto, non col palleggio",
    detail: "Qui il corpo è il regolamento non scritto.",
    flavor: "Chiusura sul rimbalzo, spinta, di nuovo. La partita ha un rumore sordo.",
    bonus: bBody,
    fx: fx({ injuryRisk: 3, hidden: { motor: 2 }, attrs: { strength: 0.45, rebounding: 0.3 } }),
  },
  {
    id: "id-phys-second",
    lane: "body",
    ages: ALL_AGES,
    rounds: ["early", "conf"],
    identities: ["physical"],
    label: "I secondi possessi, tutti",
    detail: "Rimbalzi sporchi. La statistica pulita arriva dopo.",
    flavor: "Un possesso in più, poi un altro. Loro iniziano a guardare l'orologio.",
    bonus: bBody,
    fx: fx({ injuryRisk: 2, attrs: { rebounding: 0.4, strength: 0.25 }, hidden: { workEthic: 2 } }),
  },
  {
    id: "id-phys-foul",
    lane: "defend",
    ages: ["prime", "vet"],
    rounds: ["conf", "finals"],
    identities: ["physical"],
    label: "I falli arrivano, i tiri loro no",
    detail: "Si gioca così, e lo staff non si scusa.",
    flavor: "Un contatto, un fischio tardi. La loro stella esce per un possesso. Basta.",
    bonus: bDef,
    fx: fx({ injuryRisk: 3, hidden: { motor: 2 }, attrs: { defense: 0.35, strength: 0.3 } }),
  },

  // —— identità: veterani ——
  {
    id: "id-vet-low",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["veteran"],
    label: "Poche parole, i dettagli giusti",
    detail: "Niente urla. Il rispetto, qui, è un orario.",
    flavor: "Un tempo morto detto piano vale più di uno urlato. Lo staff lo sa da anni.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { chemistry: 3, consistency: 2 }, attrs: { iq: 0.4 } }),
  },
  {
    id: "id-vet-mem",
    lane: "mind",
    ages: ["prime", "vet"],
    rounds: ["conf", "finals"],
    identities: ["veteran"],
    label: "Gioca con la memoria della serie",
    detail: "Gli schemi hanno già un nome, e i nomi pesano.",
    flavor: "Un possesso visto a maggio, due anni fa. Stasera lo chiudi.",
    bonus: bMind,
    fx: fx({ hidden: { clutch: 2, consistency: 2 }, attrs: { iq: 0.45, shooting: 0.2 } }),
  },
  {
    id: "id-vet-room",
    lane: "voice",
    ages: ["vet"],
    rounds: ALL_ROUNDS,
    identities: ["veteran"],
    label: "Tieni insieme la stanza",
    detail: "Niente drammi da spogliatoio. Il mestiere, qui, è ordinato.",
    flavor: "Una frase sola prima del salto. Il gruppo entra già chiuso.",
    bonus: bVoice,
    fx: fx({ hidden: { chemistry: 4, ego: -1 }, coachTrust: 2, attrs: { passing: 0.3, iq: 0.25 } }),
  },

  // —— identità: crescita ——
  {
    id: "id-dev-clean",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["development"],
    label: "Gioca pulito, anche se trema",
    detail: "Gli errori sono previsti. Non perdonati in automatico.",
    flavor: "Un possesso da compito. Lo consegni senza macchie. Lo staff annota.",
    bonus: bMind,
    fx: fx({ coachTrust: 2, hidden: { workEthic: 3, consistency: 2 }, attrs: { iq: 0.35, shooting: 0.2 } }),
  },
  {
    id: "id-dev-cover",
    lane: "defend",
    ages: ["young", "prime"],
    rounds: ["early", "conf"],
    identities: ["development"],
    label: "Copri l'errore del compagno, poi il tuo",
    detail: "Qui si cresce in pubblico. Resta in campo.",
    flavor: "Un aiuto, un blocco sul rimbalzo. Il ragazzo sbaglia, tu copri. Il cerchio tiene.",
    bonus: bDef,
    fx: fx({ hidden: { chemistry: 3, workEthic: 2 }, attrs: { defense: 0.35, passing: 0.2 } }),
  },
  {
    id: "id-dev-take",
    lane: "shot",
    ages: ["young"],
    rounds: ["conf", "finals"],
    identities: ["development"],
    label: "Prendi il tiro che stai imparando",
    detail: "Se aspetti di essere pronto, la serie è finita.",
    flavor: "Esiti mezzo secondo, poi tiri. Entra. Qualcosa si sposta, in te.",
    bonus: bShot,
    fx: fx({ form: 0.35, hidden: { clutch: 3, ego: 1 }, attrs: { shooting: 0.4 } }),
  },

  // —— identità: metà campo ——
  {
    id: "id-hc-clock",
    lane: "ident",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    identities: ["halfCourt"],
    label: "Ventiquattro secondi, il tiro giusto",
    detail: "Chi tira al dodicesimo si prende uno sguardo.",
    flavor: "Un blocco, una finta, un'uscita. Lo schema ha il tempo di un respiro lungo.",
    bonus: bMind,
    fx: fx({ coachTrust: 2, hidden: { consistency: 3 }, attrs: { iq: 0.45, shooting: 0.25 } }),
  },
  {
    id: "id-hc-set",
    lane: "pass",
    ages: ALL_AGES,
    rounds: ["early", "conf"],
    identities: ["halfCourt"],
    label: "Set lunghi, letture lente",
    detail: "Chi ha fretta resta fuori dallo schema.",
    flavor: "Il quaderno degli schemi è un libro, non un volantino. Lo sfogli, e il canestro arriva meritatissimo.",
    bonus: bPass,
    fx: fx({ hidden: { chemistry: 2, consistency: 2 }, attrs: { passing: 0.4, iq: 0.35 } }),
  },
  {
    id: "id-hc-patient",
    lane: "mind",
    ages: ["prime", "vet"],
    rounds: ["conf", "finals"],
    identities: ["halfCourt"],
    label: "Pazienza tattica, anche se fischiano",
    detail: "Il pubblico vuole il tiro. Lo staff vuole il diciottesimo secondo.",
    flavor: "Aspetti. Poi il colpo. Il palazzetto, per una volta, ha torto.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { clutch: 2, consistency: 2 }, attrs: { iq: 0.4, shooting: 0.3 } }),
  },

  // —— ruoli specifici, per far ruotare ancora ——
  {
    id: "pg-live",
    lane: "pass",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    roles: ["PG"],
    label: "Tieni il pallone vivo, sempre",
    detail: "Sei il primo passaggio. Il resto del quintetto respira con te.",
    flavor: "Un ingresso in post, un passaggio in più, il tiro pulito. La serie ha il tuo ritmo.",
    bonus: bPass,
    fx: fx({ hidden: { chemistry: 2 }, attrs: { passing: 0.45, handle: 0.25, iq: 0.2 } }),
  },
  {
    id: "wing-close",
    lane: "defend",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    roles: ["SG", "SF"],
    label: "Uscita lunga, mano alta",
    detail: "Il loro tiratore è il tuo compito, tutta la serie.",
    flavor: "Due passi, una mano. Il tre resta corto. Lo staff non dice niente: è già un voto.",
    bonus: bDef,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2 }, attrs: { defense: 0.4, athleticism: 0.2 } }),
  },
  {
    id: "big-paint",
    lane: "body",
    ages: ALL_AGES,
    rounds: ALL_ROUNDS,
    roles: ["PF", "C"],
    label: "L'area è tua, anche se costa",
    detail: "Chiusura sul rimbalzo, secondo salto, il fallo utile.",
    flavor: "Un canestro sporco, una stoppata, un corpo che non si sposta. L'area ha un padrone.",
    bonus: bBody,
    fx: fx({ injuryRisk: 3, attrs: { rebounding: 0.4, strength: 0.3, defense: 0.2 } }),
  },
  {
    id: "y-ready",
    lane: "mind",
    ages: ["young"],
    rounds: ["early", "conf"],
    label: "Resta pronto, anche se non parti",
    detail: "Il primo ingresso è un esame. Non arrivarci freddo.",
    flavor: "Entri a partita in corsa. Lo schema, per fortuna, lo avevi già in bocca.",
    bonus: bMind,
    fx: fx({ coachTrust: 2, hidden: { consistency: 2, workEthic: 1 }, attrs: { iq: 0.35 } }),
  },
  {
    id: "y-charge",
    lane: "body",
    ages: ["young"],
    rounds: ["conf", "finals"],
    label: "Prendi il contatto, resta in piedi",
    detail: "Un corpo fermo vale più di un salto in ritardo.",
    flavor: "Un fallo offensivo, un possesso. Lo staff non sorride: annota il petto.",
    bonus: bBody,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2 }, attrs: { strength: 0.3, defense: 0.25 } }),
  },
  {
    id: "y-free",
    lane: "shot",
    ages: ["young"],
    rounds: ["early", "finals"],
    label: "Due liberi, come se fosse giugno",
    detail: "La lunetta non trema se la tratti da mestiere.",
    flavor: "Due tiri, nient'altro. Il palazzetto tace. Tu no: respiri, e segni.",
    bonus: bShot,
    fx: fx({ form: 0.25, hidden: { clutch: 2, consistency: 2 }, attrs: { shooting: 0.35 } }),
  },
  {
    id: "y-steal",
    lane: "defend",
    ages: ["young"],
    rounds: ["finals"],
    label: "Anticipa la mano, non il salto",
    detail: "Il loro passaggio basso è tuo, se leggi un tempo prima.",
    flavor: "Una mano, un possesso. Il palazzetto ci mette un attimo a capire che eri lì.",
    bonus: bDef,
    fx: fx({ hidden: { motor: 2 }, attrs: { defense: 0.35, athleticism: 0.2 } }),
  },
  {
    id: "p-call",
    lane: "voice",
    ages: ["prime"],
    rounds: ["early"],
    label: "Chiama il blocco, a voce alta",
    detail: "Se non parli, lo schema resta un disegno.",
    flavor: "Due voci, un blocco. Il canestro arriva pulito, e lo staff lo mette sul conto della stanza.",
    bonus: bVoice,
    fx: fx({ hidden: { chemistry: 3 }, attrs: { passing: 0.3, iq: 0.25 }, coachTrust: 2 }),
  },
  {
    id: "p-help",
    lane: "defend",
    ages: ["prime"],
    rounds: ["finals"],
    label: "Aiuta tardi, arrivi lo stesso",
    detail: "Il contrasto bello è quello che non si vede in copertina.",
    flavor: "Un corpo in più sulla linea. Il loro tiratore esita. Basta quello.",
    bonus: bDef,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2, chemistry: 1 }, attrs: { defense: 0.4, iq: 0.2 } }),
  },
  {
    id: "p-glass",
    lane: "body",
    ages: ["prime"],
    rounds: ["conf"],
    label: "Il ferro sporco, tutta la serie",
    detail: "I secondi possessi non fanno titolo. Fanno giugno.",
    flavor: "Una spazzata, poi un'altra. Loro iniziano a guardare le spalle, non il cronometro.",
    bonus: bBody,
    fx: fx({ injuryRisk: 2, hidden: { motor: 2 }, attrs: { rebounding: 0.4, strength: 0.2 } }),
  },
  {
    id: "v-short",
    lane: "pass",
    ages: ["vet"],
    rounds: ["early"],
    label: "Il passaggio corto, quello che tiene",
    detail: "Niente diagonali da copertina. Il possesso vivo, sempre.",
    flavor: "Due metri, un compagno libero. Il palazzetto capisce dopo, lo staff subito.",
    bonus: bPass,
    fx: fx({ hidden: { chemistry: 3, consistency: 2 }, attrs: { passing: 0.4, iq: 0.25 } }),
  },
  {
    id: "v-pick",
    lane: "mind",
    ages: ["vet"],
    rounds: ["finals"],
    label: "Scegli i possessi, lascia i titoli",
    detail: "A quest'età il coraggio è dire no a un tiro storto.",
    flavor: "Un rifiuto, un passaggio, un canestro altrui. La serie, per una sera, ha il tuo orario.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { consistency: 3, ego: -1 }, attrs: { iq: 0.4, passing: 0.2 } }),
  },
  {
    id: "pg-push",
    lane: "shot",
    ages: ALL_AGES,
    rounds: ["early", "conf"],
    roles: ["PG"],
    label: "Primo passo in transizione, sempre",
    detail: "Se aspetti il set, la serie ti passa sopra.",
    flavor: "Rimbalzo, uscita, un tiro in dieci secondi. Il quintetto respira il tuo ritmo.",
    bonus: bShot,
    fx: fx({ form: 0.3, hidden: { motor: 2 }, attrs: { handle: 0.3, shooting: 0.25, athleticism: 0.2 } }),
  },
  {
    id: "wing-cut",
    lane: "pass",
    ages: ALL_AGES,
    rounds: ["early", "conf", "finals"],
    roles: ["SG", "SF"],
    label: "Taglia senza palla, poi finisci",
    detail: "Il secondo taglio è il mestiere che non si fotografa.",
    flavor: "Uno spazio, una ricezione, un canestro da tre metri. Lo schema, per una volta, è una preghiera esaudita.",
    bonus: bPass,
    fx: fx({ hidden: { chemistry: 2, motor: 1 }, attrs: { passing: 0.25, shooting: 0.3, athleticism: 0.2 } }),
  },
  {
    id: "big-seal",
    lane: "mind",
    ages: ALL_AGES,
    rounds: ["early", "conf"],
    roles: ["PF", "C"],
    label: "Tieni la posizione, non il palleggio",
    detail: "L'area si guadagna col petto, poi si finisce.",
    flavor: "Un sigillo, un passaggio interno, due punti sporchi. L'area ha un padrone, e sei tu.",
    bonus: bMind,
    fx: fx({ hidden: { consistency: 2 }, attrs: { strength: 0.3, iq: 0.25, rebounding: 0.2 } }),
  },
  {
    id: "v-age-hold",
    lane: "mind",
    ages: ["vet"],
    rounds: ["early", "conf", "finals"],
    label: "I minuti che restano, tenuti dritti",
    detail: "A quest'età il posto è già una vittoria. Lo tieni, senza copertina.",
    flavor: "Due possessi, tenuti. Lo staff non applaude: annota che ci sei ancora, e questo basta.",
    bonus: bMind,
    fx: fx({ coachTrust: 3, hidden: { consistency: 3, ego: -1 }, attrs: { iq: 0.35, passing: 0.2 } }),
  },
  {
    id: "v-age-voice",
    lane: "voice",
    ages: ["vet"],
    rounds: ["conf", "finals"],
    label: "Due correzioni, e basta",
    detail: "La voce, usata poco, quando serve. I giovani ascoltano.",
    flavor: "Un tempo morto, due nomi, niente teatro. La serie, per un attimo, ha il tuo passo.",
    bonus: bVoice,
    fx: fx({ coachTrust: 4, hidden: { chemistry: 4, ego: -2 }, attrs: { passing: 0.35, iq: 0.3 } }),
  },
  {
    id: "v-age-body",
    lane: "body",
    ages: ["vet"],
    rounds: ["early", "conf"],
    label: "Il corpo firma dopo. Tu firmi adesso",
    detail: "Contatto scelto, niente eroismo vuoto. Durare è già un mestiere.",
    flavor: "Un contatto sì, il secondo no. A giugno le ginocchia te ne sono grate.",
    bonus: bBody,
    fx: fx({ injuryRisk: -1, hidden: { durability: 2, consistency: 2 }, attrs: { rebounding: 0.25, iq: 0.2 } }),
  },
];

function toChoice(d: DoorSrc, identLabel?: string): PlayoffChoice {
  const flavor =
    identLabel && d.lane === "ident"
      ? d.flavor.replace("Qui", identLabel.charAt(0).toUpperCase() + identLabel.slice(1))
      : d.flavor;
  return {
    label: d.label,
    detail: d.detail,
    bonus: d.bonus,
    fx: { ...d.fx, flavor },
  };
}

function labKey(lab: string): string {
  return lab
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function eligible(s: PlayerState, round: number): DoorSrc[] {
  const age = ageBandOf(s);
  const band = roundBandOf(s, round);
  const ident = s.world?.teams[s.team.abbr]?.identity;
  return POOL.filter((d) => {
    if (!d.ages.includes(age)) return false;
    if (!d.rounds.includes(band)) return false;
    if (d.roles && !d.roles.includes(s.role)) return false;
    if (d.identities && ident && !d.identities.includes(ident)) return false;
    if (d.identities && !ident) return false;
    return true;
  });
}

function takeFrom(
  list: DoorSrc[],
  used: DoorSrc[],
  rng: () => number,
  needLane: boolean,
  forbid?: Set<string>,
): DoorSrc | null {
  const lanes = new Set(used.map((d) => d.lane));
  const labs = new Set(used.map((d) => labKey(d.label)));
  const fresh = list.filter(
    (d) => !used.some((u) => u.id === d.id) && !labs.has(labKey(d.label)) && !forbid?.has(labKey(d.label)),
  );
  const diverse = needLane ? fresh.filter((d) => !lanes.has(d.lane)) : fresh;
  const pool = diverse.length ? diverse : fresh;
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)]!;
}

/** Tre etichette distinte. Usato internamente dopo la pescata. */
export function doorsAreUnique(choices: { label: string }[]): boolean {
  const labs = choices.map((c) => labKey(c.label)).filter(Boolean);
  return labs.length >= 3 && new Set(labs).size === labs.length;
}

function fillThree(picked: DoorSrc[], rng: () => number, pool: DoorSrc[]): DoorSrc[] {
  const out = picked.slice();
  let guard = 0;
  while (out.length < 3 && guard++ < 16) {
    const extra = takeFrom(pool.length >= 3 ? pool : POOL, out, rng, true);
    if (!extra) break;
    out.push(extra);
  }
  while (out.length < 3 && guard++ < 28) {
    const extra = takeFrom(POOL, out, rng, false);
    if (!extra) break;
    out.push(extra);
  }
  const seen = new Set<string>();
  const unique: DoorSrc[] = [];
  for (const d of out) {
    const lab = labKey(d.label);
    if (seen.has(lab)) continue;
    seen.add(lab);
    unique.push(d);
  }
  while (unique.length < 3) {
    const extra = takeFrom(POOL, unique, rng, false);
    if (!extra) break;
    unique.push(extra);
  }
  if (unique.length < 3) {
    for (const d of POOL) {
      if (unique.some((u) => u.id === d.id || labKey(u.label) === labKey(d.label))) continue;
      unique.push(d);
      if (unique.length >= 3) break;
    }
  }
  return unique.slice(0, 3);
}

/**
 * Tre porte. Cambiano con età, turno di serie, identità di squadra, ruolo, seed della vita.
 * Stesso (giocatore, round) → stesse tre, così display e resolve non divergono.
 */
export function playoffChoicesFor(s: PlayerState, round: number): PlayoffChoice[] {
  const rng = doorRng(s, round);
  const ident = s.world?.teams[s.team.abbr]?.identity;
  const identLab = ident ? labelIdentity(ident) : undefined;
  const pool = eligible(s, round);
  const identDoors = ident ? pool.filter((d) => d.identities?.includes(ident)) : [];
  const ageTight = pool.filter((d) => d.ages.length <= 2);
  const picked: DoorSrc[] = [];

  const first = takeFrom(identDoors.length ? identDoors : pool, picked, rng, true);
  if (first) picked.push(first);
  const second = takeFrom(ageTight.length ? ageTight : pool, picked, rng, true);
  if (second) picked.push(second);
  const third = takeFrom(pool, picked, rng, true);
  if (third) picked.push(third);

  const three = fillThree(picked, rng, pool);
  const exact = pool.filter((d) => d.rounds.length === 1);
  if (exact.length && !three.some((d) => d.rounds.length === 1)) {
    const swap = takeFrom(exact, three, rng, true) ?? takeFrom(exact, three, rng, false);
    if (swap) three[three.length - 1] = swap;
  }
  for (let i = three.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = three[i]!;
    three[i] = three[j]!;
    three[j] = t;
  }
  let chosen = three;
  let out = chosen.map((d) => toChoice(d, identLab));
  if (!doorsAreUnique(out) && POOL.length >= 3) {
    const repairedSrc = fillThree(three, rng, POOL);
    const repaired = repairedSrc.map((d) => toChoice(d, identLab));
    if (doorsAreUnique(repaired)) {
      chosen = repairedSrc;
      out = repaired;
    } else {
      const forced: DoorSrc[] = [];
      const seen = new Set<string>();
      for (const d of POOL) {
        const k = labKey(d.label);
        if (seen.has(k)) continue;
        seen.add(k);
        forced.push(d);
        if (forced.length === 3) break;
      }
      if (forced.length === 3) {
        chosen = forced;
        out = forced.map((d) => toChoice(d, identLab));
      }
    }
  }
  if (round > 0) {
    const prevLabs = new Set<string>();
    for (let r = 0; r < round; r++) {
      for (const c of playoffChoicesFor(s, r)) prevLabs.add(labKey(c.label));
    }
    if (chosen.some((d) => prevLabs.has(labKey(d.label)))) {
      const swapped = chosen.slice();
      for (let i = 0; i < swapped.length; i++) {
        if (!prevLabs.has(labKey(swapped[i]!.label))) continue;
        const extra = takeFrom(POOL, swapped, rng, true, prevLabs) ?? takeFrom(POOL, swapped, rng, false, prevLabs);
        if (extra) swapped[i] = extra;
      }
      const next = swapped.map((d) => toChoice(d, identLab));
      if (doorsAreUnique(next)) return next;
    }
  }
  return out;
}

export const FALLBACK_DOOR: PlayoffChoice = {
  label: "Tieni il mestiere",
  detail: "Possessi puliti, niente copertine.",
  bonus: bMind,
  fx: {
    coachTrust: 2,
    hidden: { consistency: 2 },
    attrs: { iq: 0.3 },
    flavor: "Niente eroismi. La serie, per una sera, ha il tuo passo, e il passo, tenuto, vale più di una copertina.",
  },
};

export const PLAYOFF_CHOICES: PlayoffChoice[] = [
  toChoice(POOL.find((d) => d.id === "p-iso")!),
  toChoice(POOL.find((d) => d.id === "p-extra")!),
  toChoice(POOL.find((d) => d.id === "p-wall")!),
];
