// components/Spectrum.tsx (PLAN §6.7) — ranked emotions as breathing confidence bars,
// each in its own emotion color, top ~6. Bars grow 0→score with a gentle stagger on
// reveal. Color is NEVER the only signal: every bar carries a text label + % (PLAN §13).
"use client";
import { motion } from "framer-motion";
import { useResonanceStore } from "@/store/useResonanceStore";
import { colorFor } from "@/lib/emotion/colors";

const TOP_N = 6;

export function Spectrum() {
  const result = useResonanceStore((s) => s.result);
  if (!result) return null;

  const bars = result.spectrum.slice(0, TOP_N);

  return (
    <section aria-label="Emotional spectrum" className="w-full">
      <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500">
        Spectrum
      </h3>
      <ul className="flex flex-col gap-3">
        {bars.map((e, i) => {
          const color = colorFor(e.label);
          const pct = Math.round(e.score * 100);
          return (
            <li key={e.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between font-mono text-[12px]">
                <span className="lowercase text-mist-100">{e.label}</span>
                <span className="tabular-nums text-mist-300">{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
                <motion.div
                  className="breathe h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, e.score * 100)}%` }}
                  transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1],
                    delay: 0.1 + i * 0.06,
                  }}
                  role="meter"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${e.label}: ${pct} percent`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
