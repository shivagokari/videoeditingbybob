"use client";

import React from "react";
import { Track } from "@/lib/schemas/project.schema";
import { useProjectStore } from "@/lib/state/use-project-store";
import { Lock, Unlock, Eye, EyeOff, Volume2, VolumeX, Video, Music, Type, Sparkles } from "lucide-react";

interface TrackHeaderProps {
  track: Track;
}

export function TrackHeader({ track }: TrackHeaderProps) {
  const { updateTrack } = useProjectStore();

  const getTrackIcon = () => {
    switch (track.type) {
      case "video":
        return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case "audio":
      case "music":
      case "sfx":
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case "caption":
      case "text":
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="h-14 w-44 bg-studio-950 border-r border-b border-studio-800/80 px-2.5 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-2 min-w-0">
        <div className="shrink-0">{getTrackIcon()}</div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-studio-200 truncate">
            {track.name}
          </span>
          <span className="text-[10px] text-studio-500 font-mono uppercase">
            {track.type}
          </span>
        </div>
      </div>

      {/* Track Quick Controls */}
      <div className="flex items-center gap-1">
        {/* Mute button */}
        {(track.type === "audio" || track.type === "video" || track.type === "music") && (
          <button
            onClick={() => updateTrack(track.id, { muted: !track.muted })}
            className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
              track.muted
                ? "bg-rose-600/30 text-rose-400 border border-rose-500/40"
                : "text-studio-500 hover:text-studio-200"
            }`}
            title={track.muted ? "Unmute track" : "Mute track"}
          >
            M
          </button>
        )}

        {/* Hide / Visibility toggle */}
        <button
          onClick={() => updateTrack(track.id, { hidden: !track.hidden })}
          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
            track.hidden
              ? "text-rose-400"
              : "text-studio-500 hover:text-studio-200"
          }`}
          title={track.hidden ? "Show track" : "Hide track from preview"}
        >
          {track.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Lock toggle */}
        <button
          onClick={() => updateTrack(track.id, { locked: !track.locked })}
          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
            track.locked
              ? "text-amber-400"
              : "text-studio-500 hover:text-studio-200"
          }`}
          title={track.locked ? "Unlock track" : "Lock track"}
        >
          {track.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
