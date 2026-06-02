"use client";
// components/Vibe.tsx (PLAN §6.10) — the derived vibe: a small palette from the dominant
// emotion + a FREE outbound "find music for this mood" search link (no auth, no API).
import { motion } from "framer-motion";
import { Music } from "lucide-react";
import { useResonanceStore } from "@/store/useResonanceStore";
import { deriveVibe } from "@/lib/emotion/vibe";

export function Vibe() {
  const result = useResonanceStore((s) => s.result);
  if (!result) return null;

  const vibe = deriveVibe(result.dominant, result.spectrum);

  return (
    <section aria-label="Derived vibe" className="w-full">
      <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500">
        Vibe
      </h3>

      <div className="flex flex-wrap items-center gap-5">
        {/* palette swatches */}
        <div className="flex gap-2" aria-label="Color palette derived from the mood">
          {vibe.palette.map((c, i) => (
            <motion.div
              key={c + i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="h-9 w-9 rounded-lg border border-white/[0.08]"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        {/* free music-search link */}
        <a
          href={vibe.musicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 font-mono text-[12px] text-mist-300 transition-colors hover:text-mist-100"
        >
          <Music className="h-3.5 w-3.5" aria-hidden />
          <span>find music for this mood</span>
          <span className="text-accent-live transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </a>
      </div>
    </section>
  );
}
