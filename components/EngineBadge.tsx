"use client";
// components/EngineBadge.tsx (PLAN §6.1) — the always-visible proof chip.
// "self-hosted · transformers.js · no API key". This is brand + the §0 proof; it never
// hides. The dot pulses gently when the engine is warm/ready.
import { motion } from "framer-motion";
import { useResonanceStore } from "@/store/useResonanceStore";

export function EngineBadge() {
  const ready = useResonanceStore((s) => s.engineReady);
  const status = useResonanceStore((s) => s.status);
  const live = ready || status === "done";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-ink-800/70 px-3 py-1.5 backdrop-blur-xl"
      title={
        live
          ? "Model loaded and running in our own serverless function"
          : "Model will load on first analysis"
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        {live && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-live opacity-60" />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: live ? "var(--accent)" : "#7a7480" }}
        />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500">
        self-hosted · transformers.js · no API key
      </span>
    </motion.div>
  );
}
