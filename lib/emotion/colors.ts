// lib/emotion/colors.ts — emotion → color map + dynamic accent (PLAN §5.4)
//
// Every label the model can emit gets its own hue (used by the spectrum bars and arc
// dots). The dominant emotion's hue is pushed into the `--accent` CSS variable, which
// recolors the whole room (mood hero, focus rings, telemetry values, ambient glow).
// Pure + deterministic. Covers all 28 GoEmotions labels + the binary-sentiment fallback.

export const EMOTION_COLORS: Record<string, string> = {
  // warm / positive
  joy: "#F2C14E",
  admiration: "#F2A03D",
  amusement: "#F4B860",
  love: "#F06C9B",
  gratitude: "#E8B04B",
  optimism: "#F2D45E",
  pride: "#F0A33C",
  excitement: "#FF8A5B",
  // tender
  caring: "#E7A2C4",
  desire: "#E86A8E",
  relief: "#9FD6B0",
  approval: "#A9D08E",
  // cool / negative
  sadness: "#5B8DEF",
  grief: "#3F6FD8",
  disappointment: "#6E7FC0",
  remorse: "#6A7BB5",
  embarrassment: "#8A7CC0",
  fear: "#8E7BE8",
  nervousness: "#9A86E0",
  confusion: "#7E8AA8",
  // hot / negative
  anger: "#E5524A",
  annoyance: "#E07A52",
  disgust: "#7FA05A",
  disapproval: "#C56B5A",
  // surprise / curious / neutral
  surprise: "#54C7CB",
  realization: "#5FB8C0",
  curiosity: "#5AC2A8",
  neutral: "#8B8694",
  // sentiment fallback (binary model)
  POSITIVE: "#F2C14E",
  NEGATIVE: "#5B8DEF",
};

const GREY_FALLBACK = "#8B8694";

export const colorFor = (label?: string) =>
  (label && EMOTION_COLORS[label]) || GREY_FALLBACK;

// Push the dominant emotion's hue into --accent. Returns the color for convenience.
// Safe to call client-side only (guards for SSR).
export function applyAccent(label?: string): string {
  const c = colorFor(label);
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--accent", c);
  }
  return c;
}
