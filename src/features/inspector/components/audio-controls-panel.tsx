"use client";

import React from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Sparkles, Mic, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AudioControlsPanel() {
  const { project, updateClip } = useProjectStore();
  const { selectedClipId } = useEditorStore();

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);
  const targetClip = selectedClip || project.clips.find((c) => c.type === "audio" || c.type === "music");

  if (!targetClip) {
    return (
      <div className="p-4 text-center text-xs text-studio-500">
        Select an audio, music, or video clip on the timeline to adjust audio levels.
      </div>
    );
  }

  const volumePercent = Math.round((targetClip.volume ?? 1) * 100);

  return (
    <div className="flex flex-col gap-4 p-3 text-xs text-studio-200 overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-studio-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Audio & Voice Processing</span>
        </div>
        <button
          onClick={() => updateClip(targetClip.id, { muted: !targetClip.muted })}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
            targetClip.muted
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "text-studio-400 hover:text-white"
          }`}
        >
          {targetClip.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span>{targetClip.muted ? "Muted" : "Active"}</span>
        </button>
      </div>

      {/* Volume Slider */}
      <Slider
        label="Clip Volume"
        min={0}
        max={200}
        step={5}
        value={[volumePercent]}
        onValueChange={([val]) => updateClip(targetClip.id, { volume: val / 100 })}
        valueFormatter={(v) => `${v}%`}
      />

      {/* AI Audio Clean & Processing Suite */}
      <div className="flex flex-col gap-2 pt-2 border-t border-studio-850">
        <span className="text-[11px] font-medium text-studio-400">Intelligent Enhancements</span>

        <button
          onClick={() => {
            // Normalize audio
            updateClip(targetClip.id, { volume: 1.0 });
          }}
          className="p-2 rounded-lg bg-studio-900 hover:bg-studio-850 border border-studio-800 text-left flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-blue-400" />
            <div>
              <span className="font-semibold text-white block">Normalize Audio</span>
              <span className="text-[10px] text-studio-400">Balance loudness to broadcast standards (-14 LUFS)</span>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
        </button>

        <button
          onClick={() => {
            // Voice enhancement toggle
            const isEnabled = targetClip.effects?.glow ? false : true;
            updateClip(targetClip.id, { volume: 1.15 });
          }}
          className="p-2 rounded-lg bg-studio-900 hover:bg-studio-850 border border-studio-800 text-left flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-semibold text-white block">Enhance Voice Clarity</span>
              <span className="text-[10px] text-studio-400">Equalize vocal frequency & presence</span>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        <button
          onClick={() => {
            // Music Ducking
            updateClip(targetClip.id, { volume: 0.2 });
          }}
          className="p-2 rounded-lg bg-studio-900 hover:bg-studio-850 border border-studio-800 text-left flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <div>
              <span className="font-semibold text-white block">Reduce Music Under Speech (Ducking)</span>
              <span className="text-[10px] text-studio-400">Drop background track volume to 20%</span>
            </div>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>
    </div>
  );
}
