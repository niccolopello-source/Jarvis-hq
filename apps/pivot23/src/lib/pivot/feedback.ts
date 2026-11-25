/**
 * Feedback after the first finished career.
 *
 * Display and local storage only. The live save, the archive format and the engine are not
 * rewritten. Remote collection is behind FLAGS.feedbackSubmit (off by default): when the flag
 * is off, submit() never opens a network request.
 */
import { FLAGS } from "./flags.ts";
import type { ArchiveCareer } from "./types.ts";
import type { Lang } from "./i18n.ts";

export const FEEDBACK_UNLOCK_KEY = "pivot-v2-feedback-unlocked";
export const FEEDBACK_STATE_KEY = "pivot-v2-feedback";
export const FEEDBACK_STATE_VERSION = 1;
export const STAR_EDIT_MS = 30 * 24 * 60 * 60 * 1000;
export const REVIEW_MAX = 2000;
export const FEEDBACK_STARS = [1, 2, 3, 4, 5] as const;

export type FeedbackStars = (typeof FEEDBACK_STARS)[number];

/** Aggregate facts only. No player name, no careerId, no seed. */
export interface FeedbackCareerSummary {
  seasons: number;
  titles: number;
  peak: number;
  difficulty?: string;
  engineVersion?: string;
  simulated?: boolean;
  role?: string;
}

export interface FeedbackRecord {
  v: typeof FEEDBACK_STATE_VERSION;
  stars: FeedbackStars | null;
  review: string;
  lang: Lang;
  engineVersion: string;
  careerSummary: FeedbackCareerSummary | null;
  updatedAt: number;
  starsEditedAt: number | null;
  deviceId: string;
}

export interface FeedbackUnlockSource {
  archiveCount: number;
  /** True when this session already wrote a finished career (even if the archive later failed). */
  liveFinished?: boolean;
  unlockFlag?: boolean;
}

export type FeedbackStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

export type FeedbackSubmitResult =
  | { ok: true; stored: "local" | "remote" }
  | { ok: false; reason: "disabled" | "network" | "quota" | "invalid" | "locked" | "spam" };

export type FeedbackSubmitAdapter = {
  submit(record: FeedbackRecord): Promise<FeedbackSubmitResult>;
};

export function isFeedbackStars(value: unknown): value is FeedbackStars {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function isFeedbackUnlocked(source: FeedbackUnlockSource): boolean {
  return source.unlockFlag === true || source.archiveCount > 0 || source.liveFinished === true;
}

export function memoryFeedbackStore(initial?: Record<string, string>): FeedbackStore {
  const map = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

export function readUnlockFlag(store: FeedbackStore): boolean {
  try {
    return store.getItem(FEEDBACK_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persists the unlock so a later unreadable or evicted archive does not hide the section. */
export function persistUnlock(store: FeedbackStore): boolean {
  if (readUnlockFlag(store)) return true;
  try {
    store.setItem(FEEDBACK_UNLOCK_KEY, "1");
    return store.getItem(FEEDBACK_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlockFrom(store: FeedbackStore, source: Omit<FeedbackUnlockSource, "unlockFlag">): boolean {
  const flag = readUnlockFlag(store);
  const unlocked = isFeedbackUnlocked({ ...source, unlockFlag: flag });
  if (unlocked && !flag) persistUnlock(store);
  return unlocked;
}

let deviceIdSeq = 0;

export function newDeviceId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;
  deviceIdSeq += 1;
  return "d" + Date.now().toString(16) + "x" + String(deviceIdSeq);
}

export function summaryFromArchive(entry: Pick<ArchiveCareer, "seasons" | "titles" | "peak" | "difficulty" | "engineVersion" | "simulated" | "role">): FeedbackCareerSummary {
  const summary: FeedbackCareerSummary = {
    seasons: entry.seasons,
    titles: entry.titles,
    peak: entry.peak,
  };
  if (entry.difficulty) summary.difficulty = entry.difficulty;
  if (entry.engineVersion) summary.engineVersion = entry.engineVersion;
  if (entry.simulated) summary.simulated = true;
  if (entry.role) summary.role = entry.role;
  return summary;
}

export function latestCareerSummary(archive: readonly Pick<ArchiveCareer, "savedAt" | "seasons" | "titles" | "peak" | "difficulty" | "engineVersion" | "simulated" | "role">[]): FeedbackCareerSummary | null {
  if (!archive.length) return null;
  const latest = [...archive].sort((a, b) => b.savedAt - a.savedAt)[0]!;
  return summaryFromArchive(latest);
}

function asRecord(value: unknown): FeedbackRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const rec = value as Record<string, unknown>;
  if (rec.v !== FEEDBACK_STATE_VERSION) return null;
  if (rec.stars !== null && !isFeedbackStars(rec.stars)) return null;
  if (typeof rec.review !== "string") return null;
  if (rec.lang !== "it" && rec.lang !== "en" && rec.lang !== "es" && rec.lang !== "zh") return null;
  if (typeof rec.engineVersion !== "string") return null;
  if (typeof rec.updatedAt !== "number" || !Number.isFinite(rec.updatedAt)) return null;
  if (rec.starsEditedAt !== null && (typeof rec.starsEditedAt !== "number" || !Number.isFinite(rec.starsEditedAt))) return null;
  if (typeof rec.deviceId !== "string" || rec.deviceId.length === 0) return null;
  let careerSummary: FeedbackCareerSummary | null = null;
  if (rec.careerSummary && typeof rec.careerSummary === "object" && !Array.isArray(rec.careerSummary)) {
    const s = rec.careerSummary as Record<string, unknown>;
    if (typeof s.seasons === "number" && typeof s.titles === "number" && typeof s.peak === "number") {
      careerSummary = {
        seasons: s.seasons,
        titles: s.titles,
        peak: s.peak,
      };
      if (typeof s.difficulty === "string") careerSummary.difficulty = s.difficulty;
      if (typeof s.engineVersion === "string") careerSummary.engineVersion = s.engineVersion;
      if (s.simulated === true) careerSummary.simulated = true;
      if (typeof s.role === "string") careerSummary.role = s.role;
    }
  }
  return {
    v: FEEDBACK_STATE_VERSION,
    stars: rec.stars,
    review: rec.review,
    lang: rec.lang,
    engineVersion: rec.engineVersion,
    careerSummary,
    updatedAt: rec.updatedAt,
    starsEditedAt: rec.starsEditedAt,
    deviceId: rec.deviceId,
  };
}

export function readFeedback(store: FeedbackStore): FeedbackRecord | null {
  try {
    const raw = store.getItem(FEEDBACK_STATE_KEY);
    if (!raw) return null;
    return asRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeFeedback(store: FeedbackStore, record: FeedbackRecord): boolean {
  try {
    const json = JSON.stringify(record);
    store.setItem(FEEDBACK_STATE_KEY, json);
    return store.getItem(FEEDBACK_STATE_KEY) === json;
  } catch {
    return false;
  }
}

export function canEditStars(record: FeedbackRecord | null, now: number): { ok: true } | { ok: false; nextAt: number } {
  if (!record || record.starsEditedAt == null) return { ok: true };
  const nextAt = record.starsEditedAt + STAR_EDIT_MS;
  return now >= nextAt ? { ok: true } : { ok: false, nextAt };
}

export function clipReview(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, REVIEW_MAX);
}

export type FeedbackDraft = {
  stars: FeedbackStars | null;
  review: string;
  lang: Lang;
  engineVersion: string;
  careerSummary: FeedbackCareerSummary | null;
  /** Hidden honeypot: any non-empty value is treated as spam. */
  trap?: string;
};

export type FeedbackApplyResult =
  | { ok: true; record: FeedbackRecord; skipped?: "spam" }
  | { ok: false; reason: "invalid" | "locked" | "quota" };

export function applyFeedbackDraft(
  store: FeedbackStore,
  draft: FeedbackDraft,
  now: number,
): FeedbackApplyResult {
  const trap = (draft.trap ?? "").trim();
  if (trap.length > 0) {
    // Pretend success, do not write. The bot sees an OK; nothing is stored.
    const existing = readFeedback(store);
    const dummy: FeedbackRecord = existing ?? {
      v: FEEDBACK_STATE_VERSION,
      stars: null,
      review: "",
      lang: draft.lang,
      engineVersion: draft.engineVersion,
      careerSummary: null,
      updatedAt: now,
      starsEditedAt: null,
      deviceId: newDeviceId(),
    };
    return { ok: true, record: dummy, skipped: "spam" };
  }
  if (!isFeedbackStars(draft.stars)) return { ok: false, reason: "invalid" };
  const review = clipReview(draft.review);
  if (draft.review.trim().length > REVIEW_MAX) return { ok: false, reason: "invalid" };
  const previous = readFeedback(store);
  const starChange = previous?.stars !== draft.stars;
  if (starChange) {
    const gate = canEditStars(previous, now);
    if (!gate.ok) return { ok: false, reason: "locked" };
  }
  const record: FeedbackRecord = {
    v: FEEDBACK_STATE_VERSION,
    stars: draft.stars,
    review,
    lang: draft.lang,
    engineVersion: draft.engineVersion,
    careerSummary: draft.careerSummary,
    updatedAt: now,
    starsEditedAt: starChange ? now : previous?.starsEditedAt ?? now,
    deviceId: previous?.deviceId || newDeviceId(),
  };
  if (!writeFeedback(store, record)) return { ok: false, reason: "quota" };
  persistUnlock(store);
  return { ok: true, record };
}

export function localFeedbackAdapter(store: FeedbackStore, now: () => number): FeedbackSubmitAdapter {
  return {
    async submit(record) {
      const written = writeFeedback(store, record);
      if (!written) return { ok: false, reason: "quota" };
      persistUnlock(store);
      void now;
      return { ok: true, stored: "local" };
    },
  };
}

/**
 * Same-origin POST /api/feedback. Never constructed unless FLAGS.feedbackSubmit is on.
 * The function itself is not shipped as a live collector in this phase: there is no API
 * route and no environment variable.
 */
export function remoteFeedbackAdapter(
  fetchImpl: typeof fetch,
  path = "/api/feedback",
): FeedbackSubmitAdapter {
  return {
    async submit(record) {
      try {
        const res = await fetchImpl(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            stars: record.stars,
            review: record.review,
            lang: record.lang,
            engineVersion: record.engineVersion,
            careerSummary: record.careerSummary,
            updatedAt: record.updatedAt,
            deviceId: record.deviceId,
          }),
        });
        if (!res.ok) return { ok: false, reason: "network" };
        return { ok: true, stored: "remote" };
      } catch {
        return { ok: false, reason: "network" };
      }
    },
  };
}

export function createFeedbackAdapter(opts: {
  store: FeedbackStore;
  now?: () => number;
  fetchImpl?: typeof fetch;
  submitEnabled?: boolean;
}): FeedbackSubmitAdapter {
  const enabled = opts.submitEnabled ?? FLAGS.feedbackSubmit;
  if (!enabled) return localFeedbackAdapter(opts.store, opts.now ?? Date.now);
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const remote = remoteFeedbackAdapter(fetchImpl);
  const local = localFeedbackAdapter(opts.store, opts.now ?? Date.now);
  return {
    async submit(record) {
      const remoteResult = await remote.submit(record);
      const localResult = await local.submit(record);
      if (remoteResult.ok) return remoteResult;
      return localResult.ok ? { ok: true, stored: "local" } : remoteResult;
    },
  };
}

/** Browser localStorage, or null when the store is missing or throws on access. */
export function browserFeedbackStore(): FeedbackStore | null {
  try {
    const local = globalThis.localStorage;
    if (!local) return null;
    return local;
  } catch {
    return null;
  }
}
