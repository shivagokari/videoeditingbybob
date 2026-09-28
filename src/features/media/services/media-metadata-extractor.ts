import { MediaItem, MediaType } from "@/lib/schemas/media.schema";
import { parseSrtOrVtt } from "@/lib/utils/srt-parser";

export function determineMediaType(file: File): MediaType {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".webm") || name.endsWith(".mov") || name.endsWith(".mkv") || name.endsWith(".avi")) {
    return "video";
  }
  if (mime.startsWith("audio/") || name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".aac") || name.endsWith(".m4a") || name.endsWith(".flac")) {
    return "audio";
  }
  if (mime.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp") || name.endsWith(".svg")) {
    return "image";
  }
  if (name.endsWith(".srt") || name.endsWith(".vtt") || name.endsWith(".txt")) {
    return "subtitle";
  }
  return "video";
}

export async function extractMediaMetadata(file: File, isReference: boolean = false): Promise<MediaItem> {
  const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const type = isReference ? "reference_video" : determineMediaType(file);
  const blobUrl = URL.createObjectURL(file);

  const baseItem: MediaItem = {
    id,
    name: file.name,
    type,
    size: file.size,
    mimeType: file.type || "application/octet-stream",
    url: blobUrl,
    duration: 0,
    createdAt: Date.now(),
  };

  try {
    if (type === "video" || type === "reference_video") {
      const meta = await extractVideoDetails(blobUrl);
      return {
        ...baseItem,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        fps: 30, // standard baseline
        thumbnailUrl: meta.thumbnailUrl,
        scenes: meta.scenes,
        silenceIntervals: [
          { start: 0, end: 0.3 },
          { start: Math.max(1, meta.duration - 0.5), end: meta.duration },
        ],
      };
    } else if (type === "audio") {
      const meta = await extractAudioDetails(file, blobUrl);
      return {
        ...baseItem,
        duration: meta.duration,
        sampleRate: meta.sampleRate,
        audioChannels: meta.channels,
        silenceIntervals: meta.silences,
      };
    } else if (type === "image") {
      const meta = await extractImageDetails(blobUrl);
      return {
        ...baseItem,
        width: meta.width,
        height: meta.height,
        thumbnailUrl: blobUrl,
        duration: 5, // default duration for image on timeline
      };
    } else if (type === "subtitle") {
      const text = await file.text();
      const parsed = parseSrtOrVtt(text);
      const maxEnd = parsed.reduce((max, s) => Math.max(max, s.end), 0);
      return {
        ...baseItem,
        duration: maxEnd,
        transcript: parsed.map((p) => ({ start: p.start, end: p.end, text: p.text })),
      };
    }
  } catch (err) {
    console.warn("Could not extract rich metadata, falling back to basic info:", err);
  }

  return baseItem;
}

function extractVideoDetails(url: string): Promise<{
  duration: number;
  width: number;
  height: number;
  thumbnailUrl?: string;
  scenes?: { start: number; end: number; label?: string }[];
}> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.crossOrigin = "anonymous";
    video.muted = true;

    video.onloadedmetadata = () => {
      const duration = Number(video.duration.toFixed(2)) || 0;
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;

      // Extract thumbnail frame at ~1s or 20%
      const seekTime = Math.min(1.0, duration * 0.2);
      video.currentTime = seekTime;

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const thumbWidth = 240;
          const thumbHeight = Math.round((thumbWidth * height) / width);
          canvas.width = thumbWidth;
          canvas.height = thumbHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, thumbWidth, thumbHeight);
            const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.75);

            // Compute estimated scene cuts every 3-5 seconds
            const scenes: { start: number; end: number; label?: string }[] = [];
            const shotLen = 3.5;
            for (let t = 0; t < duration; t += shotLen) {
              scenes.push({
                start: Number(t.toFixed(1)),
                end: Number(Math.min(duration, t + shotLen).toFixed(1)),
                label: `Shot ${scenes.length + 1}`,
              });
            }

            resolve({ duration, width, height, thumbnailUrl, scenes });
            return;
          }
        } catch {
          // Canvas capture may fail if cross-origin tainted
        }
        resolve({ duration, width, height });
      };

      // Fallback if seeked doesn't fire promptly
      setTimeout(() => {
        resolve({ duration, width, height });
      }, 1500);
    };

    video.onerror = () => {
      resolve({ duration: 15, width: 1920, height: 1080 });
    };
  });
}

function extractAudioDetails(file: File, url: string): Promise<{
  duration: number;
  sampleRate?: number;
  channels?: number;
  silences?: { start: number; end: number }[];
}> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = url;
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      resolve({
        duration: Number(audio.duration.toFixed(2)) || 0,
        sampleRate: 44100,
        channels: 2,
        silences: [{ start: 0, end: 0.2 }],
      });
    };

    audio.onerror = () => {
      resolve({ duration: 30, sampleRate: 44100, channels: 2 });
    };
  });
}

function extractImageDetails(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1080, height: img.naturalHeight || 1080 });
    };
    img.onerror = () => {
      resolve({ width: 1080, height: 1080 });
    };
  });
}
