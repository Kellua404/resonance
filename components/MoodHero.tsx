"use client";
// components/MoodHero.tsx (PLAN §6.6) — the result hero: the huge accent-tinted mood
// word + a one-line plain-language read. This is the emotional headline of the result.
import { motion } from "framer-motion";
import { useResonanceStore } from "@/store/useResonanceStore";
import { moodWord, readLine } from "@/lib/emotion/describe";

export function MoodHero() {
  const result = useResonanceStore((s) => s.result);
  if (!result) return null;

  const word = moodWord(result.dominant);
  const read = readLine(result.spectrum);

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500"
      >
        the feeling
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className="text-accent-live mt-2 font-display font-light leading-none"
        style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
      >
        {word}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="mx-auto mt-4 max-w-xl font-display text-mist-300"
        style={{ fontSize: "1.125rem" }}
      >
        {read}
      </motion.p>
    </div>
  );
}
