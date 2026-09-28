import { NextRequest, NextResponse } from "next/server";
import { generateFFmpegArguments } from "@/features/export/engines/server-ffmpeg-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project, mediaItems, exportSettings } = body;

    if (!project || !exportSettings) {
      return NextResponse.json({ error: "Missing project or export settings." }, { status: 400 });
    }

    const ffmpegResult = generateFFmpegArguments(project, mediaItems || [], exportSettings);

    return NextResponse.json({
      success: true,
      ffmpeg: ffmpegResult,
      message: "FFmpeg pipeline generated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
