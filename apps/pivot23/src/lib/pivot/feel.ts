
import { rand } from "./rng";
import { say } from "./voice";
import { labelIdentity } from "./world";
import type { Conference, PlayerState, SeasonRow } from "./types";

type LinePool = { pool: readonly string[]; vars?: Record<string, string> };

function shuffleIn<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

/** Due frasi che danno il sapore della stagione, non i numeri. Mai la stessa due volte. */
export function seasonAtmosphere(s: PlayerState, row: SeasonRow): string {
  const cands: LinePool[] = [];
  const add = (ok: boolean, pool: readonly string[], vars?: Record<string, string>) => {
    if (ok && pool.length) cands.push({ pool, vars });
  };
  const games = Math.max(1, row.wins + row.losses);
  const pct = row.wins / games;
  const euro = s.league === "EuroLega";
  const city = s.team.city;

  add(row.gp <= (euro ? 20 : 52), [
    "Il fisico ha chiesto il conto: notti in sala medica, lo spogliatoio che parla a voce bassa.",
    "Hai saltato più sere di quante avresti voluto. Da fuori il campo sembra più lontano.",
    "Le sedute con il fisioterapista sono diventate un appuntamento. Non un'eccezione.",
    "La lista infortuni ti tiene in una stanza laterale. Si gioca, tu conti i giorni.",
    "Un infortunio non fa rumore. Fa vuoto: i minuti che non sono tuoi.",
    "Torni, ti fermi, torni. Il calendario non aspetta le tue ginocchia.",
    "La stagione ha un buco nel mezzo. Lo riempi di ghiaccio e di attesa.",
    "Il referto dice assente. Tu c'eri, in sala, a guardare gli altri coprire la tua voce.",
    "Conti i giorni dal ritorno. Ogni mattina il ginocchio risponde prima di te.",
    "Una settimana sì, due no. Il mestiere, da ferito, è aspettare senza spegnersi.",
  ]);
  add(row.gp > (euro ? 20 : 52) && s.age >= 33, [
    "Al mattino le ginocchia parlano prima di te. Poi, piano, il corpo obbedisce.",
    "Non corri come a ventidue. Compensi con la testa, e la testa tiene.",
    "Ogni riscaldamento è un negoziato. Ogni quarto, una trattativa vinta.",
    "I giovani partono. Tu arrivi dopo, e spesso arrivi meglio.",
    "Il corpo ha un archivio. A ottobre lo sfogli con cura, pagina dopo pagina.",
    "Dormi di più, parli di meno. È l'unica forma di lusso che ti concedi.",
    "La palla arriva dove la mettevi a venticinque. Ci metti un passo in più.",
    "A quest'età il riscaldamento è già una partita. La vinci in silenzio, ogni sera.",
    "Non chiedi al corpo di essere giovane. Gli chiedi di arrivare a maggio.",
  ]);
  add(row.gp > (euro ? 20 : 52) && s.age === 32, [
    "Trentadue anni. Il corpo non è vecchio: è informato, e pretendi che lo resti.",
    "A trentadue il primo passo è ancora tuo. Il secondo, lo negozi.",
    "Trentadue: il talento è ancora lì, il calendario inizia a parlare. Tu rispondi col posto.",
    "A trentadue non sei un ragazzo. Non sei un relitto. Sei un mestiere che tiene.",
    "Trentadue anni, e ogni ottobre è ancora una firma tua, non dello staff.",
    "A trentadue il corpo chiede un orario. Tu glielo dai, e scendi lo stesso.",
  ]);
  add(row.gp > (euro ? 20 : 52) && s.age === 33, [
    "Trentatré anni non sono un numero. Sono un modo diverso di scendere in campo.",
    "A trentatré il calendario si legge col corpo, non col talento.",
    "Trentatré: i minuti si pesano. Tu li tieni, senza chiedere che qualcuno li chiami coraggio.",
    "A trentatré il primo contatto è un negoziato. Il quarto quarto, se arriva, è tuo.",
    "Trentatré anni. Lo specchio non mente, e tu non gli chiedi di mentire.",
    "A trentatré il mestiere è arrivare a maggio con le gambe tue, non con un alibi.",
  ]);
  add(row.gp > (euro ? 20 : 52) && s.age === 34, [
    "Trentaquattro anni. Ogni ottobre è una firma, e la fai ancora tu.",
    "A trentaquattro il mestiere è durare senza sparire.",
    "Trentaquattro: il posto prima della copertina. Tu lo tieni, anche se è più stretto.",
    "A trentaquattro le ginocchia fanno l'appello. Tu rispondi ancora sì.",
    "Trentaquattro anni, e il ruolo è già una vittoria, se lo tieni dritto.",
    "A trentaquattro non chiedi al corpo di essere giovane. Gli chiedi di firmare ottobre.",
  ]);
  add(row.gp > (euro ? 20 : 52) && s.age === 35, [
    "Trentacinque anni. I minuti si contano, non si sprecano.",
    "A trentacinque il corpo firma dopo. Tu firmi adesso, e tieni il posto.",
    "Trentacinque: il posto prima della voce. Questo è un altro inverno, e lo tieni dritto.",
    "A trentacinque il mestiere è non sparire in punta, e tu non sparisci.",
    "Trentacinque anni. Lo staff misura i possessi; tu misuri quello che resta.",
    "A trentacinque ogni riscaldamento è un inventario. Lo fai prima che lo faccia lo staff.",
  ]);
  add(row.gp > (euro ? 20 : 52) && s.age >= 36, [
    "Trentasei anni. I minuti che restano, detti chiaro, e tenuti.",
    "A trentasei il posto è già una vittoria. Tu lo tieni, senza copertina.",
    "Trentasei: il corpo ha un'agenda. Tu la leggi, e scendi lo stesso.",
    "A trentasei non c'è un altro ottobre da sprecare. Questo, lo firmi.",
    "Trentasei anni, e la voce, usata poco, vale più di un giro in sala pesi.",
    "A trentasei il campionato riparte. Tu conti i minuti che restano, e li tieni dritti.",
  ]);
  add(
    row.gp > (euro ? 20 : 52) && s.age < 33 && s.hidden.durability >= 68 && row.gp >= (euro ? 30 : 74),
    euro
      ? [
          "Quasi tutte le partite. In Europa il corpo è un contratto con te stesso.",
          "Trentaquattro sere, o quasi. Qui non si nasconde dietro i minuti gestiti.",
          "Viaggi corti, presenze lunghe. Hai firmato ogni appello.",
          "Il fisico ha tenuto il ritmo della coppa. Non era scontato.",
        ]
      : [
          "Ottantadue sere, o quasi. Gli altri si fermano. Tu no.",
          "Il calendario non ti ha piegato. Lo staff lo dice piano, come un complimento vero.",
          "Una presenza da colonna. I minuti si sommano senza chiedere permesso.",
          "Disponibile, sempre. È un mestiere poco fotografato e molto pagato in fiducia.",
          "Hai chiuso l'anno intero. La statistica più quieta, e la più rara.",
          "Niente notti vuote. Il corpo ha firmato tutte le pagine del calendario.",
        ],
  );

  add(s.hidden.chemistry >= 66 && s.yearsOnTeam >= 2, [
    "A $CITY il gruppo si muove come se ti conoscesse da sempre.",
    "In spogliatoio, a $CITY, il silenzio è comodo. Non è freddezza: è abitudine buona.",
    "I compagni ti cercano con lo sguardo prima del tempo morto. A $CITY sei un pezzo dello schema.",
    "Due, tre anni qui. A $CITY non devi più presentarti: entri, e lo schema ti riconosce.",
    "Le battute interne, a $CITY, ti includono senza sforzo. Sei di casa.",
    "Passi corti, sguardi lunghi. A $CITY il gruppo ha imparato il tuo tempo.",
    "A $CITY entri nello spogliatoio e il rumore non cambia. È il segno che sei dei loro.",
    "Due inverni, o più. A $CITY il tuo posto a tavola non si discute più.",
  ], { CITY: city });
  add(s.hidden.chemistry < 66 && s.hidden.ego >= 70, [
    "Qualcuno in panchina gira intorno al tuo nome, non al tuo viso.",
    "Lo spogliatoio ti fa spazio. Non sempre di buon grado.",
    "Le telecamere arrivano prima dei compagni. Lo senti, e loro anche.",
    "Il tuo isolamento è diventato un fatto, non un'accusa. Peggio.",
    "Parli al plurale in conferenza. In campo, il possessivo è singolare.",
    "C'è rispetto, e c'è distanza. Quest'anno pesa di più la seconda.",
  ]);
  add(s.hidden.chemistry <= 38 && s.hidden.ego < 70, [
    "C'è una distanza, in spogliatoio. Non la misuri, la senti.",
    "I discorsi si fermano quando entri. Non è guerra: è freddo.",
    "Mangi da solo più sere di quanto vorresti ammettere.",
    "Le risate partono dall'altra parte del tavolo. Arrivano smorzate.",
    "Nessuno è ostile. Nessuno ti aspetta, e si sente.",
    "Il cerchio si chiude un palmo prima di te. Ci stai, a fatica.",
  ]);

  add(true, [
    "A $CITY, $FANS entra già caldo. Tu cerchi il possesso, che è più onesto del coro.",
    "$FANS ha una voce. Quest'anno la senti anche quando il palazzetto è mezzo vuoto.",
    "Al palazzetto di $CITY il rumore cambia quando tocchi palla. $FANS non chiede numeri: chiede presenza.",
    "La città di $CITY ti riconosce per strada. Non è fama: è abitudine, e pesa lo stesso.",
    "$TEAM è una maglia. $CITY è una stanza. Tu abiti tutte e due, con attenzione diversa.",
  ]);
  add(s.age <= 22, [
    "A $AGE anni il palazzetto è ancora una stanza nuova. Ogni sera impari un nome.",
    "Hai $AGE anni e il mestiere ti guarda dall'alto. Tu rispondi coi possessi, non con le interviste.",
    "Troppo giovane per i discorsi da veterano. A $AGE anni basta arrivare in orario e leggere la difesa.",
  ]);
  add(s.age >= 30 && s.age < 34, [
    "A $AGE anni le ginocchia hanno un archivio. Lo sfogli al mattino, poi scendi in campo.",
    "Trenta e oltre. A $CITY il pubblico non ti chiede più di sorprendere: ti chiede di durare.",
    "A $AGE anni il talento è un conto già fatto. Resta il mestiere, che è più raro.",
    "A $AGE anni il primo passo è ancora una decisione. Il secondo, un negoziato.",
    "Il calendario, a $AGE anni, si legge col corpo. Tu lo leggi prima dello staff.",
    "A $AGE anni non sei in ritardo: sei in orario, e $CITY lo misura in minuti.",
  ]);
  add(s.age >= 34, [
    "A $AGE anni ogni ottobre è una trattativa col corpo. $FANS lo sa, e ti aspetta lo stesso.",
    "Il calendario non è più un amico. A $AGE anni lo leggi come un contratto, riga per riga.",
    "A $AGE anni il posto viene prima della copertina. Tu lo tieni, e $CITY lo vede.",
    "I minuti, a $AGE anni, si contano. Non si regalano, e tu non li sprechi.",
    "A $AGE anni lo specchio fa l'appello. Tu rispondi ancora sì, senza alzare la voce.",
    "Il mestiere, a $AGE anni, è durare senza sparire. $FANS lo capisce dal passo.",
  ]);

  add(pct >= 0.68, [
    "Le sere in casa hanno un rumore diverso: arrivano presto, aspettano te.",
    "La classifica sorride. Il palazzetto arriva già caldo, e ti chiede di restare tale.",
    "Vincere è diventato un'abitudine pericolosa: ci si abitua, e poi pesa.",
    "I pomeriggi di marzo sanno già di aprile. La città ci crede, e ti guarda.",
    "Una striscia che tiene. Lo staff non esulta: conta, e basta.",
    "Ogni vittoria sembra dovuta. È il momento in cui si sbaglia di più.",
    "Il pubblico canta prima del salto. Tu cerchi di non crederci troppo.",
    "La stagione pende dalla parte giusta. Resta da non farla cadere.",
    "I numeri in classifica ti coprono. Non coprono gli errori, e lo sai.",
    "Una piazza che ha già deciso. Tu tieni il mestiere, che è più fragile della fede loro.",
    "Vince, e poi di nuovo. Il rischio è smettere di leggere i possessi.",
    "Aprile è un'ipotesi concreta. Novembre, a questo punto, sembra lontano.",
    "Vinci, e il palazzetto ti chiede di non smettere. Tu tieni il possesso, che è più onesto.",
    "Una classifica che copre. Tu conti i minuti, che non coprono niente.",
  ]);
  add(pct <= 0.32, [
    "Le sconfitte si accumulano come polvere. Lo staff chiude la porta prima di parlare.",
    "Il pubblico di casa fischia tardi, come chi non sa più a chi arrabbiarsi.",
    "La classifica è un peso. Ogni novembre sembra aprile, e non nel modo buono.",
    "Si cerca un colpevole. Poi si cerca un possesso. Poi si tace.",
    "Le conferenze durano poco. Le notti, no.",
    "Un anno storto. Lo senti nel modo in cui i compagni salutano, la sera.",
    "Niente alibi che tenga. I numeri sono lì, e non ti coprono.",
    "Si gioca per l'orgoglio, che è una valuta debole a febbraio.",
    "La classifica non mente. Mente chi parla di «processo» a marzo inoltrato.",
    "Ogni trasferta è una tregua. Il palazzetto di casa, no.",
    "Si perde con dignità, poi si perde senza. Il confine è sottile.",
    "I tempi morti si allungano. Non perché c'è da dire: perché non c'è.",
    "Perdi, e poi di nuovo. Il mestiere, in questi mesi, è non cercare un colpevole in te.",
    "Una stagione storta. Tu resti, possessi dopo possesso, anche quando la stanza si svuota.",
  ]);
  add(pct > 0.32 && pct < 0.68 && row.seed === 8, [
    "Ottavi per un soffio. I playoff sono una porta socchiusa, non un diritto.",
    "L'ultimo treno. A bordo si sta in piedi, ma si parte.",
    "Ottavi. Nessuno vi teme, e questo, a volte, basta per entrare.",
    "Una gara, un possesso, e siete dentro. Fragile, e vero.",
  ]);
  add(pct > 0.32 && pct < 0.68 && row.seed === 1, [
    "Primi in classifica. Il privilegio, ad aprile, si paga in aspettative.",
    "La testa di serie. Tutti vogliono il vostro scalpo, e lo dicono.",
    "Primi. Lo staff lo tratta come un dato, non come una festa.",
    "Il campo centrale, da ora. Ogni errore si vede da più lontano.",
  ]);

  add(row.awards.includes("MVP"), [
    "Il premio pesa. Non sul collo: su quello che ti chiederanno da ora in poi.",
    "MVP. Una parola corta che allunga ogni domanda, da ottobre in poi.",
    "Te l'hanno dato. Adesso tocca dimostrare che non era un incidente di calendario.",
    "MVP. Una sera il nome è tuo. Da ottobre le domande, però, sono più lunghe.",
    "Il premio più corto. Il mestiere, sotto, resta identico, e tu lo sai.",
    "Te l'hanno appeso. Il campionato ricomincia, e il peso arriva dopo.",
  ]);
  add(!row.awards.includes("MVP") && row.awards.includes("All-Star"), [
    "A febbraio, per una settimana, sei esistito in un'altra luce.",
    "La chiamata All-Star arriva come un respiro. Poi torna il campionato, che non perdona.",
    "Una maglia diversa per un fine settimana. Poi di nuovo la tua, che pesa di più.",
    "Il voto è arrivato. Non cambia i lunedì, cambia il modo in cui ti presentano.",
  ]);
  add(row.awards.includes("Rookie of the Year"), [
    "Il Rookie of the Year non è un arrivo. È un modo per dirti che adesso ti guardano.",
    "Il premio da ragazzo. Una targa che dice: da ora il dubbio è degli altri, non tuo.",
    "Rookie of the Year. Una sera ti chiamano per nome, e il nome pesa già.",
    "Il premio da ragazzo. Lo tieni, sapendo che ottobre prossimo non perdona i debutti.",
    "Te l'hanno dato al primo giro. Adesso tocca diventare altro, e lo sai.",
    "Il Rookie of the Year. Lo spogliatoio ti guarda diverso: non è affetto, è attesa.",
  ]);
  add(row.awards.includes("DPOY") && s.age <= 23, [
    "A $AGE anni, Defensive Player of the Year. Di solito aspettano i canestri. Stavolta hanno contato le mani.",
    "Troppo giovane, dicono, per coprire così. Il premio è arrivato lo stesso.",
    "Defensive Player of the Year, a $AGE anni. Chiudi già, e non hai ancora il discorso di un veterano.",
    "A $AGE anni ti volevano veloce. Ti hanno visto sporco, e il nome te l'hanno messo addosso.",
    "Il premio di chi toglie, e tu sei ancora un ragazzo. Il palmo, però, è già da uomo.",
    "A $AGE anni chiudere non finisce in copertina. Quest'anno il premio è tuo lo stesso.",
  ]);
  add(row.awards.includes("DPOY") && s.age >= 32, [
    "A $AGE anni il premio di chi chiude non è una sorpresa: è il mestiere, contato tardi.",
    "Defensive Player of the Year, a $AGE anni. Le ginocchia tengono i nomi. Tu ci metti ancora il palmo.",
    "A $AGE anni non corri come prima. Chiudi meglio. Il premio è questo, nudo.",
    "Il premio di chi toglie. A $AGE anni togliere è un orario, non un salto.",
    "A $AGE anni i canestri degli altri restano corti perché tu sei ancora lì, un palmo prima.",
    "Defensive Player of the Year. A quest'età è un rispetto che arriva dopo i minuti, non prima.",
  ]);
  add(row.awards.includes("DPOY"), [
    "Defensive Player of the Year. Non è un premio da debutto: si conta ogni aprile, e quest'anno il nome è il tuo.",
    "Quest'anno ti hanno letto sulle stoppate e sulle palle rubate, non sui canestri.",
    "Il premio difensivo. Pochi applausi, molte graffiature, e il rispetto giusto.",
    "Defensive Player of the Year. Una parola che non finisce in copertina, e per questo vale di più.",
    "Ti hanno visto chiudere. È un complimento che si paga in contatti, non in copertina.",
    "Il premio di chi toglie. Lo staff, per una volta, parla del tuo palmo prima del tuo polso.",
    "Defensive Player of the Year. I canestri degli altri sono restati corti, e qualcuno li ha contati.",
    "Una stagione a coprire. Il premio, quando arriva, non ha bisogno di un'altra parola.",
    "Hanno contato i possessi fermati. È il tuo mestiere, e stavolta ha un nome.",
  ]);

  add(s.form <= -5, [
    "Il tiro esce corto. Lo sai prima ancora del fischio.",
    "Il ritmo non è il tuo. Ogni possesso è un metro da recuperare.",
    "C'è sabbia negli ingranaggi. Non si vede, si sente nel rullo dei possessi.",
    "Le serate facili sono sparite. Tutto costa un dribbling in più.",
  ]);
  add(s.form >= 5, [
    "Tutto entra. Anche i tiri che non dovevano.",
    "C'è una settimana in cui il canestro sembra più largo. È durata di più.",
    "Il polso è caldo. I compagni te la cercano senza chiedere.",
    "Una vena. La cavalchi sapendo che non è eterna, e proprio per questo la tieni.",
  ]);

  add(row.min >= 34.5, [
    "Trentasei minuti a notte. Il fiato diventa un orario.",
    "Il carico è da titolare vero. Le gambe lo sanno prima della statistica.",
    "Chiudi quasi ogni serata in campo. Lo staff si fida, il corpo annota.",
    "Minuti da colonna. A marzo si pagano gli interessi.",
  ]);
  add(row.min <= 16.5, [
    "Dalla panchina il campo sembra più lontano.",
    "I minuti arrivano a pezzi. Devi farli pesare tutti, perché sono pochi.",
    "Entri a partita in corsa. Non c'è riscaldamento che basti, c'è solo la testa.",
    "Un ruolo ridotto. Ogni possesso è un'udienza, non una serata.",
  ]);

  add(s.age <= 22 && row.ppg >= 14, [
    "Qualcuno in tribuna ha già deciso chi sei. Tu stai ancora imparando il nome degli schemi.",
    "I numeri da ragazzo grande. Lo spogliatoio ti guarda diverso, e tu fai finta di non sentire.",
    "Troppo presto per questo uso. Lo staff lo sa, e ti butta lo stesso.",
  ]);
  add(s.age <= 21 && row.gp >= 70, [
    "Una matricola che non si nasconde. Il calendario, il primo, è già una ferita e una scuola.",
    "Settanta sere al primo giro. Pochi le fanno. Tutte lasciano un segno.",
  ]);

  add(row.playoff === "Campione", [
    "L'anello non si descrive. Si tiene, e si tace un poco.",
    "A giugno il mondo ha il tuo nome. A luglio ricomincia il lavoro, identico e diverso.",
    "Confetti, ghiaccio, una foto che durerà più di te. Poi il silenzio buono.",
    "Avete chiuso. Per una notte la città non ha altre domande.",
  ]);
  add(row.playoff.startsWith("Elim."), [
    "La corsa si è fermata prima del discorso che avevi preparato.",
    "Fuori. Il silenzio dopo l'ultimo fischio dura più della serie.",
    "Una porta che si chiude. Dietro resta la primavera, incompleta.",
    "Si torna a casa a maggio. L'estate inizia troppo presto, e lo sai.",
  ]);

  add(s.rivalry >= 55, [
    "$RIVAL è una voce in sottofondo. Non la togli, la usi.",
    "Ogni tanto torna $RIVAL. Non sul referto: nella testa, dove conta.",
    "$RIVAL resta un metro. Ti misuri lì, anche quando non giocate.",
    "Il nome di $RIVAL compare ancora. Basta per alzare il tono di una settimana.",
  ], { RIVAL: s.rivalName });

  const ident = s.world?.teams[s.team.abbr]?.identity;
  if (ident) {
    const lab = labelIdentity(ident);
    const identLines: Record<string, string[]> = {
      defense: [
        "Il sistema è $LAB. Ti chiedono di sporcarti prima di illuminare.",
        "Chiudere, poi aprire. Lo staff lo ripete senza alzare la voce.",
        "Prima il palmo, poi il tiro. Qui l'ordine non si discute.",
        "Ogni possesso inizia dal lato debole. Lo schema non perdona chi guarda solo il ferro.",
        "Le mani basse, il petto alto. $LAB non è uno slogan: è un orario.",
        "Rubare un secondo sulla linea. Poi il resto del quarto è più facile.",
        "I fischi arrivano. I canestri degli altri, no. È questo il mestiere, qui.",
        "Coprire, ruotare, parlare. Il talento senza voce, in questa piazza, non basta.",
        "Una serata pulita vale più di una esplosione. Lo capisci a marzo.",
        "Il tabellone degli altri resta basso. È l'unico applauso che lo staff cerca.",
      ],
      threePoint: [
        "Tutto gira intorno al perimetro. $LAB: se non spacchi la linea, resti fuori dallo schema.",
        "I tre punti non sono un lusso. Qui sono il pane.",
        "Spazi, uscite, il tiro che deve partire in tempo. Sempre.",
        "La linea da tre è il fuso orario della squadra. Chi arriva in ritardo resta in panchina.",
        "Ricezione e tiro, piedi già pronti. Lo staff conta i decimi, non i palleggi.",
        "Un passaggio in più verso l'angolo. Qui è legge, non cortesia.",
        "Il ferro interno è un'esca. Il vero possesso vive fuori.",
        "Allargare, allargare, poi il tiro. Chi chiude il campo si offende da solo.",
        "I quintetti piccoli, le uscite lunghe. $LAB come grammatica.",
        "Ogni sera lo stesso esame: gambe ferme, polso sciolto, nessuna esitazione.",
      ],
      isolation: [
        "Uno contro uno, possessi lunghi. Il sistema ti guarda e aspetta che decida tu.",
        "Ti danno il lato. Il resto è tuo, per meglio o per peggio.",
        "Pochi passaggi, una decisione. Lo schema si fida del tuo ego, e lo sa.",
        "Chiaro: il campo si svuota, e tocca a te leggere il corpo davanti.",
        "Niente alibi di circolazione. Isolamento vuole dire responsabilità, nuda.",
        "Il tempo morto avversario arriva quando tieni tu. È un complimento scomodo.",
        "Un metro quadro, un difensore, il resto della squadra a guardare. Così si gioca, qui.",
        "Creare dal palleggio è il mestiere, non l'eccezione. Lo staff non chiede scuse.",
        "La palla ti cerca tardi, di proposito. Devi essere pronto senza riscaldamento.",
        "Chiudere in isolamento. Se sbagli, il palazzetto lo sa prima di te.",
      ],
      ballMovement: [
        "La palla deve uscire. Se la tieni, lo schema si offende.",
        "Il passaggio in più, sempre. Il tiro bello è quello che arriva pulito, non quello che tieni.",
        "Il gruppo vive di circolazione. Tu sei un nodo, non un capolinea.",
        "Due passaggi in più, un ferro più gentile. Qui la pazienza è un atletismo.",
        "Lo schema gira come un orologio. Chi ferma la lancetta si sente, e non in bene.",
        "Ricevi, leggi, dai. Il canestro è di chi arriva terzo, non di chi chiede per primo.",
        "Niente eroismi da palleggio. La bellezza, qui, è un assist in ritardo di un secondo.",
        "Il coach conta i passaggi prima dei punti. Lo impari, o resti fuori dal nastro.",
        "Muovere senza palla è metà del contratto. L'altra metà è non trattenerla.",
        "Una squadra che parla con i passaggi. Le parole, in panchina, arrivano dopo.",
      ],
      pace: [
        "Primo passo, transizione, di nuovo. Il fiato è il quaderno degli schemi.",
        "Corrono. Tu stai nel loro respiro, o resti indietro.",
        "Niente set lunghi. La prima uscita è già un possesso vero.",
        "L'aria arriva corta. Chi pensa due volte ha già perso il contropiede.",
        "Rimbalzo, uscita, canestro in dieci secondi. Il resto è commento.",
        "Il ritmo non si negozia. O lo tieni, o lo subisci da chi arriva prima.",
        "Partono in quattro. Tu sei il quinto, o sei un ostacolo.",
        "Niente tempo morto per riprendere fiato. Il fiato è il lavoro, qui.",
        "Una transizione dopo l'altra. Il campionato, a questo passo, è una maratona corta.",
        "Chi vuole costruire al mezzo campo resta a guardare il tabellone che corre.",
      ],
      physical: [
        "Ogni possesso è un contatto. Le braccia alzano prima della testa.",
        "Sotto, si paga in spalle. Qui il corpo è il regolamento non scritto.",
        "Chiusura sul rimbalzo, spinta, di nuovo. La partita ha un rumore sordo.",
        "Niente raffinatezza che tenga se non tieni la posizione. Lo impari sulle costole.",
        "I falli arrivano, i fischi no. Si gioca così, e lo staff non si scusa.",
        "Un metro guadagnato col petto vale più di un dribbling. Qui è cultura.",
        "Le ginocchia dei lunghi parlano. Tu rispondi con il corpo, non con la voce.",
        "Rimbalzi sporchi, secondi possessi. La statistica pulita arriva dopo, se arriva.",
        "Chi ha paura del contatto resta perimetro. Chi resta, qui, si sporca.",
        "A fine gara i vestiti pesano. È il segno che avete giocato la loro lingua.",
      ],
      veteran: [
        "Poche parole, tanti dettagli. Una squadra che ha già visto giugno.",
        "I silenzi in sala video durano un secondo in più. Tutti capiscono perché.",
        "Niente urla. Il rispetto, qui, è un orario.",
        "Si gioca con la memoria. Gli schemi hanno già un nome, e i nomi pesano.",
        "I giovani ascoltano. I vecchi non ripetono. Funziona, la maggior parte delle sere.",
        "Un tempo morto detto piano vale più di uno urlato. Lo staff lo sa da anni.",
        "Niente drammi da spogliatoio. Il mestiere, qui, è una stanza ordinata.",
        "Chi alza la voce si squalifica da solo. Il tono giusto è basso, e fermo.",
        "Hanno già perso una finale. Si sente nel modo in cui chiudono i quarti.",
        "L'esperienza non si dichiara. Si vede in chi arriva in orario, ogni volta.",
      ],
      development: [
        "Qui si cresce in pubblico. Gli errori sono previsti, non perdonati in automatico.",
        "Un progetto, detto chiaro. I minuti sono una scuola, e la scuola interroga.",
        "Sbagli, resti, riprovi. Lo staff annota più di quanto parli.",
        "I possessi arrivano a pezzi, come compiti. Devi consegnarli puliti.",
        "Niente copertine. Solo ripetizioni, e un coach che non mentisce sulle valutazioni.",
        "La pazienza è il sistema. Chi la scambia per debolezza esce dal nastro.",
        "Ogni settimana un ruolo un po' più largo. Mai abbastanza da sentirti arrivato.",
        "I filmati restano corti. I verbali di allenamento, no.",
        "Cresci alla luce dei fischi. È scomodo, e per questo funziona.",
        "Il futuro è la scusa. Il presente è una lista di correzioni, ogni sera.",
        "Sbagli, resti, riprovi. Tu consegni i possessi puliti, e lo staff annota.",
      ],
      halfCourt: [
        "Set lunghi, letture lente. Chi ha fretta resta fuori dallo schema.",
        "Mezzo campo, pazienza, il tiro giusto al secondo giusto.",
        "Niente transizioni facili. Tutto si costruisce, possesso dopo possesso.",
        "Ventiquattro secondi usati fino in fondo. Il canestro, se arriva, è meritatissimo.",
        "Un blocco, una finta, un'uscita. Lo schema ha il tempo di un respiro lungo.",
        "Chi tira al dodicesimo secondo si prende uno sguardo. Qui si aspetta il diciottesimo.",
        "Difese schierate, sempre. Vincere vuole dire smontarle, non superarle di corsa.",
        "Il quaderno degli schemi è un libro, non un volantino. Lo sfogli, o resti in panchina.",
        "Pazienza tattica. Il pubblico fischia; lo staff no, e tu stai con lo staff.",
        "Un possesso da adulti. Niente scorciatoie, niente scuse di ritmo.",
        "Ventiquattro secondi, il tiro giusto. Tu aspetti il diciottesimo, anche se fischiano.",
      ],
    };

    const pool = identLines[ident];
    if (pool) add(true, pool, { LAB: lab });
  }

  add(euro, [
    "Palazzetti più piccoli, tattica più stretta. Qui il fiato ha un altro accento.",
    "In Eurolega ogni possesso è una lezione. Gli errori si pagano in greco, in serbo, in silenzio.",
    "Viaggi corti, difese lunghe. L'Europa ti chiede di pensare prima di saltare.",
    "Un'altra lingua in panchina. Il blocco e uscita, però, è lo stesso.",
    "Coppe infrasettimanali, gambe pesanti, una testa che deve restare lucida il giovedì.",
  ]);

  add(row.ppg >= 24 && s.age >= 27, [
    "I numeri ti inseguono. Non sei più quello che li rincorre.",
    "Uso da prima opzione. Lo paghi in fischi, in lodi, in sonno.",
    "Ogni difesa è disegnata su di te. È un complimento che stanca.",
  ]);

  const prev = s.seasonHistory[s.seasonHistory.length - 1];
  if (prev) {
    add(prev.playoff === "Campione", [
      "L'anno scorso l'anello. Quest'anno ti chiedono di non essere un incidente.",
      "Giugno è lontano. Il contratto con te stesso, no.",
      "Si torna da campioni. Il bersaglio sulle spalle è più largo.",
    ]);
    add(prev.playoff.startsWith("Elim.") && s.age >= 30, [
      "La primavera scorsa è restata sotto le unghie. Ogni possesso di ottobre ne porta un pezzo.",
      "L'eliminazione precedente non si è sciolta. Lavora in silenzio, a ottobre.",
    ]);
    add(prev.teamAbbr !== row.teamAbbr, [
      "Nuova maglia, stessa testa. $TEAM è un'altra lingua da imparare.",
      "Hai lasciato $OLD. Il corridoio nuovo puzza di vernice e di attesa.",
      "Prima settimana a $TEAM: nomi, uscite, un armadietto che non è ancora tuo.",
    ], { TEAM: row.team, OLD: prev.team });
    add(s.titleCount >= 2 && s.age >= 32, [
      "Due anelli, o più. Il lavoro non si è fatto più facile. Si è fatto più silenzioso.",
      "Hai già alzato. Adesso alzi lo sguardo, e basta.",
    ]);
  }

  add(cands.length === 0, [
    "Una stagione come le altre, se le altre esistono: lavoro, aerei, silenzi.",
    "Niente da appendere al muro. Solo i giorni, fatti fino in fondo.",
    "Un anno di mezzo: non si racconta, si attraversa.",
    "Niente apice. I giorni, notte dopo notte, e il calendario che avanza.",
    "Si gioca, si vola, si dorme. Poi di nuovo. L'anno tiene senza chiedere applausi.",
    "Nessun titolo da dare a questi mesi. Restano, e questo basta.",
    "Il mestiere, nudo. Niente racconto che tenga il posto del lavoro.",
    "Un inverno senza tesi. Si tiene, e si va avanti.",
    "Le settimane si sommano senza fare rumore. A volte è un dono.",
    "Niente da dichiarare a giugno. L'anno è stato, e basta.",
    "Tra un'impresa e l'altra c'è questo: i giorni uguali, tenuti dritti.",
    "Il calendario non chiede un racconto. Chiede di esserci.",
  ]);

  const lines: string[] = [];
  for (const c of shuffleIn(cands)) {
    if (lines.length >= 2) break;
    const t = say(s, c.pool, c.vars);
    if (t) lines.push(t);
  }
  if (lines.length) return lines.join(" ");
  const lastResort = say(
    s,
    [
      "A $CITY l'anno avanza senza proclami.",
      "Si tiene il mestiere, a $CITY, e si gira pagina.",
      "Niente da appendere. A $CITY i giorni bastano.",
      "A $CITY i giorni tengono, senza chiedere applausi.",
      "Il mestiere, a $CITY, basta. Si gira pagina.",
      "A $CITY niente da dichiarare. L'anno è stato, e basta.",
      "Si attraversa, a $CITY, e si tiene il posto.",
      "A $CITY il calendario non chiede un racconto. Chiede di esserci.",
      "Niente apice. A $CITY i giorni, tenuti dritti, bastano.",
    ],
    { CITY: city },
  );
  return lastResort || `A ${city} l'anno tiene, senza chiedere applausi.`;
}

export function playoffNerves(s: PlayerState, roundLabel: string, opponent: string): string {
  const singleGame = s.league === "EuroLega" && roundLabel !== "Quarti di finale";
  if (singleGame) {
    return (
      say(s, [
        `$ROUND contro $OPP. Una partita sola, e il primo possesso arriva già pesante.`,
        `Final Four: $OPP dall'altra parte, una sera sola per tenere aperta la stagione.`,
        `Niente gara dopo questa. $ROUND comincia con le gambe ferme e la testa sveglia.`,
        `Il palazzetto è neutro, il rumore no. $OPP aspetta il primo errore.`,
        `Una semifinale secca, una finale secca. Prima, $ROUND contro $OPP.`,
      ], { ROUND: roundLabel, OPP: opponent }) || `${roundLabel} contro ${opponent}. Una partita sola.`
    );
  }
  return (
    say(
      s,
      [
        `$ROUND contro $OPP. In tunnel il rumore arriva prima della luce.`,
        `La palla, prima del salto, pesa come a novembre. Poi no.`,
        `$COACH parla poco. Lo fa quando serve, e adesso serve.`,
        `Fuori, $OPP. Dentro, la stessa domanda: chi tiene l'ultimo possesso.`,
        `$ROUND. Sette sere, o meno, per decidere chi resta in questa primavera.`,
        `Contro $OPP non si improvvisa. Si arriva già con una ferita, o se ne prende una.`,
        `Il campo di aprile non perdona i possessi pigri. $OPP lo sa.`,
        `$ROUND: il fiato è corto, le letture lunghe.`,
        `Stasera non si nasconde. $OPP è dall'altra parte, e basta.`,
        `Prima del salto, $COACH ti guarda un secondo in più. Poi fischiano.`,
        `Una serie non è una partita ripetuta. È un argomento, e $OPP ha il suo.`,
        `Il pubblico è già in gola. Tu cerchi il primo possesso pulito.`,
        `Non è novembre. Chi tratta $ROUND come novembre esce.`,
        "In sala video hanno detto poco. Il resto, contro $OPP, si vede in campo.",
        `Sette, al massimo. Ogni sera brucia una pagina.`,
        `Il corpo ricorda le serie vecchie. La testa sceglie quali ascoltare.`,
        `Nelle partite chiuse il polso deve restare. $ROUND inizia da lì.`,
        `Nessuno vi deve niente. A volte è il vantaggio più pulito.`,
        `Il privilegio è una trappola se lo tratti come un diritto.`,
        `Sanno chi sei. Il piano, stanotte, sei tu.`,
        `Il parquet di $ROUND non perdona chi arriva già spiegato.`,
        `Una primavera, un avversario. $OPP. Il resto è mestiere.`,
        `Tu non alzi la voce. $ROUND la alza per te, e $OPP è già in campo.`,
        `Prima del salto conti un possesso. Poi $OPP, e il resto è mestiere nudo.`,
        `La serie inizia quando smetti di pensare al campionato. $ROUND lo chiede adesso.`,
        `Contro $OPP il primo errore pesa tre. Tu cerchi di non firmarlo tu.`,
      ],
      { ROUND: roundLabel, OPP: opponent, COACH: s.coachName },
    ) || `${roundLabel} contro ${opponent}.`
  );
}

export function summerFeel(s: PlayerState, label: string): string {
  const t = label.toLowerCase();
  if (/scambio|mosso|ceduto|altra maglia|nome ha girato|voci di scambio|dirigenza ha fatto|piazza nuova|corridoio di voci|scambio, parlato/.test(t)) {
    return (
      say(s, [
        "L'armadietto, per un mese, ha saputo di attesa. Poi settembre è arrivato lo stesso.",
        "Non hai firmato niente. Hai ascoltato le voci, e hai tenuto il mestiere.",
        "Il mercato fa rumore a luglio. Tu, per ora, resti dove sei.",
        "Una piazza vera sul foglio. Tu non eri al tavolo, e l'estate è passata sopra la tua testa.",
        "Voci, smentite, un silenzio. La valigia è restata semiaperta, e questo è già un mestiere.",
        "Lo scambio è una frase, per ora. Una frase che pesa, e tu la tieni senza firmarla.",
        "Qualcuno ha fatto il tuo nome. Tu hai fatto la valigia, poi l'hai disfatta. Per ora.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/europa|eurolega|ultimo atto/.test(t)) {
    return (
      say(s, [
        "Una voce da un altro fuso. Palazzetti più stretti, un ultimo atto nominato, non firmato.",
        "Europa resta una frase. A quest'età le frasi pesano, e questa di più.",
        "Il ruolo, la voce, poi — se serve — l'Europa. Per ora è solo una porta socchiusa.",
        "Non hai firmato. Hai ascoltato. L'inverno, poi, deciderà.",
        "Una porta in un'altra lingua. Resta sul tavolo, e pesa.",
        "Palazzetti più piccoli, tattica più stretta. Te lo hanno detto piano, come un rispetto.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/nazionale|finestra di nazionale|tua nazionale/.test(t)) {
    return (
      say(s, [
        "Tre gare, un aereo, una maglia che non sta nel contratto. L'hai già indossata.",
        "La tua Nazionale non paga i minuti di club. Paga un altro debito, e tu lo sai.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (s.age >= 32 || /recuper|ghiaccio|fisio|tregua|manutenzione|carico/.test(t)) {
    return (
      say(s, [
        "Estate corta. Pesi leggeri, sonno lungo, un fisioterapista che ormai conosce i tuoi silenzi.",
        "Il corpo ha chiesto tregua. Gliel'hai data, a pezzi, come si dà da bere a qualcuno che non deve spegnersi.",
        "Niente trekking, niente show. Solo la manutenzione di ciò che resta.",
        "Arrivare a ottobre intero: a quest'età è l'unico orgoglio che conta.",
        "Il recupero è la forma più adulta del lavoro. L'hai tenuto.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/pro-am|proam|torneo estivo|asfalto|partite vere|senza staff|palazzetto piccolo|campetti|ferro storto/.test(t)) {
    return (
      say(s, [
        "Partite vere, senza staff. Sudore diverso, e una fame che a volte si era spenta.",
        "Un palazzetto piccolo. Il gesto, lì, è tornato a essere solo un gesto.",
        "Asfalto, un pubblico che non ti doveva niente. Tu hai tirato lo stesso, e il polso se n'è ricordato.",
        "Niente minutaggi, niente schemi. Solo te, e una palla che non mente.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/video|filmati estiv|telefono/.test(t)) {
    return (
      say(s, [
        "L'estate è finita su un telefono. Tu hai spento, e sei rimasto in palestra.",
        "Un filmato, troppi occhi. Il lavoro, sotto, è rimasto lo stesso di sempre.",
        "Hai spento la telecamera. Il gesto, senza pubblico, è tornato tuo.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/sala video|schemi|studio avversari|appunti|matita/.test(t)) {
    return (
      say(s, [
        "Niente sudore da copertina. A ottobre le letture arriveranno un tempo prima.",
        "Estate in una stanza buia. I possessi degli altri, a volume basso.",
        "Hai riletto una serie. Hai trovato un possesso che non avevi visto. Basta quello.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/campus|tutore|insegn/.test(t)) {
    return (
      say(s, [
        "Hai corretto un polso. Il ragazzo ha fatto canestro. La voce, usata così, è un mestiere.",
        "Hai insegnato, e il gesto è tornato. Strano, e giusto.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/quota|aria sottile|più in alto/.test(t)) {
    return (
      say(s, [
        "Due settimane in quota. Sei sceso con un altro serbatoio, e ottobre lo sentirà.",
        "Aria sottile, gambe dure. Il primo contropiede di ottobre è più lungo.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/beneficenza|per qualcuno|per altro/.test(t)) {
    return (
      say(s, [
        "Hai giocato per altri. Il gesto è rimasto tuo, la sera è stata di qualcun altro.",
        "Un palazzetto pieno, niente classifica. Sei tornato più leggero.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/a casa|tavola di luglio|mestiere non entra/.test(t)) {
    return (
      say(s, [
        "Due settimane a casa. Il mestiere, spento, ti ha restituito un pezzo di te.",
        "Casa, tavola, silenzio. Il corpo ha ringraziato senza chiedere scusa.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/mobilit|anca|caviglia|gradi/.test(t)) {
    return (
      say(s, [
        "Estate di gradi, non di chili. A ottobre il primo passo è più lungo.",
        "Hai lavorato dove non si vede. Le ginocchia, a novembre, non presentano il conto in anticipo.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/campetti|ferro storto/.test(t)) {
    return (
      say(s, [
        "Asfalto, un ferro storto, una fame dritta. Sei tornato con le mani segnate.",
        "Niente minutaggi. Solo tiri, e un pubblico che non ti doveva niente.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (/arbitri|fischio, studiato|regolamento/.test(t)) {
    return (
      say(s, [
        "Hai visto il contatto dall'altra sponda. A ottobre le mani sono più basse.",
        "Due giorni di regolamento. Lo staff trova un giocatore che legge il palmo, non lo discute.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  if (s.age <= 23) {
    return (
      say(s, [
        "Palestra vuota, musica bassa. A quest'età l'estate è un secondo campionato.",
        "Sei tornato a casa una settimana. Poi il campo ti è mancato prima delle persone, e ti sei vergognato un poco.",
        "Agosto sapeva di sudore e di fame. I compagni di scuola avevano già un lavoro. Tu avevi questo.",
        "Tre volte al giorno, la stessa uscita. A settembre il gesto è un altro.",
        "Nessuno ti guardava, d'estate. È il momento in cui si cambia davvero.",
        "Sudore, filmati, un quaderno di schemi. L'inverno si costruisce adesso.",
        "A quest'età luglio è un secondo campionato. Tu l'hai giocato senza pubblico.",
        "Sei rimasto quando gli altri sono andati al mare. Il ferro, a settembre, lo sa.",
      ]) || label || "L'estate è già chiusa."
    );
  }
  return (
    say(
      s,
      [
        `$LAB. Sudore, ripetizioni, la stessa voce nello specchio.`,
        "L'estate non è vacanza. È il modo in cui l'inverno prossimo non ti trova impreparato.",
        "Tre settimane di lavoro sporco. A ottobre si vedrà se sono bastate.",
        "Pochi testimoni, molti tiri. Il miglioramento, se arriva, non fa rumore.",
        "Agosto è una stanza senza pubblico. Meglio: si lavora sul vero.",
        "Hai ripetuto finché il gesto ha smesso di essere una decisione. Poi di nuovo.",
        "Il telefono è rimasto in borsa. La palla, no.",
        "Sudore senza pubblico. A ottobre si vede chi ha lavorato per davvero.",
        "Un'estate da artigiano: gli stessi tiri, lo stesso specchio, un altro polso.",
        "Niente amichevoli da copertina. Solo ripetizioni, e il silenzio che serve.",
        "Hai chiuso luglio in palestra. Lo staff, a settembre, lo capisce dal passo.",
        "Tre settimane sporche. A ottobre si vedrà se sono bastate, e tu lo sai già.",
      ],
      { LAB: label },
    ) || label || "L'estate è già chiusa."
  );
}

export function pathFeel(path: "NCAA" | "Europa" | "G-League", team: string, s: PlayerState): string {
  if (path === "NCAA") {
    return (
      say(s, [
        `Due inverni di campus, palestre piene, un nome che ancora non pesa. $TEAM chiama il tuo.`,
        `Hai imparato a perdere in pubblico. $TEAM scommette che saprai anche vincere.`,
        `Il torneo di marzo alle spalle. $TEAM firma. Il mestiere, adesso, inizia per davvero.`,
        `Il campus ti lascia i fondamentali e una testa più ferma. $TEAM ti sceglie. Il resto si costruisce.`,
        `$TEAM ti prende dal campus. Hai già perso, hai già vinto, in un'altra lingua. Da qui è vero.`,
        `Due primavere di palestra piena, poi il salto. $TEAM firma. Tu non sei più uno studente.`,
        `Il torneo di marzo ti ha visto da ragazzo. $TEAM ti vuole da uomo. La differenza, adesso, la fai tu.`,
      ], { TEAM: team }) || `${team} ti prende dal campus. Il mestiere inizia qui.`
    );
  }
  if (path === "Europa") {
    return (
      say(s, [
        `Cresci lontano dai riflettori americani: tattica, pazienza, palazzetti più stretti. $TEAM scommette su quella testa.`,
        `L'Europa ti ha insegnato a leggere prima di saltare. $TEAM firma. Arrivi già da professionista.`,
        `Un'altra geografia, la stessa palla. $TEAM chiama. Un accento che in NBA si sente, e tiene.`,
        `Coppe infrasettimanali, difese lunghe, un passaporto già caldo. $TEAM ti prende così.`,
        `Hai giocato da uomo tra uomini. $TEAM lo ha visto. Una testa che non si spaventa del tempo morto.`,
        `$TEAM firma l'accento, non solo il gesto. Arrivi già sapendo cosa chiede un tempo morto vero.`,
        `Palazzetti stretti, coppe lunghe. $TEAM scommette che quella testa tiene anche qui.`,
      ], { TEAM: team }) || `${team} firma. Arrivi dall'Europa, già da professionista.`
    );
  }
  return (
    say(s, [
      `Bruci le tappe. $TEAM punta su di te senza farti invecchiare in un campus. Contratto breve, minuti subito.`,
      `Niente campus, niente attesa. $TEAM ti prende grezzo. Due inverni, e il lavoro che inizia stanotte.`,
      `Salti il campus. $TEAM accetta il rischio. Un contratto corto, e la fame che non si insegna.`,
      `$TEAM non aspetta che tu sia pronto. Ti prende così. Due inverni, e il parquet che non mente.`,
      `Dalla G-League al salto. $TEAM firma corto. Niente alibi di campus, solo minuti da coprire.`,
      `$TEAM ti ha visto in palazzetti vuoti. Adesso i palazzetti sono pieni, e tu resti lo stesso.`,
      `Niente vetrina da marzo. $TEAM prende la fame, e la fame, da qui, è il contratto.`,
    ], { TEAM: team }) || `${team} ti prende grezzo. Contratto breve, minuti subito.`
  );
}

export function noAwardLine(s: PlayerState): string {
  return (
    say(s, [
      "Nessun premio individuale. Il lavoro resta, senza targa.",
      "La lega ha scritto altri nomi. Il tuo anno è nel referto, non nella bacheca.",
      "Niente All-Star, niente titoli da appendere. Si chiude lo stesso.",
      "I voti sono andati altrove. Tu conti i minuti, che sono più onesti.",
      "Un anno senza vetrina. Succede anche a chi merita, e anche a chi no.",
      "La bacheca resta com'era. Non tutte le stagioni devono lasciare un oggetto.",
      "Nessuna chiamata a febbraio. Marzo, però, c'è stato, intero.",
      "I premi hanno scelto altri. Il campo, no.",
      "Niente targa. Il referto, però, c'è, pagina dopo pagina.",
      "Un anno da operaio. I voti passano oltre, il lavoro resta.",
      "La bacheca individuale resta vuota. Non è una sentenza, è un elenco.",
      "Nessun premio col tuo nome. Si chiude l'anno lo stesso, dritti.",
      "I voti hanno scelto altri. Tu chiudi l'anno senza targa, e il campo resta onesto.",
      "Niente chiamata a febbraio. Tu conti i possessi, che non votano.",
    ]) || "Nessun premio individuale, quest'anno."
  );
}

/** Commento premi, pronto anche se i flag ROY/DPOY arrivano dopo. Seconda persona, niente formule. */
export function awardFeelLine(s: PlayerState, awards: readonly string[]): string {
  if (awards.includes("Rookie of the Year")) {
    return (
      say(s, [
        "Rookie of the Year. Una targa da ragazzo: da ora ti guardano, e non è un complimento gratuito.",
        "Il Rookie of the Year. Lo tieni, sapendo che il secondo ottobre non perdona i debutti.",
        "Il premio da ragazzo. Il dubbio, da stasera, è degli altri. Il lavoro, no: resta tuo.",
        "Te l'hanno dato al primo giro. Adesso tocca diventare altro, senza alzare la voce.",
        "Rookie of the Year. Lo tieni in tasca, non al collo. Ottobre, poi, non perdona i debutti.",
      ]) || "Rookie of the Year. Da ora ti guardano."
    );
  }
  if (awards.includes("DPOY")) {
    if (s.age <= 23) {
      return (
        say(s, [
          "A $AGE anni te l'hanno dato per le chiusure. Il dubbio era l'età. Il palmo ha risposto prima.",
          "A $AGE anni, Defensive Player of the Year. Lo tieni in tasca: ottobre non perdona i palmi pigri.",
          "A $AGE anni coprire è già un nome. Te l'hanno appeso senza festa, e questo basta.",
          "Troppo presto, dicevano. Tu hai chiuso abbastanza da farli tacere, e il premio è questo.",
          "A $AGE anni la difesa ha il tuo nome. Non è un complimento: è un orario, da stasera.",
          "Chiudevi già, senza discorso. A $AGE anni te l'hanno scritto su una targa, e basta.",
        ]) || "Defensive Player of the Year. Il rispetto giusto."
      );
    }
    if (s.age >= 32) {
      return (
        say(s, [
          "A $AGE anni te l'hanno dato per la memoria. Le ginocchia tengono l'archivio; tu ci metti il palmo.",
          "Premio tardi, e giusto. A quest'età chiudere è il mestiere che resta, e l'hanno letto.",
          "A $AGE anni coprire è già una vittoria. Te l'hanno riconosciuto senza copertina.",
          "Il corpo firma dopo. La difesa l'hai firmata tu, tutte le sere, e qualcuno l'ha messa su una targa.",
          "A $AGE anni il premio da chi chiude. Non chiedono più i numeri da manifesto: chiedono che tu resti lì.",
          "Defensive Player of the Year, a $AGE anni. Il rispetto arriva quando i canestri da copertina sono già andati.",
        ]) || "Defensive Player of the Year. Il rispetto giusto."
      );
    }
    return (
      say(s, [
        "Defensive Player of the Year. Si nota chi toglie, e quest'anno hai tolto abbastanza da avere un nome.",
        "Defensive Player of the Year. Pochi applausi, molte graffiature, il rispetto che non finisce in copertina.",
        "Il premio a chi chiude. Lo staff, per una volta, parla del tuo palmo prima del tuo polso.",
        "Ti hanno visto coprire. È un complimento che si paga in contatti, e l'hai pagato.",
        "Una targa per i possessi che non sono nati. Il mestiere, sotto, resta identico, e tu lo sai.",
        "Te l'hanno appeso per quello che togli. Da ottobre le domande, però, restano le stesse.",
      ]) || "Defensive Player of the Year. Il rispetto giusto."
    );
  }
  if (awards.includes("MVP")) {
    return (
      say(s, [
        "MVP. Una parola corta che allunga ogni domanda, da ottobre in poi.",
        "Te l'hanno dato. Adesso tocca dimostrare che non era un incidente di calendario.",
        "Il premio pesa. Non sul collo: su quello che ti chiederanno da ora in poi.",
        "MVP. Una sera ti chiamano per nome, e il nome, da stasera, pesa di più.",
        "Te l'hanno appeso. Il campionato, però, ricomincia identico, e tu lo sai.",
        "Il premio più corto. Le domande, da ottobre, sono le più lunghe.",
      ]) || "MVP. Il peso arriva dopo."
    );
  }
  if (awards.includes("All-Star")) {
    return (
      say(s, [
        "A febbraio, per una settimana, sei esistito in un'altra luce.",
        "La chiamata All-Star arriva come un respiro. Poi torna il campionato, che non perdona.",
        "Il voto è arrivato. Non cambia i lunedì, cambia il modo in cui ti presentano.",
        "Una maglia diversa per un fine settimana. Poi di nuovo la tua, che pesa di più.",
        "All-Star. Un respiro, poi i lunedì, che non votano.",
        "Il voto è una luce corta. Il campionato, dopo, è lo stesso parquet.",
      ]) || "All-Star. Poi torna il campionato."
    );
  }
  if (awards.some((a) => a.startsWith("All-NBA"))) {
    return (
      say(s, [
        "All-NBA. Una riga in una lista che non si compra, si tiene.",
        "Il quintetto della lega. Non è un filmato: è un elenco, e il tuo nome c'è.",
        "All-NBA. Una riga secca. Il mestiere, sotto, resta identico.",
        "Il quintetto. I lunedì non cambiano; cambia il modo in cui ti chiamano.",
        "Una lista, un nome. Il tuo. Poi ottobre, che non legge le liste.",
        "All-NBA. Lo tieni in tasca, non al collo.",
      ]) || "All-NBA. Il nome c'è."
    );
  }
  if (awards.length) return noAwardLine(s);
  return noAwardLine(s);
}

/** Backend only: lo scambio avviene senza scelta. L'utente legge, non firma. */
export function forcedTradeFlavor(s: PlayerState, fromTeam: string, toTeam: string): string {
  return (
    say(
      s,
      [
        "Ti hanno mosso. Da $FROM a $TO, senza che tu fossi al tavolo. L'armadietto nuovo non è ancora tuo.",
        "Una chiamata, non una domanda. $FROM ti cede: a $TO l'estate ricomincia da un corridoio sconosciuto.",
        "Lo scambio si fa sopra la tua testa. Lasci $FROM, atterri a $TO. Il mestiere, stavolta, è obbedire.",
        "Non l'hai scelto. $FROM chiude, $TO apre. Fai la valigia, e basta.",
        "Ti spostano. $FROM resta una maglia nello zaino; $TO è un nome da imparare in fretta.",
        "Niente voto, niente rifiuto. Da $FROM a $TO: il mercato ha deciso, tu cammini.",
        "Ceduto. $FROM non ti ha chiesto il parere. A $TO l'aria è diversa, e le scarpe ancora storte.",
        "Un aereo, un comunicato, un'altra insegna. $FROM alle spalle, $TO davanti. Si gioca lo stesso.",
        "La dirigenza di $FROM ha fatto i conti. I tuoi non c'entrano. $TO ti aspetta, già.",
        "Mosso. Il parquet di $FROM lo conoscevi al buio. Quello di $TO si impara da lunedì.",
        "Ti hanno spostato. $FROM resta un odore di spogliatoio; $TO è un corridoio da imparare a memoria.",
        "Niente firma tua. Da $FROM a $TO il mestiere è lo stesso: scendere, e farsi riconoscere.",
      ],
      { FROM: fromTeam, TO: toTeam },
    ) || `Ti hanno mosso. Da ${fromTeam} a ${toTeam}.`
  );
}

export function doorLine(
  s: PlayerState,
  kind: "in-seed" | "in" | "out",
  seed?: number | null,
  conf?: Conference,
): string {
  if (kind === "out") {
    return (
      say(s, [
        "Fuori dai playoff. Si gira pagina: estate, corpo, un'altra stagione.",
        "La primavera è degli altri. A voi resta il lavoro di giugno, che è più duro.",
        "Niente serie. L'anno si chiude in campionato, e ha il sapore che ha.",
        "La classifica non vi ha aperto la porta. Si torna a casa prima, e si lavora dopo.",
        "Playoff lontani. Si accetta, si annota, si ricomincia.",
        "Fuori. Non è una tragedia, è un dato. Poi l'estate chiede conto.",
        "La griglia si chiude senza di voi. Resta il lavoro, che non aspetta i playoff.",
        "Niente tunnel ad aprile. Un'estate più lunga, e più onesta.",
        "La primavera è una porta chiusa. Tu giri pagina: corpo, mestiere, un altro ottobre.",
        "Fuori dalla griglia. Non cerchi alibi. Cerchi luglio, che è più utile.",
      ]) || "Fuori dai playoff. Si gira pagina."
    );
  }
  if (kind === "in-seed") {
    const place =
      conf === "East" ? "all'Est" : conf === "West" ? "all'Ovest" : "in Eurolega";
    if (conf === "Euro") {
      return (
        say(s, [
          `$SEED° in Eurolega. Quarti al meglio delle cinque, poi la Final Four.`,
          `Dentro, $SEED°. Prima una serie al meglio delle cinque, poi una partita sola per turno.`,
          `$SEED° in Europa: vantaggio del campo nei quarti, Final Four in campo neutro.`,
        ], { SEED: String(seed ?? "") }) || `${seed ?? ""}° in Eurolega. I playoff partono ora.`
      );
    }
    return (
      say(s, [
        `$SEED° $PLACE. I playoff partono ora, serie al meglio delle sette.`,
        `$SEED° $PLACE. La primavera ha un nome, e per ora è il vostro turno.`,
        `Dentro, $SEED° $PLACE. Da qui ogni sera vale una settimana di campionato.`,
        `$SEED° $PLACE. Sette partite, o meno, e niente più alibi di classifica.`,
        `$SEED° $PLACE. La porta è aperta. Dietro, $PLACE, ogni sera vale una settimana.`,
        `Dentro da $SEED°. $PLACE non perdona i possessi pigri, e tu lo sai.`,
      ], { SEED: String(seed ?? ""), PLACE: place }) || `${seed ?? ""}° ${place}. I playoff partono ora.`
    );
  }
  if (conf === "Euro") {
    return (
      say(s, [
        "I risultati sono chiusi. Quarti al meglio delle cinque, poi la Final Four.",
        "Dentro. Prima la serie, poi una partita secca alla volta.",
        "La griglia è pronta: i quarti durano fino a tre vittorie; la Final Four no.",
      ]) || "I playoff partono ora, turno per turno."
    );
  }
  return (
    say(s, [
      "I risultati sono chiusi. I playoff partono ora, turno per turno.",
      "Dentro. Il campionato è archivio. Adesso si parla un'altra lingua.",
      "La porta è aperta. Dietro, le serie, che non perdonano i possessi pigri.",
    ]) || "I playoff partono ora, turno per turno."
  );
}

export function faDeskLine(s: PlayerState, hasExtension: boolean, teamName: string): string {
  if (hasExtension) {
    return (
      say(s, [
        "$TEAM vuole tenerti. Sul tavolo ci sono anche altri progetti.",
        "Rinnovo in casa, e voci da fuori. Tocca scegliere la piazza, non solo la cifra.",
        "$TEAM mette l'estensione sul tavolo. Gli altri mettono il resto.",
        "Restare o partire: $TEAM ha già detto la sua. Adesso tocca a te.",
        "$TEAM tiene aperta la porta. Fuori ci sono altre insegne, e nessuna è gratuita.",
        "L'estensione di $TEAM è una frase vera. Le altre piazze, se arrivano, pesano lo stesso.",
        "$TEAM non ti caccia. Ti chiede di scegliere, e la scelta non sta solo nei milioni.",
        "Rimanere a $TEAM è una porta. Partire è un'altra. Tutte e due hanno un prezzo.",
      ], { TEAM: teamName }) || `${teamName} vuole tenerti. Ci sono anche altre strade.`
    );
  }
  return (
    say(s, [
      "Il contratto è scaduto. Le strade sono sul tavolo: soldi, anni, una città da scegliere.",
      "Svincolato. Le offerte arrivano con facce diverse, e nessuna è gratuita.",
      "Mercato aperto. Ogni cifra ha un prezzo che non sta nel contratto.",
      "Niente maglia, per ora. Solo fogli, cifre, e il nome di una città.",
      "Svincolato. Tu scegli la piazza, non solo la cifra, e nessuna è senza prezzo.",
      "Il foglio è bianco. Le piazze no: hanno un nome, un palazzetto, un prezzo.",
      "Contratto finito. Restano le città, e tu devi sceglierne una senza mentire a te stesso.",
      "Svincolato. Il mestiere, adesso, è leggere le piazze prima delle cifre.",
    ]) || "Il contratto è scaduto. Tocca scegliere."
  );
}

export function quietYearEventBits(s: PlayerState) {
  const title = say(s, [
    "Un ottobre senza titoli",
    "La settimana che non fa notizia",
    "Tra una voce e l'altra",
    "Il giorno dopo i giornali",
    "Una stagione che chiede silenzio",
    "Niente da dichiarare",
    "Il lavoro che non si vede",
    "Una parentesi nel calendario",
    "Senza copertina",
    "Tra due notizie",
    "Un mercoledì qualunque",
    "Fuori dal rumore",
    "La pausa che pesa",
    "Niente avversario col nome",
    "Solo il mestiere",
    "Un inverno senza tesi",
    "La pagina bianca",
    "Niente riflettori, stavolta",
    "Una settimana da spogliatoio",
    "Il silenzio di novembre",
    "I giorni uguali, tenuti dritti",
    "Niente apice",
    "Un lunedì che non chiede niente",
    "La stanza senza microfoni",
    "Dopo il rumore, prima del prossimo",
    "Un appello senza nome",
    "La tregua del mestiere",
    "Niente tesi da vendere",
    "Un ottobre senza copertina",
    "La settimana che non ha un nome",
    "Tra un aereo e il prossimo silenzio",
    "Un febbraio senza tesi",
    "La palestra, nuda, di lunedì",
    "Niente avversario da copertina",
    "I giorni che non fanno titolo",
  ]) || "Un ottobre senza titoli";
  const subtitle = say(s, [
    "Non tutte le settimane hanno un avversario col nome. Questa chiede solo di essere attraversata.",
    "Lo staff non alza la voce. Tu devi decidere come usare il vuoto.",
    "Niente copertine. Resta il lavoro, nudo, e tre modi di tenerlo.",
    "Una pausa nel rumore. Può essere un dono o un avvertimento.",
    "Il rumore è altrove. Qui restano tre scelte, e nessuna fa notizia.",
    "Un vuoto nel calendario. Si riempie, o si subisce.",
    "Niente avversario col nome. Resta da decidere come tenere i giorni.",
    "Lo staff aspetta. Non una dichiarazione: un modo di stare.",
    "I giornali hanno trovato un altro nome. A te resta la palestra, e tre modi di entrarci.",
    "Una settimana senza tesi. Si tiene, o si spreca. Tocca a te.",
    "Il calendario non chiede un racconto. Chiede di esserci. Come, lo scegli tu.",
    "Niente da appendere. Solo i giorni, e tre modi di farli pesare.",
    "Una settimana senza nome. Tu scegli come tenerla, e basta.",
    "Il vuoto nel calendario non è un alibi. È un compito, nudo.",
  ]) || "Niente copertine. Resta il lavoro, nudo, e tre modi di tenerlo.";
  return { title, subtitle };
}

/** Quanto spesso un anno quieto deve entrare nel loop live, non solo a pozzo vuoto. */
export function quietYearChance(s: PlayerState): number {
  let p = 0.12;
  if (s.age >= 31) p += 0.06;
  if (s.age <= 22) p += 0.03;
  if (s.publicImage <= 42) p += 0.04;
  if (s.form > -1 && s.form < 1) p += 0.03;
  const last = s.seasonHistory[s.seasonHistory.length - 1];
  if (last && !last.awards.length) p += 0.03;
  return Math.min(0.26, p);
}

export const ROLE_ARTICLE: Record<string, string> = {
  PG: "un ",
  SG: "una ",
  SF: "un'",
  PF: "un'",
  C: "un ",
};
