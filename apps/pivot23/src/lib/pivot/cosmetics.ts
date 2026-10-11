/**
 * Cosmetic catalog for the Career Card (Missione 2).
 *
 * Contract:
 * - A theme is presentation only. It never enters PlayerState, the engine, RNG, the archive
 *   entry or the card fingerprint. It is stored under its own key (CARD_THEME_KEY).
 * - The standard theme is complete and free. Any non-free item is a PROTOTYPE: visible only
 *   behind a default-off flag, never sold, never "owned".
 * - There is no checkout. `checkout()` always answers "not-configured": no provider, no price
 *   list, no legal text exist yet (MONETIZATION-DECISIONS M-003). No transaction is simulated.
 */

export type ThemeAvailability = "free" | "prototype";

export interface CardTheme {
  id: string;
  name: { it: string; en: string };
  availability: ThemeAvailability;
  /** CSS custom properties applied to the card. Also used by the PNG export. */
  palette: {
    bg1: string;
    bg2: string;
    ink: string;
    muted: string;
    accent: string;
    frame: string;
  };
}

export const CARD_THEMES: readonly CardTheme[] = [
  {
    id: "standard",
    name: { it: "Grafite", en: "Graphite" },
    availability: "free",
    palette: { bg1: "#2a2a2d", bg2: "#111113", ink: "#f5f5f7", muted: "#c7c7cc", accent: "#c9a46a", frame: "#8a6d43" },
  },
  {
    id: "obsidian",
    name: { it: "Ossidiana", en: "Obsidian" },
    availability: "free",
    palette: { bg1: "#16161a", bg2: "#050506", ink: "#f2f2f4", muted: "#b9b9c0", accent: "#d4b07a", frame: "#5c4a33" },
  },
  {
    id: "bronze-frame",
    name: { it: "Cornice bronzo", en: "Bronze frame" },
    availability: "prototype",
    palette: { bg1: "#2b2420", bg2: "#120e0b", ink: "#f7f1ea", muted: "#d6c8b8", accent: "#e0b77c", frame: "#b0844c" },
  },
  {
    id: "parquet",
    name: { it: "Parquet notturno", en: "Night hardwood" },
    availability: "prototype",
    palette: { bg1: "#33261b", bg2: "#140f0a", ink: "#fbf6ef", muted: "#dccdbd", accent: "#d9a35c", frame: "#7a5632" },
  },
];

export const DEFAULT_THEME_ID = "standard";

/** Isolated, default-off. Nothing commercial turns on because a constant exists. */
export const COSMETIC_FLAGS = {
  /** Shows prototype themes as previews (labelled, not selectable for keeps). */
  previewCatalog: false,
  /** A storefront would need provider, price list and legal text. Not built. */
  storefront: false,
} as const;

export type CosmeticFlags = { previewCatalog: boolean; storefront: boolean };

/** Module interface a future store would implement. Today only the local, free module exists. */
export interface CosmeticCatalogModule {
  list(flags: CosmeticFlags): readonly CardTheme[];
  isUsable(themeId: string): boolean;
  checkout(themeId: string): CheckoutResult;
}

export type CheckoutResult = { ok: false; reason: "not-configured" | "free-item" | "unknown-item" };

export function visibleThemes(flags: CosmeticFlags = COSMETIC_FLAGS): readonly CardTheme[] {
  return CARD_THEMES.filter((t) => t.availability === "free" || flags.previewCatalog);
}

export function themeById(id: string | null | undefined): CardTheme {
  return CARD_THEMES.find((t) => t.id === id) ?? CARD_THEMES[0]!;
}

/** Only free themes can be kept. Prototypes are previews: there is no ownership to grant. */
export function isUsableTheme(id: string): boolean {
  return CARD_THEMES.some((t) => t.id === id && t.availability === "free");
}

export function checkout(themeId: string): CheckoutResult {
  const theme = CARD_THEMES.find((t) => t.id === themeId);
  if (!theme) return { ok: false, reason: "unknown-item" };
  if (theme.availability === "free") return { ok: false, reason: "free-item" };
  return { ok: false, reason: "not-configured" };
}

export const localCatalog: CosmeticCatalogModule = { list: visibleThemes, isUsable: isUsableTheme, checkout };

export const CARD_THEME_KEY = "pivot-v2-card-theme";

export function loadCardTheme(store: Pick<Storage, "getItem"> | null = safeLocal()): string {
  try {
    const raw = store?.getItem(CARD_THEME_KEY);
    return raw && isUsableTheme(raw) ? raw : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

/** Saves a free theme. Returns false (and saves nothing) for prototypes or a storage failure. */
export function saveCardTheme(id: string, store: Pick<Storage, "setItem"> | null = safeLocal()): boolean {
  if (!isUsableTheme(id)) return false;
  try {
    store?.setItem(CARD_THEME_KEY, id);
    return !!store;
  } catch {
    return false;
  }
}

function safeLocal(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
