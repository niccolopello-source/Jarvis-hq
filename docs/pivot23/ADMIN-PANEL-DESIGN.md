# PIVOT 23 — Pannello admin separato (Fase 9): design

Stato: **SOLO DESIGN**, nessuna implementazione, nessun account, nessuna variabile d'ambiente creata.

## Obiettivo
Un pannello solo per Pello (e chi autorizza) per vedere le metriche aggregate (ANALYTICS-OPTIONS.md), lo stato dei deploy e i flag di funzione. **Mai** dentro il bundle del gioco.

## Principi
1. **App separata** (es. `apps/pivot23-admin`), dominio separato (es. `admin.pivot23.com`), deploy separato. Il gioco non contiene codice né rotte admin.
2. **Autenticazione vera lato server**: nessuna password nel client, nessun controllo "solo frontend", nessun segreto nel repository.
3. **Minimo privilegio**: il pannello legge solo aggregati; le scritture (flag) passano da endpoint server con controllo di ruolo e log di audit.
4. **Nessun dato personale** degli utenti del gioco: non esiste, quindi non si può mostrare.

## Autenticazione (opzioni)
| Opzione | Come | Note |
|---|---|---|
| **A1 Cloudflare Access** davanti al pannello (se si sceglie analytics A) | SSO via email OTP/Google, policy per indirizzo; il server verifica il JWT `Cf-Access-Jwt-Assertion` a ogni richiesta | nessun codice di login nostro; costo e limiti del piano da verificare prima |
| **A2 OAuth GitHub** con allow-list | flusso OAuth lato server, sessione in cookie `HttpOnly; Secure; SameSite=Strict`, firmata, scadenza 8 h | allow-list di login GitHub nel server, non nel client |
| **A3 Passkey (WebAuthn)** | registrazione una tantum, verifica firma lato server | più sicuro, più lavoro |

Consiglio: A1 se si sceglie Cloudflare per gli analytics, altrimenti A2. In ogni caso: 2FA obbligatoria sull'identità, rate limit sul login, CSRF token sulle scritture.

## Architettura
```
browser admin ──HTTPS──> admin app (server) ──verifica sessione/JWT──> API aggregati (sola lettura)
                                             └─> API flag (scrittura, ruolo "owner", audit log)
```
- Segreti (client secret OAuth, chiave firma sessioni) solo come variabili d'ambiente del progetto admin: **da creare solo con ok di Pello**.
- Audit log: chi, cosa, quando (nessun IP completo); conservato 90 giorni.
- Header: CSP stretta `default-src 'self'`, `frame-ancestors 'none'`, HSTS, `noindex`.

## Funzioni v1
1. Dashboard metriche (sola lettura): carriere avviate/finite per difficoltà, età media di ritiro, errori.
2. Stato release: versione motore attiva, ultimo deploy (link GitHub).
3. Flag (fase 2, dopo approvazione): es. `ADS_ENABLED` resta **OFF** e non modificabile dal pannello senza decisione esplicita.

## Test previsti prima del via
- Accesso negato senza sessione (401) e con utente fuori allow-list (403), lato server.
- Sessione scaduta / manomessa rifiutata; CSRF assente → 403.
- Nessuna stringa admin nel bundle del gioco (test di build).

## Decisioni richieste a Pello
Opzione di login, dominio, chi ha accesso, quando iniziare l'implementazione.
