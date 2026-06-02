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
  // Next's static tracer can't see, so we include the two CPU binaries explicitly.
  // Without this, prod dies with: "libonnxruntime.so.1: cannot open shared object file".
  //
  // CRITICAL: include ONLY the two CPU files by name — do NOT glob `linux/x64/*`. On
  // linux, onnxruntime-node's postinstall downloads the CUDA + TensorRT execution-provider
  // libraries (libonnxruntime_providers_{cuda,tensorrt,shared}.so, hundreds of MB) into
  // this same dir. A `*` glob force-bundles all of them and blows past Vercel's 250MB
  // function limit. Vercel has no GPU, so those providers are pure dead weight. (They
  // don't show up locally on macOS, which is why this hid for so long.)
  //
  // sharp: @huggingface/transformers/dist/transformers.node.mjs has a STATIC top-level
  // `import sharp from "sharp"`, so sharp must ship even though we never process images —
  // without it the route module fails to load with ERR_MODULE_NOT_FOUND at runtime. We
  // include sharp AND its platform native libs (@img/sharp-linux-x64 +
  // @img/sharp-libvips-linux-x64) explicitly because nft can't follow sharp's dynamic
  // native require. On Vercel's linux only the linux @img packages are installed (~15MB).
  outputFileTracingIncludes: {
    "/api/analyze": [
      "./models/**/*",
      "./node_modules/onnxruntime-node/bin/**/linux/x64/libonnxruntime.so.1",
      "./node_modules/onnxruntime-node/bin/**/linux/x64/onnxruntime_binding.node",
      "./node_modules/sharp/**",
      "./node_modules/@img/**",
    ],
    "/api/analyze/warm": [
      "./models/**/*",
      "./node_modules/onnxruntime-node/bin/**/linux/x64/libonnxruntime.so.1",
      "./node_modules/onnxruntime-node/bin/**/linux/x64/onnxruntime_binding.node",
      "./node_modules/sharp/**",
      "./node_modules/@img/**",
    ],
  },

  // The analyze lambdas carry a 125MB model + the 34MB onnxruntime CPU lib, so the 250MB
  // unzipped function limit is tight. Exclude everything traced-in-by-default that is
  // never used at runtime here: non-linux/non-x64 onnxruntime binaries, and — as a
  // belt-and-suspenders guard against the include glob — the CUDA/TensorRT provider libs
  // (Vercel has no GPU; we run CPU only). NOTE: do NOT exclude sharp/@img — transformers
  // statically imports sharp at module load (see the include block above).
  outputFileTracingExcludes: {
    "/api/analyze": [
      "./node_modules/onnxruntime-node/bin/**/darwin/**",
      "./node_modules/onnxruntime-node/bin/**/win32/**",
      "./node_modules/onnxruntime-node/bin/**/linux/arm64/**",
      "./node_modules/onnxruntime-node/bin/**/*providers*",
    ],
    "/api/analyze/warm": [
      "./node_modules/onnxruntime-node/bin/**/darwin/**",
      "./node_modules/onnxruntime-node/bin/**/win32/**",
      "./node_modules/onnxruntime-node/bin/**/linux/arm64/**",
      "./node_modules/onnxruntime-node/bin/**/*providers*",
    ],
  },
};

export default nextConfig;
