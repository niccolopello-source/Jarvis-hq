
import { pick, rand } from "./rng";
import { say, sayOr } from "./voice";
import { cloneTeam, EURO_TEAMS, NBA_TEAMS } from "./teams";
import type { Fx, PlayerState, Role, Team } from "./types";

/** Estate automatica: l'utente non sceglie. Tutto può succedere, pesato, NBA-plausibile. */

export type SummerKind =
  | "role-work"
  | "recovery"
  | "lab"
  | "national"
  | "proam"
  | "viral"
  | "rest"
  | "body"
  | "film"
  | "media"
  | "trade"
  | "europe-call"
  | "specialist"
  | "youth-camp"
  | "load"
  | "minicamp"
  | "altitude"
  | "charity"
  | "home"
  | "mobility"
  | "street"
  | "whistle";

export interface SummerPick {
  id: string;
  kind: SummerKind;
  label: string;
  beat: string;
  focusId: string;
  extra?: Omit<Fx, "flavor">;
  move?: "trade" | "europe-feeler";
}

const ROLE_FOCUS: Record<Role, string[]> = {
  PG: ["passing", "handle", "iq", "shooting", "clutch"],
  SG: ["shooting", "two-way", "handle", "athleticism", "clutch"],
  SF: ["two-way", "defense", "shooting", "athleticism", "passing"],
  PF: ["rebounding", "strength", "defense", "iq", "athleticism"],
  C: ["rebounding", "strength", "defense", "iq", "recovery"],
};

function roleFocus(s: PlayerState, avoid?: string): string {
  const list = ROLE_FOCUS[s.role].filter((id) => id !== avoid && id !== s.lastOffseasonId);
  return pick(list.length ? list : ROLE_FOCUS[s.role])!;
}

function sameSummerSlot(last: string, c: { kind: SummerKind; id: string }): boolean {
  if (!last) return false;
  const L = last.toLowerCase();
  if (L === c.kind || L === c.id) return true;
  if (L === `su-${c.kind}`) return true;
  const suffix = c.id.startsWith("su-") ? c.id.slice(3) : c.id;
  if (L === suffix || L === `su-${suffix}`) return true;
  return false;
}

function fl(s: PlayerState, lines: readonly string[]): string {
  const fallback = lines[0] || "Estate già chiusa";
  return sayOr(s, lines, undefined, fallback);
}

function weightedPick<T extends { w: number }>(items: T[]): T {
  const sum = items.reduce((a, x) => a + Math.max(0, x.w), 0) || 1;
  let r = rand() * sum;
  for (const it of items) {
    r -= Math.max(0, it.w);
    if (r <= 0) return it;
  }
  return items[items.length - 1]!;
}

export function pickSummerDestination(s: PlayerState): Team {
  const mineName = s.team?.name || "";
  const mineAbbr = s.team?.abbr || "";
  const leaguePool = s.league === "EuroLega" ? EURO_TEAMS : NBA_TEAMS;
  const pool = leaguePool.filter((t) => t.name !== mineName && t.abbr !== mineAbbr);
  const star = s.overall >= 74;
  const vet = s.age >= 31;
  const want = pool.filter((t) => {
    if (star && !vet) return t.tier === "contender" || t.tier === "mid";
    if (vet && s.overall >= 68) return t.tier === "contender" || t.tier === "mid";
    if (s.overall < 64) return t.tier === "rebuilding" || t.tier === "mid";
    return true;
  });
  const src = want.length ? want : pool;
  const list = src.length ? src : leaguePool.filter((t) => t.abbr !== mineAbbr && t.name !== mineName);
  const table = list.length ? list : leaguePool;
  // Stesso (seed, stagione, maglia) → stessa piazza: il beat e tradeDest concordano.
  let h = ((s.seed || 1) ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ ((s.season || 1) * 0x85ebca6b), 2246822507) >>> 0;
  const tag = mineAbbr;
  for (let i = 0; i < tag.length; i++) h = Math.imul(h ^ tag.charCodeAt(i), 16777619) >>> 0;
  h = Math.imul(h ^ ((s.age + 7) * 0x27d4eb2d), 3266489917) >>> 0;
  const n = table.length || 1;
  const idx = h % n;
  let dest = table[idx] ?? table[0]!;
  if (dest.abbr === mineAbbr || dest.name === mineName) {
    for (let k = 1; k < table.length; k++) {
      const alt = table[(idx + k) % table.length]!;
      if (alt.abbr !== mineAbbr && alt.name !== mineName) {
        dest = alt;
        break;
      }
    }
  }
  return cloneTeam(dest);
}

/**
 * Pesato su età, infortuni, ego, maglia, voce. Mai la stessa estate due volte di fila.
 * Trade e chiamata Europa sono rari e NBA-plausibili.
 */
export function pickSummerEvent(s: PlayerState): SummerPick {
  const last = s.lastOffseasonId;
  const unhappy = s.coachTrust < 40 || s.hidden.chemistry < 38 || s.morale < 40;
  const inj = s.injuryRisk >= 42 || s.injuryDrag >= 4;
  const contender = s.team.tier === "contender";
  const nba = s.league === "NBA";

  type Cand = { kind: SummerKind; id: string; w: number; build: () => SummerPick };
  const cands: Cand[] = [
    {
      kind: "role-work",
      id: "su-role",
      w: 26,
      build: () => {
        const focusId = roleFocus(s);
        return {
          id: "su-role",
          kind: "role-work",
          label: fl(s, [
            "Estate chiusa sul ruolo, senza pubblico",
            "Tre settimane di mestiere, già fatte",
            "Ripetizioni, specchio, nient'altro: è andata così",
            "Il gesto, di nuovo, finché ha smesso di essere una decisione",
            "Estate sul ruolo, già chiusa, senza testimoni",
            "Luglio sul mestiere, nudo, già speso",
            "Tre settimane sullo specchio, senza copertina",
            "Lavoro sul ruolo, luglio già chiuso",
            "Senza pubblico, tre settimane sul gesto",
          ]),
          beat: fl(s, [
            "Niente amichevoli da copertina. Solo il lavoro che ottobre chiederà.",
            "Tre settimane sporche. A ottobre si vedrà se sono bastate.",
            "Sudore senza testimoni. Il ruolo, a settembre, è un altro di un palmo.",
            "Hai chiuso luglio in palestra. Lo staff, a settembre, lo capisce dal passo.",
            "Ripetizioni, specchio, nient'altro. Il ruolo, a ottobre, parla da solo.",
            "L'estate, nuda: gli stessi tiri, lo stesso specchio, un polso che a settembre non è più una domanda.",
            "Hai tenuto il mestiere quando nessuno guardava. A ottobre il passo lo dice, senza che tu debba dichiararlo.",
            "Niente copertina. Il ruolo, a ottobre, è più stretto e più tuo.",
            "Luglio è restato in palestra. Settembre legge il passo, non le interviste.",
          ]),
          focusId,
        };
      },
    },
    {
      kind: "recovery",
      id: "su-recovery",
      w: (inj ? 22 : 4) + (s.age >= 33 ? 16 : s.age >= 30 ? 6 : 0),
      build: () => ({
        id: "su-recovery",
        kind: "recovery",
        label: fl(s, [
          "Estate di tregua, già spesa",
          "Ghiaccio, sonno, pazienza: tre settimane così",
          "Il corpo ha chiesto tregua. Gliel'hai data",
          "Manutenzione, non vacanza. È andata così",
          "Estate di ghiaccio e pazienza, già spesa",
          "La tregua del corpo, tenuta per intero",
          "Tre settimane di ghiaccio, già chiuse",
          "Tregua del corpo, già firmata",
          "Sonno, ghiaccio, un luglio tenuto",
        ]),
        beat: fl(s, [
          "Luglio è stato una stanza chiusa: ghiaccio, camminate, la pazienza che a vent'anni non avevi.",
          "Hai dormito, camminato, tornato. L'orgoglio, a quest'età, è arrivare a ottobre intero.",
          "La tregua non è stata pigrizia. È la forma più adulta del lavoro, e l'hai tenuta.",
          "Il corpo ha chiesto tregua. Gliel'hai data, a pezzi, come si dà da bere a qualcuno che non deve spegnersi.",
          "Estate corta. Pesi leggeri, sonno lungo, un fisioterapista che ormai conosce i tuoi silenzi, e non li traduce.",
          "Arrivare a ottobre intero: a quest'età è l'unico orgoglio che conta, e tu l'hai tenuto senza dichiararlo.",
          "Hai dato al corpo ciò che a vent'anni chiamavi pigrizia. Adesso è mestiere.",
          "Manutenzione vera: camminate, sonno, niente teatro. Arrivi a ottobre in piedi.",
          "Le articolazioni hanno avuto un luglio. A settembre non presentano il conto in anticipo.",
        ]),
        focusId: "recovery",
        extra: { injuryRisk: -4, injuryDrag: -0.4, hidden: { durability: 2 } },
      }),
    },
    {
      kind: "lab",
      id: "su-lab",
      w: s.role === "C" || s.role === "PF" ? 6 : 12,
      build: () => ({
        id: "su-lab",
        kind: "lab",
        label: fl(s, [
          "Laboratorio di tiro, tre settimane",
          "Mille uscite, lo stesso specchio: estate chiusa così",
          "Il gesto, nudo, ripetuto fino ad agosto",
          "Palestra vuota, mille uscite, estate così",
          "Estate sul polso, senza pubblico",
          "Lo specchio, il gesto, nient'altro: tre settimane",
          "Il polso, nudo, per tre settimane",
          "Tiri, specchio, estate già spesa",
          "Un laboratorio senza pubblico, già chiuso",
        ]),
        beat: fl(s, [
          "Hai ripetuto finché il polso ha smesso di essere una domanda.",
          "Pochi testimoni, molti tiri. Il miglioramento, se c'è, non ha fatto rumore.",
          "Agosto è stato una stanza senza pubblico. Meglio: si lavorava sul vero.",
          "Tre volte al giorno, la stessa uscita. A settembre il gesto è un altro.",
          "Mille uscite, lo stesso specchio. Il polso, a settembre, non è più una domanda.",
          "Palestra vuota, il gesto nudo. A ottobre lo staff lo capisce dal polso.",
          "Hai contato le uscite, non i filmati. A settembre il gesto è più corto e più vero.",
          "Il laboratorio ha avuto un agosto. Lo staff, al primo allenamento, lo legge dal polso.",
          "Niente amichevoli. Solo ripetizioni, e un ferro che a ottobre non chiede più il nome.",
        ]),
        focusId: s.role === "PG" ? "handle" : "shooting",
      }),
    },
    {
      kind: "national",
      id: "su-national",
      w: s.international ? 8 : s.age <= 26 ? 5 : 3,
      build: () => ({
        id: "su-national",
        kind: "national",
        label: fl(s, [
          "Finestra della tua Nazionale, già giocata",
          "Tre gare, un aereo, un'altra maglia: estate così",
          "La maglia che non sta nel contratto, indossata",
          "Tre sere per il tuo paese, già giocate",
          "Un'altra maglia, un luglio già chiuso",
          "La maglia che non paga i minuti, indossata",
          "Tre gare per il paese, già chiuse",
          "La finestra azzurra, già giocata",
          "Un luglio in un'altra maglia, tenuto",
        ]),
        beat: fl(s, [
          "Tre gare, un fuso, un orgoglio che non sta nel referto. Sei tornato.",
          "Sei tornato con le gambe pesanti e la testa più larga. Il club ha fatto due conti.",
          "Un'altra lingua in panchina. Il blocco e uscita, però, era lo stesso.",
          "La maglia che non sta nel contratto, indossata. Tre gare, e sei tornato.",
          "Un aereo, tre gare, un'altra maglia. Il club, a settembre, fa due conti.",
          "La tua Nazionale non paga i minuti di club. Paga un altro debito, e tu lo sai.",
          "Tre sere per il paese. Il club, a settembre, conta le gambe, non i titoli.",
          "Hai indossato un'altra maglia. Sei tornato con la testa più larga, e basta.",
          "La finestra, già giocata. Un debito diverso, e tu lo hai pagato senza dichiararlo.",
        ]),
        focusId: "iq",
        extra: { publicImage: 3, injuryRisk: 3, hidden: { clutch: 1, chemistry: 1 } },
      }),
    },
    {
      kind: "proam",
      id: "su-proam",
      w: s.age <= 26 ? 9 : s.age <= 30 ? 4 : 1,
      build: () => ({
        id: "su-proam",
        kind: "proam",
        label: fl(s, [
          "Un torneo estivo, asfalto, nient'altro: è successo",
          "Partite vere, senza staff, già giocate",
          "Un palazzetto piccolo, una fame grande, un luglio",
          "Estate sul cemento, già chiusa",
          "Un torneo senza minutaggi, già giocato",
          "Fame da palazzetto piccolo, tenuta",
          "Asfalto, un luglio già speso",
          "Un torneo vero, senza copertina",
          "Cemento, fame, estate già chiusa",
        ]),
        beat: fl(s, [
          "Sudore diverso. Ti ha ricordato perché hai cominciato, e quanto costa continuare.",
          "Niente minutaggi. Solo tiri, e un pubblico che non ti doveva niente.",
          "Sei tornato con le mani segnate e un gesto un po' più tuo.",
          "Un palazzetto piccolo, una fame grande. Il gesto, lì, è tornato a essere solo un gesto.",
          "Partite vere, senza staff. Sudore diverso, e una fame che a volte si era spenta.",
          "Asfalto, un pubblico che non ti doveva niente. Tu hai tirato lo stesso.",
          "Un torneo senza copertina. Le mani, a settembre, sono segnate, e il gesto è più tuo.",
          "Cemento, un luglio. Ti ha ricordato il primo tiro, e quanto costa ancora.",
          "Senza staff, senza minuti. Solo il gesto, e una fame che a volte si era spenta.",
        ]),
        focusId: s.age <= 23 ? "athleticism" : "handle",
        extra: { form: 0.3, hidden: { motor: 1 }, injuryRisk: 2 },
      }),
    },
    {
      kind: "viral",
      id: "su-viral",
      w: (s.hidden.ego >= 58 ? 7 : 3) + (s.age <= 24 ? 4 : 0),
      build: () => ({
        id: "su-viral",
        kind: "viral",
        label: fl(s, [
          "Un filmato in palestra ha fatto il giro",
          "L'estate è finita su un telefono",
          "Filmati estivi, lavoro vero sotto: è andata così",
          "Una sequenza, troppi occhi, estate così",
          "Troppi occhi su un telefono, luglio chiuso",
          "Hai spento la telecamera, estate così",
          "Una sequenza virale, lavoro sotto",
          "Il filmato ha girato, tu sei rimasto",
          "Estate da telefono, già spenta",
        ]),
        beat: fl(s, [
          "I numeri sotto al filmato non contavano. Contava se a ottobre il gesto è ancora tuo.",
          "Qualcuno in spogliatoio ha già visto la sequenza. Tu hai fatto finta di no, e hai tirato ancora.",
          "La fame, filmata. Poi hai spento il telefono e sei rimasto, e il gesto, senza pubblico, è tornato tuo.",
          "Troppi occhi su un telefono. Tu hai spento, e il lavoro, sotto, è rimasto lo stesso di sempre.",
          "Un gesto è uscito dal palazzetto. Tu sei rimasto dentro, che è più raro.",
          "La rete ha trovato un tuo possesso. L'inverno, poi, chiede gli altri settantanove.",
          "Hai spento la telecamera. Il gesto, senza pubblico, è tornato tuo.",
          "Un filmato, troppi occhi. Il lavoro, sotto, è rimasto lo stesso di sempre.",
          "La fame filmata, poi il silenzio. A ottobre il gesto è ancora tuo, o no.",
        ]),
        focusId: "athleticism",
        extra: { publicImage: 4, hidden: { ego: 2, mediaSavvy: 2, workEthic: 1 } },
      }),
    },
    {
      kind: "rest",
      id: "su-rest",
      w: s.age >= 30 ? 9 : s.age >= 27 ? 5 : 2,
      build: () => ({
        id: "su-rest",
        kind: "rest",
        label: fl(s, [
          "Due settimane di tregua, già prese",
          "Silenzio di luglio, tenuto",
          "Hai spento tutto, due settimane",
          "Tregua di luglio, già spesa",
          "Il telefono in borsa, due settimane",
          "Estate spenta, e basta",
          "Due settimane senza schema, già prese",
          "Luglio spento, tenuto intero",
          "Tregua nuda, già firmata",
        ]),
        beat: fl(s, [
          "Un'estate corta di lavoro, lunga di sonno. Novembre, poi, ti trova in piedi.",
          "Il telefono è rimasto in borsa. Il corpo, per una volta, non ha chiesto scusa.",
          "Niente trekking, niente show. Solo la manutenzione di ciò che resta.",
          "Due settimane di tregua, già prese. Il corpo, per una volta, ringrazia in silenzio.",
          "Hai spento tutto. Novembre ti trova in piedi, senza dichiararlo.",
          "Silenzio di luglio, tenuto. Il giorno dopo il tiro, stranamente, è uscito più pulito.",
          "Due settimane senza schema. Il corpo ha ringraziato senza chiedere scusa.",
          "Hai spento il mestiere. A settembre il tiro, stranamente, è uscito più pulito.",
          "Tregua nuda. Novembre ti trova in piedi, e questo basta.",
        ]),
        focusId: "recovery",
        extra: { morale: 4, form: 0.25, hidden: { durability: 2, motor: -1 } },
      }),
    },
    {
      kind: "body",
      id: "su-body",
      w: 7,
      build: () => ({
        id: "su-body",
        kind: "body",
        label: fl(s, [
          "Il corpo, rimesso a pezzi in estate",
          "Sala, cucina, nient'altro: tre settimane così",
          "Meno chili, o più. Il mestiere ha deciso.",
          "Estate di bilancia e di sonno",
          "Tre settimane sul corpo, già spese",
          "Lo specchio, giudice, un luglio",
          "Bilancia, sonno, estate già spesa",
          "Il corpo, rimesso, un luglio tenuto",
          "Sala e cucina, tre settimane chiuse",
        ]),
        beat: fl(s, [
          "Lo specchio è stato un giudice onesto. A settembre il primo passo è un altro.",
          "Niente filmati. Solo i numeri sulla bilancia, e un fisioterapista che ormai ti conosce.",
          "Lavoro sporco. Il contatto, a ottobre, lo sente prima la difesa avversaria.",
          "Il corpo, rimesso a pezzi. A ottobre il primo contatto è tuo, non del fisioterapista.",
          "Sala, cucina, nient'altro. A settembre il primo passo è un altro.",
          "Hai messo peso dove serve. Il resto, a settembre, è un negoziato più corto.",
          "Tre settimane sul corpo. A ottobre il primo contatto è tuo.",
          "La bilancia ha detto la sua. Tu hai firmato, e il primo passo, a settembre, è un altro.",
          "Niente copertina. Solo chili, sonno, un contatto che a ottobre è tuo.",
        ]),
        focusId: s.age >= 31 ? "strength" : "athleticism",
        extra: { hidden: { workEthic: 2, durability: 1 }, injuryRisk: 1 },
      }),
    },
    {
      kind: "film",
      id: "su-film",
      w: 9,
      build: () => ({
        id: "su-film",
        kind: "film",
        label: fl(s, [
          "Estate passata in sala video",
          "I possessi degli altri, a volume basso, per settimane",
          "Schemi, studio avversari, una matita: estate così",
          "Una stanza buia, i possessi riletti, già chiusa",
          "Estate in una stanza buia, già chiusa",
          "I possessi riletti, un luglio tenuto",
          "Sala video, matita, nient'altro",
          "Tre settimane di schemi, già spese",
          "Luglio sui filmati, senza pubblico",
        ]),
        beat: fl(s, [
          "Niente sudore da copertina. A ottobre le letture arriveranno un tempo prima.",
          "Hai riletto una serie. Hai trovato un possesso che non avevi visto. Basta quello.",
          "Lo staff, a settembre, trova gli appunti già fatti. Non è gloria. È mestiere.",
          "Una stanza, una matita, i possessi che nessuno taglia. A ottobre le letture arrivano un tempo prima.",
          "Estate in una stanza buia. I possessi degli altri, a volume basso, e tu che annoti.",
          "Niente sudore da copertina. A ottobre le letture arriveranno un tempo prima, e nessuno chiederà perché.",
          "Hai riletto una serie. Hai trovato un possesso che non avevi visto. Lo tieni per l'inverno.",
          "Tre settimane di filmati. Lo staff, a settembre, trova gli appunti già fatti.",
          "Una matita, una stanza, i possessi. A ottobre le letture arrivano un tempo prima.",
        ]),
        focusId: "iq",
        extra: { hidden: { consistency: 2 }, coachTrust: 2 },
      }),
    },
    {
      kind: "media",
      id: "su-media",
      w: (s.hidden.mediaSavvy >= 60 ? 7 : 3) + (s.publicImage >= 70 ? 3 : 0),
      build: () => ({
        id: "su-media",
        kind: "media",
        label: fl(s, [
          "Un documentario, o quasi: è uscito",
          "Microfoni d'estate, già spenti",
          "La voce, fuori dal parquet, usata",
          "Due interviste, niente più: estate così",
          "Hai parlato poco, e l'estate è passata",
          "La voce, usata fuori, già spenta",
          "Due microfoni, poi il silenzio",
          "Parlato poco, luglio già chiuso",
          "La voce fuori, già spesa",
        ]),
        beat: fl(s, [
          "Hai parlato. Non troppo. I titoli hanno scelto tre frasi; tu ne avevi dette dieci.",
          "L'estate è diventata un racconto. Il lavoro, sotto, è continuato comunque.",
          "Qualche credito in più, in conferenza. In palestra, lo stesso sudore.",
          "Due interviste, niente più. Il mestiere, stavolta, è stato non diventare un titolo.",
          "Hai parlato poco. I giorni, senza microfono, sono tornati tuoi.",
          "Microfoni d'estate, già spenti. In palestra, lo stesso sudore.",
          "Due microfoni, poi il silenzio. Il mestiere è stato non diventare un titolo.",
          "Hai parlato poco. I giorni senza microfono sono tornati tuoi, e il sudore è lo stesso.",
          "La voce, usata fuori, già spenta. In palestra, lo stesso lavoro.",
        ]),
        focusId: "iq",
        extra: { publicImage: 5, hidden: { mediaSavvy: 3, ego: 1 } },
      }),
    },
    {
      kind: "trade",
      id: "su-trade",
      w:
        (s.yearsOnTeam < 2 ? 1.2 : 2.4) +
        (s.contract.kind === "rookie" && s.season <= 2 ? 0.7 : 0) +
        (unhappy ? 8 : 0) +
        (s.team.tier === "rebuilding" && s.overall >= 74 ? 6 : 0) +
        (contender && s.overall < 64 && s.age >= 27 ? 5 : 0) +
        (s.yearsOnTeam >= 5 && s.overall >= 70 ? 3 : 0) +
        (s.hidden.ego >= 72 && !contender ? 3 : 0),
      build: () => {
        const dest = pickSummerDestination(s);
        const city = dest.city;
        const abbr = dest.abbr;
        return {
        id: "su-trade",
        kind: "trade",
        label: fl(s, [
          "Il tuo nome ha girato tutto luglio",
          "Voci di scambio, tutta l'estate",
          "La dirigenza ha fatto i conti. I tuoi no",
          "Una piazza nuova sul foglio, già nominata",
          "L'estate è stata un corridoio di voci",
          "Il mercato ti ha mosso, almeno a parole",
          "Uno scambio, parlato sopra la tua testa",
          "Il nome, girato, un luglio tenuto",
          "Voci di piazza, già ascoltate",
        ]),
        beat: fl(s, [
          `Non eri al tavolo. ${city} (${abbr}) è nel foglio, e il mercato ha parlato sopra la tua testa.`,
          `Voci, smentite, un silenzio. A ${city} qualcuno ha fatto il tuo nome; a settembre l'armadietto è ancora tuo.`,
          `Qualcuno ha scritto ${city} (${abbr}) sul foglio. Tu hai fatto la valigia, poi l'hai disfatta. Per ora.`,
          `${city} è una piazza vera, non una voce. L'estate l'ha nominata; tu non sei stato al tavolo.`,
          `A ${city} (${abbr}) il tuo nome è uscito da un ufficio. Tu hai tenuto il mestiere, e la valigia semiaperta.`,
          `Il foglio dice ${city}. Non è un addio: è un'estate in cui la piazza ha un altro nome, e tu lo sai.`,
          `La dirigenza ha fatto i conti. I tuoi no. ${city} (${abbr}) resta nel foglio, come una porta socchiusa.`,
          `${city}: una piazza, un corridoio, un'altra insegna. Per ora è solo una frase, e pesa lo stesso.`,
          `Voci, un silenzio, ${city}. L'armadietto, a settembre, sa ancora di attesa.`,
        ]),
        focusId: roleFocus(s, "recovery"),
        move: "trade",
        extra: { hidden: { chemistry: -2 }, morale: -2 },
      };
      },
    },
    {
      kind: "europe-call",
      id: "su-europe",
      w: !nba || s.age < 30 ? 0 : 5 + (s.age >= 33 ? 6 : 0) + (s.age >= 35 ? 5 : 0) + (contender ? 2 : 4),
      build: () => ({
        id: "su-europe",
        kind: "europe-call",
        label: fl(s, [
          "Una chiamata da Europa, già arrivata",
          "Un agente, un fuso, un'altra idea di giugno",
          "L'ultimo atto, nominato, non firmato",
          "Una porta, socchiusa, in un'altra lingua",
          "Europa, nominata, non firmata",
          "Un altro fuso, la stessa palla, un luglio",
          "Una porta europea, già nominata",
          "L'ultimo atto, ascoltato, non firmato",
          "Un fuso, una voce, un luglio tenuto",
        ]),
        beat: fl(s, [
          "Non è stato un addio. È una porta, socchiusa, in un'altra lingua. Resta sul tavolo.",
          "Palazzetti più piccoli, tattica più stretta. Te lo hanno detto piano, come un rispetto.",
          "Un ultimo atto diverso. Il ruolo, la voce, poi — se serve — l'Europa.",
          "Una voce da un altro fuso. Non hai firmato. Hai ascoltato. L'inverno, poi, deciderà.",
          "Europa resta una frase, per ora. Una frase che a quest'età pesa.",
          "Una chiamata, nominata, non firmata. Il ruolo, qui, viene prima.",
          "Una porta in un'altra lingua. Resta sul tavolo, e pesa.",
          "Non hai firmato. Hai ascoltato. L'inverno, poi, deciderà se quella porta serve.",
          "Palazzetti più stretti, un ultimo atto nominato. Per ora è solo una frase.",
        ]),
        focusId: "iq",
        move: "europe-feeler",
        extra: { publicImage: 1, hidden: { mediaSavvy: 2 } },
      }),
    },
    {
      kind: "specialist",
      id: "su-spec",
      w: 8,
      build: () => ({
        id: "su-spec",
        kind: "specialist",
        label: fl(s, [
          "Due settimane da uno specialista, alle spalle",
          "Un maestro, una palestra vuota, un luglio",
          "Il gesto, corretto di un grado",
          "Estate da specialista, già chiusa",
          "Un grado sul gesto, tenuto",
          "Due settimane, un maestro, nient'altro",
          "Luglio su un gesto solo, già speso",
          "Una correzione, tenuta, un luglio",
          "Il maestro, il gesto, estate chiusa",
        ]),
        beat: fl(s, [
          "Niente telecamere. Un uomo, una palla, una correzione che tieni per l'inverno.",
          "Il tiro è cambiato di un grado. Le gare, a ottobre, no — e questo è il punto.",
          "Sei tornato con una uscita nuova. Lo staff la vede al primo allenamento.",
          "Un gesto solo, ripetuto fino a settembre. Lo staff lo vede prima del tabellone.",
          "Hai stretto il mestiere a una cosa. A ottobre quella cosa tiene.",
          "Due settimane da uno specialista. Una correzione, tenuta, e il resto è rumore.",
          "Una correzione, un grado. A ottobre lo staff lo legge dal polso, non dalla copertina.",
          "Palestra vuota, un maestro. Il gesto, a settembre, è un altro di un palmo.",
          "Hai tenuto la correzione. Il resto, a ottobre, è rumore.",
        ]),
        focusId: s.attrs.shooting >= s.attrs.defense ? "shooting" : "defense",
        extra: { development: 0.15, hidden: { workEthic: 2 } },
      }),
    },
    {
      kind: "youth-camp",
      id: "su-camp",
      w: s.age >= 31 ? 7 : s.age >= 28 ? 3 : 0,
      build: () => ({
        id: "su-camp",
        kind: "youth-camp",
        label: fl(s, [
          "Un campus, i ragazzi, la voce: estate così",
          "Hai insegnato, e il gesto è tornato",
          "Estate da tutore, già chiusa",
          "Ragazzi, un ferro, tre giorni già chiusi",
          "Hai corretto un polso, estate così",
          "La voce da tutore, già spesa",
          "Tre giorni da tutore, già chiusi",
          "I ragazzi, la voce, un luglio tenuto",
          "Un campus, già archiviato",
        ]),
        beat: fl(s, [
          "Hai corretto un polso. Il ragazzo ha fatto canestro. Qualcosa si è chiuso, in pace.",
          "La voce, usata così, è valsa più di un giro in più in sala pesi.",
          "Sei tornato con le mani meno dure e la testa più chiara. Il ruolo, adesso, include questo.",
          "Ragazzini, un ferro storto, tre giorni. Sei tornato con le mani più calme.",
          "Hai insegnato un'uscita. Per una settimana il tuo gesto è stato più pulito.",
          "Un campus, i ragazzi, la voce. Hai insegnato, e il gesto è tornato.",
          "Tre giorni da tutore. La voce, usata così, vale più di un giro in sala pesi.",
          "Hai corretto un polso. Il gesto, il tuo, è tornato più pulito.",
          "I ragazzi, un ferro. Sei tornato con le mani più calme, e la testa più chiara.",
        ]),
        focusId: "passing",
        extra: { hidden: { chemistry: 3, ego: -2 }, publicImage: 3, attrs: { iq: 0.2, passing: 0.15 } },
      }),
    },
    {
      kind: "load",
      id: "su-load",
      w: s.age >= 28 ? 6 : 3,
      build: () => ({
        id: "su-load",
        kind: "load",
        label: fl(s, [
          "Il carico, misurato e già firmato",
          "Meno chili sulla barra, più anni",
          "Il fisioterapista ha vinto la discussione",
          "Volume misurato, luglio già chiuso",
          "Due sedute in meno, già decise",
          "Il carico, trattato da adulto",
          "Carico misurato, già firmato",
          "Due sedute tagliate, un luglio tenuto",
          "Il volume, trattato da adulto",
        ]),
        beat: fl(s, [
          "Non è stata pigrizia. È un calendario che arriva a maggio, se lo tratti da adulto.",
          "Hai tagliato due sedute. Il tendine, a ottobre, non presenta il conto in anticipo.",
          "Lo staff ha firmato il programma. Tu hai firmato il sonno.",
          "Carico vero, non da copertina. A settembre le gambe arrivano già scritte.",
          "Hai tenuto il volume. Ottobre, poi, non chiede una prova: chiede continuità.",
          "Meno chili sulla barra, più anni. Il fisioterapista ha vinto, e tu hai firmato.",
          "Due sedute in meno. Il tendine, a ottobre, non presenta il conto in anticipo.",
          "Il carico, trattato da adulto. A settembre le gambe arrivano già scritte.",
          "Hai firmato il sonno. Ottobre non chiede una prova: chiede continuità.",
        ]),
        focusId: "recovery",
        extra: { injuryRisk: -6, hidden: { durability: 3, motor: -1 } },
      }),
    },
    {
      kind: "minicamp",
      id: "su-mini",
      w: s.age <= 23 ? 8 : 2,
      build: () => ({
        id: "su-mini",
        kind: "minicamp",
        label: fl(s, [
          "Ritiro breve: tre giorni, troppi occhi, già finito",
          "Un invito estivo, una gerarchia nuova",
          "Ti hanno guardato. Tu hai tirato.",
          "Tre giorni, troppi occhi, già finiti",
          "Ritiro breve, già archiviato",
          "Un invito, tre sessioni, nient'altro",
          "Tre giorni di ritiro, già chiusi",
          "Un invito estivo, già archiviato",
          "Troppi occhi, tre sessioni, estate così",
        ]),
        beat: fl(s, [
          "Niente contratto in palio, e invece sì: i minuti di ottobre si decidono anche così.",
          "Due possessi puliti, uno sporco. Lo staff ha preso appunti. Tu hai fatto finta di non vederli.",
          "Sei tornato più stanco e più visibile. È il mestiere, a quest'età.",
          "Ritiro breve, poche sessioni, niente teatro. Lo staff ha preso nota del passo.",
          "Tre giorni con i nuovi. Tu hai tenuto il tono, e basta.",
          "Ti hanno guardato. Tu hai tirato. I minuti di ottobre si decidono anche così.",
          "Tre sessioni, troppi occhi. Lo staff ha preso nota del passo, e basta.",
          "Un ritiro breve. I minuti di ottobre si decidono anche così, e tu lo sai.",
          "Poche sessioni, niente teatro. Tu hai tenuto il tono, e lo staff ha preso appunti.",
        ]),
        focusId: roleFocus(s),
        extra: { publicImage: 2, coachTrust: 2, hidden: { workEthic: 2 } },
      }),
    },
    {
      kind: "altitude",
      id: "su-air",
      w: s.age <= 28 ? 6 : 3,
      build: () => ({
        id: "su-air",
        kind: "altitude",
        label: fl(s, [
          "Due settimane in quota, già scese",
          "Aria sottile, gambe dure, un luglio così",
          "L'estate è finita più in alto del parquet",
          "Estate in quota, già scesa",
          "Due settimane d'aria sottile",
          "Luglio più in alto del parquet",
          "Quota, fiato corto, estate già scesa",
          "Due settimane d'aria, già scese",
          "In alto, un luglio tenuto",
        ]),
        beat: fl(s, [
          "Hai corso dove l'aria manca. A ottobre il primo contropiede è più lungo, e tu lo sai.",
          "Niente pubblico, solo il fiato corto. Il corpo, a settembre, ha un altro serbatoio.",
          "Due settimane in quota. Sei sceso più magro e più cattivo, nel modo giusto.",
          "Due settimane in quota. Sei sceso con un altro serbatoio, e ottobre lo sentirà.",
          "Aria sottile, gambe dure. Il primo contropiede di ottobre è più lungo.",
          "L'estate è finita più in alto del parquet. Sei sceso con un altro fiato.",
          "Aria sottile. Sei sceso con un altro serbatoio, e ottobre lo sentirà.",
          "Hai corso in quota. Il primo contropiede di ottobre è più lungo, e tu lo sai.",
          "Niente pubblico, solo il fiato. Sei sceso più magro, nel modo giusto.",
        ]),
        focusId: "athleticism",
        extra: { injuryRisk: 2, hidden: { motor: 2, durability: 1 }, attrs: { athleticism: 0.25 } },
      }),
    },
    {
      kind: "charity",
      id: "su-charity",
      w: 5 + (s.publicImage >= 64 ? 3 : 0) + (s.age >= 27 ? 2 : 0),
      build: () => ({
        id: "su-charity",
        kind: "charity",
        label: fl(s, [
          "Una gara di beneficenza, già giocata",
          "Un palazzetto pieno per altro, un luglio",
          "Hai messo la maglia per qualcuno, non per te",
          "Una sera per altri, già giocata",
          "Niente classifica, un luglio tenuto",
          "Maglia per qualcuno, estate così",
          "Una serata per altri, già chiusa",
          "Beneficenza, già giocata, un luglio",
          "Il gesto per qualcuno, tenuto",
        ]),
        beat: fl(s, [
          "Hai giocato per altri. Il gesto è rimasto tuo, la sera è stata di qualcun altro.",
          "Un palazzetto pieno, niente classifica. Sei tornato più leggero, e lo staff lo ha letto nel passo.",
          "Niente minuti da copertina. Una serata che non sta nel contratto, e l'hai tenuta.",
          "Hai messo la maglia per qualcuno, non per te. Il gesto è rimasto tuo.",
          "Una gara di beneficenza, già giocata. Sei tornato più leggero.",
          "Niente classifica. Una serata per altri, e il passo, a settembre, è più calmo.",
          "Una serata per altri. Il gesto è rimasto tuo, e lo staff lo ha letto nel passo.",
          "Niente classifica, una maglia per qualcuno. Sei tornato più leggero.",
          "Hai giocato per altri. A settembre il passo è più calmo, e questo basta.",
        ]),
        focusId: "passing",
        extra: { publicImage: 4, hidden: { chemistry: 2, ego: -1, mediaSavvy: 2 } },
      }),
    },
    {
      kind: "home",
      id: "su-home",
      w: 4 + (s.age <= 23 ? 3 : 0) + (s.morale < 48 ? 3 : 0),
      build: () => ({
        id: "su-home",
        kind: "home",
        label: fl(s, [
          "Due settimane a casa, già prese",
          "La tavola di luglio, tenuta",
          "Sei tornato dove il mestiere non entra",
          "Casa, luglio, già fatti",
          "Due settimane lontano dal mestiere",
          "Estate a tavola, senza schemi",
          "Sei tornato a casa, e basta",
          "Tavola, silenzio, un luglio tenuto",
          "Due settimane a casa, già chiuse",
        ]),
        beat: fl(s, [
          "Hai spento il mestiere due settimane. A settembre il tiro è uscito più pulito, stranamente.",
          "Casa, tavola, silenzio. Il corpo ha ringraziato senza chiedere scusa.",
          "Niente schemi. Solo volti che non votano i minuti. Sei tornato più intero.",
          "Due settimane a casa. Il mestiere, spento, ti ha restituito un pezzo di te.",
          "La tavola di luglio, tenuta. A settembre il tiro è uscito più pulito.",
          "Sei tornato dove il mestiere non entra. Poi sei rientrato più intero.",
          "Due settimane lontano. Il corpo ha ringraziato, e il tiro, a settembre, è uscito più pulito.",
          "Casa, silenzio. Sei tornato più intero, senza dichiararlo.",
          "Niente schemi, solo volti. A settembre il mestiere è più tuo.",
        ]),
        focusId: "recovery",
        extra: { morale: 5, form: 0.2, hidden: { durability: 1, chemistry: 1 } },
      }),
    },
    {
      kind: "mobility",
      id: "su-move",
      w: 5 + (s.age >= 29 ? 5 : 0) + (s.injuryRisk >= 30 ? 3 : 0),
      build: () => ({
        id: "su-move",
        kind: "mobility",
        label: fl(s, [
          "Estate di mobilità, già fatta",
          "Anca, caviglia, nient'altro: tre settimane così",
          "Il fisioterapista ha vinto, e tu hai firmato",
          "Tre settimane di gradi, già spese",
          "Estate sulle articolazioni, tenuta",
          "Anca e caviglia, un luglio paziente",
          "Gradi, non chili: estate già fatta",
          "Tre settimane articolari, già spese",
          "Anca, caviglia, un luglio tenuto",
        ]),
        beat: fl(s, [
          "Niente chili sulla barra. Solo gradi di movimento. A ottobre il primo passo è più lungo.",
          "Hai lavorato dove non si vede. Le ginocchia, a novembre, non presentano il conto in anticipo.",
          "Tre settimane di pazienza articolare. Il mestiere, a quest'età, passa di lì.",
          "Estate di gradi, non di chili. A ottobre il primo passo è più lungo.",
          "Anca, caviglia, nient'altro. Le ginocchia, a novembre, non presentano il conto.",
          "Il fisioterapista ha vinto, e tu hai firmato. A ottobre il passo è più lungo.",
          "Solo gradi di movimento. A ottobre il primo passo è più lungo, e le ginocchia tacciono.",
          "Tre settimane articolari. Il mestiere, a quest'età, passa di lì, e tu l'hai tenuto.",
          "Hai lavorato dove non si vede. A ottobre il passo è più lungo.",
        ]),
        focusId: "recovery",
        extra: { injuryRisk: -3, hidden: { durability: 2, consistency: 1 } },
      }),
    },
    {
      kind: "street",
      id: "su-street",
      w: s.age <= 25 ? 7 : s.age <= 29 ? 3 : 1,
      build: () => ({
        id: "su-street",
        kind: "street",
        label: fl(s, [
          "Campetti, asfalto, un luglio già chiuso",
          "Partite vere senza staff, già giocate",
          "Un ferro storto, una fame dritta, un'estate",
          "Estate d'asfalto, già chiusa",
          "Un ferro storto, tre sere, nient'altro",
          "Fame da campetto, tenuta",
          "Asfalto storto, un luglio tenuto",
          "Campetti, già giocati, estate così",
          "Un ferro, una fame, già chiusi",
        ]),
        beat: fl(s, [
          "Asfalto storto, tabelloni che cantano. Ti ha ricordato perché hai cominciato, e quanto costa continuare.",
          "Niente minutaggi. Solo tiri, e un pubblico che non ti doveva niente.",
          "Sei tornato con le mani segnate e un gesto un po' più tuo, senza testimoni da contratto.",
          "Campetti, asfalto, un luglio già chiuso. Le mani, a settembre, sono segnate.",
          "Un ferro storto, una fame dritta. Sei tornato con un gesto un po' più tuo.",
          "Partite vere senza staff. Sudore diverso, e una fame che a volte si era spenta.",
          "Asfalto, un ferro storto. Le mani, a settembre, sono segnate, e il gesto è più tuo.",
          "Senza staff, solo tiri. Una fame dritta, e tu sei tornato con le mani segnate.",
          "Campetti, un luglio. Ti ha ricordato perché hai cominciato, senza testimoni da contratto.",
        ]),
        focusId: s.age <= 23 ? "handle" : "athleticism",
        extra: { form: 0.25, hidden: { motor: 1, chemistry: 1 }, injuryRisk: 2 },
      }),
    },
    {
      kind: "whistle",
      id: "su-whistle",
      w: 4 + (s.attrs.iq >= 58 ? 3 : 0),
      build: () => ({
        id: "su-whistle",
        kind: "whistle",
        label: fl(s, [
          "Due giorni con gli arbitri, già fatti",
          "Il fischio, studiato da vicino, un luglio",
          "Estate sul regolamento, non sul gesto",
          "Due giorni di palmo, già letti",
          "Il fischio da vicino, un luglio tenuto",
          "Regolamento, non gesto: estate così",
          "Due giorni di fischio, già letti",
          "Il palmo, studiato, un luglio chiuso",
          "Regolamento da vicino, già fatto",
        ]),
        beat: fl(s, [
          "Hai visto il contatto dall'altra sponda. A ottobre le mani sono più basse, e i fischi anche.",
          "Due giorni di regolamento. Lo staff, a settembre, trova un giocatore che non discute il palmo: lo legge.",
          "Niente sudore da copertina. Una lettura del fischio che tiene per l'inverno.",
          "Due giorni con gli arbitri. A ottobre le mani sono più basse.",
          "Il fischio, studiato da vicino. Lo staff trova un giocatore che legge il palmo.",
          "Estate sul regolamento, non sul gesto. Una lettura che tiene per l'inverno.",
          "Hai letto il palmo dall'altra sponda. A ottobre le mani sono più basse.",
          "Due giorni con gli arbitri. Una lettura del fischio che tiene per l'inverno.",
          "Il regolamento, da vicino. Lo staff trova un giocatore che legge il palmo, non lo discute.",
        ]),
        focusId: "iq",
        extra: { hidden: { consistency: 2 }, coachTrust: 2, attrs: { iq: 0.25, defense: 0.15 } },
      }),
    },
  ];

  const live = cands.filter((c) => {
    if (c.w <= 0) return false;
    if (sameSummerSlot(last, c)) return false;
    return true;
  });
  const fallback =
    cands.find((c) => c.w > 0 && !sameSummerSlot(last, c)) ??
    cands.find((c) => !sameSummerSlot(last, c)) ??
    cands[0]!;
  const chosen = (live.length ? weightedPick(live) : fallback).build();
  return chosen;
}

export function summerKindFeel(s: PlayerState, kind: SummerKind, label: string): string {
  const map: Partial<Record<SummerKind, readonly string[]>> = {
    recovery: [
      "Estate corta. Pesi leggeri, sonno lungo, un fisioterapista che ormai conosce i tuoi silenzi.",
      "Il corpo ha chiesto tregua. Gliel'hai data, a pezzi, come si dà da bere a qualcuno che non deve spegnersi.",
      "La tregua del corpo è la forma più adulta del lavoro. L'hai tenuta, senza chiedere che qualcuno la chiami coraggio.",
      "Luglio è stato una stanza chiusa: ghiaccio, camminate, la pazienza che a vent'anni non avevi.",
    ],
    "role-work": [
      "Estate sul ruolo, nient'altro. A settembre lo staff lo capisce dal passo, non dalle dichiarazioni.",
      "Hai lavorato il mestiere, non la copertina. Ottobre lo dirà prima di te.",
      "Tre settimane di mestiere, già fatte. A ottobre il passo lo dice, senza che tu debba dichiararlo.",
      "Ripetizioni, specchio, nient'altro. Il ruolo, a ottobre, parla da solo.",
      "L'estate, nuda: gli stessi tiri, lo stesso specchio, un polso che a settembre non è più una domanda.",
      "Hai tenuto il mestiere quando nessuno guardava. A ottobre il passo lo dice.",
    ],
    "europe-call": [
      "Una voce da un altro fuso. Non hai firmato. Hai ascoltato. L'inverno, poi, deciderà.",
      "Europa resta una frase, per ora. Una frase che a quest'età pesa.",
      "Una porta, socchiusa, in un'altra lingua. Resta sul tavolo.",
      "Palazzetti più piccoli, tattica più stretta. Te lo hanno detto piano, come un rispetto.",
      "Il ruolo, la voce, poi — se serve — l'Europa. Per ora è solo una porta socchiusa.",
      "Un ultimo atto nominato, non firmato. L'inverno, poi, deciderà.",
    ],
    national: [
      "La maglia della tua Nazionale non sta nel contratto. Sta in un'altra stanza del mestiere, e l'hai indossata.",
      "Tre gare, un aereo, un'altra maglia. Sei tornato con le gambe pesanti e la testa più larga.",
      "Un'altra lingua in panchina. Il blocco e uscita, però, era lo stesso.",
      "La finestra della tua Nazionale, già giocata. Il club, a settembre, fa due conti.",
      "Tre gare, un fuso, un orgoglio che non sta nel referto. Sei tornato.",
      "La tua Nazionale non paga i minuti di club. Paga un altro debito, e tu lo sai.",
    ],
    rest: [
      "Due settimane senza schema. Il giorno dopo il tiro, stranamente, è uscito più pulito.",
      "Hai spento tutto. Il corpo, per una volta, non ha chiesto scusa.",
      "Un'estate corta di lavoro, lunga di sonno. Novembre, poi, ti trova in piedi.",
      "Il telefono è rimasto in borsa. Il corpo, per una volta, ringrazia in silenzio.",
      "Niente trekking, niente show. Solo la manutenzione di ciò che resta.",
      "Silenzio di luglio, tenuto. Il giorno dopo il tiro esce più pulito.",
    ],
    viral: [
      "Un gesto è uscito dal palazzetto. Tu sei rimasto dentro, che è più raro.",
      "La rete ha trovato un tuo possesso. L'inverno, poi, chiede gli altri settantanove.",
      "L'estate è finita su un telefono. Tu hai spento, e sei rimasto in palestra.",
      "Un filmato, troppi occhi. Il lavoro, sotto, è rimasto lo stesso di sempre.",
      "Hai spento la telecamera. Il gesto, senza pubblico, è tornato tuo.",
      "Troppi occhi su un telefono. Tu hai spento, e il lavoro è rimasto lo stesso.",
    ],
    body: [
      "Estate di chili e di sonno. A ottobre il primo contatto è tuo, non del fisioterapista.",
      "Hai messo peso dove serve. Il resto, a settembre, è un negoziato più corto.",
      "Lo specchio è stato un giudice onesto. A settembre il primo passo è un altro.",
      "Niente filmati. Solo i numeri sulla bilancia, e un fisioterapista che ormai ti conosce.",
      "Lavoro sporco. Il contatto, a ottobre, lo sente prima la difesa avversaria.",
      "Sala, cucina, nient'altro. A ottobre il primo contatto è tuo.",
    ],
    media: [
      "Due interviste, niente più. Il mestiere, stavolta, è stato non diventare un titolo.",
      "Hai parlato poco. I giorni, senza microfono, sono tornati tuoi.",
      "Hai parlato. Non troppo. I titoli hanno scelto tre frasi; tu ne avevi dette dieci.",
      "L'estate è diventata un racconto. Il lavoro, sotto, è continuato comunque.",
      "Qualche credito in più, in conferenza. In palestra, lo stesso sudore.",
      "Microfoni d'estate, già spenti. In palestra, lo stesso sudore.",
    ],
    specialist: [
      "Un gesto solo, ripetuto fino a settembre. Lo staff lo vede prima del tabellone.",
      "Hai stretto il mestiere a una cosa. A ottobre quella cosa tiene.",
      "Niente telecamere. Un uomo, una palla, una correzione che tieni per l'inverno.",
      "Il tiro è cambiato di un grado. Le gare, a ottobre, no — e questo è il punto.",
      "Sei tornato con una uscita nuova. Lo staff la vede al primo allenamento.",
      "Due settimane da uno specialista. Una correzione, tenuta, e il resto è rumore.",
    ],
    "youth-camp": [
      "Ragazzini, un ferro storto, tre giorni. Sei tornato con le mani più calme.",
      "Hai insegnato un'uscita. Per una settimana il tuo gesto è stato più pulito.",
      "Hai corretto un polso. Il ragazzo ha fatto canestro. Qualcosa si è chiuso, in pace.",
      "La voce, usata così, è valsa più di un giro in più in sala pesi.",
      "Hai insegnato, e il gesto è tornato. Strano, e giusto.",
      "Un campus, i ragazzi, la voce. Sei tornato con le mani meno dure.",
    ],
    load: [
      "Carico vero, non da copertina. A settembre le gambe arrivano già scritte.",
      "Hai tenuto il volume. Ottobre, poi, non chiede una prova: chiede continuità.",
      "Non è stata pigrizia. È un calendario che arriva a maggio, se lo tratti da adulto.",
      "Hai tagliato due sedute. Il tendine, a ottobre, non presenta il conto in anticipo.",
      "Lo staff ha firmato il programma. Tu hai firmato il sonno.",
      "Meno chili sulla barra, più anni. A settembre le gambe arrivano già scritte.",
    ],
    minicamp: [
      "Ritiro breve, poche sessioni, niente teatro. Lo staff ha preso nota del passo.",
      "Tre giorni con i nuovi. Tu hai tenuto il tono, e basta.",
      "Niente contratto in palio, e invece sì: i minuti di ottobre si decidono anche così.",
      "Due possessi puliti, uno sporco. Lo staff ha preso appunti.",
      "Ti hanno guardato. Tu hai tirato. I minuti di ottobre si decidono anche così.",
      "Sei tornato più stanco e più visibile. È il mestiere, a quest'età.",
    ],
    trade: [
      "Il mercato ha parlato sopra la tua testa. Tu hai fatto la valigia, poi l'hai disfatta.",
      "Una piazza vera sul foglio. Tu non eri al tavolo, e l'estate è passata così.",
      "Voci, smentite, un silenzio. L'armadietto, a settembre, sa ancora di attesa.",
      "Qualcuno ha fatto il tuo nome. Per ora resta una frase, e pesa.",
      "Lo scambio è una porta socchiusa. Tu tieni il mestiere, e la valigia semiaperta.",
      "Il foglio ha un'altra insegna. Tu non hai firmato: hai ascoltato, e questo basta.",
      "L'estate ti ha mosso a parole. Il parquet, a ottobre, è ancora questo — per ora.",
    ],
    altitude: [
      "Due settimane in quota. Sei sceso con un altro serbatoio, e ottobre lo sentirà.",
      "Aria sottile, gambe dure. Il primo contropiede di ottobre è più lungo.",
      "Hai corso dove l'aria manca. A ottobre il primo contropiede è più lungo, e tu lo sai.",
      "Niente pubblico, solo il fiato corto. Il corpo, a settembre, ha un altro serbatoio.",
      "Sei sceso più magro e più cattivo, nel modo giusto.",
      "L'estate è finita più in alto del parquet. Sei sceso con un altro fiato.",
    ],
    charity: [
      "Hai giocato per altri. Il gesto è rimasto tuo, la sera è stata di qualcun altro.",
      "Un palazzetto pieno, niente classifica. Sei tornato più leggero, e lo staff lo ha letto nel passo.",
      "Niente minuti da copertina. Una serata che non sta nel contratto, e l'hai tenuta.",
      "Hai messo la maglia per qualcuno, non per te. Il gesto è rimasto tuo.",
      "Una gara di beneficenza, già giocata. Sei tornato più leggero.",
      "Niente classifica. Una serata per altri, e il passo, a settembre, è più calmo.",
    ],
    home: [
      "Due settimane a casa. Il mestiere, spento, ti ha restituito un pezzo di te.",
      "Casa, tavola, silenzio. Il corpo ha ringraziato senza chiedere scusa.",
      "Hai spento il mestiere due settimane. A settembre il tiro è uscito più pulito, stranamente.",
      "Niente schemi. Solo volti che non votano i minuti. Sei tornato più intero.",
      "La tavola di luglio, tenuta. A settembre il tiro è uscito più pulito.",
      "Sei tornato dove il mestiere non entra. Poi sei rientrato più intero.",
    ],
    mobility: [
      "Estate di gradi, non di chili. A ottobre il primo passo è più lungo.",
      "Hai lavorato dove non si vede. Le ginocchia, a novembre, non presentano il conto in anticipo.",
      "Niente chili sulla barra. Solo gradi di movimento. A ottobre il primo passo è più lungo.",
      "Tre settimane di pazienza articolare. Il mestiere, a quest'età, passa di lì.",
      "Anca, caviglia, nient'altro. Le ginocchia, a novembre, non presentano il conto.",
      "Il fisioterapista ha vinto, e tu hai firmato. A ottobre il passo è più lungo.",
    ],
    street: [
      "Asfalto, un ferro storto, una fame dritta. Sei tornato con le mani segnate.",
      "Niente minutaggi. Solo tiri, e un pubblico che non ti doveva niente.",
      "Asfalto storto, tabelloni che cantano. Ti ha ricordato perché hai cominciato.",
      "Sei tornato con le mani segnate e un gesto un po' più tuo, senza testimoni da contratto.",
      "Campetti, asfalto, un luglio già chiuso. Le mani, a settembre, sono segnate.",
      "Partite vere senza staff. Sudore diverso, e una fame che a volte si era spenta.",
    ],
    whistle: [
      "Hai visto il contatto dall'altra sponda. A ottobre le mani sono più basse.",
      "Due giorni di regolamento. Lo staff trova un giocatore che legge il palmo, non lo discute.",
      "Niente sudore da copertina. Una lettura del fischio che tiene per l'inverno.",
      "Due giorni con gli arbitri. A ottobre le mani sono più basse, e i fischi anche.",
      "Il fischio, studiato da vicino. Lo staff trova un giocatore che legge il palmo.",
      "Estate sul regolamento, non sul gesto. Una lettura che tiene per l'inverno.",
    ],
    film: [
      "Estate in una stanza buia. I possessi degli altri, a volume basso, e tu che annoti.",
      "Niente sudore da copertina. A ottobre le letture arriveranno un tempo prima, e nessuno chiederà perché.",
      "Hai riletto una serie. Hai trovato un possesso che non avevi visto. Basta quello, e lo tieni per l'inverno.",
    ],
    lab: [
      "Mille uscite, lo stesso specchio. Il polso, a settembre, non è più una domanda.",
      "Hai ripetuto finché il polso ha smesso di essere una domanda.",
      "Pochi testimoni, molti tiri. Il miglioramento, se c'è, non ha fatto rumore.",
      "Agosto è stato una stanza senza pubblico. Meglio: si lavorava sul vero.",
      "Tre volte al giorno, la stessa uscita. A settembre il gesto è un altro.",
      "Palestra vuota, il gesto nudo. A ottobre lo staff lo capisce dal polso.",
    ],
    proam: [
      "Un torneo estivo, asfalto, nient'altro. Sudore diverso, e una fame che a volte si era spenta.",
      "Niente minutaggi. Solo tiri, e un pubblico che non ti doveva niente.",
      "Sei tornato con le mani segnate e un gesto un po' più tuo.",
      "Un palazzetto piccolo, una fame grande. Il gesto, lì, è tornato a essere solo un gesto.",
      "Partite vere, senza staff. Sudore diverso, e una fame che a volte si era spenta.",
      "Asfalto, un pubblico che non ti doveva niente. Tu hai tirato lo stesso.",
    ],
  };
  const pool = map[kind];
  if (!pool || !pool.length) return label || "Estate già chiusa";
  return say(s, pool) || label || "Estate già chiusa";
}
