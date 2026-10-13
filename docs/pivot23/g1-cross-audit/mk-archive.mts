import { playCareerSim, toArchive } from "/workspace/g1-cross/apps/pivot23/src/lib/pivot/engine.ts";
const E = (seed: number, name: string) => toArchive(playCareerSim({ seed, difficulty: "pro", name }));
const valid = E(6001, "XA Valida"); const wrong = { ...E(6002, "XA Errata"), fingerprint: "0".repeat(64) };
const m: any = E(6003, "XA Senza"); delete m.fingerprint;
console.log(JSON.stringify({ archive: JSON.stringify([valid, wrong, m]), corrupt: JSON.stringify([E(6004, "XA Uno"), { id: 9, junk: 1 }, E(6005, "XA Due")]) }));
