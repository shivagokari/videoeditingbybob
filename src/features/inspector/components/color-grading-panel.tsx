"use client";

import React from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { Slider } from "@/components/ui/slider";
import { COLOR_PRESETS } from "@/lib/utils/color-filters";
import { ColorPreset } from "@/lib/schemas/edit-plan.schema";
import { Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ColorGradingPanel() {
  const { project, updateClip } = useProjectStore();
  const { selectedClipId, setSelectedClipId, currentTime } = useEditorStore();

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);
  const clipUnderPlayhead = project.clips.find(
    (c) => currentTime >= c.start && currentTime < c.start + c.duration && (c.type === "video" || c.type === "overlay")
  );
  const targetClip = selectedClip || clipUnderPlayhead || project.clips.find((c) => c.type === "video");

  if (!targetClip) {
    return (
      <div className="p-4 text-center text-xs text-studio-400">
        Add or select a video clip on the timeline to adjust color grading.
      </div>
    );
  }

  const grade = targetClip.colorGrade || COLOR_PRESETS.natural;

  const handleUpdate = (updates: Partial<typeof grade>) => {
    setSelectedClipId(targetClip.id);
    updateClip(targetClip.id, {
      colorGrade: { ...grade, ...updates },
    });
  };

  const handleApplyPreset = (preset: ColorPreset) => {
    const presetValues = COLOR_PRESETS[preset];
    if (presetValues) {
      setSelectedClipId(targetClip.id);
      updateClip(targetClip.id, {
        colorGrade: { ...presetValues },
      });
    }
  };

  const [appliedFeedback, setAppliedFeedback] = React.useState(false);

  const handleApplyToAllClips = () => {
    useProjectStore.setState((state) => {
      const updatedClips = state.project.clips.map((c) => {
        if (c.type === "video" || c.type === "overlay") {
          return { ...c, colorGrade: { ...grade } };
        }
        return c;
      });
      return {
        history: [...state.history.slice(-30), JSON.parse(JSON.stringify(state.project))],
        future: [],
        project: {
          ...state.project,
          clips: updatedClips,
        },
      };
    });
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2500);
  };

  const presets: { name: string; key: ColorPreset }[] = [
    { name: "Natural", key: "natural" },
    { name: "Cinematic Warm", key: "cinematic_warm" },
    { name: "Teal & Orange", key: "moody_teal_orange" },
    { name: "Vintage Film", key: "vintage_film" },
    { name: "Social Punch", key: "social_punch" },
    { name: "Clean Commercial", key: "clean_commercial" },
    { name: "Noir", key: "noir" },
    { name: "Cyberpunk", key: "cyberpunk" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3 text-xs text-slate-800 dark:text-studio-200 overflow-y-auto">
      {/* Title & Target Clip Indicator */}
      <div className="flex flex-col gap-1.5 border-b border-studio-800 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-rose-400" />
            <span className="font-semibold text-slate-900 dark:text-white">Color Grading & Looks</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleApplyPreset("natural")}
            className="h-6 px-1.5 text-[10px] text-studio-400 hover:text-slate-900 dark:hover:text-white"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-studio-400">
          <span className="truncate max-w-[160px] font-medium text-accent-blue">
            Target: {targetClip.name}
          </span>
          <button
            onClick={handleApplyToAllClips}
            className={`text-[10px] font-medium transition-colors ${
              appliedFeedback ? "text-emerald-400 font-semibold" : "text-indigo-400 hover:text-indigo-300 hover:underline"
            }`}
            title="Apply this color grade look to all video clips on timeline"
          >
            {appliedFeedback ? "✓ Applied to All Clips!" : "Apply to All Clips"}
          </button>
        </div>
      </div>

      {/* Preset Cards */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-studio-400">Cinematic Presets</span>
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => handleApplyPreset(p.key)}
              className={`p-2 rounded-md border text-left text-xs font-medium transition-colors ${
                grade.preset === p.key
                  ? "bg-rose-500/20 text-rose-200 border-rose-500/40 font-semibold"
                  : "bg-studio-900 border-studio-800 text-studio-300 hover:bg-studio-850 hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Adjustment Sliders */}
      <div className="flex flex-col gap-3 pt-2 border-t border-studio-850">
        <Slider
          label="Exposure"
          min={-50}
          max={50}
          value={[grade.exposure]}
          onValueChange={([val]) => handleUpdate({ exposure: val, preset: "custom" })}
          valueFormatter={(v) => `${v > 0 ? `+${v}` : v}`}
        />

        <Slider
          label="Contrast"
          min={-50}
          max={50}
          value={[grade.contrast]}
          onValueChange={([val]) => handleUpdate({ contrast: val, preset: "custom" })}
          valueFormatter={(v) => `${v > 0 ? `+${v}` : v}`}
        />

        <Slider
          label="Brightness"
          min={-50}
          max={50}
          value={[grade.brightness]}
          onValueChange={([val]) => handleUpdate({ brightness: val, preset: "custom" })}
          valueFormatter={(v) => `${v > 0 ? `+${v}` : v}`}
        />

        <Slider
          label="Saturation"
          min={-100}
          max={100}
          value={[grade.saturation]}
          onValueChange={([val]) => handleUpdate({ saturation: val, preset: "custom" })}
          valueFormatter={(v) => `${v > 0 ? `+${v}` : v}`}
        />

        <Slider
          label="Temperature (Warm / Cool)"
          min={-50}
          max={50}
          value={[grade.temperature]}
          onValueChange={([val]) => handleUpdate({ temperature: val, preset: "custom" })}
          valueFormatter={(v) => `${v > 0 ? `+${v}K` : `${v}K`}`}
        />

        <Slider
          label="Tint (Green / Magenta)"
          min={-50}
          max={50}
          value={[grade.tint]}
          onValueChange={([val]) => handleUpdate({ tint: val, preset: "custom" })}
          valueFormatter={(v) => `${v > 0 ? `+${v}` : v}`}
        />

        <Slider
          label="Vignette"
          min={0}
          max={100}
          value={[grade.vignette]}
          onValueChange={([val]) => handleUpdate({ vignette: val, preset: "custom" })}
          valueFormatter={(v) => `${v}%`}
        />

        <Slider
          label="Film Grain"
          min={0}
          max={100}
          value={[grade.grain]}
          onValueChange={([val]) => handleUpdate({ grain: val, preset: "custom" })}
          valueFormatter={(v) => `${v}%`}
        />
      </div>
    </div>
  );
}
