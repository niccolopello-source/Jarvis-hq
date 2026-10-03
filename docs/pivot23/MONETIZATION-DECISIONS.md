# Decisioni che spettano a Pello

Stato: 2026-10-03. Nessuna riga sotto è accettata solo perché è scritta. Le decisioni già accettate stanno in [DECISIONS.md](../memory/DECISIONS.md). P-006 e P-007 restano proposte.

Questo file non le promuove. Chiede un sì o un no.

| ID | Domanda | Alternativa A | Alternativa B | Vantaggio di A | Rischio di A | Dipende da |
|---|---|---|---|---|---|---|
| M-001 | La carriera ospite resta intera e gratuita, senza login? | Sì. È il vincolo di questo disegno | Si chiede un account per salvare | Si gioca subito, come oggi | Nessun ricavo dall'avvio. Non è una stima | nessuna |
| M-002 | `TOKEN_COSTS.careerStart` resta non collegato e, in un secondo momento, si toglie? | Non si collega. L'avvio non costa un token | Si usa come costo di avvio | Non contraddice M-001 | Il simbolo resta nel sorgente e qualcuno può accenderlo per sbaglio | M-001 |
| M-003 | Il primo eventuale pagamento è solo una cornice o un tema? | Sì, fuori dal motore | Un pacchetto che aggiunge leghe o scelte | Non tocca draft, overall, infortuni, premi | Ricavo non misurato. Il listino non esiste | testo legale, listino |
| M-004 | Si accende la pubblicità nella demo? | No | Uno spazio fuori dalla carta di scelta, dopo il consenso | Nessun terzo, nessun consenso in più ora | Nessun ricavo pubblicitario. Non è una stima | legale, e un no ai minori non risolto |
| M-005 | La carta firmata precede qualsiasi NFT? | Sì. Prima il server rigioca seed e scelte. P-006 | Si progetta il wallet insieme | La carta locale oggi si può riscrivere | Server da mantenere | P-006 accettato, legale |
| M-006 | La copia cloud è un gesto esplicito, carriera per carriera? | Sì. Senza segno non si copia | Si copia tutto al primo login | Nessuna carriera parte da sola | Un passo in più | account spento, prova di conflitto |
| M-007 | Analytics di prodotto e diagnostica remota nascono spente, senza SDK? | Sì. Prima un conteggio proprio, se mai | Un SDK subito | Niente profilo e niente fornitore | I numeri restano assenti finché non c'è un sì | legale |
| M-008 | `screen_opened` si misura? | Solo sulle schermate che stiamo cambiando, e solo dopo M-007 | Su ogni gesto | Meno dati | Si può trasformare in una cronologia | M-007 |
| M-009 | La distribuzione commerciale tiene i nomi NBA? | Non si decide qui. D-015 chiede il legale prima | Si rinominano le franchigie | I nomi restano, se il legale lo consente | Marchio | legale. Non è un task di questo branch |
| M-010 | Si fa un controllo dell'età prima di un account o di un pagamento? | Sì, se il legale lo chiede | Si tratta tutti come adulti | Adatto a un pubblico misto | Attrito, e va progettato senza data di nascita in archivio se si può | legale |

## Già deciso, non riaperto da questo file

- D-014: in demo il selettore è italiano e inglese. Lo spagnolo non si accende per vendere.
- D-015: revisione legale prima del commercio. I nomi non si cambiano in questa fase.
- Il motore, `SAVE_VERSION` 11 e `LIVE_SAVE_VERSION` 2 non si toccano per questa proposta.

## Cosa non chiedere di nuovo

Non serve un'altra approvazione per lasciare i flag a `false`. Sono già `false`. Serve un'approvazione per portarli a `true`.
