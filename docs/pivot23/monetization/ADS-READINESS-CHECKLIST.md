# Checklist prontezza annunci / Ads readiness checklist
> **BOZZA / DRAFT** — Grok Bot, 2026-10-15, base `e7cc321` (main, include #97 merged by Pello 2026-10-15 09:06 UTC). Nulla da attivare prima della demo del 18/10. Nothing is to be activated before the 18 Oct demo.

Fonti codice: `docs/pivot23/ADS-DESKTOP.md`, `apps/pivot23/src/ads/*`, `e2e/ads-desktop.spec.ts`. Fonti Google (lette il 2026-10-15) in fondo.
Stato: [x] = verificato nel codice/test oggi · [ ] = da fare · (P) = decisione/azione di Pello.

## 1. AdSense banner desktop — prerequisiti account e sito
- [ ] (P) Titolare dell'account ≥ 18 anni, contenuto originale, accesso all'HTML del sito [G1].
- [ ] (P) Creare l'account AdSense e aggiungere `pivot23.com` in "Siti"; verifica proprietà con snippet ads.txt o meta tag; "Richiedi revisione" (di solito pochi giorni, fino a 2–4 settimane) [G3][G4]. Il target 20/10 dipende dall'esito: **non garantito**.
- [ ] Sito conforme alle Program Policies: niente posizionamenti ingannevoli, navigazione chiara, nessun pop-up invasivo [G2]. Gli slot laterali 160×600 sono fuori dall'area di gioco: [x] nel codice (`AdRail`, box fisso 160×616).
- [ ] Pagine Privacy/Cookie pubblicate e linkate (vedi doc 02) prima della revisione.
- [ ] robots.txt non blocca `Mediapartners-Google` / `Google-Display-Ads-Bot` [G3] — da verificare su `/robots.txt` al momento della richiesta.

## 2. H5 Games Ads (Ad Placement API) — richiesta separata
- [ ] (P) Serve un account AdSense **già approvato**; poi richiesta tramite il modulo H5 Games Ads; prodotto "by application", approvazione **non garantita** [G5][G6].
- [ ] Rispettare le policy H5 games (interstitial solo a pause naturali; rewarded solo su scelta esplicita) [G6].
- [x] Codice: `adBreak({type:"next"})` solo a fine stagione, rewarded solo su click; flag OFF = sincrono come oggi (`off.tsx`).

## 3. CMP, consenso, cookie/localStorage, informative
- [ ] (P) Usare la CMP di Google (Privacy & messaging), certificata e TCF v2.3 (obbligatoria per TC string dal 1/3/2026) [G7]. Consigliata configurazione a 3 pulsanti ("Acconsento / Gestisci / Non acconsento") — da confermare col legale.
- [x] Anche gli annunci **non personalizzati** richiedono consenso Purpose 1 (cookie/archiviazione) in SEE/UK/CH; senza Purpose 1 Google può servire solo "Limited ads" [G7][G8]. Il codice #97 carica `adsbygoogle.js` **solo dopo** consenso Purpose 1 e imposta `requestNonPersonalizedAds = 1` (test locale flag ON: PASS, vedi report).
- [ ] Decisione (P): con consenso negato, nessun annuncio (comportamento attuale #97) oppure Limited ads [G8]. Oggi: nessun annuncio.
- [ ] Inventario storage: salvataggi in `localStorage` (tecnici, nessun consenso necessario — da confermare col legale); `pivot23-cosmetic-gold-frame` (tecnico); cookie Google solo dopo consenso. Riportare nell'informativa cookie (#98).
- [ ] Minori < 14 anni (art. 2-quinquies Codice privacy): da trattare nella revisione legale; valutare se il pubblico è "child-directed" in AdSense.
- [ ] Link "Preferenze cookie" permanente sul sito (posizione da decidere, campo `[POSIZIONE NEL SITO — DA DEFINIRE]` in #98).

## 4. CSP
- [x] Produzione oggi: `script-src 'self'`; nessun dominio esterno (verificato: 0 host esterni su prod `e7cc321`).
- [ ] Applicare la proposta di `ADS-DESKTOP.md` **solo** come `Content-Security-Policy-Report-Only` su una **preview** Vercel con flag ON e Publisher ID reale.
- [ ] Raccogliere i domini realmente richiesti (Playwright + report-uri o console) e confrontarli con l'elenco proposto; Google non garantisce un elenco stabile.
- [ ] Revisione (Lucille + Pello) prima di passare a CSP applicata; nessun dominio nella CSP di produzione senza approvazione.

## 5. ads.txt
- [x] Oggi `/ads.txt` → HTTP 404 su www.pivot23.com (corretto: nessun file segnaposto).
- [ ] Creare `public/ads.txt` **solo** con il Publisher ID reale: `google.com, pub-<ID reale>, DIRECT, f08c47fec0942fa0` [G9].
- [ ] Verifica HTTP: `curl -sI https://www.pivot23.com/ads.txt` → 200 `text/plain`; anche `https://pivot23.com/ads.txt` (redirect ok) e via HTTP; stato "Autorizzato" in AdSense [G9].

## 6. Mobile e tablet: nessuno script pubblicitario
- [x] Idoneità desktop = tutti veri: larghezza ≥ 1280, `hover:hover & pointer:fine`, nessun `any-pointer:coarse`, `maxTouchPoints ≤ 1`, `userAgentData.mobile !== true`.
- [x] e2e flag ON locale (host ads bloccati): phone, tablet landscape 1366, iPad-as-Mac → 0 richieste. PASS (log `e2e-ads-flagon-local-e7cc321.log`).
- [ ] Ripetere sulla preview con ID reale e su dispositivi fisici (iPhone, iPad, Android) prima dell'attivazione; registrare modello/OS/browser.

## 7. Formati e fasi
- [ ] Fase 1: solo banner laterali desktop.
- [ ] Fase 2 (dopo dati Fase 1 e approvazione H5): interstitial a fine stagione (max 1 ogni 3 fine stagione, mai entro 4 min — già nel codice).
- [ ] Fase 3: rewarded con premio solo estetico (cornice oro), mai nel salvataggio, mai letto dal motore.

## 8. Frequenza, timeout, continuità, simulazione
- [x] Interstitial: cap 1/3 stagioni e 240 s (`frequency.ts`), `data-ad-frequency-hint="240s"`; timeout 2 s → il gioco prosegue; `proceed()` una sola volta.
- [x] Slot non riempito → nascosto senza layout shift.
- [x] Nessun dato di gioco/salvataggio/RNG passato agli annunci; motore non modificato da #97 (diff: nessun file in `src/lib/pivot`). Fingerprint motore: unit/stats PASS su `e7cc321`.
- [ ] Test con ad blocker attivo e con CMP rifiutata: il gioco deve restare giocabile.

## 9. Rollback immediato
- [ ] Procedura: impostare `VITE_ADS_ENABLED` a vuoto/`false` (o rimuoverlo) in Vercel Production → redeploy dell'ultimo commit (build time) → verifica: grep bundle senza `googlesyndication|fundingchoices`, 0 richieste ads con Playwright. Alternativa più rapida: "Instant Rollback" Vercel al deploy precedente. Entrambe richiedono l'approvazione di Pello per le azioni Vercel.
- [ ] Documentare chi può farlo e tempo atteso; provare il rollback su preview prima del lancio.

## Fonti / Sources (Google, ufficiali)
- [G1] Eligibility: https://support.google.com/adsense/answer/9724
- [G2] Program policies: https://support.google.com/adsense/answer/48182
- [G3] Connect your site: https://support.google.com/adsense/answer/7584263
- [G4] Add a site: https://support.google.com/adsense/answer/12169212
- [G5] H5 Games Ads sign-up: https://support.google.com/adsense/answer/1705831 · https://developers.google.com/ad-placement/docs/signup
- [G6] H5 Games Ads: https://adsense.google.com/start/h5-games-ads/
- [G7] TCF integration (NPA requirements, TCF v2.3): https://support.google.com/adsense/answer/9804260 · CMP requirements: https://support.google.com/adsense/answer/13554116
- [G8] Limited ads: https://support.google.com/adsense/answer/14210870
- [G9] ads.txt guide: https://support.google.com/adsense/answer/12171612

## English summary
Same checklist in short: (1) AdSense account + site review (18+, original content, policies; days to 2–4 weeks; 20 Oct not guaranteed). (2) H5 Games Ads is a separate application requiring an approved AdSense account; approval not guaranteed. (3) Google certified CMP, TCF v2.3; non-personalised ads still need Purpose 1 consent in EEA/UK/CH; #97 loads the ad script only after consent. (4) CSP changes only as Report-Only on a preview, domains taken from real requests, reviewed before enforcing. (5) ads.txt only with the real Publisher ID, verified with HTTP 200; today 404 (correct). (6) Phones/tablets: 0 ad requests in flag-ON local tests; repeat on preview and real devices. (7) Side banners first; season-end interstitial and cosmetic rewarded later. (8) Caps 1/3 seasons + 240 s, 2 s timeout, no effect on simulation. (9) Rollback = flag OFF + redeploy or Vercel Instant Rollback, with Pello's approval.
