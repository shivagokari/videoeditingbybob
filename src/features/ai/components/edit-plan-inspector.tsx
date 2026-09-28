"use client";

import React, { useState } from "react";
import { EditPlan, Operation } from "@/lib/schemas/edit-plan.schema";
import { useAIStore } from "@/lib/state/use-ai-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { Button } from "@/components/ui/button";
import { Check, Scissors, Volume2, Type, Sparkles, Palette, Zap, ArrowRight, ShieldAlert } from "lucide-react";
import { validateEditPlan } from "@/lib/timeline/edit-plan-engine";

export function EditPlanInspector() {
  const { currentPlan, setCurrentPlan } = useAIStore();
  const { applyEditPlan } = useProjectStore();
  const [editableJson, setEditableJson] = useState<string>("");
  const [isRawMode, setIsRawMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentPlan) {
    return (
      <div className="p-4 text-center text-xs text-studio-500">
        No active Edit Plan generated yet. Ask the AI Director to create an edit plan.
      </div>
    );
  }

  const handleApplyRawJson = () => {
    try {
      const parsed = JSON.parse(editableJson);
      const validation = validateEditPlan(parsed);
      if (!validation.valid) {
        setError(`Validation Failed:\n${validation.errors?.join("\n")}`);
        return;
      }
      setCurrentPlan(validation.plan!);
      applyEditPlan(validation.plan!);
      setError(null);
      setIsRawMode(false);
    } catch (e: any) {
      setError(`JSON Parse Error: ${e.message}`);
    }
  };

  const getOpIcon = (type: Operation["type"]) => {
    switch (type) {
      case "trim":
      case "split":
        return <Scissors className="w-3.5 h-3.5 text-blue-400" />;
      case "remove_silence":
        return <Volume2 className="w-3.5 h-3.5 text-emerald-400" />;
      case "caption":
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case "transition":
        return <Sparkles className="w-3.5 h-3.5 text-violet-400" />;
      case "color_grade":
        return <Palette className="w-3.5 h-3.5 text-rose-400" />;
      case "speed":
        return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-studio-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-950 text-white overflow-hidden p-3 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-studio-800 pb-2">
        <div>
          <h4 className="text-xs font-bold text-white">{currentPlan.title}</h4>
          <span className="text-[10px] text-studio-400 font-mono">
            {currentPlan.project.aspectRatio} • {currentPlan.project.fps} FPS • {currentPlan.operations.length} Ops
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!isRawMode) {
              setEditableJson(JSON.stringify(currentPlan, null, 2));
            }
            setIsRawMode(!isRawMode);
          }}
          className="text-[10px] h-6 px-2"
        >
          {isRawMode ? "Visual View" : "Edit JSON"}
        </Button>
      </div>

      {error && (
        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] flex items-start gap-1.5 whitespace-pre-wrap">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isRawMode ? (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <textarea
            value={editableJson}
            onChange={(e) => setEditableJson(e.target.value)}
            className="flex-1 w-full bg-studio-900 border border-studio-800 rounded p-2 text-[10px] font-mono text-studio-200 outline-none focus:border-accent-blue resize-none"
            spellCheck={false}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsRawMode(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyRawJson}>
              <Check className="w-3 h-3" /> Apply Validated JSON
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {currentPlan.operations.map((op, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-studio-900/80 border border-studio-800 text-xs flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-studio-200 capitalize">
                  {getOpIcon(op.type)}
                  {op.type.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-studio-800 font-mono text-studio-400">
                  #{idx + 1}
                </span>
              </div>

              {/* Op Details */}
              <div className="text-[11px] text-studio-400 font-mono pl-5">
                {op.type === "trim" && (
                  <span>
                    Range: {op.start}s → {op.end}s (Speed {op.speed || 1}x)
                  </span>
                )}
                {op.type === "caption" && (
                  <span>
                    Style: {op.style} ({op.segments.length} segments, font {op.fontSize}px)
                  </span>
                )}
                {op.type === "color_grade" && (
                  <span>
                    Preset: {op.grade.preset} (Temp: {op.grade.temperature}, Sat: {op.grade.saturation})
                  </span>
                )}
                {op.type === "transition" && (
                  <span>
                    Type: {op.transitionType} ({op.duration}s)
                  </span>
                )}
                {op.type === "remove_silence" && (
                  <span>
                    Threshold: {op.threshold}dB (min {op.minSilenceDuration}s)
                  </span>
                )}
                {op.type === "speed" && (
                  <span>Factor: {op.speed}x</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
