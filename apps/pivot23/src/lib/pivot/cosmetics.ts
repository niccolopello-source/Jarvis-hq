/**
 * Cosmetic catalog for the Career Card (Missione 2, frames from concept D).
 *
 * Contract:
 * - A theme is presentation only. It never enters PlayerState, the engine, RNG, the archive
 *   entry or the card fingerprint. It is stored under its own key (CARD_THEME_KEY).
 * - The five career frames (Grafite, Bronzo, Ossidiana, Holo rosso, Prisma) are free
 *   cosmetics unlocked from archived facts. Which ones a given career may wear is decided
 *   by card-frames.ts, not here.
 * - Leftover prototype palettes stay hidden behind a default-off flag, never sold, never "owned".
 * - There is no checkout. `checkout()` always answers "not-configured": no provider, no price
 *   list, no legal text exist yet (MONETIZATION-DECISIONS M-003). No transaction is simulated.
 */

import { resolveFrameId, type FrameFacts, type FrameFoil, type FrameGrade, type FrameId } from "./card-frames";

export type ThemeAvailability = "free" | "prototype";

export interface CardTheme {
  id: string;
  name: { it: string; en: string; es: string; zh: string };
  availability: ThemeAvailability;
  /** Visual finish of the card face. Not a commercial field. */
  foil: FrameFoil;
  /** Cosmetic grade of this frame. Labels live in legacy-i18n, not here. */
  grade: FrameGrade;
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
    name: { it: "Grafite", en: "Graphite", es: "Grafito", zh: "石墨" },
    availability: "free",
    foil: "none",
    grade: "common",
    palette: { bg1: "#2a2a2d", bg2: "#111113", ink: "#f5f5f7", muted: "#c7c7cc", accent: "#c9a46a", frame: "#8a6d43" },
  },
  {
    id: "bronze-frame",
    name: { it: "Bronzo", en: "Bronze", es: "Bronce", zh: "青铜" },
    availability: "free",
    foil: "none",
    grade: "rare",
    palette: { bg1: "#2b2420", bg2: "#120e0b", ink: "#f7f1ea", muted: "#d6c8b8", accent: "#e0b77c", frame: "#b0844c" },
  },
  {
    id: "obsidian",
    name: { it: "Ossidiana", en: "Obsidian", es: "Obsidiana", zh: "黑曜石" },
    availability: "free",
    foil: "none",
    grade: "epic",
    palette: { bg1: "#16161a", bg2: "#050506", ink: "#f2f2f4", muted: "#b9b9c0", accent: "#d4b07a", frame: "#5c4a33" },
  },
  {
    id: "holo-red",
    name: { it: "Holo rosso", en: "Red holo", es: "Holo rojo", zh: "红全息" },
    availability: "free",
    foil: "holo",
    grade: "legendary",
    palette: { bg1: "#2a1a18", bg2: "#0b0b0d", ink: "#f5f5f7", muted: "#c7c7cc", accent: "#E10600", frame: "#E10600" },
  },
  {
    id: "prisma",
    name: { it: "Prisma", en: "Prism", es: "Prisma", zh: "棱镜" },
    availability: "free",
    foil: "prism",
    grade: "mythic",
    palette: { bg1: "#3a0a0a", bg2: "#0a2030", ink: "#fff8f0", muted: "#d7cfc8", accent: "#f0d7a0", frame: "#f0d7a0" },
  },
  {
    id: "parquet",
    name: { it: "Parquet notturno", en: "Night hardwood", es: "Parqué nocturno", zh: "夜色地板" },
    availability: "prototype",
    foil: "none",
    grade: "common",
    palette: { bg1: "#33261b", bg2: "#140f0a", ink: "#fbf6ef", muted: "#dccdbd", accent: "#d9a35c", frame: "#7a5632" },
  },
];

export const DEFAULT_THEME_ID = "standard";

/** Isolated, default-off. Nothing commercial turns on because a constant exists. */
export const COSMETIC_FLAGS = {
  /** Shows leftover prototype palettes as previews (labelled, not selectable for keeps). */
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

/** The five unlockable frames, in grade order, without leftover prototypes. */
export function catalogFrames(): readonly CardTheme[] {
  return CARD_THEMES.filter((t) => t.availability === "free");
}

const ALIASES: Record<string, string> = { bronze: "bronze-frame" };

export function themeById(id: string | null | undefined): CardTheme {
  const resolved = id ? ALIASES[id] ?? id : DEFAULT_THEME_ID;
  return CARD_THEMES.find((t) => t.id === resolved) ?? CARD_THEMES[0]!;
}

/** Only free catalog frames can be kept. Prototypes are previews: there is no ownership to grant. */
export function isUsableTheme(id: string): boolean {
  const resolved = ALIASES[id] ?? id;
  return CARD_THEMES.some((t) => t.id === resolved && t.availability === "free");
}

export function checkout(themeId: string): CheckoutResult {
  const theme = CARD_THEMES.find((t) => t.id === themeId) ?? (ALIASES[themeId] ? themeById(themeId) : undefined);
  if (!theme) return { ok: false, reason: "unknown-item" };
  if (theme.availability === "free") return { ok: false, reason: "free-item" };
  return { ok: false, reason: "not-configured" };
}

export const localCatalog: CosmeticCatalogModule = { list: visibleThemes, isUsable: isUsableTheme, checkout };

export const CARD_THEME_KEY = "pivot-v2-card-theme";

export function loadCardTheme(store: Pick<Storage, "getItem"> | null = safeLocal()): string {
  try {
    const raw = store?.getItem(CARD_THEME_KEY);
    return raw && isUsableTheme(raw) ? ALIASES[raw] ?? raw : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

/** Saves a free theme. Returns false (and saves nothing) for prototypes or a storage failure. */
export function saveCardTheme(id: string, store: Pick<Storage, "setItem"> | null = safeLocal()): boolean {
  const resolved = ALIASES[id] ?? id;
  if (!isUsableTheme(resolved)) return false;
  try {
    store?.setItem(CARD_THEME_KEY, resolved);
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


export const CARD_FRAME_MAP_KEY = "pivot-v2-card-frames";

function readFrameMap(store: Pick<Storage, "getItem"> | null): Record<string, string> {
  try {
    const raw = store?.getItem(CARD_FRAME_MAP_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === "string" && k && typeof v === "string" && isUsableTheme(v)) out[k] = ALIASES[v] ?? v;
    }
    return out;
  } catch {
    return {};
  }
}

/** Preference for this career only. If none is stored, the highest unlocked frame is used. */
export function loadCareerFrame(
  careerId: string | undefined,
  facts: FrameFacts,
  store: Pick<Storage, "getItem"> | null = safeLocal(),
): FrameId {
  const preferred = careerId ? readFrameMap(store)[careerId] : undefined;
  return resolveFrameId(preferred, facts);
}

/** Keeps the global last-used theme and, when a career id is known, the per-career choice. */
export function saveCareerFrame(
  careerId: string | undefined,
  id: string,
  store: (Pick<Storage, "getItem" | "setItem">) | null = safeLocal(),
): boolean {
  if (!saveCardTheme(id, store)) return false;
  if (!careerId || !store) return true;
  try {
    const map = readFrameMap(store);
    map[careerId] = ALIASES[id] ?? id;
    store.setItem(CARD_FRAME_MAP_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}
