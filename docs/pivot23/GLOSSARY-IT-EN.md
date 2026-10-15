# PIVOT 23 — Glossario IT/EN (2026-10-13)

Complemento di [`COPY-STYLE-GUIDE.md`](./COPY-STYLE-GUIDE.md) e del registro [`COPY-REVIEW-IT-EN-2026-10-13.md`](./COPY-REVIEW-IT-EN-2026-10-13.md). Inglese americano, terminologia NBA. Gli id tecnici (`esordio`, `G-League`, `PG`…) non si traducono mai.

| Ambito | IT preferito | EN preferito | Alternative accettate | Vietato / ambiguo | Contesto |
|---|---|---|---|---|---|
| Ruoli | playmaker (PG), guardia (SG), ala piccola (SF), ala grande (PF), centro (C) | point guard, shooting guard, small forward, power forward, center | sigle PG/SG/SF/PF/C | EN «pivot» per C; «role» per posizione nel setup EN (usare *position*) | setup, schede, Legacy |
| Ruolo di squadra | ruolo, minuti, gerarchie | role, minutes, rotation | — | «place», «hierarchy» | narrativa |
| Draft (creazione) | Draft, round, carta | Draft, round, card | — | «scheda» (IT, ambiguo con «tab»), «three cards out of four» | 10 round, 3 carte mostrate su 4, se ne sceglie 1 |
| Scelta al Draft NBA | scelta (1ª–60ª), chiamata | pick (Pick 1–60), draft night | «selection» | «the number» da solo | `pickN`, `theCall` |
| Percorso | percorso: NCAA, Europa, G League | path: NCAA, Europe, G League | «road to the pros» (titolo) | «G-League» in prosa EN | `pathTitle`; l'id resta `G-League` |
| Valutazione | overall | overall (rating) | «OVR» nei grafici | «craft», «il mestiere» per indicare l'overall | `overallN`, `ovrCurve` |
| Crescita | progressione, crescita estiva | progression, summer development | development | «the overall moves» | |
| Picco / declino | picco (26-28 anni), calo | peak (26-28), decline | prime | «falls» per il declino | `ovrCurveCap`, `guide4Body` |
| Stagione | stagione regolare | regular season | — | — | |
| Playoff | playoff, serie al meglio delle sette | playoffs, best-of-seven series, playoff run | postseason | «playoff doors» (nome interno di `playoff-doors.ts`) | `bestOfSeven`, `playoffPath` |
| Finali | Finale / Finals NBA | the Finals, NBA Finals | — | «the Final» per l'NBA (ok solo per l'Eurolega: Final Four / Final) | `finalChampion` |
| Classifica | classifica | standings | — | «table», «ranking» | `standingsLater` |
| Albo d'oro | albo d'oro | list of champions, past champions | NBA champions | «roll of honour» (UK) | `alboNba`, `alboCap` |
| Statistiche | punti, rimbalzi, assist, palle rubate, stoppate | points, rebounds, assists, steals, blocks | PTS, REB, AST, STL, BLK; PPG/RPG/APG | IT «ASS» (vedi P07) | tabelle, `statLegend` |
| Plus/minus | plus/minus | plus-minus (+/-) | — | — | `raceNbaCap` |
| PER e avanzate | PER, defensive win shares (DWS), STL%, BLK%, DBPM | PER, defensive win shares, STL%, BLK%, DBPM | — | «vittorie difensive», «defensive wins» | DPOY: `nbaDpoyScore` |
| MVP | MVP | MVP | Most Valuable Player | — | 65 partite (58 prima della 2.15) + All-Star |
| Finals MVP | Finals MVP | Finals MVP | — | «MVP delle finali» in UI | |
| ROY | Rookie of the Year | Rookie of the Year | ROY | «miglior esordiente» in UI | solo primo anno |
| DPOY | Defensive Player of the Year | Defensive Player of the Year | DPOY | — | |
| MIP | Most Improved Player | Most Improved Player | MIP | — | salto PPG; esclusi All-NBA First, MVP, overall ≥88 |
| 6MOY | Sixth Man of the Year | Sixth Man of the Year | 6MOY | — | |
| All-NBA | primo/secondo/terzo quintetto All-NBA | All-NBA First/Second/Third Team | — | «three steps», «gradini» | `raceNbaCap` |
| Contratti | contratto, rinnovo, contratto al massimo | contract, extension, max deal | — | — | `offerExtension`, `offerMax` |
| Mercato | mercato estivo, voci di scambio, scambio | offseason market, trade rumors, trade | free agency (solo se è FA) | «market» da solo | |
| Sistema / fit | sistema, identità di squadra | system, team identity, roster fit | fit | «trade» per identità | `sys*`, `id*` |
| Minuti | minuti | minutes | playing time | — | |
| Possessi | possesso (di squadra) | possession (team possession) | — | usarlo per tocchi/film/giocate | partita, ultimo possesso |
| Tocchi | palloni, tocchi, coinvolgimento | touches, usage | the ball | «possessions» per l'uso del singolo | narrativa |
| Giocate / schemi | schema, gioco | play, set | play call | «possession» per schema | `sysHalfCourt`, story-feel |
| Video | video, sala video | film, film room, clips | tape | «possessions» per video | story-feel, summer |
| Il mestiere | lavoro, mestiere | work, job, fundamentals, know-how, the game (secondo contesto) | learn the trade | «the craft» come resa fissa | narrativa |
| Archivio | archivio delle carriere | career archive | archive | — | `archive*` |
| Carriera salvata | carriera salvata, salvataggio | saved career, save | — | «life» nel testo tecnico | `load*`, `nl*` |
| Recupero | copia di riserva, ripristino | backup copy, recovery | — | — | `loadBackedUp` |
| Ripartire | nuova vita / nuova carriera | new life / new career | — | «restart from the same card» (falso: seed nuovo) | `startNewLife` |
| Riprendere | Riprendi la carriera | Resume career | Continue | «Resume this life» | `resume` |
| Cancellazione | cancellare dal browser | delete from this browser | — | — | `nlConfirm` |
| Hall of Fame | Hall of Fame, «nella Hall» | Hall of Fame, «In the Hall» | — | — | `hof*` |
| Ritiro | ritiro, lasciare il parquet | retire, walk away | call it a career | «go down», «leave the court here» | `retire*` |

### Aggiunte 2026-10-14
| Ambito | IT preferito | EN preferito | Alternative accettate | Vietato / ambiguo | Contesto |
|---|---|---|---|---|---|
| Pesi / palestra | chili, pesi | weight, weights | pounds (lbs) | «kilos» in EN | narrativa estate |
| Mobilità | gradi di movimento | mobility, range of motion | — | «degrees» da solo | estate |
| Video | sala video, possessi della difesa | film, defensive film | clips | «defensive possessions» per il video | story-extra |
| Fine carriera | gli ultimi possessi (metafora) | what you have left | — | «the last possessions» fuori dal contesto di partita | story-late |
| Il mestiere (riposo) | la tregua del mestiere | a break from the grind | — | «the truce of the craft» | feel |
| DPOY | vittorie difensive (nota salvata) | defensive win shares (DWS) | DWS | «defensive wins» | nota premio, dpoyCap |
