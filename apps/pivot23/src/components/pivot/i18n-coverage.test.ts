import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Guards the D-07 rule: interface chrome in the components goes through t()/tf().
 * Narrative written into the saved log (engine flavour, story beats) stays Italian by design
 * and is listed here explicitly, so any new hard-coded Italian UI string fails this test.
 */
const NARRATIVE_EXCEPTIONS = [
  "La pagina si è persa. Si va avanti.",
  "Il Draft si avvicina.",
  "Il mestiere si è mosso",
  "La dirigenza ha deciso: da",
  "Un'altra stagione.",
];

const ITALIAN = /(^|[^\p{L}])(il|lo|la|le|gli|di|che|non|una|un|sei|nel|della|alla|con|ancora|anni|stagione|scelta|carriera|squadra|tuo|tua|qui|dopo|prima|nessuna?|nessuno|è)(?=$|[^\p{L}])/iu;
const LITERAL = /<\w[^>]*>([^<>{}]+)<|(?:title|aria-label|placeholder|label|detail|sub|alt)="([^"]+)"|(?:title|label|detail|subtitle|body|pick|result|flavor):\s*[`"]([^`"]+)[`"]/g;

test("component chrome has no hard-coded Italian outside the narrative list", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const offenders: string[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".tsx"))) {
    const lines = readFileSync(join(dir, file), "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(LITERAL)) {
        const text = (m[1] ?? m[2] ?? m[3] ?? "").trim();
        if (!text || !ITALIAN.test(text)) continue;
        if (NARRATIVE_EXCEPTIONS.some((ok) => text.includes(ok))) continue;
        offenders.push(`${file}:${i + 1} ${text.slice(0, 80)}`);
      }
    });
  }
  assert.deepEqual(offenders, []);
});
