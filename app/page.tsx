"use client";
// app/page.tsx — assembles the two calm states (Composer → Reading), cross-faded.
// Fires the warm-up on first paint so the model loads while the user reads/types
// (PLAN §3.3, §4.4, §11 steps 3/5/6/7). Arc, Vibe, and Output land in later steps.
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useResonanceStore } from "@/store/useResonanceStore";
import { Wordmark } from "@/components/Wordmark";
import { EngineBadge } from "@/components/EngineBadge";
import { Composer } from "@/components/Composer";
import { AmbientGlow } from "@/components/AmbientGlow";
import { MoodHero } from "@/components/MoodHero";
import { Spectrum } from "@/components/Spectrum";
import { Telemetry } from "@/components/Telemetry";
import { EmotionArc } from "@/components/EmotionArc";
import { Vibe } from "@/components/Vibe";
import { ActionBar } from "@/components/ActionBar";
import { Toast } from "@/components/Toast";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Page() {
  const warm = useResonanceStore((s) => s.warm);
  const result = useResonanceStore((s) => s.result);
  const status = useResonanceStore((s) => s.status);
  const loadFromUrl = useResonanceStore((s) => s.loadFromUrl);

  // Warm the engine quietly on first paint, then restore any permalink (PLAN §4.4/§7.5).
  useEffect(() => {
    warm();
    loadFromUrl();
  }, [warm, loadFromUrl]);

  const reading = Boolean(result) && status !== "idle";

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">
      <AmbientGlow />

      {/* Top bar: brand + always-visible engine proof */}
      <header className="flex items-start justify-between gap-4">
        <Wordmark />
        <div className="pt-2">
          <EngineBadge />
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center py-10">
        <AnimatePresence mode="wait">
          {!reading ? (
            <motion.div
              key="composer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease }}
              className="mx-auto w-full max-w-2xl"
            >
              <Composer />
            </motion.div>
          ) : (
            <motion.div
              key="reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex w-full flex-col gap-12"
            >
              {/* slim editable strip up top */}
              <Composer compact />

              {/* the result blooms below */}
              <MoodHero />

              <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
                <Spectrum />
                <Telemetry />
              </div>

              <EmotionArc />
              <Vibe />
              <ActionBar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Toast />

      <footer className="pt-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist-500">
          Built with Next.js · transformers.js · ONNX — no AI API. Portfolio
          Project B1.
        </p>
      </footer>
    </main>
  );
}
