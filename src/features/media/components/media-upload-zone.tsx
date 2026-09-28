"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Film, Loader2 } from "lucide-react";
import { extractMediaMetadata } from "../services/media-metadata-extractor";
import { useProjectStore } from "@/lib/state/use-project-store";
import { COLOR_PRESETS } from "@/lib/utils/color-filters";

interface MediaUploadZoneProps {
  isReferenceMode?: boolean;
  onSuccess?: () => void;
}

export function MediaUploadZone({ isReferenceMode = false, onSuccess }: MediaUploadZoneProps) {
  const { addMediaItem, setReferenceMedia, addClip, project } = useProjectStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const media = await extractMediaMetadata(file, isReferenceMode);
        if (isReferenceMode) {
          setReferenceMedia(media);
        } else {
          addMediaItem(media);

          // If timeline is empty, automatically add first video or media onto the timeline!
          const currentProject = useProjectStore.getState().project;
          if (currentProject.clips.length === 0 && (media.type === "video" || media.type === "audio" || media.type === "image")) {
            const trackId = media.type === "audio" ? "track_audio_1" : "track_video_1";
            const duration = media.duration > 0 ? media.duration : 10;
            addClip({
              id: `clip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              trackId,
              mediaId: media.id,
              name: media.name,
              type: media.type === "audio" ? "audio" : "video",
              start: 0,
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
            });
          }
        }
      }
      onSuccess?.();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none ${
        isDragging
          ? "border-accent-blue bg-accent-blue/10 scale-[1.01]"
          : "border-studio-700/80 bg-studio-900/50 hover:bg-studio-900 hover:border-studio-600"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={!isReferenceMode}
        accept={
          isReferenceMode
            ? "video/*"
            : "video/*,audio/*,image/*,.srt,.vtt,.txt"
        }
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="w-10 h-10 rounded-full bg-studio-800 border border-studio-700 flex items-center justify-center text-studio-300">
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin text-accent-blue" />
        ) : isReferenceMode ? (
          <Film className="w-5 h-5 text-amber-400" />
        ) : (
          <UploadCloud className="w-5 h-5 text-accent-blue" />
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-white">
          {isProcessing
            ? "Analyzing Media Metadata..."
            : isReferenceMode
            ? "Upload Reference Video"
            : "Drop Videos, Audio, Images or Subtitles"}
        </span>
        <span className="text-[11px] text-studio-400">
          {isReferenceMode
            ? "MP4, MOV, WebM to extract pacing, color & caption style"
            : "MP4, MOV, WebM, MP3, WAV, PNG, JPG, SRT"}
        </span>
      </div>
    </div>
  );
}
