import assert from "node:assert/strict";
import test from "node:test";
import { advanceCareerSim, openCareerSim, resetArchiveMemory, type CareerSimJob } from "./engine.ts";
import { clearLive, loadLive, saveLive } from "./save.ts";
import { createRng } from "./rng.ts";
import { ENGINE_VERSION } from "./config.ts";

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(k: string) { return this.values.get(k) ?? null; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  removeItem(k: string) { this.values.delete(k); }
  setItem(k: string, v: string) { this.values.set(k, String(v)); }
}

/* Salvataggi creati con 2.20–2.22 devono caricarsi e continuare con le loro regole, non con quelle 2.23. */
for (const version of ["2.20.0-beta", "2.21.0-beta", "2.22.0-beta"]) {
  test(`${version} save loads and keeps simulating on its own rules under ${ENGINE_VERSION}`, () => {
    for (const seed of [4101, 4202, 4303]) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: new MemoryStorage() });
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: new MemoryStorage() });
      resetArchiveMemory();
      clearLive();
      const job = openCareerSim({ seed, difficulty: "pro", name: "Legacy", engineVersion: version });
      for (let i = 0; i < 3; i++) advanceCareerSim(job);
      job.s.rngState = job.rng.getState();
      assert.equal(saveLive({ player: job.s, pending: null, log: [], screen: "career", tab: "log", logSeq: 1 }), true);
      const loaded = loadLive();
      assert.ok(loaded, "save must load");
      assert.equal(loaded.player.engineVersion, version);
      const rng = createRng(seed);
      rng.setState(loaded.player.rngState!);
      const resumed: CareerSimJob = { rng, s: loaded.player, n: job.n, opts: job.opts };
      for (let i = 0; i < 40; i++) {
        const a = advanceCareerSim(job);
        const b = advanceCareerSim(resumed);
        assert.equal(a, b);
        if (a) break;
      }
      assert.equal(resumed.s.engineVersion, version, "engineVersion must not be upgraded");
      assert.deepEqual(resumed.s.seasonHistory, job.s.seasonHistory, "resumed career must match the uninterrupted one");
      clearLive();
    }
  });
}
