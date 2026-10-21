# Ritiri 29–32 in Leggenda — motore 2.20.0-beta (proposta, branch `lucille/legend-retirements-2.20`)

Richiesta di Pello (19 ott 2026): portare i ritiri con ultima stagione a 29–32 anni in Leggenda nel target 300–340 su 1000.
Lavoro su branch con version gate, **nessun merge senza OK esplicito del proprietario**.

## Diagnosi (main `d80d1dc`, motore 2.19.0-beta)

- Leggenda: 280/1000 sui seed 900000–900999 (Wilson 95% 253–309), misura di Jarvis riprodotta identica.
- Le barre infortunio di Leggenda sono **sature**: tutte le 720 carriere che arrivano a 33+ hanno `injuryDrag` = 0 a 30, 31 e 32 anni.
  Nessuna barra infortunio, per quanto bassa, può aggiungere uscite (abbassare la soglia dei 30 sposta solo uscite da 30 a 29).

## Meccanismo (solo carriere Leggenda create da 2.20.0)

`TUNING.minutesRetireBars220.leggenda = { 31: 13.1, 32: 11.9 }`: a 31 e 32 anni, se i minuti a partita dell'ultima stagione
sono ≤ la barra, la carriera si chiude (causa `"minutes"`, come la regola già in produzione dei 11,5 minuti dai 33).
È la stessa regola del "ruolo che svanisce", anticipata di uno-due anni solo in Leggenda. Infortuni, RNG, salvataggi e
tutte le altre difficoltà non cambiano. Dai 33 resta la barra 11,5. Nessuna estrazione RNG in più.

Gate: `LEGEND_RETIRE_SINCE = "2.20.0"`, `minutesRetireBarOf()` restituisce `undefined` per ogni carriera < 2.20 e per
ogni difficoltà diversa da Leggenda. `ENGINE_VERSION` → `2.20.0-beta`. `SAVE_VERSION` invariato (11).

## Misure (1000 carriere per difficoltà, scelte automatiche, ultima stagione a 29–32)

| Seed | Leggenda main 2.19 | Leggenda 2.20 | Esordio / Pro / All-Star |
|---|---|---|---|
| 900000–900999 (Jarvis) | 280 [253–309] | **303 [275–332]** | 14 / 300 / 315, identici carriera per carriera |
| 91000 + 13·i (stats test) | 319 [291–349] | **337 [308–367]** | 12 / 322 / 320, identici |
| 500000–500999 (fuori campione) | 285 [258–314] | **313 [285–342]** | 9 / 286 / 320, identici |
| Totale 3000 | 294,7/1000 | **317,7/1000 [301–335]** | — |

Le barre sono calibrate sui primi due insiemi (2000 carriere) puntando al centro della banda; il terzo è una verifica
fuori campione. I minuti sono quantizzati a 0,1, quindi la risposta è a scalini: 13,1/11,9 è il punto che tiene entrambi
gli insiemi di calibrazione nella banda.

## Prove di invarianza

- `version-gate.test.ts`: 640 carriere 2.12–2.15 (fixture esistente, `main` @ `cba5a29`) e 640 nuove carriere 2.16–2.19
  (`fixtures/version-gate-fp-219.json`, generata su `main` @ `d80d1dc` con `scripts/version-gate-fingerprints-219.ts`): identiche.
- Stato completo (sha256 di tutto il `PlayerState`) di 4800 carriere forzate a 2.12–2.19 × 4 difficoltà × seed 1–150: 0 differenze tra main e branch.
- Carriere nuove (900000–900999): Esordio, Pro, All-Star 3000/3000 identiche a main (tolta solo la stringa `engineVersion`);
  Leggenda 970 identiche, 30 finiscono prima con storia stagione per stagione e scelte identiche a main fino al ritiro.
- Golden di `engine-invariants.test.ts` invariati (il seed 3, Leggenda, non cambia).
