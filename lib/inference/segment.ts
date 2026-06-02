// lib/inference/segment.ts — sentence splitter (PLAN §7.3)
//
// A small, dependency-free splitter used to build the emotional arc. It splits on
// sentence-ending punctuation (. ? ! …) followed by whitespace/end, keeps non-empty
// trimmed sentences, and merges ultra-short fragments into their neighbour so the arc
// doesn't fill up with one-word slivers ("Yes.", "Oh.").
//
// Limits (acknowledged, fine for an emotional arc): it is punctuation-based, so it can
// mis-split abbreviations ("Dr. Smith") and won't handle scripts without spaces well.
// Stretch (PLAN §15): swap in Intl.Segmenter with granularity:'sentence'.

const MIN_SENTENCE_CHARS = 12; // shorter fragments get merged into the previous one

export function splitSentences(input: string): string[] {
  const text = input.replace(/\s+/g, " ").trim();
  if (!text) return [];

  // Split after . ? ! or … when followed by whitespace, keeping the delimiter.
  const rawParts = text
    .split(/(?<=[.?!…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // If punctuation gave us nothing useful (one long run-on), return the whole thing.
  if (rawParts.length <= 1) return text ? [text] : [];

  // Merge ultra-short fragments forward so each arc point carries real signal.
  const merged: string[] = [];
  for (const part of rawParts) {
    if (
      merged.length > 0 &&
      part.length < MIN_SENTENCE_CHARS &&
      // don't merge if the previous already ends a clear sentence and is long enough
      merged[merged.length - 1].length < 240
    ) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${part}`;
    } else {
      merged.push(part);
    }
  }

  return merged;
}
