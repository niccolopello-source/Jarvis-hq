# PIVOT 23 — Ads go-live checklist (DRAFT)

> Requisiti per l'accensione della pubblicità desktop. Nessuna attivazione senza OK del proprietario.

## Consenso (CMP)
- [ ] Messaggio della CMP certificata Google (Privacy & messaging, IAB TCF) personalizzato con il branding PIVOT 23: colori, font e logo dai design token esistenti (`apps/pivot23/src/styles.css`, `styles/deluxe.css`).
- [ ] Banner mostrato alla prima visita, sulla home/landing page.
- [ ] Nuova richiesta di consenso quando cambia la versione dell'informativa (cambi sostanziali).
- [ ] Link permanente "Preferenze cookie" / "Cookie preferences" nel footer/menu della home page che riapre la CMP.

## Legale
- [ ] Privacy e Cookie Policy (docs/pivot23/legal) riviste da un legale, placeholder risolti (email privacy dedicata, [DATA], piano Vercel per la retention dei log).
