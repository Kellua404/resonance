"use client";
// components/EmotionArc.tsx (PLAN §6.8) — the emotional shape of the text left→right.
// A horizontal calm timeline: one segment per sentence, colored by that sentence's
// emotion, height keyed to confidence. Hover/focus a segment → a quiet tooltip with the
// sentence + its emotion. Color is never the only signal (label + % in the tooltip).
import { useState } from "react";
import { motion } from "framer-motion";
import { useResonanceStore } from "@/store/useResonanceStore";
import { colorFor } from "@/lib/emotion/colors";
import { moodWord } from "@/lib/emotion/describe";

export function EmotionArc() {
  const result = useResonanceStore((s) => s.result);
  const [active, setActive] = useState<number | null>(null);

  if (!result || result.arc.length === 0) return null;
  const arc = result.arc;

  return (
    <section aria-label="Emotional arc across sentences" className="w-full">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500">
          Arc
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500">
          {arc.length} {arc.length === 1 ? "sentence" : "sentences"} · left → right
        </span>
      </div>

      {/* the timeline */}
      <div className="relative">
        <div className="flex h-24 items-end gap-1.5">
          {arc.map((pt, i) => {
            const color = colorFor(pt.label);
            const h = 28 + Math.round(pt.score * 72); // 28%..100% height by confidence
            const isActive = active === i;
            return (
              <motion.button
                key={i}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${h}%`, opacity: isActive ? 1 : 0.8 }}
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.1 + i * 0.04,
                }}
                className="min-w-0 flex-1 rounded-t-md outline-none transition-opacity"
                style={{ backgroundColor: color }}
                aria-label={`Sentence ${i + 1}: ${pt.label}, ${Math.round(
                  pt.score * 100,
                )} percent. ${pt.text}`}
              />
            );
          })}
        </div>

        {/* quiet tooltip for the active segment */}
        {active !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 rounded-xl border border-white/[0.06] bg-ink-800/80 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: colorFor(arc[active].label) }}
              />
              <span className="text-mist-100">{moodWord(arc[active].label)}</span>
              <span className="text-mist-500">
                {arc[active].label} · {Math.round(arc[active].score * 100)}%
              </span>
            </div>
            <p className="mt-2 font-display text-[15px] italic leading-relaxed text-mist-300">
              “{arc[active].text}”
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
