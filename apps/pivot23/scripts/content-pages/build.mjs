#!/usr/bin/env node
/**
 * Static content pages for www.pivot23.com (guide, FAQ, about, blog, legal), IT primary + EN.
 *
 *   node scripts/content-pages/build.mjs           -> writes public/<route>/index.html and public/site/site.css
 *   node scripts/content-pages/build.mjs --check   -> exit 1 if the committed files differ from the sources
 *
 * Sources: content/{it,en}/**.md. Output is plain HTML with no JavaScript at all, so crawlers and
 * readers without JS get the full text, and the production CSP (script-src 'self') is untouched.
 * Vite copies public/ verbatim into dist/, so the game build and the engine are not involved.
 * Placeholders such as [TITOLARE] are kept visible on purpose: they must be filled by the owner.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = join(APP, "content");
const PUBLIC = join(APP, "public");
export const SITE = "https://www.pivot23.com";

const UI = {
  it: {
    play: "Gioca", playNow: "Gioca a PIVOT 23", guide: "Guida", blog: "Blog", faq: "FAQ", about: "Chi siamo",
    contact: "Contatti", privacy: "Informativa privacy", cookie: "Cookie Policy", terms: "Termini d'uso",
    menu: "Menu", skip: "Vai al contenuto", game: "Gioco", info: "Info", home: "Home",
    read: (n) => `${n} min di lettura`, allPosts: "Tutti gli articoli", morePosts: "Altri articolo dal blog",
    blogTitle: "Blog: basket, carriere e game design",
    blogLede: "Articoli originali per chi gioca a PIVOT 23 e per chi vuole capire meglio come si costruisce una carriera nel basket e come si progetta un gioco di simulazione.",
    blogDesc: "Articoli originali su basket, sviluppo dei giocatori, statistiche e game design, dalla redazione di PIVOT 23.",
    tagline: "Il simulatore di carriera nel basket che si gioca nel browser. Ogni scelta scrive una storia diversa.",
    disclaimer: "PIVOT 23 è un gioco di simulazione di fantasia. Non è affiliato, approvato o sponsorizzato da alcuna lega, squadra o giocatore. Nomi di squadre e competizioni sono usati solo a scopo descrittivo; statistiche, giocatori e risultati sono simulati.",
    draft: "Bozza da completare. I campi tra parentesi quadre e le voci DA VERIFICARE devono essere compilati dal titolare e verificati da un legale prima della pubblicazione.",
    other: "English", ctaTitle: "Pronto a iniziare?", ctaBody: "Crea il tuo giocatore e scopri fin dove arriva la sua carriera. Si gioca nel browser, senza account.",
    by: "Redazione PIVOT 23", lang: "Lingua", nav: "Principale", foot: "Pagine del sito",
  },
  en: {
    play: "Play", playNow: "Play PIVOT 23", guide: "Guide", blog: "Blog", faq: "FAQ", about: "About",
    contact: "Contact", privacy: "Privacy Policy", cookie: "Cookie Policy", terms: "Terms of use",
    menu: "Menu", skip: "Skip to content", game: "Game", info: "Info", home: "Home",
    read: (n) => `${n} min read`, allPosts: "All articles", morePosts: "More from the blog",
    blogTitle: "Blog: basketball, careers and game design",
    blogLede: "Original articles for PIVOT 23 players and for anyone who wants to understand how a basketball career is built and how a simulation game is designed.",
    blogDesc: "Original articles about basketball, player development, statistics and game design from the PIVOT 23 team.",
    tagline: "The basketball career simulator you play in your browser. Every choice writes a different story.",
    disclaimer: "PIVOT 23 is a fictional simulation game. It is not affiliated with, endorsed or sponsored by any league, team or player. Team and competition names are used for descriptive purposes only; statistics, players and results are simulated.",
    draft: "Draft to be completed. Fields in square brackets and items marked DA VERIFICARE must be filled in by the owner and reviewed by a lawyer before publication.",
    other: "Italiano", ctaTitle: "Ready to start?", ctaBody: "Create your player and find out how far the career goes. Played in the browser, no account needed.",
    by: "PIVOT 23 team", lang: "Language", nav: "Main", foot: "Site pages",
  },
};
UI.it.morePosts = "Altri articoli dal blog";

const BLOG_TAGS = {
  it: ["Percorsi", "Fondamentali", "Carriera", "Salute", "Ruoli", "Game design", "Statistiche", "Eredità"],
  en: ["Paths", "Fundamentals", "Career", "Health", "Roles", "Game design", "Stats", "Legacy"],
};
const BLOG = {
  it: [
    "01-tre-strade-verso-il-professionismo", "02-fondamentali-che-contano", "03-il-picco-di-carriera", "04-infortuni-e-recupero",
    "05-ruoli-nel-basket-moderno", "06-game-design-scelte-difficili", "07-leggere-le-statistiche", "08-ritiro-ed-eredita",
  ],
  en: [
    "01-three-roads-to-the-pros", "02-fundamentals-that-matter", "03-the-career-peak", "04-injuries-and-recovery",
    "05-roles-in-modern-basketball", "06-game-design-hard-choices", "07-reading-the-stats", "08-retirement-and-legacy",
  ],
};

/** key -> route per language. Same key = translations of each other (hreflang). */
const PAGES = [
  { key: "about", it: ["/chi-siamo/", "it/chi-siamo.md"], en: ["/en/about/", "en/about.md"] },
  { key: "guide", it: ["/guida/", "it/guida.md"], en: ["/en/guide/", "en/guide.md"] },
  { key: "faq", it: ["/faq/", "it/faq.md"], en: ["/en/faq/", "en/faq.md"] },
  { key: "contact", it: ["/contatti/", "it/contatti.md"], en: ["/en/contact/", "en/contact.md"] },
  { key: "privacy", legal: true, it: ["/privacy/", "it/privacy.md"], en: ["/en/privacy/", "en/privacy.md"] },
  { key: "cookie", legal: true, it: ["/cookie/", "it/cookie.md"], en: ["/en/cookies/", "en/cookies.md"] },
  { key: "terms", legal: true, it: ["/termini/", "it/termini.md"], en: ["/en/terms/", "en/terms.md"] },
  ...BLOG.it.map((_, i) => ({
    key: `post-${i + 1}`,
    post: i,
    it: [`/blog/${BLOG.it[i].slice(3)}/`, `it/blog/${BLOG.it[i]}.md`],
    en: [`/en/blog/${BLOG.en[i].slice(3)}/`, `en/blog/${BLOG.en[i]}.md`],
  })),
];
const ROUTES = {
  it: Object.fromEntries(PAGES.map((p) => [p.key, p.it[0]])),
  en: Object.fromEntries(PAGES.map((p) => [p.key, p.en[0]])),
};
ROUTES.it.blog = "/blog/";
ROUTES.en.blog = "/en/blog/";

// ---------- tiny markdown (headings, paragraphs, lists, tables, bold, code, links) ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const PLACEHOLDER = /\[((?:[A-ZÀ-Ý]{2,}|DPO|RPD)[^\]]*)\]/g;
export const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function inline(src) {
  // Split out code spans first so nothing inside them is touched.
  return src
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (/^`[^`]+`$/.test(part)) return `<code>${esc(part.slice(1, -1))}</code>`;
      const links = [];
      let s = part.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
        links.push([text, href]);
        return `\uE000${links.length - 1}\uE000`;
      });
      s = esc(s);
      s = s.replace(/(https?:\/\/[^\s<)]+[^\s<).,;:])/g, (u) => `<a href="${u}" rel="noopener">${u}</a>`);
      s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(PLACEHOLDER, (m) => `<mark class="ph">${m}</mark>`);
      s = s.replace(/DA VERIFICARE/g, '<mark class="ph">DA VERIFICARE</mark>').replace(/<mark class="ph">(\[[^\]]*)<mark class="ph">DA VERIFICARE<\/mark>/g, '<mark class="ph">$1DA VERIFICARE');
      return s.replace(/\uE000(\d+)\uE000/g, (_, i) => {
        const [text, href] = links[Number(i)];
        return `<a href="${esc(href)}">${esc(text)}</a>`;
      });
    })
    .join("");
}

export function markdown(text) {
  const lines = text.split("\n");
  const out = [];
  let title = "";
  let list = null;
  let table = null;
  const close = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
    if (table) {
      const [head, ...rows] = table;
      out.push(
        `<div class="table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") +
          "</tbody></table></div>",
      );
      table = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\|.*\|$/.test(line)) {
      if (list) {
      out.push(`</${list}>`);
      list = null;
    }
      const cells = line.slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{3,}:?$/.test(c))) continue;
      (table ??= []).push(cells);
      continue;
    }
    if (table) close();
    let m;
    if ((m = /^# (.*)$/.exec(line))) {
      close();
      title = m[1];
    } else if ((m = /^(#{2,3}) (.*)$/.exec(line))) {
      close();
      const tag = m[1].length === 2 ? "h2" : "h3";
      out.push(`<${tag} id="${slugify(m[2])}">${inline(m[2])}</${tag}>`);
    } else if ((m = /^(- |\d+\. )(.*)$/.exec(line))) {
      const tag = m[1] === "- " ? "ul" : "ol";
      if (list !== tag) {
        if (list) out.push(`</${list}>`);
        out.push(`<${tag}>`);
        list = tag;
      }
      out.push(`<li>${inline(m[2])}</li>`);
    } else if (line.trim() === "") {
      close();
    } else {
      if (list) {
      out.push(`</${list}>`);
      list = null;
    }
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  close();
  return { title, html: out.join("\n") };
}

export const plainText = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
export const words = (s) => s.split(/\s+/).filter(Boolean).length;
const firstParagraph = (md) => md.split("\n").find((l) => l && !/^[#|>-]|^\d+\.|^(Ultimo aggiornamento|Last updated)/.test(l)) ?? "";
function describe(md, max = 158) {
  const s = plainText(inline(firstParagraph(md))).replace(/\*\*/g, "");
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max - 1)) + "…";
}

// ---------- layout ----------
const LOGO = `<svg class="logo" viewBox="0 0 80 80" aria-hidden="true" focusable="false"><circle cx="40" cy="40" r="34.6" fill="none" stroke="currentColor" stroke-width="5.4"/><g fill="none" stroke="currentColor" stroke-width="3.15" stroke-linecap="round"><path d="M22.2 22.4 A22.2 22.2 0 0 1 57.8 22.4"/><path d="M57.8 57.6 A22.2 22.2 0 0 1 22.2 57.6"/></g><line x1="4.2" y1="40" x2="16.6" y2="40" stroke="currentColor" stroke-width="4.4"/><line x1="63.4" y1="40" x2="75.8" y2="40" stroke="currentColor" stroke-width="4.4"/><text x="40" y="41.5" text-anchor="middle" dominant-baseline="central" font-size="26" font-weight="700" font-family="system-ui, sans-serif">23</text></svg>`;

function layout({ lang, key, route, title, description, body, alternate }) {
  const t = UI[lang];
  const r = ROUTES[lang];
  const other = lang === "it" ? "en" : "it";
  const nav = [
    ["guide", t.guide, r.guide],
    ["blog", t.blog, r.blog],
    ["faq", t.faq, r.faq],
    ["about", t.about, r.about],
  ]
    .map(([k, label, href]) => `<a href="${href}"${k === key || (k === "blog" && key.startsWith("post-")) ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");
  const navLinks = `${nav}<a class="play" href="/">${t.play}</a>`;
  const altLinks = alternate
    ? `<link rel="alternate" hreflang="${lang}" href="${SITE}${route}" />\n<link rel="alternate" hreflang="${other}" href="${SITE}${alternate}" />\n<link rel="alternate" hreflang="x-default" href="${SITE}${lang === "it" ? route : alternate}" />`
    : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="google-adsense-account" content="ca-pub-6076243520452836" />
<title>${esc(title)} · PIVOT 23</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index,follow" />
<meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)" />
<link rel="canonical" href="${SITE}${route}" />
${altLinks}
<meta property="og:title" content="${esc(title)} · PIVOT 23" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${SITE}${route}" />
<meta property="og:type" content="${key.startsWith("post-") ? "article" : "website"}" />
<meta property="og:site_name" content="PIVOT 23" />
<meta property="og:image" content="${SITE}/og-image.png" />
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="stylesheet" href="/site/site.css" />
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header class="site-head">
<div class="wrap head">
<a class="brand" href="/">${LOGO}<span>PIVOT 23</span></a>
<nav class="nav" aria-label="${t.nav}">${navLinks}</nav>
<a class="lang" href="${alternate ?? ROUTES[other].guide}" hreflang="${other}" lang="${other}">${t.other}</a>
<details class="menu"><summary>${t.menu}</summary><nav class="drop" aria-label="${t.nav}">${navLinks}</nav></details>
</div>
</header>
<main id="main">
${body}
</main>
<footer class="site-foot">
<div class="wrap">
<div class="foot-grid">
<div><a class="brand" href="/">${LOGO}<span>PIVOT 23</span></a><p>${t.tagline}</p></div>
<nav aria-label="${t.foot}"><p class="foot-h">${t.game}</p><ul><li><a href="/">${t.playNow}</a></li><li><a href="${r.guide}">${t.guide}</a></li><li><a href="${r.faq}">${t.faq}</a></li><li><a href="${r.blog}">${t.blog}</a></li></ul></nav>
<nav aria-label="${t.info}"><p class="foot-h">${t.info}</p><ul><li><a href="${r.about}">${t.about}</a></li><li><a href="${r.contact}">${t.contact}</a></li><li><a href="${r.privacy}">${t.privacy}</a></li><li><a href="${r.cookie}">${t.cookie}</a></li><li><a href="${r.terms}">${t.terms}</a></li></ul></nav>
</div>
<p class="disclaimer">${t.disclaimer}</p>
<p class="base">© 2026 PIVOT 23 · www.pivot23.com</p>
</div>
</footer>
</body>
</html>
`;
}

const cta = (t) =>
  `<aside class="cta"><h2>${t.ctaTitle}</h2><p>${t.ctaBody}</p><a class="btn" href="/">${t.playNow}</a></aside>`;

// ---------- build ----------
export function buildAll() {
  const files = new Map();
  const report = [];
  const posts = { it: [], en: [] };
  for (const page of PAGES) {
    for (const lang of ["it", "en"]) {
      const [route, src] = page[lang];
      const md = readFileSync(join(CONTENT, src), "utf8");
      const { title, html } = markdown(md);
      const t = UI[lang];
      const alternate = page[lang === "it" ? "en" : "it"][0];
      let body;
      const crumbs = (extra) => `<nav class="crumb" aria-label="Breadcrumb"><a href="/">${t.home}</a> / ${extra}</nav>`;
      if (page.post !== undefined) {
        const minutes = Math.max(1, Math.round(words(plainText(html)) / 200));
        const tag = BLOG_TAGS[lang][page.post];
        posts[lang].push({ route, title, tag, minutes, excerpt: describe(md, 170) });
        body = `<article class="wrap prose">${crumbs(`<a href="${ROUTES[lang].blog}">${t.blog}</a>`)}<p class="kicker">${tag}</p><h1>${inline(title)}</h1><p class="meta">${t.by} · ${t.read(minutes)}</p>\n${html}\n${cta(t)}</article>`;
      } else {
        const notice = page.legal ? `<p class="draft-note" role="note">${t.draft}</p>` : "";
        body = `<article class="wrap prose">${crumbs(esc(title.split(" — ")[0]))}<h1>${inline(title)}</h1>${notice}\n${html}\n${page.legal ? "" : cta(t)}</article>`;
      }
      const description = page.key === "guide" || page.key === "faq" || page.key === "about" || page.key === "contact" || page.post !== undefined ? describe(md) : `${title.split(" — ")[0]}: PIVOT 23 (www.pivot23.com).`;
      const out = layout({ lang, key: page.key, route, title: title.split(" — ")[0], description, body, alternate });
      files.set(join(PUBLIC, route, "index.html"), out);
      report.push({ route, lang, words: words(plainText(html)), legal: Boolean(page.legal) });
    }
  }
  for (const lang of ["it", "en"]) {
    const t = UI[lang];
    const list = posts[lang]
      .map((p) => `<li class="card"><p class="kicker">${p.tag}</p><h2><a href="${p.route}">${inline(p.title)}</a></h2><p>${inline(p.excerpt)}</p><p class="meta">${t.read(p.minutes)}</p></li>`)
      .join("\n");
    const route = ROUTES[lang].blog;
    const body = `<div class="wrap">${`<nav class="crumb" aria-label="Breadcrumb"><a href="/">${t.home}</a> / ${t.blog}</nav>`}<h1>${t.blogTitle}</h1><p class="lede">${t.blogLede}</p><ul class="cards">\n${list}\n</ul>${cta(t)}</div>`;
    files.set(join(PUBLIC, route, "index.html"), layout({ lang, key: "blog", route, title: t.blogTitle, description: t.blogDesc, body, alternate: ROUTES[lang === "it" ? "en" : "it"].blog }));
    report.push({ route, lang, words: words(plainText(body)), legal: false });
  }
  files.set(join(PUBLIC, "site", "site.css"), readFileSync(join(APP, "scripts", "content-pages", "site.css"), "utf8"));
  files.set(join(PUBLIC, "sitemap.xml"), sitemap(report.map((r) => r.route)));
  return { files, report };
}

function sitemap(routes) {
  const all = ["/", ...routes.sort((a, b) => (a.startsWith("/en/") === b.startsWith("/en/") ? a.localeCompare(b) : a.startsWith("/en/") ? 1 : -1))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map((r) => `  <url>\n    <loc>${SITE}${r}</loc>\n  </url>`).join("\n")}\n</urlset>\n`;
}

export function placeholders() {
  const found = new Map();
  for (const page of PAGES)
    for (const lang of ["it", "en"]) {
      const md = readFileSync(join(CONTENT, page[lang][1]), "utf8");
      for (const m of md.matchAll(PLACEHOLDER)) {
        const k = m[0];
        if (!found.has(k)) found.set(k, new Set());
        found.get(k).add(page[lang][0]);
      }
      const dv = (md.match(/DA VERIFICARE/g) ?? []).length;
      if (dv) {
        if (!found.has("DA VERIFICARE")) found.set("DA VERIFICARE", new Set());
        found.get("DA VERIFICARE").add(`${page[lang][0]} (${dv})`);
      }
    }
  return found;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { files, report } = buildAll();
  if (process.argv.includes("--check")) {
    const stale = [...files].filter(([path, body]) => !existsSync(path) || readFileSync(path, "utf8") !== body).map(([p]) => p.replace(APP + "/", ""));
    if (stale.length) {
      console.error(`✗ content pages out of date, run: node scripts/content-pages/build.mjs\n${stale.join("\n")}`);
      process.exit(1);
    }
    console.log(`✓ ${files.size} content files up to date`);
  } else {
    for (const [path, body] of files) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body);
    }
    for (const r of report) console.log(`${r.route.padEnd(52)} ${String(r.words).padStart(5)} words${r.legal ? "  (legal draft)" : ""}`);
    console.log(`wrote ${files.size} files`);
  }
  if (process.argv.includes("--placeholders"))
    for (const [k, v] of placeholders()) console.log(`${k}  ->  ${[...v].join(", ")}`);
}
