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
      ? ctx.createConicGradient(2.2, W * 1.2, -H * 0.1)
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
    const fade = ctx.createRadialGradient(W * 0.5, H * 0.42, 20, W * 0.5, H * 0.42, W * 0.72);
    fade.addColorStop(0, "rgba(16,12,10,0.7)");
    fade.addColorStop(1, "rgba(16,12,10,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawCourt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ink: string) {
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 3;
  roundRect(ctx, x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8, 8);
  ctx.stroke();
  const cx = x + w / 2, cy = y + h * 0.58, rr = w * 0.23;
  ctx.beginPath();
  ctx.arc(cx, cy, rr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, cy);
  ctx.lineTo(x + w * 0.88, cy);
  ctx.stroke();
  ctx.restore();
}

const SEAL_STYLE: Record<string, { colors: [string, string]; ink: string; prism?: boolean }> = {
  standard: { colors: ["#3f3f44", "#5c5c62"], ink: "#ffffff" },
  "bronze-frame": { colors: ["#d7a25a", "#f0d7a0"], ink: "#1a0f06" },
  obsidian: { colors: ["#1a1614", "#3a3228"], ink: "#ffffff" },
  "holo-red": { colors: ["#9a0400", "#C10600"], ink: "#ffffff" },
  prisma: { colors: ["#E10600", "#F0A24A"], ink: "#0e0e0f", prism: true },
};

function drawSealPill(ctx: CanvasRenderingContext2D, grade: string, themeId: string, right: number, cy: number) {
  const style = SEAL_STYLE[themeId] ?? SEAL_STYLE["holo-red"]!;
  ctx.save();
  ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = grade.toUpperCase();
  const tw = ctx.measureText(label).width;
  const bw = tw + 28, bh = 36;
  const x = right - bw, y = cy - bh / 2;
  if (style.prism && typeof ctx.createConicGradient === "function") {
    const g = ctx.createConicGradient(2.2, x + bw * 1.2, y - 8);
    g.addColorStop(0, "#F04030");
    g.addColorStop(0.25, "#F0A24A");
    g.addColorStop(0.5, "#7ee0ff");
    g.addColorStop(0.75, "#c9a0ff");
    g.addColorStop(1, "#F04030");
    ctx.fillStyle = g;
  } else {
    const g = ctx.createLinearGradient(x, y, x + bw, y);
    g.addColorStop(0, style.colors[0]);
    g.addColorStop(1, style.colors[1]);
    ctx.fillStyle = g;
  }
  roundRect(ctx, x, y, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = style.ink;
  ctx.fillText(label, x + bw / 2, cy + 1);
  ctx.restore();
}

function drawHonorChips(ctx: CanvasRenderingContext2D, honors: string[], x: number, y: number, maxW: number, ink: string): number {
  ctx.save();
  ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const padX = 14, rowH = 40, gap = 10;
  let cx = x, cy = y;
  for (const honor of honors) {
    const label = honor;
    const bw = Math.min(maxW, ctx.measureText(label).width + padX * 2);
    if (cx > x && cx + bw > x + maxW) {
      cx = x;
      cy += rowH + gap;
    }
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = ink;
    roundRect(ctx, cx, cy, bw, rowH, 8);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = ink;
    ctx.fillText(clampText(ctx, label, bw - padX * 2), cx + padX, cy + rowH / 2);
    cx += bw + gap;
  }
  ctx.restore();
  return honors.length ? cy + rowH : y;
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
  drawCourt(ctx, pad, artTop, inner, artH, p.ink);
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

  const honorsEnd = drawHonorChips(ctx, l.honors, pad, 950, inner, p.ink);
  const footY = Math.max(1140, honorsEnd + 48);

  ctx.fillStyle = p.muted;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(clampText(ctx, face.teams.map((t) => t.abbr).join(" · "), inner * 0.62), pad, footY);
  ctx.fillStyle = p.ink;
  fitText(ctx, l.verdict, 700, 40, 26, inner * 0.62);
  ctx.fillText(clampText(ctx, l.verdict, inner * 0.62), pad, footY + 60);
  if (l.grade) drawSealPill(ctx, l.grade, theme.id, W - pad, footY + 52);
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
