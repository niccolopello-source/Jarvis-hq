import assert from "node:assert/strict";
import test from "node:test";
import { BOUNCE_1, BOUNCE_2, BOUNCE_3, logicalCueStarts, makeBus, makeMaster, playCue } from "./synth";

/** Minimal Web Audio stand-in: records every param automation and source start/stop. */
type Event = { node: string; param: string; method: string; value: number; time: number };
function fakeContext(sampleRate = 48000) {
  const events: Event[] = [];
  const sources: { kind: string; start: number; stop: number }[] = [];
  const param = (node: string, name: string, initial = 0) => {
    const p = {
      value: initial,
      setValueAtTime: (value: number, time: number) => events.push({ node, param: name, method: "set", value, time }),
      linearRampToValueAtTime: (value: number, time: number) => events.push({ node, param: name, method: "linear", value, time }),
      exponentialRampToValueAtTime: (value: number, time: number) => {
        if (value <= 0) throw new RangeError("exponential ramp to a non-positive value");
        events.push({ node, param: name, method: "exp", value, time });
      },
      setTargetAtTime: (value: number, time: number) => events.push({ node, param: name, method: "target", value, time }),
      cancelScheduledValues: () => {},
    };
    return p;
  };
  const node = (kind: string, params: string[] = []) => {
    const n: Record<string, unknown> = { kind, connect: (dest: unknown) => dest, disconnect: () => {} };
    for (const name of params) n[name] = param(kind, name, 1);
    return n;
  };
  const source = (kind: string, params: string[]) => {
    const n = node(kind, params) as Record<string, unknown>;
    const rec = { kind, start: NaN, stop: NaN };
    sources.push(rec);
    n.start = (t: number) => {
      rec.start = t;
    };
    n.stop = (t: number) => {
      rec.stop = t;
    };
    return n;
  };
  const ctx = {
    sampleRate,
    currentTime: 0,
    destination: node("destination"),
    createBuffer: (channels: number, length: number, rate: number) => {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate: rate, duration: length / rate, getChannelData: (c: number) => data[c]! };
    },
    createGain: () => node("gain", ["gain"]),
    createOscillator: () => source("osc", ["frequency", "detune"]),
    createBufferSource: () => source("buffer", ["playbackRate"]),
    createBiquadFilter: () => node("biquad", ["frequency", "Q", "gain"]),
    createConvolver: () => node("convolver"),
    createDynamicsCompressor: () => node("comp", ["threshold", "knee", "ratio", "attack", "release"]),
  };
  return { ctx: ctx as unknown as BaseAudioContext, events, sources };
}

function render(cues: { name: "bounce1" | "bounce2" | "bounce3" | "swish"; at: number }[]) {
  const fake = fakeContext();
  const master = makeMaster(fake.ctx);
  const bus = makeBus(fake.ctx, master.input);
  const tracked: unknown[] = [];
  const ends = cues.map((c) => playCue(bus, c.name, c.at, (n) => tracked.push(n)));
  return { ...fake, ends, tracked };
}

test("every source of every cue starts at or after its cue time and stops by the returned tail end", () => {
  const cues = [
    { name: "bounce1" as const, at: 1.15 },
    { name: "bounce2" as const, at: 2.05 },
    { name: "bounce3" as const, at: 2.8 },
    { name: "swish" as const, at: 4.85 },
  ];
  const { sources, ends, tracked } = render(cues);
  assert.equal(tracked.length, sources.length, "every source is handed to the tracker, so stop() can reach it");
  const lastEnd = Math.max(...ends);
  for (const s of sources) {
    assert.ok(Number.isFinite(s.start) && Number.isFinite(s.stop), `${s.kind} start/stop scheduled`);
    assert.ok(s.start >= 1.15 - 1e-9 && s.stop > s.start && s.stop <= lastEnd + 1e-9);
  }
  assert.ok(ends[3]! - 4.85 < 1.35, "swish tail under 1.35 s");
  assert.ok(ends[0]! - 1.15 < 0.75, "bounce tail under 0.75 s");
  assert.ok(ends[2]! - 2.8 < ends[1]! - 2.05, "the gather's tail is shorter than the second dribble's");
});

test("automation values are finite and no ramp targets zero (which would throw in browsers)", () => {
  const { events } = render([
    { name: "bounce1", at: 1.15 },
    { name: "bounce2", at: 2.05 },
    { name: "bounce3", at: 2.8 },
    { name: "swish", at: 4.85 },
  ]);
  assert.ok(events.length > 30);
  for (const e of events) assert.ok(Number.isFinite(e.value) && Number.isFinite(e.time), JSON.stringify(e));
});

test("the dribbles are not clones: the second is lighter, the gather is heavier and shorter", () => {
  assert.ok(BOUNCE_2.gain < BOUNCE_1.gain);
  assert.ok(BOUNCE_2.pitch > BOUNCE_1.pitch);
  assert.ok(BOUNCE_3.gain > BOUNCE_1.gain);
  assert.ok(BOUNCE_3.pitch < BOUNCE_1.pitch);
  assert.ok(BOUNCE_3.decay < BOUNCE_2.decay);
  const a = render([{ name: "bounce1", at: 0 }]);
  const b = render([{ name: "bounce2", at: 0 }]);
  const c = render([{ name: "bounce3", at: 0 }]);
  assert.ok(b.ends[0]! < a.ends[0]!);
  assert.ok(c.ends[0]! < b.ends[0]!);
});

test("the swish is noise only (no tonal rim ping): its only oscillator is the sub-audio net flutter", () => {
  const { sources, events } = render([{ name: "swish", at: 0 }]);
  const oscs = sources.filter((s) => s.kind === "osc");
  assert.equal(oscs.length, 1);
  const freqs = events.filter((e) => e.node === "osc" && e.param === "frequency").map((e) => e.value);
  assert.ok(freqs.every((f) => f < 50), `flutter stays sub-audio (${freqs})`);
});

/** The old e2e rule: a source more than `window` after the group's first start opens a new cue. */
function groupsFromFirstStart(times: number[], window: number): number[] {
  const groups: number[] = [];
  for (const t of [...times].sort((a, b) => a - b)) {
    const prev = groups[groups.length - 1];
    if (prev === undefined || t - prev > window) groups.push(t);
  }
  return groups;
}

test("the swish is one logical cue even though its net closes about 280 ms later", () => {
  const one = render([{ name: "swish", at: 4.85 }]);
  const starts = one.sources.map((s) => s.start);
  const close = Math.max(...starts);
  assert.ok(Math.abs(close - (4.85 + 0.28)) < 1e-9, "the closing rustle is a layer of this swish, at +280 ms");
  assert.deepEqual(logicalCueStarts(one.sources.map((s) => ({ kind: s.kind, at: s.start * 1000 }))), [4850]);
  // Comparing every layer to the cue's first start, with a 250 ms window, splits that rustle off.
  assert.equal(groupsFromFirstStart(starts, 0.25).length, 2);

  const phrase = render([
    { name: "bounce1", at: 1.8 },
    { name: "bounce2", at: 3.12 },
    { name: "bounce3", at: 4.32 },
    { name: "swish", at: 7.2 },
  ]);
  assert.deepEqual(
    logicalCueStarts(phrase.sources.map((s) => ({ kind: s.kind, at: s.start * 1000 }))).map((t) => Math.round(t)),
    [1800, 3120, 4320, 7200],
  );

  // A second swish that begins as the first net closes is a real extra cue.
  // A 400 ms window, wide enough to keep the +280 ms rustle, does not report that second
  // attack. A window that also covers the second swish's own tail hides the duplicate.
  const twice = render([
    { name: "swish", at: 4.85 },
    { name: "swish", at: 4.85 + 0.28 },
  ]);
  const attacks = logicalCueStarts(twice.sources.map((s) => ({ kind: s.kind, at: s.start * 1000 })));
  assert.deepEqual(attacks.map((t) => Math.round(t)), [4850, 5130]);
  const widened = groupsFromFirstStart(
    twice.sources.map((s) => s.start),
    0.4,
  ).map((t) => Math.round(t * 1000));
  assert.ok(!widened.includes(5130), `400 ms window misses the second attack (${widened})`);
  assert.equal(groupsFromFirstStart(twice.sources.map((s) => s.start), 0.6).length, 1);
});
