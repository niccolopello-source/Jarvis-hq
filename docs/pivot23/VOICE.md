# Voce

Regole per i testi che il giocatore legge. Non è un elenco di tutte le frasi.

## Registro

- Italiano di default, seconda persona. «Arrivi prima. Resti.» Non «Restiamo», se a parlare è la scheda del giocatore.
- Una vignetta dice una cosa. Niente slogan, niente riassunto della meccanica.
- I segnaposto (`__RIVAL__`, `$SCORE`, e gli altri) non arrivano a schermo. Se manca il dato, la frase non parte.
- I termini di gioco restano quelli già usati: overall, draft, playoff, Finals. Non si traduce a metà.
- Inglese e spagnolo, quando esistono, dicono la stessa cosa dell'italiano. Non una versione più corta e non una più epica.

## Cosa non si mostra

- La «corsa al DPOY», o qualsiasi classifica di corsa a un premio, come schermata. D-005.
- Il codice sorgente del gioco. D-011.
- Una voce tecnica: nomi di funzioni, `NaN`, seed, `age>=36`.

## Coerenza con lo stato

Una vignetta non può dire che il rivale si è ritirato se il mondo non lo ha ritirato. Non può parlare della squadra precedente dopo uno scambio, né della prima corsa a un premio già vinto. Se lo stato e la frase non coincidono, non si pubblica la frase.

## Cosa non è questo file

Un dump di tutte le stringhe non è la voce. Si rigenera dal codice quando serve un controllo. Non si incolla nel repository come seconda fonte.
