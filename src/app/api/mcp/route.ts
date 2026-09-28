import { NextRequest, NextResponse } from "next/server";
import { KNOWN_MCP_TOOLS } from "@/features/ai/services/mcp-provider";

export async function GET() {
  return NextResponse.json({
    status: "online",
    name: "AI Video Studio MCP Bridge",
    tools: KNOWN_MCP_TOOLS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, toolName, arguments: toolArgs } = body;

    if (action === "list_tools") {
      return NextResponse.json({ tools: KNOWN_MCP_TOOLS });
    }

    return NextResponse.json({
      status: "success",
      tool: toolName,
      executed: true,
      data: { message: `Tool ${toolName} processed with MCP bridge.` },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
