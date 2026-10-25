/** Scans every player-visible string of harness careers (seeds 500000+i*104729) for broken output. */
import { playCareerTexts } from "../src/lib/pivot/narrative/harness.ts";
const N = Number(process.argv[2] ?? 200);
const rules: [string, RegExp][] = [
  ["undefined/NaN/null", /\b(undefined|NaN|null|Infinity)\b/],
  ["placeholder", /\{[a-zA-Z_]+\}|\$\{/],
  ["fallback team/rival", /\b(la squadra|il rivale)\b(?! (?:che|di|del))/],
  ["double space/punct", / {2}|\.\.(?!\.)|\s[,.;:]/],
  ["lowercase start", /^[a-zà-ù]/],
  ["english leak", /\b(the|and|you|season|team)\b/i],
];
const hits: Record<string, { n: number; ex: string[] }> = {};
let total = 0;
for (const d of ["esordio", "pro", "allstar", "leggenda"] as const)
  for (let i = 0; i < N; i++) {
    const seed = 500000 + i * 104729;
    for (const t of playCareerTexts(seed, d)) {
      total++;
      for (const [k, rx] of rules) if (rx.test(t.text)) {
        const h = (hits[k] ??= { n: 0, ex: [] });
        h.n++;
        if (h.ex.length < 6 && !h.ex.some((e) => e.includes(t.text.slice(0, 40)))) h.ex.push(`${d}/${seed} [${t.where}] ${t.text.slice(0, 160)}`);
      }
    }
  }
console.log(JSON.stringify({ total, hits }, null, 1));
