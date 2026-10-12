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
}

export const PNG_W = 1080;
export const PNG_H = 1350;
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

export function drawCard(ctx: CanvasRenderingContext2D, face: CardFace, theme: CardTheme, l: PngLabels) {
  const p = theme.palette;
  const W = PNG_W, H = PNG_H, pad = 84, inner = W - pad * 2;
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, p.bg1);
  g.addColorStop(1, p.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = p.frame;
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  drawLogo(ctx, pad, pad, 120, p.ink);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  if (face.number !== null) {
    ctx.fillStyle = p.accent;
    ctx.font = `800 170px ${FONT}`;
    ctx.fillText(String(face.number), W - pad, pad + 150);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = p.muted;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(clampText(ctx, [l.role, l.nation].filter(Boolean).join(" · "), inner), pad, 340);

  ctx.fillStyle = p.ink;
  fitText(ctx, face.name, 800, 110, 52, inner);
  ctx.fillText(clampText(ctx, face.name, inner), pad, 460);

  ctx.fillStyle = p.muted;
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText(clampText(ctx, [face.span, l.ages, l.seasons, l.peak].filter(Boolean).join(" · "), inner), pad, 520);

  ctx.fillStyle = p.accent;
  ctx.fillRect(pad, 570, 120, 4);

  const colW = inner / Math.max(1, l.stats.length);
  l.stats.forEach(([value, label], i) => {
    const x = pad + colW * i;
    ctx.fillStyle = p.ink;
    fitText(ctx, value, 800, 110, 48, colW - 20);
    ctx.fillText(value, x, 720);
    ctx.fillStyle = p.muted;
    ctx.font = `600 30px ${FONT}`;
    ctx.fillText(clampText(ctx, label.toUpperCase(), colW - 20), x, 770);
  });

  let y = 870;
  ctx.font = `700 40px ${FONT}`;
  for (const h of l.honors.slice(0, 3)) {
    ctx.fillStyle = p.accent;
    ctx.fillRect(pad, y - 28, 10, 30);
    ctx.fillStyle = p.ink;
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(clampText(ctx, h, inner - 30), pad + 30, y);
    y += 62;
  }

  ctx.fillStyle = p.muted;
  ctx.font = `600 32px ${FONT}`;
  ctx.fillText(clampText(ctx, face.teams.map((t) => t.abbr).join(" · "), inner), pad, 1110);
  ctx.fillStyle = p.ink;
  fitText(ctx, l.verdict, 700, 46, 30, inner);
  ctx.fillText(clampText(ctx, l.verdict, inner), pad, 1180);
  ctx.fillStyle = p.muted;
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText(clampText(ctx, l.footer, inner), pad, H - pad + 10);
}

export type ExportOutcome = "done" | "unsupported" | "failed";

export async function exportCardPng(face: CardFace, theme: CardTheme, labels: PngLabels, fileName: string): Promise<ExportOutcome> {
  if (typeof document === "undefined") return "unsupported";
  const canvas = document.createElement("canvas");
  canvas.width = PNG_W;
  canvas.height = PNG_H;
  const ctx = canvas.getContext("2d");
  if (!ctx || typeof canvas.toBlob !== "function") return "unsupported";
  try {
    await document.fonts?.ready;
    drawCard(ctx, face, theme, labels);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return "failed";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return "done";
  } catch {
    return "failed";
  }
}

export function pngFileName(name: string): string {
  const slug = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "career";
  return `pivot23-${slug}.png`;
}
