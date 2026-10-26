import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { playCareerSim } from "../lib/pivot/engine.ts";
import type { Role } from "../lib/pivot/types.ts";

const ROLES = ["PG", "SG", "SF", "PF", "C"] as const;
const PATHS = ["NCAA", "Europa", "G-League"] as const;

function base(seed: number, extra: Record<string, unknown> = {}) {
  return {
    name: "Lab",
    role: ROLES[seed % 5] as Role,
    nationality: "ITA",
    number: 23,
    difficulty: "pro" as const,
    path: PATHS[seed % 3],
    seed,
    draft: "random" as const,
    ...extra,
  };
}

function fp(seed: number, engineVersion?: string) {
  const s = playCareerSim(base(seed, engineVersion ? { engineVersion } : {}));
  return createHash("sha256")
    .update(JSON.stringify(s.seasonHistory.map((r) => ({ ppg: r.ppg, rpg: r.rpg, apg: r.apg, gp: r.gp, min: r.min, ovr: r.overall }))))
    .digest("hex")
    .slice(0, 16);
}

test("experiment absent keeps the no-hook fingerprints", () => {
  // Engine 2.13.0: D-09 (world "regress") moves team strength, so the player's box rows move.
  // Previous values (2.12.0 after #61): bd49e94d49927254 / 01bb9bd52abd5a9d / 46de14988ae7c8fa.
  // Engine 2.17.0 (P1-INJ): the serious injury follows the load, so the rows move.
  // Previous values (2.13–2.14): 88b05ca7c1f205f2 / 5223c1f092323ef4 / 61c87673b55c1bf9.
  // 2.16.0 (#83, age-36 season played): 2302a804b6009b46 / 5223c1f092323ef4 / 61c87673b55c1bf9.
  // 2.21.0 (OVR balance): new careers move; the 2.20 values (unchanged since 2.19) stay pinned to careers created as 2.20.
  assert.equal(fp(23017, "2.20.0-beta"), "be7cb73d0a40a658");
  assert.equal(fp(23034, "2.20.0-beta"), "f87256a4de325b61");
  assert.equal(fp(23102, "2.20.0-beta"), "2b6b9e31f6a33560");
  // 2.22.0 (procedural depth + A1 bars + Option A scar): new careers move (23102 depth+A1 only: 7f8069aa4b4150f2); the 2.21 values (main d800528) stay pinned to careers created as 2.21.
  assert.equal(fp(23017, "2.21.0-beta"), "9738a8b25ae0f507");
  assert.equal(fp(23034, "2.21.0-beta"), "04a89407b6080434");
  assert.equal(fp(23102, "2.21.0-beta"), "fa5d954ed74bfea9");
  // 2.23.0 (stats-driven OVR): new careers move; the 2.22 values stay pinned to careers created as 2.22.
  assert.equal(fp(23017, "2.22.0-beta"), "281950b4373c20fd");
  assert.equal(fp(23034, "2.22.0-beta"), "d4f59906719745f0");
  assert.equal(fp(23102, "2.22.0-beta"), "dfeef411f69e9235");
  assert.equal(fp(23017), "31e1e1c7f014d714");
  assert.equal(fp(23034), "13d61d7767e096dd");
  assert.equal(fp(23102), "e4f95920d096ab2e");
});

test("forced minutes move the recorded average without touching the played path", () => {
  const low = playCareerSim(base(81017, { experiment: { minutes: 10 } }));
  const high = playCareerSim(base(81017, { experiment: { minutes: 28 } }));
  const mean = (s: typeof low) => s.seasonHistory.reduce((a, r) => a + r.min, 0) / s.seasonHistory.length;
  assert.ok(Math.abs(mean(low) - 10) < 0.05, String(mean(low)));
  assert.ok(Math.abs(mean(high) - 28) < 0.05, String(mean(high)));
  assert.equal(fp(23017, "2.20.0-beta"), "be7cb73d0a40a658");
  assert.equal(fp(23017, "2.21.0-beta"), "9738a8b25ae0f507");
  assert.equal(fp(23017, "2.22.0-beta"), "281950b4373c20fd");
  assert.equal(fp(23017), "31e1e1c7f014d714");
});

test("work ethic stays locked and a forced injury costs games", () => {
  const low = playCareerSim(base(82017, { experiment: { workEthic: 20 } }));
  const high = playCareerSim(base(82017, { experiment: { workEthic: 90 } }));
  assert.equal(low.hidden.workEthic, 20);
  assert.equal(high.hidden.workEthic, 90);
  const off = playCareerSim(base(83017, { experiment: { injury: "off" } }));
  const forced = playCareerSim(base(83017, { experiment: { injury: "forced" } }));
  const gp = (s: typeof off) => s.seasonHistory.reduce((a, r) => a + r.gp, 0) / s.seasonHistory.length;
  assert.ok(gp(off) > gp(forced), `${gp(off)} vs ${gp(forced)}`);
});
