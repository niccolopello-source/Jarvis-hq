import { gzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const root = process.argv[2];
if (!root)
  throw new Error(
    "usage: world-compaction-probe.mjs TARGET_APP_ROOT (synthetic only)",
  );
const load = (name) =>
  import(pathToFileURL(`${root}/src/lib/pivot/${name}.ts`).href);
const E = await load("engine"),
  S = await load("save"),
  R = await load("rng"),
  W = await load("world");
const { firstDiff } = await import("./json-diff.mjs");
Date.now = () => 1794081600000;
const job = E.openCareerSim({
  seed: 89081,
  engineVersion: "2.24.0-beta",
  path: "NCAA",
  role: "C",
  difficulty: "pro",
});
job.s.careerId = "synthetic-compaction-dynasty";
job.s.rngState = job.rng.getState();
job.s.world ??= W.createWorld(job.s.teamPower);
job.s.world.stars = [];
const name = "Synthetic Dynasty";
job.s.championLog = [0, 1, 2].map((i) => ({
  yearLabel: `${2030 + i}`,
  league: "NBA",
  team: name,
  teamAbbr: "SYN",
  teamColor: "#000000",
  star: "Synthetic Star",
  isPlayer: false,
}));
job.s.world.events = Array.from({ length: 16 }, (_, i) => ({
  yearLabel: "2032",
  kind: i === 10 ? "dynasty" : "trade",
  text: i === 10 ? name : `Synthetic event ${i}`,
}));
const a = structuredClone(job.s);
class Mem {
  values = new Map();
  get length() {
    return this.values.size;
  }
  getItem(k) {
    return this.values.get(k) ?? null;
  }
  setItem(k, v) {
    this.values.set(k, v);
  }
  removeItem(k) {
    this.values.delete(k);
  }
  clear() {
    this.values.clear();
  }
  key(i) {
    return [...this.values.keys()][i] ?? null;
  }
}
const local = new Mem(),
  session = new Mem();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: local,
});
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: session,
});
if (
  !S.saveLive({
    player: job.s,
    pending: null,
    log: [],
    screen: "career",
    tab: "log",
    logSeq: 1,
  })
)
  throw new Error("synthetic save refused");
const stored = local.getItem(S.SAVE_KEY);
const loaded = S.loadLive();
if (!loaded) throw new Error("synthetic load refused");
if (local.getItem(S.SAVE_KEY) !== stored) throw new Error("load rewrote raw");
const b = loaded.player;
const rngA = R.createRng(89081),
  rngB = R.createRng(89081);
rngA.setState(job.s.rngState);
rngB.setState(job.s.rngState);
const snap = (state, rng) => ({
  player: state,
  rng: rng.getState(),
  envelope: S.buildLiveSave(state, null, [], "career", "log", 1),
});
const record = (label) =>
  JSON.parse(
    JSON.stringify({
      id: `2.24.0-beta/forced-compaction-dynasty/89081/${label}`,
      value: { uninterrupted: snap(a, rngA), resumed: snap(b, rngB) },
    }),
  );
const records = [record("before-tick")];
const before = {
  memoryEvents: a.world.events.length,
  persistedEvents: b.world.events.length,
  memoryDynasty: a.world.events.some((e) => e.kind === "dynasty"),
  persistedDynasty: b.world.events.some((e) => e.kind === "dynasty"),
};
R.runWithRng(rngA, () => W.tickWorld(a));
R.runWithRng(rngB, () => W.tickWorld(b));
a.rngState = rngA.getState();
b.rngState = rngB.getState();
records.push(record("after-tick"));
if (process.argv[3])
  writeFileSync(
    process.argv[3],
    gzipSync(records.map((r) => JSON.stringify(r)).join("\n") + "\n"),
  );
console.log(
  JSON.stringify(
    {
      fixture: "forced synthetic dynasty event at index10; no CPU stars",
      seed: 89081,
      engineVersion: job.s.engineVersion,
      before,
      after: {
        memoryDynasty: a.world.events
          .filter((e) => e.kind === "dynasty")
          .map((e) => e.text),
        persistedDynasty: b.world.events
          .filter((e) => e.kind === "dynasty")
          .map((e) => e.text),
      },
      fullMismatch: firstDiff(a, b),
      persistibleMismatch: firstDiff(
        S.buildLiveSave(a, null, [], "career", "log", 1),
        S.buildLiveSave(b, null, [], "career", "log", 1),
      ),
      rngEqual: rngA.getState() === rngB.getState(),
    },
    null,
    2,
  ),
);
