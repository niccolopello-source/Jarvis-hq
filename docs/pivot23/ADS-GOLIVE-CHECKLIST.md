# Pubblicità desktop — checklist go-live (target 20/10/2026)

Stato in questa PR: **annunci OFF**. Si aggiunge solo l'header `Content-Security-Policy-Report-Only` con i domini Google proposti in `ADS-DESKTOP.md`. La CSP che blocca (`Content-Security-Policy`) è **invariata**. La Report-Only non blocca niente: segnala solo in console le richieste che la nuova policy rifiuterebbe. `frame-ancestors` è escluso dalla Report-Only perché lì il browser lo ignora; resta nella CSP che blocca.

Ogni passo che tocca la produzione richiede l'**OK esplicito del proprietario**.

## 0. Prerequisiti
- [ ] AdSense approvato per `pivot23.com` (ads.txt #100 e meta tag #101 già in produzione, publisher `ca-pub-6076243520452836`).
- [ ] Messaggio GDPR (CMP gratuito certificato Google, TCF) creato e pubblicato in AdSense → Privacy e messaggi. Annunci **non personalizzati**.
- [ ] Due unità display verticali (160×600) create: `pivot23-rail-left` e `pivot23-rail-right` → annotare gli slot ID.
- [ ] Privacy/cookie policy (#98) completate con i dati del proprietario, riviste e pubblicate.

## 1. Variabili d'ambiente Vercel (progetto pivot23)
Da impostare **prima su Preview**, poi su Production solo con l'OK del proprietario.

| Variabile | Valore | Note |
|---|---|---|
| `VITE_ADS_ENABLED` | `true` | Assente o diverso da `"true"` = OFF; `@/ads` diventa lo stub `off.tsx`. |
| `VITE_ADSENSE_CLIENT` | `ca-pub-6076243520452836` | Vuoto o non valido: non si carica nulla. |
| `VITE_ADSENSE_SLOT_LEFT` | `<SLOT_ID_LEFT>` | Slot ID numerico dell'unità sinistra. |
| `VITE_ADSENSE_SLOT_RIGHT` | `<SLOT_ID_RIGHT>` | Slot ID numerico dell'unità destra. |

Sono variabili di **build**: dopo ogni modifica serve un nuovo deploy (redeploy della preview).

## 2. Verifica su preview (flag ON)
1. Imposta le variabili solo per Preview e fai il redeploy del branch.
2. Desktop ≥1280 px con puntatore fine: consenso → banner laterali nell'area riservata. In console: nessuna violazione **Report-Only** sui domini Google. Annota ogni dominio segnalato e aggiungilo alla policy.
3. Mobile/tablet (emulazione + 1 dispositivo reale se disponibile): nessuno script ads, nessuna richiesta a `googlesyndication`/`doubleclick` e layout invariato.
4. Interstitial di fine stagione solo per chi non ha l'account: al massimo ogni 3 stagioni, almeno 4 minuti di distanza, timeout 2 s. Rewarded: solo cornice cosmetica.
5. Test locale: `VITE_ADS_ENABLED=true VITE_ADSENSE_CLIENT=ca-pub-0000000000000000 E2E_PORT=<libera> pnpm exec playwright test e2e/ads-desktop.spec.ts --workers=1`.

## 3. Passaggio a enforcing (PR separata)
- [ ] Copia il valore della Report-Only, con i domini corretti, nella `Content-Security-Policy` e aggiungi di nuovo `frame-ancestors 'none'; upgrade-insecure-requests`.
- [ ] Rimuovi l'header Report-Only, oppure lascialo identico.
- [ ] Ricontrolla la preview: annunci visibili e console pulita.

## 4. Produzione (solo con l'OK del proprietario)
- [ ] Imposta le stesse 4 variabili su Production.
- [ ] Unisci la PR della CSP enforcing (il merge su main pubblica in produzione).
- [ ] Controlla www.pivot23.com: desktop con annunci dopo il consenso, mobile senza codice ads, Lighthouse.

## 5. Consenso (CMP) — requisiti del proprietario
- [ ] Messaggio della CMP certificata Google (Privacy & messaging, IAB TCF) personalizzato con il branding PIVOT 23: colori, font e logo dai design token esistenti (`apps/pivot23/src/styles.css`, `styles/deluxe.css`).
- [ ] Banner mostrato alla prima visita, sulla home/landing page.
- [ ] Nuova richiesta di consenso quando cambia la versione dell'informativa (cambi sostanziali).
- [ ] Link permanente "Preferenze cookie" / "Cookie preferences" nel footer/menu della home page che riapre la CMP.

## 6. Legale
- [ ] Privacy e Cookie Policy (docs/pivot23/legal) riviste da un legale, placeholder risolti (elenco cookie dalla CMP, ruolo Vercel ex art. 28/DPA); email privacy provvisoria da sostituire con una dedicata.

## Rollback
Imposta `VITE_ADS_ENABLED` vuota su Production e fai il redeploy: il bundle torna allo stub, senza codice ads. La CSP può restare.
