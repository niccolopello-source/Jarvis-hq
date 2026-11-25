import assert from "node:assert/strict";
import test from "node:test";
import { INSTAGRAM_HANDLE } from "@/config/social";
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
  name: "Luca Bianchi",
  role: "Guardia",
  span: "2019–2033",
  ages: "19–33",
  seasons: 14,
  peak: 88,
  titles: 2,
  honors: ["4× All-Star", "MVP"],
  averages: { ppg: 18.6, rpg: 4.2, apg: 6.1 },
  teams: ["BOS", "NYK"],
  lang: "it",
};

test("share text is a short spoiler-free summary built only from the provided career data", () => {
  const text = buildCareerShareText(rich);
  assert.equal(text, [
    "🏀 PIVOT 23",
    "Luca Bianchi · Guardia",
    "2019–2033 · 19–33 · 14 stagioni",
    "📈 Picco 88 · 🏆 2 titoli",
    "4× All-Star · MVP",
    "18,6 PPG · 4,2 RPG · 6,1 APG",
    "BOS · NYK",
    CAREER_SHARE_URL,
    `@${INSTAGRAM_HANDLE}`,
  ].join("\n"));
  assert.doesNotMatch(text, /undefined|NaN|null|\{\w+\}/);
  // No story, diary, playoff opponents or narrative verdict.
  assert.doesNotMatch(text, /storia|diario|playoff|contro|sui |over the|Mavericks|verdict|spoiler/i);
  assert.equal(text.includes(CAREER_SHARE_URL), true);
  assert.equal(instagramMention(), `@${INSTAGRAM_HANDLE}`);
  assert.equal(INSTAGRAM_HANDLE, "pivot23poweredbytotem");
});

test("sparse careers omit empty facts instead of inventing zeros", () => {
  const text = buildCareerShareText({
    name: "Ritiro Test",
    role: "Playmaker",
    span: null,
    ages: "34–34",
    seasons: 0,
    peak: null,
    titles: 0,
    honors: [],
    averages: null,
    teams: [],
    lang: "it",
  });
  assert.equal(text, [
    "🏀 PIVOT 23",
    "Ritiro Test · Playmaker",
    "34–34",
    CAREER_SHARE_URL,
    `@${INSTAGRAM_HANDLE}`,
  ].join("\n"));
  assert.doesNotMatch(text, /0 titol|Picco|PPG|🏆|📈|stagion/);
});

test("English, Spanish and Chinese share texts are not leftover Italian", () => {
  const base = { ...rich, role: "Guard", honors: ["4× All-Star", "MVP"] };
  const en = buildCareerShareText({ ...base, lang: "en" });
  const es = buildCareerShareText({ ...base, role: "Escolta", lang: "es" });
  const zh = buildCareerShareText({ ...base, role: "得分后卫", lang: "zh" });
  assert.match(en, /14 seasons/);
  assert.match(en, /Peak 88/);
  assert.match(en, /2 titles/);
  assert.match(en, /18\.6 PPG/);
  assert.doesNotMatch(en, /stagion|titol|Picco|Guardia/);
  assert.match(es, /14 temporadas/);
  assert.match(es, /Pico 88/);
  assert.match(es, /2 títulos/);
  assert.match(es, /18,6 PPG/);
  assert.doesNotMatch(es, /stagion|titoli|Picco/);
  assert.match(zh, /14个赛季/);
  assert.match(zh, /巅峰 88/);
  assert.match(zh, /2个总冠军/);
  assert.match(zh, /18\.6 PPG/);
  assert.doesNotMatch(zh, /stagion|titol|Picco/);
  for (const text of [en, es, zh]) {
    assert.ok(text.includes(CAREER_SHARE_URL));
    assert.ok(text.includes(`@${INSTAGRAM_HANDLE}`));
    assert.ok(text.startsWith(`🏀 ${CAREER_SHARE_TITLE}`));
  }
});

test("WhatsApp url carries the share text and does not hit any other host", () => {
  const text = buildCareerShareText(rich);
  const url = whatsAppShareUrl(text);
  assert.equal(url.startsWith("https://wa.me/?text="), true);
  assert.equal(decodeURIComponent(url.slice("https://wa.me/?text=".length)), text);
  assert.doesNotMatch(url, /api\.|pixel|analytics|doubleclick/i);
});

test("native share feature detection: none, text, or files", () => {
  assert.equal(nativeShareLevel(undefined), "none");
  assert.equal(nativeShareLevel({}), "none");
  assert.equal(nativeShareLevel({ share: async () => undefined }), "text");
  assert.equal(nativeShareLevel({ share: async () => undefined, canShare: () => false }), "none");
  const file = new File(["png"], "pivot23-luca-bianchi.png", { type: "image/png" });
  assert.equal(nativeShareLevel({ share: async () => undefined, canShare: (d) => !d.files }, file), "text");
  assert.equal(nativeShareLevel({ share: async () => undefined, canShare: () => true }, file), "files");
  assert.equal(
    nativeShareLevel({
      share: async () => undefined,
      canShare: () => {
        throw new Error("no");
      },
    }),
    "none",
  );
});

test("tryNativeShare reports shared, aborted, unavailable and failed without throwing", async () => {
  const text = buildCareerShareText(rich);
  assert.equal(await tryNativeShare({ text, nav: null }), "unavailable");
  const shared: ShareData[] = [];
  assert.equal(await tryNativeShare({ text, nav: { share: async (d) => { shared.push(d); } } }), "shared");
  assert.equal(shared[0]?.title, CAREER_SHARE_TITLE);
  assert.equal(shared[0]?.text, text);
  assert.equal(shared[0]?.url, CAREER_SHARE_URL);
  assert.equal(shared[0]?.files, undefined);
  const file = new File(["png"], "pivot23-luca.png", { type: "image/png" });
  const withFile: ShareData[] = [];
  assert.equal(
    await tryNativeShare({
      text,
      file,
      nav: { share: async (d) => { withFile.push(d); }, canShare: () => true },
    }),
    "shared",
  );
  assert.equal(withFile[0]?.files?.[0], file);
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
