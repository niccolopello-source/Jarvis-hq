# Language QA, 2026-10-03

The chrome dictionary started at 38 keys. Each one was present and non-empty in Italian, English and Spanish.

## Earlier the same day

The official award name is the same on every screen and in every language:

| Before, Italian screen | After |
|---|---|
| Matricola dell'anno | Rookie of the Year |
| Difensore dell'anno | Defensive Player of the Year |
| MVP delle Finals | Finals MVP |
| Più migliorato / Giocatore più migliorato | Most Improved Player |
| Sesto uomo | Sixth Man of the Year |
| Primo quintetto / All-League | All-NBA First Team |

The sentence around the name stays in the active language.

## This pass

Visible chrome that was still Italian while English was selected:

| Place | Class | Action |
|---|---|---|
| Setup title, labels, Draft button, simulate button | E | Moved into the dictionary |
| Difficulty name, tag and description | E | Display copy by language. The numbers in `difficulty.ts` were not touched |
| Guide, four slides and its buttons | E | Moved into the dictionary |
| «Resume career» against «Riprendi la vita» | D | English is now «Resume this life» |
| Season count on the result | D | `seasonCountLabel` takes the language. Italian for 0, 1 and 2 is unchanged |
| «Titoli» on the Career Card | D | Follows the language |
| Story pools, draft beats, summer lines | — | Left |
| «Corsa all'MVP» | G | Kept. The acronym is spoken with a vowel |
| Spanish picker | — | Still off. `demoLang("es")` returns Italian |

No percentage of the story is claimed as checked. No formula, probability, retirement rule, or save version changed. John, Al, Rebecca, James, Claude and Gemini did not review this text.
