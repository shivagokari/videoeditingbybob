import { ProjectSession, ExportSettings } from "@/lib/schemas/project.schema";
import { MediaItem } from "@/lib/schemas/media.schema";
import { CanvasCompositor } from "@/features/preview/engines/canvas-compositor";

export interface RenderProgress {
  currentFrame: number;
  totalFrames: number;
  percent: number;
  etaSeconds: number;
  isRendering: boolean;
  status: string;
}

export class BrowserRenderEngine {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async renderVideo({
    project,
    mediaItems,
    settings,
    onProgress,
  }: {
    project: ProjectSession;
    mediaItems: MediaItem[];
    settings: ExportSettings;
    onProgress: (progress: RenderProgress) => void;
  }): Promise<Blob> {
    this.isCancelled = false;

    // Create offscreen canvas for rendering at full export resolution
    const canvas = document.createElement("canvas");
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not initialize 2D rendering context.");

    const compositor = new CanvasCompositor();
    const fps = parseInt(settings.fps, 10) || 30;
    const duration = project.duration || 10;
    const totalFrames = Math.max(1, Math.floor(duration * fps));
    const frameInterval = 1 / fps;

    // Supported MIME types
    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }
    if (settings.codec === "h264" && MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
      mimeType = "video/mp4;codecs=avc1";
    }

    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: (settings.bitrateMbps || 12) * 1_000_000,
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.start();

    const startTime = performance.now();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        mediaRecorder.stop();
        compositor.cleanup();
        throw new Error("Rendering cancelled by user.");
      }

      const currentTime = frame * frameInterval;

      // Render frame
      compositor.renderFrame({
        canvas,
        ctx,
        project,
        mediaItems,
        currentTime,
        aspectRatioWidth: settings.width,
        aspectRatioHeight: settings.height,
      });

      // Update progress
      const percent = Math.min(99, Math.round(((frame + 1) / totalFrames) * 100));
      const elapsed = (performance.now() - startTime) / 1000;
      const rate = (frame + 1) / Math.max(0.1, elapsed);
      const remainingFrames = totalFrames - (frame + 1);
      const etaSeconds = Math.round(remainingFrames / Math.max(1, rate));

      onProgress({
        currentFrame: frame + 1,
        totalFrames,
        percent,
        etaSeconds,
        isRendering: true,
        status: `Rendering frame ${frame + 1} of ${totalFrames} (${percent}%)`,
      });

      // Allow UI thread to breathe
      await new Promise((r) => setTimeout(r, 8));
    }

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        compositor.cleanup();
        const blob = new Blob(chunks, { type: mimeType });
        onProgress({
          currentFrame: totalFrames,
          totalFrames,
          percent: 100,
          etaSeconds: 0,
          isRendering: false,
          status: "Rendering complete!",
        });
        resolve(blob);
      };

      mediaRecorder.onerror = (event) => {
        compositor.cleanup();
        reject(new Error("MediaRecorder error during export"));
      };

      mediaRecorder.stop();
    });
  }
}
