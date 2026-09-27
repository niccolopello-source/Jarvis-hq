
import type { AttrKey, DraftCard, HiddenKey } from "./types";

/** Round 9–10: carattere. Quattro carte, se ne mostrano tre. */
export const CHARACTER_ROUNDS: {
  key: AttrKey;
  label: string;
  prompt: string;
  cards: DraftCard[];
}[] = [
  {
    key: "iq",
    label: "Carattere",
    prompt: "Chi sei quando nessuno tiene il conto?",
    cards: [
      {
        name: "L'Etica",
        desc: "Arrivi prima, resti dopo. Il talento viene dopo il lavoro.",
        primary: { key: "iq", delta: 4 },
        secondary: [{ key: "athleticism", delta: 2 }],
        hidden: { workEthic: 10, consistency: 4, ego: -3 } satisfies Partial<Record<HiddenKey, number>>,
      },
      {
        name: "Il Motore",
        desc: "Non spegni. Secondo salto, terzo possesso, ancora fiato.",
        primary: { key: "athleticism", delta: 5 },
        secondary: [{ key: "defense", delta: 2 }],
        hidden: { motor: 10, durability: 2, consistency: -2 },
      },
      {
        name: "Il Clutch",
        desc: "Gli ultimi tre minuti ti appartengono. Il resto, lo sopporti.",
        primary: { key: "shooting", delta: 4 },
        secondary: [{ key: "handle", delta: 2 }],
        hidden: { clutch: 10, ego: 3, chemistry: -2 },
      },
      {
        name: "Il Corpo",
        desc: "Tieni il contatto. La stagione lunga non ti piega al primo colpo.",
        primary: { key: "strength", delta: 5 },
        secondary: [{ key: "rebounding", delta: 2 }],
        hidden: { durability: 10, workEthic: 3, motor: -1 },
      },
    ],
  },
  {
    key: "iq",
    label: "Voce",
    prompt: "Cosa lasci nello spogliatoio?",
    cards: [
      {
        name: "Il Collante",
        desc: "Tieni insieme i silenzi. I compagni ti cercano senza dirtelo.",
        primary: { key: "passing", delta: 4 },
        secondary: [{ key: "iq", delta: 3 }],
        hidden: { chemistry: 10, ego: -4, mediaSavvy: 2 },
      },
      {
        name: "L'Orgoglio",
        desc: "Vuoi la palla e la responsabilità. Qualcuno lo chiamerà ego.",
        primary: { key: "handle", delta: 4 },
        secondary: [{ key: "shooting", delta: 3 }],
        hidden: { ego: 8, clutch: 5, chemistry: -3 },
      },
      {
        name: "Il Media",
        desc: "Sai parlare. La città ti riconosce prima del tabellone.",
        primary: { key: "iq", delta: 3 },
        secondary: [{ key: "shooting", delta: 2 }],
        hidden: { mediaSavvy: 10, chemistry: 2, workEthic: -2 },
      },
      {
        name: "La Costanza",
        desc: "Niente notti da 40 e crolli da 6. Una linea, tutta l'inverno.",
        primary: { key: "iq", delta: 4 },
        secondary: [{ key: "defense", delta: 2 }],
        hidden: { consistency: 10, clutch: 2, motor: 2 },
      },
    ],
  },
];
