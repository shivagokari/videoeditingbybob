import { NextRequest, NextResponse } from "next/server";
import { AIProviderFactory } from "@/features/ai/services/ai-provider-factory";
import { AIProviderConfig } from "@/features/ai/services/ai-provider.types";
import { validateEditPlan } from "@/lib/timeline/edit-plan-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedback, currentPlan, currentProject, conversationHistory, mediaItems, providerConfig } = body;

    if (!feedback || !currentPlan) {
      return NextResponse.json({ error: "Missing feedback or current plan." }, { status: 400 });
    }

    const config: AIProviderConfig = providerConfig || { provider: "smart_heuristic" };
    const provider = AIProviderFactory.getProvider(config);

    const result = await provider.refineEditPlan({
      feedback,
      currentPlan,
      currentProject,
      conversationHistory: conversationHistory || [],
      mediaItems: mediaItems || [],
    });

    const validation = validateEditPlan(result.plan);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Refined plan failed schema validation.", details: validation.errors },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: validation.plan,
      explanation: result.explanation,
      modifiedCount: result.modifiedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to refine edit plan." },
      { status: 500 }
    );
  }
}
