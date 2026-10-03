
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
    chunkFailed: "Non è stato possibile caricare {what}. La carriera non è toccata.",
    chunkFailedFinal: "{what} non è disponibile adesso. Il resto della carriera funziona; riprova più tardi ricaricando la pagina.",
    chunkRetry: "Riprova",
    chartName: "il grafico",
    chartNameCap: "Il grafico",
    chartLoading: "Caricamento grafico…",
    profileReady: "Profilo pronto",
    playerReady: "Il tuo giocatore è pronto",
    playerReadyLede: "{name} — {role}. I tratti restano. Poi il percorso, poi la maglia.",
    startCareer: "Inizia la carriera",
    draftRound: "Round {n} di {total}",
    draftThree: "Tre strade. Una resta fuori.",
    ageYears: "{n} anni",
    lastSeason: "ultima stagione",
    contractYears: "{n} anni",
    contractYear: "1 anno",
    swipeHint: "Scorri tra Storia, Anno, Lega, Vita",
    showFullLog: "Mostra tutta la storia",
    leagueEuro: "Eurolega",
    careerTabs: "Sezioni della carriera",
    finalChampion: "Finale · Campione",
    choiceMade: "Scelta: {x}",
    gameWon: "Partita vinta",
    gameLost: "Partita persa",
    seriesWon: "Serie vinta",
    seriesLost: "Serie persa",
    pathTitle: "Il percorso verso il professionismo",
    pathSub: "Come arrivi al grande salto. Poi arriva la chiamata, e la maglia.",
    pathNcaa: "College NCAA, Stati Uniti",
    pathNcaaDetail: "Fondamentali solidi. Arrivi a 21 anni.",
    pathEuro: "Accademia europea",
    pathEuroDetail: "Crescita paziente, più intelligenza cestistica.",
    pathGl: "Salto in G League",
    pathGlDetail: "Talento grezzo, minuti subito.",
    theCall: "La chiamata",
    pickN: "{n}ª scelta",
    overallN: "Overall {n}",
    enterGym: "Entra in palestra",
    bestOfSeven: "Serie al meglio delle sette",
    summerMarket: "Mercato estivo",
    offerExtension: "Rinnovo · ",
    offerRing: "Anello · ",
    offerMax: "Massimo · ",
    market: "Mercato",
    tradeRumors: "Voci di scambio",
    tradeAccept: "Accetti: {team}",
    tradeAcceptDetail: "{city} · il contratto ti segue.",
    tradeRefuse: "Rifiuti, resti a {team}",
    tradeRefuseDetail: "Fedeltà. Lo staff se lo ricorda.",
    tradeDone: "Scambio chiuso",
    tradeForced: "La dirigenza ha deciso senza chiederti il permesso.",
    tradeEnterLocker: "Entra nello spogliatoio nuovo",
    retireTitle: "L'ultimo inverno",
    retireSub: "Hai chiuso i 35. Puoi scendere a 36, o lasciare il parquet qui.",
    retirePlay: "Gioca a 36 anni",
    retirePlayDetail: "Un'ultima stagione. Poi, basta.",
    retireNow: "Chiudi ora",
    retireNowDetail: "A testa alta, senza l'anno di troppo.",
    moveOn: "Si va avanti",
    moveOnSub: "La carta non ha un bivio. Il calendario, sì.",
    continue: "Continua",
    seasonN: "Stagione {n}",
    enterPlayoffs: "Entra nei playoff",
    nextSeason: "Prossima stagione",
    seasonEmpty: "Dopo la prima stagione qui trovi la scheda completa dell'anno.",
    outOfPlayoffs: "fuori",
    simStatsNote: "Statistiche simulate.",
    playoffPath: "Percorso playoff",
    statPoints: "PUNTI",
    statRebounds: "RIMBALZI",
    statAssists: "ASSIST",
    ovrCurve: "Curva overall",
    ovrCurveCap: "Picco osservato tra 26 e 28 anni. La linea piena è il tuo overall; quella tratteggiata è la traiettoria.",
    bySeason: "Stagione per stagione",
    noRows: "Ancora nessuna riga.",
    ageShort: "{n}a",
    summerDev: "Sviluppo estivo",
    summerDevEmpty: "Dopo la prima stagione vedrai la crescita estiva.",
    seasonShort: "S.{n}",
    reviewLede: "Diario della carriera in corso. I tratti nascosti restano coperti fino al verdetto — restano le sensazioni.",
    feelings: "Sensazioni",
    choices: "Scelte",
    noChoices: "Nessuna scelta ancora.",
    milestonesH: "Traguardi",
    noMilestones: "Ancora niente da appendere.",
    visibleAttrs: "Attributi visibili",
    jerseysWorn: "Maglie indossate",
    points: "Punti",
    medal: "Medaglia",
    jerseyOne: "maglia",
    jerseyMany: "maglie",
    bestYear: "Miglior anno",
    winters: "Gli inverni",
    wholeCareer: "Tutta la carriera · {n} anni",
    traitsRevealed: "Tratti svelati",
    finalAttrs: "Attributi finali",
    anotherLife: "Un'altra vita",
    home: "Home",
    archiveEmpty: "Nessuna carriera salvata su questo dispositivo.",
    atAge: " a {n} anni",
    titleOne: "titolo",
    titleMany: "titoli",
    hofHall: "Nella Hall",
    hofBorder: "Candidato, non eletto",
    hofOut: "Fuori dalla Hall",
    draftLine: "Draft: {v}",
    teamsLine: "Squadre: {v}",
    noData: "dato non disponibile",
    seasonAwardsLine: "Premi stagionali: {v}",
    crashTitle: "Si è verificato un problema",
    crashBody: "Ricarica PIVOT 23 per riprovare. La carriera salvata nel browser resta disponibile.",
    namePlaceholder: "Es. Marco Ferrara",
    adReserved: "Riservato",
    crashReload: "Ricarica PIVOT 23",
    crashSetAside: "Se il problema torna: apri la home e metti da parte la carriera",
    crashSetAsideDetail: "Una copia esatta resta salvata in questo browser.",
    crashSetAsideFailed: "Non è stato possibile metterla da parte in sicurezza: la carriera non è stata toccata.",
    idPace: "ritmo alto",
    idHalfCourt: "metà campo",
    idThreePoint: "tiro da tre",
    idIsolation: "isolamento",
    idBallMovement: "movimento di palla",
    idDefense: "difesa",
    idPhysical: "fisicità",
    idDevelopment: "crescita",
    idVeteran: "veterani",
    ambRebuild: "ricostruzione",
    ambDevelopment: "sviluppo",
    ambCompetitive: "playoff",
    ambContender: "contendere",
    ambChampionship: "titolo",
    sysDefense: "Subiscono {v} punti. La difesa è il mestiere della squadra.",
    sysPace: "Ritmo {v}. Qui la partita corre, e chi non tiene il passo esce.",
    sysThreePoint: "Il tiro da tre apre il campo. Chi non lo tira, lo subisce.",
    sysBallMovement: "Il pallone gira prima del tiro. L'ego, in questo spogliatoio, conta meno.",
    sysIsolation: "Uno crea, gli altri tengono. Il possesso ha un nome solo.",
    sysPhysical: "Si gioca di contatto. Il ferro e il corpo arrivano prima dello schema.",
    sysHalfCourt: "Si gioca a metà campo. Ogni possesso è un disegno, non una corsa.",
    sysDevelopment: "I minuti vanno ai giovani. Chi è già arrivato deve fare spazio.",
    sysVeteran: "Lo spogliatoio ha memoria. I minuti si guadagnano, non si chiedono.",
    systemOf: "Sistema {v}",
    statPF: "PF",
    statPS: "PS",
    statPace: "RITMO",
    statWL: "V-S",
    team: "Squadra",
    standingsLater: "La classifica compare dopo la prima stagione.",
    standingsLaterAlbo: "La classifica compare dopo la prima stagione. L'albo d'oro, intanto, è già aperto.",
    alboNba: "Albo d'oro NBA",
    alboEuro: "Albo d'oro Eurolega",
    alboCap: "Le squadre campioni, dal 2023-24. Se alzi l'anello, il tuo nome resta qui.",
    leagueCap: "{y}. Una faccia per squadra. Tocca una riga: il riassunto si apre sotto.",
    reigningChamp: "Campione in carica",
    yourRing: "Il tuo anello",
    yourTitle: "Il tuo titolo",
    confEast: "Est",
    confWest: "Ovest",
    leagueAwards: "Premi della lega",
    leaders: "Leader",
    voteTie: "Sul voto è un testa a testa.",
    voteYouAhead: "Sul voto sei davanti di {v}.",
    voteAhead: "Sul voto {name} è davanti di {v}.",
    royCap: "Solo il primo anno. Contano punti, rimbalzi, assist e le partite giocate.",
    playerCol: "Giocatore",
    royCols: "PT · RIM · ASS",
    dpoyCap: "Ogni stagione NBA. Stoppate, palle rubate, vittorie difensive, notti giocate.",
    guideStep: "Passo {n} di {total}",
    resumeTitle: "Si rientra in palestra",
    resumeSub: "Il gruppo è già in campo. Manca solo il tuo nome sul referto.",
    resumeGo: "Entra in campo",
    resumeGoDetail: "La stagione riprende da qui.",
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
    chunkFailed: "{what} could not be loaded. Your career is not affected.",
    chunkFailedFinal: "{what} is not available right now. The rest of the career works; try again later by reloading the page.",
    chunkRetry: "Try again",
    chartName: "the chart",
    chartNameCap: "The chart",
    chartLoading: "Loading chart…",
    profileReady: "Profile ready",
    playerReady: "Your player is ready",
    playerReadyLede: "{name} — {role}. The traits stay. Then the path, then the jersey.",
    startCareer: "Start the career",
    draftRound: "Round {n} of {total}",
    draftThree: "Three roads. One stays out.",
    ageYears: "{n} years old",
    lastSeason: "last season",
    contractYears: "{n} years",
    contractYear: "1 year",
    swipeHint: "Swipe between Story, Year, League, Life",
    showFullLog: "Show the whole story",
    leagueEuro: "EuroLeague",
    careerTabs: "Career sections",
    finalChampion: "Final · Champion",
    choiceMade: "Choice: {x}",
    gameWon: "Game won",
    gameLost: "Game lost",
    seriesWon: "Series won",
    seriesLost: "Series lost",
    pathTitle: "The road to the pros",
    pathSub: "How you reach the big jump. Then comes the call, and the jersey.",
    pathNcaa: "NCAA college, United States",
    pathNcaaDetail: "Solid fundamentals. You arrive at 21.",
    pathEuro: "European academy",
    pathEuroDetail: "Patient growth, more basketball IQ.",
    pathGl: "Straight to the G League",
    pathGlDetail: "Raw talent, minutes right away.",
    theCall: "The call",
    pickN: "Pick {n}",
    overallN: "Overall {n}",
    enterGym: "Go to the gym",
    bestOfSeven: "Best-of-seven series",
    summerMarket: "Summer market",
    offerExtension: "Extension · ",
    offerRing: "Ring chase · ",
    offerMax: "Max deal · ",
    market: "Market",
    tradeRumors: "Trade rumors",
    tradeAccept: "Accept: {team}",
    tradeAcceptDetail: "{city} · your contract moves with you.",
    tradeRefuse: "Decline, stay with {team}",
    tradeRefuseDetail: "Loyalty. The staff will remember.",
    tradeDone: "Trade done",
    tradeForced: "The front office decided without asking you.",
    tradeEnterLocker: "Walk into the new locker room",
    retireTitle: "The last winter",
    retireSub: "You have turned 35. You can play at 36, or leave the court here.",
    retirePlay: "Play at 36",
    retirePlayDetail: "One last season. Then that's it.",
    retireNow: "Retire now",
    retireNowDetail: "Head held high, without the year too many.",
    moveOn: "Moving on",
    moveOnSub: "This card has no fork. The calendar does.",
    continue: "Continue",
    seasonN: "Season {n}",
    enterPlayoffs: "Go to the playoffs",
    nextSeason: "Next season",
    seasonEmpty: "After the first season, the full season sheet appears here.",
    outOfPlayoffs: "out",
    simStatsNote: "Simulated statistics.",
    playoffPath: "Playoff run",
    statPoints: "POINTS",
    statRebounds: "REBOUNDS",
    statAssists: "ASSISTS",
    ovrCurve: "Overall curve",
    ovrCurveCap: "Peak usually between 26 and 28. The solid line is your overall; the dashed line is the trajectory.",
    bySeason: "Season by season",
    noRows: "No seasons yet.",
    ageShort: "{n}y",
    summerDev: "Summer development",
    summerDevEmpty: "Summer growth appears after the first season.",
    seasonShort: "S{n}",
    reviewLede: "Journal of the career in progress. Hidden traits stay covered until the verdict — only the feelings remain.",
    feelings: "Feelings",
    choices: "Choices",
    noChoices: "No choices yet.",
    milestonesH: "Milestones",
    noMilestones: "Nothing to hang on the wall yet.",
    visibleAttrs: "Visible attributes",
    jerseysWorn: "Jerseys worn",
    points: "Points",
    medal: "Medal",
    jerseyOne: "jersey",
    jerseyMany: "jerseys",
    bestYear: "Best year",
    winters: "The winters",
    wholeCareer: "Whole career · {n} years",
    traitsRevealed: "Traits revealed",
    finalAttrs: "Final attributes",
    anotherLife: "Another life",
    home: "Home",
    archiveEmpty: "No careers saved on this device.",
    atAge: " at {n}",
    titleOne: "title",
    titleMany: "titles",
    hofHall: "In the Hall",
    hofBorder: "Candidate, not elected",
    hofOut: "Outside the Hall",
    draftLine: "Draft: {v}",
    teamsLine: "Teams: {v}",
    noData: "not available",
    seasonAwardsLine: "Season awards: {v}",
    crashTitle: "Something went wrong",
    crashBody: "Reload PIVOT 23 to try again. The career saved in the browser is still available.",
    namePlaceholder: "e.g. Marco Ferrara",
    adReserved: "Reserved",
    crashReload: "Reload PIVOT 23",
    crashSetAside: "If it keeps happening: open the home and set the career aside",
    crashSetAsideDetail: "An exact copy stays saved in this browser.",
    crashSetAsideFailed: "It could not be set aside safely: the career was not touched.",
    idPace: "high pace",
    idHalfCourt: "half court",
    idThreePoint: "three-point shooting",
    idIsolation: "isolation",
    idBallMovement: "ball movement",
    idDefense: "defense",
    idPhysical: "physicality",
    idDevelopment: "development",
    idVeteran: "veterans",
    ambRebuild: "rebuild",
    ambDevelopment: "development",
    ambCompetitive: "playoffs",
    ambContender: "contender",
    ambChampionship: "title",
    sysDefense: "They allow {v} points. Defense is this team's trade.",
    sysPace: "Pace {v}. The game runs here, and whoever can't keep up sits.",
    sysThreePoint: "The three opens the floor. If you don't shoot it, you suffer it.",
    sysBallMovement: "The ball moves before the shot. In this locker room, ego counts for less.",
    sysIsolation: "One creates, the others hold. Every possession has a single name.",
    sysPhysical: "It's a contact game. The rim and the body come before the play.",
    sysHalfCourt: "A half-court game. Every possession is a design, not a race.",
    sysDevelopment: "Minutes go to the young. Whoever has already made it must make room.",
    sysVeteran: "The locker room remembers. Minutes are earned, not requested.",
    systemOf: "System: {v}",
    statPF: "PTS",
    statPS: "OPP",
    statPace: "PACE",
    statWL: "W-L",
    team: "Team",
    standingsLater: "Standings appear after the first season.",
    standingsLaterAlbo: "Standings appear after the first season. The roll of honour is already open.",
    alboNba: "NBA champions",
    alboEuro: "EuroLeague champions",
    alboCap: "Champions since 2023-24. If you lift the ring, your name stays here.",
    leagueCap: "{y}. One face per team. Tap a row: the summary opens below.",
    reigningChamp: "Reigning champion",
    yourRing: "Your ring",
    yourTitle: "Your title",
    confEast: "East",
    confWest: "West",
    leagueAwards: "League awards",
    leaders: "Leaders",
    voteTie: "The vote is neck and neck.",
    voteYouAhead: "You lead the vote by {v}.",
    voteAhead: "{name} leads the vote by {v}.",
    royCap: "First year only. Points, rebounds, assists and games played count.",
    playerCol: "Player",
    royCols: "PTS · REB · AST",
    dpoyCap: "Every NBA season. Blocks, steals, defensive wins, nights played.",
    guideStep: "Step {n} of {total}",
    resumeTitle: "Back in the gym",
    resumeSub: "The group is already on the floor. Only your name is missing from the scoresheet.",
    resumeGo: "Take the floor",
    resumeGoDetail: "The season picks up from here.",
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

const DOC_TITLE: Partial<Record<Lang, string>> = {
  it: "PIVOT 23 — La tua carriera cestistica",
  en: "PIVOT 23 — Your basketball career",
};

/** <html lang> and the tab title follow the reader; index.html ships the Italian defaults. */
function syncDocument() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = current;
  const title = DOC_TITLE[current];
  if (title) document.title = title;
}

/*
 * A language can ship part of its text as a lazy chunk (the English narrative catalog). The
 * switch waits for it, so the screen never shows a half-translated frame; if the chunk fails,
 * the switch still happens and stored text falls back to the canonical Italian.
 */
const loaders = new Map<Lang, () => Promise<unknown>>();
const loaded = new Set<Lang>();
let switchSeq = 0;

export function registerLangLoader(lang: Lang, load: () => Promise<unknown>) {
  loaders.set(lang, load);
}

function whenReady(lang: Lang): Promise<void> | null {
  const load = loaders.get(lang);
  if (!load || loaded.has(lang)) return null;
  const done = () => void loaded.add(lang);
  return load().then(done, done);
}

function apply(lang: Lang, seq: number, notify: boolean) {
  if (seq !== switchSeq) return; // a later choice wins
  current = lang;
  syncDocument();
  if (notify) listeners.forEach((fn) => fn());
}

export function initLang() {
  const lang = readStored();
  const seq = ++switchSeq;
  const ready = whenReady(lang);
  if (ready) void ready.then(() => apply(lang, seq, true));
  else apply(lang, seq, false);
}

export function setLang(next: Lang) {
  const lang = demoLang(next);
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* resta in memoria */
  }
  const seq = ++switchSeq;
  const ready = whenReady(lang);
  if (ready) void ready.then(() => apply(lang, seq, true));
  else apply(lang, seq, true);
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

/** Every chrome key, in dictionary order. Used by the coverage tests. */
export function msgKeys(): Msg[] {
  return Object.keys(IT) as Msg[];
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

/**
 * Italian/English chrome pairs. Some chrome strings are stored inside saved story entries
 * (pending scenes, log titles); the narrative layer uses these pairs to re-render them.
 */
export function chromePairs(): [it: string, en: string][] {
  return (Object.keys(IT) as Msg[]).map((k) => [IT[k], EN[k]] as [string, string]).filter(([it, en]) => it && en && it !== en);
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
