"use client";
// components/SampleChips.tsx (PLAN §6.4) — preset texts that fill the composer.
import { SAMPLES } from "@/lib/samples";
import { useResonanceStore } from "@/store/useResonanceStore";

export function SampleChips() {
  const setText = useResonanceStore((s) => s.setText);
  const disabled = useResonanceStore(
    (s) => s.status === "warming" || s.status === "analyzing",
  );

  return (
    <div className="flex flex-wrap gap-2">
      <span className="self-center font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500">
        try
      </span>
      {SAMPLES.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={disabled}
          onClick={() => setText(s.text)}
          className="rounded-full border border-white/[0.07] bg-ink-700/50 px-3 py-1.5 font-display text-sm text-mist-300 transition-colors hover:border-white/[0.15] hover:text-mist-100 disabled:opacity-40"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
