#!/usr/bin/env node
/**
 * Renders the intro sounds offline to a WAV so they can be heard without opening the app.
 * Usage: node scripts/render-intro-sounds.mjs [out.wav] [--short]
 *
 * It runs the real synth (src/intro-sound/synth.ts) in Chromium's OfflineAudioContext: the file is exactly
 * what the browser plays. t = 0 in the WAV is the start of the home premiere (cineReveal), so the cues sit
 * at their production timestamps. --short renders the 1.6 s premiere (returning visit / lean device).
 */
/* global OfflineAudioContext -- page.evaluate body runs in Chromium */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith("--")) ?? "intro-sounds.wav";
const short = args.includes("--short");
const root = fileURLToPath(new URL("..", import.meta.url));

const server = await createServer({ root, configFile: `${root}/vite.config.ts`, server: { port: 0, host: "127.0.0.1", strictPort: false }, logLevel: "error" });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${base}src/intro-sound/timeline.ts`);
  const result = await page.evaluate(async ({ short }) => {
    const synth = await import("/src/intro-sound/synth.ts");
    const tl = await import("/src/intro-sound/timeline.ts");
    const cues = short ? tl.SHORT_TIMELINE : tl.FULL_TIMELINE;
    const sampleRate = 48000;
    const seconds = cues[cues.length - 1].at / 1000 + 1.1;
    const ctx = new OfflineAudioContext(2, Math.ceil(sampleRate * seconds), sampleRate);
    const master = synth.makeMaster(ctx);
    master.output.connect(ctx.destination);
    const bus = synth.makeBus(ctx, master.input);
    for (const cue of cues) synth.playCue(bus, cue.name, cue.at / 1000);
    const buf = await ctx.startRendering();
    const pcm = new Int16Array(buf.length * 2);
    let peak = 0;
    for (let i = 0; i < buf.length; i++) {
      for (let ch = 0; ch < 2; ch++) {
        const v = buf.getChannelData(ch)[i];
        peak = Math.max(peak, Math.abs(v));
        pcm[i * 2 + ch] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
      }
    }
    const bytes = new Uint8Array(pcm.buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { b64: btoa(bin), sampleRate, cues, peak };
  }, { short });
  const data = Buffer.from(result.b64, "base64");
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(result.sampleRate, 24);
  header.writeUInt32LE(result.sampleRate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(out, Buffer.concat([header, data]));
  console.log(`${out}: ${result.cues.map((c) => `${c.name}@${c.at}ms`).join(" ")} peak ${result.peak.toFixed(3)}`);
} finally {
  await browser.close();
  await server.close();
}
