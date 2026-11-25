
/** Layer di piattaforma. Spento: il gioco resta gratuito e locale. */

export const FLAGS = {
  account: false,
  tokens: false,
  nft: false,
  /** Collect reviews on a server. Off: reviews stay on this device; no network call. */
  feedbackSubmit: false,
} as const;

/** Costi futuri. Non entrano nel motore cestistico. */
export const TOKEN_COSTS = {
  careerStart: 1,
  nftMint: 3,
} as const;
