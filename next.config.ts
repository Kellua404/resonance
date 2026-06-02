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

  // Ensure the lambdas that load the model ship (a) the vendored model and (b) the
  // onnxruntime-node NATIVE shared library. The .node addon is traced automatically (it's
  // required from JS), but it loads `libonnxruntime.so.1` via dlopen at runtime — which
  // Next's static tracer can't see, so we include the linux/x64 binary dir explicitly.
  // Without this, prod dies with: "libonnxruntime.so.1: cannot open shared object file".
  // We trace only linux/x64 (Vercel's runtime, ~34MB) — not all platforms (~210MB).
  outputFileTracingIncludes: {
    "/api/analyze": [
      "./models/**/*",
      "./node_modules/onnxruntime-node/bin/**/linux/x64/*",
    ],
    "/api/analyze/warm": [
      "./models/**/*",
      "./node_modules/onnxruntime-node/bin/**/linux/x64/*",
    ],
  },
};

export default nextConfig;
