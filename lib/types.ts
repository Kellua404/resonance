// lib/types.ts — the inference contract (PLAN §7.1)
// This is the typed boundary between the server-side transformer and the client UI.
// Every field here is real model output or honest telemetry — never decoration.

export type EmotionScore = { label: string; score: number }; // score in 0..1

export type ArcPoint = { text: string; label: string; score: number };

export type Telemetry = {
  model: string; // the Hub id of the model actually running
  tokens: number | null; // real token count from the tokenizer
  sentences: number; // sentences analyzed for the arc
  latencyMs: number; // measured inference latency
  backend: string; // e.g. "server · onnx · no-api"
  coldStart?: boolean; // true when this request paid the model load cost
};

export type AnalysisResult = {
  spectrum: EmotionScore[]; // sorted desc, all labels
  dominant: string;
  arc: ArcPoint[];
  telemetry: Telemetry;
};

export type AnalysisError = { error: string };
