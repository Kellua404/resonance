"use client";
// components/AnalyzeButton.tsx (PLAN §6.5) — primary action with HONEST states.
// idle: "Analyze" · warming (cold start): "Warming the engine…" · busy: "Reading…".
// We never hide the engine behind a generic spinner (PLAN §0/§4.4).
import { Activity } from "lucide-react";
import { useResonanceStore } from "@/store/useResonanceStore";

export function AnalyzeButton() {
  const status = useResonanceStore((s) => s.status);
  const analyze = useResonanceStore((s) => s.analyze);
  const text = useResonanceStore((s) => s.text);

  const busy = status === "warming" || status === "analyzing";
  const label =
    status === "warming"
      ? "Warming the engine…"
      : status === "analyzing"
        ? "Reading…"
        : "Analyze";

  return (
    <button
      type="button"
      onClick={() => analyze()}
      disabled={busy || text.trim().length < 2}
      aria-live="polite"
      className="group inline-flex items-center gap-2.5 rounded-full bg-accent-live px-6 py-3 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-ink-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Activity
        className={`h-3.5 w-3.5 ${busy ? "breathe" : ""}`}
        strokeWidth={2.5}
        aria-hidden
      />
      {label}
    </button>
  );
}
