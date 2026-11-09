# Punto 5 — esito: nessuna modifica a src (criteri non raggiunti in modo robusto)

Europe/Rome, 9 novembre 2026. Criteri: CRITERIA.md, committati PRIMA di ogni prova (7be7925). `apps/pivot23/src` di questo branch = HEAD158 `2aa3163` (diff vuoto). ENGINE_VERSION 2.24.0-beta, max 36, 2.25 inattiva.

## Leva candidata provata (solo 2.25, NON applicata)
`candidate-not-applied/candidate-lever.patch`: in `careerEndingSignal`, solo `usesOvrCurve225`, deterministica (`seedUnit`, nessuna draw):
- uscita "livello" da 34: lean = (weakOvr − OVR)·weakW contro seedUnit(seed, 25000+età);
- coda stelle a 34–35: il lean decadimento/età esistente si riduce di (OVR − starOvr)·starW.
Parametri finali provati: levelExitFrom34, weakOvr60, weakW0,06, starOvr65, starW0,05. 2.24 provata byte-identica sul campione 1200 (incluso RNG finale) — PASS solo per quel campione; fingerprint/legacy312 NOT RUN perché la patch non è stata adottata.

## Risultati (2.25; campione di tuning 970000, holdout 990000 e 760000)
|Criterio|prima (970000)|candidata 970000|holdout 990000|holdout 760000 (test stats candidato, 50/cella)|
|---|---:|---:|---:|---:|
|A1 ≥35 con OVR finale <60 (≤10%)|19,6%|9,3% PASS|10,0% PASS al limite|**10,7% FAIL**|
|A2 ≥35 picco85+ − ≤65 (≥15pp)|+7pp|+51pp PASS|+51pp PASS|+47pp PASS|
|A3 mediana 34 (tutti/percorso)|34|34 PASS|34; NCAA 33,5 **FAIL**|n.d.|
|A3 a 36 (≤15%)|12,4%|14,3% PASS|**16,0% FAIL**|n.d.|
|A3 ≤31 / moda / ≥35|11,0% / 25% / 37,6%|11,0% / 30% / 31,1% PASS|11,8% / 30% / 30,2% PASS|n.d.|
|A4 gate ovr-curve-225 (mediana34; reach35 0,28–0,38)|34; 0,30–0,32|34; 0,289–0,318 PASS|stessi seed del gate|stessi seed del gate|

Holdout 990000 PRIMA: A1 16,8%, a 36 13,5%, gradiente +3pp: il problema è confermato anche fuori dal campione di tuning (PASS della diagnosi).

Sweep (`scripts/point5/lever-sweep.mjs`, 15 combinazioni; 9 provate su tutti e tre i set di seed): le leve sono in conflitto con i vincoli esistenti.
- Uscita deboli più forte o da 33/34 → A1 e gradiente OK, ma mediana scende a 33 o reach35 < 0,28 nel gate esistente (FAIL A4; la soglia NON si abbassa).
- Compensare con coda stelle più lunga → gate OK ma quota a 36 sale a 16–22% (FAIL A3) e A1 resta ~10–11% su 760000.
- Uscita deboli solo a 35 → A1 4–11%; con coda stelle debole reach35 del gate 0,22–0,26 (FAIL A4), con coda forte a 36 17–22% (FAIL A3).
Nessuna combinazione provata supera A1–A4 su tutti e tre i set (non è una prova che non esista). Per la regola scritta in CRITERIA.md: documentato, src NON modificato.

## Conclusione
- Problema 2.25 reale e misurato (HYPOTHESIS sulla causa, misura PASS): troppi deboli a 35–36 (17–20%), longevità quasi indipendente dal livello (+3/+7pp).
- Una leva a due parametri lo corregge in direzione (gradiente +47/+51pp) ma non entra insieme nelle soglie A1/A3 e nel gate esistente in modo robusto. Adottarla significherebbe tarare sul campione (overfitting) o allentare criteri/soglie: decisione di prodotto per Pello, NON presa qui.
- Opzioni per decisione separata: (a) accettare a 36 ≤18% oppure A1 ≤12%; (b) leva minuti/contratto (FA per OVR) invece del solo segnale di fine carriera, intervento più ampio; (c) rivedere `lateMinutesBar` 2.25 (8,5/10), causa probabile dei deboli che restano.
- 2.24 attiva: invariata. Le stelle ritirate ≤31 per infortunio (sistema esistente) non sono toccate.

## Riproduzione
Da apps/pivot23: `node --import=tsx scripts/point5/retirement-measure.mjs . OUT.json 2.25.0 100 [970000|990000]`, `python3 scripts/point5/retirement-analyze.py OUT.json`, `node --import=tsx scripts/point5/gate-seeds.mjs .`, `APP_ROOT=. SB=970000 node --import=tsx scripts/point5/lever-sweep.mjs '{"weakOvr":60,"weakW":0.06,"starOvr":65,"starW":0.05}'`. La patch candidata si applica con `git apply` solo per review.

## Indagine `lateMinutesBar` 2.25 (scelta di Pello, 9 novembre 2026 pomeriggio, Europe/Rome)
Ipotesi: la barra minuti di fine carriera 2.25 tiene in vita i deboli fino a 35–36 e appiattisce il gradiente. **Esito: FAIL** (non è la causa). `src` invariato.

### Definizione e punti d'uso
- `apps/pivot23/src/lib/pivot/tuning.ts:150-151`: `ovrCurve225.lateMinutesBar = {33: 8.5, 34: 10}` (2.24 e precedenti: 11,5 a ogni età da 33).
- `apps/pivot23/src/lib/pivot/peak.ts:72-74` (`careerEndingSignal`, ramo età ≥33): `lateMin = usesOvrCurve225(s) ? (lateMinutesBar[s.age] ?? 11.5) : 11.5`; uscita "minutes" se `lastSeason.min <= lateMin`. Unico punto d'uso (grep su src). Da lì passa in `isCareerOver` (peak.ts:100) e `shouldOfferExtraYear` (peak.ts:113).
- Minuti di stagione: `engine.ts:1931-1941` (`simulateRegularSeasonInner`, da riga 1897) li limita a **minimo 11,5** in tre clamp successivi (`clamp(..., 11.5, 37.6)`). Formula `17.2 + (OVR − 62)·0.58 + motor·0.032`, × difficoltà × vetCut (≥0,74 da 33) × fiducia × morale, poi media 0,72/0,28 con l'anno prima.

### Meccanismo (perché non può essere la causa)
- Con il pavimento a 11,5, le barre 2.25 8,5 (33) e 10 (34) sono **irraggiungibili**: in 2.25 la barra minuti agisce solo a 35–36 (default 11,5). Ma anche la barra 2.24 (11,5) scatta solo quando i minuti toccano esattamente il pavimento, cosa rara: stagioni ≤11,5 a 32/33/34/35 anni nel campione 970000 = 1/2/11/18 su 1068/995/721/451 (2.25) e 0/0/2/1 (2.24).
- I deboli che restano a 35+ con OVR<60 giocano ancora 12–13 minuti (mediana ultimo anno 12,6; p10 11,5): sono sopra ogni barra ≤11,5. Il pavimento 11,5 e la formula lineare danno a un OVR 55–60 quasi gli stessi minuti di un OVR 62–65: la regola minuti non distingue il livello → gradiente debole. L'uscita graduale 34–35 (peak.ts:60-65) guarda il calo dal PROPRIO picco e l'età, non il livello assoluto: altro motivo del gradiente piatto (HYPOTHESIS, vedi sotto).

### Esperimento controllato (solo harness `scripts/point5/minutes-bar-experiment.mjs`, override in memoria, stessi seed)
Varianti: `orig` (2.25 com'è) contro `bar224` (`lateMinutesBar: {}` → 11,5 a 33/34, come 2.24). Identità: su 4950 carriere (3 set × 1200 + gate 1350) **28 differiscono** nello stato, 4 cambiano età di ritiro (34→33); nessuna è un debole a 35+.

|Set|Variante|A1 (≤10%)|gradiente 85+−≤65 (≥+15pp)|mediana (tutti/percorsi)|a 36 (≤15%)|≤31|moda|≥35|gate ovr-curve mediana / reach35 (≥0,28)|
|---|---|---:|---:|---|---:|---:|---|---:|---|
|970000|orig|19,6% FAIL|+7,1pp FAIL|34 / 34·34·34|12,4%|11,0%|35 (25%)|37,6%|34·34·34 / 0,324·0,322·0,298 PASS|
|970000|bar224|19,6% FAIL|+7,1pp FAIL|34 / 34·34·34|12,4%|11,0%|35 (25%)|37,6%|identico PASS|
|990000|orig|16,8% FAIL|+3,2pp FAIL|34 / 34·34·34|13,5%|11,8%|33 (28%)|31,9%|come sopra|
|990000|bar224|16,8% FAIL|+3,2pp FAIL|34 / 34·34·34|13,5%|11,8%|33 (28%)|31,9%|come sopra|
|760000|orig|15,9% FAIL|−9,7pp FAIL|34 / 34·34·34|11,3%|9,4%|33 (28%)|32,2%|come sopra|
|760000|bar224|15,9% FAIL|−9,7pp FAIL|34 / 34·34·34|11,3%|9,4%|33 (28%)|32,2%|come sopra|

Ripristinare la barra 2.24 non cambia A1–A3 né il gate (differenze < 0,1pp): **ipotesi FAIL**.

Controlli diagnostici (non proposti, solo per capire; tutti FAIL):
- Barra sopra il pavimento (`35:13,5`; `34:13,35:13`; `33:12,5,34:13,35:13,5`): A1 12,1–15,2% su tutti i set (FAIL) e gate reach35 0,269–0,298 (NCAA o G-League <0,28, FAIL; a volte mediana 33). Alzare la barra minuti colpisce anche giocatori medi a minuti bassi, non solo i deboli.
- Leve uscita graduale riportate a 2.24 (`exitDeclineW 0,03, exitAgeW 0,04, exitAgeBonus{35:0,3}`): A1 10,2/13,5/10,7% e gate mediana 33, reach35 0,19–0,20 (FAIL). È il fattore che sposta di più A1 (−9pp sul set di tuning), ma rompe il gate: HYPOTHESIS che la differenza 2.24↔2.25 venga soprattutto da qui (insieme a curva/pavimento potenziale 2.25), non dalla barra minuti.
- `lateBarScale` 1 (barre infortunio 2.24 da 31): A1 invariato (19,4/16,8/15,4%), ≤31 sale a 15,8–18,8% (FAIL).
JSON completi in `minutes-bar/` (una riga per variante × set).

### Decisione
La barra minuti 2.25 non è la causa: nessuna correzione progettata, `src` non toccato, nessun test cambiato. 2.24 invariata per costruzione (diff src vuoto vs 2aa3163). Possibili prossimi passi per una decisione separata (non iniziati): minuti dipendenti dal livello a 33+ (pavimento 11,5 per età/OVR) o uscita per livello assoluto; entrambi interagiscono con il gate `ovr-curve-225.stats` (mediana 34, reach35 ≥0,28), la soglia non si abbassa.
