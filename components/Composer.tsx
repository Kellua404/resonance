"use client";
// components/Composer.tsx (PLAN §6.3) — the calm editor: textarea, char hint, sample
// chips, Analyze. ⌘/Ctrl+Enter analyzes. `compact` renders the slim strip shown atop
// the reading state so the text stays editable without dominating (PLAN §3.3).
import { useRef, useEffect } from "react";
import { useResonanceStore } from "@/store/useResonanceStore";
import { SampleChips } from "./SampleChips";
import { AnalyzeButton } from "./AnalyzeButton";

const MAX_CHARS = 4000;

export function Composer({ compact = false }: { compact?: boolean }) {
  const text = useResonanceStore((s) => s.text);
  const setText = useResonanceStore((s) => s.setText);
  const analyze = useResonanceStore((s) => s.analyze);
  const status = useResonanceStore((s) => s.status);
  const error = useResonanceStore((s) => s.error);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea to its content (calmer than a scrollbar).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 120 : 400)}px`;
  }, [text, compact]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      analyze();
    }
  };

  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-ink-800/70 backdrop-blur-xl ${
        compact ? "p-4" : "p-6 sm:p-8"
      }`}
    >
      <label htmlFor="composer" className="sr-only">
        Text to analyze
      </label>
      <textarea
        id="composer"
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
        onKeyDown={onKeyDown}
        placeholder="Paste a journal entry, a message, a few lines of lyrics…"
        rows={compact ? 2 : 5}
        className="w-full resize-none bg-transparent font-display text-mist-100 placeholder:text-mist-500 focus:outline-none"
        style={{ fontSize: compact ? "1rem" : "1.1875rem", lineHeight: 1.6 }}
      />

      <div
        className={`mt-4 flex flex-wrap items-center gap-x-6 gap-y-4 ${
          compact ? "justify-between" : "justify-between"
        }`}
      >
        {!compact && <SampleChips />}
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500 tabular-nums">
            {text.length}/{MAX_CHARS}
          </span>
          <AnalyzeButton />
        </div>
      </div>

      {error && status === "error" && (
        <p
          role="alert"
          className="mt-4 font-display text-sm italic text-mist-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
