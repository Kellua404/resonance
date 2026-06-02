// app/api/analyze/warm/route.ts — warm-up route (PLAN §4.4)
//
// The client fires this on first paint so the model loads while the user is still
// typing. Turns the one real weakness (cold start) into on-brand "the engine is
// spinning up" theater instead of a surprise delay on the first analyze.
import { NextResponse } from "next/server";
import { getEmotionPipeline, MODEL_ID, isLoaded } from "@/lib/inference/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const alreadyLoaded = isLoaded();
  try {
    await getEmotionPipeline();
    return NextResponse.json({
      ready: true,
      model: MODEL_ID,
      wasWarm: alreadyLoaded,
    });
  } catch (err) {
    console.error("[warm] pipeline load failed:", err);
    return NextResponse.json(
      { ready: false, error: "warm-up failed" },
      { status: 503 },
    );
  }
}
