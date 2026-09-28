"use client";

import React, { useRef, useState } from "react";
import { Clip } from "@/lib/schemas/project.schema";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { snapToFrame } from "@/lib/utils/timecode";
import { Zap, Sparkles, Palette } from "lucide-react";

interface ClipItemProps {
  clip: Clip;
  zoom: number; // px per second
  onContextMenu?: (e: React.MouseEvent, clip: Clip) => void;
}

export const ClipItem = React.memo(function ClipItem({ clip, zoom, onContextMenu }: ClipItemProps) {
  const { selectedClipId, setSelectedClipId, snappingEnabled } = useEditorStore();
  const { updateClip, project, mediaItems } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isTrimmingLeft, setIsTrimmingLeft] = useState(false);
  const [isTrimmingRight, setIsTrimmingRight] = useState(false);

  const startXRef = useRef<number>(0);
  const initialStartRef = useRef<number>(0);
  const initialDurationRef = useRef<number>(0);
  const initialTrimStartRef = useRef<number>(0);

  const isSelected = selectedClipId === clip.id;
  const leftPx = clip.start * zoom;
  const widthPx = Math.max(16, clip.duration * zoom);

  const media = mediaItems.find((m) => m.id === clip.mediaId);

  // Compute snap points (start and end of other clips)
  const getSnapPoints = () => {
    if (!snappingEnabled) return [];
    const points: number[] = [0];
    for (const c of project.clips) {
      if (c.id !== clip.id) {
        points.push(c.start);
        points.push(c.start + c.duration);
      }
    }
    return points;
  };

  const snapValue = (val: number, thresholdPx = 10): number => {
    if (!snappingEnabled) return snapToFrame(val, project.fps);
    const snapThresholdSec = thresholdPx / zoom;
    const points = getSnapPoints();
    for (const p of points) {
      if (Math.abs(val - p) <= snapThresholdSec) {
        return p;
      }
    }
    return snapToFrame(val, project.fps);
  };

  // Drag Clip Reposition Handler
  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary click only
    e.stopPropagation();
    setSelectedClipId(clip.id);

    setIsDragging(true);
    startXRef.current = e.clientX;
    initialStartRef.current = clip.start;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaSec = deltaX / zoom;
      const rawNewStart = Math.max(0, initialStartRef.current + deltaSec);
      const snappedStart = snapValue(rawNewStart);
      updateClip(clip.id, { start: snappedStart });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Left Trim Handle (Trim In / Trim Start)
  const handleTrimLeftStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrimmingLeft(true);
    startXRef.current = e.clientX;
    initialStartRef.current = clip.start;
    initialDurationRef.current = clip.duration;
    initialTrimStartRef.current = clip.trimStart;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaSec = deltaX / zoom;

      let newStart = initialStartRef.current + deltaSec;
      newStart = snapValue(newStart);

      const maxStart = initialStartRef.current + initialDurationRef.current - 0.2;
      const safeStart = Math.max(0, Math.min(maxStart, newStart));
      const actualDelta = safeStart - initialStartRef.current;

      const newDuration = Math.max(0.2, initialDurationRef.current - actualDelta);
      const newTrimStart = Math.max(0, initialTrimStartRef.current + actualDelta * (clip.speed || 1));

      updateClip(clip.id, {
        start: safeStart,
        duration: newDuration,
        trimStart: newTrimStart,
      });
    };

    const onMouseUp = () => {
      setIsTrimmingLeft(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Right Trim Handle (Trim Out / Duration)
  const handleTrimRightStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTrimmingRight(true);
    startXRef.current = e.clientX;
    initialDurationRef.current = clip.duration;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaSec = deltaX / zoom;
      const rawDuration = Math.max(0.2, initialDurationRef.current + deltaSec);
      const rawEnd = clip.start + rawDuration;
      const snappedEnd = snapValue(rawEnd);
      const newDuration = Math.max(0.2, snappedEnd - clip.start);

      updateClip(clip.id, { duration: newDuration });
    };

    const onMouseUp = () => {
      setIsTrimmingRight(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const getTrackTheme = () => {
    switch (clip.type) {
      case "video":
        return "bg-blue-600/90 border-blue-400 text-white shadow-blue-500/20";
      case "audio":
      case "music":
        return "bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/20";
      case "caption":
        return "bg-amber-600/90 border-amber-400 text-white shadow-amber-500/20";
      case "overlay":
      default:
        return "bg-violet-600/90 border-violet-400 text-white shadow-violet-500/20";
    }
  };

  return (
    <div
      onMouseDown={handleDragStart}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedClipId(clip.id);
        onContextMenu?.(e, clip);
      }}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
      }}
      className={`absolute top-1 bottom-1 rounded-md border select-none cursor-grab active:cursor-grabbing flex items-center justify-between overflow-hidden shadow-sm transition-[box-shadow,border-color] ${getTrackTheme()} ${
        isSelected ? "ring-2 ring-white border-white z-10 shadow-lg" : "hover:brightness-110"
      }`}
    >
      {/* Filmstrip Repeating Thumbnails for Video Clips (Reference 3 & 4) */}
      {clip.type === "video" && media?.thumbnailUrl && (
        <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none flex">
          {Array.from({ length: Math.ceil(widthPx / 56) }).map((_, idx) => (
            <img
              key={idx}
              src={media.thumbnailUrl}
              alt=""
              className="h-full w-[56px] object-cover border-r border-black/30 shrink-0"
            />
          ))}
        </div>
      )}

      {/* Audio Waveform Graphic Background for Audio Clips */}
      {(clip.type === "audio" || clip.type === "music") && (
        <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none flex items-center px-1">
          <div className="w-full h-4 flex items-center justify-around">
            {Array.from({ length: Math.min(50, Math.ceil(widthPx / 6)) }).map((_, idx) => (
              <span
                key={idx}
                style={{ height: `${30 + (Math.sin(idx * 0.9) * 35 + 30)}%` }}
                className="w-1 bg-white rounded-full inline-block"
              />
            ))}
          </div>
        </div>
      )}

      {/* Left Trim Handle */}
      <div
        onMouseDown={handleTrimLeftStart}
        className="w-2.5 h-full bg-white/20 hover:bg-white/60 cursor-ew-resize shrink-0 transition-colors z-10"
        title="Trim Start"
      />

      {/* Clip Content & Badges */}
      <div className="flex-1 px-1.5 flex items-center gap-1.5 min-w-0 overflow-hidden text-xs z-10">
        <span className="font-semibold truncate text-[11px] drop-shadow-md">
          {clip.name}
        </span>

        {/* Speed Badge */}
        {clip.speed && clip.speed !== 1 && (
          <span className="px-1 py-0.2 rounded bg-black/60 text-[9px] font-mono flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5 text-yellow-300" />
            {clip.speed.toFixed(2)}x
          </span>
        )}

        {/* Color grade badge */}
        {clip.colorGrade && clip.colorGrade.preset !== "natural" && (
          <span className="px-1 py-0.2 rounded bg-black/60 text-[9px] font-mono flex items-center gap-0.5">
            <Palette className="w-2.5 h-2.5 text-rose-300" />
          </span>
        )}

        {/* Transition Badge */}
        {(clip.transitionIn || clip.transitionOut) && (
          <span className="px-1 py-0.2 rounded bg-black/60 text-[9px] font-mono flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
          </span>
        )}
      </div>

      {/* Right Trim Handle */}
      <div
        onMouseDown={handleTrimRightStart}
        className="w-2.5 h-full bg-white/20 hover:bg-white/60 cursor-ew-resize shrink-0 transition-colors z-10"
        title="Trim End"
      />
    </div>
  );
});
