# Piano di lancio annunci desktop / Desktop ads launch plan
> **BOZZA / DRAFT** — Grok Bot, 2026-10-15, base `e7cc321`. Solo preparazione, nessuna attivazione. Preparation only, nothing activated. Decisioni / decisions: Pello.

Vincoli: nessuna pubblicità nella demo del 18/10; motore, OVR, RNG, premi, tuning e formato salvataggi non toccati; flag `VITE_ADS_ENABLED` OFF finché Pello non approva ogni fase. Dettagli tecnici: `ADS-READINESS-CHECKLIST.md`.

## IT
| Fase | Quando (indicativo) | Prerequisiti | Uscita / criterio di passaggio |
|---|---|---|---|
| 0 Demo e freeze | 17–18/10 | prod = candidato, flag OFF, 0 richieste ads | demo fatta senza annunci |
| 1 Account | dopo 18/10 | (P) account AdSense, sito aggiunto, ads.txt reale (HTTP 200), privacy/cookie pubblicate dopo revisione legale, CMP Google configurata | sito "Pronto" in AdSense |
| 2 Preview | dopo Fase 1 | preview Vercel con flag ON + ID reale, CSP **Report-Only**, test Playwright desktop/mobile/tablet + dispositivi reali | 0 richieste ads su mobile/tablet; elenco domini confermato; CSP rivista |
| 3 Banner laterali in prod | dopo approvazione Pello | Fase 2 PASS; procedura rollback provata | 7 giorni senza criteri di stop |
| 4 Interstitial fine stagione | dopo approvazione H5 Games Ads | account approvato, policy H5 | 7 giorni senza criteri di stop |
| 5 Rewarded cosmetico | dopo Fase 4 | premio solo estetico | — |

Il 20/10 è un obiettivo, non una data garantita: dipende dai tempi di revisione di Google (pochi giorni, fino a 2–4 settimane).

### Criteri di stop (rollback immediato con flag OFF)
- qualsiasi richiesta ads da telefono/tablet; annunci prima del consenso; errori JS o crash collegati agli annunci;
- gioco bloccato o rallentato (avvio "Inizia" oltre la soglia del gate, CLS > 0 dagli slot);
- violazioni CSP non previste, avvisi di policy AdSense, segnalazioni di traffico non valido;
- indicazione del legale o di Pello.

## EN
Phases: 0 demo/freeze with ads OFF → 1 AdSense account, site review, real ads.txt, published legal pages, Google CMP → 2 Vercel preview with flag ON, CSP Report-Only, desktop/mobile/tablet and real-device tests → 3 side banners in production after Pello's approval → 4 season-end interstitial after H5 Games Ads approval → 5 cosmetic rewarded. 20 Oct is a target, not guaranteed (Google review: days to 2–4 weeks).
Stop criteria (immediate flag OFF): any ad request from phone/tablet, ads before consent, ad-related JS errors, slowed or blocked game, unexpected CSP violations, AdSense policy warnings or invalid-traffic notices, lawyer's or Pello's instruction.
