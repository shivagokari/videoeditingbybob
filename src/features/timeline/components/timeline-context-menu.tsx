"use client";

import React, { useEffect, useRef } from "react";
import { Clip } from "@/lib/schemas/project.schema";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { COLOR_PRESETS } from "@/lib/utils/color-filters";
import { ColorPreset } from "@/lib/schemas/edit-plan.schema";
import { autoCutSilencesAndGaps } from "@/features/media/services/auto-silence-cutter";
import {
  Scissors,
  Copy,
  Trash2,
  ArrowLeftRight,
  Gauge,
  Palette,
  Volume2,
  VolumeX,
  Sparkles,
  Type,
  Maximize2,
  Check,
} from "lucide-react";

export interface ContextMenuPosition {
  x: number;
  y: number;
  clip?: Clip | null;
  trackId?: string | null;
  time?: number | null;
}

interface TimelineContextMenuProps {
  menu: ContextMenuPosition | null;
  onClose: () => void;
}

export function TimelineContextMenu({ menu, onClose }: TimelineContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { project, mediaItems, splitClip, removeClip, rippleDeleteClip, duplicateClip, updateClip, addClip } =
    useProjectStore();
  const { currentTime, setSelectedClipId, setActiveTab } = useEditorStore();

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!menu) return null;

  const clip = menu.clip;

  // Split action
  const handleSplit = () => {
    if (clip) {
      splitClip(clip.id, currentTime);
    } else {
      const under = project.clips.find((c) => currentTime > c.start && currentTime < c.start + c.duration);
      if (under) splitClip(under.id, currentTime);
    }
    onClose();
  };

  // Duplicate
  const handleDuplicate = () => {
    if (clip) duplicateClip(clip.id);
    onClose();
  };

  // Delete
  const handleDelete = () => {
    if (clip) removeClip(clip.id);
    onClose();
  };

  // Ripple Delete
  const handleRippleDelete = () => {
    if (clip) rippleDeleteClip(clip.id);
    onClose();
  };

  // Speed Change
  const handleSpeed = (speed: number) => {
    if (clip) {
      updateClip(clip.id, { speed });
    }
    onClose();
  };

  // Color Grade Preset
  const handleColorPreset = (preset: ColorPreset) => {
    if (clip && COLOR_PRESETS[preset]) {
      updateClip(clip.id, { colorGrade: { ...COLOR_PRESETS[preset] } });
    }
    onClose();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (clip) {
      updateClip(clip.id, { muted: !clip.muted });
    }
    onClose();
  };

  // Add Text at Playhead
  const handleAddText = () => {
    const textClip: Clip = {
      id: `clip_text_${Date.now()}`,
      trackId: "track_text",
      mediaId: "media_text_dynamic",
      name: "Dynamic Title",
      type: "caption",
      start: currentTime,
      duration: 3.5,
      trimStart: 0,
      trimEnd: 3.5,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 15, scale: 1, rotation: 0, flipX: false, flipY: false },
      textPayload: {
        text: "Your Text Here",
        fontFamily: "Inter",
        fontSize: 42,
        fontWeight: "800",
        color: "#facc15",
        backgroundColor: "rgba(0,0,0,0.6)",
        strokeColor: "#000000",
        strokeWidth: 3,
        textAlign: "center",
        animation: "pop",
      },
      colorGrade: { ...COLOR_PRESETS.natural },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
    };
    addClip(textClip);
    setSelectedClipId(textClip.id);
    onClose();
  };

  // Auto Silence AI Cut
  const handleAutoSilenceCut = async () => {
    onClose();
    const result = await autoCutSilencesAndGaps(project, mediaItems);
    useProjectStore.setState((state) => ({
      project: {
        ...state.project,
        clips: result.updatedClips,
      },
    }));
  };

  // Calculate position constrained within window bounds
  const posX = Math.min(menu.x, window.innerWidth - 240);
  const posY = Math.min(menu.y, window.innerHeight - 360);

  return (
    <div
      ref={menuRef}
      style={{ left: `${posX}px`, top: `${posY}px` }}
      className="fixed z-50 w-56 rounded-xl border border-studio-700 bg-studio-900/95 backdrop-blur-md shadow-2xl p-1.5 text-xs text-slate-800 dark:text-studio-100 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      {clip ? (
        <>
          {/* Header with Clip Name */}
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-studio-400 border-b border-studio-800 truncate">
            {clip.name}
          </div>

          {/* Split at playhead */}
          <button
            onClick={handleSplit}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-studio-800 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-accent-blue" />
              Split at Playhead
            </span>
            <span className="text-[10px] text-studio-500 font-mono">S</span>
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-studio-800 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              Duplicate Clip
            </span>
            <span className="text-[10px] text-studio-500 font-mono">Ctrl+D</span>
          </button>

          {/* Ripple Delete */}
          <button
            onClick={handleRippleDelete}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-studio-800 hover:text-amber-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
              Ripple Delete
            </span>
            <span className="text-[10px] text-studio-500 font-mono">Shift+Del</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Delete Clip
            </span>
            <span className="text-[10px] text-studio-500 font-mono">Del</span>
          </button>

          <div className="h-px bg-studio-800 my-1" />

          {/* Speed submenu row */}
          <div className="px-2.5 py-1 text-[10px] font-semibold text-studio-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-indigo-400" />
            Playback Speed
          </div>
          <div className="grid grid-cols-4 gap-1 px-1.5 pb-1">
            {[0.5, 1.0, 1.25, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeed(s)}
                className={`py-1 rounded text-center text-[10px] font-mono transition-colors ${
                  (clip.speed || 1) === s
                    ? "bg-accent-blue text-white font-bold"
                    : "bg-studio-800/80 hover:bg-studio-700 text-studio-300"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Color Grade Presets row */}
          <div className="px-2.5 py-1 text-[10px] font-semibold text-studio-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-rose-400" />
            Color Looks
          </div>
          <div className="grid grid-cols-3 gap-1 px-1.5 pb-1">
            {(
              [
                "natural",
                "cinematic_warm",
                "cyberpunk",
                "moody_teal_orange",
                "vintage_film",
                "noir",
              ] as ColorPreset[]
            ).map((p) => (
              <button
                key={p}
                onClick={() => handleColorPreset(p)}
                className={`py-1 px-1 rounded text-center text-[9px] capitalize truncate transition-colors ${
                  clip.colorGrade?.preset === p
                    ? "bg-rose-600 text-white font-bold"
                    : "bg-studio-800/80 hover:bg-studio-700 text-studio-300"
                }`}
              >
                {p === "moody_teal_orange"
                  ? "Teal/Orange"
                  : p === "cinematic_warm"
                  ? "Cinematic"
                  : p === "vintage_film"
                  ? "Vintage"
                  : p}
              </button>
            ))}
          </div>

          <div className="h-px bg-studio-800 my-1" />

          {/* Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-studio-800 hover:text-white transition-colors"
          >
            {clip.muted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                Unmute Audio
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Mute Audio
              </>
            )}
          </button>

          {/* AI Auto Silence Trim */}
          <button
            onClick={handleAutoSilenceCut}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/25 transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI Auto-Cut Silence
          </button>
        </>
      ) : (
        /* Empty Track Context Menu */
        <>
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-studio-400 border-b border-studio-800">
            Timeline Actions
          </div>

          <button
            onClick={handleAddText}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-studio-800 hover:text-white transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            Add Text at Playhead
          </button>

          <button
            onClick={handleSplit}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-studio-800 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-accent-blue" />
              Split Under Playhead
            </span>
            <span className="text-[10px] text-studio-500 font-mono">S</span>
          </button>

          <button
            onClick={handleAutoSilenceCut}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/25 transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI Auto-Cut All Silences
          </button>
        </>
      )}
    </div>
  );
}
