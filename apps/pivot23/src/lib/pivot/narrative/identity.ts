/** An English catalog entry that keeps the Italian key as its text (whitespace-normalised). */
export const isIdentity = (key: string, value: string): boolean => key.replace(/\s+/g, " ").trim() === value;

/** Identity entries of a catalog, in catalog order. */
export function identityEntries(catalog: Readonly<Record<string, string>>): [string, string][] {
  return Object.entries(catalog).filter(([k, v]) => isIdentity(k, v));
}
