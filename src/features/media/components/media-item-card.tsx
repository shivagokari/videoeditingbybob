"use client";

import React from "react";
import { MediaItem } from "@/lib/schemas/media.schema";
import { formatDuration, formatFileSize } from "@/lib/utils/format";
import { Video, Music, Image as ImageIcon, FileText, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/lib/state/use-project-store";
import { Clip } from "@/lib/schemas/project.schema";
import { COLOR_PRESETS } from "@/lib/utils/color-filters";

interface MediaItemCardProps {
  item: MediaItem;
}

export function MediaItemCard({ item }: MediaItemCardProps) {
  const { removeMediaItem, addClip, project, setReferenceMedia } = useProjectStore();

  const handleAddToTimeline = () => {
    // Determine target track
    let trackId = "track_video_1";
    if (item.type === "audio") trackId = "track_audio_1";
    else if (item.type === "image") trackId = "track_overlay";
    else if (item.type === "subtitle") trackId = "track_text";

    // Find the end of the last clip on that track
    const trackClips = project.clips.filter((c) => c.trackId === trackId);
    const lastEnd = trackClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
    const duration = item.duration > 0 ? item.duration : 5;

    const newClip: Clip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      trackId,
      mediaId: item.id,
      name: item.name,
      type: item.type === "audio" ? "audio" : item.type === "image" ? "overlay" : "video",
      start: lastEnd,
      duration,
      trimStart: 0,
      trimEnd: duration,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
      colorGrade: { ...COLOR_PRESETS.natural },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
    };

    addClip(newClip);
  };

  const getIcon = () => {
    switch (item.type) {
      case "video":
        return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case "audio":
        return <Music className="w-3.5 h-3.5 text-emerald-400" />;
      case "image":
        return <ImageIcon className="w-3.5 h-3.5 text-amber-400" />;
      case "subtitle":
        return <FileText className="w-3.5 h-3.5 text-violet-400" />;
      case "reference_video":
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="group relative rounded-lg border border-studio-800 bg-studio-900/80 hover:border-studio-700 hover:bg-studio-850 p-2 transition-all flex flex-col gap-2">
      {/* Thumbnail or placeholder */}
      <div className="relative aspect-video w-full rounded overflow-hidden bg-studio-950 flex items-center justify-center">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-studio-500">
            {getIcon()}
            <span className="text-[10px] uppercase font-mono">{item.type}</span>
          </div>
        )}

        {/* Duration badge */}
        {item.duration > 0 && (
          <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
            {formatDuration(item.duration)}
          </span>
        )}

        {/* Hover overlay quick actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[1px]">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToTimeline}
            className="h-7 text-xs px-2"
            title="Insert onto Timeline"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
          {item.type === "video" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReferenceMedia(item)}
              className="h-7 text-xs px-2 bg-studio-800 border-studio-700"
              title="Use as Style Reference"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeMediaItem(item.id)}
            className="h-7 w-7 text-studio-400 hover:text-rose-400 hover:bg-rose-500/10"
            title="Remove from session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="text-xs font-medium text-studio-200 truncate" title={item.name}>
            {item.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-studio-400 font-mono mt-0.5">
          <span>{formatFileSize(item.size)}</span>
          {item.width && item.height && (
            <span>
              {item.width}×{item.height}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
