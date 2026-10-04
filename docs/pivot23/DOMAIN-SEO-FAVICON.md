# DOMAIN, SEO, FAVICON — 2026-10-04

Verifica live, senza deploy.

## Domini

Progetto Vercel `pivot23` (`prj_UVO3b4CL0KrVXJXelzxJMf3Wuq3o`).

| Host | Osservato |
|---|---|
| pivot23.com | 308 verso `https://www.pivot23.com/` |
| www.pivot23.com | 200, HTML del gioco, CSP e HSTS presenti |
| pivot23.vercel.app | alias, stesso titolo |

Certificato HTTPS valido lato risposta HTTP/2. Non ispezionato il certificato a parte.

## Favicon

`GET /favicon.ico` → 200, `content-type: image/vnd.microsoft.icon`, non HTML. Icone PNG e manifest 200. Il globo citato prima della PR #44 non è stato rivisto come assente da Google: Google non è stato interrogato e non promette tempi.

## Mancava in produzione

- `robots.txt` → 404.
- sitemap assente.
- canonical e Open Graph assenti nell'HTML servito.

Aggiunti in questa PR, non ancora in produzione: `public/robots.txt`, `public/sitemap.xml`, canonical e tag OG in `index.html`. Il sitemap elenca solo la home.

## Search Console

Non accessibile. Checklist, non eseguita: proprietà del dominio, ispezione URL, richiesta di nuova scansione dopo il deploy della PR.
