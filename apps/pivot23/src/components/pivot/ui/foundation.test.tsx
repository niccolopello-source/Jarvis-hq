import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Badge } from "./Badge.tsx";
import { Button, SecondaryButton } from "./Button.tsx";
import { CareerCard } from "./CareerCard.tsx";
import { Chart } from "./Chart.tsx";
import { Choice } from "./Choice.tsx";
import { Stat, StatGroup } from "./Stat.tsx";
import { Timeline } from "./Timeline.tsx";

test("primary button is a real button and does not submit", () => {
  const html = renderToStaticMarkup(<Button>Go</Button>);
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /class="dx-btn"/);
  assert.match(html, />Go</);
});

test("secondary button stays quiet", () => {
  const html = renderToStaticMarkup(<SecondaryButton>Back</SecondaryButton>);
  assert.match(html, /dx-btn-secondary/);
});

test("choice exposes the selected state", () => {
  const html = renderToStaticMarkup(<Choice label="Stay" detail="One more year" selected />);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Stay/);
  assert.match(html, /One more year/);
});

test("stats keep a group name and a readable number", () => {
  const html = renderToStaticMarkup(
    <StatGroup label="Career">
      <Stat value="18" label="Seasons" />
    </StatGroup>,
  );
  assert.match(html, /role="group"/);
  assert.match(html, /aria-label="Career"/);
  assert.match(html, />18</);
  assert.match(html, /Seasons/);
});

test("career card is a record shell, not a wallet", () => {
  const html = renderToStaticMarkup(
    <CareerCard name="Audit" role="SF" years="19-36" classification="Hall">
      <Badge>Title</Badge>
    </CareerCard>,
  );
  assert.match(html, /dx-hero/);
  assert.match(html, />Audit</);
  assert.match(html, /SF/);
  assert.doesNotMatch(html, /nft|wallet|blockchain/i);
});

test("chart frame names the curve and does not draw one", () => {
  const html = renderToStaticMarkup(<Chart label="Overall" />);
  assert.match(html, /<figure/);
  assert.match(html, /<figcaption[^>]*>Overall</);
  assert.doesNotMatch(html, /recharts|<svg/i);
});

test("timeline marks only the active beat", () => {
  const html = renderToStaticMarkup(
    <Timeline
      label="Career"
      items={[
        { id: "d", title: "Draft" },
        { id: "t", title: "Title", active: true },
      ]}
    />,
  );
  assert.equal(html.match(/data-active="true"/g)?.length, 1);
  assert.match(html, /data-active="false"/);
  assert.match(html, /Draft/);
});

test("phase 1 leaves the certified screen buttons alone", () => {
  const css = readFileSync(new URL("../../../styles.css", import.meta.url), "utf8");
  assert.match(css, /--color-accent:\s*#C40018/);
  assert.match(css, /--color-accent:\s*#E10600/);
  assert.match(css, /\.primary-btn \{[\s\S]*?background:\s*var\(--color-wood\)/);
});

test("deluxe tokens follow the live accent and honor reduced motion", () => {
  const css = readFileSync(new URL("../../../styles/deluxe.css", import.meta.url), "utf8");
  assert.match(css, /--dx-space-4:\s*16px/);
  assert.match(css, /--dx-radius-m:\s*12px/);
  assert.match(css, /--dx-motion-micro:\s*180ms/);
  assert.match(css, /background:\s*var\(--color-accent\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
