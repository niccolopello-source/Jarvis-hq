/** Ads-only strings (IT, EN, ES, ZH). Kept out of i18n.ts on purpose (PR #93 owns that file). ES/ZH not reviewed by native speakers. */
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
  es: {
    adLabel: "Publicidad",
    rewardOffer: "Mira un vídeo: marco dorado para la Career Card",
    rewardOfferDetail: "Opcional. Solo estético: no cambia la carrera.",
    rewardGranted: "Marco dorado desbloqueado.",
    rewardUnavailable: "No hay ningún vídeo disponible ahora.",
    privacySettings: "Preferencias de privacidad",
  },
  zh: {
    adLabel: "广告",
    rewardOffer: "观看视频：为Career Card解锁金色边框",
    rewardOfferDetail: "可选。仅改变外观：不影响生涯。",
    rewardGranted: "金色边框已解锁。",
    rewardUnavailable: "目前没有可用的视频。",
    privacySettings: "隐私设置",
  },
} as const;

export type AdStringKey = keyof (typeof STRINGS)["it"];
export function adT(key: AdStringKey, lang: string): string {
  if (lang === "en" || lang === "es" || lang === "zh") return STRINGS[lang][key];
  return STRINGS.it[key];
}
export const AD_STRINGS = STRINGS;
