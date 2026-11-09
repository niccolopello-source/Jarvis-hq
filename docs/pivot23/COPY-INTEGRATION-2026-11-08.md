# PIVOT23 — punto2 rifinito, punto3 IT/EN in bozza

ULTIMO FOLLOW-UP: runtime `0cfab7f752537dc87554c17c9aecdd6632b9af60`, harness `db9d761a2fb59342a0c9e0a19d504c6c727ec3ea`. La sezione finale Lucille/Dallak157 aggiorna gli snapshot precedenti, senza cancellarne provenienza e limiti.

Snapshot tecnico dell'8 novembre 2026, Europe/Rome (CET). Nessun merge PR/main, deploy manuale, modifica env/settings/ads o save reale. Punto4 NON iniziato. Questa è una consegna per review indipendente, non una promessa di demo pronta o una certificazione universale.

## Stack e perimetro

- Punto1: guard155, https://github.com/niccolopello-source/Jarvis-hq/pull/155 , baseline `2840aba327da20c746595524851d422129354119`.
- Punto2:149/150 già integrati con guard155 nella draft156, https://github.com/niccolopello-source/Jarvis-hq/pull/156 . HEAD remoto `e8aef27988f475dc068402262af91a59c1b0839b`, runtime `05d849890c915fd330b73ff7fe11624ffadf42dd`.
- Punto3: branch `grokbot/copy-guard-integration`, base finale156, merge locale della151 (`9614e600b34914ab2ffda5942f0b54d7820a4fdb`, https://github.com/niccolopello-source/Jarvis-hq/pull/151 ). Conflitti package.json e LegacyExperience risolti conservando test155/156 e il formatter premi156 equivalente. Nessun rebase/amend/force delle branch pubblicate. La nuova draft è basata su156: l'ordine eventuale di integrazione è solo proposto e rimane subordinato a review/decisione utente, non autorizzazione merge.

## Chiusura rifiniture punto2, non restyling

B: righe sticky/scorrevoli con border-collapse separate, spacing0, vertical-align middle. C: score serie `1-4` indivisibile in span nowrap; il testo circostante può andare a capo. A: Squadra80px e ultima colonna mobile dimensionata sul contenitore, fine-scroll allineato dopo Stagione+Squadra quando cqw è supportato. Nessun overflow viewport introdotto; durante uno scroll intermedio porzioni di colonne sono normali. Con browser senza cqw rimane fallback scroll, senza promessa di allineamento finale.

Non si nasconde un errore CI: su156/a604 la suite completa ha189PASS/2FAIL/5SKIP, entrambi FAIL per header Squadra con font fallback a360/390IT. Riprodotto RED sulla build esatta con DejaVu Sans, corretto allargando64→80px, non allentando assert. Sei journey responsive IT/EN PASS sul runtime05, inclusi tre font fallback e assert endpoint entro1px.468unit/type/lint/build PASS;198file protetti identici155. Prove finali `file:///workspace/point2-final156/final-screenshots/`; report completo `UI-REVIEW156-2026-11-07.md`, manifest `ui-font156-2026-11-08/font-manifest.json`. CI live sulla nuova SHAe8 conclusa:10SUCCESS/0FAIL/0PENDING. Job https://github.com/niccolopello-source/Jarvis-hq/actions/runs/42424211367/job/128558886807 :468unit,191E2E PASS/5SKIP,49statistiche PASS. Sono prove CI156 osservate, non statistiche locali nuove3. Preview specifica156: https://pivot23-qz5dtqndv-jarvis-hq-vercel.vercel.app (metadata GitHub deployment7628414417, non visitata da desktop).

## Punto3: implementato, separato dal gameplay

### Interfaccia e claim

Importate le rifiniture151 (contatore nome accessibile, testi UI); limite nome letto dalla costante esistente. IT/EN distingue dieci round di costruzione profilo, una carta su tre, da preparazione pre-draft. NCAA/accademia europea/G League non garantiscono lega di esordio: l'engine attuale assegna dopo NBA Draft. Età iniziali verificate nel codice esistente: NCAA21, altri due19; massimo36 invariato. Picco descritto come variabile, frequentemente25–27, non crescita garantita fino28. Save dichiarato locale a questo browser e all'ultimo salvataggio riuscito, senza promessa di ripresa perfettamente identica o account/cloud multi-device. Nessun claim di campionati europei giocabili introdotto. Alcune correzioni ES provengono dalla151: NON è una revisione completa spagnola.

### Rival, età e sviluppo

`copy-context.ts` è render-only: sostituisce `__RIVAL__` con il nome già generato presente nello stato; se mancante usa avversario neutro IT/EN. Negli archivi vecchi rivalName non è persistito: riuso solo un incontro esplicito conservato, altrimenti fallback neutro, nessun nome inventato. Il placeholder può rimanere nei bytes canonici/save: è intenzionale, non una migrazione. Sentinel collision-free e callback preservano nomi letterali e `$&` senza RNG.

Per commenti dipendenti dall'età si usa l'età della stagione storica, non l'età finale; se assente non si indovina. Neutralizzate frasi di anzianità fuori contesto e retrospettiva sui vent'anni quando l'età è19/20. Le frasi specifiche che promettono progresso vengono confrontate con `DevRow.after-before` effettivo: se OVR stabile/in calo, testo coerente, incluse variazioni frazionarie. Non si inventa il miglioramento di un singolo attributo da snapshot mancanti. Non è un nuovo calcolo OVR né una soglia indebolita. Una proposta trade è descritta come proposta, NON come scambio concluso né scelta accettata.

### Terminologia e finali

Nomi paesi e codici ISO noti normalizzati solo in vista, USA→Stati Uniti/United States; nomi sconosciuti conservati. Alias ruolo storici risolti a codice reale; SG=Guardia tiratrice/Shooting guard. Preposizioni articolate per le squadre note, eccezione Houston, Ad Atlanta e pubblico di San Francisco; nessuna ipotesi sui nomi ignoti. Premi plurali/timeline/ruoli sono verificati con fixture.

Finali dei percorsi descrivono la preparazione effettiva, non inventano successo europeo o tappe bruciate. Corrette elisione `un'uscita` e frasi poco compiute `un altro di un palmo` solo nella resa. I generatori conservano le stringhe canoniche e lo stesso RNG. Il renderer PNG non è riscritto: logo monocromo e sigle squadre sono il percorso canvas già documentato in156, non un asset mancante. IT/EN e PNG/timeline rimangono sotto test nel bundle cumulativo guard+UI+copy.

## Criteri e verifiche riproducibili

Dalla directory `apps/pivot23`:

```sh
pnpm run test
pnpm run typecheck
pnpm run lint
pnpm run test:compat:types
pnpm run test:compat:tools
pnpm run build
E2E_PREVIEW=1 E2E_PORT=4202 pnpm exec playwright test --workers=2
node --import=tsx ../../tools/pivot23-copy-review.ts OUTPUT.json
```

Il tool corpus usa solo stati sintetici e cinque carriere complete, seed777001(PG/NCAA/Italia),777002(SG/Europa/USA),777003(SF/G-League/Serbia),7107(PF/NCAA/Francia),89081(C/Europa/Canada). Tutti i cinque ruoli e tre percorsi sono rappresentati, non ogni combinazione.173righe scelte,71dev,71stagioni nel campione originario; finali/commentary in entrambe lingue. SHA256 del JSON completo PlayerState prima/dopo il rendering, RNG incluso, deve essere identico. Il confronto immutabilità è within-run, byte per byte e senza normalizzazione. I digest grezzi tra run diversi non sono una promessa di uguaglianza: l'identificativo `careerId` è generato da crypto. Un confronto aggiuntivo ingenuo6591→b1ee ha digest diversi; non viene spacciato per PASS né per regressione gameplay. Probe separato su due run della STESSA revisione, per tutti i5seed: primo path `$.careerId`, nessun altro path diverso dopo esclusione soltanto di quell'identità non deterministica. `corpus-identity-diagnostic.json` conserva questa diagnosi, che NON è un gate main-vs-draft. RNG/gameplay non normalizzati né modificati. Non è un confronto cross-revision né prova universale di grammatica generativa; controlli catalogo e scansione mixed-language/placeholder aiutano ma non sostituiscono review umana.

I due journey copy headless usano fixture sintetica777002 con variazioni esplicite per decline/stable/età/rival; Storia/Vita→ritiro→Legacy→archivio e screenshot IT/EN. Gli assert controllano che UI risolva il rival mentre raw storico rimane intatto. La suite responsive copre360/390/1280 IT/EN, table start/end, fine scroll, footer, due temi, axe/tastiera e PNG. La fixture UI copy usa SF, distinta dal caso corpus777002/SG: non si deve scambiare il ruolo della fixture per un errore di traduzione.

### Due difetti visuali effettivamente trovati leggendo le nuove immagini

La prima suite completa può passare senza provare ogni geometria. Sulla build6591, immagine EN Vita mostrava contenuto tagliato a sinistra: non è stato liquidato come sola animazione. Nuova prova nativa `scrollIntoViewIfNeeded` più attesa450ms riproduce root `career-view.scrollLeft=20` persistente (IT0), e assert `[0,0]` FAIL. Fix minimo: i due contenitori carousel usano overflow clip, con hidden come fallback, impedendo lo scroll programmatico dei contenitori che devono soltanto ritagliare il track. Il track rispetta ora anche reduced-motion, transizione disabilitata.

La stessa immagine IT mostrava `2-4` spezzato nella storia stagionale di Vita (NON la tabella Legacy già corretta). Probe Range su veri score del pannello attivo: IT FAIL per più di una riga; EN raggiunge invece il FAIL clipping. Piccolo wrapper JSX nowrap conserva intero il solo token score, lasciando il resto del testo a capo. Nessuna modifica ai dati playoff. Il primo probe usava per errore `.review-pane`, che non contiene le righe stagione:0match è un errore di selettore tracciato, non un bug prodotto. Corretto a `.swipe-slide.on`, senza eliminare assert non-vuoto o allargare soglie.

Le nuove prove di questi due difetti precedono il fix: log `clip-red.log`, `life-score-red.log`; non si pretende che una sola ipotesi statica fosse un runtime FAIL. Gli assert aggiunti restano nel repo anche senza richiesta screenshot. Browser senza supporto overflow clip mantengono hidden, non sono certificati contro quel drift. Guard future e native lifecycle nello stesso contesto integrato, non una UI testata su branch senza protezione.

## Limiti e rischi non chiusi

- Nessuna modifica ai generatori `src/lib/pivot/engine.ts`, feel/summer/world/save/config/guard/RNG: `narrative/en/engine.ts` è invece un catalogo di traduzioni e viene dichiarato separatamente.192 dei198file protetti155 identici;6 eccezioni: PivotApp.tsx(solo presentazione), i18n.ts(copy), i18n.test.ts(aspettativa claim corretta), narrative/en/engine.ts(solo catalogo traduzioni, NON generatore engine), narrative/it-display.test.ts(Ad Atlanta), narrative/narrative.test.ts(display diverso da raw, con nuovo assert PlayerState immutato). Manifest elenca ogni hash e differenza; non si afferma198identici per3. Il conteggio192/198 è ricalcolato dalla lista originale completa, non ripete la precedente stima193.
- ENGINE_VERSION `2.24.0-beta`, max36. Nessuna attivazione225, tuning probabilità/scelte/calcoli o nuova estrazione RNG. Le48600simulazioni del4nov sono storia, non nuovi test. Campagna7231checkpoint/312finali/13versioni e49statistiche NON rilanciate localmente in3: generatori/RNG immutati; eventuali CI nuove distinte sotto.
- Compattazione legacy world/dynasty, seed89081, rimane OPEN preesistente e può cambiare RNG/esiti dopo resume, non solo perdere testo. Nessuna correzione silenziosa. Persistibile equivalente come baseline non equivale a memoria piena ininterrotta. Fonte `issues/LEGACY-SAVE-COMPACTION-RNG.md`; documentazione155 resta autoritativa.
- BFCache Chromium155 PASS supplementare, non suitecommitted, fonte `review155-bfcache-supplement/review155-bfcache-supplement.json`, runtime `36d67df0f82be6b6f4ab5e84e68bb490ee4de7a5`, hash log `8b446dfba8b18b604576e8a84688fb48d7ff3676fe552e87cf25f82d58d72420`; non riciclato come nuovo test3. Nel native test locale corrente un pageshow.persisted=false non dimostra BFCache. Safari/Firefox/device reali/HTTP LAN/vecchie tab non cooperanti NON certificati. Web Locks richiede secure context HTTPS/localhost; protezione failclosed invariata.
- Preview automatica è bozza, non produzione. Produzione non ricontrollata in questa milestone di codice; non si dichiara demo pronta. Nessuna accensione ads, spesa o variazione legal.
- Attesa review parent/Lucille su frasi e immagini; Dallak può verificare isolamento deterministico. Nessun punto4 prima del seguito.

## Esiti finali e provenienza

Runtime finale `b1eeed1f59715f5809f087d6e666e95ec2da7e79`; harness finale `4bf6423` (append di solo selettore test), source runtime ricontrollato identico dopo i run. Evidenze manifest:8nov2026 00:34:29 Europe/Rome (CET). Node24.22.1, pnpm10.34.6, Playwright1.63/Chromium153 v1243. Nessuna build concorrente mentre preview serve il bundle.

| Verifica realmente eseguita | Esito / revisione |
|---|---|
| Unit completo finale |482PASS,0FAIL,0SKIP /b1ee |
| Typecheck, lint, build |PASS exit0 ciascuno /b1ee |
| Compat types e tool |PASS;7tool,0FAIL/0SKIP (3jsondiff+4comparatore) |
| Full198 E2E prima delle ultime2correzioni visuali |193PASS,0FAIL,5SKIP /6591c9337b5f67e4c2bdf712af768d1668b09933 |
|82E2E affetti, bundle finale cumulativo |82PASS,0FAIL,0SKIP /b1ee;8spec, comandi nel manifest |
|Nuovi probe visuali prima del fix |IT score multilinea FAIL, EN drift20px FAIL sulla build6591; GREEN nei2journey finali, root/pager scrollLeft0 |
| Responsive360/390/1280 ×IT/EN, axe/tastiera/table/footer/temi/PNG |6PASS compresi negli82 |
| Future slots tutti store + native lifecycle/flush |PASS compresi negli82, non contati come un'altra suite |
|5carriere complete: rendering IT/EN non muta PlayerState né RNG |5PASS within-run, nessuna normalizzazione |
|Source protetta155 |192/198 byte-identici;6eccezioni presentazionali/test documentate, manifest completo |
|Immagini fresche |48PNG hashate e dimensionate, incluse6copy e42UI/export |
|Full198 sul runtime finale b1ee |NOT RUN localmente: full6591 +82mirati finali, non ricontati come198 finali |
|Statistiche locali nuove3 / campagna13versioni |NOT RUN;49stats CI156 osservate e distinte sopra |
|CI156 HEAD e8aef27 |10SUCCESS conclusi;468unit,191E2E PASS/5SKIP,49statsPASS nel job letto |
|CI nuova draft3 |Da leggere dopo push e riportare nel riscontro, NON anticipata comePASS |

I5SKIP della suite completa pre-fix sono preesistenti:2adsON (adsOFF conservato),1flag motore forzato DEV non disponibile su production preview,2probe performance opt-in. Nessun nuovo skip né soglia indebolita. Le82prove finali selezionano tutte le aree effettivamente toccate più le regressioni guard155; non una sola snapshot. I precedenti full193PASS non avevano gli assert geometrici nuovi e NON vengono usati per negare i2difetti poi riprodotti.

Lette direttamente le nuove immagini finali ENVita(root ora interamente visibile), ITsviluppo(OVR coerente e score2-4 intero),360ITfine-tabella,1280ENultima-riga/footer e PNGIT1080×1350. La lettura tecnica non sostituisce approvazione visuale indipendente.

Raw/log/diagnostici: `file:///workspace/point3-evidence/`. Immagini finali pulite: `file:///workspace/point3-evidence/final-b1ee/screenshots-b1ee/` e `file:///workspace/point3-evidence/final-b1ee/ui-screenshots-b1ee/`. Copia report reviewer `file:///workspace/point3-evidence/REPORT.md` e dentro `final-b1ee/REPORT.md`; ZIP `file:///workspace/point3-evidence/final-b1ee.zip`. Manifest/log/corpus sintetico replicati in `copy-integration-2026-11-08/` nel repo. I log intermedi restano hashati nel manifest e sul box, inclusi errori di cwd/tsx, selettori vecchi e aspettative copy aggiornate legittimamente; non sono spacciati per bug prodotto.

Nessuna modifica applicativa dopo b1ee. HEAD consegna include soltanto harness/prove/report successivi; SHA esatta e URL draft/preview letti dopo pubblicazione nel riscontro finale. Punto2 rifinito, punto3 pronto per review della bozza, non punto4 e non merge/produzione.


## Follow-up Lucille/Dallak157 — 8nov2026, prima di4

Punto2 UI può considerarsi chiuso nel campione della review, NON universalmente. Questa sezione supersede i conteggi finali precedenti solo dove esplicitamente indicato. Branch e draft157 invariati; append commit normali, niente amend/force/merge/main/deploy manuale/env/ads. Nessuna attivazione225 o modifica engine/save/RNG.

### MEDIO: Traguardi con helper premi comune

Il difetto era reale: ReviewTab usava `nx(m.label)` anziché il formatter premi di Legacy. Ora riusa `legacyAwardLabel`, esteso per gli ID già esistenti NBA Champion/EuroLeague Champion/Finals MVP/FMVP: IT Campione NBA/Campione di Eurolega/MVP delle Finali; Rookie dell'anno già comune. EN conserva i nomi canonici ufficiali. Gli ID engine e le stringhe persistite non cambiano. Test IT su tutti e3i premi osservati nel DOM, più unit su array canonico immutato e nomi IT/EN. I premi nella riga stagione di Vita riusano lo stesso helper. Non riscritta la grammatica dei generatori.

### HYPOTHESIS OVR: provenienza spiegata, non motore alterato

La vecchia fixture era una carriera simulata completa su cui venivano poi SOSTITUITI soltanto devLog e choices per tre edge indipendenti:62→59,62→62,62→63, non una traiettoria completa di carriera. Confrontarla con le ultime stagioni65/64/64/61 o con la testata59 era fuorviante. La fixture edge è conservata, chiamata visibilmente `Copy EDGE fixture` e negli screenshot `edge-*`; resta sotto assert pertinenti per calo/stabilità/età/rival. Le ripetizioni del titolo estate S1/S2 sono presenti due volte nell'INPUT forzato, su stagioni diverse: DOM3righe per3DevRow e chiavi stagione+label distinte, non doppio rendering. Non eliminato il caso ripetuto e nessuna modifica a probabilità o azioni estive.

Aggiunta fixture NATURAL separata, `Copy natural replay`: output completo reale `playCareerSim`, seed777002, ruolo SF, NCAA, nazionalità generata Spagna. Non sostituiti storia/OVR/devLog/scelte/premi/rival. Solo identificativo sintetico del test. Ultime stagioni11–14: età31/32/33/34, OVR65/64/64/61; ultimo DevRow14 è61→59 e la testata finale età35/OVR59. La simulazione registra la stagione regolare prima dei playoff e poi applica l'estate (`engine.ts3873–3928`); la testata non è lo snapshot della stagione regolare. Non si richiede che ogni DevRow.before equivalga alla precedente riga regolare: sono fasi diverse. Questa prova spiega il caso osservato, non certifica ogni possibile derivazione.

Le righe S.1/S.2/S.14 ora mostrano anche l'anno sportivo reale del DevRow (es.2026-27 o2039-40), evitando di leggere S.1 come l'ultima estate della testata. Nessun dato cambiato per rendere verde il test. La modalità NATURAL affronta anch'essa Vita→ritiro→Legacy→archivio in IT/EN; la modalità EDGE rimane separata. Metadata della fixture conserva tutte le coppie season/age/OVR/before/after/label per audit.

### BASSI: numeri e scorrimento

Statistiche strutturate, sviluppo OVR e attributi di Vita, testata e altri pannelli numerici del medesimo componente riusano `fmtDec` di Legacy: una cifra decimale, virgola IT/punto EN. Nessuna conversione numerica nei save né nei calcoli, né riscrittura di stringhe monetarie storiche. Il titolo estate duplicato è spiegato sopra, non nascosto con deduplica.

La vecchia immagine era catturata con scrollTop=scrollHeight: una intestazione precedente può legittimamente restare parzialmente sopra il viewport, senza essere un nuovo blocco sovrapposto. Il percorso di lettura ora usa scroll nativo verso Scelte/Choices; `scroll-padding-block` sullo slide e `scroll-margin-block-start` sui suoi h4 garantiscono spazio dopo la chrome. Assert reale bounding-box: heading.y ≥ chrome.bottom+8, IT/EN sia NATURAL che EDGE; non solo spostamento manuale della screenshot. Le nuove immagini mostrano Scelte/Choices interi. UIA/B/C precedente resta PASS nel campione.

### Gate forte richiesto: CROSS156→finale, non within-run soltanto

Base esatta `e8aef27988f475dc068402262af91a59c1b0839b`, fonte estratta con git archive in directory isolata; finale runtime `0cfab7f752537dc87554c17c9aecdd6632b9af60`, senza modifiche applicative dopo. Worker e comparator riproducibili nel repo: `scripts/compatibility/copy-isolation.mjs`, `copy-isolation-compare.mjs`, relativo test3casi. Due processi separati, nessun oggetto o cache RNG condiviso fra revisioni. Stessa versione Node/dependency installata, niente save reale.

INPUT controllati prima della creazione: Date.now=1794081600000, crypto.randomUUID restituisce una sequenza deterministica identica; seed e opzioni espliciti, policy scelte alterna primo/ultimo indice per stagione, audit registra ID/titolo/indice/pick. Il careerId nasce già dall'input controllato, NON viene escluso o cancellato dopo il confronto. Nessuna normalizzazione. Nessuna esclusione delle stringhe persistite, nemmeno placeholder o testo canonico divenuto diverso in vista.

Campione9casi:3percorsi naturali (777001PG/NCAA,777002SG/Europa,777003SF/G-League) e6edge(880010–880015,PF/C) per rival presente/assente, archivio legacy senza card/fingerprint/schema come INPUT storico, delta-3/0/-0.25/+1/-1, età21/34/19/20 e assente. Un secondo DevRow età-sensibile esercita davvero il ramo età anche nei casi delta0. I titoli e i PICK vengono renderizzati entrambi in IT/EN, incluse scelte archiviate con fallback neutro; i finali sono esercitati su tutti3i percorsi.

Ogni checkpoint prima/dopo resa confronta FULL PlayerState serializzabile, envelope completo/checksum, log canonico, n/opts, audit/count/order, archivio completo generato da toArchive (input legacy privato soltanto dei campi non presenti nel vecchio schema), verdetto canonico finale, RNG salvato e RNG ATTIVO `job.rng.getState()`. Il render viene eseguito con CURRENT===job.rng, stato misurato prima/dopo e fallbackDraws tracciato. Poi si continuano le STESSE scelte fino a fine carriera: non una statistica finale isolata.

Esito:137coppie di checkpoint PASS,9input/9finali,0mismatch; nessun primo JSON path differente. Le uscite render-only sono conservate separatamente e possono differire intenzionalmente; tutto il contenuto persistito resta dentro il confronto canonico. Comparator sensitività3PASS: modifica PICK, RNG attivo, perdita/ordine dei checkpoint causano FAIL al primo path. Il precedente within-run5carriere rimane storia, non viene riciclato come questo nuovo gate.

Comandi dalla directory apps/pivot23, dopo estrazione BASE_APP e collegamento delle dipendenze già installate:

```sh
node --test scripts/compatibility/copy-isolation-compare.test.mjs
node --import=tsx scripts/compatibility/copy-isolation.mjs BASE_APP cross156.json.gz
node --import=tsx scripts/compatibility/copy-isolation.mjs FINAL_APP cross-final.json.gz
node scripts/compatibility/copy-isolation-compare.mjs cross156.json.gz cross-final.json.gz cross-comparison.json
```

Raw per-run gzip completi (non solo digest), display IT/EN, SHA dei sorgenti/harness, metadata fixture, comandi ed exit nel manifest follow-up. Copertura mirata, NON una campagna13versioni, nessuna prova universale. Compattazione legacy89081 resta OPEN esattamente come prima e non è stata normalizzata o corretta.

### Esiti di questo follow-up

-483unit PASS/0FAIL/0SKIP; typecheck PASS. Il primo lint ha rilevato `any` nel solo tipo metadata E2E: corretto con il tipo preciso, lint finale PASS, non regola disabilitata.
-84E2E affetti PASS/0FAIL/0SKIP sul runtime0cfab, incluse4journey copy NATURAL/EDGE IT/EN,6responsive, axe/tastiera/PNG e regressioni guard future/native lifecycle. Build PASS.7tool compatibilità esistenti PASS,3nuovi comparator sensitivity PASS; compat types PASS.
-Full200 CONCLUSO sullo stesso runtime0cfab:195PASS/0FAIL/5SKIP preesistenti (2adsON,1DEV engine flag,2perf opt-in). Run9,4min. Gli84mirati sono un sottoinsieme già rieseguito, NON195+84casi distinti. Il precedente full193/5su6591 NON è usato come risultato finale.
-192/198file protetti155 ancora identici, le medesime6eccezioni dichiarate sopra. Generator engine, save, guard, config, RNG immutati.
-CI157 della SHA97 precedente:10SUCCESS conclusi, osservati live prima del nuovo push. Per la nuova HEAD lo stato viene letto dopo push: resta gate aperto finché non conclude, nessuna anticipazione PASS.
-Nuove immagini54confermate(12copy+42UI), con hash/dimensioni/source runtime nel manifest, evidenze aggiornate8nov2026 00:56 Europe/Rome (CET). `file:///workspace/point3-followup157/`, report anche nella cartella per Lucille. Nessun punto4 prima di review chiusa e CI finale completa.


I due raw completi per revisione sono preservati sul box (circa5,46MB ciascuno), non eliminati o sostituiti con soli digest:
- `file:///workspace/point3-followup157/cross156.json.gz`
- `file:///workspace/point3-followup157/cross-final.json.gz`
Nel repo restano worker/comparator/test riproducibili, manifest con SHA256/size dei raw, risultato137coppie e log lossless, senza allegare11MB binari alla diff. La directory reviewer contiene `REPORT.md` e lo ZIP delle sole immagini/report. Source app ricontrollata byte-identica al runtime0cfab dopo tutta la campagna. Nessun punto4 avviato; review finale parent/Lucille/Dallak e CI nuova HEAD ancora gate separati.
