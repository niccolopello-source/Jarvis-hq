/**
 * "Nuova vita" safety rules. Pure functions: the UI asks what to do, storage code does it.
 *
 * A live save is deleted only when:
 *  - the career is finished AND its archive entry is in storage that outlives the tab, or
 *  - the player confirmed in a dialog that told them what is lost.
 */

export type NewLifeAsk =
  /** Nothing to protect: start right away. */
  | "none"
  /** A career is in progress: ask before replacing it. */
  | "running"
  /** A finished career is not safely archived: ask, and say the archive copy is missing. */
  | "unarchived";

export interface LiveCareerFacts {
  /** A live career exists (in storage or in memory). */
  hasLive: boolean;
  /** The career reached retirement (an archive entry for it exists, even in memory only). */
  finished: boolean;
  /** Its archive entry is in persistent storage. */
  archived: boolean;
}

export function newLifeAsk(facts: LiveCareerFacts): NewLifeAsk {
  if (!facts.hasLive) return "none";
  if (facts.finished) return facts.archived ? "none" : "unarchived";
  return "running";
}

/** True when deleting the live save cannot lose anything the player has not agreed to lose. */
export function mayDeleteLive(facts: LiveCareerFacts, confirmed: boolean): boolean {
  return newLifeAsk(facts) === "none" || confirmed;
}

/**
 * Lets one async action run at a time. A second call while the first runs is ignored and returns
 * false, so a double tap cannot delete twice or open two flows.
 */
export function createOnce() {
  let busy = false;
  return {
    get busy() {
      return busy;
    },
    run(action: () => void): boolean {
      if (busy) return false;
      busy = true;
      try {
        action();
      } finally {
        busy = false;
      }
      return true;
    },
    hold(): boolean {
      if (busy) return false;
      busy = true;
      return true;
    },
    release() {
      busy = false;
    },
  };
}
