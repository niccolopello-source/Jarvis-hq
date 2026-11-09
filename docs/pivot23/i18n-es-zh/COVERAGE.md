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
| Catalog entries translated | 1,294 / 3,629 (35.7%) | 1,294 / 3,629 (35.7%) |
| Displayed story lines fully in the language (24 played careers, 101,531 lines) | 96.9% | 96.9% |
| Distinct story texts fully in the language (6,227 distinct) | 76.0% | 76.0% |
| Lines showing Italian | 0 (unit + e2e) | 0 (unit + e2e) |

How the work was ordered: interface-facing modules first (draft questions, path/call screens,
difficulty, playoff doors), then by how many careers (out of 60 simulated) show the line, plus
lines found in English during the e2e runs (draft round titles, call/path lines, career events). Every line seen in 12+ of 60 careers is translated;
the remaining 2,335 entries are long-tail lines (fewer than 12 of 60 careers, most in 0–4), which
show in English for now.

Measured with `playCareerTexts()` (narrative/harness.ts), seeds 31000 + 13k, k = 0..23, all four
difficulties; the unit test runs 8 other seeds with a floor of 95% displayed lines.

## Missing / next

1. Native review of everything (both languages), starting with GLOSSARY-ES-ZH.md.
2. The 2,335 long-tail narrative entries (es and zh), worklist ordered by frequency.
3. Chinese line-breaking review on real devices (iOS PingFang SC, Android Noto Sans CJK, Windows
   Microsoft YaHei). Only Chromium on Linux was checked here.
