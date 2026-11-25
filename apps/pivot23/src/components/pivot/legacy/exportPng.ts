/**
 * Local PNG export of the Career Card. Canvas 2D only: no server, no html-to-image dependency,
 * no foreignObject (fragile with fonts and CSP). Draws the same CardFace the screen shows.
 */
import type { CardTheme } from "@/lib/pivot/cosmetics";
import type { CardFace } from "@/lib/pivot/legacy-report";

export interface PngLabels {
  role: string;
  nation: string | null;
  seasons: string;
  ages: string;
  stats: [string, string][];
  honors: string[];
  verdict: string;
  footer: string;
  peak: string;
  grade?: string;
  themeName?: string;
}

export const PNG_W = 1080;
export const PNG_H = 1350;
/** Instagram Story canvas: the 4:5 card is centered, with free margins above and below. */
export const PNG_STORY_W = 1080;
export const PNG_STORY_H = 1920;
export type PngVariant = "feed" | "story";

export function storyCardOffset(cardH = PNG_H, storyH = PNG_STORY_H): number {
  return Math.round((storyH - cardH) / 2);
}
const FONT = "Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/** Largest font size (down to min) at which text fits maxWidth. Returns the size used. */
function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, start: number, min: number, maxWidth: number): number {
  let size = start;
  for (; size > min; size -= 2) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  ctx.font = `${weight} ${min}px ${FONT}`;
  return min;
}

/** Shortens text with an ellipsis so it never clips past maxWidth. */
function clampText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 80, size / 80);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 5.4;
  ctx.beginPath();
  ctx.arc(40, 40, 34.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3.15;
  ctx.lineCap = "round";
  ctx.stroke(new Path2D("M22.2 22.4 A22.2 22.2 0 0 1 57.8 22.4"));
  ctx.stroke(new Path2D("M57.8 57.6 A22.2 22.2 0 0 1 22.2 57.6"));
  ctx.lineWidth = 4.4;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(4.2, 40); ctx.lineTo(16.6, 40);
  ctx.moveTo(63.4, 40); ctx.lineTo(75.8, 40);
  ctx.stroke();
  ctx.font = `700 26px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("23", 40, 41.5);
  ctx.restore();
}

function drawFoil(ctx: CanvasRenderingContext2D, theme: CardTheme, W: number, H: number) {
  if (theme.foil === "none") return;
  ctx.save();
  if (theme.foil === "holo") {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0.2, "rgba(225,6,0,0)");
    g.addColorStop(0.35, "rgba(255,80,40,0.18)");
    g.addColorStop(0.45, "rgba(255,210,120,0.22)");
    g.addColorStop(0.55, "rgba(120,220,255,0.16)");
    g.addColorStop(0.65, "rgba(200,140,255,0.14)");
    g.addColorStop(0.8, "rgba(225,6,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = typeof ctx.createConicGradient === "function"
      ? ctx.createConicGradient(2.2, W * 0.5, H * 0.4)
      : ctx.createLinearGradient(0, 0, W, H);
    if ("addColorStop" in g) {
      g.addColorStop(0, "rgba(225,6,0,0.2)");
      g.addColorStop(0.25, "rgba(240,162,74,0.16)");
      g.addColorStop(0.5, "rgba(126,224,255,0.16)");
      g.addColorStop(0.75, "rgba(201,160,255,0.16)");
      g.addColorStop(1, "rgba(225,6,0,0.2)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }
  ctx.restore();
}

export function drawCard(ctx: CanvasRenderingContext2D, face: CardFace, theme: CardTheme, l: PngLabels) {
  const p = theme.palette;
  const W = PNG_W, H = PNG_H, pad = 84, inner = W - pad * 2;
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, p.bg1);
  g.addColorStop(1, p.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  drawFoil(ctx, theme, W, H);
  ctx.strokeStyle = p.frame;
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  drawLogo(ctx, pad, pad, 100, p.ink);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  if (l.themeName) {
    ctx.fillStyle = p.ink;
    ctx.font = `700 32px ${FONT}`;
    ctx.fillText(clampText(ctx, l.themeName, inner / 2), W - pad, pad + 64);
  }

  const artTop = 210, artH = 300;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(pad, artTop, inner, artH);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = p.ink;
  if (face.number !== null) {
    ctx.font = `800 260px ${FONT}`;
    ctx.fillText(String(face.number), W / 2, artTop + artH / 2);
  } else {
    drawLogo(ctx, W / 2 - 70, artTop + artH / 2 - 70, 140, p.ink);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.muted;
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText(clampText(ctx, [l.role, l.nation].filter(Boolean).join(" · "), inner), pad, 560);

  const nameWidth = face.number !== null ? inner - 160 : inner;
  ctx.fillStyle = p.ink;
  fitText(ctx, face.name, 800, 92, 48, nameWidth);
  ctx.fillText(clampText(ctx, face.name, nameWidth), pad, 655);
  if (face.number !== null) {
    ctx.textAlign = "right";
    ctx.fillStyle = p.accent;
    ctx.font = `800 96px ${FONT}`;
    ctx.fillText(String(face.number), W - pad, 655);
    ctx.textAlign = "left";
  }

  ctx.fillStyle = p.muted;
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(clampText(ctx, [face.span, l.ages, l.seasons, l.peak].filter(Boolean).join(" · "), inner), pad, 710);

  ctx.fillStyle = p.accent;
  ctx.fillRect(pad, 740, 120, 4);

  const colW = inner / Math.max(1, l.stats.length);
  l.stats.forEach(([value, label], i) => {
    const x = pad + colW * i;
    ctx.fillStyle = p.ink;
    fitText(ctx, value, 800, 84, 40, colW - 20);
    ctx.fillText(value, x, 840);
    ctx.fillStyle = p.muted;
    ctx.font = `600 26px ${FONT}`;
    ctx.fillText(clampText(ctx, label.toUpperCase(), colW - 20), x, 884);
  });

  let y = 950;
  ctx.font = `700 32px ${FONT}`;
  for (const h of l.honors.slice(0, 3)) {
    ctx.fillStyle = p.accent;
    ctx.fillRect(pad, y - 24, 10, 26);
    ctx.fillStyle = p.ink;
    ctx.font = `700 32px ${FONT}`;
    ctx.fillText(clampText(ctx, h, inner - 30), pad + 28, y);
    y += 50;
  }

  ctx.fillStyle = p.muted;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(clampText(ctx, face.teams.map((t) => t.abbr).join(" · "), inner * 0.62), pad, 1140);
  ctx.fillStyle = p.ink;
  fitText(ctx, l.verdict, 700, 40, 26, inner * 0.62);
  ctx.fillText(clampText(ctx, l.verdict, inner * 0.62), pad, 1200);
  if (l.grade) {
    ctx.textAlign = "right";
    ctx.fillStyle = p.accent;
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText(clampText(ctx, l.grade.toUpperCase(), inner * 0.34), W - pad, 1200);
    ctx.textAlign = "left";
  }
  ctx.fillStyle = p.muted;
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText(clampText(ctx, l.footer, inner), pad, H - pad + 10);
}

export type ExportOutcome = "done" | "unsupported" | "failed";

/** Renders the Career Card to a PNG blob in memory. No download, no network.
 *  `feed` is the 1080×1350 figurine (4:5). `story` places that same figurine on a 1080×1920
 *  canvas (9:16), centered, so Instagram Stories keep UI margins. */
export async function renderCardPngBlob(face: CardFace, theme: CardTheme, labels: PngLabels, variant: PngVariant = "feed"): Promise<{ ok: true; blob: Blob } | { ok: false; outcome: Exclude<ExportOutcome, "done"> }> {
  if (typeof document === "undefined") return { ok: false, outcome: "unsupported" };
  const canvas = document.createElement("canvas");
  canvas.width = PNG_W;
  canvas.height = PNG_H;
  const ctx = canvas.getContext("2d");
  if (!ctx || typeof canvas.toBlob !== "function") return { ok: false, outcome: "unsupported" };
  try {
    await document.fonts?.ready;
    drawCard(ctx, face, theme, labels);
    const source = variant === "story" ? storyCanvas(canvas, theme) : canvas;
    if (!source) return { ok: false, outcome: "unsupported" };
    const blob = await new Promise<Blob | null>((resolve) => source.toBlob(resolve, "image/png"));
    if (!blob) return { ok: false, outcome: "failed" };
    return { ok: true, blob };
  } catch {
    return { ok: false, outcome: "failed" };
  }
}

function storyCanvas(card: HTMLCanvasElement, theme: CardTheme): HTMLCanvasElement | null {
  const story = document.createElement("canvas");
  story.width = PNG_STORY_W;
  story.height = PNG_STORY_H;
  const ctx = story.getContext("2d");
  if (!ctx) return null;
  const p = theme.palette;
  const g = ctx.createLinearGradient(0, 0, story.width * 0.4, story.height);
  g.addColorStop(0, p.bg1);
  g.addColorStop(1, p.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, story.width, story.height);
  ctx.drawImage(card, 0, storyCardOffset());
  return story;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function exportCardPng(face: CardFace, theme: CardTheme, labels: PngLabels, fileName: string): Promise<ExportOutcome> {
  const rendered = await renderCardPngBlob(face, theme, labels);
  if (!rendered.ok) return rendered.outcome;
  try {
    triggerBlobDownload(rendered.blob, fileName);
    return "done";
  } catch {
    return "failed";
  }
}

export function pngFileName(name: string, variant: PngVariant = "feed"): string {
  const slug = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "career";
  return variant === "story" ? `pivot23-${slug}-story.png` : `pivot23-${slug}.png`;
}
