// app/api/analyze/route.ts — the analyze route (PLAN §4.3)
//
// Runs a real transformer server-side: classifies the whole text into a full emotional
// spectrum (all 28 labels) and each sentence into a dominant emotion for the arc, then
// returns a typed contract with HONEST telemetry (model id, real token count, real
// inference latency). No third-party API, no API key, zero per-request cost.
import { NextResponse } from "next/server";
import {
  getEmotionPipeline,
  isWarming,
  MODEL_ID,
} from "@/lib/inference/pipeline";
import { splitSentences } from "@/lib/inference/segment";
import type { EmotionScore, AnalysisResult } from "@/lib/types";

// onnxruntime needs the Node runtime (NOT edge); cold start + inference can exceed the
// 10s default, so raise the cap. force-dynamic: never cache an inference response.
export const runtime = "nodejs";
export const maxDuration = 60; // Hobby allows up to 60s; cold start needs headroom
export const dynamic = "force-dynamic";

const MAX_CHARS = 4000; // guardrail: cap input size
const MAX_SENTENCES = 40; // guardrail: cap arc work per request

// The raw shape from pipe(...) varies by topk; normalise into EmotionScore[] sorted desc.
type RawScore = { label: string; score: number };
function normalizeSpectrum(raw: unknown): EmotionScore[] {
  const arr = (Array.isArray(raw) ? raw : [raw]) as RawScore[];
  return arr
    .filter((x) => x && typeof x.label === "string")
    .map((x) => ({ label: x.label, score: Number(x.score) || 0 }))
    .sort((a, b) => b.score - a.score);
}

export async function POST(req: Request) {
  const t0 = performance.now();

  const body = await req.json().catch(() => ({ text: "" }));
  const clean = String(body?.text ?? "")
    .trim()
    .slice(0, MAX_CHARS);

  if (clean.length < 2) {
    return NextResponse.json(
      { error: "Give me a little more text to read." },
      { status: 400 },
    );
  }

  const coldStart = isWarming() || !globalThisHasPipe();

  let pipe;
  try {
    pipe = await getEmotionPipeline();
  } catch (err) {
    console.error("[analyze] pipeline load failed:", err);
    return NextResponse.json(
      { error: "The engine couldn't start — try again in a moment." },
      { status: 503 },
    );
  }

  try {
    // Overall spectrum: ask for ALL label scores (top_k: null → all 28 GoEmotions
    // labels, each an independent sigmoid confidence since the model is multi-label),
    // then normalise/sort. NOTE: the option is `top_k` (snake_case) in transformers.js
    // v4 — `topk` silently returns only the single top label.
    const overallRaw = await pipe(clean, { top_k: null });
    const spectrum = normalizeSpectrum(overallRaw);

    // Per-sentence arc (batched in one call). Cap to keep latency bounded. With
    // top_k:1 over an array, transformers.js returns a FLAT array (one {label,score}
    // per sentence), so arcRaw[i] is a plain object — guarded below either way.
    const sentences = splitSentences(clean).slice(0, MAX_SENTENCES);
    const arcRaw = (
      sentences.length ? await pipe(sentences, { top_k: 1 }) : []
    ) as Array<RawScore[] | RawScore>;

    const arc = sentences.map((s, i) => {
      const top = Array.isArray(arcRaw[i])
        ? (arcRaw[i] as RawScore[])[0]
        : (arcRaw[i] as RawScore | undefined);
      return {
        text: s,
        label: top?.label ?? spectrum[0]?.label ?? "neutral",
        score: Number(top?.score) || 0,
      };
    });

    // Real telemetry — this is the proof, not decoration.
    let tokens: number | null = null;
    try {
      const tokenizer = (pipe as unknown as { tokenizer?: (t: string) => { input_ids?: { size?: number; dims?: number[] } } }).tokenizer;
      if (tokenizer) {
        const enc = tokenizer(clean);
        tokens =
          enc?.input_ids?.size ??
          (enc?.input_ids?.dims ? enc.input_ids.dims.reduce((a, b) => a * b, 1) : null);
      }
    } catch {
      tokens = null; // never fail the request over a telemetry nicety
    }

    const latencyMs = Math.round(performance.now() - t0);

    const result: AnalysisResult = {
      spectrum,
      dominant: spectrum[0]?.label ?? "neutral",
      arc,
      telemetry: {
        model: MODEL_ID,
        tokens,
        sentences: sentences.length,
        latencyMs,
        backend: "server · onnx · no-api",
        coldStart,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze] inference failed:", err);
    return NextResponse.json(
      { error: "The engine couldn't read that — try again." },
      { status: 500 },
    );
  }
}

function globalThisHasPipe(): boolean {
  return Boolean(
    (globalThis as unknown as { __resonancePipe?: unknown }).__resonancePipe,
  );
}
