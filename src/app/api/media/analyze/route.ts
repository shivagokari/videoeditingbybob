import { NextRequest, NextResponse } from "next/server";
import { AIProviderFactory } from "@/features/ai/services/ai-provider-factory";
import { MediaItem } from "@/lib/schemas/media.schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { referenceMedia, providerConfig } = body;

    if (!referenceMedia) {
      return NextResponse.json({ error: "No reference media provided." }, { status: 400 });
    }

    const provider = AIProviderFactory.getProvider(providerConfig || { provider: "smart_heuristic" });
    const profile = await provider.analyzeReference({ referenceMedia });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to analyze reference." }, { status: 500 });
  }
}
