// scripts/prove-engine.mjs — prove the vendored model runs OFFLINE (PLAN §11 step 1).
// Mirrors lib/inference/pipeline.ts config with remote fetch DISABLED, the way prod runs.
import { pipeline, env } from "@huggingface/transformers";

env.allowRemoteModels = false; // production behaviour: local-only, no network
env.allowLocalModels = true;
env.localModelPath = process.cwd() + "/models";
env.cacheDir = "/tmp/transformers-cache";

const MODEL_ID = process.env.MODEL_ID ?? "SamLowe/roberta-base-go_emotions-onnx";

const t0 = performance.now();
const pipe = await pipeline("text-classification", MODEL_ID, { dtype: "q8" });
const loadMs = Math.round(performance.now() - t0);
console.log(`Loaded ${MODEL_ID} (offline) in ${loadMs} ms`);

const text =
  "I can't believe we actually pulled it off. I was terrified it would all fall apart, but somehow it worked.";

const t1 = performance.now();
const all = await pipe(text, { top_k: null });
const inferMs = Math.round(performance.now() - t1);

const top = [...all].sort((a, b) => b.score - a.score).slice(0, 6);
console.log(`\nSpectrum (top 6) — inference ${inferMs} ms, ${all.length} labels:`);
for (const e of top) {
  console.log(`  ${e.label.padEnd(16)} ${(e.score * 100).toFixed(1)}%`);
}

const tok = pipe.tokenizer(text);
console.log(
  `\nTokens: ${tok.input_ids.size ?? tok.input_ids.dims?.reduce((a, b) => a * b, 1)}`,
);
console.log("\n✓ Engine proven offline.");
