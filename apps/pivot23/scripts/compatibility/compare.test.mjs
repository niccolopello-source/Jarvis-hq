import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
for (const diagnostic of [false, true])
  for (const allow of [false, true])
    test(`comparison ${diagnostic ? "diagnostic" : "supported"} mismatch with explicit allowance=${allow}`, () => {
      const dir = mkdtempSync(join(tmpdir(), "pivot-compare-"));
      try {
        const id = diagnostic
          ? "engine-version/future"
          : "2.24.0-beta/synthetic/final";
        for (const [file, value] of [
          ["main", 1],
          ["draft", 2],
        ])
          writeFileSync(
            join(dir, file + ".gz"),
            gzipSync(JSON.stringify({ id, value }) + "\n"),
          );
        const result = spawnSync(
          process.execPath,
          [
            new URL("./compare.mjs", import.meta.url).pathname,
            join(dir, "main.gz"),
            join(dir, "draft.gz"),
            join(dir, "result"),
            ...(allow ? ["--allow-diagnostic-changes"] : []),
          ],
          { encoding: "utf8" },
        );
        assert.equal(result.status, diagnostic && allow ? 0 : 1, result.stderr);
        const summary = JSON.parse(
          readFileSync(join(dir, "result-summary.json"), "utf8"),
        );
        assert.equal(summary.fullCrossRevision.fail, 1);
        assert.equal(summary.supportedCrossRevision.fail, diagnostic ? 0 : 1);
        assert.equal(summary.diagnosticCrossRevision.fail, diagnostic ? 1 : 0);
        assert.equal(
          JSON.parse(
            readFileSync(join(dir, "result-checkpoints.jsonl"), "utf8"),
          ).status,
          "FAIL",
        );
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
