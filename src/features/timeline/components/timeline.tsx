"use client";

import React, { useRef } from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { TimelineToolbar } from "./timeline-toolbar";
import { TrackHeader } from "./track-header";
import { ClipItem } from "./clip-item";
import { Playhead } from "./playhead";
import { formatSecondsShort } from "@/lib/utils/timecode";

export function Timeline() {
  const { project } = useProjectStore();
  const { zoom, setCurrentTime, setSelectedClipId } = useEditorStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const duration = Math.max(10, project.duration);
  const timelineWidth = Math.max(800, duration * zoom);

  // Time ruler ticks every 1 second, labels every 5 seconds
  const ticks: { time: number; label?: string }[] = [];
  const step = zoom >= 60 ? 1 : zoom >= 30 ? 2 : 5;
  for (let t = 0; t <= duration; t += step) {
    ticks.push({
      time: t,
      label: t % (step * 2) === 0 ? formatSecondsShort(t) : undefined,
    });
  }

  // Handle clicking on ruler or track lane to seek
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
    const newTime = Math.max(0, Math.min(duration, clickX / zoom));
    setCurrentTime(newTime);
  };

  return (
    <div className="flex flex-col h-64 bg-studio-950 border-t border-studio-800 text-white select-none shrink-0 overflow-hidden">
      {/* Top Toolbar */}
      <TimelineToolbar />

      {/* Main Timeline Workspace (Tracks on left, Lanes on right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Track Headers Column */}
        <div className="w-44 flex flex-col shrink-0 border-r border-studio-800 bg-studio-950 z-20 shadow-md">
          {/* Empty corner aligned with time ruler */}
          <div className="h-7 border-b border-studio-800 bg-studio-950/80 px-2 flex items-center justify-between text-[10px] text-studio-400 font-mono">
            <span>TRACKS</span>
            <span>TYPE</span>
          </div>

          {/* List of track headers */}
          <div className="flex-1 overflow-y-hidden">
            {project.tracks.map((track) => (
              <TrackHeader key={track.id} track={track} />
            ))}
          </div>
        </div>

        {/* Right: Scrollable Timeline Lanes & Playhead */}
        <div
          ref={scrollContainerRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedClipId(null);
            }
          }}
          className="flex-1 overflow-x-auto overflow-y-auto relative scrollbar-thin scrollbar-thumb-studio-700 bg-studio-950"
        >
          <div
            style={{ width: `${timelineWidth}px` }}
            className="min-h-full relative flex flex-col"
          >
            {/* Top Time Ruler */}
            <div
              onClick={handleRulerClick}
              className="h-7 border-b border-studio-800 bg-studio-900/60 sticky top-0 z-20 cursor-pointer relative"
            >
              {ticks.map((tick) => (
                <div
                  key={tick.time}
                  style={{ left: `${tick.time * zoom}px` }}
                  className="absolute top-0 bottom-0 flex flex-col items-start border-l border-studio-700/60 pl-1"
                >
                  {tick.label && (
                    <span className="text-[10px] font-mono text-studio-400 tracking-tight select-none">
                      {tick.label}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Track Lanes */}
            <div className="flex-1 flex flex-col relative">
              {project.tracks.map((track) => {
                const trackClips = project.clips.filter((c) => c.trackId === track.id);
                return (
                  <div
                    key={track.id}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        handleRulerClick(e);
                        setSelectedClipId(null);
                      }
                    }}
                    className="h-14 border-b border-studio-900 bg-studio-950/40 relative hover:bg-studio-900/20 transition-colors"
                  >
                    {trackClips.map((clip) => (
                      <ClipItem key={clip.id} clip={clip} zoom={zoom} />
                    ))}
                  </div>
                );
              })}

              {/* Laser Playhead */}
              <Playhead zoom={zoom} timelineWidth={timelineWidth} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
