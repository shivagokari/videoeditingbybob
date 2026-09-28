import { NextRequest, NextResponse } from "next/server";
import { AIProviderFactory } from "@/features/ai/services/ai-provider-factory";
import { AIProviderConfig } from "@/features/ai/services/ai-provider.types";
import { validateEditPlan } from "@/lib/timeline/edit-plan-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, mediaItems, styleProfile, currentProject, providerConfig } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing or invalid prompt." }, { status: 400 });
    }

    const config: AIProviderConfig = providerConfig || { provider: "smart_heuristic" };
    const provider = AIProviderFactory.getProvider(config);

    const result = await provider.generateEditPlan({
      prompt,
      mediaItems: mediaItems || [],
      styleProfile,
      currentProject,
    });

    // Enforce runtime schema validation
    const validation = validateEditPlan(result.plan);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "AI generated an invalid plan schema.", details: validation.errors },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: validation.plan,
      explanation: result.explanation,
      stats: result.stats,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate edit plan." },
      { status: 500 }
    );
  }
}
