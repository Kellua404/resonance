# Deploying Resonance to Vercel

Resonance runs a **self-hosted ONNX emotion model inside a Vercel serverless function** —
no paid API, no API key. That makes the deploy unusual: the function has to carry a
~120 MB model **plus** the onnxruntime native runtime and still fit under Vercel's
**250 MB unzipped function-size limit** (Hobby plan). This doc explains the one hard
problem we hit, how it was fixed, and how to keep future deploys green.

- **Production:** https://resonance-lac-sigma.vercel.app
- **Vercel project:** `wwweddedd-1296s-projects/resonance` (Hobby)
- **Routes that carry the model:** `/api/analyze`, `/api/analyze/warm`
- **Model:** `SamLowe/roberta-base-go_emotions-onnx` (q8, 28-label GoEmotions),
  gitignored and fetched at build by `scripts/fetch-model.mjs`.

---

## How to deploy

Normal git push works now — push to `main` and Vercel builds + deploys automatically.

```bash
git push origin main
```

The build runs `node scripts/fetch-model.mjs && next build`, which downloads the model
into `models/` (idempotent — skips files already present) and traces it into the function.

You can also deploy straight from your local tree with the CLI (handy for testing a build
without a commit, or if git auto-deploy is acting up):

```bash
vercel deploy --prod --yes                                            # deploy from local tree
vercel deploy --prod --yes --build-env VERCEL_ANALYZE_BUILD_OUTPUT=1  # + per-function size report
```

### Smoke test after every deploy
```bash
curl -s https://resonance-lac-sigma.vercel.app/api/analyze/warm        # warm-up — expect {"ready":true,...}
curl -s -X POST https://resonance-lac-sigma.vercel.app/api/analyze \
  -H 'content-type: application/json' -d '{"text":"I was scared, then so grateful."}'
```
Expect a JSON `spectrum` (28 labels), a per-sentence `arc`, and honest `telemetry`.

---

## The problem we hit: "Serverless Function has exceeded the unzipped maximum size of 250 MB"

Every production deploy failed at the output stage. The function was too big — but **not
for the reason it first appeared.**

### Root cause: onnxruntime-node silently pulls in GPU libraries on Linux
`onnxruntime-node`'s `postinstall` (`script/install.js`) downloads the **CUDA + TensorRT
execution-provider libraries** on **linux/x64** only:
`libonnxruntime_providers_cuda.so`, `libonnxruntime_providers_tensorrt.so`,
`libonnxruntime_providers_shared.so` — together **hundreds of MB**. They land in
`node_modules/onnxruntime-node/bin/napi-v6/linux/x64/`.

Our `next.config.ts` trace-include used a wildcard:

```ts
"./node_modules/onnxruntime-node/bin/**/linux/x64/*"   // ❌ grabs the GPU provider libs too
```

so all those GPU libs got bundled into the function → over 250 MB.

**Why it was hard to spot:** macOS never downloads the linux CUDA libs, so the local file
trace looked fine (~166 MB). The bloat only existed on Vercel's Linux build. Vercel has
**no GPU**, so those providers are pure dead weight.

### Second bug, uncovered once the size was fixed: `Cannot find package 'sharp'`
After the size fix, both routes 500'd at **module import** time.
`@huggingface/transformers/dist/transformers.node.mjs` has a **static top-level**
`import sharp from "sharp"`, so `sharp` must ship even though we never process images. An
earlier size hack had been *excluding* `sharp`/`@img` from the trace — that only ever
"worked" because the build died on size before runtime. With the size fixed, the missing
import became a hard crash.

---

## The fix (all in `next.config.ts` + `.npmrc`)

1. **Include only the two CPU files by name** — never wildcard the `linux/x64` dir:
   ```ts
   outputFileTracingIncludes: {
     "/api/analyze": [
       "./models/**/*",
       "./node_modules/onnxruntime-node/bin/**/linux/x64/libonnxruntime.so.1",
       "./node_modules/onnxruntime-node/bin/**/linux/x64/onnxruntime_binding.node",
       "./node_modules/sharp/**",
       "./node_modules/@img/**",
     ],
     // ...same for "/api/analyze/warm"
   }
   ```
2. **Exclude the GPU providers as a guard** (and drop non-linux onnxruntime binaries):
   ```ts
   outputFileTracingExcludes: {
     "/api/analyze": [
       "./node_modules/onnxruntime-node/bin/**/darwin/**",
       "./node_modules/onnxruntime-node/bin/**/win32/**",
       "./node_modules/onnxruntime-node/bin/**/linux/arm64/**",
       "./node_modules/onnxruntime-node/bin/**/*providers*",
     ],
     // ...same for "/api/analyze/warm"
   }
   ```
   **Do NOT** exclude `sharp`/`@img` — transformers imports sharp at module load.
3. **`.npmrc`** stops the CUDA download at install entirely (faster builds):
   ```
   onnxruntime-node-install=skip
   ```
   npm prints a cosmetic `Unknown project config` warning but still honors it. The trace
   exclude in #2 is the guaranteed size fix regardless of whether this download is skipped.

### Result
Function is **~183 MB** (model 122.8 + onnxruntime CPU 33.9 + sharp/libvips 15.9 +
transformers 7.9), comfortably under 250 MB, with the **full 28-label model intact** — no
model downgrade was needed.

---

## Keeping future deploys green

- **Stay under 250 MB.** Use `--build-env VERCEL_ANALYZE_BUILD_OUTPUT=1` to get a
  per-function size breakdown in the build log. Budget headroom is ~67 MB.
- **Never wildcard a native-lib directory** in `outputFileTracingIncludes`. Name the
  exact files. Package postinstalls (like onnxruntime's CUDA fetch) can drop large extra
  files into those dirs on Linux that don't exist on macOS.
- **If you bump `onnxruntime-node`,** re-check `script/install-metadata.js` for new
  platform downloads, and re-confirm the function size after deploy.
- **If you swap the model** (`MODEL_ID` in `lib/inference/pipeline.ts`): update the
  `FILES` list in `scripts/fetch-model.mjs` and the label tables in `lib/emotion/`
  (`colors.ts`, `describe.ts`, `vibe.ts`) to cover the new label set, then re-check size.
- **If the `.npmrc` key ever stops working** (npm warns it's deprecated): set the Vercel
  project env var `ONNXRUNTIME_NODE_INSTALL=skip` instead. The trace exclude still
  protects function size either way.
- **Always smoke-test `/api/analyze` after deploy** — a green build only proves the
  function *fits*, not that it *runs*. The sharp crash was a green build that 500'd live.
