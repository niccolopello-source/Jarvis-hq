/**
 * Catalog keys. A key is the Italian source text, whitespace-normalised, with every runtime slot
 * written as a placeholder: `${expr}` -> {0}, {1}…; voice variables `$CITY` -> {CITY};
 * engine tokens `__TEAM__` -> {TEAM}. The same normalisation runs on stored text before lookup.
 */
export function normText(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/ +([.,;:!?])/g, "$1")
    .trim();
}

export function keyOf(raw: string): string {
  return normText(
    raw
      .replace(/\$([A-Z][A-Z0-9_]*)/g, "{$1}")
      .replace(/__([A-Z]+)__/g, "{$1}"),
  );
}
