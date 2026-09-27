
import { rand } from "./rng";
import { say } from "./voice";
import type { PlayerState, StoryEvent } from "./types";

function fl(s: PlayerState, lines: readonly string[]) {
  return say(s, lines) || "";
}

type LateRung = 32 | 33 | 34 | 35 | 36;

function lateRung(age: number): LateRung {
  if (age >= 36) return 36;
  if (age >= 35) return 35;
  if (age >= 34) return 34;
  if (age >= 33) return 33;
  return 32;
}

function ageWord(age: number): string {
  if (age === 32) return "Trentadue anni";
  if (age === 33) return "Trentatré anni";
  if (age === 34) return "Trentaquattro anni";
  if (age === 35) return "Trentacinque anni";
  if (age >= 36) return "Trentasei anni";
  return `${age} anni`;
}

/** Eventi di chiusura: stessa vita, stessa linea temporale, ultime stagioni (32-36). */
export function lateCareerEvent(s: PlayerState): StoryEvent {
  const last = s.seasonHistory[s.seasonHistory.length - 1];
  const years = s.yearsOnTeam;
  const id = `late-${s.season}-${s.age}`;
  const rung = lateRung(s.age);

  if (s.age >= 32 && rand() < 0.38) {
    const nba = s.league === "NBA";
    const thin = nba && (s.team.tier === "contender" || s.team.power >= 84);
    const lineTitle =
      rung === 32
        ? "La linea dei trentadue"
        : rung === 33
          ? "La linea dei trentatré"
          : rung === 34
            ? "La linea dei trentaquattro"
            : rung === 35
              ? "La linea dei trentacinque"
              : "La linea dei trentasei";
    return {
      id,
      phase: "veteran",
      title: say(s, [
        lineTitle,
        "L'anno che non torna",
        "Prima che giugno sia un ricordo",
        "Il contratto con il corpo",
        "Gli ultimi ottobre",
        "Una primavera da pesare",
        "Ruolo, voce, poi il resto",
        "Prima il posto, poi il resto",
        "Il conto con le ginocchia",
        "Una firma, ogni ottobre",
        "Il mestiere, da qui in poi",
        "Prima che il corpo alzi la voce",
      ]),
      subtitle: say(s, [
        `${ageWord(s.age)}. ${s.team.city} sa che questa potrebbe essere l'ultima primavera. Tu lo sai prima di loro.`,
        `Lo specchio non mente. Il contratto è corto. ${s.coachName} ti chiede come vuoi scendere, da qui a giugno.`,
        `A ${s.age} anni ogni ottobre è una firma. ${s.team.city} aspetta di capire se firmi ancora.`,
        `Il campionato riparte. Tu conti i minuti che restano, non quelli che hai già dato.`,
        `Prima il ruolo, poi la voce. L'Europa, se arriva, è l'ultimo atto — non la fuga.`,
        `A ${s.age} anni il campionato riparte. Tu conti i minuti che restano, e li tieni dritti.`,
        `A ${s.age} anni il posto viene prima della copertina. ${s.team.city} lo misura in minuti, non in interviste.`,
        `${ageWord(s.age)}, e il corpo fa l'appello prima dello staff. Tu rispondi ancora sì.`,
        `Ottobre a ${s.team.city}: non è un arrivo. È un accordo col fisico, rinnovato un inverno alla volta.`,
        `La linea dei ${s.age}. Non è un numero tondo: è un modo di scendere, e di restare.`,
        `${ageWord(s.age)}. Il posto, tenuto, vale più di una copertina che nessuno chiede più.`,
        `A ${s.team.city} l'armadietto è ancora tuo. ${ageWord(s.age)}: da qui a giugno, questo è già una vittoria.`,
      ]),
      choices: [
        {
          label:
            rung === 36
              ? "I minuti che restano"
              : rung === 35
                ? "Il posto, tenuto"
                : rung === 34
                  ? "Il ruolo che ti resta"
                  : rung === 33
                    ? "I minuti, chiesti chiaro"
                    : "Il ruolo, tenuto",
          detail: "Minuti veri, o quelli che tieni. Prima di tutto, il posto.",
          fx: () => ({
            development: 0.3,
            coachTrust: 2,
            attrs: { shooting: 0.2, iq: 0.25 },
            hidden: { consistency: 2, ego: 1 },
            flavor: fl(s, [
              "Chiedi il ruolo, non la copertina. Te lo danno a pezzi. Li tieni.",
              "I minuti che restano, detti chiaro. Il corpo firma dopo.",
              "Un posto, anche piccolo. Senza posto non c'è voce, e lo sai.",
              "Il ruolo prima della voce. Te lo tieni, anche se è più stretto di un tempo.",
              "Il posto, tenuto. A quest'età è già una vittoria, e non la dichiari.",
              "Minuti veri, o quelli che tieni. Prima di tutto, il posto, e lo tieni.",
            ]),
          }),
        },
        {
          label:
            rung === 36
              ? "La stanza, tenuta insieme"
              : rung === 35
                ? "Due correzioni, e basta"
                : rung === 34
                  ? "La voce dello spogliatoio"
                  : rung === 33
                    ? "Lo spogliatoio, tenuto"
                    : "La voce, usata poco",
          detail: "Meno possessi, più senso. I giovani ascoltano.",
          fx: () => ({
            coachTrust: 5,
            hidden: { chemistry: 6, ego: -3, mediaSavvy: 2 },
            attrs: { passing: 0.35, iq: 0.4 },
            flavor: fl(s, [
              "Non sei più il piano. Sei chi tiene insieme il piano.",
              "Due correzioni in allenamento. Lui alza lo sguardo. La carriera si passa così.",
              "La voce, usata così, vale più di un giro in più in sala pesi.",
              "Parli poco, e il poco tiene la stanza. A quest'età è il mestiere vero.",
              "Due frasi, niente teatro. Lo spogliatoio, tenuto, è già un mestiere.",
              "La stanza si tiene con poco. Tu usi poco, e il poco basta.",
            ]),
          }),
        },
        nba
          ? {
              label:
                rung === 36
                  ? "L'Europa, se resta un senso"
                  : rung === 35
                    ? "Un giugno diverso"
                    : rung === 34
                      ? "Un ultimo atto in Europa"
                      : rung === 33
                        ? "L'Europa, nominata"
                        : "Una porta, in un'altra lingua",
              detail: thin
                ? "Cifra magra, palazzetti stretti. Non è una fuga: è una chiusura."
                : "Palazzetti stretti, tattica lunga. Non è una fuga: è una chiusura.",
              fx: () => ({
                publicImage: 2,
                hidden: { mediaSavvy: 3, chemistry: 1 },
                attrs: { iq: 0.25 },
                flavor: fl(s, thin
                  ? [
                      "L'offerta è magra. Il senso, se c'è, sta nel mestiere, non nella cifra.",
                      "Da contendente l'Europa non compra il nome: compra gli ultimi possessi, a poco.",
                      "Ascolti. Il ruolo e la voce vengono prima; questa porta, magra, resta l'ultimo atto.",
                      "Cifra piccola, senso pieno. Non è una fuga: è una chiusura, se i minuti spariscono.",
                      "L'Europa, da qui, è magra. Tu ascolti, non firmi, e tieni il posto.",
                      "Una porta in un'altra lingua, e magra. Il ruolo, qui, viene prima.",
                    ]
                  : [
                      "Non firmi. Ascolti. L'Europa resta una porta socchiusa, e a quest'età le porte pesano.",
                      "Un altro fuso, la stessa palla. Il ruolo e la voce vengono prima; questo, se arriva, è l'ultimo atto.",
                      "Palazzetti più piccoli, teste più larghe. Non è un ritiro: è un altro giugno, se lo vuoi.",
                      "Una chiamata da un altro fuso. La tieni in tasca, e il ruolo, qui, resta il primo conto.",
                      "L'Europa è una frase. A quest'età le frasi pesano, e questa di più.",
                      "Non è un addio. È una porta, nominata, non firmata, e tu la lasci socchiusa.",
                    ]),
              }),
            }
          : {
              label: "Lavori per chi viene dopo",
              detail: "Un ragazzo guarda. Tu gli fai spazio.",
              fx: () => ({
                hidden: { chemistry: 6, workEthic: 3, ego: -2 },
                attrs: { iq: 0.3 },
                coachTrust: 3,
                flavor: fl(s, [
                  "Due correzioni in allenamento. Lui alza lo sguardo. La carriera si passa così.",
                  "Gli fai spazio. Non è un funerale: è un passaggio, e lui lo capisce.",
                  "Un ragazzo ripete il tuo gesto. Per una volta ti basta.",
                  "Lavori per chi viene dopo. Il gesto, passato, resta tuo lo stesso.",
                  "Uno spazio, un ragazzo, una correzione. La carriera, così, non si chiude: si passa.",
                  "Gli lasci un possesso. Lui lo tiene. Per una sera ti basta.",
                ]),
              }),
            },
      ],
    };
  }

  if (s.league === "NBA" && s.age >= 30 && rand() < 0.24) {
    const thin = s.team.tier === "contender" || s.team.power >= 84;
    return {
      id,
      phase: "veteran",
      title: say(s, [
        "Una porta in un'altra lingua",
        "L'ultimo atto, nominato",
        "Europa, se resta un senso",
        "Un giugno diverso, se serve",
        "Una porta, socchiusa, in un'altra lingua",
        "L'ultimo atto, detto piano",
      ]),
      subtitle: say(s, thin
        ? [
            `Da contendente l'offerta è magra. Prima il ruolo, poi la voce. L'Europa, se arriva, è l'ultimo atto — non una fuga da ${s.team.city}.`,
            "Una chiamata da un altro fuso, cifra piccola, senso pieno. Non è un ritiro: è un altro giugno, se i minuti qui spariscono.",
            `A ${s.age} anni le porte si contano. Questa parla un'altra lingua, e non compra il nome.`,
            `Da ${s.team.city} l'Europa è magra. Tu ascolti, e il posto, qui, resta il primo conto.`,
            "Cifra piccola. Il senso, se c'è, sta nel mestiere. Tu non firmi: tieni la porta socchiusa.",
            `Una porta in un'altra lingua. Da contendente non compra il nome: compra gli ultimi possessi, a poco.`,
          ]
        : [
            `Prima il ruolo, poi la voce. L'Europa, se arriva, è l'ultimo atto — non una fuga da ${s.team.city}.`,
            "Una chiamata da un altro fuso. Palazzetti più stretti, tattica più lunga. Non è un ritiro: è un altro giugno.",
            `A ${s.age} anni le porte si contano. Questa parla un'altra lingua, e pesa.`,
            `Da ${s.team.city} una voce in un'altra lingua. Tu ascolti, e non fai la valigia.`,
            "Palazzetti stretti, teste larghe. L'Europa resta una frase, e a quest'età le frasi pesano.",
            "Non è un addio. È una porta, nominata, non firmata. Resta sul tavolo.",
          ]),
      choices: [
        {
          label: "Ascolti, non firmi",
          detail: "La porta resta socchiusa. Il ruolo, qui, viene prima.",
          fx: () => ({
            hidden: { mediaSavvy: 2, consistency: 2 },
            attrs: { iq: 0.2 },
            flavor: fl(s, [
              "Non è un addio. È una frase, tenuta in tasca, per l'estate.",
              `Ascolti. Il ruolo a ${s.team.city} resta il primo conto.`,
              "La porta resta socchiusa. Tu non la chiudi, e non la attraversi.",
              "Ascolti, non firmi. Il mestiere, qui, viene prima di un altro fuso.",
              "Una frase in tasca. L'estate, poi, deciderà se tirarla fuori.",
              `Non giuri. Non rifiuti. A ${s.team.city} il corridoio è ancora tuo.`,
            ]),
          }),
        },
        {
          label: "La tieni come chiusura possibile",
          detail: thin
            ? "Offerta magra. Se i minuti spariscono, l'Europa è un mestiere, non un esilio."
            : "Se i minuti spariscono, l'Europa è un mestiere, non un esilio.",
          fx: () => ({
            publicImage: 2,
            hidden: { mediaSavvy: 3 },
            flavor: fl(s, thin
              ? [
                  "Un ultimo atto diverso, e magro. Lo nomini, non lo giuri.",
                  "La cifra non compra il nome. Compra gli ultimi possessi, se restano.",
                  "Offerta magra. Se i minuti spariscono, l'Europa è un mestiere, non un esilio.",
                  "La tieni come chiusura. Non come fuga. La differenza, a quest'età, conta.",
                  "Un giugno diverso, se serve. Magro, e detto chiaro.",
                  "La porta, magra, resta aperta. Tu la nomini, e basta.",
                ]
              : [
                  "Un ultimo atto diverso. Lo nomini, non lo giuri.",
                  "Palazzetti pieni, tattica stretta. Se arriva, arriva da adulto.",
                  "La tieni come chiusura possibile. Non è un esilio: è un mestiere.",
                  "Un altro giugno, se i minuti spariscono. Lo nomini, piano.",
                  "L'Europa, detta così, non è una fuga. È una porta, e tu la conosci.",
                  "La chiudi come ipotesi. Il ruolo, qui, resta il primo conto.",
                ]),
          }),
        },
        {
          label: "Restare è già una scelta",
          detail: "La voce, qui, non si imballa. Il ruolo viene prima.",
          fx: () => ({
            coachTrust: 3,
            hidden: { chemistry: 4, ego: -1 },
            attrs: { passing: 0.2, iq: 0.2 },
            flavor: fl(s, [
              `A ${s.team.city} il corridoio è ancora tuo. L'Europa può aspettare.`,
              "Chiudi la porta, piano. Il gruppo sente che resti.",
              "Restare è già una scelta. La voce, qui, non si imballa.",
              "Niente valigia. Il ruolo, tenuto, vale più di un altro fuso.",
              `A ${s.team.city} l'armadietto è tuo. Lo tieni, e basta.`,
              "Chiudi la porta. Non è un giuramento: è un modo di stare.",
            ]),
          }),
        },
      ],
    };
  }

  if (s.titleCount >= 1 && rand() < 0.5) {
    const n = s.titleCount;
    const word = n === 1 ? "un anello" : `${n} anelli`;
    return {
      id,
      phase: "veteran",
      title: say(s, [
        "Quello che hai già alzato",
        "Il fermo immagine di giugno",
        "L'anello, e il dopo",
        "Giugno in una stanza, di nuovo",
        "Quello che hai già alzato, e ottobre",
      ]),
      subtitle: say(s, [
        `In sala video passa un fermo immagine di giugno. ${word}. La stanza tace mezzo secondo di troppo.`,
        `Un ragazzo nuovo chiede com'è, l'anello. Non è una domanda da spogliatoio. Lo è diventata.`,
        `${word} in bacheca. Oggi è ottobre, e l'anello non gioca per te.`,
        `Giugno è in una foto. Oggi è ottobre, e ${word} non copre i possessi.`,
        `La stanza tace su ${word}. Tu non fai il museo. Fai il mestiere.`,
        `${word}. Una sera ti chiedono com'è. Tu racconti poco, e il poco basta.`,
      ]),
      choices: [
        {
          label: "Racconti poco, e il poco basta",
          detail: "Il rispetto, a voce bassa.",
          fx: () => ({
            hidden: { chemistry: 5, ego: -1 },
            attrs: { iq: 0.3 },
            flavor: fl(s, [
              "Non fai il museo. Fai il mestiere. Si capisce lo stesso.",
              "Due frasi, niente video. Il rispetto, a quest'età, è basso e fermo.",
              "Racconti poco. Lo spogliatoio capisce il poco, e basta.",
              "Niente fermo immagine. Il mestiere, nudo, vale più dell'anello in bacheca.",
              "Due minuti, voce bassa. Il rispetto, tenuto così, non ha bisogno di una targa.",
              "Racconti poco, e il poco tiene la stanza. Poi ottobre, che è più onesto.",
            ]),
          }),
        },
        {
          label: "Usi la fame di allora",
          detail: "Non è nostalgia: è un metodo.",
          fx: () => ({
            form: 0.5,
            development: 0.3,
            attrs: { shooting: 0.3, defense: 0.2 },
            hidden: { clutch: 3, motor: 2 },
            flavor: fl(s, [
              "Il corpo ricorda giugno. Per una settimana tiri come allora.",
              "La fame di allora torna per sette giorni. Poi resta il mestiere, che è meglio.",
              "Usi l'anello come sveglia, non come altare.",
              "La fame, ripresa. Il ferro, quella settimana, è più onesto.",
              "Giugno torna nelle mani. Lo usi, poi lo metti via.",
              "Non è nostalgia: è un metodo. Per sette giorni il gesto è quello di allora.",
            ]),
          }),
        },
        {
          label: "Chiudi il discorso",
          detail: "Quello è stato. Questo è adesso.",
          fx: () => ({
            hidden: { consistency: 3, ego: 2 },
            attrs: { iq: 0.2 },
            flavor: fl(s, [
              "Niente altari. Il prossimo possesso è l'unico che conta.",
              "Chiudi il discorso. Resta ottobre, che è più onesto di giugno.",
              "Quello è stato. Questo si gioca adesso, senza cornice.",
              "Niente museo. Ottobre non legge le bacheche, e tu nemmeno.",
              "Chiudi. Il prossimo possesso non ha un anello, e questo è il punto.",
              "Quello è stato. Questo è adesso. La differenza, tenuta, è il mestiere.",
            ]),
          }),
        },
      ],
    };
  }

  if (years >= 5) {
    return {
      id,
      phase: "veteran",
      title: say(s, [
        `Ancora ${s.team.city}`,
        `La stessa insegna, ${years} inverni`,
        `Casa, se questa parola tiene`,
        `${years} inverni, la stessa porta`,
        `Il corridoio di ${s.team.city}`,
        `Fedeltà, o abitudine`,
      ]),
      subtitle: say(s, [
        `${years} stagioni sotto la stessa insegna. C'è chi chiama questo fedeltà. C'è chi lo chiama abitudine.`,
        `I tifosi ti riconoscono dal passo, non dal numero. ${years} anni. ${s.team.name}.`,
        `${s.team.city} è un corridoio che conosci al buio. ${years} anni non sono un caso.`,
        `${years} inverni. I tifosi ti riconoscono dal passo. Tu riconosci i muri, e resti.`,
        `Ancora ${s.team.city}. ${years} inverni sotto la stessa insegna, e l'armadietto ha il tuo odore.`,
        `${years} stagioni. Casa, se questa parola tiene. A ${s.team.city} tiene ancora.`,
      ]),
      choices: [
        {
          label: "Resti, e lo dici",
          detail: "La casa è questa.",
          fx: () => ({
            coachTrust: 4,
            hidden: { chemistry: 6, ego: -1 },
            attrs: { iq: 0.25 },
            flavor: fl(s, [
              `A ${s.team.city} il corridoio è corto. Lo conosci al buio.`,
              `I muri di ${s.team.city} non ti chiedono più il nome. È un lusso raro.`,
              `Resti. A ${s.team.city} l'armadietto è tuo, e questo, a quest'età, conta.`,
              `Lo dici. A ${s.team.city} la casa è questa, e i tifosi lo sentono dal passo.`,
              `${years} inverni. Restare, detto chiaro, vale più di una clausola.`,
              `A ${s.team.city} non devi più presentarti. Entri, e lo schema ti riconosce.`,
            ]),
          }),
        },
        {
          label: "Chiedi un ruolo più chiaro",
          detail: "Fedeltà non è silenzio.",
          fx: () => ({
            coachTrust: 2,
            hidden: { ego: 3 },
            attrs: { shooting: 0.25, passing: 0.2 },
            flavor: fl(s, [
              `${s.coachName} ascolta. Non promette. Sposta due minuti. È già qualcosa.`,
              `Due minuti in più, detti piano. ${s.coachName} non fa discorsi: fa la rotazione.`,
              `Chiedi. ${s.coachName} non alza la voce. Sposta un possesso. Basta.`,
              `Fedeltà non è silenzio. ${s.coachName} lo sa, e sposta un pezzo.`,
              `Chiedi un ruolo più chiaro. ${s.coachName} non giura. Qualche minuto, però, si allunga.`,
              `Due possessi in più, detti senza urla. ${s.coachName} annota, e basta.`,
            ]),
          }),
        },
        {
          label: "Lasci aperta la porta",
          detail: "L'estate parlerà.",
          fx: () => ({
            hidden: { mediaSavvy: 3, chemistry: -2 },
            form: 0.2,
            flavor: fl(s, [
              "Non minacci. Non giuri. Il mercato, da lontano, prende nota.",
              "Una porta socchiusa, senza urla. Qualcuno, fuori, annota.",
              "Niente ultimatum. Il silenzio, stavolta, vale una clausola.",
              "L'estate parlerà. Tu non alzi la voce, e il mercato lo sente lo stesso.",
              "Lasci aperta la porta. Non è un addio: è un modo di stare, per ora.",
              "Niente minacce. Una porta, socchiusa, e il resto è mestiere.",
            ]),
          }),
        },
      ],
    };
  }

  if (s.league === "EuroLega") {
    return {
      id,
      phase: "veteran",
      title: say(s, [
        "Un'altra lingua, lo stesso lavoro",
        "Il tempo europeo",
        "Palazzetti stretti, teste larghe",
        "Il giovedì europeo",
        "Un'altra lingua tattica, lo stesso ferro",
      ]),
      subtitle: say(s, [
        `Palazzetto pieno, tattica stretta. A ${s.team.city} ti chiedono di pensare prima di saltare.`,
        "L'Europa non perdona i possessi vuoti. Tu, a quest'età, ne hai visti troppi per sbagliarne uno di fretta.",
        `A ${s.team.city} il blocco e uscita ha un altro orario. Lo impari, o resti fuori dallo schema.`,
        `Un'altra lingua tattica, lo stesso ferro. A ${s.team.city} il giovedì europeo non perdona.`,
        "Palazzetti stretti, teste larghe. L'Europa ti chiede di leggere prima, e tu lo fai.",
        `A ${s.team.city} ogni possesso è una lezione. Gli errori si pagano in silenzio, e tu lo sai.`,
      ]),
      choices: [
        {
          label: "Ti adatti al sistema",
          detail: "Meno isolamento, più lettura.",
          fx: () => ({
            attrs: { iq: 0.45, passing: 0.35 },
            hidden: { chemistry: 4, consistency: 2 },
            coachTrust: 3,
            flavor: fl(s, [
              "Il blocco e uscita ha un altro tempo. Lo impari. Si vede.",
              "Un'altra lingua tattica. Dopo due settimane il corpo la parla.",
              "L'Europa ti chiede di leggere prima. Lo fai, e il palazzetto lo nota.",
              "Ti adatti. Il sistema, qui, è una grammatica, e tu la impari.",
              "Meno isolamento, più lettura. Il palazzetto, dopo un mese, ti riconosce.",
              "Un altro orario, lo stesso ferro. Lo impari, e si vede dal passo.",
            ]),
          }),
        },
        {
          label: "Porti il tuo gioco",
          detail: "Sei arrivato per questo.",
          fx: () => ({
            form: 0.4,
            attrs: { shooting: 0.35, handle: 0.2 },
            hidden: { ego: 2, clutch: 2 },
            flavor: fl(s, [
              "Un possesso tuo, netto. Il palazzetto ci mette un attimo a capire.",
              "Tieni, decidi, segni. Qui è un accento nuovo, e funziona.",
              "Un isolamento in una coppa tattica. Per una sera il palazzetto impara il tuo nome.",
              "Porti il tuo gioco. Per una sera il palazzetto impara un altro orario.",
              "Un possesso tuo, detto chiaro. Qui è un accento, e tiene.",
              "Sei arrivato per questo. Il palazzetto, un attimo dopo, lo sa.",
            ]),
          }),
        },
        {
          label: "Ascolti i veterani di qui",
          detail: "Loro questa palestra la sanno a memoria.",
          fx: () => ({
            hidden: { chemistry: 5, workEthic: 2 },
            attrs: { defense: 0.25, iq: 0.2 },
            flavor: fl(s, [
              "Due frasi in un caffè. Valgono un filmato.",
              "Un veterano locale ti spiega un'uscita. La tieni per il resto dell'inverno.",
              "Impari in un bar, non in sala video. Strano, e giusto.",
              "Loro questa palestra la sanno a memoria. Tu ascolti, e il corpo impara.",
              "Due minuti al caffè. Un'uscita nuova, tenuta per l'inverno.",
              "Ascolti i veterani di qui. Il gesto, dopo, è un palmo più pulito.",
            ]),
          }),
        },
      ],
    };
  }

  if (last && last.playoff.startsWith("Elim.")) {
    return {
      id,
      phase: "veteran",
      title: say(s, [
        "La primavera che non è bastata",
        "Quella serie, ancora",
        "Il maggio che resta nelle mani",
        "Una porta chiusa, ancora aperta in testa",
        "L'eliminazione che non si è sciolta",
      ]),
      subtitle: say(s, [
        `L'anno scorso: ${last.playoff}. La ferita è chiusa. Il ricordo no.`,
        "Un'eliminazione resta nelle mani. Ogni palleggio di ottobre ne porta un pezzo.",
        `Fuori ${last.playoff}. Ottobre lo sa, anche se tu fai finta di no.`,
        `La primavera che non è bastata. ${last.playoff}. Il maggio resta nelle mani.`,
        "Si torna a casa a maggio. L'estate inizia troppo presto, e lo sai.",
        `Una porta chiusa, ancora aperta in testa. ${last.playoff}. Ottobre la rilegge.`,
      ]),
      choices: [
        {
          label: "Studi quella serie, fotogramma per fotogramma",
          detail: "Il lutto, fatto mestiere.",
          fx: () => ({
            attrs: { iq: 0.5, defense: 0.25 },
            hidden: { workEthic: 4, clutch: 2 },
            flavor: fl(s, [
              "Rivedi i possessi. Trovi uno che non avevi visto. Basta quello.",
              "La serie persa diventa un quaderno. Ottobre, poi, è più pulito.",
              "Guardi senza pietà. Un errore, corretto, vale una settimana.",
              "Il lutto, fatto mestiere. I fotogrammi, riletti, tengono per l'inverno.",
              "Una serie, un quaderno. Ottobre, poi, non chiede alibi.",
              "Guardi quella serie fino in fondo. Un possesso, corretto, basta.",
            ]),
          }),
        },
        {
          label: "Cambi qualcosa nel corpo",
          detail: "Meno peso, più primo passo.",
          fx: () => ({
            attrs: { athleticism: 0.3, shooting: 0.2 },
            injuryRisk: 3,
            hidden: { motor: 3 },
            flavor: fl(s, [
              "Estate secca. A ottobre il primo contropiede è tuo.",
              "Lavoro sporco, niente alibi. Il primo passo di novembre è più lungo.",
              "Sudore da vendetta quieta. Non si dichiara: si corre.",
              "Meno peso, più primo passo. Ottobre lo sente prima dello staff.",
              "Cambi qualcosa nel corpo. Il maggio che resta nelle mani, a ottobre, pesa meno.",
              "Sudore senza tesi. Il primo passo, a novembre, è più lungo.",
            ]),
          }),
        },
        {
          label: "Non ne parli più",
          detail: "Si gira pagina, davvero.",
          fx: () => ({
            hidden: { consistency: 3, ego: 1 },
            form: 0.25,
            flavor: fl(s, [
              "Il silenzio, stavolta, è una scelta. Tiene.",
              "Non commenti l'uscita. Il gruppo, per una volta, ti è grato.",
              "Chiudi la bocca. L'eliminazione pesa meno se non la racconti.",
              "Si gira pagina, davvero. Il silenzio, tenuto, vale più di un'intervista.",
              "Non ne parli più. Ottobre, così, è più pulito.",
              "Chiudi. L'eliminazione resta, ma non la racconti, e pesa meno.",
            ]),
          }),
        },
      ],
    };
  }

  if (s.rivalry >= 50) {
    return {
      id,
      phase: "veteran",
      title: say(s, [
        "Di nuovo, lui",
        "Il metro che non si spegne",
        "Due vecchi, un corridoio",
        "Il nome che alza ancora il tono",
        "Una rivalità che ha i capelli grigi",
      ]),
      subtitle: say(s, [
        `${s.rivalName} torna in una conferenza, in un fermo, in un tempo morto. L'età non ha spento quella voce.`,
        `Lo incroci in un corridoio. ${s.rivalName}. Vi siete fatti vecchi insieme, senza dirvelo.`,
        `${s.rivalName} è ancora un nome che alza il tono. Anche adesso.`,
        `Di nuovo, lui. ${s.rivalName} resta un metro, e il metro, a quest'età, è ancora acceso.`,
        `Due vecchi, un corridoio. ${s.rivalName} non ha spento quella voce, e tu nemmeno.`,
        `${s.rivalName}: una rivalità che ha i capelli grigi, e tiene lo stesso.`,
      ]),
      choices: [
        {
          label: "Una stretta di mano, e basta",
          detail: "La guerra è finita. Resta il rispetto.",
          fx: () => ({
            rivalry: -8,
            hidden: { chemistry: 2, ego: -2 },
            flavor: fl(s, [
              "Due secondi. Niente fotografi. Pesano.",
              "Una stretta di mano vera. La rivalità, per un attimo, è un mestiere.",
              "Vi guardate. Basta. Poi ognuno torna alla sua palestra.",
              "La guerra è finita. Resta il rispetto, basso e fermo.",
              "Una stretta di mano, e basta. Due vecchi, un corridoio, niente titoli.",
              "Vi siete fatti vecchi insieme, senza dirvelo. Una stretta basta.",
            ]),
          }),
        },
        {
          label: "La tieni accesa",
          detail: "Ti serve ancora.",
          fx: () => ({
            rivalry: 6,
            form: 0.35,
            hidden: { clutch: 2, ego: 2 },
            flavor: fl(s, [
              "Non è odio. È un metro. Lo usi.",
              "Ti alleni contro un'ombra che ha un nome. Il ferro, quella settimana, è più onesto.",
              "La rivalità diventa un orario, non un titolo.",
              "La tieni accesa. Ti serve ancora, e il ferro, quella settimana, lo sa.",
              "Un nome che alza il tono. Lo usi, senza dichiararlo.",
              "Non è guerra. È un metro. A quest'età i metri, tenuti, valgono.",
            ]),
          }),
        },
        {
          label: "Gli chiedi una cosa vera",
          detail: "Come si fa, a quest'età.",
          fx: () => ({
            rivalry: -3,
            attrs: { iq: 0.35 },
            hidden: { workEthic: 2 },
            flavor: fl(s, [
              "Una frase sola. Te la porti in palestra.",
              "Lui parla poco. Il poco ti basta per una settimana di lavoro.",
              "Un messaggio, niente interviste. Lo rileggi prima delle ripetizioni.",
              "Gli chiedi una cosa vera. Come si fa, a quest'età.",
              "Una frase, tenuta. Il ferro, quella settimana, è più onesto.",
              "Lui risponde poco. Il poco, a quest'età, vale una settimana.",
            ]),
          }),
        },
      ],
    };
  }

  return {
    id,
    phase: "veteran",
    title: say(s, [
      "Il corpo fa l'appello",
      "Cosa tiene, cosa no",
      "L'inventario di ottobre",
      "Le articolazioni hanno un'agenda",
      "Il riscaldamento più lungo",
      "Quello che resta delle gambe",
      "L'appello del corpo, ogni mattina",
      "Cosa tiene, detto chiaro",
    ]),
    subtitle: say(s, [
      "Non è un infortunio. È un inventario: cosa tiene, cosa no, cosa finge.",
      `${s.age} anni. Il riscaldamento dura di più. Il quarto quarto, a volte, di meno.`,
      "Le articolazioni hanno un'agenda. Tu la leggi prima dello staff.",
      `A ${s.age} anni ogni riscaldamento è un inventario. Tu lo fai prima che lo faccia lo staff.`,
      "Il corpo fa l'appello. Tu rispondi ancora sì, e scendi.",
      `A ${s.age} anni il riscaldamento è già una partita. La vinci in silenzio, ogni sera.`,
    ]),
    choices: [
      {
        label: s.age >= 35 ? "Tagli il carico, e ascolti" : s.age >= 33 ? "Il carico, tagliato" : "Ascolti, e tagli il carico",
        detail: "Durare è già un mestiere.",
        fx: () => ({
          injuryRisk: -7,
          injuryDrag: -0.8,
          hidden: { durability: 4, consistency: 2 },
          flavor: fl(s, [
            "Meno chili, più sonno. Novembre ti trova in piedi.",
            "Tagli il carico. Il corpo, per una volta, ringrazia in silenzio.",
            "Niente eroismo di ottobre. Arrivi a marzo con le gambe tue.",
            "Ascolti, e tagli. Durare, a quest'età, è già un mestiere.",
            "Il carico, tagliato. Marzo ti trova in piedi, senza dichiararlo.",
            "Meno chili sulla barra. Il tendine, a ottobre, non presenta il conto in anticipo.",
          ]),
        }),
      },
      {
        label: s.age >= 35 ? "Il gesto, nient'altro" : s.age >= 33 ? "Tiro e passaggio, solo quello" : "Insisti sul mestiere",
        detail: "Tiro, passaggio, nient'altro.",
        fx: () => ({
          attrs: { shooting: 0.3, passing: 0.25, iq: 0.2 },
          hidden: { workEthic: 3 },
          flavor: fl(s, [
            "Niente eroismo. Solo ripetizioni. A ottobre si vede.",
            "Tiro, passaggio, nient'altro. Il gesto torna prima del fiato.",
            "Insisti sul semplice. È l'unica cosa che, a quest'età, cresce ancora.",
            "Il gesto, nient'altro. A ottobre lo staff lo capisce dal polso.",
            "Tiro e passaggio, solo quello. Il resto, a quest'età, è rumore.",
            "Insisti sul mestiere. Il semplice, tenuto, vale più di un giro in più.",
          ]),
        }),
      },
      {
        label: s.age >= 35 ? "I minuti, chiesti ancora" : s.age >= 33 ? "Ancora i minuti veri" : "Chiedi minuti veri, ancora",
        detail: "Non vuoi sparire in punta.",
        fx: () => ({
          coachTrust: 1,
          injuryRisk: 4,
          hidden: { motor: 2, ego: 2 },
          form: 0.25,
          flavor: fl(s, [
            `${s.coachName} non promette. Ti guarda. I minuti, qualche sera, arrivano.`,
            `Chiedi ancora. ${s.coachName} non sorride. Qualche quarto, però, si allunga.`,
            `${s.coachName} ti lascia in campo un possesso in più. Non è un discorso: è un voto.`,
            `I minuti, chiesti ancora. ${s.coachName} non fa discorsi: fa la rotazione.`,
            `Non vuoi sparire in punta. ${s.coachName} lo capisce, e qualche possesso si allunga.`,
            `Chiedi minuti veri. ${s.coachName} ti guarda. Qualche sera, arrivano.`,
          ]),
        }),
      },
    ],
  };
}

/** Offerta Europa da 30: più magra se arrivi da contendente NBA. */
export function europeAnnualMult(s: PlayerState): number {
  let m = 0.42;
  if (s.team.tier === "contender" || s.team.power >= 84) m = 0.26;
  if (s.overall >= 84) m = Math.min(m, 0.3);
  if (s.age >= 34) m *= 0.88;
  return m;
}

export function europeOfferPitches(s: PlayerState): string[] {
  const city = s.team.city;
  const thin = s.team.tier === "contender" || s.team.power >= 84;
  const core = [
    "Europa. Palazzetti pieni, tattica stretta, un ultimo atto diverso.",
    "Un altro palcoscenico. Il ruolo e la voce vengono prima; questo, se arriva, è la chiusura.",
    "Eurolega: un campionato che parla un'altra lingua. L'anello, lì, ha un altro peso.",
    "Un'altra geografia. I palazzetti più piccoli, le coppe più lunghe, un mestiere da adulti.",
    "Un ultimo atto in un'altra lingua, con la stessa palla. Non è una fuga.",
    `Non è un esilio da ${city}. È un giugno diverso, se i minuti qui spariscono.`,
    "Prima il posto, poi la voce. L'Europa, se firmi, è l'ultimo atto — detto chiaro.",
  ];
  if (!thin) return core;
  return [
    "Offerta magra, senso pieno. L'Europa non compra il nome: compra gli ultimi possessi.",
    `Da contendente la cifra è piccola. Non è un esilio da ${city}: è una chiusura, se i minuti spariscono.`,
    "Il ruolo e la voce vengono prima. Questa porta, magra, resta l'ultimo atto.",
    ...core,
  ];
}

export function lastActEuropeEarned(s: PlayerState): boolean {
  if (s.age < 30 || s.league !== "NBA") return false;
  const last = s.seasonHistory[s.seasonHistory.length - 1];
  const declining = s.overall + 6 < s.peakOverall;
  const bench = !!last && last.min <= 22;
  const voice = s.hidden.chemistry >= 62 || s.hidden.ego <= 46;
  const years = s.seasonHistory.length >= 8;
  return years && (declining || bench || (s.age >= 33 && voice));
}

/** Probabilità, se earned, di preferire l'offerta Europa nel sim. Target carriere ~5%. */
export function lastActEuropeP(s: PlayerState): number {
  if (!lastActEuropeEarned(s)) return s.age >= 35 && s.league === "NBA" ? 0.02 : 0;
  let p = 0.035;
  if (s.age >= 33) p += 0.025;
  if (s.age >= 35) p += 0.04;
  if (s.overall + 10 < s.peakOverall) p += 0.03;
  if (s.team.tier === "rebuilding" && s.age >= 32) p += 0.025;
  return Math.min(0.14, p);
}

export function maybePreferEuropeOffer<T extends { kind: string }>(
  s: PlayerState,
  offers: T[],
  current: T,
): T {
  const euro = offers.find((o) => o.kind === "euro");
  if (!euro) return current;
  if (rand() < lastActEuropeP(s)) return euro;
  return current;
}
