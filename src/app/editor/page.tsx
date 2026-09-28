"use client";

import React, { useState } from "react";
import { Header } from "@/components/common/header";
import { MediaBin } from "@/features/media/components/media-bin";
import { VideoCanvasPlayer } from "@/features/preview/components/video-canvas-player";
import { Timeline } from "@/features/timeline/components/timeline";
import { ClipInspector } from "@/features/inspector/components/clip-inspector";
import { AIAssistantPanel } from "@/features/ai/components/ai-assistant-panel";
import { ExportDialog } from "@/features/export/components/export-dialog";
import { KeyboardShortcutsModal } from "@/components/common/keyboard-shortcuts-modal";
import { ReferenceAnalysisModal } from "@/features/ai/components/reference-analysis-modal";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { FolderOpen, Sparkles, Type, Music, Palette, Wand2 } from "lucide-react";

export default function EditorPage() {
  const { activeTab, setActiveTab } = useEditorStore();
  const [leftNavTab, setLeftNavTab] = useState<"media" | "ai" | "text" | "effects">("media");

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-studio-950 text-slate-900 dark:text-white select-none font-sans">
      {/* Top Header */}
      <Header />

      {/* Main Workspace (3-column layout matching reference 3 & 4) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Navigation Icon Strip */}
        <div className="w-12 bg-studio-950 border-r border-studio-800 flex flex-col items-center py-2.5 gap-2 shrink-0 z-10">
          <button
            onClick={() => setLeftNavTab("media")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              leftNavTab === "media"
                ? "bg-studio-800 text-accent-blue shadow-sm border border-studio-700"
                : "text-studio-400 hover:text-studio-100 hover:bg-studio-900"
            }`}
            title="Media Assets & Uploads"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => setLeftNavTab("ai")}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative ${
              leftNavTab === "ai"
                ? "bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 text-indigo-400 border border-indigo-500/40"
                : "text-studio-400 hover:text-studio-100 hover:bg-studio-900"
            }`}
            title="AI Director & Smart Editing"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue absolute top-1.5 right-1.5 animate-pulse" />
          </button>
        </div>

        {/* Left Drawer / Panel (Media Bin or AI Assistant) */}
        <div className="w-72 md:w-80 bg-studio-900 border-r border-studio-800 flex flex-col shrink-0 overflow-hidden">
          {leftNavTab === "media" && <MediaBin />}
          {leftNavTab === "ai" && <AIAssistantPanel />}
        </div>

        {/* Center: Video Preview Monitor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-studio-950">
          <VideoCanvasPlayer />
        </div>

        {/* Right: Inspector / Properties Sidebar */}
        <div className="w-72 md:w-80 bg-studio-900 border-l border-studio-800 flex flex-col shrink-0 overflow-hidden">
          <ClipInspector />
        </div>
      </div>

      {/* Bottom: Professional Multi-Track Timeline */}
      <Timeline />

      {/* Global Modals */}
      <ExportDialog />
      <KeyboardShortcutsModal />
      <ReferenceAnalysisModal />
    </div>
  );
}
