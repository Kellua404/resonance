import type { NextConfig } from "next";

// PLAN §4.2 — the single most failure-prone thing in the project. Three things must be
// true or production will 500 / time out:
//   1. The model is vendored into ./models and (here) traced into the function bundle.
//   2. @huggingface/transformers is treated as an external server package (don't bundle
//      its native onnxruntime / wasm — let Node require it at runtime).
//   3. The analyze route runs on the Node runtime with a raised maxDuration (set in the
//      route file itself).
const nextConfig: NextConfig = {
  // Don't bundle/transpile the inference lib + its onnxruntime binaries.
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],

  // Ensure the vendored model ships in the lambdas that actually load it.
  outputFileTracingIncludes: {
    "/api/analyze": ["./models/**/*"],
    "/api/analyze/warm": ["./models/**/*"],
  },
};

export default nextConfig;
