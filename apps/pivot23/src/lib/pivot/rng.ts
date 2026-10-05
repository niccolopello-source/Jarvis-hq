
/** RNG con seed: stessa sequenza a parità di motore, input e seed. */

export interface Rng {
  readonly seed: number;
  next(): number;
  nextInt(min: number, max: number): number;
  gaussian(mean: number, stdDev: number): number;
  pick<T>(arr: T[]): T;
  weighted<T>(items: T[], weights: number[]): T;
  chance(p: number): boolean;
  getState(): number;
  setState(state: number): void;
}

class Mulberry32 implements Rng {
  readonly seed: number;
  private state: number;
  constructor(seed: number) {
    this.seed = (seed >>> 0) || 1;
    this.state = this.seed;
  }
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  nextInt(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  gaussian(mean: number, stdDev: number) {
    const u = Math.max(1e-9, this.next());
    const v = this.next();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + z * stdDev;
  }
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)]!;
  }
  weighted<T>(items: T[], weights: number[]): T {
    const sum = weights.reduce((a, b) => a + Math.max(0, b), 0) || 1;
    let r = this.next() * sum;
    for (let i = 0; i < items.length; i++) {
      r -= Math.max(0, weights[i] ?? 0);
      if (r <= 0) return items[i]!;
    }
    return items[items.length - 1]!;
  }
  chance(p: number) {
    return this.next() < p;
  }
  getState() {
    return this.state;
  }
  setState(state: number) {
    this.state = state >>> 0 || 1;
  }
}

export function createRng(seed: number): Rng {
  return new Mulberry32(seed);
}

let CURRENT: Rng | null = null;
let FALLBACK: Rng | null = null;
let DEPTH = 0;

export function rngDepth() {
  return DEPTH;
}

export function runWithRng<T>(rng: Rng, fn: () => T): T {
  const prev = CURRENT;
  DEPTH += 1;
  CURRENT = rng;
  try {
    return fn();
  } finally {
    DEPTH -= 1;
    CURRENT = prev;
  }
}

export function currentRng(): Rng | null {
  return CURRENT;
}

let FALLBACK_DRAWS = 0;

/**
 * How many times a draw was served by the unseeded session fallback (outside withPlayer/runWithRng).
 * Such draws are not reproducible from the career seed. Tests assert it stays 0 for simulation code.
 */
export function fallbackDraws() {
  return FALLBACK_DRAWS;
}

function needRng(): Rng {
  if (CURRENT) return CURRENT;
  FALLBACK_DRAWS += 1;
  // Presentation only. A missing career context must not open an unseeded draw,
  // and this stream is not the career seed.
  if (!FALLBACK) FALLBACK = createRng(0x9e3779b9);
  return FALLBACK;
}

export function rand(): number {
  return needRng().next();
}

export function randInt(min: number, max: number) {
  return needRng().nextInt(min, max);
}

export function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]!;
}

export function chance(p: number) {
  return rand() < p;
}

export function gaussian(mean: number, stdDev: number) {
  return needRng().gaussian(mean, stdDev);
}

/** Gaussiana tagliata a k deviazioni. Le code NBA non arrivano a quattro sigma. */
export function gaussTrim(mean: number, stdDev: number, k = 2.2): number {
  const z = gaussian(mean, stdDev);
  if (!Number.isFinite(z)) return mean;
  const cap = Math.abs(k) * Math.abs(stdDev);
  return Math.min(mean + cap, Math.max(mean - cap, z));
}
