import { Clip, ProjectSession } from "@/lib/schemas/project.schema";
import { MediaItem } from "@/lib/schemas/media.schema";
import { applyCanvasGrading, buildCssFilter } from "@/lib/utils/color-filters";

export class CanvasCompositor {
  private videoCache = new Map<string, HTMLVideoElement>();
  private imageCache = new Map<string, HTMLImageElement>();

  public getOrCreateVideo(media: MediaItem): HTMLVideoElement {
    if (this.videoCache.has(media.id)) {
      return this.videoCache.get(media.id)!;
    }
    const video = document.createElement("video");
    video.src = media.url;
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    this.videoCache.set(media.id, video);
    return video;
  }

  public getOrCreateImage(media: MediaItem): HTMLImageElement {
    if (this.imageCache.has(media.id)) {
      return this.imageCache.get(media.id)!;
    }
    const img = new Image();
    img.src = media.url;
    img.crossOrigin = "anonymous";
    this.imageCache.set(media.id, img);
    return img;
  }

  public renderFrame({
    canvas,
    ctx,
    project,
    mediaItems,
    currentTime,
    aspectRatioWidth,
    aspectRatioHeight,
    isPlaying = false,
    playbackRate = 1,
  }: {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    project: ProjectSession;
    mediaItems: MediaItem[];
    currentTime: number;
    aspectRatioWidth: number;
    aspectRatioHeight: number;
    isPlaying?: boolean;
    playbackRate?: number;
  }) {
    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background (adaptive dark/light)
    ctx.fillStyle = "#0c0e12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate composition bounding box inside canvas
    const canvasRatio = canvas.width / canvas.height;
    const targetRatio = aspectRatioWidth / aspectRatioHeight;

    let compW = canvas.width;
    let compH = canvas.height;
    let compX = 0;
    let compY = 0;

    if (canvasRatio > targetRatio) {
      compH = canvas.height;
      compW = compH * targetRatio;
      compX = (canvas.width - compW) / 2;
    } else {
      compW = canvas.width;
      compH = compW / targetRatio;
      compY = (canvas.height - compH) / 2;
    }

    // Clip to project viewport
    ctx.beginPath();
    ctx.rect(compX, compY, compW, compH);
    ctx.clip();

    // Solid stage background
    ctx.fillStyle = "#000000";
    ctx.fillRect(compX, compY, compW, compH);

    // Sort active clips by track order (ascending so bottom tracks draw first, top tracks draw over)
    const activeClips = project.clips.filter((clip) => {
      const track = project.tracks.find((t) => t.id === clip.trackId);
      if (track?.hidden) return false;
      return currentTime >= clip.start && currentTime < clip.start + clip.duration;
    });

    // Pause any cached videos not currently playing in active clips
    const activeMediaIds = new Set(activeClips.map((c) => c.mediaId));
    this.videoCache.forEach((vid, id) => {
      if (!activeMediaIds.has(id) || !isPlaying) {
        if (!vid.paused) {
          vid.pause();
        }
      }
    });

    // Sort by track order reversed (e.g. video track order 2, overlay order 1, caption order 0)
    activeClips.sort((a, b) => {
      const trackA = project.tracks.find((t) => t.id === a.trackId)?.order ?? 99;
      const trackB = project.tracks.find((t) => t.id === b.trackId)?.order ?? 99;
      return trackB - trackA; // higher order draws first (backgrounds), lower order draws on top
    });

    // Render each active clip
    for (const clip of activeClips) {
      const media = mediaItems.find((m) => m.id === clip.mediaId);
      const clipElapsed = currentTime - clip.start;
      const sourceTime = clip.trimStart + clipElapsed * (clip.speed || 1);

      ctx.save();

      // Opacity & Transitions
      let opacity = clip.opacity ?? 1;

      // Handle transitions
      if (clip.transitionIn && clipElapsed < clip.transitionIn.duration) {
        const progress = clipElapsed / clip.transitionIn.duration;
        if (clip.transitionIn.type === "fade" || clip.transitionIn.type === "dissolve") {
          opacity *= progress;
        }
      }
      if (clip.transitionOut && clip.duration - clipElapsed < clip.transitionOut.duration) {
        const remaining = clip.duration - clipElapsed;
        const progress = remaining / clip.transitionOut.duration;
        if (clip.transitionOut.type === "fade" || clip.transitionOut.type === "dissolve") {
          opacity *= progress;
        }
      }

      ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

      // Draw Video or Image
      if (clip.type === "video" || clip.type === "broll" || (clip.type === "overlay" && media?.type === "video")) {
        if (media) {
          const video = this.getOrCreateVideo(media);

          if (isPlaying) {
            // Native butter-smooth playback: set playback rate and play once
            const targetRate = Math.max(0.1, (clip.speed || 1) * playbackRate);
            if (video.playbackRate !== targetRate) {
              video.playbackRate = targetRate;
            }

            if (video.paused) {
              if (!video.seeking) {
                video.currentTime = sourceTime;
              }
              video.play().catch(() => {});
            } else {
              // Only resync if not currently seeking and drift exceeds 0.35s
              if (!video.seeking && Math.abs(video.currentTime - sourceTime) > 0.35) {
                video.currentTime = sourceTime;
              }
            }
          } else {
            // Paused / Scrubbing mode
            if (!video.paused) {
              video.pause();
            }
            if (!video.seeking && Math.abs(video.currentTime - sourceTime) > 0.04) {
              video.currentTime = sourceTime;
            }
          }

          // Render video frame fitted into comp area
          this.drawFittedMedia(ctx, video, compX, compY, compW, compH, clip);

          // Vignette, temperature wash, and Grain
          if (clip.colorGrade) {
            applyCanvasGrading(ctx, canvas.width, canvas.height, clip.colorGrade, {
              x: compX,
              y: compY,
              w: compW,
              h: compH,
            });
          }
        }
      } else if (clip.type === "overlay" && media?.type === "image") {
        if (media) {
          const img = this.getOrCreateImage(media);
          this.drawFittedMedia(ctx, img, compX, compY, compW, compH, clip);
        }
      } else if (clip.type === "caption" || clip.textPayload) {
        // Draw Text / Caption
        this.renderTextOrCaption(ctx, clip, compX, compY, compW, compH, currentTime);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private drawFittedMedia(
    ctx: CanvasRenderingContext2D,
    element: HTMLVideoElement | HTMLImageElement,
    compX: number,
    compY: number,
    compW: number,
    compH: number,
    clip: Clip
  ) {
    const elWidth = element instanceof HTMLVideoElement ? element.videoWidth || 1920 : element.naturalWidth || 1080;
    const elHeight = element instanceof HTMLVideoElement ? element.videoHeight || 1080 : element.naturalHeight || 1080;

    if (elWidth === 0 || elHeight === 0) return;

    // Cover scale mode
    const scale = Math.max(compW / elWidth, compH / elHeight) * (clip.transform?.scale || 1);
    const drawW = elWidth * scale;
    const drawH = elHeight * scale;

    const offsetX = (compW - drawW) / 2 + (clip.transform?.x || 0);
    const offsetY = (compH - drawH) / 2 + (clip.transform?.y || 0);

    ctx.save();
    ctx.translate(compX + compW / 2 + offsetX, compY + compH / 2 + offsetY);

    if (clip.transform?.rotation) {
      ctx.rotate((clip.transform.rotation * Math.PI) / 180);
    }
    if (clip.transform?.flipX || clip.transform?.flipY) {
      ctx.scale(clip.transform.flipX ? -1 : 1, clip.transform.flipY ? -1 : 1);
    }

    // Apply color grade CSS filter directly before drawImage
    if (clip.colorGrade) {
      ctx.filter = buildCssFilter(clip.colorGrade);
    } else {
      ctx.filter = "none";
    }

    try {
      ctx.drawImage(element, -drawW / 2, -drawH / 2, drawW, drawH);
    } catch {
      // Element might not be ready
    }

    ctx.filter = "none";
    ctx.restore();
  }

  private renderTextOrCaption(
    ctx: CanvasRenderingContext2D,
    clip: Clip,
    compX: number,
    compY: number,
    compW: number,
    compH: number,
    currentTime: number
  ) {
    const payload = clip.textPayload;
    if (!payload || !payload.text) return;

    const fontSize = (payload.fontSize || 38) * (compW / 1080); // responsive scale
    const fontFamily = payload.fontFamily || "Inter";
    const fontWeight = payload.fontWeight || "800";

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
    ctx.textAlign = (payload.textAlign as CanvasTextAlign) || "center";
    ctx.textBaseline = "middle";

    const posX = compX + compW / 2 + (clip.transform?.x || 0);
    // Y position based on vertical offset
    const yPercent = (clip.transform?.y || 25) / 100;
    const posY = compY + compH * 0.5 + compH * yPercent;

    // Background pill if configured
    if (payload.backgroundColor) {
      const metrics = ctx.measureText(payload.text);
      const padX = fontSize * 0.4;
      const padY = fontSize * 0.3;
      ctx.fillStyle = payload.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(
        posX - metrics.width / 2 - padX,
        posY - fontSize / 2 - padY,
        metrics.width + padX * 2,
        fontSize + padY * 2,
        8
      );
      ctx.fill();
    }

    // Stroke
    if (payload.strokeWidth && payload.strokeWidth > 0) {
      ctx.strokeStyle = payload.strokeColor || "#000000";
      ctx.lineWidth = payload.strokeWidth * (compW / 1080);
      ctx.lineJoin = "round";
      ctx.strokeText(payload.text, posX, posY);
    }

    // Fill
    ctx.fillStyle = payload.color || "#ffffff";
    ctx.fillText(payload.text, posX, posY);
  }

  public cleanup() {
    this.videoCache.forEach((v) => {
      v.pause();
      v.src = "";
    });
    this.videoCache.clear();
    this.imageCache.clear();
  }
}
