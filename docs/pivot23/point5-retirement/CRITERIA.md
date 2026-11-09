# Punto 5 — ritiri plausibili: diagnosi e criteri (scritti PRIMA di implementare)

Base: HEAD PR158 `2aa316391ed950bfa83285dd28fc33af7b797cd9` (CI verde). Europe/Rome, 9 novembre 2026. Età massima 36 invariata; ENGINE_VERSION 2.24.0-beta attiva; 2.25 inattiva.

## Misura (PRIMA)
Campione riproducibile `scripts/point5/retirement-measure.mjs . OUT VERSIONE 100`: 3 percorsi × 4 difficoltà × 100 seed (970000+i·101, ruoli i%5), draft random, scelte sorteggiate, `retirement` default del simulatore (play36). 1200 carriere per versione. Analisi `scripts/point5/retirement-analyze.py`. Raw: `before-*.json.gz`, sintesi `before-summary.json`. Riferimento più ampio (48.600 carriere, 4 nov): /workspace/career-sims/REPORT.md §3.

|Metrica|2.24 (attiva)|2.25 (inattiva)|
|---|---:|---:|
|mediana / media / moda (quota)|34 / 33,30 / 34 (32,1%)|34 / 33,78 / 35 (25,2%)|
|ritiro ≤31 / ≥35 / a 36|17,5% / 19,3% / 7,5%|11,0% / 37,6% / 12,4%|
|carriere che chiudono a ≥35 con OVR finale <60 (su tutte)|8,5%|**19,6%**|
|OVR finale mediano di chi arriva a ≥35|60|59|
|quota ≥35 per picco ≤65 / 66–74 / 75–84 / 85+|14,0 / 17,7 / 21,3 / 28,6%|**34,7 / 36,6 / 40,6 / 41,8%**|
|segnale finale injury / minutes / 36|357 / 758 / 85|343 / 724 / 133|

Per difficoltà 2.25 (≥35): esordio 51,7%, pro 33,7%, allstar 33,0%, leggenda 32,0%. Per percorso: differenze ≤3pp (NCAA 36,5, Europa 36,7, G-League 39,5).

## Problema concreto
1. **2.25: i giocatori deboli restano fino a 35–36.** Il 19,6% di tutte le carriere chiude a ≥35 con OVR <60 (2.24: 8,5%), ad es. OVR48 a 35 anni con 11,6 minuti. Causa: in 2.25 la soglia minuti tardiva scende (8,5 a 33, 10 a 34) e l'uscita graduale (34–35) guarda solo calo dal picco ed età, non il livello assoluto.
2. **2.25: gradiente di longevità quasi piatto**: picco ≤65 arriva a 35+ nel 34,7%, picco 85+ nel 41,8% (+7pp). Una stella e un gregario hanno quasi la stessa durata.
3. Non sono problemi: ritiri tutti a 36 (12,4%), concentrazione (moda 25%), percorsi (≤3pp). Le stelle ritirate ≤31 (2.25: 41 carriere con picco ≥80, tutte per infortunio) sono il sistema infortuni esistente: osservate, NON toccate.
4. 2.24 (attiva) non si modifica: ogni cambio vale solo per 2.25.

## Criteri di accettazione (2.25, stesso campione 1200 + seed del gate esistente)
- A1 carriere che chiudono a ≥35 con OVR finale <60: **≤10%** (da 19,6%).
- A2 gradiente: quota ≥35 picco 85+ − picco ≤65 **≥ +15pp** (da +7pp), crescente per fascia.
- A3 forma aggregata conservata: mediana 34 complessiva e per percorso; ≤31 ≤12%; a 36 ≤15%; moda ≤35%; ≥35 complessivo 28–38%.
- A4 test esistenti invariati e verdi, incluse soglie `ovr-curve-225.stats.test.ts` (mediana 34, max 36, reach35 0,28–0,38 per percorso), unit, stats, typecheck, lint, build.
- A5 2.24 e precedenti byte-identiche: fingerprint version-gate PASS; confronto full PlayerState + envelope + RNG attivo vs HEAD158 su seed fissi 2.12–2.24; suite legacy compat 312 finali PASS vs HEAD158.
- A6 nessuna nuova draw RNG nella decisione (seedUnit deterministico), MAX_AGE 36, ENGINE_VERSION 2.24.0-beta, 2.25 inattiva.
- Se A1–A4 non sono raggiungibili insieme senza toccare altro: documentare e NON cambiare src.
