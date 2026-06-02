"use client";
// components/Toast.tsx (PLAN §6.14) — transient confirmations ("Link copied").
import { AnimatePresence, motion } from "framer-motion";
import { useResonanceStore } from "@/store/useResonanceStore";

export function Toast() {
  const toast = useResonanceStore((s) => s.toast);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center"
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-full border border-white/[0.08] bg-ink-700/90 px-4 py-2 font-mono text-[12px] text-mist-100 backdrop-blur-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
