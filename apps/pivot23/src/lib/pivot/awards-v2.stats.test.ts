import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, openCareerSim } from "./engine.ts";
import { ROY_ROLES } from "./rookie-box.ts";
import { ROOKIE_NAMES } from "./teams.ts";

/* Awards v2 distributions (2.15 careers) vs the 2.14 baseline. 400 careers per version. */

type Out = { y1: number; royPlayer: number; role: Record<string, number>; mvp: number; boardNoTrophy: number; maxMvp: number };
function sample(version: string): Out {
  const o: Out = { y1: 0, royPlayer: 0, role: {}, mvp: 0, boardNoTrophy: 0, maxMvp: 0 };
  for (const d of ["esordio", "pro", "allstar", "leggenda"]) for (let i = 0; i < 100; i++) {
    const job = openCareerSim({ seed: 70000 + i * 613, difficulty: d as never });
    job.s.engineVersion = version;
    let done = false;
    let last: unknown;
    while (!done) {
      done = advanceCareerSim(job);
      const r = job.s.seasonHistory.at(-1)!;
      if (r === last) continue;
      last = r;
      if (r.awards.includes("MVP")) o.mvp += 1;
      if (r.league?.mvpBoard?.[0]?.isPlayer && !r.awards.includes("MVP") && r.awards.includes("All-Star") && r.gp >= 65) o.boardNoTrophy += 1;
      if (r.season === 1 && r.league?.royRace?.length) {
        o.y1 += 1;
        const roy = r.league.awards.find((a) => a.title === "ROY");
        let role: string | undefined;
        if (r.awards.includes("Rookie of the Year")) { o.royPlayer += 1; role = job.s.role; }
        else {
          const w = r.league.royRace.find((c) => !c.isPlayer && c.name === roy?.name);
          role = w?.role ?? ROY_ROLES[ROOKIE_NAMES.indexOf(w?.name ?? "")];
        }
        if (role) o.role[role] = (o.role[role] ?? 0) + 1;
      }
    }
    o.maxMvp = Math.max(o.maxMvp, job.s.mvpCount);
  }
  return o;
}

test("awards v2: ROY position balance, player ROY rate, MVP vote consistency", () => {
  const v2 = sample("2.15.0-beta");
  const tot = Object.values(v2.role).reduce((a, b) => a + b, 0);
  const share = Object.fromEntries(Object.entries(v2.role).map(([k, v]) => [k, v / tot]));
  console.log("2.15 ROY role share", share, "player ROY", v2.royPlayer / v2.y1, "MVP seasons", v2.mvp, "max MVP", v2.maxMvp);
  for (const r of ["PG", "SG", "SF", "PF", "C"]) assert.ok((share[r] ?? 0) >= 0.06, `${r} ROY share ${share[r]}`);
  assert.ok(Math.max(...Object.values(share)) <= 0.45, `max ROY share ${JSON.stringify(share)}`);
  assert.ok(v2.royPlayer / v2.y1 >= 0.03 && v2.royPlayer / v2.y1 <= 0.2, `player ROY ${v2.royPlayer / v2.y1}`);
  assert.equal(v2.boardNoTrophy, 0, "player led an MVP vote he was eligible for and lost it");
  assert.ok(v2.maxMvp <= 6, `max MVP ${v2.maxMvp}`);
  assert.ok(v2.mvp > 0);
});
