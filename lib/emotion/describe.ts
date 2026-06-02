// lib/emotion/describe.ts — mood word + plain-language read (PLAN §5.5)
//
// Turns the ranked spectrum into copy: a single evocative MOOD WORD for the hero and a
// one-line read ("Mostly wistful, with threads of hope."). Copy is craft (§16) — the
// mood-word table is curated, not generated. Covers all 28 GoEmotions labels.
import type { EmotionScore } from "@/lib/types";

// dominant label → a nicer, human display word for the hero.
const MOOD_WORDS: Record<string, string> = {
  joy: "Bright",
  admiration: "Rapt",
  amusement: "Playful",
  love: "Tender",
  gratitude: "Warm",
  optimism: "Hopeful",
  pride: "Lifted",
  excitement: "Electric",
  caring: "Gentle",
  desire: "Yearning",
  relief: "Unburdened",
  approval: "Assured",
  sadness: "Wistful",
  grief: "Mournful",
  disappointment: "Heavy",
  remorse: "Rueful",
  embarrassment: "Sheepish",
  fear: "Uneasy",
  nervousness: "Restless",
  confusion: "Adrift",
  anger: "Fierce",
  annoyance: "Prickly",
  disgust: "Repelled",
  disapproval: "Disquieted",
  surprise: "Struck",
  realization: "Dawning",
  curiosity: "Curious",
  neutral: "Even",
  POSITIVE: "Bright",
  NEGATIVE: "Wistful",
};

// Lowercased descriptor used inside the read-line template ("threads of {x}").
const READ_WORDS: Record<string, string> = {
  joy: "brightness",
  admiration: "admiration",
  amusement: "playfulness",
  love: "tenderness",
  gratitude: "warmth",
  optimism: "hope",
  pride: "pride",
  excitement: "excitement",
  caring: "care",
  desire: "longing",
  relief: "relief",
  approval: "approval",
  sadness: "wistfulness",
  grief: "grief",
  disappointment: "disappointment",
  remorse: "regret",
  embarrassment: "embarrassment",
  fear: "unease",
  nervousness: "restlessness",
  confusion: "confusion",
  anger: "anger",
  annoyance: "irritation",
  disgust: "disgust",
  disapproval: "disquiet",
  surprise: "surprise",
  realization: "realization",
  curiosity: "curiosity",
  neutral: "calm",
  POSITIVE: "brightness",
  NEGATIVE: "wistfulness",
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function moodWord(label?: string): string {
  if (!label) return "—";
  return MOOD_WORDS[label] ?? titleCase(label);
}

const readWord = (label: string) => READ_WORDS[label] ?? label;

// Build "Mostly {x}, with threads of {y}." from the top emotions above a threshold.
// Only mentions a secondary emotion when it carries real signal.
export function readLine(
  spectrum: EmotionScore[],
  { secondaryThreshold = 0.12 } = {},
): string {
  if (!spectrum.length) return "Nothing to read yet.";
  const [first, second] = spectrum;
  const primary = readWord(first.label);

  if (first.label === "neutral") {
    return "An even, level tone — little emotional charge either way.";
  }

  if (second && second.score >= secondaryThreshold && second.label !== "neutral") {
    return `Mostly ${primary}, with threads of ${readWord(second.label)}.`;
  }
  return `Mostly ${primary}, clear and unmixed.`;
}

// "fear 80% · nervousness 25% · realization 12%" — a compact secondary read if needed.
export function topSummary(spectrum: EmotionScore[], n = 3): string {
  return spectrum
    .slice(0, n)
    .map((e) => `${e.label} ${Math.round(e.score * 100)}%`)
    .join(" · ");
}
