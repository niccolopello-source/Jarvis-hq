
import type { StoryEvent } from "./types";

/** Eventi extra: tre scelte, ogni scelta muove attributi visibili e tratti nascosti. */
export const EXTRA_STORY: StoryEvent[] = [
  {
    id: "rk6",
    phase: "rookie",
    title: "Il primo tempo morto perso",
    subtitle: "Sbagli lo schema, __COACH__ chiama tempo morto. Lo sguardo di tutta la panchina ti arriva prima della voce, e resta.",
    choices: [
      {
        label: "Chiedi scusa in cerchio",
        detail: "Responsabilità, subito.",
        fx: () => ({
          coachTrust: 5,
          attrs: { iq: 0.7, passing: 0.3 },
          hidden: { chemistry: 4, ego: -2 },
          flavor: "Il gruppo chiude il discorso in dieci secondi. Tu impari il resto della notte.",
        }),
      },
      {
        label: "Correggi al possesso dopo",
        detail: "Parla il campo, non la voce.",
        fx: () => ({
          form: 0.6,
          attrs: { shooting: 0.5, handle: 0.4 },
          hidden: { clutch: 3 },
          flavor: "Il canestro successivo non è bello. È necessario.",
        }),
      },
      {
        label: "Resti in silenzio",
        detail: "Non vuoi peggiorare il momento.",
        fx: () => ({
          coachTrust: -2,
          attrs: { defense: 0.4, iq: 0.2 },
          hidden: { consistency: 2 },
          flavor: "Nessuno ti rimprovera. Qualcuno nota che non hai parlato.",
        }),
      },
    ],
  },
  {
    id: "rk7",
    phase: "rookie",
    title: "Un giornale locale ti chiama «progetto»",
    subtitle: "Non è un insulto. Fa più male di un insulto.",
    choices: [
      {
        label: "Appunti il ritaglio in armadietto",
        detail: "Ogni mattina, prima delle scarpe.",
        fx: () => ({
          development: 0.45,
          attrs: { athleticism: 0.5, shooting: 0.4 },
          hidden: { workEthic: 5, ego: 2 },
          flavor: "La parola «progetto» diventa un orario, non un'etichetta.",
        }),
      },
      {
        label: "Rispondi con i numeri",
        detail: "Chiedi più minuti, più uso.",
        fx: () => ({
          coachTrust: -3,
          form: 0.8,
          attrs: { handle: 0.5, shooting: 0.4 },
          hidden: { ego: 3, mediaSavvy: 2 },
          flavor: "Ottieni possessi. Non tutti te li sei guadagnati.",
        }),
      },
      {
        label: "Chiami l'autore",
        detail: "Una conversazione, non una guerra.",
        fx: () => ({
          publicImage: 4,
          attrs: { iq: 0.5, passing: 0.3 },
          hidden: { mediaSavvy: 5 },
          flavor: "L'articolo successivo è più preciso. Anche tu.",
        }),
      },
    ],
  },
  {
    id: "rk8",
    phase: "rookie",
    title: "Il veterano ti toglie il tiro aperto",
    subtitle: "Avevi il ritmo. Lui aveva l'anzianità.",
    choices: [
      {
        label: "Glielo lasci, impari il tempo",
        detail: "Gerarchia ora, spazio dopo.",
        fx: () => ({
          coachTrust: 4,
          attrs: { passing: 0.6, iq: 0.5 },
          hidden: { chemistry: 5, ego: -3 },
          flavor: "A fine quarto ti cerca lui. Il cerchio si chiude.",
        }),
      },
      {
        label: "Il possesso dopo tiri comunque",
        detail: "Il coraggio si vede da lontano.",
        fx: () => ({
          form: 0.7,
          attrs: { shooting: 0.6, handle: 0.3 },
          hidden: { clutch: 3, chemistry: -2 },
          flavor: "Il canestro entra. Qualche sopracciglio no.",
        }),
      },
      {
        label: "Ne parli a fine gara",
        detail: "Due frasi, niente scena.",
        fx: () => ({
          attrs: { iq: 0.4, defense: 0.3 },
          hidden: { chemistry: 3, mediaSavvy: 2 },
          flavor: "Capisce. Tu capisci quando stai zitto, la volta dopo.",
        }),
      },
    ],
  },
  {
    id: "pr11",
    phase: "prime",
    title: "Una gara da 40 punti, zero vittoria",
    subtitle: "I numeri tuoi, il risultato loro. I titoli scelgono il primo.",
    choices: [
      {
        label: "Parli solo della sconfitta",
        detail: "Niente sequenze in conferenza. Solo la sconfitta, detta chiara.",
        fx: () => ({
          coachTrust: 6,
          publicImage: 3,
          attrs: { passing: 0.5, defense: 0.4, iq: 0.3 },
          hidden: { chemistry: 5, ego: -3 },
          flavor: "Lo spogliatoio sente che i 40 non ti bastano.",
        }),
      },
      {
        label: "Rivendichi il tuo impatto",
        detail: "Senza di te era peggio.",
        fx: () => ({
          publicImage: 5,
          form: 0.5,
          attrs: { shooting: 0.5, handle: 0.3 },
          hidden: { ego: 4, mediaSavvy: 2 },
          flavor: "Hai ragione. Non è il tipo di ragione che unisce.",
        }),
      },
      {
        label: "Chiedi i possessi della difesa",
        detail: "I 40 non coprono le coperture sbagliate. Si studiano, a volume basso.",
        fx: () => ({
          development: 0.35,
          attrs: { defense: 0.7, iq: 0.5 },
          hidden: { workEthic: 4 },
          flavor: "A mezzanotte sei ancora in sala video.",
        }),
      },
    ],
  },
  {
    id: "pr12",
    phase: "prime",
    title: "La dirigenza vuole «più spettacolo»",
    subtitle: "Meno gioco in post, più transizione. I tifosi comprano le schiacciate.",
    choices: [
      {
        label: "Accetti il nuovo ritmo",
        detail: "Più primo passo, più rischio.",
        fx: () => ({
          publicImage: 5,
          injuryRisk: 4,
          attrs: { athleticism: 0.7, handle: 0.5, iq: -0.2 },
          hidden: { motor: 3, consistency: -2 },
          flavor: "Il palazzetto si alza prima. Il ginocchio prende appunti.",
        }),
      },
      {
        label: "Difendi il tuo gioco",
        detail: "Vince chi legge, non chi vola.",
        fx: () => ({
          coachTrust: 3,
          attrs: { iq: 0.6, shooting: 0.5, passing: 0.3 },
          hidden: { consistency: 4, ego: 2 },
          flavor: "Tieni la bussola. Qualche fischio arriva comunque.",
        }),
      },
      {
        label: "Un ibrido",
        detail: "Spettacolo quando serve, controllo quando conta.",
        fx: () => ({
          attrs: { handle: 0.4, iq: 0.4, athleticism: 0.3 },
          hidden: { chemistry: 2, mediaSavvy: 2 },
          development: 0.25,
          flavor: "Non fai felice nessuno del tutto. Fai felice la panchina.",
        }),
      },
    ],
  },
  {
    id: "pr13",
    phase: "prime",
    title: "Due gare in due notti a ovest, fuso ostile",
    subtitle: "Due gare in due notti, tre fusi, un ginocchio che parla.",
    choices: [
      {
        label: "Giochi entrambe da titolare",
        detail: "Niente scuse, niente minuti gestiti.",
        fx: () => ({
          publicImage: 4,
          injuryRisk: 8,
          attrs: { athleticism: 0.3, strength: 0.2 },
          hidden: { motor: 4, durability: -3 },
          flavor: "I tifosi in trasferta ti rispettano. Il fisico fa i conti a marzo.",
        }),
      },
      {
        label: "Salti la seconda",
        detail: "Aprile è più lungo di questa notte.",
        fx: () => ({
          injuryRisk: -5,
          gamesPenalty: 5,
          attrs: { iq: 0.4, shooting: 0.25 },
          hidden: { durability: 3, ego: -2 },
          flavor: "I social non perdonano. Il tendine sì.",
        }),
      },
      {
        label: "Esci dalla panchina nella seconda",
        detail: "Minuti veri, senza il peso del quinto fallo.",
        fx: () => ({
          gamesPenalty: 0,
          attrs: { shooting: 0.4, defense: 0.3 },
          hidden: { chemistry: 2, consistency: 2 },
          flavor: "Un compromesso da professionista, non da slogan.",
        }),
      },
    ],
  },
  {
    id: "pr14",
    phase: "prime",
    title: "__RIVAL__ firma un contratto massimo: i paragoni ripartono",
    subtitle: "Stessi anni, due contratti, una sola versione dei fatti.",
    choices: [
      {
        label: "Usi i suoi numeri come bersaglio",
        detail: "Ogni allenamento ha un nome.",
        fx: () => ({
          rivalry: 12,
          form: 1.3,
          development: 0.4,
          attrs: { shooting: 0.6, athleticism: 0.4 },
          hidden: { clutch: 3, workEthic: 2 },
          flavor: "La rivalità torna a essere un mestiere.",
        }),
      },
      {
        label: "Auguri pubblici, lavoro privato",
        detail: "Eleganza fuori, fame dentro.",
        fx: () => ({
          rivalry: 4,
          publicImage: 5,
          attrs: { iq: 0.5, passing: 0.3 },
          hidden: { mediaSavvy: 4, ego: -2 },
          flavor: "I titoli si ammorbidiscono. Tu no.",
        }),
      },
      {
        label: "Chiedi al tuo agente di muoversi",
        detail: "Il contratto è un linguaggio.",
        fx: () => ({
          publicImage: 2,
          coachTrust: -2,
          attrs: { handle: 0.3 },
          hidden: { ego: 4, mediaSavvy: 3 },
          flavor: "La voce gira. In spogliatoio qualcuno fa due conti.",
        }),
      },
    ],
  },
  {
    id: "pr15",
    phase: "prime",
    title: "Un quinto fallo stupido a tre minuti dalla fine",
    subtitle: "La panchina è un posto freddo quando la gara è viva.",
    choices: [
      {
        label: "Rivedi i contatti, uno a uno",
        detail: "Mani, piedi, anticipo.",
        fx: () => ({
          attrs: { defense: 0.7, iq: 0.5 },
          hidden: { consistency: 3, workEthic: 2 },
          development: 0.3,
          flavor: "Il fallo sparisce dai possessi che rivedi. Resta nella tua tecnica.",
        }),
      },
      {
        label: "Chiedi più aiuto in copertura",
        detail: "Non vuoi fare il marcatore solo.",
        fx: () => ({
          coachTrust: 2,
          attrs: { passing: 0.3, defense: 0.3 },
          hidden: { chemistry: 3 },
          flavor: "Lo staff cambia una rotazione. Tu resti in campo più a lungo.",
        }),
      },
      {
        label: "Accetti il rischio, resti aggressivo",
        detail: "Senza contatto non sei tu.",
        fx: () => ({
          injuryRisk: 3,
          form: 0.4,
          attrs: { defense: 0.4, strength: 0.4 },
          hidden: { motor: 2, ego: 2 },
          flavor: "I fischi arrivano. Anche le palle rubate.",
        }),
      },
    ],
  },
  {
    id: "vt7",
    phase: "veteran",
    title: "Una gamba non risponde in riscaldamento",
    subtitle: "Niente referto ancora. Solo una certezza: stasera non sei intero.",
    choices: [
      {
        label: "Ti fermi",
        detail: "Una notte persa, una stagione salvata.",
        fx: () => ({
          injuryRisk: -8,
          gamesPenalty: 6,
          attrs: { iq: 0.4, shooting: 0.2 },
          hidden: { durability: 4, ego: -2 },
          flavor: "I tifosi fischiano il referto. Tu cammini verso l'autobus.",
        }),
      },
      {
        label: "Giochi, minuti ridotti",
        detail: "Presenza, non eroismo.",
        fx: () => ({
          injuryRisk: 3,
          gamesPenalty: 2,
          attrs: { shooting: 0.3, passing: 0.3 },
          hidden: { chemistry: 3, consistency: 1 },
          flavor: "Entri, sistemi un possesso, esci. Un mestiere da veterano.",
        }),
      },
      {
        label: "Giochi titolare comunque",
        detail: "La maglia pesa più della gamba.",
        fx: () => ({
          injuryRisk: 11,
          publicImage: 4,
          attrs: { athleticism: -0.3, strength: 0.2 },
          hidden: { motor: 2, durability: -5 },
          flavor: "Finisci la gara. Il mattino dopo il referto è più lungo.",
        }),
      },
    ],
  },
  {
    id: "vt8",
    phase: "veteran",
    title: "Ti offrono una serata tributo a metà stagione",
    subtitle: "Una sequenza, vecchi compagni, lacrime in anticipo.",
    choices: [
      {
        label: "Accetti, poi torni al lavoro",
        detail: "Il rispetto non è un ritiro.",
        fx: () => ({
          publicImage: 7,
          attrs: { passing: 0.4, iq: 0.4 },
          hidden: { mediaSavvy: 4, chemistry: 3 },
          flavor: "Piangi tre secondi. Il quarto successivo è tuo.",
        }),
      },
      {
        label: "Rinvii a fine carriera",
        detail: "Non vuoi il funerale mentre giochi.",
        fx: () => ({
          form: 0.6,
          attrs: { shooting: 0.4, athleticism: 0.2 },
          hidden: { ego: 2, clutch: 2 },
          flavor: "Qualcuno si offende. Tu resti nel presente.",
        }),
      },
      {
        label: "La trasformi in serata di beneficenza",
        detail: "Meno statue, più senso.",
        fx: () => ({
          publicImage: 8,
          attrs: { iq: 0.3 },
          hidden: { mediaSavvy: 5, chemistry: 2 },
          flavor: "Il palazzetto cambia registro. Anche tu.",
        }),
      },
    ],
  },
  {
    id: "vt9",
    phase: "veteran",
    title: "Il nuovo titolare ti chiede lo spazio in post",
    subtitle: "Quello era il tuo metro quadrato. Adesso è un negoziato.",
    choices: [
      {
        label: "Glielo cedi, resti il lettore",
        detail: "Palla e voce, non il fondo.",
        fx: () => ({
          coachTrust: 6,
          attrs: { passing: 0.7, iq: 0.6, strength: -0.2 },
          hidden: { chemistry: 6, ego: -4 },
          flavor: "Il gioco gira. Il tuo nome resta nei tempi morti.",
        }),
      },
      {
        label: "Te lo giochi in allenamento",
        detail: "Lo spazio si merita ogni giorno.",
        fx: () => ({
          injuryRisk: 3,
          form: 0.5,
          attrs: { strength: 0.5, rebounding: 0.4, defense: 0.3 },
          hidden: { motor: 2, workEthic: 3 },
          flavor: "Sudore, contatti, gerarchia aggiornata a sudore.",
        }),
      },
      {
        label: "Chiedi un sistema a due riferimenti",
        detail: "Non è o lui o tu.",
        fx: () => ({
          coachTrust: 3,
          attrs: { passing: 0.4, shooting: 0.4, iq: 0.3 },
          hidden: { chemistry: 3, mediaSavvy: 2 },
          flavor: "__COACH__ disegna un'uscita nuova. Per una volta basta.",
        }),
      },
    ],
  },
  {
    id: "an9",
    phase: "any",
    title: "Una rissa lampo in transizione",
    subtitle: "Spintoni, panchine vuote, tre secondi che valgono una squalifica.",
    choices: [
      {
        label: "Trattieni il compagno",
        detail: "Sei il più lucido nel mucchio.",
        fx: () => ({
          coachTrust: 6,
          publicImage: 3,
          attrs: { iq: 0.4, strength: 0.2 },
          hidden: { chemistry: 5, ego: -2 },
          flavor: "Niente espulsione. In spogliatoio sei diventato un adulto.",
        }),
      },
      {
        label: "Non resti indietro",
        detail: "Se si salta, salti.",
        fx: () => ({
          publicImage: 4,
          coachTrust: -4,
          gamesPenalty: 1,
          attrs: { strength: 0.4, athleticism: 0.2 },
          hidden: { ego: 4, motor: 2 },
          flavor: "Una tecnica, un titolo, un rispetto diverso in spogliatoio.",
        }),
      },
      {
        label: "Esci dal mucchio, parli dopo",
        detail: "Il referto è già abbastanza lungo.",
        fx: () => ({
          attrs: { iq: 0.35, passing: 0.2 },
          hidden: { mediaSavvy: 3, consistency: 2 },
          flavor: "Qualcuno ti chiama freddo. Lo staff ti chiama utile.",
        }),
      },
    ],
  },
  {
    id: "an10",
    phase: "any",
    title: "Il fisioterapista trova un compenso sbagliato",
    subtitle: "Anni di salti sullo stesso piede. Si può ancora raddrizzare.",
    choices: [
      {
        label: "Un mese di rieducazione vera",
        detail: "Niente sequenze estive. Solo il corpo, rimesso a posto.",
        fx: () => ({
          injuryRisk: -10,
          attrs: { athleticism: 0.4, strength: 0.3, iq: 0.2 },
          hidden: { durability: 6, motor: -1 },
          flavor: "Niente telecamere in palestra. Un ottobre che cammina dritto.",
        }),
      },
      {
        label: "Lavori intorno al problema",
        detail: "Adatti il gesto, non ti fermi.",
        fx: () => ({
          injuryRisk: -2,
          attrs: { shooting: 0.5, iq: 0.4, athleticism: -0.15 },
          hidden: { consistency: 3 },
          flavor: "Il tiro cambia di un grado. Le gare no.",
        }),
      },
      {
        label: "Ignori, è sempre stato così",
        detail: "Finché entra, non si tocca.",
        fx: () => ({
          injuryRisk: 7,
          form: 0.3,
          attrs: { athleticism: 0.2 },
          hidden: { durability: -4, ego: 2 },
          flavor: "Per ora regge. I referti futuri hanno già una data.",
        }),
      },
    ],
  },
  {
    id: "an11",
    phase: "any",
    title: "Un ragazzo fuori dal palazzetto ti aspetta due ore",
    subtitle: "Maglia stinta, quaderno, una dedica che per lui è tutto.",
    choices: [
      {
        label: "Restituisci il tempo",
        detail: "Foto, firma, due minuti veri.",
        fx: () => ({
          publicImage: 5,
          attrs: { iq: 0.25 },
          hidden: { mediaSavvy: 3, chemistry: 2 },
          flavor: "Non cambia una statistica. Cambia il modo in cui esci dal palazzetto.",
        }),
      },
      {
        label: "Firma e vai",
        detail: "Il pullman non aspetta.",
        fx: () => ({
          form: 0.2,
          attrs: { handle: 0.2 },
          hidden: { mediaSavvy: -1 },
          flavor: "Professionale. Dimenticato in dieci metri.",
        }),
      },
      {
        label: "Lo fai entrare in palestra il giorno dopo",
        detail: "Una tribuna vuota, un allenamento vero.",
        fx: () => ({
          publicImage: 6,
          coachTrust: 2,
          attrs: { passing: 0.3, iq: 0.3 },
          hidden: { chemistry: 3, workEthic: 2 },
          flavor: "Lo staff alza un sopracciglio, poi lascia fare.",
        }),
      },
    ],
  },
  {
    id: "an12",
    phase: "any",
    title: "Una chiamata dalla tua Nazionale a metà settimana",
    subtitle: "Non è un torneo. È una finestra, tre gare, un aereo.",
    choices: [
      {
        label: "Parti",
        detail: "La maglia pesa più del calendario.",
        fx: (s) => {
          s.international = true;
          return {
            publicImage: 6,
            injuryRisk: 6,
            attrs: { iq: 0.3, shooting: 0.3 },
            hidden: { clutch: 2, chemistry: 2 },
            flavor: "Tre gare, un fuso, un orgoglio che non sta nel referto.",
          };
        },
      },
      {
        label: "Resti per il campionato",
        detail: "Il club paga lo stipendio.",
        fx: () => ({
          injuryRisk: -3,
          publicImage: -3,
          coachTrust: 3,
          attrs: { shooting: 0.3, defense: 0.2 },
          flavor: "Qualche fischio in estate. Un aprile più intero.",
        }),
      },
      {
        label: "Una gara sola, poi rientri",
        detail: "Presenza senza suicidio.",
        fx: () => ({
          publicImage: 3,
          injuryRisk: 2,
          attrs: { passing: 0.25, iq: 0.25 },
          hidden: { mediaSavvy: 2 },
          flavor: "Nessuno è del tutto contento. È il segno che hai scelto da adulto.",
        }),
      },
    ],
  },
  {
    id: "rk9",
    phase: "rookie",
    title: "Il tuo primo doppio-doppio, e nessuno lo nota",
    subtitle: "Referto pulito, spogliatoio già sotto la doccia. Solo tu resti a guardare i numeri.",
    choices: [
      {
        label: "Lo appunti sul quaderno",
        detail: "Una riga, una data, niente foto.",
        fx: () => ({
          development: 0.35,
          attrs: { rebounding: 0.5, iq: 0.4 },
          hidden: { workEthic: 4, consistency: 3 },
          flavor: "Il secondo doppio-doppio arriva senza che lo cerchi.",
        }),
      },
      {
        label: "Lo mandi alla stampa locale",
        detail: "Se non lo racconti tu, non esiste.",
        fx: () => ({
          publicImage: 4,
          attrs: { shooting: 0.3 },
          hidden: { mediaSavvy: 4, ego: 2 },
          flavor: "Un titolo piccolo. Un appetito più grande.",
        }),
      },
      {
        label: "Chiedi i possessi sbagliati, nient'altro",
        detail: "I 10 e 10 non coprono i tre tempi morti.",
        fx: () => ({
          coachTrust: 3,
          attrs: { passing: 0.4, defense: 0.4, iq: 0.3 },
          hidden: { chemistry: 3 },
          flavor: "__COACH__ alza un sopracciglio. Poi ti lascia la chiavetta.",
        }),
      },
    ],
  },
  {
    id: "rk10",
    phase: "rookie",
    title: "Un veterano ti invita a cena, poi ti interroga",
    subtitle: "Non è amicizia. È un esame sul tuo posto in gerarchia.",
    choices: [
      {
        label: "Rispondi con onestà",
        detail: "Cosa sai fare, cosa ancora no.",
        fx: () => ({
          coachTrust: 2,
          attrs: { iq: 0.5, passing: 0.3 },
          hidden: { chemistry: 5, ego: -2 },
          flavor: "Paga lui. Il giorno dopo ti cerca in transizione.",
        }),
      },
      {
        label: "Alzi il tono, resti nel tuo",
        detail: "Non sei un ospite. Sei della rosa.",
        fx: () => ({
          form: 0.4,
          attrs: { handle: 0.4, shooting: 0.3 },
          hidden: { ego: 3, clutch: 2 },
          flavor: "Il conto è tesissimo. In palestra, anche.",
        }),
      },
      {
        label: "Ascolti, prendi appunti mentali",
        detail: "Lui ha dieci anni di possessi in più.",
        fx: () => ({
          attrs: { iq: 0.6, defense: 0.3 },
          hidden: { workEthic: 3, consistency: 2 },
          flavor: "Torni con tre letture nuove. Nessuno lo sa.",
        }),
      },
    ],
  },
  {
    id: "pr16",
    phase: "prime",
    title: "Il tuo agente parla di «finestra» in conferenza",
    subtitle: "Non l'hai autorizzato. I titoli sì.",
    choices: [
      {
        label: "Lo smentisci, resti nella palestra",
        detail: "Il mercato non è il tuo mestiere, oggi.",
        fx: () => ({
          coachTrust: 5,
          publicImage: 2,
          attrs: { shooting: 0.4, defense: 0.3 },
          hidden: { chemistry: 4, ego: -2 },
          flavor: "Lo spogliatoio respira. L'agente meno.",
        }),
      },
      {
        label: "Lo lasci parlare",
        detail: "A volte serve una voce fuori dal cerchio.",
        fx: () => ({
          publicImage: 3,
          coachTrust: -3,
          attrs: { handle: 0.3 },
          hidden: { ego: 3, mediaSavvy: 3 },
          flavor: "Le voci di scambio si infittiscono. Anche i possessi.",
        }),
      },
      {
        label: "Chiami tu i microfoni",
        detail: "Una frase tua, non sua.",
        fx: () => ({
          publicImage: 5,
          attrs: { iq: 0.3 },
          hidden: { mediaSavvy: 5, clutch: 1 },
          flavor: "Chiudi la finestra con una battuta. Resta una fessura.",
        }),
      },
    ],
  },
  {
    id: "pr17",
    phase: "prime",
    title: "Una sera da 3 su 18, e il palazzetto fischia il tuo nome",
    subtitle: "Non è il ferro. È il rapporto.",
    choices: [
      {
        label: "Resti in palestra dopo",
        detail: "Duecento tiri, nessuno intorno.",
        fx: () => ({
          development: 0.4,
          attrs: { shooting: 0.8, handle: 0.3 },
          hidden: { workEthic: 5, consistency: 2 },
          flavor: "Il palazzetto del giorno dopo è più silenzioso. Il ferro no.",
        }),
      },
      {
        label: "Chiedi un cambio di schema",
        detail: "Quei 18 tiri non erano i tuoi.",
        fx: () => ({
          coachTrust: -2,
          attrs: { passing: 0.4, iq: 0.4, shooting: 0.2 },
          hidden: { chemistry: 2, ego: 2 },
          flavor: "__COACH__ stira la bocca. Poi sposta un blocco, e basta così.",
        }),
      },
      {
        label: "La gara dopo cerchi il contatto",
        detail: "Punti in lunetta, non in pedana.",
        fx: () => ({
          form: 0.5,
          attrs: { strength: 0.4, athleticism: 0.3, shooting: 0.3 },
          hidden: { motor: 3, clutch: 2 },
          flavor: "I fischi cambiano. I tuoi tiri, anche.",
        }),
      },
    ],
  },
  {
    id: "vt10",
    phase: "veteran",
    title: "Un ragazzo del secondo turno ti chiede il tuo posto",
    subtitle: "Non a parole. Nei minuti del quarto quarto.",
    choices: [
      {
        label: "Gli fai spazio, resti la voce",
        detail: "Il mestiere cambia forma, non peso.",
        fx: () => ({
          coachTrust: 5,
          attrs: { passing: 0.6, iq: 0.5 },
          hidden: { chemistry: 5, ego: -3 },
          flavor: "I tempi morti diventano tuoi. I possessi, suoi.",
        }),
      },
      {
        label: "Te lo giochi ogni giorno",
        detail: "La rosa non è un lascito.",
        fx: () => ({
          injuryRisk: 4,
          form: 0.4,
          attrs: { defense: 0.4, athleticism: 0.3, strength: 0.3 },
          hidden: { motor: 3, workEthic: 3 },
          flavor: "Lui accelera. Tu non rallenti. Lo staff prende appunti.",
        }),
      },
      {
        label: "Lo prendi sotto tutore",
        detail: "Due corpi, un'idea di gioco.",
        fx: () => ({
          attrs: { passing: 0.4, iq: 0.4, defense: 0.2 },
          hidden: { chemistry: 4, mediaSavvy: 2 },
          flavor: "I titoli parlano di passaggio di consegne. In campo è più complicato, e meglio.",
        }),
      },
    ],
  },
  {
    id: "an13",
    phase: "any",
    title: "Un fischio a tre decimi, e il video ti dà torto",
    subtitle: "Credevi di averla. Il monitor no.",
    choices: [
      {
        label: "Stringi la mano all'arbitro",
        detail: "La prossima chiamata potrebbe servirti.",
        fx: () => ({
          publicImage: 3,
          attrs: { iq: 0.4 },
          hidden: { mediaSavvy: 3, consistency: 2 },
          flavor: "Un gesto piccolo. Un credito che non sta nel referto.",
        }),
      },
      {
        label: "Esplodi, poi ti scusi in conferenza",
        detail: "Il fuoco prima, la misura dopo.",
        fx: () => ({
          publicImage: -2,
          form: 0.3,
          attrs: { strength: 0.2 },
          hidden: { ego: 3, clutch: 2 },
          flavor: "Una tecnica. Un titolo. Uno spogliatoio che ti capisce.",
        }),
      },
      {
        label: "Chiedi i possessi, nient'altro",
        detail: "Capire il contatto, non il copione.",
        fx: () => ({
          attrs: { defense: 0.5, iq: 0.4 },
          hidden: { workEthic: 3 },
          flavor: "La volta dopo le mani sono più basse. Il fischio, anche.",
        }),
      },
    ],
  },
  {
    id: "an14",
    phase: "any",
    title: "La città vota una tassa per il nuovo palazzetto",
    subtitle: "I tifosi ti chiedono da che parte stai. Non è basket, ma lo è.",
    choices: [
      {
        label: "Resti neutrale",
        detail: "Il contratto non è un programma elettorale.",
        fx: () => ({
          publicImage: -1,
          attrs: { iq: 0.2 },
          hidden: { mediaSavvy: 2 },
          flavor: "Qualcuno ti chiama freddo. Lo spogliatoio ti chiama professionale.",
        }),
      },
      {
        label: "Ti schieri con il quartiere",
        detail: "Il palazzetto è di chi ci vive intorno.",
        fx: () => ({
          publicImage: 6,
          attrs: { passing: 0.2 },
          hidden: { chemistry: 3, mediaSavvy: 3 },
          flavor: "Un titolo diverso. Un rispetto diverso, fuori dal cerchio.",
        }),
      },
      {
        label: "Parli solo di parquet",
        detail: "Un campo migliore, un mestiere migliore.",
        fx: () => ({
          publicImage: 2,
          coachTrust: 2,
          attrs: { shooting: 0.2 },
          hidden: { consistency: 2 },
          flavor: "Né eroe né vigliacco. Un giocatore che sa il suo perimetro.",
        }),
      },
    ],
  },
  {
    id: "an15",
    phase: "any",
    title: "Un infortunio altrui ti spinge nel quintetto titolare",
    subtitle: "Non l'hai chiesto. Non puoi far finta di niente.",
    choices: [
      {
        label: "Onori il posto, non lo festeggi",
        detail: "Minuti veri, voce bassa.",
        fx: () => ({
          coachTrust: 4,
          form: 0.6,
          attrs: { iq: 0.4, passing: 0.4, defense: 0.3 },
          hidden: { chemistry: 4, consistency: 3 },
          flavor: "Il titolare torna. Qualcosa del tuo ruolo resta.",
        }),
      },
      {
        label: "Ti prendi ogni possesso",
        detail: "Le finestre si chiudono.",
        fx: () => ({
          form: 1.0,
          attrs: { shooting: 0.6, handle: 0.4 },
          hidden: { ego: 4, clutch: 3, chemistry: -2 },
          flavor: "I numeri salgono. Qualche sguardo in panchina, anche.",
        }),
      },
      {
        label: "Chiami il compagno ogni sera",
        detail: "Il posto è in prestito, la relazione no.",
        fx: () => ({
          attrs: { passing: 0.3, iq: 0.3 },
          hidden: { chemistry: 5, mediaSavvy: 2 },
          flavor: "Quando rientra, ti cerca. Non tutti lo farebbero.",
        }),
      },
    ],
  },
  {
    id: "an16",
    phase: "any",
    title: "Un tempo morto che dura troppo",
    subtitle: "Lo schema è già detto. La stanza, no. Qualcuno deve chiudere il cerchio.",
    choices: [
      {
        label: "Parli tu, piano",
        detail: "Due dita sul petto, un compito a testa.",
        fx: () => ({
          coachTrust: 3,
          attrs: { passing: 0.35, iq: 0.3 },
          hidden: { chemistry: 4 },
          flavor: "Dici poco. Il gruppo si stringe. Qualcuno più vecchio di te annuisce.",
        }),
      },
      {
        label: "Ascolti, poi esegui",
        detail: "Niente invenzioni. Il piano è già scritto.",
        fx: () => ({
          coachTrust: 4,
          hidden: { consistency: 3 },
          attrs: { iq: 0.4 },
          flavor: "Ripeti lo schema a voce bassa. Entra. Lo staff non sorride: annuisce.",
        }),
      },
      {
        label: "Chiedi il possesso, se arriva",
        detail: "Se hai la mano alzata, tieni.",
        fx: () => ({
          form: 0.4,
          attrs: { shooting: 0.4, handle: 0.25 },
          hidden: { clutch: 3, ego: 2 },
          flavor: "Alzi la mano. Qualcuno in panchina alza un sopracciglio. Poi la palla arriva.",
        }),
      },
    ],
  },
  {
    id: "rk11",
    phase: "rookie",
    title: "Il primo volo in cui non dormi",
    subtitle: "Ritardo a terra, cuffie, una gara fra trentasei ore. La testa gira a vuoto.",
    choices: [
      {
        label: "Tappi, mascherina, mestiere",
        detail: "Dormi come sai dormire: per lavoro.",
        fx: () => ({
          form: 0.4,
          hidden: { consistency: 3, durability: 1 },
          flavor: "Scendi a destinazione con gli occhi a posto. Pochi lo notano. Conta.",
        }),
      },
      {
        label: "Studi i possessi sul tavolino",
        detail: "Lo schermo è piccolo. La testa no.",
        fx: () => ({
          attrs: { iq: 0.6, defense: 0.25 },
          hidden: { workEthic: 3 },
          flavor: "__COACH__ non chiede il sonno. Chiede l'uscita. Sì, l'hai vista.",
        }),
      },
      {
        label: "Carte in fondo all'aereo",
        detail: "Il gruppo tiene, anche a diecimila metri.",
        fx: () => ({
          hidden: { chemistry: 5 },
          morale: 3,
          flavor: "Si vince poco, si parla tanto. Lo spogliatoio, il giorno dopo, è più corto.",
        }),
      },
    ],
  },
  {
    id: "vt11",
    phase: "veteran",
    title: "Una conferenza in cui non alzano la mano",
    subtitle: "Tre minuti, nessuna domanda. I microfoni sono sull'altra sponda.",
    choices: [
      {
        label: "Ringrazi e vai",
        detail: "Il parquet è più onesto dei microfoni.",
        fx: () => ({
          hidden: { mediaSavvy: -1, consistency: 2 },
          form: 0.2,
          flavor: "Professionale. Dimenticato in dieci metri. Va bene così.",
        }),
      },
      {
        label: "Restituisci una frase vera",
        detail: "Anche se non l'hanno chiesta.",
        fx: () => ({
          publicImage: 3,
          hidden: { mediaSavvy: 3 },
          flavor: "Una frase sola. Qualcuno la tiene. Il resto della stanza è già altrove.",
        }),
      },
      {
        label: "Resti a tirare, da solo",
        detail: "Il palazzetto vuoto è un giudice onesto.",
        fx: () => ({
          attrs: { shooting: 0.4 },
          hidden: { workEthic: 3 },
          flavor: "I custodi chiudono. Tu resti un possesso in più, da solo, e basta.",
        }),
      },
    ],
  },
  {
    id: "ex-b1",
    phase: "rookie",
    title: "Sull'armadietto c'è un altro nome",
    subtitle: "Un pezzo di nastro, una battuta. Lo spogliatoio guarda, e aspetta.",
    choices: [
      { label: "Lo togli, senza scena", detail: "Niente teatro. Solo il tuo nome, di nuovo.",
        fx: () => ({ coachTrust: 3, attrs: { iq: 0.3 }, hidden: { chemistry: 4, ego: -2 },
          flavor: "Il nastro finisce nel cestino. Qualcuno annuisce. Il resto si chiude da solo.", }),
      },
      { label: "Lo lasci una settimana", detail: "Impari il tono prima di alzare la voce.",
        fx: () => ({ attrs: { passing: 0.3 }, hidden: { consistency: 3, mediaSavvy: 2 },
          flavor: "La battuta muore da sola. Tu impari quando lo spogliatoio è solo rumore.", }),
      },
      { label: "Rispondi con un nastro tuo", detail: "Stesso registro, niente guerra.",
        fx: () => ({ form: 0.3, hidden: { chemistry: 3, ego: 2 },
          flavor: "Due risate. Una gerarchia aggiornata a nastro adesivo.", }),
      },
    ],
  },
  {
    id: "ex-b2",
    phase: "any",
    title: "Il pullman resta al buio per un'ora",
    subtitle: "Una strada di campagna, il motore spento, una gara che non aspetta.",
    choices: [
      { label: "Chiudi gli occhi, conservi le gambe", detail: "Il corpo prima dello schema.",
        fx: () => ({ form: 0.4, hidden: { durability: 2, consistency: 2 },
          flavor: "Arrivi intero. La gara, dopo, ha ancora le gambe.", }),
      },
      { label: "Rivedi i possessi sul telefono", detail: "Una chiavetta, tre uscite, niente lamento.",
        fx: () => ({ attrs: { iq: 0.5, defense: 0.3 }, hidden: { workEthic: 3 },
          flavor: "Quando lo staff chiede l'uscita, l'hai già vista. Il buio, almeno, è servito.", }),
      },
      { label: "Tieni sveglio il gruppo", detail: "Carte, battute, il cerchio corto.",
        fx: () => ({ morale: 3, hidden: { chemistry: 4 },
          flavor: "Una battuta tiene meglio del silenzio. Il motore, alla fine, riparte già caldo.", }),
      },
    ],
  },
  {
    id: "ex-b3",
    phase: "prime",
    title: "Ti chiedono della casa, non del quarto quarto",
    subtitle: "Tre registratori, una domanda che non riguarda il parquet.",
    choices: [
      { label: "Riporti tutto al campo", detail: "Il mestiere sta lì, nient'altro.",
        fx: () => ({ coachTrust: 4, attrs: { iq: 0.3 }, hidden: { consistency: 3, mediaSavvy: 2 },
          flavor: "Chiudi il perimetro. Qualcuno resta a bocca asciutta. Lo staff no.", }),
      },
      { label: "Tre frasi, poi basta", detail: "Presenza, non confessione.",
        fx: () => ({ publicImage: 3, hidden: { mediaSavvy: 4 },
          flavor: "Dai il minimo onesto. I titoli restano corti. Anche tu.", }),
      },
      { label: "Ti alzi, vai in palestra", detail: "Il ferro non fa domande.",
        fx: () => ({ attrs: { shooting: 0.4 }, hidden: { workEthic: 3, mediaSavvy: -1 },
          flavor: "La stanza resta senza coda. Tu resti con i tiri.", }),
      },
    ],
  },
  {
    id: "ex-b4",
    phase: "prime",
    title: "Lo staff ti chiede di diventare il marcatore",
    subtitle: "Meno possessi tuoi, più notti sull'uomo migliore. È un mestiere, non un titolo.",
    choices: [
      { label: "Accetti, studi i piedi", detail: "Mani basse, anticipo, mestiere.",
        fx: () => ({ development: 0.3, coachTrust: 5, attrs: { defense: 0.7, iq: 0.5 }, hidden: { workEthic: 4 },
          flavor: "I punti calano. Le coperture no. __COACH__ lo nota prima dei giornali.", }),
      },
      { label: "Un possesso sì, uno no", detail: "Identità mista, niente slogan.",
        fx: () => ({ attrs: { defense: 0.4, shooting: 0.3, iq: 0.3 }, hidden: { consistency: 3 },
          flavor: "Non diventi una cosa sola. Diventi utile in due metri diversi.", }),
      },
      { label: "Difendi il tuo attacco", detail: "I possessi tuoi restano tuoi.",
        fx: () => ({ form: 0.4, coachTrust: -2, attrs: { shooting: 0.5, handle: 0.3 }, hidden: { ego: 3 },
          flavor: "Tieni la palla. Qualche copertura resta scoperta. Lo sguardo in panchina, anche.", }),
      },
    ],
  },
  {
    id: "ex-b5",
    phase: "veteran",
    title: "Il rinnovo arriva in una stanza senza microfoni",
    subtitle: "Niente conferenza. Una cifra, un anno, una stretta di mano nel corridoio.",
    choices: [
      { label: "Firmi e torni in palestra", detail: "Il contratto è un mezzo, non una tesi.",
        fx: () => ({ coachTrust: 5, attrs: { iq: 0.3 }, hidden: { chemistry: 4, ego: -2 },
          flavor: "Una firma, due passi, il parquet. Nessun titolo. Meglio.", }),
      },
      { label: "Chiedi un anno in più, voce bassa", detail: "Tempo, non scena.",
        fx: () => ({ publicImage: 2, hidden: { ego: 3, mediaSavvy: 2 },
          flavor: "Un anno in più, detto piano. Il dirigente annuisce. I microfoni restano spenti.", }),
      },
      { label: "Rimandi, vuoi capire il ruolo", detail: "Prima i minuti, poi la cifra.",
        fx: () => ({ attrs: { iq: 0.4, passing: 0.3 }, hidden: { consistency: 3 },
          flavor: "Niente firma oggi. Una conversazione onesta sul tuo metro quadrato.", }),
      },
    ],
  },
  {
    id: "ex-b6",
    phase: "any",
    title: "In sala video, tre azioni di __RIVAL__, una tua",
    subtitle: "Non è un confronto. È un'eco. Lo staff non dice il nome. Non serve.",
    choices: [
      { label: "Prendi appunti, niente orgoglio", detail: "La lettura, non la rissa.",
        fx: () => ({ rivalry: 4, attrs: { iq: 0.5, defense: 0.3 }, hidden: { workEthic: 3 },
          flavor: "Tre schemi nuovi. Il nome suo resta fuori dalla bocca.", }),
      },
      { label: "Chiedi le tue tre, dopo", detail: "Lo stesso volume, lo stesso metro.",
        fx: () => ({ rivalry: 6, attrs: { shooting: 0.3 }, hidden: { ego: 3, clutch: 2 },
          flavor: "Ottieni lo stesso metro. L'eco, almeno, ha due voci.", }),
      },
      { label: "Usi la sua uscita in gara", detail: "Se l'hai vista, la chiudi.",
        fx: () => ({ rivalry: 8, form: 0.4, attrs: { defense: 0.4, iq: 0.4 }, hidden: { clutch: 3 },
          flavor: "La volta dopo i piedi sono già lì. __RIVAL__ lo sente, anche senza vederti.", }),
      },
    ],
  },
];
