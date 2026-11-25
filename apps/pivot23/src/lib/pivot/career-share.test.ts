import assert from "node:assert/strict";
import test from "node:test";
import { INSTAGRAM_HANDLE } from "@/config/social";
import { storyCardOffset, PNG_H, PNG_STORY_H, PNG_STORY_W, PNG_W } from "@/components/pivot/legacy/exportPng";
import {
  CAREER_SHARE_TITLE,
  CAREER_SHARE_URL,
  buildCareerShareText,
  copyText,
  instagramMention,
  nativeShareLevel,
  tryNativeShare,
  whatsAppShareUrl,
  type CareerShareInput,
} from "./career-share";

const rich: CareerShareInput = {
  name: "Nico Ferrante",
  seasons: 17,
  titles: 5,
  verdict: "Il fenomeno.",
  lang: "it",
};

test("share text follows Lucille's format and uses only the provided career data", () => {
  const text = buildCareerShareText({ ...rich, verdict: "Il fenomeno." });
  assert.equal(text, [
    "Ho chiuso la carriera di Nico Ferrante su PIVOT 23: 17 stagioni, 5 titoli. Il fenomeno.",
    "@" + INSTAGRAM_HANDLE,
    CAREER_SHARE_URL,
    "#PIVOT23 #Basketball #Pallacanestro",
  ].join("\n"));
  assert.equal(instagramMention(), "@pivot23poweredbytotem");
  assert.doesNotMatch(text, /undefined|NaN|null|\{\w+\}/);
  assert.doesNotMatch(text, /diario|contro i |sui |Mavericks|gratis|\bapp\b/i);
  assert.equal((text.match(/#/g) || []).length, 3);
});

test("sparse careers omit empty facts instead of inventing zeros", () => {
  const text = buildCareerShareText({ name: "Ritiro Test", seasons: 0, titles: 0, verdict: "", lang: "it" });
  assert.equal(text, [
    "Ho chiuso la carriera di Ritiro Test su PIVOT 23.",
    "@" + INSTAGRAM_HANDLE,
    CAREER_SHARE_URL,
    "#PIVOT23 #Basketball #Pallacanestro",
  ].join("\n"));
  assert.doesNotMatch(text, /0 titol|0 stagion/);
});

test("a verdict without seasons or titles still appears, and titles without a verdict are kept", () => {
  const withVerdict = buildCareerShareText({ name: "Ritiro Test", seasons: 0, titles: 0, verdict: "Carriera in ombra", lang: "it" });
  assert.equal(withVerdict.split("\n")[0], "Ho chiuso la carriera di Ritiro Test su PIVOT 23. Carriera in ombra");
  const noVerdict = buildCareerShareText({ name: "Nico Ferrante", seasons: 17, titles: 5, verdict: "", lang: "it" });
  assert.equal(noVerdict.split("\n")[0], "Ho chiuso la carriera di Nico Ferrante su PIVOT 23: 17 stagioni, 5 titoli.");
});

test("English, Spanish and Chinese share texts are not leftover Italian", () => {
  const base = { name: "Nico Ferrante", seasons: 17, titles: 5, verdict: "The phenomenon." };
  const en = buildCareerShareText({ ...base, lang: "en" });
  const es = buildCareerShareText({ ...base, verdict: "El fenómeno.", lang: "es" });
  const zh = buildCareerShareText({ ...base, verdict: "现象级球员。", lang: "zh" });
  assert.equal(en.split("\n")[0], "I finished Nico Ferrante's career on PIVOT 23: 17 seasons, 5 titles. The phenomenon.");
  assert.equal(en.split("\n")[3], "#PIVOT23 #Basketball");
  assert.doesNotMatch(en, /stagion|titol|carriera|Pallacanestro/);
  assert.equal(es.split("\n")[0], "Cerré la carrera de Nico Ferrante en PIVOT 23: 17 temporadas, 5 títulos. El fenómeno.");
  assert.equal(es.split("\n")[3], "#PIVOT23 #Basketball #Baloncesto");
  assert.doesNotMatch(es, /stagion|titoli|carriera/);
  assert.match(zh, /17个赛季/);
  assert.match(zh, /5个总冠军/);
  assert.match(zh, /现象级球员/);
  assert.equal(zh.split("\n")[3], "#PIVOT23 #篮球");
  assert.doesNotMatch(zh, /stagion|titol|carriera|Pallacanestro/);
  for (const text of [en, es, zh]) {
    assert.ok(text.includes(CAREER_SHARE_URL));
    assert.ok(text.includes("@" + INSTAGRAM_HANDLE));
    assert.ok(((text.match(/#/g) || []).length) <= 3);
  }
});

test("WhatsApp app and web urls carry the share text", () => {
  const text = buildCareerShareText(rich);
  const app = whatsAppShareUrl(text, "app");
  const web = whatsAppShareUrl(text, "web");
  assert.equal(app.startsWith("https://wa.me/?text="), true);
  assert.equal(web.startsWith("https://web.whatsapp.com/send?text="), true);
  assert.equal(decodeURIComponent(app.slice(app.indexOf("=") + 1)), text);
  assert.equal(decodeURIComponent(web.slice(web.indexOf("=") + 1)), text);
  assert.doesNotMatch(app, /api\.|pixel|analytics|doubleclick/i);
  assert.doesNotMatch(web, /api\.|pixel|analytics|doubleclick/i);
});

test("native share feature detection: none, text, or files", () => {
  assert.equal(nativeShareLevel(undefined), "none");
  assert.equal(nativeShareLevel({}), "none");
  assert.equal(nativeShareLevel({ share: async () => undefined }), "text");
  assert.equal(nativeShareLevel({ share: async () => undefined, canShare: () => false }), "none");
  const file = new File(["png"], "pivot23-nico-ferrante.png", { type: "image/png" });
  assert.equal(nativeShareLevel({ share: async () => undefined, canShare: (d) => !d.files }, file), "text");
  assert.equal(nativeShareLevel({ share: async () => undefined, canShare: () => true }, file), "files");
});

test("tryNativeShare reports shared, aborted, unavailable and failed without throwing", async () => {
  const text = buildCareerShareText(rich);
  assert.equal(await tryNativeShare({ text, nav: null }), "unavailable");
  const shared: ShareData[] = [];
  assert.equal(await tryNativeShare({ text, nav: { share: async (d) => { shared.push(d); } } }), "shared");
  assert.equal(shared[0]?.title, CAREER_SHARE_TITLE);
  assert.equal(shared[0]?.text, text);
  assert.equal(shared[0]?.url, CAREER_SHARE_URL);
  const abort = Object.assign(new Error("nope"), { name: "AbortError" });
  assert.equal(await tryNativeShare({ text, nav: { share: async () => { throw abort; } } }), "aborted");
  assert.equal(await tryNativeShare({ text, nav: { share: async () => { throw new Error("boom"); } } }), "failed");
});

test("copyText uses the clipboard api when provided", async () => {
  const seen: string[] = [];
  assert.equal(await copyText("hello", { writeText: async (v) => { seen.push(v); } }), true);
  assert.deepEqual(seen, ["hello"]);
  assert.equal(await copyText("x", { writeText: async () => { throw new Error("denied"); } }), false);
});

test("the 9:16 story canvas is 1080×1920 and centers the 4:5 card", () => {
  assert.equal(PNG_W, 1080);
  assert.equal(PNG_H, 1350);
  assert.equal(PNG_STORY_W, 1080);
  assert.equal(PNG_STORY_H, 1920);
  assert.equal(storyCardOffset(), 285);
});
