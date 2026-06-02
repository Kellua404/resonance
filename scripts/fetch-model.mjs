// scripts/fetch-model.mjs — vendor the model into ./models (PLAN §4.2)
//
// Downloads the exact files Transformers.js needs into the localModelPath layout
//   models/<MODEL_ID>/{config.json, tokenizer*.json, vocab.json, merges.txt}
//   models/<MODEL_ID>/onnx/model_quantized.onnx
// so production cold-starts never wait on a network download.
//
// Idempotent + robust (runs on every `npm run build`):
//   • SKIP a file when a complete local copy already exists — so returning to the
//     project / rebuilding locally never re-downloads the ~120MB model.
//   • DOWNLOAD only what's MISSING. Missing files are fetched with a plain GET (we do
//     NOT gate this on a HEAD request — HuggingFace's HEAD doesn't reliably return
//     Content-Length for every file, so gating downloads on it would wrongly fail a
//     fresh clone, e.g. on Vercel).
//   • REFETCH an existing file only when it's provably INCOMPLETE — either below a
//     known size floor (catches a truncated/corrupt weight file even offline) or a
//     size mismatch against the remote when that size is knowable.
//   • A GET failure (network down, missing on a fresh clone) errors loudly, because a
//     missing model file means the build cannot trace a working model into the function.
//
// Run:  node scripts/fetch-model.mjs   (also runs automatically via the "build" script)
import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

const MODEL_ID = process.env.MODEL_ID ?? "SamLowe/roberta-base-go_emotions-onnx";
const REVISION = process.env.MODEL_REVISION ?? "main";

// dtype:'q8' loads onnx/model_quantized.onnx — that's the only weight file we need.
// minBytes = a cheap, network-free floor below which a local copy is treated as corrupt.
const FILES = [
  { rel: "config.json", minBytes: 100 },
  { rel: "tokenizer.json", minBytes: 1_000 },
  { rel: "tokenizer_config.json", minBytes: 100 },
  { rel: "special_tokens_map.json", minBytes: 10 },
  { rel: "vocab.json", minBytes: 1_000 },
  { rel: "merges.txt", minBytes: 1_000 },
  { rel: "onnx/model_quantized.onnx", minBytes: 100_000_000 }, // ~120MB; floor at 100MB
];

const base = `https://huggingface.co/${MODEL_ID}/resolve/${REVISION}`;
const outRoot = join(process.cwd(), "models", MODEL_ID);

// Local file size in bytes, or -1 if it doesn't exist.
async function localSize(p) {
  try {
    return (await stat(p)).size;
  } catch {
    return -1;
  }
}

// Remote size via HEAD, or null if it can't be determined (HF omits it for some files,
// or we're offline). Only used to VERIFY an existing file — never to gate a download.
async function remoteSize(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!res.ok) return null;
    const len =
      res.headers.get("content-length") ?? res.headers.get("x-linked-size");
    return len ? Number(len) : null;
  } catch {
    return null;
  }
}

async function download(url, out, rel) {
  process.stdout.write(`  ↓ fetching   ${rel} ... `);
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buf);
  console.log(`${(buf.length / 1024 / 1024).toFixed(2)} MB`);
}

async function ensureFile({ rel, minBytes = 1 }) {
  const url = `${base}/${rel}`;
  const out = join(outRoot, rel);
  const have = await localSize(out);

  // Missing, or below the corruption floor → (re)download. download() throws if the
  // remote can't be reached, which correctly fails a build that has no working model.
  if (have < minBytes) {
    if (have >= 0) {
      console.log(`  ↻ incomplete ${rel} (${have}B < ${minBytes}B floor) — refetching`);
    }
    await download(url, out, rel);
    return true;
  }

  // A plausibly-complete local copy exists. If we can learn the remote size, use it to
  // catch a stale/partial copy; if HF doesn't tell us, trust the local copy (keeps
  // offline rebuilds working).
  const want = await remoteSize(url);
  if (want !== null && have !== want) {
    console.log(`  ↻ stale      ${rel} (have ${have}B, want ${want}B) — refetching`);
    await download(url, out, rel);
    return true;
  }

  console.log(`  ✓ cached     ${rel}`);
  return false;
}

console.log(`Vendoring ${MODEL_ID}@${REVISION} → models/${MODEL_ID}/`);
let fetched = 0;
for (const f of FILES) {
  if (await ensureFile(f)) fetched++;
}
console.log(
  fetched === 0
    ? "Model already present — nothing to download."
    : `Done — ${fetched} file(s) fetched.`,
);
