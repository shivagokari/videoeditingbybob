"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { Command } from "lucide-react";

export function KeyboardShortcutsModal() {
  const { isShortcutsModalOpen, setIsShortcutsModalOpen } = useEditorStore();

  const shortcuts = [
    { key: "Space", desc: "Play / Pause timeline playback" },
    { key: "J", desc: "Rewind / Step backward" },
    { key: "K", desc: "Pause playback" },
    { key: "L", desc: "Fast forward" },
    { key: "S", desc: "Split active clip at playhead" },
    { key: "I", desc: "Set In mark" },
    { key: "O", desc: "Set Out mark" },
    { key: "Delete / Backspace", desc: "Delete selected clip" },
    { key: "Ctrl / Cmd + Z", desc: "Undo timeline change" },
    { key: "Ctrl / Cmd + Shift + Z", desc: "Redo timeline change" },
    { key: "← / →", desc: "Step 1 frame backward / forward" },
    { key: "Shift + ← / →", desc: "Step 1 second backward / forward" },
    { key: "+ / -", desc: "Zoom timeline in / out" },
  ];

  return (
    <Dialog open={isShortcutsModalOpen} onOpenChange={setIsShortcutsModalOpen}>
      <DialogContent className="max-w-md bg-studio-900 border-studio-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-accent-blue" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription className="text-studio-400">
            Professional NLE editing shortcuts for fast keyboard-driven workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 divide-y divide-studio-800 text-xs">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-2 flex items-center justify-between">
              <span className="text-studio-300">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-studio-800 border border-studio-700 font-mono text-studio-200 shadow-sm font-semibold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
