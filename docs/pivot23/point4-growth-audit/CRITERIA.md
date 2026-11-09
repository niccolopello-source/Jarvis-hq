# Punto 4 — criteri fissati prima della campagna
Base: dc5878a228ab949e5f22573664a97cc27d2be43d (PR157). CI applicativa sbloccata da gh run watch --exit-status, tre workflow exit 0; log locale /workspace/feelings-check157/ci-native-wait.log.

## Criteri / non-obiettivi
- Misurare prima di cambiare: nessun aumento per centrare arbitrariamente le proposte storiche 1–2 OVR. Conservare soglie test esistenti.
- Scelte best/worst: delta picco positivo e ripetuto nei quattro livelli; riportare mediana/quantili, non pretendere che ogni coppia migliori. Le policy valutano soltanto eventi story, non controllano playoff/estate: confronto di policy, NON effetto isolato di una singola scelta.
- Morale: singola stagione a input identici salvo morale, RNG iniziale identico; effetto minuti/prestazioni bounded. Separare questo controllo causale dalle carriere con policy morale, che cambiano anche altri attributi.
- Curva: descrivere incrementi 24→25,25→26,26→27,27→28 per apex personale. Non confondere un apex/declino intenzionale con un cliff universale. Nessuna soglia nuova inventata per far passare.
- Archetipi: draft migliore/potenziale97 e peggiore/potenziale66 sono stress fixture, NON una distribuzione di utenti. Confrontare con draft casuale senza forzare varianza.
- Sanity: carriere terminate entro bound esistente, età≤36, OVR/attributi finiti e entro limiti; seed e azioni riproducibili.
- Se emerge difetto riproducibile nel normale journey, patch minima solo gate225+. Se non emerge, audit + test riproducibili, niente ritocco cosmetico di coefficienti.
- 2.24 attiva, save format e policy ritiro/premi invariati. Seed89081 resta OPEN; confronto persistibile non certifica resume full-memory.
- Raw e provenienza per-run conservati; sample limitato esplicito. Verifica full-state/envelope/RNG legacy cross-revision; nessuna normalizzazione gameplay.

## Mappa causale verificata nel sorgente
Scelta → applyFx: attributi/hidden/stress(injuryRisk,injuryDrag,load)/morale/trust/form → statsPulse (esclude gli attributi già applicati), imprint → attributi ponderati → refreshOverall. In225 morale/trust alimentano anche form ed esperienza capped. Stato stagionale → settleCareerMemory → pulse capped ±0.3 ed esperienza ±0.9/stagione, cumulativa ±2.6. Morale stagionale centrato55 e clamp±45 → moltiplicatore minuti 1±9%; form morale ±1.8 → fattore scoring via0.018 (prima dei cap/rounding). Minuti/box score/premi → seasonProductionPulse → attributi → OVR. Crescita naturale = differenza curva personale e budget attributi, sottraendo contributi aging già applicati; esperienza è aggiunta dopo clamp e rimossa dalla baseline dell’anno precedente per non capitalizzarla due volte. Nessuna nuova estrazione RNG prevista.

## Piano campione pre-dichiarato
120 seed-profile: 5 ruoli ×3 percorsi ×4 difficoltà ×2 repliche. Nove policy/profili: casuale, best,worst,morale-up,morale-down,star,role,low-initial-morale,high-initial-morale. 1080 carriere225. Seed base940000+indice*97. Morale singola stagione: stessi120 input, morale10/55/100, stesso RNG attivo iniziale (360 stagioni). Best/worst e morale-up/down sono paired su seed, non su azioni (azioni diverse per definizione). Low/high iniziale conserva policy random, ma le traiettorie possono divergere; non presentarlo come sensibilità isolata dell’intera carriera. Stress archetipi dichiarati separati.
