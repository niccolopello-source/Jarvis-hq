# PIVOT 23 — Audit i18n prima di ES/ZH (2026-11-09)

Base: `grokbot/retirement-plausibility` @ `13b7643` (src identico a `2aa3163`, #158). Audit fatto **prima** di modificare il codice. Esiti: PASS / FAIL / NOT RUN / HYPOTHESIS.

## 1. Infrastruttura attuale
| Tema | Stato trovato | Esito |
|---|---|---|
| Libreria | Nessuna libreria esterna. Store fatto in casa in `src/lib/pivot/i18n.ts` (`useSyncExternalStore`, `t()`, `tf()` con `{placeholder}`). | PASS (nessuna dipendenza) |
| Tipo `Lang` | `"it" \| "en" \| "es"`; `DEMO_LANGS = ["it","en"]`; `demoLang()` riduce ogni valore salvato a it/en. | da estendere |
| Scelta e salvataggio | `localStorage["pivot-lang"]`; selettore a pulsanti in home (`PivotApp.tsx` ~1210, etichette "Italiano"/"English" hardcoded). `<html lang>` e `document.title` seguono la lingua (`syncDocument`). | da estendere |
| Fallback chrome | `t(key)` → `DICT[lang][key] ?? IT[key]`: oggi il fallback è **italiano**, non inglese. | FAIL rispetto al nuovo requisito |
| Dizionari chrome | `i18n.ts`: 285 chiavi IT, 285 EN (0 buchi), ES parziale 64/285 e con testi superati (221 mancanti). `legacy-i18n.ts`: 75 chiavi IT/EN. `labels.ts`: ruoli, nazioni, attributi, round, conference, note premi. `ads/strings.ts` (6), `intro-sound/SoundToggle.tsx` (4), `DIFF_FACE` (4×3, ES già presente). | — |
| Narrativa | Il motore scrive **italiano canonico** nello stato/salvataggio. `nx(text, lang)` (narrative/index.ts) traduce al render con un catalogo gettext (chiave = sorgente italiana) con template `{0}`, segmentazione per frasi/separatori, `{0:ord}` e `{0\|one\|many}`. Catalogo EN lazy (`catalog-en.ts`, chunk separato). | PASS (architettura adatta a nuove lingue) |
| Rami `lang === "en"` | ~40 punti in `labels.ts`, `legacy-i18n.ts`, `presentation.ts`, `PivotApp.tsx`, `LegacyExperience.tsx`, `ads/strings.ts`, `SoundToggle.tsx`, `narrative/index.ts`: ogni lingua ≠ en cade sull'italiano. | da estendere |
| Numeri | `toLocaleString` con `it-IT`/`en-US` (legacy-i18n), `LOCALES` in presentation.ts (it/en/es). Molti `toFixed(1)` senza locale (punto decimale) in LeaguePanel. Nessuna data formattata (le stagioni sono "2031-32"). | HYPOTHESIS: punto decimale accettabile in zh (standard) e tollerato in es |
| Ordinali | IT `{n}ª`/`{n}°`, EN `1st`; nessuna forma es/zh. | da estendere |
| Pluralizzazione | Coppie one/many a mano (`seasonsOne/Many`, `jerseyOne/Many`, `{0\|one\|many}`). Nessun `Intl.PluralRules`. zh non ha plurale: si usa la stessa forma. | PASS con forme fisse |
| Hardcoded | `i18n-coverage.test.ts` vieta italiano hardcoded nei componenti (eccezioni elencate). Le stringhe narrative dei componenti passano da `nx()` (catalogo `en/PivotApp.ts`, `en/LeaguePanel.ts`…). | PASS |

## 2. Testo narrativo e procedurale
- Catalogo EN: **3.923 voci** (≈186k caratteri italiani), 294 identiche (nomi propri). File per modulo in `narrative/en/` (feel, summer, story-extra, story-feel, story-late, engine, data, playoff-doors, world, league, teams, legacy, voice, manual, names…).
- Copertura IT/EN statica: test `narrative.test.ts` "every narrative string in the sources has an English entry" → PASS (0 mancanti) sulla base.
- Frequenza a runtime misurata (60 carriere harness, 251.829 righe lette): 3.091 voci usate; 127 voci in tutte le 60 carriere, 706 in ≥15, 1.993 in ≥3. Coda lunga: tradurre per frequenza dà la massima copertura visibile per carattere tradotto.

## 3. Rischi per il cinese (zh-CN)
| Rischio | Stato | Esito |
|---|---|---|
| Font CJK | `--font-sans/--font-display: Figtree, -apple-system, … system-ui`. Figtree **non** è caricato (nessun `@font-face`, nessun CDN): si usa già il font di sistema. Manca una catena CJK esplicita. | da aggiungere: catena di sistema (PingFang SC, Hiragino Sans GB, Microsoft YaHei, Noto Sans CJK SC, Source Han Sans SC), nessun download |
| `letter-spacing` / `uppercase` | 47 regole in `styles.css`; il tracking largo su ideogrammi peggiora la lettura. | da neutralizzare con `:lang(zh)` |
| A capo / overflow | CJK va a capo tra caratteri; rischio opposto su etichette brevi in pulsanti stretti e sullo spagnolo (testi ~15-25% più lunghi dell'inglese). | da verificare con screenshot 390×844 e 1280×800 |
| Plurali / ordinali | zh senza plurale; ordinali "第N"; scelta al draft "第N顺位". | da implementare |
| Nomi | Nomi di giocatori, allenatori e club restano in alfabeto latino (nessuna traslitterazione inventata). | scelta documentata |
| Dipendenze esterne | Nessun Google Fonts / CDN. Esterne: AdSense/Funding Choices (`googlesyndication.com`, `fundingchoicesmessages.google.com`, OFF di default), link Instagram, `@vercel/analytics` (script same-origin `/_vercel/insights`). | HYPOTHESIS: Google e Instagram sono bloccati in Cina continentale; l'accessibilità di Vercel/`www.pivot23.com` dalla Cina non è verificata; nessuna ICP. **Nessuna modifica a CSP, domini o variabili.** |

## 4. Altri rischi trovati
- `engine.ts:659` registra `s.lang = getLang()` nello stato quando nasce una carriera (campo informativo, non letto dal motore). Il test esistente lo esclude dal confronto; con zh il valore salvato diventa `"zh"` (tipo da allargare). La lingua non entra nel fingerprint né nell'RNG. HYPOTHESIS da verificare con test a seed fissi.
- `awardLabel()` è chiamato dal motore (`data.ts:239`): deve restare indipendente dalla lingua. Per lo zh serve una funzione **solo display** separata.
