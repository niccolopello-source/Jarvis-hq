# PIVOT23 — punto 2, integrazione UI/Legacy con guard punto 1

Bozza in verifica, non merge/deploy; punto3 non iniziato.

**Seguito review Lucille156:** [nuovo report tecnico](UI-REVIEW156-2026-11-07.md), runtime12bf603: tabella mobile/Squadra/Playoff e ruoloSG corretti;468unit e90E2E PASS,2skip preesistenti. Le sezioni sotto conservano le prove della milestone b381ec6, non sono le nuove immagini.
Base guard155 HEAD2840aba327da20c746595524851d422129354119. Branch `grokbot/ui-guard-integration`.
Merge149:3ac095b948bda1bbdd53ba13e746b8e89d328784; merge150:88e2461693fa631f0f06d0cfce85a6b8fca61bd5. Entrambi OPEN/draft base main all'ispezione live. Un conflitto package.json risolto mantenendo tutti i test/comandi155 e aggiungendo legacy-polish149. Merge150 automatico, compreso LegacyExperience condiviso.
149: label/display Legacy, incluse tre chiusure già presenti, non catalogo narrativo esteso. 150: rail OFF, tema free, footer, sticky/scroll tabella. Engine/save/world/RNG/guard invariati rispetto155.

## Criteri dichiarati prima dei fix
- Unica UI responsive360/390/1280 IT/EN, niente overflow documento/card; tabella scrollabile internamente con prima colonna sticky.
- Ads OFF rail vuote aria-hidden, niente RISERVATO; temi free senza Gratis/Free; footer non copre temi.
- Temi touch target >=44px, tastiera Enter/Space/focus tabella, contrasto axeWCAG2.1AA, reducedmotion senza card animation.
- Journey sintetico deterministico7107: career→retirement→Legacy→archive/reload; tema non modifica archive/fingerprint; premio coerente report/card/PNG IT/EN.
- Guard155: future-slot e native lifecycle invariati; ENGINE_VERSION224/max36 e limite compattazione/RNG89081 preservati.
- Screenshot effettivi/preview per parent e Lucille; niente certificazione Safari/Firefox/device reali/HTTP LAN/vecchie tab.

Diff live149/150 e screenshot concept-ready before/after desktop/mobile letti insieme al tool screenshot storico. I concept sono riferimenti, non nuove prove. Review indipendente Lucille finale attesa, nessuna approvazione inventata.

## Difetti confermati e correzioni minime

1. **P2 coerenza finale IT/EN**: nel baseline integrato95c3659 il report diceva «Sesto uomo dell’anno» mentre la card mostrava `Sixth Man`; test reale360IT RED, screenshot prima e log conservati. `cardLabels` ora riusa `legacyAwardLabel` già introdotto149: stessa presentazione in card e PNG, nessun testo salvato modificato. EN usa `Sixth Man of the Year`.
2. **P3 geometria footer desktop**: fixture1280IT, bordo finale fieldset oltre footer di0.3125px dopo scrollIntoView. RED ripetuto, non descritto come grave blocco touch. Primo tentativo margin40→48 non risolveva: batch89PASS/1FAIL/2SKIP, conservato. Correzione finale: margin40 originale ripristinato + `scroll-margin-bottom:8px`; GREEN6 responsive, gap finale7.6875px IT/8.234375px EN. Assert non indebolito.

3. **P2 stessa coerenza nella timeline**: screenshot EN mostrava `Sixth Man` invece del nome completo della card/report; unit mirato RED su timelineLine IT. Una sola applicazione dello stesso helper alla label del premio nella timeline, nessuna grammatica engine o narrativa estesa. Nuovo unit e assert nei6 journey UI.

Solo questi tre difetti confermati hanno richiesto correzioni oltre all’integrazione149/150. Nessun restyling di UI funzionante, nuova dipendenza, flag ads o tuning. React checklist: componenti/eventi esistenti mantenuti, helper puro riusato, nessun nuovo listener/global state/effetto; accessibility gestita dai test esistenti e dai nuovi6casi.

## Prove riproducibili

Runtime finale dopo i fix: `b381ec6` (SHA completo nel manifest). Commit seguenti solo report/artefatti, da verificare con diff. Fixture7107 generata da `playCareerSim`224 con11righe, careerId fisso; premio/ordinale e pending-retire impostati esplicitamente per edge case UI. Non è un esito naturale di carriera, non misura bilanciamento né frequenza del ritiro a35. Real UI retirement→Legacy→archive/reload; anche journey lungo giocato UI e sparse/old archive coperti dai test preesistenti.

Ogni nuovo caso360/390/1280×IT/EN verifica zero overflow documento, sticky prima colonna e scroll tastiera mobile, assenza Gratis/Riservato, temi >=44px, Enter/aria-pressed, card senza animazioni sotto reduced-motion, axe WCAG2.1A/AA, nessuna mutazione bytes archive dopo tema/reload. Nei due casi360 il PNG reale1080×1350 viene scaricato, e le chiamate canvas.fillText originali sono osservate (non sostituite) per verificare il premio tradotto. Footer separato da tabella visibile e selettore dopo scroll.

| Verifica finale sul runtime b381ec6 | Esito osservato |
|---|---|
| `pnpm run test` | **PASS467/467**, zero skip/fail |
| typecheck/lint | **PASS**, exit0 |
| build produzione locale | **PASS**, exit0 |
| compat types + tools | **PASS**,7tool (3json-diff+4comparatore) |
| 9spec E2E preview,92casi | **90PASS,2SKIP condizionali preesistenti adsON**,0FAIL |
| 6nuovi journey responsive | **6PASS inclusi nei90**, non si sommano i rerun |
| Native pagehide guard + future slots | **PASS inclusi nei90** nello stesso bundle con UI |
| Screenshot + exportPNG sintetici | **20file**, hash/dimensioni nel manifest |

Il run finale include axe IT/EN su tutte le schermate principali, card/report, keyboard, reducedmotion, age36, archivio vecchio/sparso e PNG, oltre a38casi future/lifecycle/native. Il journey lungo UI welcome→archive ha chiuso in38passi nel run finale. Non si interpreta questo come intera suite del repo o universalità dei percorsi. Prima esecuzione browser: NOT RUN per binario assente, poi installato runtimeChromium richiesto; le prove RED riportate sono le esecuzioni successive effettive, non l’errore setup.

Stats49, campagna integrale7231/312 e full-memory resume: NON rieseguiti localmente nel punto2, non riciclati come prove nuove. I198file non-presentation del baseline155 sono confrontati byte-per-byte con gitshow e SHA256, inclusi engine/save/guard/RNG/world: tutti invariati. I nuovi unit/e2e includono regressioni legacy e future slots/lifecycle nello stesso codice con UI integrata. Limite legacy compattazione/RNG89081 rimaneOPEN, non corretto.

## Screenshot e review

Screenshot nuovi solo sul box, non confusi coi concept storici:
- `file:///workspace/point2-evidence/screenshots/360-it-card.png`
- `file:///workspace/point2-evidence/screenshots/360-it-themes.png`
- `file:///workspace/point2-evidence/screenshots/390-en-table.png`
- `file:///workspace/point2-evidence/screenshots/1280-it-themes.png`
- PNG reale: `file:///workspace/point2-evidence/screenshots/360-it-export.png`

Manifest con SHA256 di tutte le immagini e source/log/testi di comando in `ui-integration-2026-11-07/`. Gli artefatti completi restano `/workspace/point2-evidence/`. Screenshot letti direttamente per controllo tecnico; review visuale indipendente parent/Lucille ancora richiesta, non sostituita da axe.

## Limiti e stato

Draft149 e150 ancora aperte, ciascuna8checkSUCCESS al controllo 2026-11-07 23:29:00 CET; non sono state riscritte/mergeate. Integrazione basata155 necessaria per verificare insieme guard e UI; una sola nuova draft proposta con base155, non base main. Ordine solo proposto dopo review: risolvere/approvare stack152→153→154→155, quindi integrazione UI che contiene149/150; nessun merge autorizzato o eseguito. Non serve applicare149/150 due volte.

Snapshot tecnico prima del push: CI/preview della nuova draft da osservare separatamente e riportare nel riscontro/PR body, non anticipate come verdi. Nessun risultato remoto della nuova SHA inventato.

NOT RUN: intera suite E2E locale, Safari/Firefox/device reali/HTTP LAN/vecchie tab non cooperanti, prove su save reali/produzione. Nessuna promessa demo pronta. Punto1PASS nel perimetro indipendente comunicato; punto2 in review, punto3NONiniziato. Nessun mergePR/main, deploy manuale, env/settings/ads o attivazione225.


## Riproduzione

Da `apps/pivot23`, dipendenze frozen e Chromium di Playwright installati: `pnpm run test && pnpm run typecheck && pnpm run lint && pnpm run build && pnpm run test:compat:types && pnpm run test:compat:tools`. Comando E2E completo nel [manifest](ui-integration-2026-11-07/test-runs.json); source freeze/recheck e log RED/finale nella stessa directory. Raw/log/screenshot sul box. Report precedente BFCache aggiornato in questa integrazione, non modificando runtime/branch155.
