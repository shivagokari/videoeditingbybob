"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { TransformControls } from "./transform-controls";
import { ColorGradingPanel } from "./color-grading-panel";
import { AudioControlsPanel } from "./audio-controls-panel";
import { CaptionsEditorPanel } from "./captions-editor-panel";
import { GreenScreenPanel } from "./green-screen-panel";
import { Move, Palette, Volume2, Type, Sparkles } from "lucide-react";

export function ClipInspector() {
  const { selectedClipId } = useEditorStore();
  const { project } = useProjectStore();
  const [activeTab, setActiveTab] = useState<"transform" | "color" | "audio" | "captions" | "chroma">("color");

  const selectedClip = project.clips.find((c) => c.id === selectedClipId);

  // Auto switch tab based on selected clip type
  useEffect(() => {
    if (selectedClip) {
      if (selectedClip.type === "caption") {
        setActiveTab("captions");
      } else if (selectedClip.type === "audio" || selectedClip.type === "music") {
        setActiveTab("audio");
      }
    }
  }, [selectedClip]);

  const tabs: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: "transform", label: "Transform", icon: <Move className="w-3.5 h-3.5" /> },
    { key: "color", label: "Color", icon: <Palette className="w-3.5 h-3.5" /> },
    { key: "audio", label: "Audio", icon: <Volume2 className="w-3.5 h-3.5" /> },
    { key: "captions", label: "Captions", icon: <Type className="w-3.5 h-3.5" /> },
    { key: "chroma", label: "Chroma", icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-studio-900 border-l border-studio-800 text-slate-800 dark:text-studio-100 overflow-hidden">
      {/* Tab Navigation */}
      <div className="h-10 border-b border-studio-800 flex items-center px-2 gap-1 bg-studio-900 overflow-x-auto scrollbar-none shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? "bg-studio-800 text-slate-900 dark:text-white font-semibold"
                : "text-studio-400 hover:text-slate-800 dark:hover:text-studio-200 hover:bg-studio-850"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "transform" && <TransformControls />}
        {activeTab === "color" && <ColorGradingPanel />}
        {activeTab === "audio" && <AudioControlsPanel />}
        {activeTab === "captions" && <CaptionsEditorPanel />}
        {activeTab === "chroma" && <GreenScreenPanel />}
      </div>
    </div>
  );
}
