import { ProjectSession, ExportSettings } from "@/lib/schemas/project.schema";
import { MediaItem } from "@/lib/schemas/media.schema";

export interface FFmpegCommandResult {
  command: string;
  arguments: string[];
  filterGraph: string;
  outputFilename: string;
}

/**
 * Translates ProjectSession and EditPlan into validated FFmpeg filtergraph arguments.
 * Strictly sanitizes inputs to prevent command injection.
 */
export function generateFFmpegArguments(
  project: ProjectSession,
  mediaItems: MediaItem[],
  settings: ExportSettings
): FFmpegCommandResult {
  const args: string[] = ["-y"];
  const inputMap = new Map<string, number>();
  let inputCount = 0;

  // 1. Gather all unique media files
  for (const clip of project.clips) {
    if (clip.mediaId && !inputMap.has(clip.mediaId)) {
      const media = mediaItems.find((m) => m.id === clip.mediaId);
      if (media) {
        inputMap.set(clip.mediaId, inputCount++);
        // Pass sanitized filename/path
        args.push("-i", `"${media.name.replace(/["$`\\]/g, "")}"`);
      }
    }
  }

  const filterChains: string[] = [];
  const videoConcatParts: string[] = [];
  const audioConcatParts: string[] = [];

  const videoClips = project.clips.filter((c) => c.type === "video" || c.type === "broll");
  videoClips.sort((a, b) => a.start - b.start);

  videoClips.forEach((clip, index) => {
    const inputIdx = clip.mediaId ? inputMap.get(clip.mediaId) : undefined;
    if (inputIdx === undefined) return;

    const streamLabel = `v${index}`;
    const audioLabel = `a${index}`;

    // Video filters: trim, setpts, scale & pad to target resolution, colorgrade
    const trimFilter = `trim=start=${clip.trimStart}:duration=${clip.duration * (clip.speed || 1)},setpts=PTS-STARTPTS`;
    const speedFilter = clip.speed && clip.speed !== 1 ? `,setpts=${(1 / clip.speed).toFixed(4)}*PTS` : "";
    const scaleFilter = `,scale=${settings.width}:${settings.height}:force_original_aspect_ratio=decrease,pad=${settings.width}:${settings.height}:(ow-iw)/2:(oh-ih)/2`;

    let colorFilter = "";
    if (clip.colorGrade) {
      const g = clip.colorGrade;
      const brightness = (g.brightness / 100) * 0.5;
      const contrast = 1 + g.contrast / 100;
      const saturation = 1 + g.saturation / 100;
      colorFilter = `,eq=contrast=${contrast.toFixed(2)}:brightness=${brightness.toFixed(2)}:saturation=${saturation.toFixed(2)}`;
    }

    filterChains.push(
      `[${inputIdx}:v]${trimFilter}${speedFilter}${scaleFilter}${colorFilter}[${streamLabel}]`
    );
    videoConcatParts.push(`[${streamLabel}]`);

    // Audio filters: atrim, asetpts, volume
    const atrimFilter = `atrim=start=${clip.trimStart}:duration=${clip.duration * (clip.speed || 1)},asetpts=PTS-STARTPTS`;
    const volumeFilter = clip.volume !== undefined ? `,volume=${clip.volume.toFixed(2)}` : "";
    filterChains.push(`[${inputIdx}:a]${atrimFilter}${volumeFilter}[${audioLabel}]`);
    audioConcatParts.push(`[${audioLabel}]`);
  });

  // Concat all segments if multiple
  let finalVideoStream = "[0:v]";
  let finalAudioStream = "[0:a]";

  if (videoConcatParts.length > 0) {
    const concatVideoLabel = "[v_out]";
    const concatAudioLabel = "[a_out]";
    filterChains.push(
      `${videoConcatParts.join("")}concat=n=${videoConcatParts.length}:v=1:a=0${concatVideoLabel}`
    );
    filterChains.push(
      `${audioConcatParts.join("")}concat=n=${audioConcatParts.length}:v=0:a=1${concatAudioLabel}`
    );
    finalVideoStream = concatVideoLabel;
    finalAudioStream = concatAudioLabel;
  }

  const filterGraph = filterChains.join("; ");
  args.push("-filter_complex", `"${filterGraph}"`);
  args.push("-map", finalVideoStream);
  args.push("-map", finalAudioStream);

  // Output encoding parameters
  const fps = settings.fps || "30";
  args.push("-r", fps);

  if (settings.codec === "hevc") {
    args.push("-c:v", "libx265", "-tag:v", "hvc1");
  } else if (settings.codec === "webm_vp9") {
    args.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
  } else {
    // Default h.264
    args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium");
  }

  const bitrate = settings.bitrateMbps ? `${settings.bitrateMbps}M` : "12M";
  args.push("-b:v", bitrate);
  args.push("-c:a", "aac", "-b:a", `${settings.audioBitrateKbps || 192}k`);

  const outputFilename = `export_${Date.now()}.${settings.codec === "webm_vp9" ? "webm" : "mp4"}`;
  args.push(outputFilename);

  return {
    command: `ffmpeg ${args.join(" ")}`,
    arguments: args,
    filterGraph,
    outputFilename,
  };
}
