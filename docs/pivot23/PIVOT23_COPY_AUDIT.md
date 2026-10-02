# Copy audit

2026-10-01. Inventory and defects only. No tone rewrite. Source: `apps/pivot23` on the phase-b branch, which starts from `89249ef`.

## Where the player reads text

| Surface | Source | Demo language |
|---|---|---|
| Home, tabs, awards chrome | `i18n.ts` dictionary | Italian and English are selectable. Spanish keys exist and are not selectable. French does not exist. |
| Events, choices, season lines | `feel.ts`, `story-extra.ts`, `story-feel.ts`, `story-late.ts`, `proc-text.ts` | Italian is the base. `proc-text.ts` and parts of `engine.ts` branch on `en` and `es`. |
| Team and round names | `teams.ts`, `data.ts` | Proper names. NBA franchise names stay by D-015. |
| Playoff result | `league.ts` line pools plus `engine.ts` score fill | The sentence is chosen when the series is resolved, not on each paint. |
| Errors and empty states | `PivotApp.tsx`, `i18n.ts` | Not re-read line by line in this pass. |

`fillTemplate` replaces placeholders when the event is applied. A missing name becomes the fallback already in that function. This pass did not click every event to prove every placeholder.

## Confirmed

1. The home selector offered Español. D-014 removes that button. A stored `es` or `fr` value now loads Italian for the UI. A career already saved with `player.lang === "es"` can still narrate in Spanish, because `engine.ts` trusts that field. That is a save already on the device, not a schema migration.
2. On the public Finals screen, Real Madrid's line included «Eurolega · Eurolega». Division and conference render the same word. Context defect, not a grammar rewrite.
3. A lost EuroLeague Final showed `74-75` on the strip and `75-74` in the sentence. The sentence uses the opponent-first score on a loss. Both numbers are the same game. The two orders are easy to misread. Left as-is.
4. The injected nerves line «Una serie, un gesto.» in the visual check was fixture text, not a catalog line. Do not file it as a game sentence.

## Not verified

- Grammar and spelling of every line in `feel.ts` and the story files.
- That every English branch has the same events as Italian.
- That every Spanish key matches Italian. The dictionary is still in the repo for a later phase. It is not a demo language.
- Placeholder failures on a full played career.
- French. There is nothing to inventory.

## Not changed

No sentence was rewritten for tone, rhythm, or style.
