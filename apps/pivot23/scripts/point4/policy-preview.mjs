/** Policy evaluation for synthetic audits; never change runtime or a real save. */
import {isDeepStrictEqual} from "node:util";

// Generated cards (late-/quiet-/rival-/nation-/proc-…) build Fx closures over the LIVE
// PlayerState, so passing a clone is not enough: e.g. voice lines get marked in the live
// s.heardLines. Snapshot the live state and put back every top-level key the preview touched.
function restoreLive(state, snapshot) {
  for (const key of Object.keys(state)) if (!(key in snapshot)) delete state[key];
  for (const [key, value] of Object.entries(snapshot)) {
    const live = state[key];
    if (isDeepStrictEqual(live, value)) continue;
    // In place, so references a card captured at build time stay attached to the live state.
    if (Array.isArray(live) && Array.isArray(value)) live.splice(0, live.length, ...value);
    else if (live && value && typeof live === "object" && typeof value === "object" && !Array.isArray(live) && !Array.isArray(value)) {
      for (const k of Object.keys(live)) delete live[k];
      Object.assign(live, value);
    } else state[key] = value;
  }
}
export function previewChoice(state, choice, rngApi) {
  const live = rngApi.currentRng();
  if (!live) throw new Error("Policy preview requires the active career RNG");
  const cursor = live.getState();
  const isolated = rngApi.createRng(live.seed);
  if (cursor === 0) {
    // Runtime setState(0) treats zero as a missing-state sentinel. Prime only
    // this private Mulberry32 clone through its preceding cursor to reach 0.
    isolated.setState((-0x6d2b79f5) >>> 0);
    isolated.next();
  } else {
    isolated.setState(cursor);
  }
  if (isolated.getState() !== cursor) throw new Error("Preview cursor mismatch");
  // runWithRng restores the previous context in finally, even on Fx errors.
  // Every alternative starts at the SAME current cursor, not at the seed.
  const snapshot = structuredClone(state);
  try {
    return rngApi.runWithRng(isolated, () => choice.fx(structuredClone(state)));
  } finally {
    restoreLive(state, snapshot);
  }
}

export function choosePolicy(profile, engine, rngApi) {
  return (state, event) => {
    let bestIndex = 0;
    let bestValue = -Infinity;
    for (const [index, choice] of event.choices.entries()) {
      const fx = previewChoice(state, choice, rngApi);
      const sign = profile === "worst" || profile === "morale-down" ? -1 : 1;
      const score = profile.startsWith("morale-")
        ? Number(fx.morale ?? 0)
        : engine.contextualPulse(structuredClone(state), fx);
      const value = sign * score;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    }
    return bestIndex;
  };
}
