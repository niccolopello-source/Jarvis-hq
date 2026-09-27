
/** Memoria vocale: una frase, una volta per carriera. Mai riciclare. */

import { rand } from "./rng";
import type { PlayerState } from "./types";

const HEARD_MAX = 900;

const IT_STOP = new Set([
  "il",
  "lo",
  "la",
  "i",
  "gli",
  "le",
  "un",
  "uno",
  "una",
  "di",
  "a",
  "da",
  "in",
  "con",
  "su",
  "per",
  "del",
  "della",
  "dei",
  "delle",
  "al",
  "alla",
  "nel",
  "nella",
  "sul",
  "sulla",
]);

export function voiceKey(line: string): string {
  return line
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\$[a-z]+/gi, "")
    .replace(/[0-9]+(?:\.[0-9]+)?/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 1 && !IT_STOP.has(w))
    .slice(0, 14)
    .join(" ");
}

function heardOf(s: PlayerState): string[] {
  if (!s.heardLines) s.heardLines = [];
  return s.heardLines;
}

export function tooClose(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const w3a = a.split(" ").slice(0, 3).join(" ");
  const w3b = b.split(" ").slice(0, 3).join(" ");
  if (w3a.split(" ").length >= 3 && w3a === w3b) return true;
  const wa = a.split(" ").slice(0, 4).join(" ");
  const wb = b.split(" ").slice(0, 4).join(" ");
  if (wa && wa === wb) return true;
  const sa = a.split(" ").filter((w) => w.length > 3);
  const sb = b.split(" ").filter((w) => w.length > 3);
  if (sa.length < 3 || sb.length < 3) return false;
  const setA = new Set(sa);
  let hit = 0;
  for (const w of sb) if (setA.has(w)) hit += 1;
  return hit >= Math.min(4, Math.ceil(Math.min(sa.length, sb.length) * 0.7));
}

/** Sceglie una riga non ancora usata. Pozzo corto (≤8): "" se esausto. Pozzo lungo: LRU. */
export function pickFresh(s: PlayerState, pool: readonly string[]): string {
  if (!pool.length) return "";
  const heard = heardOf(s);
  const keyed = pool.map((line) => ({
    line,
    key: voiceKey(line) || line.toLowerCase().slice(0, 32),
  }));
  const unused = keyed.filter((x) => x.key && !heard.includes(x.key));
  const recent = heard.slice(-14);
  let pickFrom = unused.filter((x) => !recent.some((h) => tooClose(x.key, h)));
  if (!pickFrom.length) pickFrom = unused;
  if (!pickFrom.length) {
    if (keyed.length <= 8) return "";
    const ranked = keyed.filter((x) => x.key).sort((a, b) => heard.lastIndexOf(a.key) - heard.lastIndexOf(b.key));
    const distant = ranked.filter((x) => !recent.includes(x.key) && !recent.some((h) => tooClose(x.key, h)));
    pickFrom = distant.length ? distant : ranked;
  }
  if (!pickFrom.length) return pool[0] ?? "";
  const chosen = pickFrom[Math.floor(rand() * pickFrom.length)]!;
  if (chosen.key) {
    const idx = heard.indexOf(chosen.key);
    if (idx >= 0) heard.splice(idx, 1);
    if (heard.length >= HEARD_MAX) heard.shift();
    heard.push(chosen.key);
  }
  return chosen.line;
}

export function sceneVars(s: PlayerState): Record<string, string> {
  const city = s.team?.city || "questa città";
  const team = s.team?.name || "la squadra";
  return {
    CITY: city,
    TEAM: team,
    FANS: `la piazza di ${city}`,
    AGE: String(s.age ?? 20),
    COACH: s.coachName || "l'allenatore",
    RIVAL: s.rivalName || "il rivale",
    ARENA: `il palazzetto di ${city}`,
  };
}

export function say(s: PlayerState, pool: readonly string[], vars?: Record<string, string>): string {
  const line = pickFresh(s, pool);
  if (!line) return "";
  return fillVars(line, { ...sceneVars(s), ...vars });
}

/** Come say, con un fatto di riserva (nomi, punteggio) se il pozzo è asciutto. */
export function sayOr(
  s: PlayerState,
  pool: readonly string[],
  vars: Record<string, string> | undefined,
  fallback: string,
): string {
  const line = say(s, pool, vars);
  if (line) return line;
  const filled = fillVars(fallback, { ...sceneVars(s), ...vars });
  return filled || fallback.trim() || "Il mestiere resta.";
}

export function fillVars(line: string, vars: Record<string, string>): string {
  let out = line;
  for (const [k, v] of Object.entries(vars)) {
    const val = v == null ? "" : String(v);
    if (val === "undefined" || val === "null") continue;
    out = out.replaceAll(`$${k}`, val);
  }
  out = out.replace(/\$[A-Z][A-Z0-9_]*/g, "");
  out = out.replace(/ {2,}/g, " ").replace(/ +([.,;:!?])/g, "$1").trim();
  out = out.replace(/(^|[.!?]\s+)([a-zàèéìòù])/g, (_m, a, c) => a + c.toUpperCase());
  if (!out) {
    const salvage = String(line || "")
      .replace(/\$[A-Z][A-Z0-9_]*/g, " ")
      .replace(/ {2,}/g, " ")
      .trim();
    if (salvage) return salvage;
  }
  return out;
}
