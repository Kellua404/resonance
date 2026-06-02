"use client";
// components/ActionBar.tsx (PLAN §6.13) — Export · Copy link · New, with lucide icons,
// titles, and keyboard shortcuts (E export · L copy link · N new). ⌘/Ctrl+Enter to
// analyze lives in the Composer.
import { useEffect, useState } from "react";
import { Download, Link2, RotateCcw } from "lucide-react";
import { useResonanceStore } from "@/store/useResonanceStore";
import { downloadCard } from "@/lib/exportCard";

export function ActionBar() {
  const result = useResonanceStore((s) => s.result);
  const text = useResonanceStore((s) => s.text);
  const copyLink = useResonanceStore((s) => s.copyLink);
  const reset = useResonanceStore((s) => s.reset);
  const showToast = useResonanceStore((s) => s.showToast);
  const [exporting, setExporting] = useState(false);

  const onExport = async () => {
    if (!result || exporting) return;
    setExporting(true);
    try {
      await downloadCard(result, text);
      showToast("Saved your fingerprint card");
    } catch {
      showToast("Couldn't render the card — try again.");
    } finally {
      setExporting(false);
    }
  };

  // keyboard shortcuts — ignore when typing in the composer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT" || e.metaKey || e.ctrlKey) return;
      if (e.key.toLowerCase() === "e") onExport();
      else if (e.key.toLowerCase() === "l") copyLink();
      else if (e.key.toLowerCase() === "n") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, text, exporting]);

  if (!result) return null;

  const btn =
    "inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-mist-300 transition-colors hover:border-white/[0.2] hover:text-mist-100 disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button type="button" onClick={onExport} disabled={exporting} className={btn} title="Export card (E)">
        <Download className="h-3.5 w-3.5" aria-hidden />
        {exporting ? "Rendering…" : "Export card"}
      </button>
      <button type="button" onClick={() => copyLink()} className={btn} title="Copy link (L)">
        <Link2 className="h-3.5 w-3.5" aria-hidden />
        Copy link
      </button>
      <button type="button" onClick={reset} className={btn} title="Analyze new text (N)">
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Analyze new
      </button>
    </div>
  );
}
