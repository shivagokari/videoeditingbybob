"use client";

import React from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { Slider } from "@/components/ui/slider";
import { Move, RotateCw, FlipHorizontal, FlipVertical, Zap, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TransformControls() {
  const { project, updateClip } = useProjectStore();
  const { selectedClipId } = useEditorStore();

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);
  const targetClip = selectedClip || project.clips[0];

  if (!targetClip) {
    return (
      <div className="p-4 text-center text-xs text-studio-500">
        Select a clip on the timeline to modify transform and position.
      </div>
    );
  }

  const transform = targetClip.transform || {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
  };

  const handleUpdate = (updates: Partial<typeof transform>) => {
    updateClip(targetClip.id, {
      transform: { ...transform, ...updates },
    });
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

  return (
    <div className="flex flex-col gap-4 p-3 text-xs text-studio-200 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-studio-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Move className="w-4 h-4 text-accent-blue" />
          <span className="font-semibold text-white">Transform & Speed</span>
        </div>
        <span className="text-[10px] text-studio-400 font-mono truncate max-w-[120px]">
          {targetClip.name}
        </span>
      </div>

      {/* Scale & Opacity */}
      <Slider
        label="Scale"
        min={10}
        max={250}
        value={[Math.round((transform.scale || 1) * 100)]}
        onValueChange={([val]) => handleUpdate({ scale: val / 100 })}
        valueFormatter={(v) => `${v}%`}
      />

      <Slider
        label="Opacity"
        min={0}
        max={100}
        value={[Math.round((targetClip.opacity ?? 1) * 100)]}
        onValueChange={([val]) => updateClip(targetClip.id, { opacity: val / 100 })}
        valueFormatter={(v) => `${v}%`}
      />

      <Slider
        label="Rotation"
        min={-180}
        max={180}
        value={[transform.rotation || 0]}
        onValueChange={([val]) => handleUpdate({ rotation: val })}
        valueFormatter={(v) => `${v}°`}
      />

      {/* Position X & Y */}
      <div className="grid grid-cols-2 gap-2">
        <Slider
          label="Offset X"
          min={-500}
          max={500}
          value={[transform.x || 0]}
          onValueChange={([val]) => handleUpdate({ x: val })}
          valueFormatter={(v) => `${v}px`}
        />
        <Slider
          label="Offset Y"
          min={-500}
          max={500}
          value={[transform.y || 0]}
          onValueChange={([val]) => handleUpdate({ y: val })}
          valueFormatter={(v) => `${v}px`}
        />
      </div>

      {/* Flip buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-studio-850">
        <Button
          variant={transform.flipX ? "primary" : "secondary"}
          size="sm"
          onClick={() => handleUpdate({ flipX: !transform.flipX })}
          className="flex-1 text-xs gap-1.5"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
          <span>Flip Horizontal</span>
        </Button>
        <Button
          variant={transform.flipY ? "primary" : "secondary"}
          size="sm"
          onClick={() => handleUpdate({ flipY: !transform.flipY })}
          className="flex-1 text-xs gap-1.5"
        >
          <FlipVertical className="w-3.5 h-3.5" />
          <span>Flip Vertical</span>
        </Button>
      </div>

      {/* Speed Selector */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-studio-850">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-medium text-studio-300">Clip Playback Speed</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => {
                const oldSpeed = targetClip.speed || 1;
                const sourceDuration = targetClip.duration * oldSpeed;
                updateClip(targetClip.id, {
                  speed: s,
                  duration: Math.max(0.1, sourceDuration / s),
                });
              }}
              className={`p-1.5 rounded text-xs font-mono font-medium transition-colors ${
                (targetClip.speed || 1) === s
                  ? "bg-accent-blue text-white font-bold"
                  : "bg-studio-900 border border-studio-800 text-studio-300 hover:bg-studio-850"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
