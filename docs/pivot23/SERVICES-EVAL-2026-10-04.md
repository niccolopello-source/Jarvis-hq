# Services evaluation — 4 October 2026

Nothing in this file is turned on. No new dependency, no spend, no tracker, no account. Prices are what the public pages showed on this date. They are not a quote.

## What the build does today

Guest play. Saves stay in the browser. `FLAGS.account`, `tokens` and `nft` are false. The CSP allows only this origin (`apps/pivot23/vercel.json`). Two desktop rails exist (`ad-rail`), hidden below 1180 px, labelled reserved, with no script and no iframe. `@vercel/analytics` and `@vercel/speed-insights` are not in the app.

## Vercel, measured

Project `pivot23` is on a Hobby plan. Queried 4 October 2026.

- Pageviews for 20 September–4 October 2026: **0 visitors, 0 pageviews**. The API answered. The app does not send the analytics script, so this zero means collection is not happening, not that the site had no visitors.
- Custom events: **402**. The API says they need Pro or Enterprise. Not available on this plan.
- Web Analytics prices read from [vercel.com/docs/analytics/limits-and-pricing](https://vercel.com/docs/analytics/limits-and-pricing) (page dated 25 August 2026): Hobby includes 50,000 events a month and then pauses. Pro is listed at $0.03 per 1,000 events. Web Analytics Plus is listed at $10 a month. A changelog describes a cheaper rate. The pricing page is the figure used here.
- Hobby is for non-commercial personal use ([vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby), 14 September 2026). Ads or a shop on this project are a plan problem, not only a code problem.

## Account, if it is wanted after the demo

Do not build a password system. The guest save stays the path that works with no network.

| Option | What it covers | Cost read on 4 October 2026 | Does not cover |
|---|---|---|---|
| Clerk | Sign-up, sign-in, recovery, deletion, hosted UI | Hobby $0 up to 50,000 retained users per app ([clerk.com/pricing](https://clerk.com/pricing)). Pro is a paid base; the page lists $25 a month, or $20 billed yearly | The career file. A database is still required for sync |
| Supabase Auth + Postgres | The same account actions, plus the rows for a cloud copy | Free quotas from the billing doc (2 October 2026): 50,000 monthly active users, 500 MB database, 5 GB egress, 1 GB storage. A pricing summary citing Supabase on 30 September 2026 lists Pro at $25 a month. Free projects can pause after inactivity | A finished conflict policy. That is still ours to write |

Minimum, either way: email, opaque id, session expiry, logout that does not delete the local save, account deletion that deletes the server copy, export of that copy, no birthday and no precise location. The CSP must be opened only for that provider, in its own change. A local career is never moved until the person asks.

## Cloud sync, not started

Same provider as the account. One row per career: the existing payload, `careerId`, account id, schema version, write time, checksum. If two devices both wrote, keep the newer write and show the other as a recoverable copy. Do not merge two seasons. Do not let the server recompute overall. Cost is the database row above, plus the legal notice, which does not exist yet.

## Ads and Shopify

Shopify is a shop, not an ad network. Its pricing page on 4 October 2026 lists Basic at $39 USD a month, or $29 if billed yearly, and card fees from 2.9% + 30¢. Not part of this demo.

The rails can hold one static sponsor image later, with no third-party script, desktop only, still hidden under 1180 px. A network (AdSense or another) needs a consent tool, `ads.txt`, a CSP change, and a review of the Hobby commercial limit. None of that is approved. The comparison already in `AD-PROVIDER-COMPARISON.md` still stands: no network in this phase.

## Analytics for the closed beta

Do not add a tracker for the beta. The feedback sheet is the measurement.

If, later, pageviews are wanted and approved: Vercel Web Analytics only, no custom events on Hobby, no career id, no player name. The existing event list in `ANALYTICS-EVENT-SPEC.md` stays unsent.

## Date

Account, sync, ads and a shop do not fit the 18 October demo. They need a provider account, a privacy notice, a CSP change, and a phone pass that has not been done. The demo stays guest and local unless the owner moves the date.
