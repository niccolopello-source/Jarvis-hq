/** Ads-only strings (IT + EN). Kept out of i18n.ts on purpose (PR #93 owns that file). */
const STRINGS = {
  it: {
    adLabel: "Pubblicità",
    rewardOffer: "Guarda un video: cornice oro per la Career Card",
    rewardOfferDetail: "Facoltativo. Solo estetica: non cambia la carriera.",
    rewardGranted: "Cornice oro sbloccata.",
    rewardUnavailable: "Nessun video disponibile ora.",
    privacySettings: "Preferenze privacy",
  },
  en: {
    adLabel: "Advertisement",
    rewardOffer: "Watch a video: gold frame for your Career Card",
    rewardOfferDetail: "Optional. Cosmetic only: your career is unaffected.",
    rewardGranted: "Gold frame unlocked.",
    rewardUnavailable: "No video available right now.",
    privacySettings: "Privacy settings",
  },
} as const;

export type AdStringKey = keyof (typeof STRINGS)["it"];
export function adT(key: AdStringKey, lang: string): string {
  return (lang === "en" ? STRINGS.en : STRINGS.it)[key];
}
export const AD_STRINGS = STRINGS;
