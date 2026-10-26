/**
 * Boot attention signal: save/boot code raises it when the first screen is a save-recovery notice
 * or a boot error, so the decorative splash (src/intro.ts) gets out of the way at once.
 *
 * Two channels, so the order of subscription does not matter:
 * - `data-boot-attention="<reason>"` on <html> (sticky: read by whoever arrives late);
 * - a `pivot:boot-attention` CustomEvent on document (for whoever is already listening).
 * Independent from the `pivot-ready` class used by the E2E suite, which is left unchanged.
 */
export const BOOT_ATTENTION_EVENT = "pivot:boot-attention";
export type BootAttention = "recovery" | "error";

export function signalBootAttention(reason: BootAttention): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (root.dataset.bootAttention === "error") return;
  root.dataset.bootAttention = reason;
  document.dispatchEvent(new CustomEvent(BOOT_ATTENTION_EVENT, { detail: reason }));
}

export function bootAttentionRaised(): boolean {
  return typeof document !== "undefined" && !!document.documentElement.dataset.bootAttention;
}

/** Calls `fn` once: now if the signal was already raised, otherwise when it is. Returns an unsubscribe. */
export function onBootAttention(fn: () => void): () => void {
  if (bootAttentionRaised()) {
    fn();
    return () => {};
  }
  const handler = () => {
    document.removeEventListener(BOOT_ATTENTION_EVENT, handler);
    fn();
  };
  document.addEventListener(BOOT_ATTENTION_EVENT, handler);
  return () => document.removeEventListener(BOOT_ATTENTION_EVENT, handler);
}
