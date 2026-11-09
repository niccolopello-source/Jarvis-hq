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
