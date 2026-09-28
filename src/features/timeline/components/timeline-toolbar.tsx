"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { autoCutSilencesAndGaps } from "@/features/media/services/auto-silence-cutter";
import {
  Undo2,
  Redo2,
  Scissors,
  Trash2,
  Copy,
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize,
  ArrowLeftRight,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function TimelineToolbar() {
  const {
    currentTime,
    selectedClipId,
    snappingEnabled,
    setSnappingEnabled,
    zoom,
    zoomIn,
    zoomOut,
    setZoom,
  } = useEditorStore();

  const {
    project,
    mediaItems,
    splitClip,
    removeClip,
    rippleDeleteClip,
    duplicateClip,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useProjectStore();

  const [isAutoCutting, setIsAutoCutting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Global Undo / Redo Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (canRedo()) redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleSplit = () => {
    if (selectedClipId) {
      splitClip(selectedClipId, currentTime);
    } else {
      // Split any clip under playhead on video track
      const clipUnderPlayhead = project.clips.find(
        (c) => currentTime > c.start && currentTime < c.start + c.duration
      );
      if (clipUnderPlayhead) {
        splitClip(clipUnderPlayhead.id, currentTime);
      }
    }
  };

  const handleDelete = () => {
    if (selectedClipId) {
      removeClip(selectedClipId);
    }
  };

  const handleRippleDelete = () => {
    if (selectedClipId) {
      rippleDeleteClip(selectedClipId);
    }
  };

  const handleDuplicate = () => {
    if (selectedClipId) {
      duplicateClip(selectedClipId);
    }
  };

  const handleFitToScreen = () => {
    const targetZoom = Math.max(10, Math.min(100, 800 / Math.max(10, project.duration)));
    setZoom(targetZoom);
  };

  // One-click Auto AI Silence Cutter
  const handleAutoSilenceCut = async () => {
    if (isAutoCutting) return;
    setIsAutoCutting(true);
    setFeedback(null);

    try {
      const result = await autoCutSilencesAndGaps(project, mediaItems);
      useProjectStore.setState((state) => ({
        project: {
          ...state.project,
          clips: result.updatedClips,
        },
      }));
      setFeedback(result.summary);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error("Auto cut error:", err);
    } finally {
      setIsAutoCutting(false);
    }
  };

  return (
    <div className="h-9 px-3 bg-studio-900 border-b border-studio-800 flex items-center justify-between text-xs select-none shrink-0">
      {/* Left Editing Tools */}
      <div className="flex items-center gap-1">
        {/* Undo Button */}
        <Button
          variant="ghost"
          size="sm"
          disabled={!canUndo()}
          onClick={undo}
          title="Undo (Ctrl+Z)"
          className="h-7 px-2 text-xs text-studio-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Undo</span>
        </Button>

        {/* Redo Button */}
        <Button
          variant="ghost"
          size="sm"
          disabled={!canRedo()}
          onClick={redo}
          title="Redo (Ctrl+Y)"
          className="h-7 px-2 text-xs text-studio-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Redo</span>
        </Button>

        <div className="h-4 w-px bg-studio-800 mx-0.5" />

        <Button
          variant="secondary"
          size="sm"
          onClick={handleSplit}
          title="Split clip at playhead (S)"
          className="h-7 px-2 text-xs bg-studio-850 hover:bg-studio-800 text-slate-800 dark:text-studio-200"
        >
          <Scissors className="w-3.5 h-3.5 text-accent-blue" />
          <span>Split</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={!selectedClipId}
          onClick={handleDelete}
          title="Delete selected clip (Delete)"
          className="h-7 px-2 text-xs text-studio-400 hover:text-rose-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={!selectedClipId}
          onClick={handleRippleDelete}
          title="Ripple delete (shifts following clips left)"
          className="h-7 px-2 text-xs text-studio-400 hover:text-amber-500"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ripple Del</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={!selectedClipId}
          onClick={handleDuplicate}
          title="Duplicate selected clip"
          className="h-7 px-2 text-xs text-studio-400 hover:text-slate-900 dark:hover:text-white"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Duplicate</span>
        </Button>

        <div className="h-4 w-px bg-studio-800 mx-1" />

        {/* Snapping toggle */}
        <button
          onClick={() => setSnappingEnabled(!snappingEnabled)}
          className={`h-7 px-2 rounded-md flex items-center gap-1 transition-colors ${
            snappingEnabled
              ? "bg-blue-600/20 text-accent-blue border border-blue-500/30 font-medium"
              : "text-studio-400 hover:text-studio-200"
          }`}
          title="Toggle timeline snapping"
        >
          <Magnet className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Snapping</span>
        </button>

        <div className="h-4 w-px bg-studio-800 mx-1" />

        {/* Internal Automatic AI Silence & Gap Cutter */}
        <button
          onClick={handleAutoSilenceCut}
          disabled={isAutoCutting || project.clips.length === 0}
          className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 transition-all text-xs font-semibold ${
            isAutoCutting
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
              : "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 shadow-sm"
          }`}
          title="Internal Automatic AI: auto-detects speech, removes silence, hesitation, gaps, and ripples clips seamlessly"
        >
          {isAutoCutting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>{isAutoCutting ? "Trimming Silences..." : "Auto AI Cut"}</span>
        </button>

        {/* AI feedback indicator */}
        {feedback && (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-in fade-in">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Right Zoom Controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          title="Zoom out (-)"
          className="h-6 w-6 text-studio-400 hover:text-white"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>

        <input
          type="range"
          min={10}
          max={200}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-20 h-1 bg-studio-800 rounded appearance-none cursor-pointer accent-blue-500"
          title="Timeline zoom scale"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          title="Zoom in (+)"
          className="h-6 w-6 text-studio-400 hover:text-white"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleFitToScreen}
          title="Fit whole timeline on screen"
          className="h-6 w-6 text-studio-400 hover:text-white"
        >
          <Maximize className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
