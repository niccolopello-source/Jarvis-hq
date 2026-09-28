
import { rand } from "./rng";
import { say } from "./voice";
import { quietYearEventBits } from "./feel";
import type { PlayerState, StoryEvent } from "./types";

/** Eventi di atmosfera: corpo, strada, casa, silenzi. Tre scelte, italiano curato. */
export const FEEL_STORY: StoryEvent[] = [
  {
    id: "fl1",
    phase: "rookie",
    title: "Natale in trasferta",
    subtitle:
      "Ventitré dicembre, hotel di una città che non conosci. Tua madre ti chiama mentre fai stretching sul tappeto.",
    choices: [
      {
        label: "Restituisci la chiamata, a lungo",
        detail: "La voce di casa prima della veglia, anche lontano.",
        fx: () => ({
          morale: 6,
          hidden: { chemistry: 2 },
          attrs: { iq: 0.3 },
          flavor: "Appendi e sei più leggero. Il giorno dopo il tiro esce pulito.",
        }),
      },
      {
        label: "Due minuti, poi i possessi in sala",
        detail: "Domani si gioca. Lei lo sa.",
        fx: () => ({
          form: 0.4,
          hidden: { workEthic: 3, consistency: 2 },
          flavor: "Chiudi il telefono. Sul comodino resta la luce della sveglia.",
        }),
      },
      {
        label: "Chiedi a un compagno di cenare insieme",
        detail: "Nessuno dovrebbe passare la vigilia da solo.",
        fx: () => ({
          hidden: { chemistry: 6, mediaSavvy: 1 },
          coachTrust: 2,
          flavor: "Si ride poco, si mangia male, si sta meglio.",
        }),
      },
    ],
  },
  {
    id: "fl2",
    phase: "any",
    title: "Il volo di notte",
    subtitle:
      "Ritardo a terra, tre ore. Lo scivolo dell'aereo, il sonno che non arriva, una partita fra trentasei ore.",
    choices: [
      {
        label: "Tappi, mascherina, disciplina",
        detail: "Dormi come sai dormire: per mestiere.",
        fx: () => ({
          form: 0.5,
          hidden: { consistency: 4, motor: 2 },
          flavor: "L'atterraggio è sporco. Tu no: hai dormito per mestiere, e si vede dal passo.",
        }),
      },
      {
        label: "Partita a carte in fondo all'aereo",
        detail: "Il gruppo tiene, anche a diecimila metri.",
        fx: () => ({
          hidden: { chemistry: 5, clutch: 1 },
          morale: 4,
          flavor: "In fondo all'aereo si conta a voce bassa. Arrivi già in cerchio, senza dirlo.",
        }),
      },
      {
        label: "Studi i possessi dell'avversario",
        detail: "Lo schermo è piccolo. La testa no.",
        fx: () => ({
          attrs: { iq: 0.7, defense: 0.3 },
          hidden: { workEthic: 3 },
          flavor: "Lo schermo trema. L'uscita dal blocco, però, la tieni. Al mattino basta un cenno.",
        }),
      },
    ],
  },
  {
    id: "fl3",
    phase: "prime",
    title: "La prima volta che cantano il tuo nome",
    subtitle:
      "Terzo quarto, palla ferma. Un pezzo di curva inizia, poi tutto il palazzetto. Non è uno slogan: è il tuo cognome.",
    choices: [
      {
        label: "Alzi un palmo, basta",
        detail: "Ringrazi senza fermarti.",
        fx: () => ({
          publicImage: 3,
          hidden: { chemistry: 3, ego: -2 },
          flavor: "Il gesto è piccolo. Resta.",
        }),
      },
      {
        label: "Te la prendi, sul possesso dopo",
        detail: "Se chiamano te, tiri tu.",
        fx: () => ({
          form: 0.8,
          attrs: { shooting: 0.5, handle: 0.3 },
          hidden: { clutch: 4, ego: 4 },
          flavor: "Canestro. Urlo. Qualcosa si sposta, in te, e non torna indietro.",
        }),
      },
      {
        label: "Cerchi il compagno libero",
        detail: "Il coro può aspettare un passaggio.",
        fx: () => ({
          attrs: { passing: 0.6, iq: 0.3 },
          hidden: { chemistry: 5, ego: -1 },
          flavor: "L'assist è più rumoroso del tiro. Strano, e giusto.",
        }),
      },
    ],
  },
  {
    id: "fl4",
    phase: "prime",
    title: "Un compagno si rompe, i suoi minuti diventano tuoi",
    subtitle:
      "Lo portano via in barella. __COACH__ ti guarda e non dice niente. Non serve.",
    choices: [
      {
        label: "Accetti il carico",
        detail: "Più possessi, più responsabilità, più usura.",
        fx: () => ({
          development: 0.55,
          injuryRisk: 4,
          attrs: { handle: 0.4, shooting: 0.35, passing: 0.25 },
          hidden: { motor: 3, clutch: 2 },
          flavor: "I minuti arrivano pesanti. Li tieni.",
        }),
      },
      {
        label: "Chiedi di spartirli",
        detail: "Il gruppo prima dell'eroismo.",
        fx: () => ({
          coachTrust: 5,
          hidden: { chemistry: 6, ego: -2 },
          attrs: { iq: 0.4, passing: 0.3 },
          flavor: "Non sei il salvatore. Sei uno che tiene insieme i pezzi.",
        }),
      },
      {
        label: "Vai a trovarlo in sala medica dopo",
        detail: "I minuti aspettano. Lui no.",
        fx: () => ({
          hidden: { chemistry: 7, mediaSavvy: 2 },
          morale: 3,
          flavor: "Non si parla di basket. Si parla di quando torna. Tu ascolti.",
        }),
      },
    ],
  },
  {
    id: "fl5",
    phase: "any",
    title: "La sala video che brucia",
    subtitle:
      "__COACH__ ferma il filmato sette volte sullo stesso errore. La stanza è silenziosa in un modo che fa male.",
    choices: [
      {
        label: "Prendi appunti, a testa bassa",
        detail: "Impari in pubblico, che è il modo più duro.",
        fx: () => ({
          coachTrust: 6,
          attrs: { iq: 0.8, defense: 0.3 },
          hidden: { workEthic: 4, ego: -3 },
          flavor: "Esci con le orecchie calde e lo schema a posto.",
        }),
      },
      {
        label: "Rispondi, a voce alta",
        detail: "Non era solo colpa tua e lo dici.",
        fx: () => ({
          coachTrust: -5,
          hidden: { ego: 5, chemistry: -2 },
          form: 0.3,
          flavor: "Il silenzio dopo è peggio del filmato. Qualcosa si incrina.",
        }),
      },
      {
        label: "Chiedi di rivederlo da solo, dopo",
        detail: "La correzione, senza platea.",
        fx: () => ({
          attrs: { iq: 0.5 },
          hidden: { consistency: 3, workEthic: 3 },
          flavor: "Restate in due nella stanza. Si parla poco. Si capisce tutto.",
        }),
      },
    ],
  },
  {
    id: "fl6",
    phase: "veteran",
    title: "Il campo del paese, d'estate",
    subtitle:
      "Torni dove hai imparato a palleggiare. L'asfalto è storto, i tabelloni cantano. Un ragazzino ti chiede se sei davvero tu.",
    choices: [
      {
        label: "Giochi con loro fino al buio",
        detail: "Niente staff, niente cronometro.",
        fx: () => ({
          morale: 7,
          hidden: { chemistry: 3 },
          attrs: { handle: 0.3 },
          flavor: "Sudore diverso. Ti ricorda perché hai cominciato.",
        }),
      },
      {
        label: "Restano due tiri, poi via",
        detail: "Il programma non aspetta il paese.",
        fx: () => ({
          hidden: { workEthic: 3, mediaSavvy: -1 },
          form: 0.3,
          flavor: "Firmi due maglie. In macchina, per un chilometro, ti manca già l'asfalto storto.",
        }),
      },
      {
        label: "Chiedi al ragazzino di mostrarti il suo tiro",
        detail: "Oggi sei tu l'adulto sul campo.",
        fx: () => ({
          publicImage: 4,
          hidden: { mediaSavvy: 3, ego: -2 },
          attrs: { iq: 0.25 },
          flavor: "Correggi il polso. Lui fa canestro. Qualcosa si chiude, in pace.",
        }),
      },
    ],
  },
  {
    id: "fl7",
    phase: "any",
    title: "Dopo una battuta a secco",
    subtitle:
      "Zero punti. Zero. Lo spogliatoio fa rumore intorno a te, e tu no. La doccia è lunga.",
    choices: [
      {
        label: "Resti al ferro, a palazzetto vuoto",
        detail: "Il palazzetto vuoto è un giudice onesto.",
        fx: () => ({
          attrs: { shooting: 0.6, handle: 0.2 },
          hidden: { workEthic: 4, clutch: 2 },
          injuryRisk: 2,
          flavor: "I custodi spengono le luci a una a una. Tu continui.",
        }),
      },
      {
        label: "Ne parli con __COACH__",
        detail: "Meglio una verità scomoda che un silenzio.",
        fx: () => ({
          coachTrust: 5,
          attrs: { iq: 0.4 },
          hidden: { consistency: 3 },
          flavor: "Non ti consola. Ti dà un compito. È meglio.",
        }),
      },
      {
        label: "Spegni la testa, dormi",
        detail: "Domani è un'altra pelle.",
        fx: () => ({
          form: 0.6,
          hidden: { durability: 2, ego: -1 },
          flavor: "Il sonno è una scelta. Al mattino il tiro è ancora tuo.",
        }),
      },
    ],
  },
  {
    id: "fl8",
    phase: "prime",
    title: "La lista di febbraio, e tu no",
    subtitle:
      "Esce la lista. Il tuo nome non c'è. I messaggi arrivano lo stesso, come se fosse colpa loro.",
    choices: [
      {
        label: "Silenzio stampa, più lavoro",
        detail: "La risposta è in palestra, a febbraio.",
        fx: () => ({
          development: 0.45,
          attrs: { shooting: 0.4, defense: 0.3, athleticism: 0.2 },
          hidden: { workEthic: 5, ego: -1 },
          flavor: "Non fai una dichiarazione. Fai tre sedute in più. Si vede.",
        }),
      },
      {
        label: "Una frase secca, poi basta",
        detail: "Dici che meriti di più. Punto.",
        fx: () => ({
          publicImage: 3,
          hidden: { ego: 5, mediaSavvy: 3 },
          form: 0.4,
          flavor: "I giornali titolano. Lo spogliatoio ascolta, e pesa.",
        }),
      },
      {
        label: "Festeggi chi c'è andato, in squadra",
        detail: "Il palazzetto è più grande del tuo orgoglio.",
        fx: () => ({
          hidden: { chemistry: 6, ego: -3 },
          coachTrust: 3,
          flavor: "Un abbraccio in mezzo al corridoio. Costa. Vale.",
        }),
      },
    ],
  },
  {
    id: "fl9",
    phase: "veteran",
    title: "Il silenzio dopo il fischio",
    subtitle:
      "Serie finita. Doccia. Autobus. Nessuno alza la voce. Fuori piove su una città che non è la tua.",
    choices: [
      {
        label: "Parli tu, per primo",
        detail: "Qualcuno deve rompere il ghiaccio.",
        fx: () => ({
          hidden: { chemistry: 5, clutch: 2 },
          coachTrust: 3,
          flavor: "Dici poco. Basta. Il viaggio di ritorno è meno lungo.",
        }),
      },
      {
        label: "Metti le cuffie e lasci stare",
        detail: "Il lutto, a modo tuo.",
        fx: () => ({
          form: -0.4,
          hidden: { ego: 2, consistency: 2 },
          flavor: "Il rumore bianco ti tiene compagnia. Domani riparti da lì.",
        }),
      },
      {
        label: "Chiedi a __COACH__ cosa ha visto",
        detail: "Anche una sconfitta si studia.",
        fx: () => ({
          attrs: { iq: 0.55, defense: 0.2 },
          hidden: { workEthic: 3 },
          flavor: "Due minuti in fondo al bus. Una frase sola, che ti resta.",
        }),
      },
    ],
  },
  {
    id: "fl10",
    phase: "rookie",
    title: "Le scarpe ancora bagnate",
    subtitle:
      "Primo mese. Lo spogliatoio è un linguaggio che non parli. Le tue scarpe, messe storte, dicono che sei nuovo.",
    choices: [
      {
        label: "Chiedi come si fa, qui",
        detail: "Meglio una domanda che un errore ripetuto.",
        fx: () => ({
          hidden: { chemistry: 5, ego: -2 },
          coachTrust: 3,
          attrs: { iq: 0.35 },
          flavor: "Un veterano ti mostra il posto. È una cosa piccola. Non lo è.",
        }),
      },
      {
        label: "Osservi e copi, in silenzio",
        detail: "Impari il rito senza disturbarlo.",
        fx: () => ({
          hidden: { consistency: 4, workEthic: 2 },
          attrs: { iq: 0.25 },
          flavor: "In una settimana le scarpe sono dritte. Qualcuno lo nota.",
        }),
      },
      {
        label: "Arrivi prima di tutti",
        detail: "Il rispetto, a modo tuo: l'orario.",
        fx: () => ({
          hidden: { workEthic: 6, motor: 2 },
          coachTrust: 4,
          flavor: "La palestra è vuota e accesa. È il tuo modo di entrare.",
        }),
      },
    ],
  },
  {
    id: "fl11",
    phase: "any",
    title: "Una notte in cui il corpo dice no",
    subtitle:
      "Alle tre, il ginocchio. Non è un infortunio da referto. È un avviso. Domani c'è gara.",
    choices: [
      {
        label: "Chiami lo staff, subito",
        detail: "Meglio una notte persa che un mese.",
        fx: () => ({
          injuryRisk: -8,
          gamesPenalty: 1,
          hidden: { durability: 3, workEthic: 2 },
          flavor: "Ghiaccio, silenzio, una gara in dubbio. Il ginocchio ringrazia.",
        }),
      },
      {
        label: "Dormi sul fianco e speri",
        detail: "I minuti non si regalano. Nemmeno i rischi.",
        fx: () => ({
          injuryRisk: 7,
          form: 0.3,
          hidden: { motor: 2, durability: -3 },
          flavor: "Scendi in campo. Tieni. Qualcosa, sotto, ha contato.",
        }),
      },
      {
        label: "Chiedi un carico diverso in allenamento",
        detail: "Non eroismo: mestiere.",
        fx: () => ({
          injuryRisk: -4,
          coachTrust: 2,
          attrs: { iq: 0.3 },
          hidden: { consistency: 2 },
          flavor: "__COACH__ sposta due esercizi. Non è gloria. È una carriera che dura.",
        }),
      },
    ],
  },
  {
    id: "fl12",
    phase: "veteran",
    title: "Un ragazzo ti chiede un consiglio",
    subtitle:
      "La matricola della tua squadra. Vent'anni. Ti ferma in corridoio e non sa come iniziare la frase.",
    choices: [
      {
        label: "Gli dici la verità scomoda",
        detail: "Quello che avresti voluto sentirti dire.",
        fx: () => ({
          hidden: { chemistry: 4, ego: -1 },
          attrs: { iq: 0.4 },
          coachTrust: 2,
          flavor: "Ascolta. Annuisce. Tornerà. Le carriere si passano così.",
        }),
      },
      {
        label: "Lo porti in palestra con te",
        detail: "Meno parole, più ripetizioni.",
        fx: () => ({
          hidden: { workEthic: 3, chemistry: 5 },
          attrs: { passing: 0.25 },
          flavor: "Due canestri, tre correzioni. Esce più alto di quando è entrato.",
        }),
      },
      {
        label: "Lo rimandi allo staff",
        detail: "Non sei il suo allenatore.",
        fx: () => ({
          hidden: { ego: 3, chemistry: -2 },
          flavor: "La frase è corretta e fredda. Resta nel corridoio un secondo in più del dovuto.",
        }),
      },
    ],
  },
  {
    id: "fl13",
    phase: "veteran",
    title: "L'ultima estate che conta",
    subtitle:
      "Il contratto è corto. Lo specchio no. Ti chiedi se il corpo arriverà a novembre, o se novembre arriverà senza di te.",
    choices: [
      {
        label: "Un programma da ragazzo, di nascosto",
        detail: "Due sedute in più. Lo staff non deve saperlo tutto.",
        fx: () => ({
          development: 0.4,
          injuryRisk: 5,
          attrs: { athleticism: 0.25, shooting: 0.2 },
          hidden: { motor: 3, durability: -2 },
          flavor: "Le gambe bruciano. Per una settimana ti senti di nuovo ventiquattro.",
        }),
      },
      {
        label: "Ascolti il fisioterapista",
        detail: "Durare è già un mestiere.",
        fx: () => ({
          injuryRisk: -6,
          injuryDrag: -1,
          hidden: { durability: 4, consistency: 2 },
          flavor: "Meno chili, più sonno. Novembre ti trova in piedi.",
        }),
      },
      {
        label: "Giochi a basket, solo basket",
        detail: "Tiri, passaggi, nient'altro. Come la prima estate.",
        fx: () => ({
          form: 0.5,
          attrs: { shooting: 0.35, passing: 0.25, iq: 0.2 },
          hidden: { chemistry: 2 },
          flavor: "Niente numeri. Solo il suono della rete. Ti basta, e si vede.",
        }),
      },
    ],
  },
  {
    id: "fl14",
    phase: "any",
    title: "Una domenica in cui vince la panchina",
    subtitle:
      "Il coach ti lascia fuori nel quarto quarto di una gara che si poteva chiudere. Il palazzetto non fischia te. Fischia la scelta.",
    choices: [
      {
        label: "Chiedi il perché, a porte chiuse",
        detail: "Una domanda, non una scena.",
        fx: () => ({
          coachTrust: 2,
          attrs: { iq: 0.35 },
          hidden: { ego: 1, chemistry: 1 },
          flavor: "__COACH__ parla due minuti. Non ti consola. Ti spiega. È abbastanza.",
        }),
      },
      {
        label: "Lavori il giorno dopo, in silenzio",
        detail: "La risposta è in palestra.",
        fx: () => ({
          development: 0.35,
          attrs: { shooting: 0.3, defense: 0.25 },
          hidden: { workEthic: 4, ego: -1 },
          flavor: "Nessuna dichiarazione. Tre sedute in più. Lo staff lo nota, e basta.",
        }),
      },
      {
        label: "Lo lasci correre",
        detail: "Non tutte le sere sono tue.",
        fx: () => ({
          hidden: { chemistry: 3, consistency: 2 },
          morale: -2,
          flavor: "Un giorno di freddo. Il gruppo, stranamente, si stringe.",
        }),
      },
    ],
  },
  {
    id: "fl15",
    phase: "prime",
    title: "Il tempo morto che chiami tu",
    subtitle:
      "Terzo quarto, palla in mano, lo schema si rompe. Alzi un palmo. __COACH__ annuisce. Il palazzetto capisce dopo.",
    choices: [
      {
        label: "Disegni tu il possesso",
        detail: "Voce bassa, dita sul petto, un compito a testa.",
        fx: () => ({
          coachTrust: 4,
          attrs: { iq: 0.55, passing: 0.3 },
          hidden: { chemistry: 3 },
          flavor: "Il canestro arriva pulito. Non è il tuo: è di tutti. Conta di più.",
        }),
      },
      {
        label: "Chiedi l'isolamento",
        detail: "Se hai fermato il gioco, chiudilo tu.",
        fx: () => ({
          form: 0.45,
          attrs: { shooting: 0.4, handle: 0.25 },
          hidden: { clutch: 3, ego: 2 },
          flavor: "Uno contro uno. Entra. Qualcuno in panchina alza le sopracciglia. Va bene.",
        }),
      },
      {
        label: "Lo rimetti allo staff",
        detail: "Hai fermato il caos. Il piano è loro.",
        fx: () => ({
          coachTrust: 5,
          hidden: { ego: -2, consistency: 2 },
          attrs: { iq: 0.25 },
          flavor: "__COACH__ apprezza il gesto. Il possesso successivo è più ordinato.",
        }),
      },
    ],
  },
  {
    id: "fl16",
    phase: "rookie",
    title: "Il primo tempo morto che non capisci",
    subtitle:
      "__COACH__ disegna tre uscite. Tu annuisci. In campo, al primo possesso, la testa è vuota.",
    choices: [
      {
        label: "Chiedi al veterano, in corsa",
        detail: "Meglio una domanda che un errore ripetuto.",
        fx: () => ({
          hidden: { chemistry: 4, ego: -1 },
          attrs: { iq: 0.4, passing: 0.2 },
          flavor: "Due parole, un palmo. Lo schema, al possesso dopo, è tuo.",
        }),
      },
      {
        label: "Esegui quello che hai capito",
        detail: "Niente invenzioni. Il poco, tenuto.",
        fx: () => ({
          coachTrust: 3,
          hidden: { consistency: 3 },
          attrs: { iq: 0.25 },
          flavor: "Non è bello. È pulito. Lo staff non sorride: annuisce.",
        }),
      },
      {
        label: "Resti a rivedere il disegno, dopo",
        detail: "La correzione, senza platea.",
        fx: () => ({
          attrs: { iq: 0.55 },
          hidden: { workEthic: 3, consistency: 2 },
          flavor: "Ripassa il disegno col pennarello spento. Due minuti, e lo schema torna a essere una cosa tua.",
        }),
      },
    ],
  },
  {
    id: "fl17",
    phase: "prime",
    title: "Una trasferta in cui il ferro è storto",
    subtitle:
      "Palazzetto avverso, tabellone che canta, tre tiri corti di fila. Il pubblico ha già deciso.",
    choices: [
      {
        label: "Cerchi il contatto, non il tiro",
        detail: "Punti in lunetta, non in pedana.",
        fx: () => ({
          form: 0.4,
          attrs: { strength: 0.35, athleticism: 0.2 },
          hidden: { motor: 2, clutch: 2 },
          flavor: "Due liberi, nient'altro. Il palazzetto tace. Tu respiri, e segni.",
        }),
      },
      {
        label: "Passi, anche quando il tiro c'è",
        detail: "Il ferro storto non è un alibi per tenerti.",
        fx: () => ({
          attrs: { passing: 0.5, iq: 0.3 },
          hidden: { chemistry: 4, ego: -1 },
          flavor: "L'assist arriva pulito. Il palazzetto, per una volta, non sa a chi arrabbiarsi.",
        }),
      },
      {
        label: "Tiri il quarto, lo stesso",
        detail: "Se hai i piedi pronti, parti. Punto.",
        fx: () => ({
          form: 0.5,
          attrs: { shooting: 0.45, handle: 0.2 },
          hidden: { clutch: 3, ego: 2 },
          flavor: "Un tre che a novembre avresti finto. Stasera no. Entra, o no: hai tirato.",
        }),
      },
    ],
  },
  {
    id: "fl18",
    phase: "veteran",
    title: "Il ragazzo nuovo prende i tuoi minuti di ottobre",
    subtitle:
      "Non è un affronto. È un calendario. Tu lo sai prima di loro, e fa più male.",
    choices: [
      {
        label: "Gli cedi i minuti, tieni la voce",
        detail: "Il mestiere cambia forma, non peso.",
        fx: () => ({
          coachTrust: 4,
          attrs: { passing: 0.4, iq: 0.35 },
          hidden: { chemistry: 5, ego: -2 },
          flavor: "Gli dai i possessi. Ti tieni i tempi morti, e per una sera il peso sta dritto.",
        }),
      },
      {
        label: "Chiedi i minuti che restano, chiari",
        detail: "Fedeltà non è silenzio.",
        fx: () => ({
          coachTrust: 2,
          hidden: { ego: 2 },
          attrs: { shooting: 0.25, iq: 0.2 },
          flavor: "__COACH__ ascolta. Non promette. Sposta due minuti. È già qualcosa.",
        }),
      },
      {
        label: "Lavori sul corpo, in silenzio",
        detail: "Durare è già un mestiere.",
        fx: () => ({
          injuryRisk: -4,
          hidden: { durability: 3, workEthic: 2 },
          flavor: "Togli un piano di palestra. Novembre, poi, ti trova in piedi senza un comunicato.",
        }),
      },
    ],
  },
  {
    id: "qy1",
    phase: "any",
    title: "Una settimana senza avversario col nome",
    subtitle:
      "Niente copertine, niente tempi morti urlati. Solo i giorni, e tre modi di tenerli.",
    choices: [
      {
        label: "Chiudi la porta della palestra",
        detail: "Ripetizioni, nient'altro.",
        fx: () => ({
          development: 0.35,
          hidden: { workEthic: 3, consistency: 2 },
          attrs: { iq: 0.25 },
          flavor: "Fuori non succede niente. Dentro, il gesto diventa un altro gesto.",
        }),
      },
      {
        label: "Stai col gruppo, senza scene",
        detail: "Cene, sala video, il resto.",
        fx: () => ({
          hidden: { chemistry: 4, ego: -1 },
          coachTrust: 2,
          attrs: { passing: 0.2 },
          flavor: "Cene corte, sala video. Il gruppo si accorcia di un palmo, e nessuno scrive un titolo.",
        }),
      },
      {
        label: "Spegni e dormi",
        detail: "Domani c'è, comunque.",
        fx: () => ({
          morale: 5,
          form: 0.3,
          hidden: { durability: 1 },
          flavor: "Spegni prima delle undici. Il tiro, al mattino, esce senza chiedere scusa.",
        }),
      },
    ],
  },
  {
    id: "qy2",
    phase: "any",
    title: "Il mercoledì che non chiede niente",
    subtitle: "Allenamento normale, conferenza vuota, un corridoio senza microfoni.",
    choices: [
      {
        label: "Arrivi prima, resti dopo",
        detail: "L'orario è l'unica dichiarazione.",
        fx: () => ({
          hidden: { workEthic: 4, motor: 1 },
          coachTrust: 3,
          flavor: "La luce è accesa quando entri. Lo staff segna l'ora, non una dichiarazione.",
        }),
      },
      {
        label: "Chiedi i possessi noiosi",
        detail: "I possessi che nessuno taglia.",
        fx: () => ({
          attrs: { iq: 0.45, defense: 0.2 },
          hidden: { consistency: 2 },
          flavor: "Niente sequenze. Una lettura, corretta, vale una settimana.",
        }),
      },
      {
        label: "Una telefonata a casa, lunga",
        detail: "Il mestiere non è tutto il giorno.",
        fx: () => ({
          morale: 4,
          hidden: { chemistry: 1 },
          flavor: "Appendi più leggero. Il palazzetto, dopo, è solo un palazzetto.",
        }),
      },
    ],
  },
  {
    id: "qy3",
    phase: "rookie",
    title: "Nessuno ti chiede un'intervista",
    subtitle: "I microfoni sono sull'altra sponda. Tu sei un nome in fondo al referto.",
    choices: [
      {
        label: "Usi il vuoto",
        detail: "Nessuno guarda: si cambia per davvero.",
        fx: () => ({
          development: 0.4,
          attrs: { shooting: 0.3, handle: 0.25 },
          hidden: { workEthic: 4 },
          flavor: "L'anonimato, stavolta, è un dono. Lo spendi in palestra.",
        }),
      },
      {
        label: "Ti metti vicino ai veterani",
        detail: "Ascolti, non interrompi.",
        fx: () => ({
          hidden: { chemistry: 4, ego: -2 },
          attrs: { iq: 0.3 },
          flavor: "Due frasi rubate in corridoio. Valgono più di una copertina.",
        }),
      },
      {
        label: "Scrivi tre cose sul quaderno",
        detail: "Cosa sai, cosa no, cosa fai finta.",
        fx: () => ({
          attrs: { iq: 0.4 },
          hidden: { consistency: 3 },
          flavor: "Il quaderno si riempie. Tu anche, un palmo.",
        }),
      },
    ],
  },
  {
    id: "qy4",
    phase: "prime",
    title: "Una striscia senza tesi",
    subtitle: "Vinci, perdi, vinci. I giornali hanno trovato un altro nome.",
    choices: [
      {
        label: "Tieni il mestiere, nudo",
        detail: "Niente racconto che tenga il posto del lavoro.",
        fx: () => ({
          hidden: { consistency: 4, ego: -1 },
          attrs: { iq: 0.25, shooting: 0.2 },
          flavor: "I giorni uguali, tenuti dritti. A volte è un dono.",
        }),
      },
      {
        label: "Chiedi un uso diverso",
        detail: "Il vuoto non è un alibi per restare uguale.",
        fx: () => ({
          coachTrust: -1,
          form: 0.3,
          attrs: { handle: 0.3, passing: 0.2 },
          hidden: { ego: 2 },
          flavor: "Lo staff sposta un'uscita, niente discorso. Il vuoto, almeno, ha un compito nuovo.",
        }),
      },
      {
        label: "Copri i buchi degli altri",
        detail: "Se i riflettori sono altrove, il lavoro sporco è tuo.",
        fx: () => ({
          hidden: { chemistry: 4, motor: 1 },
          attrs: { defense: 0.35, passing: 0.2 },
          flavor: "Niente targa. Il gruppo, però, si muove meglio. Si sente.",
        }),
      },
    ],
  },
  {
    id: "qy5",
    phase: "veteran",
    title: "Ottobre, nudo, di nuovo",
    subtitle: "Niente rivincite, niente copertine. Solo ottobre, di nuovo.",
    choices: [
      {
        label: "Accetti i minuti che restano",
        detail: "Il ruolo, prima della voce.",
        fx: () => ({
          coachTrust: 3,
          hidden: { chemistry: 3, ego: -2 },
          attrs: { passing: 0.3, iq: 0.3 },
          flavor: "Non sei più il piano. Sei chi tiene insieme il piano.",
        }),
      },
      {
        label: "Diventi la voce, senza chiederlo",
        detail: "Un tempo morto piano, un ragazzo che ascolta.",
        fx: () => ({
          hidden: { chemistry: 5, mediaSavvy: 1 },
          attrs: { iq: 0.25 },
          flavor: "Due correzioni in allenamento. Lui alza lo sguardo. La carriera si passa così.",
        }),
      },
      {
        label: "Tratti il corpo da archivio",
        detail: "Durare è già un mestiere.",
        fx: () => ({
          injuryRisk: -5,
          hidden: { durability: 3, consistency: 2 },
          flavor: "Il corpo, trattato da archivio. Novembre arriva e tu ci sei, senza vanto.",
        }),
      },
    ],
  },
  {
    id: "qy6",
    phase: "any",
    title: "Hotel, bus, un pasto freddo",
    subtitle: "Hotel, bus, un pasto freddo. Nessuna tesi da vendere.",
    choices: [
      {
        label: "Dormi come un mestiere",
        detail: "Mascherina, tappi, disciplina.",
        fx: () => ({
          form: 0.4,
          hidden: { consistency: 3, durability: 1 },
          flavor: "Mascherina, tappi. Scendi con gli occhi a posto. Il gruppo, il giorno dopo, è più corto.",
        }),
      },
      {
        label: "Carte in fondo al bus",
        detail: "Il gruppo tiene, anche a diecimila metri.",
        fx: () => ({
          hidden: { chemistry: 4 },
          morale: 3,
          flavor: "Le carte tengono il bus. A terra, il cerchio è già fatto, senza riunione.",
        }),
      },
      {
        label: "Un filmato corto, lo schermo piccolo",
        detail: "La testa non ha fusi.",
        fx: () => ({
          attrs: { iq: 0.5, defense: 0.2 },
          hidden: { workEthic: 2 },
          flavor: "__COACH__ non chiede il sonno. Chiede tre uscite. Domani, quando le chiede, annuisci e basta.",
        }),
      },
    ],
  },
  {
    id: "qy7",
    phase: "any",
    title: "La conferenza che non chiede",
    subtitle: "La conferenza dura tre minuti. Nessuno alza la mano.",
    choices: [
      {
        label: "Ringrazi, già in corridoio",
        detail: "Il parquet è più onesto dei microfoni.",
        fx: () => ({
          hidden: { mediaSavvy: -1, consistency: 2 },
          form: 0.2,
          flavor: "Tre minuti, zero domande. Esci come sei entrato: pulito, e già altrove.",
        }),
      },
      {
        label: "Lasci una riga vera, e basta",
        detail: "Anche se non l'hanno chiesta.",
        fx: () => ({
          publicImage: 3,
          hidden: { mediaSavvy: 3 },
          flavor: "Lasci una riga vera sul tavolo. Qualcuno la raccoglie. La stanza, no.",
        }),
      },
      {
        label: "Torni al ferro quando chiudono",
        detail: "Il palazzetto vuoto è un giudice onesto.",
        fx: () => ({
          attrs: { shooting: 0.45 },
          hidden: { workEthic: 3 },
          flavor: "Il palazzetto si svuota. Tu resti al ferro, da solo, finché la luce cala.",
        }),
      },
    ],
  },
  {
    id: "qy8",
    phase: "prime",
    title: "Una pausa che può essere un dono",
    subtitle: "Una pausa nel rumore. Può essere un dono o un avvertimento.",
    choices: [
      {
        label: "Lo tratti come un dono",
        detail: "Respiri. Poi torni.",
        fx: () => ({
          morale: 5,
          form: 0.35,
          hidden: { durability: 2 },
          flavor: "Il vuoto, tenuto, pesa più di un'altra seduta stanca.",
        }),
      },
      {
        label: "Lo tratti come un avvertimento",
        detail: "Se non fai notizia, qualcuno ha smesso di contarti.",
        fx: () => ({
          development: 0.4,
          hidden: { workEthic: 4, ego: 1 },
          attrs: { shooting: 0.3, defense: 0.2 },
          flavor: "Raddoppi le ripetizioni. Lo staff lo vede, non lo dice, e questo basta.",
        }),
      },
      {
        label: "Chiedi a __COACH__ cosa vede",
        detail: "Meglio una verità scomoda che un silenzio.",
        fx: () => ({
          coachTrust: 4,
          attrs: { iq: 0.3 },
          hidden: { consistency: 2 },
          flavor: "Due minuti. Un compito, nient'altro. Lo tieni.",
        }),
      },
    ],
  },
  {
    id: "qy9",
    phase: "any",
    title: "Un mercoledì senza tesi",
    subtitle: "Niente avversario col nome. Resta da decidere come tenere i giorni.",
    choices: [
      {
        label: "La chiave, prima di tutti",
        detail: "L'orario è l'unica dichiarazione.",
        fx: () => ({
          hidden: { workEthic: 4, consistency: 2 },
          coachTrust: 2,
          attrs: { shooting: 0.2 },
          flavor: "La chiave gira. Sei il primo rumore del giorno, e lo tieni basso.",
        }),
      },
      {
        label: "Tieni il quaderno, nient'altro",
        detail: "Cosa sai, cosa no, cosa fai finta.",
        fx: () => ({
          attrs: { iq: 0.4 },
          hidden: { consistency: 3 },
          flavor: "Tre righe a fine seduta. A marzo sei un altro, di poco. Basta.",
        }),
      },
      {
        label: "Lasci correre la settimana",
        detail: "Non tutte devono diventare una tesi.",
        fx: () => ({
          form: 0.25,
          hidden: { durability: 2, ego: -1 },
          flavor: "Lasci la settimana senza copertina. A volte è il modo più onesto di tenerla.",
        }),
      },
    ],
  },
  {
    id: "feel-x1",
    phase: "any",
    title: "La pioggia sul tetto del bus",
    subtitle: "Dopo il fischio, il bus. La città scorre bagnata. Nessuno alza il volume.",
    choices: [
      {
        label: "Guardi il vetro, nient'altro",
        detail: "Il rumore tiene. Tu no.",
        fx: () => ({
          form: 0.35,
          flavor: "I lampioni passano. Arrivi più vuoto, e più a posto.",
        }),
      },
      {
        label: "Due parole al posto accanto",
        detail: "Il viaggio è lungo. Non deve esserlo muto.",
        fx: () => ({
          hidden: { chemistry: 5, ego: -1 },
          flavor: "Si parla poco. Il bus, dopo, è meno lungo.",
        }),
      },
      {
        label: "Segni un possesso sul quaderno",
        detail: "Una riga, nel buio. Poi la tieni.",
        fx: () => ({
          attrs: { iq: 0.4, defense: 0.15 },
          flavor: "Una lettura, corretta, tra un lampione e l'altro. Basta.",
        }),
      },
    ],
  },
  {
    id: "feel-x2",
    phase: "rookie",
    title: "Il caffè delle sette",
    subtitle: "La cucina è fredda. Il corpo non è ancora arrivato. La palestra aspetta.",
    choices: [
      {
        label: "Lo bevi in piedi, poi via",
        detail: "Chi arriva prima non deve dirlo.",
        fx: () => ({
          hidden: { workEthic: 4, motor: 2 },
          flavor: "La tazza vuota sul lavandino. La palestra è accesa. Entri.",
        }),
      },
      {
        label: "Ti siedi un minuto, e basta",
        detail: "Il corpo chiede poco. Glielo dai.",
        fx: () => ({
          form: 0.4,
          flavor: "Un minuto fermo. Il ginocchio ringrazia senza fare rumore.",
        }),
      },
      {
        label: "Chiami casa, mentre raffredda",
        detail: "La voce prima del mestiere, anche alle sette.",
        fx: () => ({
          morale: 5,
          flavor: "Due minuti. Lei non chiede i punti. Tu no, il mestiere.",
        }),
      },
    ],
  },
  {
    id: "feel-x3",
    phase: "veteran",
    title: "Un corridoio senza eco",
    subtitle: "Il palazzetto è vuoto. Restano le luci basse e i tuoi passi, nudi.",
    choices: [
      {
        label: "Cammini lento, ascolti",
        detail: "Il mestiere, sentito da fuori, è un altro mestiere.",
        fx: () => ({
          hidden: { consistency: 3, ego: -1 },
          flavor: "I passi tengono. Esci più piccolo, e più a posto.",
        }),
      },
      {
        label: "Un altro giro di liberi",
        detail: "Le luci basse non giudicano. Il ferro sì.",
        fx: () => ({
          attrs: { shooting: 0.35, handle: 0.15 },
          flavor: "I custodi aspettano. Tu finisci i dieci. Poi spegni.",
        }),
      },
      {
        label: "Aspetti chi è ancora in doccia",
        detail: "Nessuno dovrebbe uscire da solo, stasera.",
        fx: () => ({
          hidden: { chemistry: 6, mediaSavvy: 1 },
          flavor: "Aspetti. Uscite insieme. Il piazzale, dopo, è meno lungo.",
        }),
      },
    ],
  },
];

function phaseOf(s: PlayerState): StoryEvent["phase"] {
  if (s.age >= 32 || s.season >= 12) return "veteran";
  if (s.season <= 2) return "rookie";
  return "prime";
}

const QUIET_SETS: StoryEvent["choices"][] = [
  [
    {
      label: "Lavoro silenzioso",
      detail: "Niente dichiarazioni. Solo ripetizioni.",
      fx: (s) => ({
        development: 0.4,
        hidden: { workEthic: 3, consistency: 2 },
        attrs: { iq: 0.3 },
        flavor: say(s, [
          "Chiudi la porta della palestra. Fuori non succede niente. Dentro, il gesto diventa un altro gesto, e tu lo tieni.",
          "Nessuna intervista. Il gesto, ripetuto senza pubblico, diventa un altro gesto, e settembre lo saprà.",
          "Lo staff nota l'orario, non la voce. È quello che volevi, e per una volta ti basta.",
          "Lavoro silenzioso. Niente dichiarazioni. Solo ripetizioni, e il gesto che diventa un altro.",
          "Chiudi la porta. Fuori non succede niente. Dentro, il gesto tiene.",
          "Niente intervista. Il gesto, ripetuto senza pubblico, a settembre è un altro.",
        ]),
      }),
    },
    {
      label: "Stai col gruppo",
      detail: "Cene, sala video, il resto.",
      fx: (s) => ({
        hidden: { chemistry: 4, ego: -1 },
        coachTrust: 3,
        attrs: { passing: 0.25 },
        flavor: say(s, [
          "Una settimana da spogliatoio. Serve, anche quando non fa notizia, e il gruppo si accorcia di un palmo.",
          "Ridi alle battute giuste. Il gruppo si accorcia di un palmo, e per una volta ti sta bene non essere il centro.",
          "Non sei il centro. Sei il collante, e per una volta ti sta bene, perché il collante tiene più del titolo.",
          "Stai col gruppo. Cene, sala video, il resto. Il gruppo, dopo, è più corto.",
          "Cene, sala video, il resto. Nessun titolo, e il cerchio si stringe lo stesso.",
          "Ridi alle battute giuste. Per una volta ti sta bene non essere il centro.",
        ]),
      }),
    },
    {
      label: "Una sera per te",
      detail: "Spegni il telefono. Domani c'è.",
      fx: (s) => ({
        morale: 5,
        form: 0.35,
        hidden: { consistency: 1 },
        flavor: say(s, [
          "Una notte senza schema. Il giorno dopo il tiro esce più pulito, e tu non chiedi perché.",
          "Chiudi gli occhi prima delle undici. Sembra poco. Non lo è: il corpo ringrazia senza chiedere scusa.",
          "Il silenzio, scelto, vale più di un'altra seduta stanca, e tu lo tieni come un mestiere.",
          "Spegni il telefono. Domani c'è. Il corpo, per una volta, ringrazia.",
          "Spegni e basta. Il giorno dopo il gesto esce pulito, senza un perché da vendere.",
          "Il telefono in borsa prima delle undici. Il corpo, per una volta, non protesta.",
        ]),
      }),
    },
  ],
  [
    {
      label: "Arrivi prima di tutti",
      detail: "Il rispetto, a modo tuo: l'orario.",
      fx: (s) => ({
        hidden: { workEthic: 5, motor: 2 },
        coachTrust: 3,
        flavor: say(s, [
          "Sei il primo rumore nel parquet vuoto. Entri, e questo è già un rispetto.",
          "L'orario è l'unica dichiarazione. Basta.",
          "Arrivi prima di tutti. Lo staff nota l'orario, non la voce.",
          "La palestra, nuda, di lunedì. Entri, e questo è già un mestiere.",
          "Prima di tutti. Il rispetto, a modo tuo, è l'orario.",
          "La porta è aperta, la palestra vuota. Tu entri, e basta.",
        ]),
      }),
    },
    {
      label: "Chiedi i possessi noiosi",
      detail: "Quelli che nessuno taglia.",
      fx: (s) => ({
        attrs: { iq: 0.4, defense: 0.25 },
        hidden: { consistency: 3 },
        flavor: say(s, [
          "I tagli noiosi, tenuti. Una lettura corretta vale una settimana, e tu la tieni.",
          "I possessi brutti, studiati a volume basso. A ottobre si vedono.",
          "Chiedi i possessi noiosi. Quelli che nessuno taglia, e tu li tieni.",
          "Una lettura, corretta, a volume basso. Ottobre, poi, è più pulito.",
          "I possessi che nessuno taglia. Li studi, e a marzo sei un altro, di poco.",
          "Niente copertine. Una correzione, tenuta, vale una settimana.",
        ]),
      }),
    },
    {
      label: "Una telefonata lunga",
      detail: "Casa prima della veglia, anche a marzo.",
      fx: (s) => ({
        morale: 4,
        hidden: { chemistry: 1 },
        flavor: say(s, [
          "Riattacchi più leggero. Il palazzetto, dopo, è solo un palazzetto.",
          "La voce di casa. Poi il mestiere, che resta mestiere.",
          "Una telefonata lunga. Casa prima della veglia, anche a marzo.",
          "Appendi. Il palazzetto, dopo, pesa meno, e questo basta.",
          "La voce di casa, tenuta. Poi il mestiere, che non è tutto il giorno.",
          "Una telefonata. Appendi più leggero, e il giorno dopo il tiro esce più pulito.",
        ]),
      }),
    },
  ],
  [
    {
      label: "Copri i buchi, nient'altro",
      detail: "Se i riflettori sono altrove, il lavoro sporco è tuo.",
      fx: (s) => ({
        hidden: { chemistry: 4, motor: 1 },
        attrs: { defense: 0.3, passing: 0.2 },
        flavor: say(s, [
          "Niente targa sul petto. Il gruppo, coperto, si muove meglio. Si sente.",
          "I buchi si coprono in silenzio. È un mestiere poco fotografato.",
          "Copri i buchi, nient'altro. Se i riflettori sono altrove, il lavoro sporco è tuo.",
          "Niente copertina. Il gruppo, coperto, si muove meglio. Si sente.",
          "I buchi, coperti in silenzio. Il mestiere, così, non chiede applausi.",
          "Lavoro sporco, niente tesi. Il gruppo, dopo, è più corto, e giusto.",
        ]),
      }),
    },
    {
      label: "Tieni il quaderno",
      detail: "Cosa sai, cosa no, cosa fai finta.",
      fx: (s) => ({
        attrs: { iq: 0.45 },
        hidden: { consistency: 3, workEthic: 2 },
        flavor: say(s, [
          "Tre fogli, nient'altro. Si riempiono, e tu anche, un palmo.",
          "Tre righe a fine seduta. A marzo sono un altro giocatore, di poco. Basta.",
          "Tieni il quaderno. Cosa sai, cosa no, cosa fai finta.",
          "Tre righe. A marzo sei un altro, di poco, e questo basta.",
          "Il quaderno, nient'altro. Si riempie, e tu anche.",
          "Cosa sai, cosa no. Tre righe a fine seduta, e il palmo in più.",
        ]),
      }),
    },
    {
      label: "Lasci correre",
      detail: "Non tutte le settimane devono diventare una tesi.",
      fx: (s) => ({
        form: 0.25,
        hidden: { durability: 2, ego: -1 },
        flavor: say(s, [
          "I giorni uguali. Li tieni dritti, e a volte è un dono.",
          "Niente apice. Si tiene, e si va avanti.",
          "Lasci correre. Non tutte le settimane devono diventare una tesi.",
          "Niente tesi da vendere. Si tiene, e si gira pagina.",
          "Lasci correre la settimana. Il mestiere, nudo, basta.",
          "Una settimana senza apice. Si tiene dritta, e questo è già un mestiere.",
        ]),
      }),
    },
  ],
  [
    {
      label: "Studi i possessi noiosi",
      detail: "Quelli che nessuno taglia in sala video.",
      fx: (s) => ({
        attrs: { iq: 0.45, defense: 0.2 },
        hidden: { workEthic: 3 },
        flavor: say(s, [
          "Niente sequenze da copertina. Una lettura, corretta, vale una settimana, e ottobre la ricorda.",
          "I possessi brutti, tenuti a volume basso. A ottobre li hai già visti, e corretti.",
          "Studi i possessi noiosi. Quelli che nessuno taglia in sala video.",
          "Una lettura, corretta, a volume basso. Ottobre la ricorda, e tu anche.",
          "I possessi brutti, tenuti. A ottobre si vedono, e tu li hai già corretti.",
          "Una correzione tenuta in sala video vale una settimana di campionato.",
        ]),
      }),
    },
    {
      label: "Una cena col gruppo, senza tesi",
      detail: "Il collante, non il centro.",
      fx: (s) => ({
        hidden: { chemistry: 4, ego: -1 },
        morale: 3,
        flavor: say(s, [
          "A tavola si ride poco, si mangia male, si sta meglio. Il gruppo si accorcia di un palmo.",
          "Resti il collante, non il centro, e per una volta ti sta bene.",
          "Una cena col gruppo, senza tesi. Il collante, non il centro.",
          "Si ride poco. Il gruppo, dopo, è più corto, e giusto.",
          "Non sei il centro. Per una volta ti sta bene, e il collante tiene.",
          "Una cena, niente tesi. Il gruppo si accorcia di un palmo.",
        ]),
      }),
    },
    {
      label: "Spegni, davvero",
      detail: "Il telefono in borsa. Il corpo ringrazia.",
      fx: (s) => ({
        morale: 4,
        form: 0.3,
        hidden: { durability: 2 },
        flavor: say(s, [
          "Il corpo, per una volta, non chiede scusa: una notte senza schema basta.",
          "Chiudi gli occhi. Sembra poco. Il giorno dopo il tiro è più pulito.",
          "Spegni, davvero. Il telefono in borsa. Il corpo ringrazia.",
          "Una notte senza schema. Il corpo, per una volta, non chiede scusa.",
          "Il telefono in borsa. Il silenzio, scelto, vale più di un'altra seduta.",
          "Spegni davvero. Domani il gesto esce più pulito, e tu non chiedi il perché.",
        ]),
      }),
    },
  ],
];

export function isQuietStoryId(id: string): boolean {
  return id.startsWith("qy") || id.startsWith("quiet-");
}

/** Fallback se il pozzo qy è vuoto: tre porte che ruotano, non sempre le stesse. */
export function buildQuietYearEvent(s: PlayerState): StoryEvent {
  const { title, subtitle } = quietYearEventBits(s);
  const set = QUIET_SETS[Math.floor(rand() * QUIET_SETS.length)] ?? QUIET_SETS[0]!;
  return {
    id: `quiet-${s.season}-${s.age}`,
    phase: phaseOf(s),
    title: title || "Un ottobre senza titoli",
    subtitle: subtitle || "Niente copertine. Resta il lavoro, nudo, e tre modi di tenerlo.",
    choices: set,
  };
}
