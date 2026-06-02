// lib/emotion/vibe.ts — the vibe: palette + free music query (PLAN §5.6)
//
// From the dominant emotion derive a small palette (the dominant hue + two derived
// swatches) and a mood-search query. The "find music" link is a FREE outbound search
// URL — no auth, no API, no paid call. We link out; we never authenticate.
import { colorFor } from "@/lib/emotion/colors";
import type { EmotionScore } from "@/lib/types";

// Lightweight hex → HSL → hex so we can derive analogous/lighter swatches without a lib.
function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mAdj = l - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + mAdj) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export type Vibe = {
  palette: string[]; // [dominant, analogous-warm, analogous-cool] hexes
  moodQuery: string; // human search string
  musicUrl: string; // free outbound YouTube search (no auth, no app handoff)
};

// Search-friendly mood phrases per emotion (feed the music search).
const MUSIC_MOOD: Record<string, string> = {
  joy: "uplifting bright",
  excitement: "energetic euphoric",
  love: "tender romantic",
  gratitude: "warm soulful",
  optimism: "hopeful sunrise",
  pride: "triumphant anthemic",
  amusement: "playful feel good",
  admiration: "cinematic soaring",
  caring: "gentle comforting",
  desire: "sultry late night",
  relief: "calm exhale ambient",
  approval: "steady confident",
  sadness: "melancholy wistful",
  grief: "mournful elegy",
  disappointment: "heavy downtempo",
  remorse: "rueful acoustic",
  embarrassment: "awkward bittersweet",
  fear: "tense uneasy",
  nervousness: "restless anxious",
  confusion: "hazy disoriented",
  anger: "fierce intense",
  annoyance: "edgy abrasive",
  disgust: "dark gritty",
  disapproval: "brooding tense",
  surprise: "startling dynamic",
  realization: "dawning reflective",
  curiosity: "exploratory wondering",
  neutral: "ambient focus calm",
};

export function deriveVibe(
  dominant: string | undefined,
  spectrum: EmotionScore[],
): Vibe {
  const base = colorFor(dominant);
  const [h, s, l] = hexToHsl(base);
  // analogous swatches: rotate hue ±28°, nudge lightness for variety
  const warm = hslToHex(h + 28, Math.min(100, s + 4), Math.min(92, l + 10));
  const cool = hslToHex(h - 28, Math.max(8, s - 6), Math.max(18, l - 12));
  const palette = [base, warm, cool];

  const moodPhrase = MUSIC_MOOD[dominant ?? "neutral"] ?? "calm reflective";
  // blend in the second emotion for a richer query when present
  const second = spectrum[1]?.label;
  const secondPhrase = second ? MUSIC_MOOD[second] : undefined;
  const moodQuery = [moodPhrase, secondPhrase].filter(Boolean).join(" ");

  // YouTube search reliably lands on a real results page in any browser — no login and,
  // unlike open.spotify.com, it isn't hijacked to the home screen by an installed app.
  const musicUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    moodQuery + " music",
  )}`;

  return { palette, moodQuery, musicUrl };
}
