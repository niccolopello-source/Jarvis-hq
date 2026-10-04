// Dev tool: rewrites src/lib/pivot/narrative/catalog-en.ts to merge every file in ./en.
import { readdirSync, writeFileSync } from "node:fs";
const dir = "src/lib/pivot/narrative/en";
const mods = readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => f.replace(/\.ts$/, "")).sort();
const name = (m) => "EN_" + m.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
writeFileSync(
  "src/lib/pivot/narrative/catalog-en.ts",
  `/** English narrative catalog: Italian source key -> English, merged from ./en (one file per source module). */\n` +
    mods.map((m) => `import { ${name(m)} } from "./en/${m}.ts";`).join("\n") +
    `\n\nexport const NARRATIVE_EN: Readonly<Record<string, string>> = {\n` +
    mods.map((m) => `  ...${name(m)},`).join("\n") +
    `\n};\n`,
);
console.log(mods.length);
