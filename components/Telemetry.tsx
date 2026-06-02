// components/Telemetry.tsx (PLAN §6.9) — the instrument readout. This is the §0 PROOF,
// not debug output: MODEL · TOKENS · SENTENCES · LATENCY · BACKEND, in Geist Mono.
// Numbers count up on reveal (instant under reduced-motion). Dense + precise, one corner.
"use client";
import { useEffect, useRef, useState } from "react";
import { useResonanceStore } from "@/store/useResonanceStore";

// Count a value up from 0 over ~700ms; honor prefers-reduced-motion (snap to final).
function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!run) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Snap instantly under reduced-motion or for a zero target; otherwise ease up.
    // All setState happens inside the rAF callback (never synchronously in the effect).
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      if (reduce || target === 0) {
        setValue(target);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, run]);

  return value;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500">
        {label}
      </span>
      <span className="text-accent-live font-mono text-[13px] tabular-nums">
        {children}
      </span>
    </div>
  );
}

export function Telemetry() {
  const result = useResonanceStore((s) => s.result);
  const t = result?.telemetry;

  const tokens = useCountUp(t?.tokens ?? 0, Boolean(t));
  const sentences = useCountUp(t?.sentences ?? 0, Boolean(t));
  const latency = useCountUp(t?.latencyMs ?? 0, Boolean(t));

  if (!t) return null;

  // strip the org prefix for a tidier readout, keep full id in the title
  const shortModel = t.model.split("/").pop() ?? t.model;

  return (
    <section
      aria-label="Engine telemetry"
      className="rounded-2xl border border-white/[0.06] bg-ink-800/70 p-5 backdrop-blur-xl"
    >
      <h3 className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500">
        Instrument
      </h3>
      <div className="divide-y divide-white/[0.05]">
        <Row label="Model">
          <span title={t.model}>{shortModel}</span>
        </Row>
        <Row label="Tokens">{tokens}</Row>
        <Row label="Sentences">{sentences}</Row>
        <Row label="Latency">{latency} ms</Row>
        <Row label="Backend">
          <span className="text-mist-300">{t.backend}</span>
        </Row>
      </div>
      {t.coldStart && (
        <p className="mt-3 font-display text-[13px] italic text-mist-500">
          first run — the engine warmed up for this one.
        </p>
      )}
    </section>
  );
}
