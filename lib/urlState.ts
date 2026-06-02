// lib/urlState.ts — permalink encode/decode (PLAN §7.5)
//
// Encode the analyzed TEXT (UTF-8 → base64url, length-guarded) into the URL hash so a
// permalink RE-RUNS the analysis on load — the model is deterministic, so the same text
// yields the same result. If the text is too long for a tidy URL we skip the permalink
// rather than produce an ugly mega-link (a result-summary fallback is a stretch goal).

const HASH_KEY = "t"; // #t=<base64url>
const MAX_ENCODED = 6000; // guardrail: keep links sane

// UTF-8 safe base64url (handles emoji, accents — btoa alone does not).
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Build a shareable absolute URL for the given text. Returns null if too long to encode.
export function buildShareUrl(text: string): string | null {
  if (typeof window === "undefined") return null;
  const encoded = toBase64Url(text.trim());
  if (!encoded || encoded.length > MAX_ENCODED) return null;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${HASH_KEY}=${encoded}`;
}

// Read the text encoded in the current URL hash, if any.
export function readShareUrl(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const params = new URLSearchParams(hash);
  const enc = params.get(HASH_KEY);
  if (!enc) return null;
  try {
    return fromBase64Url(enc);
  } catch {
    return null;
  }
}

// Push the share hash into the address bar without reloading (used after analyze).
export function writeShareHash(text: string) {
  if (typeof window === "undefined") return;
  const encoded = toBase64Url(text.trim());
  if (!encoded || encoded.length > MAX_ENCODED) return;
  const url = `${window.location.pathname}#${HASH_KEY}=${encoded}`;
  window.history.replaceState(null, "", url);
}
