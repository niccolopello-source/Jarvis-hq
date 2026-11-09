# PIVOT 23: ES / ZH translation coverage (2026-11-09)

All translations are a first pass, **NOT reviewed by native speakers**. Untranslated narrative
falls back to **English** (never to Italian); interface chrome has no fallback at all.

## Interface (chrome)

| Dictionary | it | en | es | zh |
|---|---|---|---|---|
| Chrome keys (`i18n.ts`, `Msg`) | 285 | 285 | 285 (100%) | 285 (100%) |
| Legacy card keys (`legacy-i18n.ts`) | 75 | 75 | 75 (100%) | 75 (100%) |
| Labels (roles, nations, attributes, rounds, playoff results, award notes, difficulty, themes, ads/sound copy) | full | full | full | full |

Enforced by `src/lib/pivot/i18n-es-zh.test.ts` (key parity, placeholder parity, zero fallbacks)
and the updated `chromeGaps()` check in `i18n.test.ts` (now over the four languages).

## Narrative (story text)

The engine stores canonical Italian; text is translated at render time (`nx()`), sentence by
sentence. The English catalog has 3,923 entries, 294 of them proper names kept as-is, so there are
**3,629 translatable entries**.

| Measure | es | zh |
|---|---|---|
| Catalog entries translated | 3,629 / 3,629 (100%) | 3,629 / 3,629 (100%) |
| Displayed story lines fully in the language (24 played careers, 101,531 lines) | 100.0% | 100.0% |
| Distinct story texts fully in the language (6,227 distinct) | 100.0% | 100.0% |
| Lines showing Italian | 0 (unit + e2e) | 0 (unit + e2e) |

Before this pass (HEAD d1501bd): 1,294 / 3,629 entries (35.7%), 96.9% displayed lines, 76.0%
distinct texts, for both languages.

How the work was ordered: interface-facing modules first (draft questions, path/call screens,
difficulty, playoff doors), then by how many careers (out of 60 simulated) show the line, then the
long tail in frequency order (13 batches, 3,629 entries). Each batch was checked for placeholder
parity against the Italian key before it was committed.

Measured with `playCareerTexts()` (narrative/harness.ts), seeds 31000 + 13k, k = 0..23, all four
difficulties. The unit test runs 8 other seeds; its floor was raised from 95% to **99%** displayed
lines (measured 100.0% for es and zh). Proper names (cities, clubs, players) stay in Latin script
in zh, as in the other languages.

### Sentence composition fixes (zh)

- Placements: `seedConfLabel()` renders 西部第5 / 东部第3 (was "第5 西部"); es renders
  "5.º del Oeste", "2.º de la EuroLeague". The zh e2e scan fails on `第N 东部/西部`.
- Counts: `countWord()` renders 3个冠军 in zh (no space), "3 títulos" in es.
- Narrative seeds use 第{SEED}号种子 after the conference, ages use {0}岁, rounds use
  对阵{OPP}的{ROUND}.
- Multi-sentence catalog entries are also registered sentence by sentence so recombined engine
  text still resolves; zh values close sentences with 。 and no space, so the splitter now also
  breaks after 。！？ (translate.ts, render-time only). This closed the last 3 zh lines that
  fell back to English.

## Missing / next

1. Native review of everything (both languages), starting with GLOSSARY-ES-ZH.md.
2. Narrative text the 24+8 measured careers never reach may still fall back to English (the
   catalog is complete, but very rare engine recombinations can miss a template).
3. Chinese line-breaking review on real devices (iOS PingFang SC, Android Noto Sans CJK, Windows
   Microsoft YaHei). Only Chromium on Linux was checked here.
