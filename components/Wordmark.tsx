"use client";
// components/Wordmark.tsx (PLAN §6.2) — "Resonance" + tagline with a staggered entrance.
import { motion } from "framer-motion";

export function Wordmark() {
  return (
    <div className="select-none">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="font-display font-light tracking-tight text-mist-100"
        style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.05 }}
      >
        Resonance
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="mt-1 font-display italic text-mist-300"
        style={{ fontSize: "1rem" }}
      >
        Read the feeling in your words.
      </motion.p>
    </div>
  );
}
