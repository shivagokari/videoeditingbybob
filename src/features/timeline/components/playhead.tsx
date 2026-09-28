"use client";

import React, { useRef, useState } from "react";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { snapToFrame } from "@/lib/utils/timecode";

interface PlayheadProps {
  zoom: number; // px per second
  timelineWidth: number;
}

export function Playhead({ zoom, timelineWidth }: PlayheadProps) {
  const { currentTime, setCurrentTime, snappingEnabled } = useEditorStore();
  const { project } = useProjectStore();
  const [isScrubbing, setIsScrubbing] = useState(false);

  const startXRef = useRef<number>(0);
  const initialTimeRef = useRef<number>(0);

  const leftPx = currentTime * zoom;

  const handleScrubStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsScrubbing(true);
    startXRef.current = e.clientX;
    initialTimeRef.current = currentTime;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaSec = deltaX / zoom;
      const rawTime = Math.max(0, Math.min(project.duration, initialTimeRef.current + deltaSec));
      const snapped = snapToFrame(rawTime, project.fps);
      setCurrentTime(snapped);
    };

    const onMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      style={{ left: `${leftPx}px` }}
      className="absolute top-0 bottom-0 z-30 pointer-events-none -translate-x-1/2"
    >
      {/* Draggable Playhead Scrubber Thumb */}
      <div
        onMouseDown={handleScrubStart}
        className="pointer-events-auto cursor-ew-resize -translate-y-1 w-3.5 h-4.5 bg-rose-500 rounded-b shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <div className="w-0.5 h-2 bg-white/80 rounded-full" />
      </div>

      {/* Vertical Red Laser Line */}
      <div className="w-0.5 h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
    </div>
  );
}
