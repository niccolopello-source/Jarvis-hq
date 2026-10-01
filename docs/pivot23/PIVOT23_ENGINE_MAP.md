# Engine and save map

Read-only. Source: `apps/pivot23` on `89249ef`, re-read on `grok/phase-b-demo`. No constant was changed. Labels: observed in code. Not a balance verdict.

## Versions

| Symbol | Value | Meaning |
|---|---|---|
| `ENGINE_VERSION` | `2.11.0-beta` | Label stored on the player |
| `SAVE_VERSION` | `11` | Player field in `config.ts`. Not the browser envelope |
| `LIVE_SAVE_VERSION` | `2` | Envelope `v` in `pivot-v2-save` |
| `FLAGS` | account, tokens, nft = false | Platform layer is off |

## Career order, as the functions are named

Observed entry points in `engine.ts`:

1. `freshPlayer` builds attributes, hidden traits, and sets `lang` from `getLang()`.
2. `dealDraftRound` / `applyDraftCard` / `finishDraft` run the draft. `scaledDraftCard` applies `cardRoleScale`.
3. `startProPath` and `revealDraftLanding` open the pro path. Path offsets in `SIM.path`: NCAA overall +1.2 at age 21, Europa +1.45 at 19, G-League +0.9 at 19.
4. `simulateRegularSeason` writes the season row. `qualifiesPlayoffs` / `isPlayoffSeed` decide the bracket. A series is not created without a real seed (`INVARIANTS` 6).
5. `playoffChoicesFor` then `resolvePlayoffRound`. Format is in `playoffSeriesFormat`: NBA best of seven; EuroLeague quarters best of five; later Euro rounds are one neutral game.
6. `buildFaOffers`, `acceptOffer`, `buildTradeOffer`, `acceptTrade`, `shouldOfferTrade`, `shouldForceTrade`, `tickContract` are the market.
7. `applyAutoOffseason` and `applyAging` move the body. Aging drops athleticism after 29, strength after 31, shooting after 32. IQ can rise until 35 (`SIM.aging`).
8. `recordRetirementChoice` stores the age-35 choice. The P0-LIFE test on this tree requires some Pro careers to end before 34 and at least one to reach 36, with peak age still 26–28.
9. `verdictOf` and `careerCardOf` close the career. `toArchive` / `saveArchive` keep the local archive.

Choice effect: `applyFx` writes the effect object from the event. `contextualPulse` and `imprint` are separate from that object. A sentence that claims a result must come from the same `resolvePlayoffRound` or `applyFx` path. This map does not re-check every sentence.

## Overall window

Observed in `SIM.overall`: displayed overall stays inside 48–99, start 60, peak age 27, max age 36, peak band 26–28. Year-over-year caps: young 6, peak 4, old 3. `SIM.choice.mix` is 0.74. These are the named caps. They are not a statement that every career feels different.

## Awards

`SIM.awards` weights, observed and not re-fit: production 0.25, team success 0.2, efficiency 0.15, impact 0.15, availability 0.1, consistency 0.1, narrative 0.05, noise 4. `royTarget` 0.07 and `dpoyTarget` 0.028 are in config. Invariant 8 says a target that nothing reads is not a live rate. This pass did not prove those two numbers are read. Not verified.

## Save

Observed in `save.ts`:

- One live key, `pivot-v2-save`. Checksum is the first 16 hex chars of SHA-256 over the payload. A bad checksum is not loaded.
- `buildLiveSave` compacts the player, shrinks the pending choice and the log, then stamps `v` and `c`.
- Writes try smaller payloads on quota. Archive can fall back from `localStorage` to `sessionStorage`. The previous good live save is not replaced by a failed write in the tests that cover that case.
- Swipe and hint use separate keys.
- There is no export file and no cloud account.

`careerId` is created once and is not the simulation seed. That split is covered by `engine.test.ts`.

## Explicitly not measured here

Bust share, franchise title share, and role box-score separation. Those remain P1-BUST, P1-WORLD and P1-ROLE. Do not tune them from this map.
