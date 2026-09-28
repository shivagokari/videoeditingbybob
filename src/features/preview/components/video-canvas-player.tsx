"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { CanvasCompositor } from "../engines/canvas-compositor";
import { WebAudioEngine } from "../engines/web-audio-engine";
import { SafeZonesOverlay } from "./safe-zones-overlay";
import { PlaybackControls } from "./playback-controls";
import { AspectRatioSelector } from "./aspect-ratio-selector";
import { Play } from "lucide-react";
import { COLOR_PRESETS } from "@/lib/utils/color-filters";

export function VideoCanvasPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const compositorRef = useRef<CanvasCompositor | null>(null);
  const audioEngineRef = useRef<WebAudioEngine | null>(null);

  const { project, mediaItems, addMediaItem, addClip } = useProjectStore();
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    playbackRate,
    volume,
    isMuted,
    safeZonesEnabled,
  } = useEditorStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  // Initialize engines once
  useEffect(() => {
    compositorRef.current = new CanvasCompositor();
    audioEngineRef.current = new WebAudioEngine();
    audioEngineRef.current.init();

    return () => {
      compositorRef.current?.cleanup();
      audioEngineRef.current?.cleanup();
    };
  }, []);

  // Sync audio engine state
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.syncPlayback({
        isPlaying,
        currentTime,
        project,
        mediaItems,
        volume,
        isMuted,
      });
    }
  }, [isPlaying, currentTime, project, mediaItems, volume, isMuted]);

  // Main render pass function
  const renderCurrent = useCallback(
    (customTime?: number, customIsPlaying?: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas || !compositorRef.current) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const t = customTime !== undefined ? customTime : currentTimeRef.current;
      const playing = customIsPlaying !== undefined ? customIsPlaying : isPlaying;

      compositorRef.current.renderFrame({
        canvas,
        ctx,
        project,
        mediaItems,
        currentTime: t,
        aspectRatioWidth: project.width,
        aspectRatioHeight: project.height,
        isPlaying: playing,
        playbackRate,
      });
    },
    [project, mediaItems, isPlaying, playbackRate]
  );

  // Redraw when currentTime or project updates
  useEffect(() => {
    renderCurrent(currentTime, isPlaying);
  }, [renderCurrent, currentTime, isPlaying]);

  // Continuous, butter-smooth 60fps playback animation loop
  useEffect(() => {
    if (!isPlaying) {
      renderCurrent(currentTimeRef.current, false);
      return;
    }

    let lastTime = performance.now();
    let lastZustandSync = performance.now();
    let animationId: number;
    let localTime = currentTimeRef.current;

    const loop = (now: number) => {
      const deltaSec = ((now - lastTime) / 1000) * playbackRate;
      lastTime = now;

      localTime += deltaSec;
      currentTimeRef.current = localTime;

      if (localTime >= project.duration) {
        setCurrentTime(0);
        currentTimeRef.current = 0;
        setIsPlaying(false);
        renderCurrent(0, false);
        return;
      }

      // Throttle Zustand store sync to 20fps (every 50ms) to ensure butter-smooth 60fps playback without React UI churn
      if (now - lastZustandSync > 50) {
        lastZustandSync = now;
        setCurrentTime(localTime);
      }

      renderCurrent(localTime, true);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationId);
      // Final sync on stop
      setCurrentTime(currentTimeRef.current);
    };
  }, [isPlaying, playbackRate, project.duration, setCurrentTime, setIsPlaying, renderCurrent]);

  // Handle Canvas resize according to container and target aspect ratio
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const targetRatio = project.width / project.height;
      const containerRatio = rect.width / rect.height;

      let drawW = rect.width;
      let drawH = rect.height;

      if (containerRatio > targetRatio) {
        drawH = rect.height;
        drawW = drawH * targetRatio;
      } else {
        drawW = rect.width;
        drawH = drawW / targetRatio;
      }

      // High DPI internal resolution
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(drawW * dpr);
      canvas.height = Math.round(drawH * dpr);
      canvas.style.width = `${Math.round(drawW)}px`;
      canvas.style.height = `${Math.round(drawH)}px`;

      renderCurrent();
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [project.width, project.height, renderCurrent]);

  // Keyboard shortcut for Play/Pause (Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === "KeyJ") {
        setCurrentTime(Math.max(0, currentTime - 1));
      } else if (e.code === "KeyK") {
        setIsPlaying(false);
      } else if (e.code === "KeyL") {
        setCurrentTime(Math.min(project.duration, currentTime + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, currentTime, project.duration, setCurrentTime, setIsPlaying]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleLoadDemoVideo = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Create a local video generator / sample clip
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.5, "#4338ca");
      grad.addColorStop(1, "#0369a1");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("AI Studio Sample Video", 540, 960);
    }
    const thumbUrl = canvas.toDataURL("image/jpeg", 0.85);

    const demoMedia = {
      id: `media_demo_${Date.now()}`,
      name: "Sample Creator Reel.mp4",
      type: "video" as const,
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnailUrl: thumbUrl,
      size: 15420000,
      mimeType: "video/mp4",
      duration: 15,
      width: 1080,
      height: 1920,
      fps: 30,
      createdAt: Date.now(),
    };

    addMediaItem(demoMedia);
    addClip({
      id: `clip_${Date.now()}`,
      trackId: "track_video_1",
      mediaId: demoMedia.id,
      name: demoMedia.name,
      type: "video",
      start: 0,
      duration: 15,
      trimStart: 0,
      trimEnd: 15,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
      colorGrade: { ...COLOR_PRESETS.natural },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
    });
    setIsPlaying(true);
  };

  const handlePlayerClick = () => {
    if (project.clips.length === 0) {
      handleLoadDemoVideo();
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-studio-950 overflow-hidden relative">
      {/* Top Bar above player */}
      <div className="h-10 px-4 border-b border-studio-800 bg-studio-900 flex items-center justify-between z-10 shrink-0">
        <span className="text-xs font-semibold text-slate-800 dark:text-studio-300">
          Preview Monitor • {project.width}×{project.height}
        </span>
        <AspectRatioSelector />
      </div>

      {/* Main Canvas Stage */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center p-3 overflow-hidden bg-studio-950 cursor-pointer"
        onClick={handlePlayerClick}
      >
        <canvas
          ref={canvasRef}
          className="shadow-2xl rounded-md border border-studio-800 max-h-full max-w-full object-contain"
        />

        {/* Empty timeline state: prompt user cleanly */}
        {project.clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-[2px]">
            <div className="p-6 rounded-2xl bg-studio-900 border border-studio-800 shadow-2xl flex flex-col items-center gap-3 text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Timeline is Empty</h4>
                <p className="text-xs text-studio-400 mt-1">
                  Upload or drop videos into the Media Bin, or click below to load a sample video track and start editing!
                </p>
              </div>
              <button
                onClick={handleLoadDemoVideo}
                className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-blue-600 text-white font-medium text-xs shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                + Load Sample Video Track
              </button>
            </div>
          </div>
        )}

        {/* Safe Zones Overlay */}
        {safeZonesEnabled && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: canvasRef.current?.style.width || "100%",
              height: canvasRef.current?.style.height || "100%",
            }}
          >
            <SafeZonesOverlay aspectRatio={project.aspectRatio} />
          </div>
        )}

        {/* Big play button watermark if paused and at start */}
        {!isPlaying && currentTime === 0 && project.clips.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-xl animate-pulse">
              <Play className="w-6 h-6 fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Playback Controls */}
      <PlaybackControls onToggleFullscreen={toggleFullscreen} />
    </div>
  );
}
