"use client";

import React, { useRef } from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { CaptionSegment } from "@/lib/schemas/edit-plan.schema";
import { parseSrtOrVtt, exportToSrt } from "@/lib/utils/srt-parser";
import { formatSecondsShort } from "@/lib/utils/timecode";
import { Type, Download, Upload, Plus, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Clip } from "@/lib/schemas/project.schema";

export function CaptionsEditorPanel() {
  const { project, updateClip, addClip, removeClip } = useProjectStore();
  const { currentTime, setCurrentTime, setSelectedClipId } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const captionTrack = project.tracks.find((t) => t.type === "caption");
  const captionClips = project.clips.filter((c) => c.trackId === captionTrack?.id);

  // Active or representative caption clip
  const activeCaptionClip = captionClips.find(
    (c) => currentTime >= c.start && currentTime <= c.start + c.duration
  ) || captionClips[0];

  const handleImportSrt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !captionTrack) return;
    const text = await file.text();
    const segments = parseSrtOrVtt(text);

    // Remove existing caption clips
    for (const c of captionClips) {
      removeClip(c.id);
    }

    // Add new caption clips
    segments.forEach((seg, idx) => {
      const newClip: Clip = {
        id: `caption_${idx + 1}_${Date.now()}`,
        trackId: captionTrack.id,
        name: `Caption ${idx + 1}`,
        type: "caption",
        start: seg.start,
        duration: Math.max(0.2, seg.end - seg.start),
        trimStart: 0,
        speed: 1,
        volume: 1,
        muted: false,
        opacity: 1,
        transform: { x: 0, y: 20, scale: 1, rotation: 0, flipX: false, flipY: false },
        colorGrade: { preset: "natural", exposure: 0, contrast: 0, brightness: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vignette: 0, grain: 0 },
        effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
        chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
        textPayload: {
          text: seg.text,
          fontFamily: "Inter",
          fontSize: 38,
          fontWeight: "800",
          color: "#ffffff",
          strokeColor: "#000000",
          strokeWidth: 4,
          textAlign: "center",
          animation: "pop",
        },
      };
      addClip(newClip);
    });
  };

  const handleExportSrt = () => {
    const segments: CaptionSegment[] = captionClips.map((c, i) => ({
      id: c.id,
      start: c.start,
      end: c.start + c.duration,
      text: c.textPayload?.text || "",
    }));
    const srtContent = exportToSrt(segments);
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "video"}_captions.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddCaption = () => {
    if (!captionTrack) return;
    const newClip: Clip = {
      id: `caption_${Date.now()}`,
      trackId: captionTrack.id,
      name: `Caption ${captionClips.length + 1}`,
      type: "caption",
      start: currentTime,
      duration: 2.5,
      trimStart: 0,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 20, scale: 1, rotation: 0, flipX: false, flipY: false },
      colorGrade: { preset: "natural", exposure: 0, contrast: 0, brightness: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vignette: 0, grain: 0 },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
      textPayload: {
        text: "New Caption Text",
        fontFamily: "Inter",
        fontSize: 38,
        fontWeight: "800",
        color: "#ffffff",
        strokeColor: "#000000",
        strokeWidth: 4,
        textAlign: "center",
        animation: "pop",
      },
    };
    addClip(newClip);
    setSelectedClipId(newClip.id);
  };

  const applyGlobalStyle = (textColor: string, strokeColor: string, isYellow: boolean = false) => {
    captionClips.forEach((c) => {
      if (c.textPayload) {
        updateClip(c.id, {
          textPayload: {
            ...c.textPayload,
            color: textColor,
            strokeColor: strokeColor,
            strokeWidth: 4,
          },
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3 text-xs text-studio-200 overflow-y-auto">
      {/* Header & Import / Export */}
      <div className="flex items-center justify-between border-b border-studio-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Type className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">Dynamic Captions</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.vtt,.txt"
            className="hidden"
            onChange={handleImportSrt}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Import SRT Subtitles"
            className="h-6 px-1.5 text-[10px] text-studio-400 hover:text-white"
          >
            <Upload className="w-3 h-3" /> Import
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={captionClips.length === 0}
            onClick={handleExportSrt}
            title="Export SRT Subtitles"
            className="h-6 px-1.5 text-[10px] text-studio-400 hover:text-white"
          >
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
      </div>

      {/* Style Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-studio-400">Caption Styles</span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => applyGlobalStyle("#facc15", "#000000", true)}
            className="p-2 rounded-md bg-studio-900 hover:bg-studio-850 border border-studio-800 text-left font-bold text-amber-300"
          >
            Creator Yellow
          </button>
          <button
            onClick={() => applyGlobalStyle("#ffffff", "#000000")}
            className="p-2 rounded-md bg-studio-900 hover:bg-studio-850 border border-studio-800 text-left font-bold text-white"
          >
            Bold Center Pop
          </button>
        </div>
      </div>

      {/* Global Typography Settings */}
      {activeCaptionClip?.textPayload && (
        <div className="flex flex-col gap-2 pt-2 border-t border-studio-850">
          <Slider
            label="Font Size"
            min={18}
            max={72}
            value={[activeCaptionClip.textPayload.fontSize || 38]}
            onValueChange={([val]) => {
              captionClips.forEach((c) => {
                if (c.textPayload) {
                  updateClip(c.id, { textPayload: { ...c.textPayload, fontSize: val } });
                }
              });
            }}
            valueFormatter={(v) => `${v}px`}
          />

          <Slider
            label="Vertical Position (Y Offset)"
            min={-40}
            max={40}
            value={[activeCaptionClip.transform?.y || 20]}
            onValueChange={([val]) => {
              captionClips.forEach((c) => {
                updateClip(c.id, { transform: { ...(c.transform || { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false }), y: val } });
              });
            }}
            valueFormatter={(v) => `${v}%`}
          />
        </div>
      )}

      {/* Caption Cues List with Inline Editing */}
      <div className="flex flex-col gap-2 pt-2 border-t border-studio-850">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-studio-400">
            Segments ({captionClips.length})
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddCaption}
            className="h-6 px-2 text-[10px] bg-studio-800 text-white"
          >
            <Plus className="w-3 h-3" /> Add Line
          </Button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {captionClips.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setCurrentTime(c.start);
                setSelectedClipId(c.id);
              }}
              className={`p-2 rounded-lg border text-xs flex flex-col gap-1 transition-colors ${
                currentTime >= c.start && currentTime <= c.start + c.duration
                  ? "bg-amber-500/10 border-amber-500/40"
                  : "bg-studio-900 border-studio-800"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-studio-400 font-mono">
                <span>
                  {formatSecondsShort(c.start)} → {formatSecondsShort(c.start + c.duration)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeClip(c.id);
                  }}
                  className="hover:text-rose-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <input
                type="text"
                value={c.textPayload?.text || ""}
                onChange={(e) => {
                  if (c.textPayload) {
                    updateClip(c.id, {
                      textPayload: { ...c.textPayload, text: e.target.value },
                    });
                  }
                }}
                className="w-full bg-studio-950 border border-studio-800 focus:border-amber-400 rounded px-2 py-1 text-xs text-white outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
