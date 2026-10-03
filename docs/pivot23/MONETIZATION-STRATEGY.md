# Strategia di monetizzazione

Stato: proposta, 2026-10-03. Non è implementata. Non è un listino e non è una previsione di ricavo.

Questo file non sostituisce [PHASE2-COMMERCIAL-DESIGN.md](PHASE2-COMMERCIAL-DESIGN.md). Quel documento resta la proposta unica del 2 ottobre. Qui si isolano le opzioni, i divieti e i dati che mancano per scegliere.

Branch di lavoro: `feature/monetization-foundation`, partito da `main` `5d00647`. Non contiene il branch di stabilizzazione `grok/demo-visual-polish`.

## Fatti verificati nel codice

- Il gioco in `apps/pivot23` parte senza account, database o provider di pagamento.
- `FLAGS.account`, `FLAGS.tokens` e `FLAGS.nft` sono `false` in [flags.ts](../../apps/pivot23/src/lib/pivot/flags.ts).
- `TOKEN_COSTS` esiste nello stesso file (`careerStart: 1`, `nftMint: 3`) e non è importato da nessun altro modulo. Non è un acquisto. Se qualcuno lo collegasse all'avvio, contraddirebbe la carriera ospite gratuita. Non va acceso.
- Il salvataggio vive nel browser: `pivot-v2-save`, `pivot-v2-archive`, più chiavi di cortesia. Nessuna chiamata di rete di gioco è richiesta per finire una carriera.
- P-006 e P-007 in [DECISIONS.md](../memory/DECISIONS.md) sono proposte, non decisioni del proprietario. D-015 chiede una revisione legale prima di una distribuzione commerciale, e non rinomina le franchigie.

## Divieto

Nessun acquisto può alzare overall, abilità, probabilità di draft, probabilità di infortunio, premi, titoli o la qualità della carriera. Niente pay-to-win. Niente attesa forzata, energia o scelta bloccata dietro un pagamento. L'ospite resta una partita intera.

## Opzioni

Nessuna è scelta. I prezzi non ci sono perché non sono stati decisi. Conversione, eCPM e volumi non si inventano.

| Opzione | Valore per chi gioca | Cosa servirebbe | Costo di esercizio | Manutenzione | Dipendenze | Rischio | Per procedere |
|---|---|---|---|---|---|---|---|
| Base gratuita | Si gioca subito, come oggi | niente | hosting già usato. La fattura non è in questo repo | bassa | nessuna | nessun ricavo. È un fatto, non una stima | è lo stato attuale |
| Pacchetto una tantum, dopo la carriera gratuita | Una presentazione in più, non una carriera migliore | catalogo, ripristino acquisti, prova che il motore non legge il prezzo | un gestore pagamenti e la revisione dei testi | media: ricevute, rimborsi, store | Apple, Google o un checkout web. Da scegliere | frode, rimborsi, età, IVA | listino approvato e testo legale |
| Cornice e tema della Career Card | La carta già conclusa si vede meglio | un campo di presentazione fuori da `PlayerState` sportivo | lo stesso gestore, catalogo piccolo | bassa se i temi sono pochi | lo stesso checkout | un tema che sembri un vantaggio sportivo | il tema non entra nel calcolo |
| Archivio presentato meglio | Si rilegge la propria storia | viste sull'archivio locale già esistente | può restare locale e gratuito, oppure essere il pacchetto | bassa | nessuna, se resta sul dispositivo | tagliare l'archivio attuale per venderlo | l'archivio ospite resta leggibile |
| Annuncio fuori dalla scelta | Uno spazio che non copre la carta decisionale | inventario, consenso marketing, un posto fisso fuori dal momento della scelta | un fornitore pubblicitario | alta: policy, blocchi, reclami | SDK o tag di un terzo | pressione, minori, consenso, dati | consenso separato e niente annuncio sulla decisione |
| Career Card firmata dal server | Una copia che il telefono non può riscrivere da solo | il server rigioca seed e lista scelte e firma. P-006 | un server e la coda di verifica | alta | hosting, chiave di firma fuori dal client | la carta locale oggi si può riscrivere. Non è una prova | P-006 accettato e la firma provata |
| NFT o wallet | Non definito. Non è in questo disegno | un'altra approvazione, dopo la firma | non stimato | alta | chain, wallet, custodia | prodotto finanziario, minori, marchi | divieto finché P-006 non è fatto e un legale non ha scritto |

Un video premio che regala overall o minuti è escluso. Un video che regala solo una cornice resta nell'opzione annuncio, con lo stesso consenso, e non è raccomandato per la prima accensione: aggiunge pressione senza un pubblico misurato.

## Dati che servono prima di un prezzo

Non sono nel repository. Senza questi non si sceglie un modello a pagamento.

- quante carriere arrivano alla chiusura, sul build pubblico, senza identificare la persona
- quante riprendono il giorno dopo
- quanti dispositivi sono telefono
- il costo mensile dell'hosting attuale
- il costo di un legale e, se si accende un server, il costo di quel server
- se il proprietario vuole un acquisto sul web, su App Store, o su entrambi

## Criterio di stop

Si ferma prima del codice di pagamento se manca uno di questi: testo legale approvato, divieto pay-to-win scritto nel contratto del modulo, ospite ancora completo, listino firmato da Pello, nessun segreto nel client.
