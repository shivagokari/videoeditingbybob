import { NextRequest, NextResponse } from "next/server";
import { AIProviderFactory } from "@/features/ai/services/ai-provider-factory";
import { AIProviderConfig } from "@/features/ai/services/ai-provider.types";

export async function POST(req: NextRequest) {
  try {
    const body: AIProviderConfig = await req.json();
    const provider = AIProviderFactory.getProvider(body);
    const result = await provider.testConnection();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to test connection." },
      { status: 500 }
    );
  }
}
