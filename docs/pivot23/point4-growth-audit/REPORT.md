# Punto 4 — audit causale crescita/scelte/morale/archetipi

## Decisione: nessuna modifica di tuning giustificata nel campione
Osservazioni e hash: manifest.json, Europe/Rome,8novembre2026. CI verificata VERDE (PASS) su e627f744605d4577f82ddb173b84aebde095a179 (correzione 9nov): run 42577485761 e 42577490618 “PIVOT 23 beta” e 42577490555 “docs-only PRs”, tutti con job lint/types/unit/build/e2e e statistical engine checks SUCCESS, attesi con `gh run watch --exit-status` (exit0). Il gate157 resta separato. Commit docs successivi: vedere la CI della PR sulla HEAD finale.
Base PR157 dc5878a228ab949e5f22573664a97cc27d2be43d. La campagna è partita dopo tre workflow applicativi SUCCESS sulla stessa SHA, attesi con `gh run watch --exit-status` (42427566051,42427565917,42427562996). Il run docs-only non è una nuova esecuzione E2E: le suite locali riportate sotto sono nuove. Tutto `apps/pivot23/src` resta byte-identico alla base: nessun cambio motore, UI, salvataggi, guard, RNG o versioni. 2.25 resta INATTIVA; ENGINE_VERSION2.24.0-beta; max36.

Il punto4 produce strumenti riproducibili e misure, non un aumento artificiale dei coefficienti. I criteri e la mappa causale sono in CRITERIA.md, scritti prima della misura. Non è emerso un difetto riproducibile nel flusso ordinario che giustifichi un ritocco; non si certifica l’assenza universale di bug. Una prova red→green di una patch runtime è NOT APPLICABLE (non esiste una patch runtime), non un PASS inventato.

## Correzione review Dallak — preview policy con RNG isolato (9 novembre 2026, Europe/Rome)
Blocker: in 4ff3afd `causal-audit.mjs:14` valutava le alternative con `c.fx(structuredClone(s))` dentro l'RNG ATTIVO della carriera. Esempio reale an5 (data.ts1309–1326): ogni alternativa fa `pick(COACH_NAMES)` e consumava draw della carriera prima della scelta vera. Misura nuova: il difetto non era solo an5 (58 carriere policy con an5) — anche carte rival/nation/late/quiet/injury/proc consumano RNG in preview, quindi tutte le 480 carriere dei 4 profili policy erano contaminate. Inoltre le carte generate costruiscono Fx con closure sullo stato LIVE: la preview marcava `heardLines` reali anche passando un clone (secondo canale, trovato dal nuovo contratto full-career).

Fix (solo harness, `apps/pivot23/src` byte-identico a dc5878a/0cfab7f): `scripts/point4/policy-preview.mjs` valuta ogni alternativa con un Mulberry32 privato allo STESSO cursore attivo (anche cursore 0, sentinel di setState), via `runWithRng` che ripristina il contesto anche su errore; snapshot dello stato live e ripristino in place di ogni chiave toccata dalla preview. Nessun coefficiente, ENGINE_VERSION2.24.0-beta, max36, 2.25 inattiva.

Contratti rosso→verde (`pnpm test:point4`, cablato in `pnpm test`): 5 nuovi test (4 su an5 REALE: cursore e player invariati per i4 profili, preview = coach reale successivo e una sola draw, ripristino su throw, cursore0; 1 full-career: 3seed×4profili, carriera con preview ≡ replay delle stesse scelte senza preview, RNG a ogni step + PlayerState completo). Preview ingenua 4ff3afd: FAIL5/9; RNG isolato senza ripristino live (bozza locale 8nov01:32): FAIL1/9 (heardLines); finale: PASS9/9. Log in policy-preview-fix/.

Ricalcolo SOLO dei 4 profili policy (best, worst, morale-up, morale-down) sugli STESSI 120 seed (940000+indice*97), `causal-audit.mjs . OUT --policies-only`: 480 carriere, due esecuzioni byte-identiche (careers sha256 efe8ac56…ae84). Gli altri 5 profili e i 360 controlli singola-stagione non chiamano la policy: riusati invariati (sezioni summary non-policy identiche, verificato). Rispetto alla bozza RNG-only, il ripristino heardLines cambia ancora 87/480 RNG finali e 3 picchi.

|Paired picco|vecchio (contaminato)|nuovo (RNG isolato)|
|---|---:|---:|
|best−worst media|+1,758|+1,933|
|best−worst mediana; p10…p90; min…max|+2; −1…+4,1; −4…+8|+2; 0…+4; −4…+9|
|best−worst positive/pari/negative|89/16/15|88/22/10|
|morale-up−down media|+0,667|+0,742|
|morale-up−down mediana; p10…p90; min…max|0; 0…+2; −1…+5|0; 0…+2,1; −1…+4|
|morale-up−down positive/pari/negative|47/70/3|46/72/2|

|Profilo|picco medio vecchio→nuovo|mediana|p10/p90 nuovo|ritiro medio|ROY|MVP|
|---|---:|---:|---:|---:|---:|---:|
|best|74,558→74,633|74→73,5|63,9/88,1|33,833→34,117|16,7%→16,7%|16,7%→15,0%|
|worst|72,800→72,700|72→72|63,0/85,1|33,517→33,025|12,5%→12,5%|11,7%→11,7%|
|morale-up|74,150→74,242|73→73|63,0/88,0|33,383→33,458|17,5%→17,5%|18,3%→18,3%|
|morale-down|73,483→73,500|73→73|63,0/87,1|33,350→33,433|17,5%→17,5%|14,2%→14,2%|

Best−worst nuovo per difficoltà esordio+2,067/pro+2,500/allstar+1,167/leggenda+2,000; per percorso NCAA+2,200/Europa+1,975/G-League+1,625. Morale-up−down per difficoltà +0,833/+1,133/+0,367/+0,633.

Conclusione tuning (HYPOTHESIS valutativa, non PASS statistico): la contaminazione spostava le medie di +0,18 (best−worst) e +0,08 (morale policy), entrambe verso l'alto con RNG isolato; nessuna inversione di segno, best−worst resta positivo in tutte le difficoltà/percorsi. Il gap morale-policy +0,742 resta sotto la proposta storica 1–2, ma la policy morale tocca solo scelte story e altri Fx: non è l'effetto causale del morale e non è un requisito approvato. Con 2 repliche/cella NON emerge un difetto riproducibile che giustifichi un ritocco di coefficienti: tuning NON giustificato dal campione; resta decisione di prodotto per punto5. Limite: `src/lib/pivot/choices-depth-225.stats.test.ts:16` usa lo stesso pattern di preview sull'RNG attivo (gap 1,99/0,74 della suite stats); non corretto perché src è congelato — da valutare in review, NON in questo worker.

I numeri sotto “Nuove misure” e `summary.json`/`careers.json.gz` in radice sono la campagna originale 8 novembre: per i 4 profili policy sono SUPERATI da policy-preview-fix/summary.json e careers-policies.json.gz.

## Gap legacy della suite stats: evidenza NON causale (9 novembre 2026)
`src/lib/pivot/choices-depth-225.stats.test.ts:16` valuta le alternative con `c.fx(structuredClone(s))` dentro l'RNG del job (la policy è chiamata da `advanceCareerSim`, righe27–28 aprono/avanzano il job): stesso doppio canale RNG + heardLines corretto qui. I suoi gap 1,99 (best−worst) e 0,74 (morale) sono quindi evidenza LEGACY, non causale. Il test NON è stato modificato: correggerlo in src richiede approvazione separata di Pello.

Misura solo harness `scripts/point4/legacy-stats-clean.mjs` (stessi parametri: N240, seed910000+i, ruoli i%5, percorsi i%3, pro, draft random, 2.25.0, stessi score; cambia solo la preview):
|Gap|legacy (riprodotto)|pulito (previewChoice)|IC95 paired pulito|soglia test|esito pulito|
|---|---:|---:|---:|---:|---|
|best−worst|1,988|2,525|2,23–2,82|1,2–3,5|PASS (entro soglia)|
|morale up−down|0,742|0,738|0,59–0,89|0,5–2,5|PASS (entro soglia)|
Paired pulito best−worst 197 positive/34 pari/9 negative; morale 99/138/3. Il riprodotto legacy coincide con il log CI (1,99/0,74): PASS di fedeltà dell'harness. JSON in policy-preview-fix/legacy-stats-*.json. Anche puliti, i gap restano dentro le soglie esistenti: nessuna soglia cambiata.

IC95 (normale, paired, n120) campagna punto4 pulita: best−worst +1,933 (1,55–2,31); morale-up−down +0,742 (0,54–0,95).

## Limiti del fix preview (review Dallak, HYPOTHESIS)
- `restoreLive` ripristina in place solo il contenitore top-level (array/oggetto); i valori annidati mutati tornano come CLONI: un alias annidato catturato da una closure può staccarsi dallo stato live. Non copre Map/Set, prototype, getter/setter, Fx asincrone né stato di modulo (WeakMap BUILT_AT/experiments, cache voice). Il contratto full-career (3seed×4profili) non ha mostrato divergenze, ma non è prova universale.
- Provenienza red→green parziale: il codice della preview ingenua (equivalente all'inline di 4ff3afd, sostituito localmente) e della bozza RNG-only delle 01:32 NON è committato; sono committati solo i log rossi e lo SHA della bozza (manifest clean-policy 6efaaee4…71af, solo box).
- 2 repliche per cella: valide per l'aggregato, non per la singola cella. 8/60 celle ruolo×percorso×difficoltà hanno best−worst medio ≤0 (morale: 22/60 ≤0).

## Nuove misure
120 seed-profile =5 ruoli ×3 percorsi ×4 difficoltà ×2 repliche; seed940000+indice*97. Nove profili,1080 carriere225 e360 controlli singola-stagione. Seconda esecuzione sugli stessi input:1080 carriere+360 controlli, non1080 nuove osservazioni indipendenti. File careers/sensitivity byte-identici tra esecuzioni. Nessuna lettura/scrittura di save utente.

|Confronto picco paired|n|media|mediana|p10–p90|min–max|
|---|---:|---:|---:|---:|---:|
|best−worst (vecchio, contaminato; nuovo +1,933)|120|+1,758|+2|−1…+4,1|−4…+8|
|morale-up−down (vecchio, contaminato; nuovo +0,742)|120|+0,667|0|0…+2|−1…+5|
|morale iniziale100−10|120|+3,55|+3,5|+1…+6|−2…+11|

Best−worst:89positive/16pari/15negative. Media per difficoltà esordio+1,933/pro+1,900/allstar+1,100/leggenda+2,100; per percorso Europa+2,000/G-League+1,150/NCAA+2,125; tutti i5 ruoli con media positiva. Non ogni scelta o carriera migliora: le policy massimizzano l’impulso locale, non il successo finale. Il massimo paired+8 è una traiettoria divergente, non un singolo bonusOVR.

Morale-up/down controlla soltanto scelte story, non estate/playoff, e modifica anche altri Fx: NON è l’effetto causale puro del morale. Lo storico0,81 era una precedente misura/proposta, non una soglia che abbiamo forzato. I target storici1–2 rimangono proposte; le soglie statistiche esistenti non sono indebolite.

Controllo isolato singola-stagione:360 prove120triplette, stato e RNG iniziale identici salvo morale10/55/100.100−10: minuti media+2,950 (2,4…3,7), ppg+0,578 (0,3…0,9), overall immediato0 e gp0 in tutte120coppie. L’OVR lagged/esperienza non è misurato dall’overall immediato. RNG finale uguale45/120, diverso75/120: divergenze downstream osservate con input diversi; causa draw-per-draw NON isolata. NON una promessa di pari numero di draw tra input differenti. Non si escludono RNG/campi per far passare confronti. Il controllo è di input e stagione, non identità universale di rumore/rami successivi.

## Curva e archetipi
Profilo casuale,120 carriere: delta medio24→25+1,367;25→26+1,133;26→27+0,833;27→28−0,458. Apex26/27/28 separati in summary.json: il declino al proprio apex non è un cliff generale a26. Test diretto: i moltiplicatori training e contextualPulse non hanno salto25→26; curva naturale non decresce prima26. Non significa crescita monotona per ogni singola carriera (infortuni, form, potenziale e arrotondamento restano possibili).

Star = draftbest e potenziale97; role = draftworst e potenziale66. NON sono popolazioni naturali. Nel campione bilanciato su4 difficoltà: star picco medio93,242, p10–p9089…99, MVP92,5%; role61,817,59…64,1,MVP0%; casuale73,492,63…87,1,MVP12,5%. Non comparare direttamente i tassi aggregati ai vecchi Pro-only98%/99,7%. Non si è gonfiata varianza per far somigliare due input estremi. Questi dati non validano anti-inflation premi.

## Criteri: cosa è verificato e cosa resta valutazione
- PASS nel campione: termine esperienza bounded; nessun extra draw dalle scelte sintetiche testate; statsPulse non riapplica attrs; policy best con media positiva nei4 livelli,3 percorsi e5 ruoli; finitezza/cap/terminazione nelle1080 carriere.
- Nessun cliff universale25→26 osservato; NON una garanzia di crescita monotona né di assenza di ogni salto a tutte le età.
- Proposta morale1–2OVR NON raggiunta dalla policy(+0,742 con RNG isolato; +0,667 prima della correzione); non è un requisito approvato da forzare. La sensibilità estrema iniziale(+3,55) non è la stessa domanda sperimentale.
- Outlier best−worst fino+8/−4 e morale iniziale fino+11/−2: visibili, non rimossi. Plausibilità delle code è valutazione aperta per review;2repliche/cella non supportano un target di distribuzione universale.
- Archetipi: input estremi confermati, non prova di difetto che autorizzi gonfiare varianza o potenziale. Nessuna patch di gameplay proposta soltanto per cambiare una percentuale.

## Premi/ritiro: osservati, NON corretti
Profilo casuale:ROY14,167% (17/120), ritiro mediana33, media33,692. Best/worstROY16,667%/12,5%; morale-up/down17,5%/17,5%; morale iniziale100/10ROY25%/6,667%. StarROY53,333%/ritiro mediana33; roleROY0,833%/ritiro mediana34. Campioni diversi dal vecchio48.600: non sono una riduzione verificata diROY17,8%. Nessun pre/post tuning: runtime invariato, quindi spostamento dovuto a patch NON APPLICABILE. La diversa longevità debole/forte resta osservazione per punto5; nessuna policy ritiro alterata.

## Test e provenienza
|Verifica finale locale|Esito|
|---|---|
|Unit esistenti + nuovi contratti cablati in pnpm test|483+4 PASS,0FAIL,0SKIP (8nov); 9nov dopo fix: 483+9 PASS,0FAIL,0SKIP|
|Statistiche esistenti, soglie invariate|49PASS,0FAIL,0SKIP; gap best−worst1,99, morale0,74 nel suo campione240Pro|
|Typecheck/lint/build|PASS (comandi finali dopo wiring test)|
|Headless Chromium: carriera224→reload→Legacy + native navigation + protezione future|32PASS;0nuoviSKIP|
|Matrice225 + replay|1080carriere/360stagioni per esecuzione,2esecuzioni raw byte-identiche|

Nessuna nuova dipendenza. `package.json` cambia soltanto per aggiungere `test:point4` al comando test normale: i quattro nuovi contratti non restano fuori CI. Testano esclusione del doppio statsPulse per attrs, assenza di gate25→26 nei moltiplicatori, esperienza capped senza draw extra, replay full-player+RNG rappresentativo. Non sono prova che ogni canale causale sia universalmente privo di bug.

Vedere manifest.json, summary.json, test-runs.json e log allegati. Raw completi in /workspace/point4-growth-audit (box, non dati utente). Le stesse sorgenti e stessi script consentono rigenerazione; non si presenta hash/digest come sostituto del confronto full-state.

## Legacy nuova campagna full-state
Base157→audit corrente:6293/6293 checkpoint supportati PASS e161/161diagnostici identici, totale6454/6454,strict.13versioni212–224×24carriere=312finali;3percorsi×4difficoltà×policy first/last,5ruoli ruotati, seed61200+indice*97. Per checkpoint confrontati PlayerState completo, envelope, n/opts serializzabili e RNG attivo, inclusi stati ininterrotti e serializza/load/resume; Date.now e careerId fissati IN INPUT, nessuna normalizzazione. Questo rilancio usa worker completo, non il supplemento paired936: non riciclare il vecchio totale7231.

Main33810f7→audit:6293/6293checkpoint supportati PASS. I161diagnostici hanno39PASS/122FAIL di identità cross-main, attesi per la policy di protezione preesistente; sono separati dal modo preesistente allow-diagnostic-changes (la protezione future155 differisce intenzionalmente da main, non è una novità punto4). Dettagli nel summary e nei digest per checkpoint. Main live letto durante audit è ancora33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f; PR157 live ancora draft alla base dichiarata.

Resume all’interno di ciascuna revisione:9830controlli sulla coppia157/audit (4915per revisione),1006full-memoryPASS/8824FAIL; persistibile envelope0FAIL e RNGattivo0FAIL in questo campione. Primi mismatch full-memory:$.player.world.events.10 (7512),$.player.championLog.0.yearLabel (1310),$.player.world.events.15 (2). NON nascosti, normalizzati o corretti. Seed89081 non è incluso nel campione worker: il suo effettoRNG noto resta documentato OPEN, non contraddetto dallo0RNGFAIL qui.

Setup iniziale: un avvio in cwd errata non trovava tsx; un avvio da altro checkout main senza dipendenze non trovava react. Log di entrambi exit1 conservati; ripetizioni corrette exit0 su materiale privato con dipendenze esistenti condivise. Non sono FAIL prodotto né suite dichiarate PASS senza riesecuzione.

## Limiti aperti / gate successivo
- Solo campione dichiarato;2 repliche per cella non stimano tails o popolazione utenti.
- Nessuna attivazione225, merge, deploy manuale, env/settings/ads, spesa o save reale.
- Seed89081 compattazione dynasty/RNG rimane OPEN e non solo visivo: ../issues/LEGACY-SAVE-COMPACTION-RNG.md. Identità cross-revision non implica resume full-memory corretto.
- Safari/Firefox/device reali/HTTP LAN/vecchie tab non cooperanti NON certificati.
- Browser225 live NOT RUN (inattiva e bloccata intenzionalmente dalla guard;225 solo motore sintetico). Nessuna nuova immagine necessaria: zero modifiche visive.
- Punto5 NON iniziato: richiesta review parent/Dallak del punto4 prima di procedere.
