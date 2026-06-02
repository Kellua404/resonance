// store/useResonanceStore.ts — the one small client store (PLAN §7.2)
//
// Holds the composer text, an HONEST engine status, the last result, any error, and a
// transient toast. analyze() POSTs to /api/analyze and recolors the room to the dominant
// emotion; warm() fires the warm-up route on mount so the model loads while the user
// types; loadFromUrl()/copyLink() power the permalink round-trip (PLAN §7.5 / §8.2).
import { create } from "zustand";
import type { AnalysisResult } from "@/lib/types";
import { applyAccent } from "@/lib/emotion/colors";
import { buildShareUrl, readShareUrl, writeShareHash } from "@/lib/urlState";

export type EngineStatus =
  | "idle"
  | "warming"
  | "analyzing"
  | "done"
  | "error";

type ResonanceState = {
  text: string;
  status: EngineStatus;
  result: AnalysisResult | null;
  error: string | null;
  engineReady: boolean; // warm-up resolved at least once
  warmStarted: boolean; // guard so warm() only fires once
  toast: string | null; // transient confirmation copy

  setText: (text: string) => void;
  warm: () => Promise<void>;
  analyze: () => Promise<void>;
  reset: () => void;
  showToast: (msg: string) => void;
  copyLink: () => Promise<void>;
  loadFromUrl: () => boolean; // returns true if a permalink was found
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useResonanceStore = create<ResonanceState>((set, get) => ({
  text: "",
  status: "idle",
  result: null,
  error: null,
  engineReady: false,
  warmStarted: false,
  toast: null,

  setText: (text) => set({ text }),

  warm: async () => {
    if (get().warmStarted) return;
    set({ warmStarted: true });
    try {
      const res = await fetch("/api/analyze/warm", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ready) set({ engineReady: true });
    } catch {
      // a failed warm-up is non-fatal — the first analyze will load the model and
      // simply show honest "warming the engine…" theater instead.
    }
  },

  analyze: async () => {
    const text = get().text.trim();
    if (text.length < 2) {
      set({ status: "error", error: "Give me a little more text to read." });
      return;
    }

    // If the engine hasn't warmed yet, the first call pays the cold-start cost —
    // surface that honestly as "warming" rather than a generic spinner.
    const cold = !get().engineReady;
    set({ status: cold ? "warming" : "analyzing", error: null });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || "error" in data) {
        set({
          status: "error",
          error:
            (data && data.error) ||
            "The engine couldn't read that — try again.",
        });
        return;
      }

      const result = data as AnalysisResult;
      applyAccent(result.dominant); // recolor the room to the feeling
      writeShareHash(text); // every analysis becomes a permalink (PLAN §7.5)
      set({ status: "done", result, engineReady: true, error: null });
    } catch {
      set({
        status: "error",
        error: "The engine couldn't read that — try again.",
      });
    }
  },

  reset: () => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    set({ status: "idle", result: null, error: null });
  },

  showToast: (msg) => {
    set({ toast: msg });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 2400);
  },

  copyLink: async () => {
    const text = get().text.trim();
    const url = buildShareUrl(text);
    if (!url) {
      get().showToast("Text's a bit long to link — try a shorter passage.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      get().showToast("Link copied");
    } catch {
      get().showToast("Couldn't copy — your browser blocked it.");
    }
  },

  loadFromUrl: () => {
    const text = readShareUrl();
    if (text && text.trim().length >= 2) {
      set({ text });
      // re-run the analysis so the permalink restores the full result
      get().analyze();
      return true;
    }
    return false;
  },
}));
