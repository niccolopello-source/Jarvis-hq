# OPEN — Compattazione legacy: possibile divergenza futura RNG

Stato: documentazione issue locale nel repository, nessuna issue pubblica creata. Separata dalla protezione future-save della draft [PR #155](https://github.com/niccolopello-source/Jarvis-hq/pull/155). NON corretta in questo punto. Nessuna normalizzazione o indebolimento dei test.

## Evidenza e causa

Fixture forzata 2.24 seed89081: roster CPU vuoto, tre titoli NBA dello stesso team sintetico, evento dinastia all'indice10. Il reale save/load (checksum valido) compatta `world.events` a10 mentre il mondo runtime può tenerne16. Il marker dinastia viene perso; [`world.ts852–861` su main33810f7](https://github.com/niccolopello-source/Jarvis-hq/blob/33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f/apps/pivot23/src/lib/pivot/world.ts#L852-L861) non lo trova e richiama `voiceOf`, usando RNG per riemettere la notizia. Quindi l'effetto condizionale NON è solo visivo.

## Riproduzione sintetica

Da apps/pivot23: `node --import=tsx scripts/compatibility/world-compaction-probe.mjs /absolute/target/apps/pivot23 /absolute/probe.jsonl.gz`. Solo store Mem e oggetti sintetici, nessun save utente. L'uscita0 indica diagnosi completata, non parità resume.

Risultato precedente verificato separatamente su main33810f7 e runtime6cef874: **PASS cross-revision** integrale prima/dopo; **FAIL continuo→reload** dopo il tick per RNG e envelope (primi path `$.rngState` e `$.player.rngState`). Il nuovo follow-up riesegue questo probe senza modificare compattazione, world, league, RNG, engine o soglie.

## Confine e decisione ancora aperta

Non è una carriera naturale né una stima di frequenza/gravità in produzione. Nel campione312carriere/13versioni erano equivalenti envelope/RNG persistibili, ma non la piena memoria: quel PASS circoscritto non prova identità universale.

Qualsiasi correzione richiede progetto separato con gate/versione o migrazione esplicita, compatibilità legacy e verifiche complete. NON cambiare silenziosamente la compattazione delle carriere212–224 per rendere verdi gli assert. La chiusura della protezione future-save dopo review non chiude questa issue e non certifica demo pronta.
