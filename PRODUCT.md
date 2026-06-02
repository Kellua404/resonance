# Resonance — Product Definition

> The "why and for whom." `PLAN.md` is the "how." When a build decision isn't
> covered by the plan, decide in favor of these principles.
>
> Portfolio Project **B1** — the first *backend* project. Read alongside
> `PLAN.md` and the Phase-2 section of the root `PORTFOLIO_PLAN.md`.

## One-liner

**Resonance reads the emotion in your words — on its own server, with a real
transformer model, no AI API — and paints a calm, living interface from what it
finds.**

## What it actually is

A single-page app with a real backend. You paste text (a journal entry, a message,
lyrics, a paragraph). A **server-side transformer model** (running inside a Vercel
serverless function via `transformers.js` — *not* a call to OpenAI/Anthropic/any paid
API) classifies the emotional content: an overall **emotional spectrum** (ranked
emotions with confidence scores) and a per-sentence **emotional arc** across the text.
The frontend renders that as a slow, breathing visualization and derives a **vibe**
(a color palette + a mood word + a free music-search link) from the dominant emotions.

A precise **instrument readout** shows the proof that the backend is real and fast:
model id, tokens processed, sentences analyzed, and inference latency in milliseconds.

> This is the rebirth of the author's university AI thesis (MELAI: emotion analysis →
> personalized playlists), rebuilt as a portfolio-grade web product.

## Who it's for

- **Recruiters / engineers** evaluating the portfolio — Resonance is proof of
  **backend + applied-ML** skill: running real inference server-side, with no rented
  API, deployed on Vercel. The telemetry exists to make that legible at a glance.
- **Curious visitors** who'll stay because watching their own words bloom into a
  calm emotional spectrum is quietly mesmerizing.
- **Writers / the introspective** who get a small, genuine readout of the feeling in
  a piece of text.

## The job it does

> "Show me the emotional shape of this writing — instantly, beautifully, and in a way
> that makes it obvious there's a real engine behind it, not a toy."

## Brand & personality

- **Mood:** a calm reading instrument / an emotional seismograph. Quiet, warm,
  unhurried, a little clinical in its precision but humane in its color.
- **Voice:** gentle and exact. Labels read like the readout of a sensitive instrument
  ("LATENCY", "TOKENS", "SPECTRUM"), copy is spare and literary.
- **Visual signature:** warm deep-ink chrome that gets **tinted by the dominant
  emotion** (the UI accent is computed from the result — joy warms it gold, sadness
  cools it blue). A breathing emotional spectrum as the hero. Hairline mono telemetry.
- **Type signature:** **Fraunces** (display/body — a soft, optical, *emotional* serif;
  human and warm, the opposite of clinical) + **Geist Mono** (instrument telemetry —
  modern, technical, and a quiet nod to the Vercel deploy). Deliberately different from
  Aurora's Instrument Serif + IBM Plex Mono.
- **Anti-brand:** NOT a generic "AI sentiment analyzer" SaaS. No Inter/Roboto, no
  purple-gradient hero, no "Powered by OpenAI" badge, no chat bubble, no spinner that
  hides a black box. The engine is *shown*, not hidden.

## Design principles (in priority order)

1. **The backend is the substance; the interface is its mirror.** Every visible thing
   exists to make the inference engine *felt* — its speed, its richness, its honesty.
2. **Show the engine, don't hide it.** Telemetry (latency, tokens, model, scores) is a
   first-class design element, not debug output. We never fake a result.
3. **Calm over flashy.** Slow breathing motion, generous space, warm dark. The result
   should feel like it *settles* into view, not pops. (Contrast Creeper's maximalism.)
4. **Honest, not magical.** No paid API, no hidden cloud — the model runs on *our*
   server and we say so. The "no API key" fact is a feature we surface.
5. **Genuinely useful output.** The vibe (palette + mood + music link) and the
   shareable **emotion-fingerprint card** must be real, good, and shippable.
6. **Fast and inclusive.** Warm cold-start handled gracefully, AA accessible,
   reduced-motion respected, works without WebGL/JS-heavy tricks.

## Success looks like

- A visitor pastes a paragraph, watches it bloom into a spectrum + arc in well under a
  second (warm), and thinks *"wait — this is running a real model server-side, for
  free?"* That reaction is the North Star.
- The telemetry makes a reviewing engineer immediately trust there's real backend work
  here, not an API wrapper.
- Someone exports their emotion-fingerprint card or copies a permalink because the
  output is good enough to keep.

## Explicit non-goals (v1)

Accounts, history/saved analyses, multi-language emotion models, fine-tuning, a real
Spotify integration (we link to a free search, we don't auth), streaming token-by-token
generation, any paid API. Several live in `PLAN.md` §15 as stretch goals. Keep v1 small
and perfect.
