// lib/exportCard.ts — the emotion-fingerprint share card (PLAN §8.1)
//
// Renders a tasteful 1200×630 PNG to an offscreen canvas: the mood word, the read line,
// the top-5 spectrum as colored bars, the arc as a slim ribbon, and a footer that proves
// it's real — "Resonance · self-hosted emotion model · {latencyMs} ms". No DOM capture
// lib needed; pure canvas. canvas.toBlob → download.
import type { AnalysisResult } from "@/lib/types";
import { colorFor } from "@/lib/emotion/colors";
import { moodWord, readLine } from "@/lib/emotion/describe";

const W = 1200;
const H = 630;
const PAD = 72;

function shortHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36).slice(0, 6);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderCard(result: AnalysisResult): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const accent = colorFor(result.dominant);

  // background — warm void
  ctx.fillStyle = "#0B0A0C";
  ctx.fillRect(0, 0, W, H);

  // soft ambient glow in the accent (top-right)
  const glow = ctx.createRadialGradient(W - 220, 180, 0, W - 220, 180, 520);
  glow.addColorStop(0, accent + "33");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // hairline frame
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  roundRect(ctx, 16, 16, W - 32, H - 32, 24);
  ctx.stroke();

  // eyebrow
  ctx.fillStyle = "#7A7480";
  ctx.font = "600 16px ui-monospace, 'Geist Mono', monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("THE FEELING", PAD, PAD + 14);

  // mood word — big, accent
  ctx.fillStyle = accent;
  ctx.font = "300 96px 'Fraunces', Georgia, serif";
  ctx.fillText(moodWord(result.dominant), PAD - 2, PAD + 120);

  // read line
  ctx.fillStyle = "#A8A2AE";
  ctx.font = "400 26px 'Fraunces', Georgia, serif";
  ctx.fillText(readLine(result.spectrum), PAD, PAD + 168);

  // spectrum — top 5 bars
  const bars = result.spectrum.slice(0, 5);
  const barTop = PAD + 220;
  const barW = W - PAD * 2;
  const rowH = 46;
  bars.forEach((e, i) => {
    const y = barTop + i * rowH;
    // label + %
    ctx.fillStyle = "#ECE8F0";
    ctx.font = "500 18px ui-monospace, 'Geist Mono', monospace";
    ctx.fillText(e.label, PAD, y);
    ctx.fillStyle = "#A8A2AE";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(e.score * 100)}%`, PAD + barW, y);
    ctx.textAlign = "left";
    // track + fill
    ctx.fillStyle = "#231F26";
    roundRect(ctx, PAD, y + 10, barW, 10, 5);
    ctx.fill();
    ctx.fillStyle = colorFor(e.label);
    roundRect(ctx, PAD, y + 10, Math.max(8, barW * e.score), 10, 5);
    ctx.fill();
  });

  // arc ribbon — slim segments along the bottom
  if (result.arc.length) {
    const ribbonY = H - PAD - 28;
    const gap = 4;
    const segW = (barW - gap * (result.arc.length - 1)) / result.arc.length;
    result.arc.forEach((pt, i) => {
      const x = PAD + i * (segW + gap);
      const h = 8 + pt.score * 22;
      ctx.fillStyle = colorFor(pt.label);
      roundRect(ctx, x, ribbonY + (30 - h), Math.max(2, segW), h, 3);
      ctx.fill();
    });
  }

  // footer — the proof
  ctx.fillStyle = "#7A7480";
  ctx.font = "500 15px ui-monospace, 'Geist Mono', monospace";
  ctx.fillText(
    `Resonance · self-hosted emotion model · ${result.telemetry.latencyMs} ms`,
    PAD,
    H - PAD + 14,
  );

  return canvas;
}

// Render + trigger a download. Filename: resonance-<dominant>-<shortHash>.png
export async function downloadCard(
  result: AnalysisResult,
  seedText = "",
): Promise<void> {
  const canvas = renderCard(result);
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resonance-${result.dominant}-${shortHash(
        seedText || result.dominant,
      )}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}
