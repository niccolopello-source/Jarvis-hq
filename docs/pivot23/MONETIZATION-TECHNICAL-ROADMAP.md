# Roadmap tecnica

Stato: ordine di lavoro, 2026-10-03. Nessun gradino dopo il documento è autorizzato da questo file.

Il branch `feature/monetization-foundation` è solo documentazione. Il branch `grok/demo-visual-polish` non va unito qui e non va bloccato da questo lavoro.

## Contratti, non pacchetti

Restano concetti. Non si aggiunge una dipendenza per nominarli. Il core è `apps/pivot23` con React e Vite. Un provider è un componente che, se manca, rende i figli e basta.

| Concetto | Oggi | Contratto futuro | Se è spento |
|---|---|---|---|
| Core | acceso | non importa i moduli sotto | resta il gioco |
| `AccountProvider` | assente. `FLAGS.account` è `false` | «sessione o nessuna» | si gioca |
| `SaveSyncProvider` | assente. Scrive solo `saveLive` | copia su gesto, conflitto esplicito | il salvataggio locale resta |
| `ConsentManager` | assente | necessari spiegati; analytics e marketing spenti | nessuna schermata in più nella demo |
| `AnalyticsProvider` | assente | eventi della specifica, buffer spento | nessun invio |
| `EntitlementProvider` | assente | un diritto di presentazione, mai un attributo sportivo | la carta normale resta |
| `PaymentProvider` | assente | ricevuta verso l'entitlement, mai verso il motore | niente prezzo |
| `AdProvider` | assente | uno spazio fuori dalla scelta, o nessuno | niente annuncio |

`TOKEN_COSTS` non diventa un'interfaccia. Resta non importato.

## Fasi

| Fase | Si fa | Non si fa | Dipende da | Prova |
|---|---|---|---|---|
| 0. Ora | questi documenti | codice di rete, SDK, login, cassa | nessuna | il diff non tocca `apps/pivot23/src` |
| 1. Demo | il filone di stabilità, sull'altro branch | account | Pello sulla demo | non è questo branch |
| 2. Testo | informativa e pagina sullo storage, IT e EN, scritte fuori da qui | accendere un flag | legale | il gioco non mostra un banner vuoto |
| 3. Account spento | flag ancora `false`, ospite identico, prova che un errore del modulo non cancella `pivot-v2-save` | database di produzione | fase 2 e un sì di Pello | test con il provider assente |
| 4. Copia | stesso `careerId`, conflitto visibile, export | migrazione silenziosa | fase 3 | due salvataggi con lo stesso id restano due |
| 5. Conteggio | eventi senza terze parti, consenso spento di default | fingerprint, replay | fase 2 | un rifiuto non chiama la rete |
| 6. Un cosmetico | una cornice, listino già firmato | overall, draft, minuti | fase 2 e il listino | il motore non legge il prezzo |
| 7. Firma | il server rigioca seed e scelte | wallet, NFT | P-006 accettato | una carta riscritta in locale non passa |

## Test di accettazione, per quando ci sarà codice

Oggi sono criteri, non una suite eseguita sul commercio. Il commercio non ha codice.

- Si apre una carriera senza account.
- Un modulo commerciale assente non lancia eccezioni nel render.
- Un acquisto, quando esisterà un test finto, non cambia overall.
- Due carriere con lo stesso id non si fondono.
- Il rifiuto del consenso è persistente e reversibile.
- Nessuna chiave sta nel sorgente.

## Isolamento

Non unire questo branch su `main` insieme al lavoro di demo, e non unirlo affatto senza un sì. Non contiene fix di gioco. Se la demo cambia il salvataggio, questo documento va riletto: la versione viva è 2 e una versione diversa si scarta.
