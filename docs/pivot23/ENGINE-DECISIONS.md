# Decisioni del 12 ottobre — motore 2.14.0-beta

Autorizzate da Niccolò. Le carriere nuove nascono su `2.14.0-beta`. Un save 2.13 o più vecchio tiene le regole con cui è nato. Nessun merge, nessun deploy.

## 1. Ritiro 29–32 — accettato

La tabella di Lucille, già misurata su 4.000 Pro: barre infortunio `30 → 5.0`, `31 → 3.6`, `32 → 3.2`. Da 33 la regola di sempre. Non ho cambiato i numeri. Dettaglio in `A2-RETIREMENT-SPREAD.md`. La #78 è la stessa proposta; questo branch la include.

## 2. Il 36 accettato si gioca

Se il diario dice «Gioca a 36 anni», quella stagione viene simulata anche se l'estate è già un infortunio. Poi la carriera chiude. I cinque seed che prima la perdevano (4017, 23017, 49017, 65017, 74017) ora hanno la riga a 36. Un save 2.13 non viene riaperto. La nota nel diario resta, per un caso che sulle carriere nuove non dovrebbe più capitare.

## 3. Potenza delle franchigie — nessuna modifica

`regress` resta. OKC al 15,3% nei primi cinque anni resta un fatto, non un bug da chiudere oggi. `teams.ts` non è stato toccato.

## 4. Premi — tassi che ho fissato io

Il ROY era circa il 33% su tutte le difficoltà, perché il livello non entrava nel punteggio. Ora entra solo sul giocatore. Campione: 150–160 carriere per livello, seed G4.

| | Esordio | Pro | All-Star | Leggenda |
|---|---|---|---|---|
| ROY, % carriere | 45 | 27 | 15 | 9 |
| MVP, premi / 1000 | 67 | 25 | 6 | 0 su 160 |
| DPOY | vedi sotto | vedi sotto | 0 su 120 | 0 su 120 |

ROY è il numero solido. Il MVP Pro è 25/1000 (prima era circa 9). Esordio resta la difficoltà in cui un MVP si vede. All-Star ne ha avuti 6/1000 in 160 carriere: è un campione piccolo. Leggenda, in 160 carriere, zero MVP.

Il DPOY di Leggenda e All-Star resta quasi chiuso. Il motivo non è una soglia dimenticata: in 40 carriere Leggenda la stagione più difensiva è 0,8 palle rubate e 1,1 stoppate. Ho abbassato la soglia di conteggio (All-Star ×0,78, Leggenda ×0,62) e ho aggiunto un aiuto sul punteggio. In 120 carriere non è bastato a produrre un premio. Non ho abbassato ancora: a quel punto il premio non sarebbe più il box. Pro ed Esordio tengono la soglia NBA (×1). Il campione storico Pro è 55 DPOY / 1000; non l'ho rimisurato su 4.000 dopo questa soglia.

Lo streak DPOY nei campioni è rimasto sotto 5.

## 5. Bust di sviluppo — non acceso

La formula larga di Lucille (#81) alza i bust sopra il 15% e taglia All-Star e MVP di circa un quinto, e quasi non crea bust da potenziale ≥ 85. Ne ho provata una più stretta, solo sopra potenziale 86, solo se le scelte restano sotto una barra. Su 200 Pro: zero bust di laboratorio, e i premi scendono lo stesso (MVP 80→50, DPOY 75→30 su quel campione).

Resta spenta (`TUNING.bust = "current"`). Il codice c'è, gated su 2.14, e un test controlla che accendendola il drag colpisca solo un tetto alto rimasto indietro. Per un bust vero serve marcare le scelte rischiose. Non l'ho inventato.

## Cosa non è stato rifatto

I 7.000 G4. I numeri della tabella premi sono il campione scritto sopra, non un intervallo al 95%. La suite e2e completa non è stata rieseguita su questo branch.
