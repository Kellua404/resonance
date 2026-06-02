# Resonance — Build Plan

> **Resonance** reads the emotion in a piece of text — on its *own* server, with a
> real transformer model running inside a Vercel serverless function (`transformers.js`,
> **no paid AI API, no API key**) — and renders the result as a calm, breathing
> "emotional spectrum" + a per-sentence "emotional arc," plus a precise instrument
> readout that proves the engine is real and fast (latency, tokens, model id).
>
> This document is the **complete handoff spec**. A builder model should be able to
> ship the entire app from this file alone, in the §11 build order. It is intentionally
> exhaustive — including the inference route and the emotion→color engine — so the hard
> parts are *specified*, not *guessed*.
>
> Portfolio Project **B1** — the first backend project. Read alongside `PRODUCT.md`
> (brand, users, principles) and the Phase-2 section of the root `PORTFOLIO_PLAN.md`.

---

## 0. The North Star (read this first)

Most "AI sentiment" demos are a `fetch()` to a paid API wrapped in a spinner — the
"backend" is somebody else's. Resonance is **not that**. The differentiator, in one
sentence:

> **A real transformer model runs inside our own Vercel serverless function — no
> third-party API, no API key, zero per-request cost — and its output literally paints
> the interface.**

Everything orbits that. There are **two feelings to protect**, and when a tradeoff
threatens either, protect them:

- **"There's a real engine here."** The telemetry (inference latency in ms, tokens
  processed, model id, confidence scores) is not debug output — it is the *proof*, and
  it is a first-class part of the design. We never fake a result or hide the engine.
- **"This is calm."** The result *settles* into view with slow, breathing motion. Warm
  deep-ink, generous space. The opposite of a flashy AI gimmick.

Three things a visitor must remember:
1. **It's real and it's fast.** You watch a true millisecond latency and a token count;
   the result is grounded, not vibes. "Running server-side, for free?" is the reaction.
2. **It blooms.** Words resolve into a living emotional *spectrum* + an *arc* across the
   sentences — it breathes and recolors the whole UI to the dominant emotion.
3. **It's an instrument, not a form.** Telemetry readouts, a confidence-bar spectrum,
   warm clinical chrome. Not a textarea-and-a-button SaaS.

> **The frontend is a mirror of the backend.** This is a backend project; the interface
> exists to make the inference engine *felt*. Both must be excellent — a beautiful UI
> over a fake engine fails §0, and a real engine behind an ugly UI fails the portfolio.

---

## 1. Goal & Scope

A single-page Next.js app with a real backend:

- A calm, warm-dark composer where you paste/type text (with a few evocative sample
  texts to try instantly).
- On analyze, a **server-side transformer** classifies emotion and returns:
  - an **overall emotional spectrum** — ranked emotions with confidence scores,
  - a per-sentence **emotional arc** — the emotion of each sentence, in order,
  - **telemetry** — model id, token count, sentence count, inference latency (ms),
    and a "self-hosted · no API" flag.
- The frontend renders the spectrum (breathing confidence bars / radial bloom), the arc
  (a calm timeline), a derived **vibe** (palette + mood word + a free music-search
  link), and a live **instrument readout** of the telemetry. The whole UI **recolors**
  to the dominant emotion.
- **Real output:** a downloadable **emotion-fingerprint card** (PNG) and a shareable
  permalink that re-runs/restores the analysis.
- Fully responsive, accessible (WCAG AA, keyboard, reduced-motion), graceful warm
  cold-start, and **deployed on Vercel** with the model running server-side.

**Out of scope for v1** (see §15 stretch): accounts, saved history, multi-language
models, real Spotify OAuth, token-streaming generation, fine-tuning, any paid API.

---

## 2. Tech Stack (decided)

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14+ (App Router)** | We need a *real server* on Vercel. API Route Handlers run the model server-side; this is the whole point. Vercel-native, zero-config deploy. |
| Language | **TypeScript** | This is a backend showcase — types on the inference contract, the emotion schema, and the API boundary are part of the craft. |
| Inference | **`@huggingface/transformers`** (Transformers.js v3) | Runs real ONNX transformer models *in Node, server-side*, with **no API key and no per-request cost**. This is the North Star dependency. |
| Model | **`text-classification` emotion model** (multi-label, see §4.0) | Produces a rich emotional *spectrum*, not a single label. Bundled locally for reliable cold-starts. |
| Styling | **Tailwind CSS** | Utility-first; the UI chrome is calm and simple, the *data* provides the color. |
| State | **Zustand** | One small client store for the current result + UI state + URL sync. No prop-drilling. |
| Motion | **Framer Motion** | The "settle/bloom" entrance, breathing bars, recolor transitions, toasts. Calm, never flashy. |
| Charts | **Hand-rolled SVG/divs** (no chart lib) | The spectrum (bars) and arc (timeline) are simple and bespoke; a chart lib would look generic and bloat the bundle. |
| Icons | **lucide-react** | Copy, download, link, sparkle/activity, play. |
| Fonts | **Fraunces** (display/body) + **Geist Mono** (telemetry/labels) | See note below. |

> **Why these fonts:** Fraunces is a soft, optical, *emotional* serif — warm and human,
> which is exactly the feeling of reading emotion in words; its optical/`SOFT` axes give
> character. Geist Mono makes every telemetry value read like a precise instrument
> readout (and quietly nods to the Vercel deploy). The pairing is the typographic
> signature. Do **not** substitute Inter/Roboto/Arial, and do **not** reuse Aurora's
> Instrument Serif + IBM Plex Mono — Phase-2 must look distinct.

Install (the builder runs these in §10):

```bash
npm install @huggingface/transformers zustand framer-motion lucide-react
npm install -D tailwindcss postcss autoprefixer
```

---

## 3. Design Language

**Aesthetic direction:** *a calm reading instrument / an emotional seismograph.* Warm
deep-ink chrome (not Aurora's cold observatory — vary it). The interface is mostly quiet
and dark; **color enters only from the result** — the dominant emotion tints the accent,
the spectrum, and a soft ambient glow behind the content. Hairline borders, mono
telemetry, generous negative space, slow breathing motion.

### 3.1 Color tokens (`tailwind.config.ts` → `theme.extend.colors`)

```ts
ink: {
  950: '#0B0A0C',   // void — deepest background (warm-black, faint magenta cast)
  900: '#121013',   // app base
  800: '#1A171C',   // panel base
  700: '#231F26',   // raised surface
  600: '#2E2932',   // border / hairline base
},
mist: {
  500: '#7A7480',   // muted label text
  300: '#A8A2AE',   // secondary text
  100: '#ECE8F0',   // primary text on dark
},
// `accent` is NOT fixed — it is driven at runtime from the dominant emotion via the
// CSS variable `--accent` (see §5.4 / §7.4). Tailwind keeps a warm fallback:
accent: '#E8B04B',
```

- **Backgrounds:** glass panels = `bg-ink-800/70` + `backdrop-blur-xl` + `border
  border-white/[0.06]`. A soft radial **ambient glow** in `var(--accent)` at ~8–12%
  sits behind the result, recoloring the room to the feeling.
- **Text:** mist scale. Telemetry labels are Geist Mono, uppercase, tracked-wide,
  `text-mist-500`. Values are accent-tinted, tabular.
- **Accent:** `var(--accent)` for active states, focus rings, the dominant spectrum bar,
  and the ambient glow. Recomputed on every result (§7.4).
- **Per-emotion color:** every emotion has its own hue (the EMOTION_COLORS map, §5.4) —
  the spectrum bars and arc dots use those, while `--accent` = the dominant emotion's.

### 3.2 Typography scale

| Use | Font | Style |
|-----|------|-------|
| Wordmark "Resonance" | Fraunces | clamp(2rem,5vw,3.25rem), optical, soft, slight tracking-tight |
| Mood word (the result hero, e.g. "Wistful") | Fraunces | clamp(2.5rem,8vw,5rem), light weight, accent-tinted |
| Section / telemetry labels ("SPECTRUM", "LATENCY") | Geist Mono | 11px, uppercase, letter-spacing 0.18em, mist-500 |
| Telemetry values (123 ms, 84 tokens) | Geist Mono | 13px, accent, tabular-nums |
| Emotion names + % | Geist Mono | 12px |
| Composer / body text | Fraunces | 1.0625–1.25rem, mist-100, relaxed leading |
| Tagline / quiet copy | Fraunces | 1rem, italic optional, mist-300 |

Load via `next/font/google` (Fraunces) + `next/font` for Geist Mono (Geist ships as an
npm package `geist`, or load Geist Mono via `next/font/google`). `display: 'swap'`.

### 3.3 Layout — the instrument

- **Two calm states**, cross-faded: **Composer** (before analysis) → **Reading**
  (after). Don't navigate away; the composer collapses to a slim editable strip at top
  and the result blooms below.
- **Top-left:** `Wordmark` "Resonance" + tagline *"Read the feeling in your words."*
- **Top-right / persistent:** the **EngineBadge** — a tiny, always-visible chip:
  `● self-hosted · transformers.js · no API key`. This is brand + proof; it never hides.
- **Composer (center, generous):** a large, calm textarea in a glass card; a row of
  3–4 **sample-text chips**; a single primary **Analyze** action. Char/token hint.
- **Reading state:**
  - **Hero:** the dominant **mood word** (huge Fraunces, accent-tinted) + one-line
    plain-language read ("Mostly wistful, with threads of hope").
  - **Spectrum:** the ranked emotions as breathing horizontal confidence bars (each in
    its own emotion color), top ~6.
  - **Arc:** a horizontal calm timeline of per-sentence emotion (dots/segments colored
    by sentence emotion) — the emotional shape of the text left→right.
  - **Telemetry readout:** Geist-Mono panel — `MODEL` · `TOKENS` · `SENTENCES` ·
    `LATENCY` · `BACKEND: server (onnx)`. Counts up on reveal.
  - **Vibe:** derived palette swatches + a free **"find music for this mood"** link.
  - **Actions:** Export card (PNG) · Copy link · Analyze new text.
- **Composition rule:** lots of negative space; the mood word + spectrum are the hero;
  the telemetry is a precise, dense instrument in one corner. Density vs. emptiness is
  the tension (same discipline as Aurora's panel).

---

## 4. The Inference Engine — the heart of Resonance (REFERENCE CODE)

This is the most important section — the genuinely hard, Vercel-specific part a weaker
model will get wrong (model loading, warm-instance caching, the read-only filesystem,
function timeout/bundle tracing). Use this almost verbatim.

### 4.0 Choosing the model (do this first, verify on the HF Hub)

We want a **multi-label text-classification** model with an **ONNX** export that
Transformers.js can load, and rich enough labels to form a *spectrum*.

- **Preferred — 28-label GoEmotions** (admiration, joy, sadness, anger, fear, … ,
  neutral): gives the richest fingerprint. Look for an ONNX/Transformers.js-compatible
  repo on the Hub, e.g. search `go_emotions onnx` (SamLowe's GoEmotions has an ONNX
  publication; confirm the exact repo id and that an `onnx/` folder exists before
  committing). Run with `topk: null` to get **all** label scores → the spectrum.
- **Reliable fallback — 7-emotion DistilRoBERTa** (anger, disgust, fear, joy, neutral,
  sadness, surprise): the `j-hartmann/emotion-english-distilroberta-base` family has
  Transformers.js-compatible ports (search `Xenova` / `onnx` for it). Fewer labels but
  rock-solid.
- **Last-resort fallback — binary sentiment:** `Xenova/distilbert-base-uncased-finetuned-sst-2-english`
  (POSITIVE/NEGATIVE) is *known* to work in Transformers.js. Ship this only if neither
  emotion model loads; the spectrum degrades to a 2-pole gradient.

> **Builder note:** pick ONE, confirm its exact Hub id and that `transformers.js` can
> load it (`onnx/` weights present). Put the id in `MODEL_ID` (§7) so it's swappable.
> Then **vendor the model into the repo** (§4.2) so production cold-starts don't depend
> on a network download. Whatever label set the chosen model has, the EMOTION_COLORS
> map (§5.4) must cover every label (give unmapped labels a neutral grey fallback).

### 4.1 The pipeline singleton (`lib/inference/pipeline.ts`) — REFERENCE

Load the model **once per warm Lambda instance** and cache it on `globalThis`. Loading
on every request would re-read ~50–300MB and blow the timeout.

```ts
// lib/inference/pipeline.ts  (reference — adapt names to taste)
import { pipeline, env, type TextClassificationPipeline } from '@huggingface/transformers';

// We vendor the model into the repo (see §4.2) and forbid remote fetches in prod so a
// cold start never waits on the network. localModelPath points at our bundled copy.
env.allowRemoteModels = process.env.NODE_ENV !== 'production'; // dev may fetch; prod local-only
env.localModelPath = process.cwd() + '/models';                // <repo>/models/<MODEL_ID>/...
// Read-only FS on Vercel except /tmp — point any cache there just in case.
env.cacheDir = '/tmp/transformers-cache';

export const MODEL_ID = process.env.MODEL_ID ?? 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

// Cache across warm invocations (and across HMR in dev) on globalThis.
const g = globalThis as unknown as { __resonancePipe?: Promise<TextClassificationPipeline> };

export function getEmotionPipeline(): Promise<TextClassificationPipeline> {
  if (!g.__resonancePipe) {
    g.__resonancePipe = pipeline('text-classification', MODEL_ID, {
      // q8 = 8-bit quantized weights → smaller bundle + faster CPU inference on Lambda.
      dtype: 'q8',
    }) as Promise<TextClassificationPipeline>;
  }
  return g.__resonancePipe;
}
```

### 4.2 Vendoring the model + Vercel function config — REFERENCE

The model files must be (a) present in the repo and (b) traced into the serverless
function bundle, or production will fail to find them.

1. **Download the model into the repo** once, into `models/<MODEL_ID>/` (the `onnx/`
   weights + `config.json` + tokenizer files). A small script (`scripts/fetch-model.ts`)
   that runs the pipeline locally with `allowRemoteModels=true` and a `cacheDir` of
   `./models` is the simplest way; commit the result. **Verify the directory layout
   matches what `localModelPath` expects** (`models/<org>/<name>/...`).
2. **Tell Next.js to bundle the model + the wasm/onnx runtime** into the function. In
   `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@huggingface/transformers'], // don't bundle/transpile it
  outputFileTracingIncludes: {
    // ensure the vendored model ships with the analyze route's lambda
    '/api/analyze': ['./models/**/*'],
  },
};
export default nextConfig;
```

3. **The route must run on the Node runtime with a raised timeout** (cold start +
   inference can exceed the 10s default). In `app/api/analyze/route.ts`:

```ts
export const runtime = 'nodejs';     // NOT 'edge' — onnxruntime needs Node
export const maxDuration = 60;       // Hobby allows up to 60s; cold start needs headroom
export const dynamic = 'force-dynamic';
```

> **This trio (vendor + trace-include + nodejs/maxDuration) is the single most
> failure-prone thing in the project.** If production 500s or times out, it is almost
> always one of these three. Test with `next build` locally and a Vercel preview deploy
> *early* (§11 step 1), before building any UI.

### 4.3 The analyze route (`app/api/analyze/route.ts`) — REFERENCE

Segment into sentences, run the whole text + each sentence, aggregate, and return a
typed contract with **real telemetry**.

```ts
// app/api/analyze/route.ts  (reference — adapt)
import { NextResponse } from 'next/server';
import { getEmotionPipeline, MODEL_ID } from '@/lib/inference/pipeline';
import { splitSentences } from '@/lib/inference/segment';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const MAX_CHARS = 4000;       // guardrail: cap input size
const MAX_SENTENCES = 40;     // guardrail: cap arc work per request

export async function POST(req: Request) {
  const t0 = performance.now();
  const { text } = await req.json().catch(() => ({ text: '' }));
  const clean = String(text ?? '').trim().slice(0, MAX_CHARS);
  if (clean.length < 2) {
    return NextResponse.json({ error: 'Provide some text to analyze.' }, { status: 400 });
  }

  const pipe = await getEmotionPipeline();

  // Overall spectrum: ask for ALL label scores (topk: null), then normalize/sort.
  const overallRaw = await pipe(clean, { topk: null }); // -> [{label, score}, ...]
  const spectrum = normalizeSpectrum(overallRaw);       // see §5.x helper

  // Per-sentence arc (batched). Cap to keep latency bounded.
  const sentences = splitSentences(clean).slice(0, MAX_SENTENCES);
  const arcRaw = sentences.length
    ? await pipe(sentences, { topk: 1 })                // -> [[{label,score}], ...]
    : [];
  const arc = sentences.map((s, i) => ({
    text: s,
    label: arcRaw[i]?.[0]?.label ?? spectrum[0]?.label,
    score: arcRaw[i]?.[0]?.score ?? 0,
  }));

  // Real telemetry — this is the proof, not decoration.
  const tokenizer = (pipe as any).tokenizer;
  const tokens = tokenizer ? tokenizer(clean).input_ids.size ?? null : null;
  const latencyMs = Math.round(performance.now() - t0);

  return NextResponse.json({
    spectrum,                         // [{label, score}] sorted desc, all labels
    dominant: spectrum[0]?.label,
    arc,                              // [{text, label, score}]
    telemetry: {
      model: MODEL_ID,
      tokens,
      sentences: sentences.length,
      latencyMs,
      backend: 'server · onnx · no-api',
    },
  });
}

function normalizeSpectrum(raw: Array<{ label: string; score: number }>) {
  const arr = Array.isArray(raw) ? raw : [raw];
  return [...arr].sort((a, b) => b.score - a.score);
}
```

> **Builder note:** the exact shape returned by `pipe(...)` depends on the model and the
> `topk` option — log it once and adapt `normalizeSpectrum`/the arc mapping to the real
> shape. Everything else above is complete. Keep the `telemetry` block honest.

### 4.4 Warm-up & graceful cold start

- Add a `GET /api/analyze/warm` (or a `HEAD` on the route) that calls
  `getEmotionPipeline()` and returns `{ ready: true }`. The client **fires this on first
  paint** so the model is warming while the user is still typing.
- The client shows an honest, calm state: first analyze after cold may take a couple
  seconds — surface it as **"warming the engine…"** with a breathing indicator and (once
  known) the model id, *not* a generic spinner. This turns the one weakness (cold start)
  into on-brand "there's a real engine spinning up" theater.

---

## 5. The Emotion → Color & Vibe Engine (second hard system, REFERENCE CODE)

This is what turns raw scores into a *feeling on screen*. Pure functions, fully
client-side, deterministic.

### 5.4 Emotion color map + dominant accent (`lib/emotion/colors.ts`) — REFERENCE

Every label gets a hue; the dominant emotion drives `--accent` and the ambient glow.

```ts
// lib/emotion/colors.ts  (reference — extend to cover your chosen model's labels)
export const EMOTION_COLORS: Record<string, string> = {
  // warm / positive
  joy: '#F2C14E', admiration: '#F2A03D', amusement: '#F4B860', love: '#F06C9B',
  gratitude: '#E8B04B', optimism: '#F2D45E', pride: '#F0A33C', excitement: '#FF8A5B',
  // tender
  caring: '#E7A2C4', desire: '#E86A8E', relief: '#9FD6B0', approval: '#A9D08E',
  // cool / negative
  sadness: '#5B8DEF', grief: '#3F6FD8', disappointment: '#6E7FC0', remorse: '#6A7BB5',
  fear: '#8E7BE8', nervousness: '#9A86E0', confusion: '#7E8AA8',
  // hot / negative
  anger: '#E5524A', annoyance: '#E07A52', disgust: '#7FA05A', disapproval: '#C56B5A',
  // surprise / neutral
  surprise: '#54C7CB', realization: '#5FB8C0', curiosity: '#5AC2A8', neutral: '#8B8694',
  // sentiment fallback (binary model)
  POSITIVE: '#F2C14E', NEGATIVE: '#5B8DEF',
};

export const colorFor = (label?: string) =>
  (label && EMOTION_COLORS[label]) || '#8B8694'; // grey fallback for unmapped labels

export function applyAccent(label?: string) {
  const c = colorFor(label);
  document.documentElement.style.setProperty('--accent', c);
  return c;
}
```

### 5.5 Mood word + plain-language read (`lib/emotion/describe.ts`)

Map the **top emotions** to a single evocative **mood word** and a one-line read:

- Mood word: a small lookup from dominant label → a nicer display word (e.g.
  `sadness → "Wistful"`, `joy → "Bright"`, `nervousness → "Restless"`, `neutral →
  "Even"`). Keep it a curated table — it's copy, and copy is craft (§16).
- Read line: template from the top 2–3, e.g. *"Mostly {wistful}, with threads of
  {hope}."* Round scores to %; only mention emotions above a small threshold.

### 5.6 The vibe (`lib/emotion/vibe.ts`)

From the dominant emotion(s) derive a small **palette** (the dominant color + 2
analogous/derived swatches) and a **mood query** string. The "find music" link is a
**free** outbound search URL (no auth, no API), e.g. a Spotify/YouTube *search* URL:
`https://open.spotify.com/search/${encodeURIComponent(moodQuery + ' playlist')}`. We
link out — we never authenticate or call a paid API.

---

## 6. Component Breakdown (build order in §11)

Create under `components/` (or `app/_components/`). Each is small and focused.

| # | Component | Responsibility |
|---|-----------|----------------|
| 1 | `EngineBadge.tsx` | Always-visible "self-hosted · transformers.js · no API key" chip. Brand + proof. |
| 2 | `Wordmark.tsx` | "Resonance" + tagline, staggered entrance. |
| 3 | `Composer.tsx` | Textarea, char/token hint, sample-text chips, Analyze button. Collapses in reading state. |
| 4 | `SampleChips.tsx` | 3–4 evocative preset texts → fill the composer. |
| 5 | `AnalyzeButton.tsx` | Primary action; shows idle / warming / analyzing states honestly. |
| 6 | `MoodHero.tsx` | The huge accent-tinted mood word + plain-language read line. |
| 7 | `Spectrum.tsx` | Ranked emotions as breathing confidence bars (emotion-colored, top ~6). |
| 8 | `EmotionArc.tsx` | Horizontal per-sentence timeline; hover a segment → see the sentence + emotion. |
| 9 | `Telemetry.tsx` | Geist-Mono readout: MODEL · TOKENS · SENTENCES · LATENCY · BACKEND. Counts up. |
| 10 | `Vibe.tsx` | Derived palette swatches + "find music for this mood" outbound link. |
| 11 | `AmbientGlow.tsx` | Fixed soft radial glow in `--accent` behind content; eases on recolor. |
| 12 | `ExportCard.tsx` | Renders + downloads the emotion-fingerprint PNG (§8). |
| 13 | `ActionBar.tsx` | Export · Copy link · Analyze new. lucide icons, tooltips, shortcuts. |
| 14 | `Toast.tsx` | Transient confirmations ("Link copied", "Saved card"). |

---

## 7. State, Data Model & Systems

### 7.1 The inference contract (`lib/types.ts`)

```ts
export type EmotionScore = { label: string; score: number };           // 0..1
export type ArcPoint     = { text: string; label: string; score: number };
export type Telemetry    = {
  model: string; tokens: number | null; sentences: number;
  latencyMs: number; backend: string;
};
export type AnalysisResult = {
  spectrum: EmotionScore[];   // sorted desc, all labels
  dominant: string;
  arc: ArcPoint[];
  telemetry: Telemetry;
};
```

### 7.2 Client store (`store/useResonanceStore.ts`, Zustand)

| Field | Type | Notes |
|-------|------|-------|
| `text` | string | composer contents |
| `status` | `'idle'\|'warming'\|'analyzing'\|'done'\|'error'` | honest engine state |
| `result` | `AnalysisResult \| null` | last analysis |
| `error` | string \| null | surfaced calmly |

Actions: `setText`, `warm()` (calls `/api/analyze/warm` on mount), `analyze()`
(POST `/api/analyze`, sets status transitions + `applyAccent(dominant)`), `reset()`,
`loadFromUrl()`, `toUrl()`.

### 7.3 Sentence segmentation (`lib/inference/segment.ts`)

A small, dependency-free splitter: split on `.?!` followed by whitespace/end, keep
non-empty trimmed sentences, merge ultra-short fragments. Good enough for the arc; note
its limits in a comment. (Stretch: `Intl.Segmenter` with `granularity:'sentence'`.)

### 7.4 Dynamic accent + ambient recolor

On every `done`, call `applyAccent(result.dominant)` (§5.4) → sets `--accent`. `Spectrum`
bars use each emotion's own color; `MoodHero`, focus rings, telemetry values, and
`AmbientGlow` use `--accent`. Transition the glow color over ~600ms so the room
*recolors* to the feeling rather than snapping (honor reduced-motion: snap).

### 7.5 URL state (`lib/urlState.ts`)

Encode the analyzed **text** (compressed/base64, length-guarded) in the URL hash so a
permalink **re-runs** the analysis on load (deterministic model → same result). If the
text is too long for a tidy URL, fall back to encoding just the result summary
(spectrum + dominant + mood) for a static shareable read. "Copy link" → clipboard →
Toast. Every analysis becomes a permalink — a strong portfolio detail.

---

## 8. The "Real Output" System

### 8.1 Emotion-fingerprint card (PNG) (`lib/exportCard.ts`)
- Render a tasteful share card to an offscreen `<canvas>` (or html-to-image on a hidden
  node): the mood word, the top-5 spectrum as colored bars, the arc as a slim ribbon,
  and a footer line: `Resonance · self-hosted emotion model · {latencyMs} ms`.
- `canvas.toBlob` → download. Filename: `resonance-${dominant}-${shortHash}.png`.
- The latency-in-footer detail reinforces §0: even the share artifact proves it's real.

### 8.2 Share link
- "Copy link" → `urlState.toUrl()` → clipboard → Toast (§7.5).

### 8.3 Vibe link
- The "find music for this mood" outbound search URL (§5.6) — free, no auth/API.

---

## 9. File / Folder Structure

```
resonance/
├── PLAN.md                     ← this file
├── PRODUCT.md                  ← brand / users / principles
├── README.md                   ← run + deploy + the model story (builder writes at end)
├── next.config.mjs             ← serverExternalPackages + outputFileTracingIncludes (§4.2)
├── package.json
├── tailwind.config.ts          ← color tokens (§3.1), fonts
├── postcss.config.js
├── tsconfig.json
├── scripts/
│   └── fetch-model.ts          ← one-off: vendor the model into /models (§4.2)
├── models/                     ← VENDORED model (committed) — models/<id>/onnx/... + config + tokenizer
├── public/
│   └── favicon.svg             ← a small spectrum/waveform mark
├── app/
│   ├── layout.tsx              ← fonts (Fraunces + Geist Mono), <body> base, metadata/OG
│   ├── globals.css             ← Tailwind directives, base, --accent var, scrollbar/range styling
│   ├── page.tsx                ← assembles Composer/Reading states + all components
│   └── api/
│       └── analyze/
│           ├── route.ts        ← POST analyze (§4.3): runtime=nodejs, maxDuration=60
│           └── warm/route.ts   ← GET warm-up (§4.4)
├── lib/
│   ├── types.ts                ← the inference contract (§7.1)
│   ├── inference/
│   │   ├── pipeline.ts         ← model singleton (§4.1)
│   │   └── segment.ts          ← sentence splitter (§7.3)
│   ├── emotion/
│   │   ├── colors.ts           ← EMOTION_COLORS + applyAccent (§5.4)
│   │   ├── describe.ts         ← mood word + read line (§5.5)
│   │   └── vibe.ts             ← palette + music query (§5.6)
│   ├── exportCard.ts           ← PNG fingerprint (§8.1)
│   └── urlState.ts             ← permalink encode/decode (§7.5)
├── store/
│   └── useResonanceStore.ts
└── components/                 ← the §6 components
```

---

## 10. Setup Commands (builder runs first)

```bash
cd "resonance"
npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*"
npm install @huggingface/transformers zustand framer-motion lucide-react geist
# 1) pick + confirm MODEL_ID (§4.0), then vendor the model:
npx tsx scripts/fetch-model.ts        # downloads into ./models/<MODEL_ID>/  (commit it)
npm run dev
```

Then, in order:
1. Configure `tailwind.config.ts` (tokens §3.1 + fonts), `globals.css` (Tailwind dirs +
   `--accent` + base), fonts in `layout.tsx`.
2. Wire `next.config.mjs` (§4.2) and the route runtime/maxDuration (§4.2/§4.3).
3. **Prove the engine end-to-end FIRST** (§11 step 1) — before any real UI.
4. Build in §11 order. Test responsive + reduced-motion + `next build` + a Vercel
   **preview** deploy early.

---

## 11. Build Order (do them in this sequence — wow-core/engine FIRST)

> **Build progress (session 1 — steps 1–14 implemented; only live Vercel deploy +
> Lighthouse remain).** Steps 1–7 were built at high effort; 8–14 followed in the same
> session.
> - **Stack as built:** Next.js **16.2.6** (App Router, Turbopack) · React 19 ·
>   **Tailwind v4** (tokens live in `app/globals.css` `@theme`, *not* a
>   `tailwind.config.ts`) · `@huggingface/transformers` **v4.2.0** · zustand 5 ·
>   framer-motion 12.
> - **Model chosen & vendored:** `SamLowe/roberta-base-go_emotions-onnx` — 28-label
>   GoEmotions, multi-label (sigmoid) → rich spectrum. Vendored to
>   `models/SamLowe/roberta-base-go_emotions-onnx/` (q8 `model_quantized.onnx`, **119 MB**).
> - **v4 API gotcha:** the all-labels option is **`top_k`** (snake_case), *not* `topk`;
>   `topk` silently returns only the single top label. Arc uses `top_k: 1` and returns a
>   **flat** array (one `{label,score}` per sentence).
> - **Verified locally:** offline inference from the vendored copy (`scripts/prove-engine.mjs`),
>   `/api/analyze` + `/api/analyze/warm` via curl, clean `next build`, and the model
>   files confirmed **traced** into the analyze lambda (`.nft.json`). Browser-verified
>   Composer→Reading flow (mood hero, recolor, spectrum, telemetry).
> - **Deploy strategy (decided): fetch-at-build.** The 120 MB ONNX exceeds GitHub's
>   100 MB file limit, so `models/` is **gitignored** (not committed) and the `build`
>   script runs `scripts/fetch-model.mjs` before `next build` to download it from HF and
>   trace it in. No Git LFS, no Vercel CLI — normal push-to-GitHub → auto-deploy works.
>   The fetch is **idempotent** (skips complete files, refetches only missing/truncated
>   ones), so local rebuilds never re-download. Verified: clean-clone build, cached
>   rebuild, and truncated-file refetch.
> - **⚠️ Still pending (needs user/credentials):** the **live Vercel deploy** smoke-test
>   (§13 real risk) — *not yet done*; user will push + deploy.
> - **Also built this session (8–14):** `EmotionArc` (per-sentence timeline + hover/focus
>   tooltip), `Vibe` (palette + free Spotify-search link), `exportCard.ts` + `ActionBar`
>   (PNG fingerprint card — visually verified — + Copy link + New), `urlState.ts` +
>   `loadFromUrl` (permalink round-trip verified on reload), `Toast`, `app/icon.svg`
>   favicon, OG/metadata, and this README's model story. Browser-verified: recolor,
>   spectrum, arc, vibe, export card, permalink, mobile 375px reflow, reduced-motion.
> - **Effort note:** 1–7 at high effort; 8–14 followed at medium in the same session.

1. ✅ **The engine, proven.** `pipeline.ts` + `analyze/route.ts` + `next.config.ts`
   model vendoring/tracing. Hit `/api/analyze` with curl, get a real spectrum + honest
   telemetry back **locally** ✅ (Vercel preview deploy ⏳ pending credentials). This
   de-risks the entire project up front (§4 is the hard part).
2. ✅ **Contract + store.** `types.ts`, `useResonanceStore.ts` (warm/analyze/reset),
   sentence `segment.ts`.
3. ✅ **Composer state.** `Composer` + `SampleChips` + `AnalyzeButton` → can submit text
   and see the raw result in console. Warm-up fired on mount (§4.4).
4. ✅ **Emotion engine (client).** `colors.ts` (+`applyAccent`), `describe.ts`,
   `vibe.ts`.
5. ✅ **Reading hero.** `MoodHero` + dynamic `--accent` + `AmbientGlow` recolor.
6. ✅ **Spectrum.** `Spectrum` breathing confidence bars (emotion-colored).
7. ✅ **Telemetry.** `Telemetry` readout (count-up), `EngineBadge`. (Make the engine
   *visible* — this is §0.)
8. ✅ **Arc.** `EmotionArc` per-sentence timeline + hover/focus tooltip (sentence +
   emotion + %). Browser-verified.
9. ✅ **Vibe.** `Vibe` palette swatches + free **YouTube**-search link (no auth/API;
   chosen over Spotify because `open.spotify.com` gets hijacked to home by an installed
   desktop app, dropping the query).
10. ✅ **Output.** `exportCard.ts` (PNG, visually verified) + `ActionBar`
    (Export · Copy link · New, with E/L/N shortcuts), `urlState.ts` + `loadFromUrl`
    (permalink round-trip verified on reload), `Toast`.
11. ✅ **Motion + calm.** Composer→Reading cross-fade, settle/bloom entrances (Framer
    Motion), breathing bars, honest warming-state theater. *(A finer easing/timing
    polish pass is optional.)*
12. ✅ **Responsive.** Verified at 375 (mobile stack) and desktop; spectrum/arc/grid
    reflow. *(768 spot-check optional.)*
13. ✅ **A11y + reduced-motion + robustness.** Keyboard + focus rings, aria
    meters/labels, calm error state (role=alert), client+server input guardrails (§4.3),
    reduced-motion gate (verified). *(Full screen-reader pass optional.)*
14. 🟡 **Polish pass.** ✅ `app/icon.svg` favicon, OG/metadata, README "model story".
    ⏳ Final Lighthouse + live preview-deploy check (needs deploy).

---

## 12. Interaction & Motion Spec

- **Page load:** background eases from void; Wordmark + tagline stagger in; composer
  card fades up. EngineBadge fades in and **fires the warm-up** quietly.
- **Analyze:** button → `analyzing` (or `warming` on cold). The composer collapses
  upward and the reading state **blooms** in: mood word scales/fades up, spectrum bars
  grow from 0→score (staggered ~0.06s), telemetry counts up, glow recolors over ~600ms.
  Everything *settles* — slow easeOutCubic, nothing pops.
- **Breathing:** the spectrum bars and ambient glow have a very subtle, slow
  opacity/scale breathing loop (≈6s) so the result feels alive but calm.
- **Arc hover:** highlight the segment, reveal its sentence + emotion in a quiet tooltip.
- **Recolor:** changing analysis tweens `--accent`/glow rather than hard-cutting.
- **Keyboard:** `⌘/Ctrl+Enter` analyze · `E` export · `L` copy link · `N` new.
- **Reduced motion:** no breathing, no bloom-stagger (fade only), glow snaps, count-up
  becomes instant. Still beautiful, just still.

---

## 13. Accessibility, Robustness & the Real Risk

- **WCAG AA:** all text ≥ AA on warm-dark chrome (mist scale satisfies this). Emotion
  colors are decorative — **never** the only signal: every spectrum bar and arc segment
  has a text label + %.
- **Keyboard / focus:** textarea, chips, buttons all reachable; visible `--accent` focus
  rings; ActionBar + dialog operable; `Esc` closes.
- **Reduced motion:** `prefers-reduced-motion` gates all motion (§12).
- **Honest, calm errors:** network/model errors surface as a quiet line ("The engine
  couldn't read that — try again"), never a stack trace. Empty/too-short input is
  guarded client- and server-side (§4.3).
- **THE REAL RISK — server inference on Vercel (§4.2).** This project lives or dies on
  the model running in the function. Mitigations, in order: (1) **vendor** the model +
  `outputFileTracingIncludes` so it ships in the bundle; (2) `runtime='nodejs'` +
  `maxDuration=60`; (3) `dtype:'q8'` to shrink it; (4) warm-up route so users rarely hit
  a cold start; (5) **test a Vercel preview deploy at step 1**, not at the end. If the
  bundle exceeds limits with a large model, fall back to the smaller 7-emotion or
  sentiment model (§4.0). Document whichever shipped in the README.

---

## 14. Performance Targets

- **Cold start** (first request after idle): a couple seconds is acceptable *if* shown
  as honest "warming the engine" theater; warm-up route minimizes user exposure.
- **Warm inference:** target ≲ 300–600 ms for a short paragraph on Vercel CPU; the arc
  is the main cost — cap sentences (§4.3) to keep it bounded. The real number is shown
  in telemetry either way (honesty > a fake fast number).
- **Client:** Lighthouse Performance ≥ 90, Accessibility ≥ 95. UI animates only
  `transform`/`opacity`/color. Fonts `display:swap`.
- **Bundle:** keep the *client* JS lean (the model is server-side only — never ships to
  the browser). No chart lib.

---

## 15. Stretch Goals (only after Definition of Done)

- **Emotional arc as a flowing line** (smoothed area chart) instead of segments.
- **`Intl.Segmenter`** for better multilingual sentence splitting.
- **Compare two texts** side by side (e.g. before/after edits).
- **Token attribution:** highlight which words pushed the dominant emotion (attention or
  per-token classification) — deepens the "real engine" proof.
- **A second model task** (e.g. zero-shot topic) shown as a tab — multi-pipeline flex,
  and a natural bridge to **Conveyor** (run these as queue workers).
- **Animated/WebM share card.** **OG image** generated from a signature analysis.
- **Light "paper" reading theme** vs the warm-dark default.

---

## 16. Copy / Content (ready-to-use)

- **Wordmark:** `Resonance`
- **Tagline:** *"Read the feeling in your words."*
- **Engine badge:** `● self-hosted · transformers.js · no API key`
- **Composer placeholder:** *"Paste a journal entry, a message, a few lines of
  lyrics…"*
- **Analyze button:** `Analyze` / warming: `Warming the engine…` / busy: `Reading…`
- **Telemetry labels:** `MODEL` · `TOKENS` · `SENTENCES` · `LATENCY` · `BACKEND`
- **Sample texts (chips):** a wistful journal line · an anxious message · an elated
  announcement · a calm neutral paragraph. (Write 3–4 short, evocative, distinct ones.)
- **Mood-word table (sample):** sadness→"Wistful" · joy→"Bright" · love→"Tender" ·
  anger→"Fierce" · fear→"Uneasy" · nervousness→"Restless" · surprise→"Struck" ·
  neutral→"Even" · gratitude→"Warm" · disappointment→"Heavy". (Extend per model labels.)
- **Read line template:** *"Mostly {x}, with threads of {y}."*
- **Vibe link:** `find music for this mood →`
- **Errors:** "Give me a little more text to read." · "The engine couldn't read that —
  try again."
- **Toasts:** "Link copied" · "Saved your fingerprint card"
- **Footer (tiny):** "Built with Next.js · transformers.js · ONNX — no AI API.
  Portfolio Project B1."
- **Card footer:** `Resonance · self-hosted emotion model · {latencyMs} ms`

---

## 17. Definition of Done

- [ ] `POST /api/analyze` runs a **real transformer server-side** and returns a spectrum
      + arc + honest telemetry — **verified on a live Vercel deploy**, not just locally.
- [ ] The model is **vendored** and bundled (no runtime network download in prod).
- [ ] Warm-up route fires on mount; cold start shows honest "warming" theater.
- [ ] Composer → Reading cross-fade; result **blooms** in calmly.
- [ ] Mood hero + plain-language read render and are accent-tinted.
- [ ] Spectrum: top emotions as breathing, emotion-colored, labeled confidence bars.
- [ ] Emotional arc: per-sentence timeline with hover detail.
- [ ] Telemetry readout shows live model · tokens · sentences · latency · backend.
- [ ] UI recolors to the dominant emotion (`--accent` + ambient glow).
- [ ] EngineBadge ("self-hosted · no API key") always visible.
- [ ] Vibe palette + free music-search link work.
- [ ] Export PNG fingerprint card downloads; "Copy link" round-trips via URL.
- [ ] Fully responsive (375 / 768 / 1440).
- [ ] `prefers-reduced-motion` respected; keyboard + focus + aria complete; AA contrast.
- [ ] Calm error + empty/too-short guards (client + server).
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95; client JS lean (model server-only).
- [ ] README with run + deploy + **the model story** (which model, why, no-API).

---

## 18. After Done

1. `git init` in `resonance/`, push to `github.com/Kellua404/resonance` (private by
   default per repo policy; confirm before making public).
2. Import to Vercel → deploy → **smoke-test the live `/api/analyze`** (the §13 risk lives
   here). Grab the live URL.
3. Update root `PORTFOLIO_PLAN.md` Phase-2 table: mark **B1 Resonance ✅ Done** with the
   repo + live URL.
4. Capture a signature analysis screenshot (mood word + spectrum) for the portfolio hub.
5. Move to **B2 Conveyor** — and consider wiring Resonance's inference as a Conveyor
   queue worker (the Phase-2 throughline).

---

*End of plan. Hand off to the builder model. Follow §11 build order — prove the engine
on a live Vercel deploy at step 1. Protect both feelings from §0: "there's a real engine
here" and "this is calm." That pairing is what makes Resonance not a generic AI demo.*
