# Poki e CrazyGames / Poki and CrazyGames
> **BOZZA / DRAFT** — Grok Bot, 2026-10-15, base `e7cc321`. Solo preparazione, nessuna iscrizione o attivazione. Preparation only, no sign-up. Decisioni / decisions: Pello.

Fonti ufficiali lette il 2026-10-15. I termini reali dipendono dal contratto individuale: tutto ciò che non è citato da una fonte è **NOT VERIFIED**.

## Poki
| Tema | Cosa dicono le fonti | Fonte |
|---|---|---|
| Tipi di accordo | Web Exclusive (preferito) o Non-Exclusive | [deal types](https://developers.poki.com/guide/revenue-deal-types) |
| Esclusiva | Sul web aperto il gioco è pubblicato **solo su Poki**; Steam, app store e console esclusi dalla clausola; durata di default 5 anni (indicativa) | idem |
| Ricavi | Ai giocatori portati dallo sviluppatore spetta tutto; su quelli portati da Poki una quota (la pagina precedente indicava 50%) — "indicativo, i termini reali sono nel contratto" | idem · [sdk.poki.com/deals](https://sdk.poki.com/deals) |
| Non-exclusive | Licenza una tantum, nessuna revenue share | idem |
| Monetizzazione | Solo annunci via Poki SDK (`commercialBreak`, `rewardedBreak`); niente sistemi ads di terzi, niente acquisti in-app | [monetization](https://developers.poki.com/guide/how-monetization-works) |
| Costi | Poki for Developers gratuito; nessun pagamento durante i test | [T&C 2024-03-13 (PDF)](https://app.poki.dev/2024.03.13_Terms_and_Conditions_Poki_for_Developers.pdf) |
| Pagamenti | bonifico o PayPal | [payouts](https://developers.poki.com/guide/payouts-billing) |

**Impatto sull'indipendenza:** l'esclusiva web sembra incompatibile con continuare a servire il gioco su www.pivot23.com (sito web aperto) — **da chiarire per iscritto con Poki** prima di qualsiasi decisione. Richiede inoltre di togliere AdSense dalla build Poki.

## CrazyGames
| Tema | Cosa dicono le fonti | Fonte |
|---|---|---|
| Licenza | Non esclusiva di default | [Developer Terms 2025-08-18 (PDF)](https://files.crazygames.com/documents/developer_terms_20250818.pdf) art. 3.1 |
| Esclusiva opzionale | +50% compenso se esclusivo tra i siti di browser game per 2 mesi dopo il Full Launch e ospitato da CrazyGames (Steam/app store esclusi) | art. 5.5 |
| Condizioni per il compenso | nessun branding di altri portali; SDK CrazyGames integrato; **nessun annuncio diverso da quelli dell'SDK**; originalità | art. 5.3 |
| Importo | calcolato mensilmente su traffico e performance annunci; **nessuna percentuale pubblica** trovata | art. 5.4 |
| Lancio | Basic Launch 7–21 giorni senza monetizzazione, poi Full Launch a discrezione di CrazyGames | [docs](https://docs.crazygames.com/) |
| Durata | 1 anno dal Full Launch, rinnovo automatico, disdetta 1 mese prima | art. 9.1 |
| Pagamenti | mensili via Tipalti, minimo €100 | [payouts](https://docs.crazygames.com/payouts/) |
| Altre piattaforme | Pubblicare su Steam/app store non toglie la revenue share | [FAQ](https://docs.crazygames.com/faq/) |

**Impatto sull'indipendenza:** compatibile con mantenere pivot23.com (non esclusiva), purché la build CrazyGames usi solo il loro SDK. Da verificare: se il footer "Powered by Totem" conta come branding (art. 5.3a); se il salvataggio localStorage funziona sul loro dominio; gestione consenso sul portale.

## Costi / opportunità (qualitativi, nessun numero inventato)
- Pro: pubblico già presente sui portali; nessun costo di acquisizione; ads gestite dal portale.
- Contro: seconda build da mantenere (SDK diverso, niente AdSense); dipendenza dalle decisioni editoriali del portale; Poki esclusivo = rinuncia al sito come canale web.
- Proposta: dopo la demo, eventualmente CrazyGames Basic Launch (non esclusivo) come test di mercato; Poki solo dopo chiarimento scritto sull'esclusiva.

## EN
Poki: prefers Web Exclusive (game only on Poki on the open web, default 5 years, indicative), full earnings on self-brought players and a share on Poki-brought ones, SDK-only ads, free to submit. Likely incompatible with keeping www.pivot23.com — confirm in writing. CrazyGames: non-exclusive by default, optional 2-month exclusivity for +50%, SDK-only ads required for compensation, no public percentage, 1-year auto-renew, Tipalti, €100 minimum. Compatible with keeping the site with a separate build.
