/** Read existing worktrees only; capture source/probe/raw provenance and each actual exit. */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  createReadStream,
  statSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const [baselineArg, outArg, ...extras] = process.argv.slice(2);
const mode = extras.includes("--allow-diagnostic-changes")
  ? "--allow-diagnostic-changes"
  : null;
const pr152Arg = extras.find((a) => !a.startsWith("--"));
if (extras.some((a) => a.startsWith("--") && a !== mode))
  throw new Error("unknown runner flag");
if (!baselineArg || !outArg)
  throw new Error(
    "usage: run.mjs BASELINE_APP_ROOT OUT_DIR [PR152_APP_ROOT] [--allow-diagnostic-changes]",
  );
const here = dirname(fileURLToPath(import.meta.url));
const draft = resolve(here, "../.."),
  baseline = resolve(baselineArg),
  out = resolve(outArg);
mkdirSync(out, { recursive: true });
const hash = (v) => createHash("sha256").update(v).digest("hex");
function command(bin, args, cwd) {
  const r = spawnSync(bin, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.status !== 0)
    throw new Error(`${bin} exited ${r.status}: ${r.stderr || r.stdout}`);
  return r.stdout.trim();
}
function source(root) {
  const files = command(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "src",
      "scripts/compatibility",
      "package.json",
      "pnpm-lock.yaml",
    ],
    root,
  )
    .split("\n")
    .filter(Boolean)
    .sort();
  const hashes = Object.fromEntries(
    files.map((p) => [p, hash(readFileSync(resolve(root, p)))]),
  );
  return {
    head: command("git", ["rev-parse", "HEAD"], root),
    committedTree: command("git", ["rev-parse", "HEAD^{tree}"], root),
    workingChanges: command("git", ["status", "--short"], root),
    sourceSha256: hash(JSON.stringify(hashes)),
    files: hashes,
  };
}
const now = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Rome",
    dateStyle: "short",
    timeStyle: "long",
  }).format(new Date()) + " Europe/Rome";
if (command("git", ["status", "--porcelain"], baseline))
  throw new Error("baseline must have a clean worktree");
const mainSha = command("git", ["rev-parse", "HEAD"], baseline);
if (mainSha !== "33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f")
  throw new Error("baseline must be pinned main 33810f7");
command(
  "git",
  [
    "merge-base",
    "--is-ancestor",
    "3393f524fd32c3f1b9a42a9341e7c9295ba54a03",
    "HEAD",
  ],
  draft,
);
const manifest = {
  baseline: mainSha,
  draft: command("git", ["rev-parse", "HEAD"], draft),
  node: process.version,
  pnpm: command("pnpm", ["--version"], draft),
  startedEuropeRome: now(),
  comparisonMode: mode ?? "strict",
  versions: Array.from({ length: 13 }, (_, i) => `2.${12 + i}.0-beta`),
  scenariosPerVersion: 24,
  seedFormula:
    "61200 + index*97; paths NCAA/Europa/G-League, difficulties esordio/pro/allstar/leggenda, policy first/last",
  normalization:
    "none; fixed synthetic careerId before checksums, fixed Date.now input; JSON boundary includes all serializable opts and job n, function choice policy explicit in id",
  probeSha256: Object.fromEntries(
    [
      "run.mjs",
      "worker.ts",
      "phases-worker.ts",
      "world-compaction-probe.mjs",
      "compare.mjs",
      "json-diff.mjs",
    ].map((p) => [p, hash(readFileSync(resolve(here, p)))]),
  ),
  sources: {},
  runs: [],
  outputs: {},
};
const targets = [
  ["main", baseline],
  ["draft", draft],
];
if (pr152Arg) {
  const root = resolve(pr152Arg);
  if (command("git", ["status", "--porcelain"], root))
    throw new Error("PR152 must be clean");
  manifest.pr152 = command("git", ["rev-parse", "HEAD"], root);
  if (manifest.pr152 !== "490bc861f44a48d9b22cdf1aec63bf8c30ec0705")
    throw new Error("PR152 must be pinned 490bc86");
  targets.push(["pr152", root]);
}
for (const [name, root] of targets) manifest.sources[name] = source(root);
function save() {
  writeFileSync(
    resolve(out, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}
function run(name, args, cwd) {
  console.log(`Running ${name}`);
  const started = now(),
    r = spawnSync(process.execPath, args, {
      cwd,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
  writeFileSync(resolve(out, `${name}.stdout.log`), r.stdout ?? "");
  writeFileSync(resolve(out, `${name}.stderr.log`), r.stderr ?? "");
  manifest.runs.push({
    name,
    args,
    started,
    finished: now(),
    exitCode: r.status,
    signal: r.signal,
    error: r.error?.message,
  });
  save();
  if (r.status !== 0) throw new Error(`${name} exited ${r.status}`);
}
async function capture(file) {
  const p = resolve(out, file),
    h = createHash("sha256");
  for await (const chunk of createReadStream(p)) h.update(chunk);
  manifest.outputs[file] = { sha256: h.digest("hex"), bytes: statSync(p).size };
  save();
}
save();
try {
  for (const [name, root] of targets)
    for (const [worker, suffix] of [
      ["worker.ts", ""],
      ["phases-worker.ts", "-phases"],
      ["world-compaction-probe.mjs", "-compaction"],
    ]) {
      const file = `${name}${suffix}.jsonl.gz`;
      run(
        `${name}${suffix}`,
        ["--import=tsx", resolve(here, worker), root, resolve(out, file)],
        root,
      );
      await capture(file);
    }
  for (const [name] of targets.filter(([name]) => name !== "main"))
    for (const suffix of ["", "-phases", "-compaction"]) {
      const prefix = `comparison-${name}${suffix}`;
      run(
        prefix,
        [
          resolve(here, "compare.mjs"),
          resolve(out, `main${suffix}.jsonl.gz`),
          resolve(out, `${name}${suffix}.jsonl.gz`),
          resolve(out, prefix),
          ...(mode ? [mode] : []),
        ],
        draft,
      );
      for (const ext of [
        "summary.json",
        "checkpoints.jsonl",
        "resume.jsonl",
        "mismatches.json",
      ])
        await capture(`${prefix}-${ext}`);
    }
  manifest.outcome =
    "PASS comparison policy gate (see separate full-memory/diagnostic statuses)";
} catch (e) {
  manifest.outcome = "FAIL";
  throw e;
} finally {
  manifest.finishedEuropeRome = now();
  save();
}
