/**
 * Procedural basketball sounds, synthesized with the Web Audio API at play time.
 *
 * No samples, no files, no network: every sound is built from oscillators and seeded white noise, so the
 * audio is original to this repository (same licence as the code) and adds 0 bytes of assets. It works with
 * any BaseAudioContext, so scripts/render-intro-sounds.mjs renders the exact same code offline to a WAV.
 *
 * - bounce: a hardwood dribble. A low body thump with a fast pitch drop (ball compressing on the floor),
 *   the ball's own hollow ring, and a short bright slap of rubber on varnish, with a short gym reverb.
 * - swish: the ball through a rim-less net. A band-pass noise sweep with a net-string flutter, an airy top
 *   layer, a soft low push as the ball fills the net and a smaller rustle as the net snaps back.
 */

export type Voice = { gain: number; pitch: number; decay: number; slapHz: number };

/** Three dribbles that are not clones. The third is the gather: heavier, lower, shorter. */
export const BOUNCE_1: Voice = { gain: 1.16, pitch: 0.94, decay: 1.18, slapHz: 1480 };
export const BOUNCE_2: Voice = { gain: 0.68, pitch: 1.18, decay: 0.76, slapHz: 2480 };
export const BOUNCE_3: Voice = { gain: 1.28, pitch: 0.82, decay: 0.52, slapHz: 1100 };

const FLOOR = 0.0001; // exponential ramps can never reach 0

type Bus = { ctx: BaseAudioContext; out: AudioNode; noise: AudioBuffer };
type Track = (node: AudioScheduledSourceNode) => void;

/** Seeded white noise (mulberry32), so the offline render is reproducible bit for bit. */
export function makeNoise(ctx: BaseAudioContext, seconds = 1, seed = 23): AudioBuffer {
  const length = Math.max(1, Math.round(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let a = seed >>> 0;
  for (let i = 0; i < length; i++) {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    data[i] = (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
  return buffer;
}

/** A decaying-noise impulse response: a small, slightly live gym. */
export function makeRoom(ctx: BaseAudioContext, seconds = 0.82, seed = 7): AudioBuffer {
  const length = Math.max(1, Math.round(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let a = (seed + ch * 101) >>> 0;
    for (let i = 0; i < length; i++) {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      const white = (a / 4294967296) * 2 - 1;
      const t = i / ctx.sampleRate;
      data[i] = white * Math.exp(-t * 11) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  return buffer;
}

/** Master chain: dry + short room, glued by a gentle compressor so the dribbles and the swish sit in one gym. */
export function makeMaster(ctx: BaseAudioContext, volume = 0.86): { input: GainNode; output: GainNode } {
  const input = ctx.createGain();
  const output = ctx.createGain();
  output.gain.value = volume;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.24;
  const room = ctx.createConvolver();
  room.buffer = makeRoom(ctx);
  const wet = ctx.createGain();
  wet.gain.value = 0.36;
  input.connect(comp);
  input.connect(room);
  room.connect(wet);
  wet.connect(comp);
  comp.connect(output);
  return { input, output };
}

function envelope(param: AudioParam, t: number, peak: number, attack: number, decay: number) {
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.exponentialRampToValueAtTime(FLOOR, t + attack + decay);
}

function noiseSource(bus: Bus, t: number, length: number, offset: number, track: Track): AudioBufferSourceNode {
  const src = bus.ctx.createBufferSource();
  src.buffer = bus.noise;
  src.loop = true;
  src.start(t, offset % Math.max(0.001, bus.noise.duration));
  src.stop(t + length);
  track(src);
  return src;
}

/** One dribble on hardwood starting at context time `t`. Returns when its tail has died out. */
export function bounce(bus: Bus, t: number, v: Voice, track: Track = () => {}): number {
  const { ctx, out } = bus;
  const end = t + 0.44 * v.decay + 0.04;

  // Body: the floor thump, pitch falling as the ball squashes and springs back.
  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(165 * v.pitch, t);
  body.frequency.exponentialRampToValueAtTime(62 * v.pitch, t + 0.085);
  const bodyGain = ctx.createGain();
  envelope(bodyGain.gain, t, 1.05 * v.gain, 0.003, 0.26 * v.decay);
  body.connect(bodyGain).connect(out);
  body.start(t);
  body.stop(end);
  track(body);

  // Ring: the inflated ball's hollow "pang", two partials that fade faster than the body.
  const partials: [number, number, number][] = [
    [392, 0.28, 0.17],
    [960, 0.09, 0.06],
  ];
  for (const [hz, peak, decay] of partials) {
    const ring = ctx.createOscillator();
    ring.type = "triangle";
    ring.frequency.setValueAtTime(hz * v.pitch, t);
    ring.frequency.exponentialRampToValueAtTime(hz * v.pitch * 0.94, t + decay);
    const ringGain = ctx.createGain();
    envelope(ringGain.gain, t + 0.002, peak * v.gain, 0.003, decay * v.decay);
    ring.connect(ringGain).connect(out);
    ring.start(t);
    ring.stop(end);
    track(ring);
  }

  // Slap: rubber on varnished wood, a very short bright noise burst.
  const slap = noiseSource(bus, t, 0.09, t * 0.37, track);
  const slapBand = ctx.createBiquadFilter();
  slapBand.type = "bandpass";
  slapBand.frequency.value = v.slapHz;
  slapBand.Q.value = 0.9;
  const slapGain = ctx.createGain();
  envelope(slapGain.gain, t, 0.7 * v.gain, 0.001, 0.035 * v.decay);
  slap.connect(slapBand).connect(slapGain).connect(out);

  // Floor: the boards under the ball, a low noise thud.
  const floor = noiseSource(bus, t, 0.22, t * 0.61 + 0.2, track);
  const floorLow = ctx.createBiquadFilter();
  floorLow.type = "lowpass";
  floorLow.frequency.value = 320;
  const floorGain = ctx.createGain();
  envelope(floorGain.gain, t, 0.72 * v.gain, 0.003, 0.14 * v.decay);
  floor.connect(floorLow).connect(floorGain).connect(out);

  return end;
}

/** The ball dropping clean through the net (no rim) at context time `t`. Returns when its tail has died out. */
export function swish(bus: Bus, t: number, track: Track = () => {}): number {
  const { ctx, out } = bus;
  const end = t + 1.2;

  // Main swish: band-pass sweep up as the ball enters, down as it leaves the net.
  const main = noiseSource(bus, t, 1.05, 0.11, track);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.85;
  band.frequency.setValueAtTime(900, t);
  band.frequency.exponentialRampToValueAtTime(5400, t + 0.22);
  band.frequency.exponentialRampToValueAtTime(1500, t + 0.9);
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, t);
  mainGain.gain.linearRampToValueAtTime(0.94, t + 0.05);
  mainGain.gain.linearRampToValueAtTime(0.5, t + 0.22);
  mainGain.gain.exponentialRampToValueAtTime(FLOOR, t + 1.05);
  // Net-string flutter: a fast tremolo that gives the "ciuffo" its knitted texture.
  const flutter = ctx.createOscillator();
  flutter.frequency.setValueAtTime(42, t);
  flutter.frequency.linearRampToValueAtTime(16, t + 0.9);
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(0.42, t);
  depth.gain.linearRampToValueAtTime(0.06, t + 0.9);
  const trem = ctx.createGain();
  trem.gain.value = 0.9;
  flutter.connect(depth).connect(trem.gain);
  flutter.start(t);
  flutter.stop(end);
  track(flutter);
  main.connect(band).connect(mainGain).connect(trem).connect(out);

  // Air: the high, breathy part of the swish.
  const air = noiseSource(bus, t + 0.008, 0.72, 0.43, track);
  const high = ctx.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 4800;
  const airGain = ctx.createGain();
  envelope(airGain.gain, t + 0.008, 0.42, 0.05, 0.55);
  air.connect(high).connect(airGain).connect(out);

  // Push: the ball filling the net, a soft low whump.
  const push = noiseSource(bus, t + 0.015, 0.18, 0.71, track);
  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 480;
  const pushGain = ctx.createGain();
  envelope(pushGain.gain, t + 0.015, 0.5, 0.012, 0.16);
  push.connect(low).connect(pushGain).connect(out);

  // First snap: the net taking the ball.
  const snap = noiseSource(bus, t + 0.12, 0.28, 0.29, track);
  const snapBand = ctx.createBiquadFilter();
  snapBand.type = "bandpass";
  snapBand.frequency.value = 3400;
  snapBand.Q.value = 1.2;
  const snapGain = ctx.createGain();
  envelope(snapGain.gain, t + 0.12, 0.36, 0.016, 0.2);
  snap.connect(snapBand).connect(snapGain).connect(out);

  // Second snap: the net closing, the actual "ciuffo" after the ball has passed.
  const close = noiseSource(bus, t + 0.28, 0.36, 0.53, track);
  const closeBand = ctx.createBiquadFilter();
  closeBand.type = "bandpass";
  closeBand.frequency.value = 2600;
  closeBand.Q.value = 0.8;
  const closeGain = ctx.createGain();
  envelope(closeGain.gain, t + 0.28, 0.46, 0.02, 0.42);
  close.connect(closeBand).connect(closeGain).connect(out);

  return end;
}

export type CueKind = "bounce1" | "bounce2" | "bounce3" | "swish";

const VOICES: Record<Exclude<CueKind, "swish">, Voice> = {
  bounce1: BOUNCE_1,
  bounce2: BOUNCE_2,
  bounce3: BOUNCE_3,
};

/** Plays one named cue into `out` at context time `t`. */
export function playCue(bus: Bus, name: CueKind, t: number, track?: Track): number {
  if (name === "swish") return swish(bus, t, track);
  return bounce(bus, t, VOICES[name], track);
}

/**
 * How far apart two oscillator starts must be before they are two cues.
 * Same unit as the start times passed in. 40 ms is under the swish's closing
 * rustle (~280 ms, a noise layer, not an oscillator) and under the 350 ms
 * minimum gap between dribbles.
 */
export const CUE_ATTACK_SPLIT_MS = 40;

/**
 * Logical cue times. A dribble starts three oscillators together; the swish starts one,
 * the net flutter, at the cue itself. Later noise layers belong to that cue.
 * A second playCue is not hidden: it starts its own oscillator.
 */
export function logicalCueStarts(
  starts: readonly { kind: string; at: number }[],
  splitMs = CUE_ATTACK_SPLIT_MS,
): number[] {
  const times = starts.filter((s) => s.kind === "osc").map((s) => s.at).sort((a, b) => a - b);
  const groups: number[] = [];
  for (const t of times) {
    const prev = groups[groups.length - 1];
    if (prev === undefined || t - prev > splitMs) groups.push(t);
  }
  return groups;
}

export function makeBus(ctx: BaseAudioContext, out: AudioNode): Bus {
  return { ctx, out, noise: makeNoise(ctx) };
}
