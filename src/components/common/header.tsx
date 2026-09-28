"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Video,
  Undo2,
  Redo2,
  Sparkles,
  Download,
  Trash2,
  Keyboard,
  Settings,
  Flame,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "../ui/button";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { ThemeToggle } from "./theme-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";

export function Header() {
  const { project, setProjectTitle, undo, redo, canUndo, canRedo, clearSession, referenceMedia } = useProjectStore();
  const { setIsExportModalOpen, setIsShortcutsModalOpen, setIsReferenceModalOpen, setActiveTab } = useEditorStore();
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b border-studio-800 bg-studio-900 px-4 flex items-center justify-between shrink-0 select-none z-20">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Video Studio
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.2 rounded bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
                  Pro
                </span>
              </span>
            </div>
          </Link>

          <div className="h-5 w-px bg-studio-800" />

          {/* Project Title Input (like Reference 3: New project) */}
          <input
            type="text"
            value={project.title}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="bg-transparent hover:bg-studio-850 focus:bg-studio-850 border border-transparent hover:border-studio-700/80 focus:border-accent-blue rounded-md px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white transition-colors outline-none max-w-[200px]"
            title="Click to rename project"
          />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 bg-studio-950/60 p-0.5 rounded-lg border border-studio-800/80">
            <Button
              variant="ghost"
              size="sm"
              disabled={!canUndo()}
              onClick={undo}
              title="Undo last action (Ctrl+Z)"
              className="h-7 px-2 text-xs flex items-center gap-1.5 text-studio-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="font-medium hidden sm:inline">Undo</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canRedo()}
              onClick={redo}
              title="Redo next action (Ctrl+Y / Ctrl+Shift+Z)"
              className="h-7 px-2 text-xs flex items-center gap-1.5 text-studio-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none"
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="font-medium hidden sm:inline">Redo</span>
            </Button>
          </div>
        </div>

        {/* Center: Quick Assistant / Reference Trigger */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab("ai")}
            className="text-xs bg-studio-850 border-studio-800 text-slate-800 dark:text-studio-200 hover:text-accent-blue"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Director</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsReferenceModalOpen(true)}
            className="text-xs bg-studio-850 border-studio-800 text-slate-800 dark:text-studio-200 hover:text-amber-500"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {referenceMedia ? "Reference Active" : "Analyze Reference"}
            </span>
          </Button>
        </div>

        {/* Right: Actions & Export */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShortcutsModalOpen(true)}
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4 text-studio-400" />
          </Button>

          <Link href="/settings">
            <Button variant="ghost" size="icon" title="AI Providers & Settings">
              <Settings className="w-4 h-4 text-studio-400" />
            </Button>
          </Link>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsClearDialogOpen(true)}
            title="Clear Session"
            className="hover:text-rose-400 hover:bg-rose-500/10"
          >
            <Trash2 className="w-4 h-4 text-studio-400" />
          </Button>

          <div className="h-5 w-px bg-studio-800" />

          {/* Export Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 font-semibold"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </header>

      {/* Clear Session Confirmation Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent className="max-w-md bg-studio-900 border-studio-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-rose-400">Clear Current Session?</DialogTitle>
            <DialogDescription className="text-studio-300">
              All uploaded raw media, timelines, AI edit plans, and generated previews will be completely removed from browser memory. Original files on your computer remain untouched.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setIsClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearSession();
                setIsClearDialogOpen(false);
              }}
            >
              Clear Everything
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
