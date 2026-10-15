> ⚠️ **BOZZA / DRAFT.** Testo da far verificare a un legale e approvare da Pello. Non applicato al codice: `i18n.ts` e `narrative/en/*` non sono stati toccati (PR #93 aperta).

# Riscrittura del messaggio "nessun tracciamento"

## Stringa attuale — NOT FOUND
Ricerca su main `db64c10` (`apps/pivot23/src`, incl. `src/lib/pivot/i18n.ts` e `narrative/`) per "tracciamento", "traccia", "tracking", "tracker", "analytics", "cookie", "privacy": **nessuna stringa "nessun tracciamento" trovata nel codice.** Le frasi esistenti sulla memoria locale sono, ad esempio:
- `i18n.ts:92` `storageOff`: "Questo browser non permette di salvare. La carriera resta solo finché questa scheda è aperta."
- `i18n.ts:230` `crashSetAsideDetail`: "Una copia esatta resta salvata in questo browser."
Nessuna di queste afferma l'assenza di tracciamento. **DA VERIFICARE**: la frase potrebbe essere nella PR #93, in un altro branch, nel sito/README o in materiale di comunicazione. Lucille/Pello: indicare dove si trova.

## Proposta (da usare quando la pubblicità è attiva)
Chiave suggerita: `privacyNote` (nuova, da aggiungere dopo la chiusura di #93).

**IT**
> Niente account: le tue carriere restano solo in questo browser e non le riceviamo. Su computer desktop mostriamo pubblicità Google non personalizzata, solo se acconsenti; anche così Google usa cookie per limitare gli annunci ripetuti e prevenire frodi. Su telefono e tablet nessuna pubblicità e nessun tracker. [Preferenze cookie] · [Privacy]

**EN**
> No account: your careers stay only in this browser and we never receive them. On desktop we show non-personalized Google ads, only if you agree; even then Google uses cookies to limit repeated ads and prevent fraud. On phones and tablets, no ads and no trackers. [Cookie preferences] · [Privacy]

Variante breve (mobile / ads OFF): IT "Niente account, niente pubblicità, niente tracker: tutto resta in questo browser." · EN "No account, no ads, no trackers: everything stays in this browser."
Nota: la variante breve è vera solo dove gli annunci non si caricano.
