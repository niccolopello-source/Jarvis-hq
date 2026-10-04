// Dev tool: writes /tmp/i18n/work-<module>.txt with every catalog key still missing an English value.
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { extractFile } from "../src/lib/pivot/narrative/extract.ts";
import { NARRATIVE_EN } from "../src/lib/pivot/narrative/catalog-en.ts";
import { NOT_PROSE } from "../src/lib/pivot/narrative/not-prose.ts";
const files = [
  ...readdirSync("src/lib/pivot").filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !/^(i18n|labels|proc-text)\.ts$/.test(f)).map((f) => `src/lib/pivot/${f}`),
  ...readdirSync("src/components/pivot").filter((f) => /\.tsx?$/.test(f) && !f.includes(".test.")).map((f) => `src/components/pivot/${f}`),
];
mkdirSync("/tmp/i18n", { recursive: true });
const done = new Set<string>([...Object.keys(NARRATIVE_EN), ...NOT_PROSE]);
const NAME = /^(?:[A-Z][\p{L}'’.-]+|[A-Z]{2,4}|\d+)(?: (?:[A-Z][\p{L}'’.-]+|[A-Z]{2,4}|\d+|de|van|da|di))+$/u;
const ITALIAN_CAPS = /\b(Finali?|Semifinal[ei]|Quarti|Primo|Coppa|Campion[ei]|Stagione|Premio|Miglior|Scelta|Il|La|Lo|Le|Gli|Un|Una|Dentro|Fuori|Eurolega|Albo|Squadra|Giocatore|Ala|Guardia|Centro|Est|Ovest)\b/;
let total = 0;
const names: string[] = [];
for (const f of files) {
  const mod = f.split("/").pop()!.replace(/\.tsx?$/, "");
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const x of extractFile(f)) {
    if (done.has(x.key) || seen.has(x.key)) continue;
    seen.add(x.key);
    if (NAME.test(x.key) && !ITALIAN_CAPS.test(x.key)) {
      names.push(x.key);
      continue;
    }
    const hints = [...x.source.matchAll(/\$\{([^}]*)\}/g)].map((m, i) => `{${i}}=${m[1]!.replace(/\s+/g, " ").slice(0, 40)}`).join(" ");
    lines.push(`${x.key}${hints ? `\t⟨${hints}⟩` : ""}`);
  }
  total += lines.length;
  if (lines.length) writeFileSync(`/tmp/i18n/work-${mod}.txt`, lines.map((l, i) => `${i + 1}\t${l}`).join("\n") + "\n");
}
writeFileSync("/tmp/i18n/names.txt", [...new Set(names)].join("\n") + "\n");
console.log({ total, names: new Set(names).size });
