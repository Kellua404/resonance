# Resonance — Deployment Handoff (Vercel 250 MB function-size blocker)

> Written 2026-06-03. The app is **built, working locally, pushed to GitHub, and
> deploying on Vercel — but every production deploy fails on serverless function size.**
> This is purely a deploy-size problem; the app runs perfectly on `localhost`.

## TL;DR of the blocker
Every Vercel production deploy fails at the output stage with:
```
A Serverless Function has exceeded the unzipped maximum size of 250 MB.
```
The `/api/analyze` (+ `/api/analyze/warm`) function is too big: **120 MB ONNX model +
34 MB onnxruntime native lib + Next.js runtime**. Local file-trace ≈ 166 MB, but Vercel's
linux build pushes it over 250 MB.

## Project facts
- **Path:** `/Users/kellua/Desktop/Portfolio Projects/resonance`
- **GitHub:** https://github.com/Kellua404/resonance (PRIVATE, branch `main`). `gh` authed as `Kellua404`.
- **Vercel:** account `wwweddedd-1296` (**Hobby plan**), project `wwweddedd-1296s-projects/resonance`,
  prod alias `https://resonance-lac-sigma.vercel.app`. **Vercel CLI v54.6.1 installed + logged in;
  project linked (`.vercel/` exists).**
- **Stack:** Next.js **16.2.6** (App Router, Turbopack), React 19, **Tailwind v4** (tokens in
  `app/globals.css @theme`, no config file), `@huggingface/transformers` **v4.2.0**, zustand,
  framer-motion, Node 26 local.
- **Model:** `SamLowe/roberta-base-go_emotions-onnx`, 28-label GoEmotions,
  **q8 `model_quantized.onnx` = 120 MB**. English-only.
- **Deploy strategy:** model is **gitignored** and **fetched at build** by
  `scripts/fetch-model.mjs` (idempotent — skips complete files, refetches missing/truncated),
  then traced into the function via `outputFileTracingIncludes`. Build script
  (`node scripts/fetch-model.mjs && next build`) works correctly on Vercel; the model downloads fine.

## Root cause (confirmed from Vercel runtime logs, not guessed)
Pulled via `vercel logs <deployment-url> --json`. Two problems surfaced **in sequence**:

1. **(FIXED) Runtime crash:** `Error: libonnxruntime.so.1: cannot open shared object file`.
   `onnxruntime-node`'s `.node` addon `dlopen`s its shared lib at runtime; Next's static tracer
   can't follow a dlopen, so the 34 MB `.so` was never bundled → both routes 500'd at import with
   Next's generic HTML error page (not our JSON). **Fix applied:** added
   `./node_modules/onnxruntime-node/bin/**/linux/x64/*` to `outputFileTracingIncludes`.
   Verified locally that `libonnxruntime.so.1` is traced in.

2. **(BLOCKING NOW) Function > 250 MB.** With the `.so` included, the function is too big.
   Also learned: on Hobby, `vercel.json` `memory` caps at 2048 MB **and** is "ignored on Active
   CPU billing" → we **deleted `vercel.json`** (maxDuration lives in the route export
   `export const maxDuration = 60`).

## What was already tried
- ✅ Added onnxruntime linux `.so` to trace includes (fixed crash #1).
- ✅ Removed `vercel.json` (memory setting useless/blocking).
- ✅ Added `outputFileTracingExcludes` for `@img/**`, `sharp/**`, non-linux/non-x64 onnxruntime
  binaries on both analyze routes. Local trace 182 MB → **166 MB** (sharp fully removed).
  **Still failed >250 MB on Vercel.**
- ⏳ Was mid-deploy with `--build-env VERCEL_ANALYZE_BUILD_OUTPUT=1` to get Vercel's exact
  per-function size breakdown when the session ended. **Report never captured — get it FIRST next session.**

**Deploy via the Vercel CLI (`vercel deploy --prod --yes`), not git push** — git→auto-deploy was
NOT firing reliably this session (pushes didn't create new deployments; earlier `memory:3009`
deploys silently failed, leaving a stale build live, which wasted ~30 min chasing ghosts).

## Decision the next session must make (pick one)
The model is the dominant 120 MB. Options, roughly in recommended order:

1. **Switch to a smaller ONNX emotion model (plan §13 sanctioned fallback).** Biggest, most
   reliable win — drops 120 MB → ~25–65 MB, clears 250 MB easily. Verify on HF Hub that the repo
   has `onnx/model_quantized.onnx` and is Transformers.js-compatible. Candidates: a DistilBERT/MiniLM
   GoEmotions port; `j-hartmann/emotion-english-distilroberta-base` (7-emotion) ONNX port; last-resort
   `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (binary sentiment, ~65 MB, degrades
   spectrum to 2 poles). `MODEL_ID` is an env-swappable constant in `lib/inference/pipeline.ts`;
   update `scripts/fetch-model.mjs` FILES list + `EMOTION_COLORS`/mood tables in `lib/emotion/` to
   cover the new label set.
2. **Get the `VERCEL_ANALYZE_BUILD_OUTPUT=1` report first** to confirm what's actually big on linux
   before cutting (Next's own runtime may be a surprise contributor):
   `vercel deploy --prod --yes --build-env VERCEL_ANALYZE_BUILD_OUTPUT=1` then read the build-log table.
3. **Switch onnxruntime-node → WASM (`onnxruntime-web`)** to drop the 34 MB `.so` + the dlopen issue
   entirely. Harder: transformers.js auto-selects the node backend; forcing WASM is fiddly.
4. **Upgrade Vercel to Pro** (raises limits) — but goal is to stay free.

## Cleanup owed once fixed
`app/api/analyze/route.ts` has **TEMP diagnostics**: `stage` + `detail` fields and an `errDetail()`
helper in the error responses. **Remove these once the 500 is resolved.**

## Quick commands
```bash
cd "/Users/kellua/Desktop/Portfolio Projects/resonance"
vercel ls resonance --yes                                            # deployment states
vercel logs <deployment-url> --json                                 # real runtime errors
vercel deploy --prod --yes --build-env VERCEL_ANALYZE_BUILD_OUTPUT=1 # size report
npm run build                                                       # local build (fetches model, idempotent)
node scripts/prove-engine.mjs                                       # prove model runs offline locally
```

## State of the app (all done, works locally)
Engine: pipeline singleton (`lib/inference/pipeline.ts`), `app/api/analyze/route.ts` (nodejs runtime,
maxDuration 60), warm-up route, sentence segmentation. UI: Composer→Reading bloom, `--accent` recolor,
breathing spectrum bars, emotion arc, count-up telemetry, always-on engine badge, vibe palette +
**YouTube** search link, PNG fingerprint card, permalink round-trip, toasts, a11y + reduced-motion.
See `PLAN.md` §11 (build progress notes) and `PRODUCT.md`.

**Bottom line:** engine works; only blocker is model+onnxruntime exceeding Vercel's 250 MB Hobby
serverless limit. Most likely fix = swap to a smaller ONNX model via `MODEL_ID`, redeploy via CLI,
smoke-test `/api/analyze`, then strip the temp diagnostics.
