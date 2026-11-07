/** Persistence boundary only. Never changes historical engine gates or stored bytes. */
import { ENGINE_VERSION } from "./config";
import { sha256 } from "./card";
export const LIVE_SLOTS = [
  "pivot-v2-save",
  "pivot-v2-save-backup",
  "pivot-v2-save-backup-prev",
  "pivot-v2-save-crashed",
] as const;
export type SlotStatus =
  | "absent"
  | "supported"
  | "future-schema"
  | "future-engine"
  | "missing"
  | "malformed"
  | "corrupt"
  | "unreadable";
export type ProtectedSlot = { id: string; status: SlotStatus; hash?: string };
export type LiveProtection = {
  blocked: boolean;
  reason: "data" | "writer" | null;
  slots: ProtectedSlot[];
};
let validator: (raw: unknown) => boolean = () => false;
export function configureLiveValidator(fn: (raw: unknown) => boolean): void {
  validator = fn;
  slotCache.clear();
}
/** Persistence parser, not a replacement for historical tuning/versionAtLeast. Beta = release core. */
export function persistedVersion(v: unknown): number[] | null {
  if (typeof v !== "string") return null;
  const m = /^v?(\d+)\.(\d+)(?:\.(\d+))?(?:[-+][0-9A-Za-z.+-]+)?$/.exec(
    v.trim(),
  );
  if (!m) return null;
  const n = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
  return n.every(Number.isSafeInteger) ? n : null;
}
function newer(v: number[], max: number[]): boolean {
  for (let i = 0; i < 3; i++) if (v[i] !== max[i]) return v[i]! > max[i]!;
  return false;
}
const maxEngine = persistedVersion(ENGINE_VERSION)!;
export function canPersistEngineVersion(v: unknown): boolean {
  const core = persistedVersion(v);
  return !!core && !newer(core, maxEngine);
}
export function hasLiveWriter(): boolean {
  return lease !== null;
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function classifyPersistedRaw(raw: string, wrapper = false): SlotStatus {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return "corrupt";
  }
  if (!object(value)) return "corrupt";
  if (wrapper) {
    if (typeof value.v === "number" && value.v > 1) return "future-schema";
    const inner =
      typeof value.raw === "string" ? classifyPersistedRaw(value.raw) : null;
    if (inner === "future-schema" || inner === "future-engine") return inner;
    if (value.v === undefined || value.v === null) return "missing";
    if (value.v !== 1) return "malformed";
    if (inner === null) return "corrupt";
    return inner;
  }
  // Recognizable future headers win even when checksum/player/other fields are damaged.
  if (Number.isInteger(value.v) && (value.v as number) > 2)
    return "future-schema";
  const player = value.player;
  if (object(player)) {
    const ver = player.engineVersion;
    if (ver === undefined || ver === null) return "missing";
    const core = persistedVersion(ver);
    if (!core) return "malformed";
    if (newer(core, maxEngine)) return "future-engine";
  }
  if (value.v !== 2)
    return typeof value.v === "number" &&
      Number.isInteger(value.v) &&
      value.v < 2
      ? "corrupt"
      : value.v === undefined
        ? "missing"
        : "malformed";
  return validator(value) ? "supported" : "corrupt";
}
/** Hash DOMString code units, including lone surrogates that UTF-8 would replace. */
export function rawSaveHash(raw: string): string {
  let hex = "";
  for (let i = 0; i < raw.length; i++)
    hex += raw.charCodeAt(i).toString(16).padStart(4, "0");
  return sha256("utf16:" + hex);
}
const blockedStatus = (s: SlotStatus) =>
  s === "future-schema" ||
  s === "future-engine" ||
  s === "unreadable" ||
  s === "missing" ||
  s === "malformed";
function browser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
const slotCache = new Map<
  string,
  { raw: string; status: SlotStatus; hash?: string }
>();
function scan(includeHashes = true): { slot: ProtectedSlot; raw?: string }[] {
  const out: { slot: ProtectedSlot; raw?: string }[] = [];
  for (const storeName of ["localStorage", "sessionStorage"] as const) {
    let store: Storage | undefined,
      unreadable = false;
    try {
      store = globalThis[storeName];
    } catch {
      unreadable = true;
    }
    for (const key of LIVE_SLOTS) {
      const id = `${storeName}/${key}`;
      if (!store) {
        out.push({
          slot: {
            id,
            status: unreadable || browser() ? "unreadable" : "absent",
          },
        });
        continue;
      }
      try {
        const raw = store.getItem(key);
        if (raw === null) {
          slotCache.delete(id);
          out.push({ slot: { id, status: "absent" } });
          continue;
        }
        let cached = slotCache.get(id);
        if (!cached || cached.raw !== raw) {
          cached = {
            raw,
            status: classifyPersistedRaw(raw, key !== LIVE_SLOTS[0]),
          };
          slotCache.set(id, cached);
        }
        if (includeHashes) cached.hash ??= rawSaveHash(raw);
        out.push({
          raw,
          slot: {
            id,
            status: cached.status,
            ...(includeHashes ? { hash: cached.hash } : {}),
          },
        });
      } catch {
        out.push({ slot: { id, status: "unreadable" } });
      }
    }
  }
  return out;
}
let lease: symbol | null = null;
const listeners = new Set<() => void>();
export function subscribeLiveProtection(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
function signal() {
  for (const fn of listeners) fn();
}
export function inspectLiveProtection(includeHashes = true): LiveProtection {
  const slots = scan(includeHashes).map((r) => r.slot),
    data = slots.some((s) => blockedStatus(s.status));
  return {
    slots,
    blocked: data || (browser() && lease === null),
    reason: data ? "data" : browser() && lease === null ? "writer" : null,
  };
}
/** Re-read every protected slot at each mutation/commit. Cooperating browser writers hold a Web Lock. */
export function livePersistenceAllowed(): boolean {
  const ok = !inspectLiveProtection(false).blocked;
  if (!ok) queueMicrotask(signal);
  return ok;
}
/** One cooperating writer per origin/document. No queue and no unsupported-lock fallback. */
export function acquireLiveWriter(onChange: () => void): () => void {
  let cancelled = false,
    release: (() => void) | undefined;
  const token = Symbol("live-writer");
  try {
    const locks =
      typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (!locks || typeof locks.request !== "function") {
      queueMicrotask(onChange);
      return () => {
        cancelled = true;
      };
    }
    void locks
      .request(
        "pivot23-live-persistence-v1",
        { mode: "exclusive", ifAvailable: true },
        async (lock) => {
          if (!lock || cancelled) {
            onChange();
            return;
          }
          lease = token;
          onChange();
          await new Promise<void>((done) => {
            release = done;
            if (cancelled) done();
          });
          if (lease === token) lease = null;
          onChange();
        },
      )
      .catch(() => {
        if (lease === token) lease = null;
        onChange();
      });
  } catch {
    // Security-policy getters and synchronous API failures must also fail closed.
    queueMicrotask(onChange);
  }
  return () => {
    cancelled = true;
    if (lease === token) lease = null;
    release?.();
  };
}
/** Raw DOMString code units, lossless UTF-16LE (no BOM), not JSON.parse/stringify. Read-only and stale-safe. */
export function exportLiveRaw(
  id: string,
  expectedHash: string,
): Uint8Array<ArrayBuffer> {
  const row = scan().find((r) => r.slot.id === id);
  if (!row || row.raw === undefined || row.slot.hash !== expectedHash)
    throw new Error("save-export-stale-or-unreadable");
  const bytes = new Uint8Array(row.raw.length * 2);
  for (let i = 0; i < row.raw.length; i++) {
    const n = row.raw.charCodeAt(i);
    bytes[i * 2] = n & 255;
    bytes[i * 2 + 1] = n >>> 8;
  }
  return bytes;
}

/** One app registers its synchronous RAM flush; only the lifecycle owner invokes it. */
let registeredFlush: { flush: () => boolean } | null = null;
export function registerLiveFlush(flush: () => boolean): () => void {
  const registration = { flush };
  registeredFlush = registration;
  return () => {
    if (registeredFlush === registration) registeredFlush = null;
  };
}
export function flushRegisteredLive(): boolean {
  if (!livePersistenceAllowed()) return false;
  return registeredFlush?.flush() ?? false;
}
/** Same native callback: verify/flush then release. Never coordinate separate listeners via microtasks. */
export function finishLiveDocument(release: () => void): void {
  try {
    flushRegisteredLive();
  } finally {
    release();
  }
}
