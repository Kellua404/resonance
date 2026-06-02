// lib/inference/pipeline.ts — the model singleton (PLAN §4.1)
//
// Loads a real ONNX transformer ONCE per warm Lambda instance and caches it on
// globalThis. Loading on every request would re-read the weights from disk and blow
// the function timeout. This is the North Star dependency: no paid API, no API key —
// the model runs inside our own serverless function.
import {
  pipeline,
  env,
  type TextClassificationPipeline,
} from "@huggingface/transformers";

// We vendor the model into the repo (PLAN §4.2) and forbid remote fetches in prod so a
// cold start never waits on the network. In dev we allow remote so the first run can
// populate ./models if a teammate hasn't vendored yet.
env.allowRemoteModels = process.env.NODE_ENV !== "production";
env.allowLocalModels = true;
env.localModelPath = process.cwd() + "/models"; // <repo>/models/<MODEL_ID>/...
// Vercel's filesystem is read-only except /tmp — point any runtime cache there.
env.cacheDir = "/tmp/transformers-cache";

// 28-label GoEmotions, ONNX-exported and Transformers.js-compatible (verified: config +
// tokenizer at repo root, onnx/model_quantized.onnx present). Swappable via env.
export const MODEL_ID =
  process.env.MODEL_ID ?? "SamLowe/roberta-base-go_emotions-onnx";

// Cache across warm invocations (and across HMR in dev) on globalThis.
const g = globalThis as unknown as {
  __resonancePipe?: Promise<TextClassificationPipeline>;
  __resonanceColdLoad?: boolean; // set true while the very first load is happening
};

export function getEmotionPipeline(): Promise<TextClassificationPipeline> {
  if (!g.__resonancePipe) {
    g.__resonanceColdLoad = true;
    g.__resonancePipe = pipeline("text-classification", MODEL_ID, {
      // q8 = 8-bit quantized weights (onnx/model_quantized.onnx) → smaller bundle +
      // faster CPU inference on Lambda.
      dtype: "q8",
    }).then((p) => {
      g.__resonanceColdLoad = false;
      return p as TextClassificationPipeline;
    }) as Promise<TextClassificationPipeline>;
  }
  return g.__resonancePipe;
}

// True only until the first load resolves — lets the route report an honest coldStart.
export function isWarming(): boolean {
  return g.__resonanceColdLoad === true;
}

// Has the pipeline ever been requested? (Distinguishes "never touched" from "warm".)
export function isLoaded(): boolean {
  return Boolean(g.__resonancePipe) && g.__resonanceColdLoad !== true;
}
