# Engine and web metrics: re-measure on main 800a240 (2026-10-24)

Owner: Grok Bot (Jarvis). Read-only measurement: no engine, tuning or production change. Branch `grokbot/metrics-800a240`, cut from `800a2402af81f747b15f92a371f14f441875c31e` (ENGINE_VERSION 2.22.0-beta).

## Method (reproducible)
- Script: `apps/pivot23/scripts/measure-metrics.ts` (added in this branch, not in CI). Run it from `apps/pivot23` with `node --import=tsx scripts/measure-metrics.ts <seedBase> 1000 <out.json>`.
- Seed sets:
  - **A** = 910000–910999 (the same audit seeds as OVR-BALANCE-2.20.md);
  - **B** = 920000–920999.
  - Each set has 1000 careers per difficulty and per policy, so 16,000 careers in total.
- Each career uses role i%5, path i%3, nationality ITA and `draft: "random"`. It is created at the current engine version (2.22.0-beta).
- Policies:
  - **random**: the engine sim default, which takes the drawn choice on every card and plays 36.
  - **prudent**: picks "Percorso prudente" whenever a card offers it, and the drawn choice otherwise. On set A that was 1117/1158/1029/939 cards (Esordio/Pro/All-Star/Leggenda).
- Metrics:
  - **Peak OVR**: the highest displayed OVR (`displayOverall`) over the season rows.
  - **Peak age**: the age of the first season at that peak.
  - **Last season 29–32**: `careerEndAge` falls in 29..32.
  - **Touches the 48 floor**: any season row with displayed OVR ≤ 48.
- Intervals:
  - proportions use Wilson 95%;
  - medians use a distribution-free 95% CI from binomial order statistics.
- Raw output: `docs/pivot23/metrics-800a240/A-910000.json`, `B-920000.json`.

## Results: set A / set B (95% interval in brackets)
| Metric | Esordio | Pro | All-Star | Leggenda |
|---|---|---|---|---|
| random · Peak OVR median | 74 [73–74] / 74 [73–74] | 71 [71–72] / 71 [71–72] | 68 [67–69] / 68 [68–69] | 67 [66–68] / 67 [67–68] |
| random · Peak age median | 27 [27–27] / 27 [27–27] | 27 [27–27] / 27 [27–27] | 27 [27–27] / 27 [27–27] | 27 [27–27] / 27 [27–27] |
| random · Last season 29–32 /1000 | 15 [9–25] / 12 [7–21] | 303 [275–332] / 320 [292–350] | 302 [274–331] / 306 [278–335] | 314 [286–343] / 311 [283–340] |
| random · Touches 48 floor | 20.7% [18.3–23.3] / 20.5% [18.1–23.1] | 25.0% [22.4–27.8] / 24.2% [21.6–27.0] | 37.0% [34.1–40.0] / 36.2% [33.3–39.2] | 39.5% [36.5–42.6] / 39.1% [36.1–42.2] |
| prudent · Peak OVR median | 74 [73–74] / 74 [73–75] | 71 [71–72] / 72 [71–72] | 68 [68–69] / 68 [68–69] | 67 [66–68] / 67 [67–68] |
| prudent · Peak age median | 27 [27–27] / 27 [27–27] | 27 [27–27] / 27 [27–27] | 27 [27–27] / 27 [27–27] | 27 [27–27] / 27 [27–27] |
| prudent · Last season 29–32 /1000 | 0 [0–4] / 0 [0–4] | 53 [41–69] / 48 [36–63] | 115 [97–136] / 107 [89–128] | 134 [114–157] / 121 [102–143] |
| prudent · Touches 48 floor | 17.0% [14.8–19.4] / 16.6% [14.4–19.0] | 33.7% [30.8–36.7] / 32.1% [29.3–35.1] | 46.8% [43.7–49.9] / 46.8% [43.7–49.9] | 49.6% [46.5–52.7] / 49.7% [46.6–52.8] |

Reading (VERIFIED on these seeds):
- **random play:**
  - Peak median is 74/71/68/67 with peak age 27 on every difficulty, and both seed sets agree within the intervals.
  - Last-season-29–32 sits inside the owner band of 300–340 for Pro, All-Star and Leggenda on both sets. Esordio is 15 and 12, which is within ≤ 20.
- **prudent play:**
  - Always answering "Percorso prudente" cuts early endings sharply (Pro 53/48, All-Star 115/107, Leggenda 134/121 per 1000).
  - It also raises the share of careers that touch the 48 floor (Pro 25.0% → 33.7%, Leggenda 39.5% → 49.6% on set A).
  - So prudence trades early retirement for long, low-OVR tails. This is a design observation (HYPOTHESIS on intent), not a bug claim, and it is for Pello to decide.

## Production smoke (www.pivot23.com, 2026-10-24 13:18 CEST)
`node scripts/prod-smoke.mjs https://www.pivot23.com` (390×844 Chromium) gave:
- HTTP 200;
- the "Inizia" button visible after 539 ms, and setup reached;
- 0 console/page errors and 0 failed requests;
- 6 assets, all 200.

`curl`: www returns 200; the apex returns 308 → https://www.pivot23.com/.

Caveat: another worker was merging PRs into main during this session, so production may already serve a newer deployment than 800a240. The smoke and Lighthouse checks measure whatever www served at the times shown.

## Lighthouse 12.8.2 (www.pivot23.com, headless Chromium 1243 on the box, simulated throttling)
| | Perf | A11y | Best practices | SEO | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|---|---|
| mobile (2026-10-24T11:19:04.326Z) | 90 | 100 | 100 | 100 | 2.9 s | 2.9 s | 0 ms | 0 | 2.9 s |
| desktop (2026-10-24T11:19:16.954Z) | 100 | 100 | 100 | 100 | 0.6 s | 0.6 s | 0 ms | 0 | 0.6 s |

These are single runs from a box datacenter network, not field data.

## Perf probe, 4× CPU throttle (local `vite preview` build of 800a240, Chromium headless, 390×844)
`AUDIT_URL=http://127.0.0.1:4192 node scripts/perf-browser.mjs 4` gave:
| Step | Wall ms | Long tasks (count / max / total ms) |
|---|---|---|
| Boot → "Inizia" | 405 | 1 / 131 / 131 |
| Simulated full career | 603 | 3 / 71 / 187 |
| One played season (2 clicks) | 1805 | 0 / 0 / 0 |
| Tab switches | Anno 170, Lega 205, Vita 145, Storia 115, Lega 148, Anno 134 | 4 / 87 / 280 |

The heap was 3.9 MB after boot, 7.8 MB after the sim, and 17.3 MB at the end.

`PERF=1 PERF_RATE=4 E2E_PREVIEW=1 pnpm exec playwright test e2e/perf-probe.spec.ts` passed (2 passed). Its profiles:
- tap Inizia: 183 ms, with one long task of 95 ms;
- story choice: 1587 ms, with long tasks of 108, 56 and 51 ms;
- next card (season sim): 795 ms, with no long tasks.

CPU throttling only approximates a mid-range phone, so it is not a real-device result. Real-device QA stays BLOCKED (R8).

## Not run
- Field data (CrUX/RUM): NOT RUN, because no data source is configured.
- WebKit perf: NOT RUN, because CDP throttling is Chromium-only.
