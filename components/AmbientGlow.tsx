"use client";
// components/AmbientGlow.tsx (PLAN §6.11 / §7.4) — a fixed, soft radial glow in
// --accent behind the content. It eases as the room recolors to the dominant emotion,
// so the feeling washes in rather than snapping. Decorative + aria-hidden.
import { useResonanceStore } from "@/store/useResonanceStore";

export function AmbientGlow() {
  const active = useResonanceStore((s) => s.status === "done");

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0.4 }}
    >
      <div
        className="breathe absolute left-1/2 top-[38%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] transition-[background-color] duration-700"
        style={{
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: active ? 0.12 : 0.06,
        }}
      />
    </div>
  );
}
