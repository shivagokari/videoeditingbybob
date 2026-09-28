"use client";

import React from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Eye } from "lucide-react";

export function GreenScreenPanel() {
  const { project, updateClip } = useProjectStore();
  const { selectedClipId } = useEditorStore();

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);
  const targetClip = selectedClip || project.clips.find((c) => c.type === "video");

  if (!targetClip) {
    return (
      <div className="p-4 text-center text-xs text-studio-500">
        Select a video clip to configure chroma key background removal.
      </div>
    );
  }

  const chroma = targetClip.chromaKey || {
    enabled: false,
    keyColor: "#00ff00",
    threshold: 0.35,
    softness: 0.15,
    spillReduction: 0.5,
  };

  const handleUpdate = (updates: Partial<typeof chroma>) => {
    updateClip(targetClip.id, {
      chromaKey: { ...chroma, ...updates },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-3 text-xs text-studio-200 overflow-y-auto">
      {/* Title & Enable Toggle */}
      <div className="flex items-center justify-between border-b border-studio-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Chroma Key / Green Screen</span>
        </div>
        <button
          onClick={() => handleUpdate({ enabled: !chroma.enabled })}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            chroma.enabled
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-studio-800 text-studio-400 hover:text-white"
          }`}
        >
          {chroma.enabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      {/* Key Color Picker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-studio-400">Target Key Color</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={chroma.keyColor}
            onChange={(e) => handleUpdate({ keyColor: e.target.value })}
            className="w-8 h-8 rounded border border-studio-700 bg-transparent cursor-pointer"
          />
          <span className="font-mono text-xs text-studio-300 uppercase">
            {chroma.keyColor}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => handleUpdate({ keyColor: "#00ff00" })}
              className="w-5 h-5 rounded bg-[#00ff00] border border-white/20"
              title="Standard Green"
            />
            <button
              onClick={() => handleUpdate({ keyColor: "#0000ff" })}
              className="w-5 h-5 rounded bg-[#0000ff] border border-white/20"
              title="Standard Blue"
            />
          </div>
        </div>
      </div>

      {/* Threshold & Softness */}
      <div className="flex flex-col gap-3 pt-2 border-t border-studio-850">
        <Slider
          label="Key Threshold"
          min={5}
          max={90}
          value={[Math.round(chroma.threshold * 100)]}
          onValueChange={([val]) => handleUpdate({ threshold: val / 100 })}
          valueFormatter={(v) => `${v}%`}
        />

        <Slider
          label="Edge Softness"
          min={0}
          max={50}
          value={[Math.round(chroma.softness * 100)]}
          onValueChange={([val]) => handleUpdate({ softness: val / 100 })}
          valueFormatter={(v) => `${v}%`}
        />

        <Slider
          label="Spill Suppression"
          min={0}
          max={100}
          value={[Math.round(chroma.spillReduction * 100)]}
          onValueChange={([val]) => handleUpdate({ spillReduction: val / 100 })}
          valueFormatter={(v) => `${v}%`}
        />
      </div>
    </div>
  );
}
