import { CaptionSegment, WordTiming } from "../schemas/edit-plan.schema";

/**
 * Parses timestamp string HH:MM:SS,mmm or HH:MM:SS.mmm to seconds
 */
export function parseSrtTimestamp(ts: string): number {
  const normalized = ts.trim().replace(",", ".");
  const parts = normalized.split(":");
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Formats seconds to SRT timestamp HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z: number = 2) => String(n).padStart(z, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Formats seconds to VTT timestamp HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(",", ".");
}

/**
 * Parses SRT or WebVTT string into structured CaptionSegment array
 */
export function parseSrtOrVtt(content: string): CaptionSegment[] {
  const cleanContent = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const blocks = cleanContent.split(/\n\n+/);
  const segments: CaptionSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Check for WEBVTT header
    if (lines[0].toUpperCase().includes("WEBVTT")) {
      continue;
    }

    // Identify timestamp line
    let timeIndex = 0;
    if (!lines[0].includes("-->") && lines[1] && lines[1].includes("-->")) {
      timeIndex = 1;
    }

    const timeLine = lines[timeIndex];
    if (!timeLine || !timeLine.includes("-->")) continue;

    const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim().split(" ")[0]);
    const start = parseSrtTimestamp(startRaw);
    const end = parseSrtTimestamp(endRaw);

    if (isNaN(start) || isNaN(end) || end <= start) continue;

    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join(" ").replace(/<[^>]*>/g, "").trim();

    if (!text) continue;

    // Generate word-level approximate timings if useful for karaoke
    const wordsRaw = text.split(/\s+/).filter(Boolean);
    const wordDuration = (end - start) / Math.max(1, wordsRaw.length);
    const words: WordTiming[] = wordsRaw.map((w, i) => ({
      word: w,
      start: Number((start + i * wordDuration).toFixed(2)),
      end: Number((start + (i + 1) * wordDuration).toFixed(2)),
    }));

    segments.push({
      id: `caption_${segments.length + 1}`,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      text,
      words,
    });
  }

  return segments;
}

/**
 * Generates an SRT formatted string from CaptionSegments
 */
export function exportToSrt(segments: CaptionSegment[]): string {
  return segments
    .map((seg, idx) => {
      const index = idx + 1;
      const start = formatSrtTimestamp(seg.start);
      const end = formatSrtTimestamp(seg.end);
      return `${index}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
}

/**
 * Generates a WebVTT formatted string from CaptionSegments
 */
export function exportToVtt(segments: CaptionSegment[]): string {
  const body = segments
    .map((seg) => {
      const start = formatVttTimestamp(seg.start);
      const end = formatVttTimestamp(seg.end);
      return `${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}
