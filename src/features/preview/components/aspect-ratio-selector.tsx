"use client";

import React from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { AspectRatioPreset } from "@/lib/schemas/edit-plan.schema";
import { Smartphone, Monitor, Square, Shield, Eye, EyeOff } from "lucide-react";

export function AspectRatioSelector() {
  const { project, setAspectRatio } = useProjectStore();
  const { safeZonesEnabled, setSafeZonesEnabled } = useEditorStore();

  const ratios: { label: string; value: AspectRatioPreset; icon: React.ReactNode }[] = [
    { label: "9:16 Reel", value: "9:16", icon: <Smartphone className="w-3.5 h-3.5" /> },
    { label: "16:9 YouTube", value: "16:9", icon: <Monitor className="w-3.5 h-3.5" /> },
    { label: "1:1 Square", value: "1:1", icon: <Square className="w-3.5 h-3.5" /> },
    { label: "4:5 Portrait", value: "4:5", icon: <Smartphone className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Aspect Ratio Switcher */}
      <div className="flex items-center bg-studio-900 border border-studio-800 rounded-lg p-0.5">
        {ratios.map((r) => (
          <button
            key={r.value}
            onClick={() => setAspectRatio(r.value)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              project.aspectRatio === r.value
                ? "bg-studio-800 text-white font-semibold shadow-xs"
                : "text-studio-400 hover:text-studio-200"
            }`}
          >
            {r.icon}
            <span className="hidden sm:inline">{r.label}</span>
          </button>
        ))}
      </div>

      {/* Safe Zones Toggle */}
      <button
        onClick={() => setSafeZonesEnabled(!safeZonesEnabled)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors ${
          safeZonesEnabled
            ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30"
            : "bg-studio-900 text-studio-400 border-studio-800 hover:text-white"
        }`}
        title="Toggle social creator safe zones"
      >
        <Shield className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Safe Zones</span>
      </button>
    </div>
  );
}
