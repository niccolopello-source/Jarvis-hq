// Dev probe: plays N careers (argv[3], default 8) plus the story pool through the English catalog and reports misses/leaks. Run: node --import=tsx scripts/i18n-probe.ts - 40
import { buildCatalog, translateWith } from "../src/lib/pivot/narrative/translate.ts";
import { NARRATIVE_EN } from "../src/lib/pivot/narrative/catalog-en.ts";
import { playCareerTexts, storyPoolTexts } from "../src/lib/pivot/narrative/harness.ts";
import { IT_PROSE } from "../src/lib/pivot/narrative/markers.ts";
const cat = buildCatalog(NARRATIVE_EN);
const n = Number(process.argv[3] ?? 8);
const seen = [...storyPoolTexts(), ...Array.from({ length: n }, (_, k) => k).flatMap((k) => playCareerTexts(1000 + k, (["esordio", "pro", "allstar", "leggenda"] as const)[k % 4]))];
const miss = new Map<string, string>();
const leak = new Map<string, string>();
let ok = 0;
const t0 = Date.now();
for (const s of seen) {
  const r = translateWith(cat, s.text, IT_PROSE);
  if (r.ok) ok++;
  else miss.set(s.text, s.where);
  if (r.ok && IT_PROSE.test(r.text)) leak.set(s.text, r.text);
}
console.log({ total: seen.length, ok, missUnique: miss.size, leak: leak.size, ms: Date.now() - t0 });
for (const [t, w] of [...miss].slice(0, Number(process.argv[2] ?? 60))) console.log("MISS", w, "|", t.slice(0, 220));
for (const [t, w] of [...leak].slice(0, 30)) console.log("LEAK", t.slice(0, 120), "=>", w.slice(0, 160));
