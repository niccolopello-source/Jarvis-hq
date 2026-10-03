# PIVOT 23 — Security headers (D-13) and Vercel notes (D-21)

## Where

`apps/pivot23/vercel.json`. It applies only if the Vercel project **pivot23** builds with Root Directory `apps/pivot23` (framework preset Vite, as reported by the project settings). **Check this in the Vercel dashboard before merging**: if the root directory is the repository root, the file is ignored and must move.

## Headers

| Header | Value | Why |
|---|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` | Built from what the bundle actually loads: one module script and CSS from `/assets`, inline `<style>` in `index.html` and React `style=` attributes (hence `'unsafe-inline'` for styles only), SVG `data:` URIs. No third-party origins, no fetch to other hosts, no inline script, no eval. |
| X-Content-Type-Options | `nosniff` | |
| X-Frame-Options | `DENY` | legacy twin of `frame-ancestors 'none'` |
| Referrer-Policy | `strict-origin-when-cross-origin` | |
| Permissions-Policy | camera, microphone, geolocation, payment, usb, interest-cohort, browsing-topics all `()` | |
| Cross-Origin-Opener-Policy | `same-origin` | |
| Cache-Control on `/assets/*` | `public, max-age=31536000, immutable` | file names are content-hashed |

HSTS is already sent by Vercel on the custom domain (`max-age=63072000`, observed 2026-10-03).

## Things that will need a CSP change

- **Ads / analytics / Totem** (see MONETIZATION and ANALYTICS docs): each provider origin must be added to `script-src`, `connect-src`, `img-src`, `frame-src`. Do it in the same PR that adds the provider.
- **Vercel preview toolbar / comments** inject `https://vercel.live` scripts on preview deployments. With this CSP the toolbar is blocked on previews (the game works). If the team uses the toolbar, add `https://vercel.live` to `script-src`, `connect-src`, `frame-src` for previews only, or accept the loss.
- Vercel Web Analytics / Speed Insights would need `/_vercel/insights` (same origin, already allowed) — no change.

## How it is verified

- `vite.config.ts` serves the same headers on `vite preview`; Playwright with `E2E_PREVIEW=1` (used in CI) runs the whole e2e suite under the CSP, including a `securitypolicyviolation` listener through the career tabs. Result on 2026-10-03: all pass, no violations.
- `pnpm check:headers` validates `vercel.json`; `node scripts/check-headers.mjs https://<deployment>/` compares live headers (GET only). Run it on the preview deployment of the PR, then on production after deploy.

## D-21 — the second Vercel project `jarvis-hq`

Every push to this repository also builds a Vercel project named **jarvis-hq** (observed: preview deployments for each commit of `grokbot/demo-stability`, and a production deployment for the merge of PR #26, alongside **pivot23**). It doubles build minutes and creates a second public URL for the same code.

Recommendation (owner decision, not done here): confirm what `jarvis-hq` serves. If it is not needed, disconnect its Git integration or set an Ignored Build Step (`exit 0`) for it; if it is needed, give it its own root directory so it does not rebuild PIVOT 23 on every change. No Vercel setting was changed in this work.
