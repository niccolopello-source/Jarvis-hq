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

function fp(seed: number) {
  const s = playCareerSim(base(seed));
  return createHash("sha256")
    .update(JSON.stringify(s.seasonHistory.map((r) => ({ ppg: r.ppg, rpg: r.rpg, apg: r.apg, gp: r.gp, min: r.min, ovr: r.overall }))))
    .digest("hex")
    .slice(0, 16);
}

test("experiment absent keeps the no-hook fingerprints", () => {
  assert.equal(fp(23017), fp(23017));
  assert.equal(fp(23017), "bd49e94d49927254");
  assert.equal(fp(23034), "01bb9bd52abd5a9d");
  assert.equal(fp(23102), "46de14988ae7c8fa");
});

test("forced minutes move the recorded average without touching the played path", () => {
  const low = playCareerSim(base(81017, { experiment: { minutes: 10 } }));
  const high = playCareerSim(base(81017, { experiment: { minutes: 28 } }));
  const mean = (s: typeof low) => s.seasonHistory.reduce((a, r) => a + r.min, 0) / s.seasonHistory.length;
  assert.ok(Math.abs(mean(low) - 10) < 0.05, String(mean(low)));
  assert.ok(Math.abs(mean(high) - 28) < 0.05, String(mean(high)));
  assert.equal(fp(23017), "bd49e94d49927254");
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
