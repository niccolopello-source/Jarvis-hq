# Pubblicità solo desktop — implementazione (flag OFF)
Stato: DRAFT, nessun deploy. Owner decisions 14/10/2026: lancio target 20/10, AdSense display + H5 Games Ads,
solo annunci NON personalizzati, CMP gratuita certificata Google (TCF v2.3), banner solo negli spazi laterali
già riservati, interstitial a fine stagione solo per chi non ha account (oggi tutti ospiti), rewarded facoltativo
con premio solo estetico.

## Flag e variabili (build time)
| Variabile | Default | Effetto |
|---|---|---|
| `VITE_ADS_ENABLED` | assente = OFF | `"true"` abilita il modulo `src/ads` (chunk lazy). OFF: `@/ads` è risolto su `src/ads/off.tsx` (solo il segnaposto "Riservato"), nessun codice ads nel bundle. |
| `VITE_ADSENSE_CLIENT` | vuoto | `ca-pub-` + 16 cifre. Vuoto o non valido: nulla viene caricato anche con flag ON. |
| `VITE_ADSENSE_SLOT_LEFT/RIGHT` | vuoto | Slot ID delle unità 160×600. |

## Catena di caricamento (flag ON)
1. `useDesktopEligibility()` — tutti veri: larghezza ≥ 1280 px, `(hover: hover) and (pointer: fine)`, NON `(any-pointer: coarse)`, `maxTouchPoints ≤ 1`, `userAgentData.mobile !== true`. Ricontrollo su `resize` e `change` delle media query.
2. Solo se desktop: CMP Google (`fundingchoicesmessages.google.com`).
3. Solo dopo consenso TCF (Purpose 1, o GDPR non applicabile): `adsbygoogle.js` con `requestNonPersonalizedAds = 1`.
4. `AdRail`: box fisso 160×616 (zero CLS); se `data-ad-status="unfilled"` lo slot si nasconde senza cambiare il layout.
5. Fine stagione (`RecapCard` → `adBreakAtSeasonEnd`): flag OFF = sincrono come oggi. Flag ON: interstitial `adBreak({type:"next"})` al massimo una volta ogni 3 fine stagione e mai entro 4 minuti dall'ultimo; se l'annuncio non parte entro 2 s il gioco prosegue; `proceed()` viene chiamato una sola volta.
6. Rewarded: offerto solo se l'API lo rende disponibile, solo su click esplicito; premio (cornice oro sulla Career Card) assegnato solo in `adViewed`, salvato in `localStorage["pivot23-cosmetic-gold-frame"]`, MAI nel salvataggio, mai letto dal motore.

## CSP (NON applicata in questa PR — proposta)
La CSP di produzione (`vercel.json`) blocca qualsiasi script esterno. Con il flag ON senza modifica della CSP
il browser blocca CMP e annunci: il gioco funziona comunque (segnaposto). Proposta da applicare solo insieme
all'attivazione, prima in `Content-Security-Policy-Report-Only` su una preview Vercel:

```diff
- script-src 'self';
+ script-src 'self' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://*.adtrafficquality.google https://partner.googleadservices.com https://www.googletagservices.com;
- connect-src 'self';
+ connect-src 'self' https://*.googlesyndication.com https://*.doubleclick.net https://fundingchoicesmessages.google.com https://*.adtrafficquality.google https://*.google.com;
- img-src 'self' data: blob:;
+ img-src 'self' data: blob: https:;
+ frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com https://fundingchoicesmessages.google.com https://*.adtrafficquality.google https://www.google.com;
```
L'elenco dei domini è da confermare contro le richieste reali in preview (Google non garantisce un elenco stabile);
`frame-ancestors 'none'`, `X-Frame-Options: DENY` e `browsing-topics=()` restano invariati (Topics non serve con annunci non personalizzati).

## ads.txt
Non aggiunto: un `ads.txt` senza record dichiarerebbe "nessun venditore autorizzato" e una riga segnaposto sarebbe invalida.
Va creato `public/ads.txt` con il Publisher ID reale al momento dell'attivazione:
`google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
`vercel.json` non ha rewrite SPA, quindi `/ads.txt` sarà servito come file statico (oggi 404). Nota: `vite preview` in locale fa fallback su index.html per i path sconosciuti; Vercel no.

## Mai su telefono/tablet
Con flag ON, e2e `e2e/ads-desktop.spec.ts` verifica zero richieste ai domini ads su telefono Android, tablet in
orizzontale (1366 px) e iPad che si presenta come Mac. Per eseguire i casi flag ON:
`VITE_ADS_ENABLED=true VITE_ADSENSE_CLIENT=ca-pub-0000000000000000 E2E_PORT=<libera> pnpm exec playwright test e2e/ads-desktop.spec.ts --workers=1`
(tutti i domini ads sono bloccati dal test: nessuna richiesta esce).
