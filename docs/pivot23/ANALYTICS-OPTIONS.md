# PIVOT 23 — Opzioni analytics indipendenti da Vercel (Fase 8)

Stato: **PROPOSTA**, nessuna implementazione, nessun servizio attivato o pagato. Prezzi letti dalle pagine ufficiali il 25 ott 2026 (Europe/Rome); vanno ricontrollati prima di qualsiasi attivazione.

## Situazione oggi (main a640e54)
- Solo Vercel Web Analytics (`src/WebAnalytics.tsx`): page view anonime, senza cookie, beacon same-origin `/_vercel/insights/*`. Nessun evento di gioco.
- Piano Hobby: dati legati a Vercel, retention breve, log runtime 1 h. Nessuna esportazione nostra (rischio R7).

## Regole che ogni opzione deve rispettare
1. **Minimizzazione**: nessun dato personale, fiscale o bancario. Niente IP salvati, niente user-agent completo, niente nome giocatore, niente ID persistente tra sessioni. Solo contatori aggregati.
2. **Nessun cookie / localStorage per analytics** → niente banner di consenso aggiuntivo (da confermare con Lucille/legale).
3. **Motore intoccabile**: l'invio eventi non legge né modifica RNG, salvataggi o logica; se fallisce, il gioco va avanti.
4. **Off di default** con flag di build; **nessun dominio nuovo nella CSP di produzione senza ok di Pello**.
5. Nessuna credenziale nei log, nei report o nel repository.

## Eventi proposti (massimo 8, tutti aggregati)
`career_start{difficulty,path}`, `career_end{difficulty, age_bucket(5 anni), reason}`, `season_advance{difficulty}`, `story_choice{event_id}`, `share_card`, `locale{it|en}`, `error{code}`, `page_view{path}`. Nessun campo libero.

## Opzione A — Endpoint nostro: Cloudflare Worker + D1 (consigliata)
- Un Worker riceve `POST /e`, valida lo schema, scarta tutto il resto, incrementa contatori giornalieri in D1 (riga = giorno × evento × dimensioni). L'IP non viene mai scritto.
- **Costi** ([Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/)): piano Free 100.000 richieste/giorno, D1 Free 5 M righe lette/giorno, 100.000 righe scritte/giorno, 5 GB. Oltre: Workers Paid **$5/mese** minimo (10 M richieste incluse, poi $0,30/M). Con il traffico attuale: **€0** stimato (HYPOTHESIS: volume reale non misurato).
- Limite Free: oltre 100.000 scritture/giorno le query falliscono → il client deve ignorare gli errori (già previsto dalla regola 3). Mitigazione: batching lato client (1 POST a fine sessione).
- **CSP**: serve `connect-src` verso il dominio del Worker (es. `e.pivot23.com`) → decisione di Pello. In alternativa rewrite same-origin in `vercel.json` (cambio di codice, sempre con ok).
- **Export / backup / restore**: `wrangler d1 export <db> --output=backup.sql` schedulato (GitHub Action settimanale, artefatto privato) ; restore con `wrangler d1 execute <db> --file=backup.sql`. Schema versionato nel repo. Dati portabili (SQLite).
- Pro: indipendente da Vercel, gratuito ai volumi attuali, dati nostri, minimizzazione decisa da noi. Contro: dashboard da costruire (pannello admin, vedi ADMIN-PANEL-DESIGN.md), account Cloudflare da creare (decisione di Pello).

## Opzione B — Self-hosted open source (Umami o Plausible CE) su VPS UE
- **Costi** ([Hetzner Cloud](https://www.hetzner.com/cloud/)): da **€5,99/mese** (Cost-Optimized) o **€6,49/mese** (Regular) IVA esclusa; disponibilità dei piani condivisi variabile sulla pagina. Software gratuito.
- Pro: dashboard pronta, dati in UE (Germania/Finlandia, GDPR), export SQL/CSV. Contro: server da mantenere (aggiornamenti, sicurezza, backup Postgres/ClickHouse con `pg_dump`/snapshot), costo fisso anche a traffico zero, nuovo dominio in CSP.

## Opzione C — Plausible Cloud (SaaS UE)
- **Costi** ([plausible.io](https://plausible.io/#pricing)): Starter **$9/mese** per 10k page view/mese, Growth $14, Business $19 (prezzi mensili mostrati il 25 ott 2026).
- Pro: zero manutenzione, senza cookie, hosting UE, export CSV e API. Contro: costo ricorrente, eventi personalizzati con limiti di piano, dati presso terzi (serve DPA), nuovo dominio in CSP.

## Confronto rapido
| | A Worker+D1 | B Self-host | C Plausible Cloud |
|---|---|---|---|
| Costo oggi | €0 (Free) | ~€6–6,5/mese + IVA | $9/mese |
| Manutenzione | bassa | alta | nessuna |
| Controllo dati | totale | totale | terzi (DPA) |
| Dashboard | da fare | pronta | pronta |
| Eventi di gioco | liberi (schema nostro) | sì | sì, con limiti |

## Decisioni richieste a Pello
1. Opzione (consiglio: A). 2. Creare l'account del fornitore. 3. Dominio in CSP o rewrite. 4. Testo privacy (Lucille). Nessuna di queste azioni è stata fatta.
