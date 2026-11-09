# PIVOT 23: Spanish and Simplified Chinese (2026-11-09)

Owner decision 2026-11-09: PIVOT 23 launches in China; the language selector offers Italiano,
English, Español and 中文 (zh-CN).

**Every Spanish and Chinese string is a first machine-assisted pass, NOT reviewed by native
speakers.** No paid translation service was used. No licensed names were invented.

- [AUDIT.md](AUDIT.md): infrastructure, counts and China risks, written before implementation.
- [ACCEPTANCE-CRITERIA.md](ACCEPTANCE-CRITERIA.md): C1–C7, invariants I1–I4.
- [GLOSSARY-ES-ZH.md](GLOSSARY-ES-ZH.md): terms to use and points for the native review.
- [COVERAGE.md](COVERAGE.md): coverage per language and what is missing.

Invariant: the language is display-only. The engine stores canonical Italian; `ENGINE_VERSION`
(2.24), RNG, fingerprints and saves are identical in all four languages, including after a
mid-career switch (`src/lib/pivot/i18n-es-zh.test.ts`, `e2e/i18n-es-zh.spec.ts`).

China external dependencies (HYPOTHESIS, not verified, nothing changed): see AUDIT.md. CSP,
Vercel settings and ads (OFF by default) are untouched.
