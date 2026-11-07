# Supplemento diagnostico BFCache successivo al push (7 nov 2026 CET)
Runtime36d, head pubblicato2840aba; nessuna modifica ulteriore al repo.
Default headless shell: persisted=false/masked nei test pubblicati (limite correttamente documentato nello snapshot report).
Full Chromium headless già installato, channel="chromium": prima esecuzione FAIL timeout di goBack che aspettava load; snapshot già Round2, non si afferma BFCache da quello.
Nuova variante FUORI checkout: cambia soltanto import assoluto, attesa goBack waitUntil:"commit" (BFCache non richiede nuovo load), aggiunge assert persisted===true. Tutti gli assert raw1/lease0 fuori app/lease1 al ritorno e reload restano uguali.
Esito reale PASS1, pageshow.persisted=true, notRestoredReasons=null. Quindi freeze/restore nativo realmente osservato in questo singolo Chromium full headless locale; non universale/device support certification. NON parte dei58 test committed, è un diagnostico aggiuntivo, non un59esimo test della suite.
Provenienza/comando/hash e test/config riproducibili nel file /workspace/review155-bfcache-supplement.json. Log /workspace/review155-bfcache-full-chromium-commit.log. Conservato anche il primo timeout. Nessun dato reale o attività desktop.
