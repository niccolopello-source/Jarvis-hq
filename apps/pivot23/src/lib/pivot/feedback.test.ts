import assert from "node:assert/strict";
import test from "node:test";
import {
  FEEDBACK_STATE_KEY,
  FEEDBACK_UNLOCK_KEY,
  REVIEW_MAX,
  STAR_EDIT_MS,
  applyFeedbackDraft,
  canEditStars,
  createFeedbackAdapter,
  isFeedbackUnlocked,
  latestCareerSummary,
  memoryFeedbackStore,
  persistUnlock,
  readFeedback,
  readUnlockFlag,
  remoteFeedbackAdapter,
  summaryFromArchive,
  unlockFrom,
} from "./feedback.ts";

const T0 = 1_700_000_000_000;

test("unlock is off until a finished career exists on this device", () => {
  assert.equal(isFeedbackUnlocked({ archiveCount: 0 }), false);
  assert.equal(isFeedbackUnlocked({ archiveCount: 0, liveFinished: false, unlockFlag: false }), false);
  assert.equal(isFeedbackUnlocked({ archiveCount: 1 }), true);
  assert.equal(isFeedbackUnlocked({ archiveCount: 0, liveFinished: true }), true);
  assert.equal(isFeedbackUnlocked({ archiveCount: 0, unlockFlag: true }), true);
});

test("the unlock flag persists after the archive is later empty or unreadable", () => {
  const store = memoryFeedbackStore();
  assert.equal(unlockFrom(store, { archiveCount: 0 }), false);
  assert.equal(readUnlockFlag(store), false);
  assert.equal(unlockFrom(store, { archiveCount: 1 }), true);
  assert.equal(store.getItem(FEEDBACK_UNLOCK_KEY), "1");
  // Eight newer careers can evict older sheets, or the archive can become unreadable:
  // the dedicated flag keeps the section open on this device.
  assert.equal(unlockFrom(store, { archiveCount: 0 }), true);
  assert.equal(persistUnlock(store), true);
});

test("career summary drops the name, the career id and the seed", () => {
  const summary = summaryFromArchive({
    seasons: 14,
    titles: 2,
    peak: 88,
    difficulty: "pro",
    engineVersion: "2.24.0-beta",
    simulated: false,
    role: "SG",
  });
  assert.deepEqual(summary, {
    seasons: 14,
    titles: 2,
    peak: 88,
    difficulty: "pro",
    engineVersion: "2.24.0-beta",
    role: "SG",
  });
  const json = JSON.stringify(summary);
  assert.equal(json.includes("name"), false);
  assert.equal(json.includes("careerId"), false);
  assert.equal(json.includes("seed"), false);
  const latest = latestCareerSummary([
    { savedAt: 10, seasons: 3, titles: 0, peak: 70, role: "PG" },
    { savedAt: 50, seasons: 12, titles: 1, peak: 84, role: "SF", difficulty: "allstar" },
  ]);
  assert.equal(latest?.seasons, 12);
  assert.equal(latest?.difficulty, "allstar");
});

test("stars can be set once, then only again after 30 days; the review can be updated sooner", () => {
  const store = memoryFeedbackStore();
  const first = applyFeedbackDraft(store, {
    stars: 5,
    review: "  Bel gioco.  ",
    lang: "it",
    engineVersion: "2.24.0-beta",
    careerSummary: { seasons: 12, titles: 1, peak: 80 },
  }, T0);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.record.stars, 5);
  assert.equal(first.record.review, "Bel gioco.");
  assert.equal(first.record.starsEditedAt, T0);
  assert.equal(readUnlockFlag(store), true);

  const locked = canEditStars(first.record, T0 + STAR_EDIT_MS - 1);
  assert.equal(locked.ok, false);
  if (!locked.ok) assert.equal(locked.nextAt, T0 + STAR_EDIT_MS);

  const blocked = applyFeedbackDraft(store, {
    stars: 3,
    review: "Cambio idea",
    lang: "it",
    engineVersion: "2.24.0-beta",
    careerSummary: { seasons: 12, titles: 1, peak: 80 },
  }, T0 + 1000);
  assert.deepEqual(blocked, { ok: false, reason: "locked" });
  assert.equal(readFeedback(store)?.stars, 5);

  const sameStars = applyFeedbackDraft(store, {
    stars: 5,
    review: "Ancora più chiaro.",
    lang: "it",
    engineVersion: "2.24.0-beta",
    careerSummary: { seasons: 12, titles: 1, peak: 80 },
  }, T0 + 2000);
  assert.equal(sameStars.ok, true);
  if (sameStars.ok) {
    assert.equal(sameStars.record.review, "Ancora più chiaro.");
    assert.equal(sameStars.record.starsEditedAt, T0);
  }

  const after = applyFeedbackDraft(store, {
    stars: 4,
    review: "Dopo un mese",
    lang: "en",
    engineVersion: "2.24.0-beta",
    careerSummary: { seasons: 12, titles: 1, peak: 80 },
  }, T0 + STAR_EDIT_MS);
  assert.equal(after.ok, true);
  if (after.ok) {
    assert.equal(after.record.stars, 4);
    assert.equal(after.record.starsEditedAt, T0 + STAR_EDIT_MS);
    assert.equal(after.record.deviceId, first.record.deviceId);
  }
});

test("invalid drafts are rejected and a honeypot write is ignored", () => {
  const store = memoryFeedbackStore();
  assert.deepEqual(applyFeedbackDraft(store, {
    stars: null,
    review: "ok",
    lang: "it",
    engineVersion: "2.24.0-beta",
    careerSummary: null,
  }, T0), { ok: false, reason: "invalid" });

  const tooLong = applyFeedbackDraft(store, {
    stars: 4,
    review: "x".repeat(REVIEW_MAX + 1),
    lang: "it",
    engineVersion: "2.24.0-beta",
    careerSummary: null,
  }, T0);
  assert.deepEqual(tooLong, { ok: false, reason: "invalid" });
  assert.equal(readFeedback(store), null);

  const spam = applyFeedbackDraft(store, {
    stars: 5,
    review: "spam",
    lang: "it",
    engineVersion: "2.24.0-beta",
    careerSummary: null,
    trap: "http://bots.example",
  }, T0);
  assert.equal(spam.ok, true);
  if (spam.ok) assert.equal(spam.skipped, "spam");
  assert.equal(store.getItem(FEEDBACK_STATE_KEY), null);
});

test("the default adapter never calls fetch when the submit flag is off", async () => {
  const store = memoryFeedbackStore();
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    return new Response("no", { status: 500 });
  }) as typeof fetch;
  const applied = applyFeedbackDraft(store, {
    stars: 4,
    review: "locale",
    lang: "en",
    engineVersion: "2.24.0-beta",
    careerSummary: { seasons: 10, titles: 0, peak: 75 },
  }, T0);
  assert.equal(applied.ok, true);
  if (!applied.ok) return;
  const adapter = createFeedbackAdapter({ store, fetchImpl, submitEnabled: false });
  const result = await adapter.submit(applied.record);
  assert.deepEqual(result, { ok: true, stored: "local" });
  assert.equal(calls, 0);
  assert.equal(readFeedback(store)?.review, "locale");
});

test("the remote adapter posts the minimum payload and is not used unless enabled", async () => {
  const bodies: string[] = [];
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    bodies.push(String(init?.body ?? ""));
    return new Response("ok", { status: 200 });
  }) as typeof fetch;
  const adapter = remoteFeedbackAdapter(fetchImpl);
  const result = await adapter.submit({
    v: 1,
    stars: 5,
    review: "Great run",
    lang: "en",
    engineVersion: "2.24.0-beta",
    careerSummary: { seasons: 11, titles: 1, peak: 83, difficulty: "pro" },
    updatedAt: T0,
    starsEditedAt: T0,
    deviceId: "dev-test",
  });
  assert.deepEqual(result, { ok: true, stored: "remote" });
  const payload = JSON.parse(bodies[0]!) as Record<string, unknown>;
  assert.deepEqual(Object.keys(payload).sort(), [
    "careerSummary",
    "deviceId",
    "engineVersion",
    "lang",
    "review",
    "stars",
    "updatedAt",
  ]);
  assert.equal(JSON.stringify(payload).includes("Great run"), true);
  assert.equal("name" in payload, false);

  const store = memoryFeedbackStore();
  const gated = createFeedbackAdapter({ store, fetchImpl, submitEnabled: false });
  await gated.submit({
    v: 1,
    stars: 1,
    review: "still local",
    lang: "it",
    engineVersion: "2.24.0-beta",
    careerSummary: null,
    updatedAt: T0,
    starsEditedAt: T0,
    deviceId: "dev-test-2",
  });
  assert.equal(bodies.length, 1);
});
