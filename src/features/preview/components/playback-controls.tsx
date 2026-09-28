"use client";

import React from "react";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { formatTimecode, formatSecondsShort } from "@/lib/utils/timecode";
import {
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Maximize2,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaybackControlsProps {
  onToggleFullscreen?: () => void;
}

export function PlaybackControls({ onToggleFullscreen }: PlaybackControlsProps) {
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlayPause,
    playbackRate,
    setPlaybackRate,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    stepFrame,
  } = useEditorStore();

  const { project } = useProjectStore();
  const fps = project.fps || 30;

  const handleRewind = () => {
    setCurrentTime(0);
  };

  const speedOptions = [0.5, 1, 1.5, 2];

  return (
    <div className="h-11 px-4 bg-studio-950/95 border-t border-studio-800 flex items-center justify-between text-xs select-none">
      {/* Left: Timecode */}
      <div className="flex items-center gap-2 font-mono">
        <span className="text-white font-bold tracking-wider text-xs">
          {formatTimecode(currentTime, fps, true)}
        </span>
        <span className="text-studio-500">/</span>
        <span className="text-studio-400">
          {formatTimecode(project.duration, fps, false)}
        </span>
      </div>

      {/* Center: Playhead Controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRewind}
          title="Rewind to start"
          className="h-7 w-7 text-studio-400 hover:text-white"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => stepFrame(-1, fps)}
          title="Step 1 frame backward (Left Arrow)"
          className="h-7 w-7 text-studio-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="primary"
          size="icon"
          onClick={togglePlayPause}
          title="Play / Pause (Space)"
          className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
        >
          {isPlaying ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => stepFrame(1, fps)}
          title="Step 1 frame forward (Right Arrow)"
          className="h-7 w-7 text-studio-400 hover:text-white"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: Audio Volume, Speed, Fullscreen */}
      <div className="flex items-center gap-3">
        {/* Speed button cycle */}
        <button
          onClick={() => {
            const nextIdx = (speedOptions.indexOf(playbackRate) + 1) % speedOptions.length;
            setPlaybackRate(speedOptions[nextIdx]);
          }}
          className="flex items-center gap-1 text-[11px] font-mono font-medium text-studio-400 hover:text-white bg-studio-900 border border-studio-800 hover:border-studio-700 px-2 py-0.5 rounded transition-colors"
          title="Playback speed"
        >
          <Gauge className="w-3 h-3 text-accent-blue" />
          <span>{playbackRate}x</span>
        </button>

        {/* Volume Mute & Slider */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-studio-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-studio-300" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-16 h-1 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            title="Preview volume"
          />
        </div>

        {/* Fullscreen */}
        {onToggleFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            title="Toggle fullscreen"
            className="h-7 w-7 text-studio-400 hover:text-white"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
