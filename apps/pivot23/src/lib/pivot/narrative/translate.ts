/**
 * Render-time narrative translation (gettext-style). The engine keeps writing its canonical
 * Italian text — stored saves, RNG and fingerprints never change with the language. On screen,
 * stored text is matched against the catalog: exact keys first, then parametric templates whose
 * captured slots (names, numbers, nested fragments) are translated recursively. Sentences built
 * from several fragments are segmented and translated piece by piece. Text that matches nothing
 * (old saves, proper names) is shown exactly as stored.
 */
import { normText } from "./key.ts";

export type Pairs = Readonly<Record<string, string>>;

type Template = {
  re: RegExp;
  slots: string[];
  out: string;
  /** Longest literal chunk, used as a cheap pre-filter. */
  needle: string;
  weight: number;
};

export type Catalog = {
  exact: Map<string, string>;
  byHead: Map<string, Template[]>;
  floating: Template[];
  memo: Map<string, Result>;
};

export type Result = { text: string; ok: boolean };

const SLOT = /\{([\w$]+)\}/g;
const HEAD = 4;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SENTENCE_BREAK = /(?<=[.!?…])\s+(?=[\p{Lu}{«"])/u;

/**
 * Multi-sentence entries also register each sentence on its own when source and translation
 * have the same number of sentences, so text the engine truncated or recombined still resolves.
 * Entries written explicitly always win.
 */
function sentencePairs(pairs: Pairs): [string, string][] {
  const out: [string, string][] = [];
  for (const [k, v] of Object.entries(pairs)) {
    if (typeof v !== "string") continue;
    const ks = normText(k).split(SENTENCE_BREAK);
    if (ks.length < 2) continue;
    const vs = normText(v).split(SENTENCE_BREAK);
    if (vs.length !== ks.length) continue;
    ks.forEach((ki, i) => {
      // Only sentences that open with literal text: they are indexed by head, so stay cheap.
      if (/^[^{]{4}/.test(ki) && /\p{L}{3,}/u.test(ki.replace(SLOT, ""))) out.push([ki, vs[i]!]);
    });
  }
  return out;
}

export function buildCatalog(pairs: Pairs): Catalog {
  const exact = new Map<string, string>();
  const byHead = new Map<string, Template[]>();
  const floating: Template[] = [];
  const seen = new Set<string>();
  for (const [rawKey, out] of [...Object.entries(pairs), ...sentencePairs(pairs)]) {
    const key = normText(rawKey);
    if (!key || typeof out !== "string" || seen.has(key)) continue;
    seen.add(key);
    if (!/\{[\w$]+\}/.test(key)) {
      if (!exact.has(key)) exact.set(key, out);
      continue;
    }
    const parts = key.split(SLOT);
    // parts: literal, slot, literal, slot, ... literal
    let src = "^";
    const slots: string[] = [];
    let needle = "";
    let weight = 0;
    parts.forEach((p, i) => {
      if (i % 2 === 0) {
        src += escapeRe(p);
        weight += p.length;
        if (p.trim().length > needle.length) needle = p.trim();
      } else {
        slots.push(p);
        src += i === parts.length - 2 && parts[parts.length - 1] === "" ? "(.+)" : "(.+?)";
      }
    });
    src += "$";
    if (weight < 2) continue;
    const tpl: Template = { re: new RegExp(src, "s"), slots, out, needle, weight };
    const head = parts[0]!;
    if (head.length >= HEAD) {
      const k = head.slice(0, HEAD).toLowerCase();
      const list = byHead.get(k) ?? [];
      list.push(tpl);
      byHead.set(k, list);
    } else floating.push(tpl);
  }
  for (const list of byHead.values()) list.sort((a, b) => b.weight - a.weight);
  floating.sort((a, b) => b.weight - a.weight);
  return { exact, byHead, floating, memo: new Map() };
}

/** Words that give away untranslated prose, used only to judge unresolved captures. */
export function looksProse(s: string, stop: RegExp): boolean {
  return stop.test(s);
}

/**
 * Text the catalog does not know is accepted as-is only when it looks like a proper name or a
 * number ("Real Madrid", "78-68", "+3"): short, capitalised, no sentence punctuation. Anything
 * else counts as unresolved, so a loose template cannot swallow half a sentence into a slot.
 */
export function nameLike(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  if (!/^[\p{Lu}\d+\-–(«"'#]/u.test(t)) return false;
  if (/[.;:!?](\s|$)/.test(t.replace(/\b(St|Jr|Sr|Mr|Dr)\./g, "").replace(/\d\.\d/g, ""))) return false;
  return t.split(/\s+/).length <= 5;
}

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function ordinal(v: string): string {
  const n = Number(v);
  if (!Number.isInteger(n)) return v;
  const mod100 = Math.abs(n) % 100;
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : ["th", "st", "nd", "rd"][Math.abs(n) % 10] ?? "th";
  return `${n}${suffix}`;
}

/** Fills an output template: {0}, {0:ord} (1st, 2nd…), {0|one|many} (picks by the slot's number). */
function fill(out: string, slots: string[], values: string[]): string {
  return out.replace(/\{([\w$]+)(?::(ord))?(?:\|([^|}]*)\|([^}]*))?\}/g, (m, name: string, fmt?: string, one?: string, many?: string, at?: number) => {
    const i = slots.indexOf(name);
    if (i < 0) return m;
    const v = values[i] ?? "";
    if (one !== undefined && many !== undefined) return Number(v) === 1 ? one : many;
    if (fmt === "ord") return ordinal(v);
    // A slot that opens the sentence starts with a capital, as English expects.
    return at === 0 ? upperFirst(v) : v;
  });
}

type Ctx = { cat: Catalog; stop: RegExp; depth: number };

function exactLookup(n: string, cat: Catalog): string | undefined {
  const hit = cat.exact.get(n);
  if (hit !== undefined) return hit;
  const first = n.charAt(0);
  if (first && first !== first.toLowerCase()) {
    const low = cat.exact.get(lowerFirst(n));
    if (low !== undefined) return upperFirst(low);
  } else if (first) {
    const up = cat.exact.get(upperFirst(n));
    if (up !== undefined) return up;
  }
  return undefined;
}

function whole(n: string, ctx: Ctx): Result | null {
  const { cat } = ctx;
  const hit = exactLookup(n, cat);
  if (hit !== undefined) return { text: hit, ok: true };
  // A label closed with a full stop ("Estate già chiusa.") is the same entry as the bare label.
  if (n.endsWith(".") && !n.endsWith("..")) {
    const bare = exactLookup(n.slice(0, -1), cat);
    if (bare !== undefined) return { text: /[.!?…]$/.test(bare) ? bare : `${bare}.`, ok: true };
  }
  const first = n.charAt(0);
  if (ctx.depth > 6) return null;
  const pools = [cat.byHead.get(n.slice(0, HEAD).toLowerCase()) ?? [], cat.floating];
  const lowered = first && first !== first.toLowerCase() ? lowerFirst(n) : null;
  if (lowered) pools.unshift(cat.byHead.get(lowered.slice(0, HEAD).toLowerCase()) ?? []);
  let partial: Result | null = null;
  for (const pool of pools) {
    for (const tpl of pool) {
      if (tpl.needle && !n.includes(tpl.needle) && !(lowered && lowered.includes(tpl.needle))) continue;
      let m = tpl.re.exec(n);
      let cap = false;
      if (!m && lowered) {
        m = tpl.re.exec(lowered);
        cap = !!m;
      }
      if (!m) continue;
      let ok = true;
      const values = m.slice(1).map((c) => {
        const r = segment(c, { ...ctx, depth: ctx.depth + 1 });
        if (!r.ok) ok = false;
        return r.text;
      });
      let text = fill(tpl.out, tpl.slots, values);
      if (cap) text = upperFirst(text);
      if (ok) return { text, ok: true };
      partial ??= { text, ok: false };
    }
  }
  return partial;
}

const SENTENCE = /(?<=[.!?…])\s+(?=\S)/;
const SEPARATORS = [" · ", " — ", " – ", ": ", "; ", ", ", " e ", " and "];

function joinPieces(pieces: string[], sep: string, ctx: Ctx): Result | null {
  if (pieces.length < 2) return null;
  const out: string[] = [];
  let ok = true;
  let i = 0;
  while (i < pieces.length) {
    let done = false;
    for (let j = pieces.length; j > i + 1; j--) {
      const r = whole(pieces.slice(i, j).join(sep), ctx);
      if (r?.ok) {
        out.push(r.text);
        i = j;
        done = true;
        break;
      }
    }
    if (done) continue;
    const r = segment(pieces[i]!, { ...ctx, depth: ctx.depth + 1 });
    if (!r.ok) ok = false;
    out.push(r.text);
    i += 1;
  }
  return { text: out.join(sep), ok };
}

export function segment(raw: string, ctx: Ctx): Result {
  const n = normText(raw);
  if (!n || !/\p{L}/u.test(n)) return { text: n, ok: true };
  const memo = ctx.cat.memo.get(n);
  if (memo) return memo;
  let res = whole(n, ctx);
  if (!res?.ok && ctx.depth <= 6) {
    const sentences = n.split(SENTENCE);
    let alt: Result | null = sentences.length > 1 ? joinPieces(sentences, " ", ctx) : null;
    if (!alt?.ok) {
      for (const sep of SEPARATORS) {
        if (!n.includes(sep)) continue;
        const r = joinPieces(n.split(sep), sep, ctx);
        if (r?.ok) {
          alt = r;
          break;
        }
        alt ??= r;
      }
    }
    if (!alt?.ok) {
      // Last resort: fragments glued without punctuation ("già giocata Hai messo…").
      const glued = n.split(/(?<=\p{Ll}) (?=\p{Lu}\p{Ll})/u);
      if (glued.length > 1) {
        const r = joinPieces(glued, " ", ctx);
        if (r?.ok) alt = r;
      }
    }
    if (alt && (alt.ok || !res)) res = alt;
  }
  if (!res) res = { text: n, ok: !looksProse(n, ctx.stop) && nameLike(n) };
  if (ctx.depth === 0 || res.ok) ctx.cat.memo.set(n, res);
  return res;
}

export function translateWith(cat: Catalog, text: string, stop: RegExp): Result {
  return segment(text, { cat, stop, depth: 0 });
}
