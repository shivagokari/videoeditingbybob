"use client";

import React from "react";
import Link from "next/link";
import {
  Video,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
  Layers,
  Palette,
  Mic,
  Download,
  CheckCircle2,
  Lock,
  Play,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-studio-950 text-white flex flex-col font-sans selection:bg-accent-blue/30 selection:text-white">
      {/* Navigation */}
      <header className="h-16 border-b border-studio-800/80 bg-studio-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-2">
            AI Video Studio
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue border border-accent-blue/30">
              Session Edition
            </span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-studio-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
          <a href="#privacy" className="hover:text-white transition-colors">Privacy Architecture</a>
          <Link href="/settings" className="hover:text-white transition-colors">AI Providers</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/editor">
            <Button variant="primary" size="md" className="gap-2 font-semibold">
              <span>Start Editing</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Glow effect in background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-violet-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-studio-900 border border-studio-700/80 text-xs font-medium text-studio-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-accent-blue" />
          <span>CapCut Precision + Conversational AI + Browser Privacy</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.12]">
          Edit videos with AI.{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">
            Finish them yourself.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-studio-400 max-w-2xl leading-relaxed">
          Describe the edit. Preview it immediately. Refine specific parts through natural conversation. Export manually when you're 100% satisfied.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/editor" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full gap-2.5 font-bold text-sm shadow-xl shadow-blue-600/25">
              <span>Open Studio Editor</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/editor" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Try AI Auto Edit</span>
            </Button>
          </Link>
        </div>

        {/* Feature Pill Tags */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-studio-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-Track Timeline
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reference Video Matching
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> OpenAI / Claude / MCP
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" /> Zero Video Storage
          </span>
        </div>

        {/* Product Visual Mockup Preview */}
        <div className="mt-14 w-full rounded-2xl border border-studio-800 bg-studio-900/60 p-2 shadow-2xl backdrop-blur-sm overflow-hidden">
          <div className="rounded-xl overflow-hidden bg-studio-950 border border-studio-850 p-4 flex flex-col gap-4">
            {/* Top Editor Bar Mockup */}
            <div className="flex items-center justify-between border-b border-studio-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-studio-400">ai_video_studio_v1.0 • 1080×1920 (9:16)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">00:00:14:18</span>
              </div>
            </div>

            {/* Split Mockup */}
            <div className="grid grid-cols-12 gap-4 h-72">
              {/* Media & AI Panel */}
              <div className="col-span-3 rounded-lg bg-studio-900 border border-studio-800 p-3 flex flex-col gap-2 text-left">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Director
                </span>
                <div className="p-2 rounded bg-studio-950 border border-studio-850 text-[10px] text-studio-300 leading-normal">
                  "Created a 30s Reel. Trimmed silences, applied warm cinematic grade, added bold yellow captions."
                </div>
                <div className="mt-auto p-2 rounded bg-studio-800 text-[10px] text-studio-300">
                  <span className="text-emerald-400 font-semibold">✓ 18 Scenes Detected</span>
                  <br />
                  <span className="text-amber-400 font-semibold">✓ 37 Word-Pop Captions</span>
                </div>
              </div>

              {/* Center Canvas */}
              <div className="col-span-6 rounded-lg bg-black border border-studio-800 flex items-center justify-center relative overflow-hidden">
                <div className="w-36 h-64 rounded border border-studio-700 bg-studio-900 relative flex flex-col items-center justify-between p-3 shadow-2xl">
                  <span className="text-[9px] text-studio-500 font-mono">9:16 Canvas</span>
                  <div className="px-2 py-1 rounded bg-black/80 border border-yellow-400/40 text-yellow-300 font-extrabold text-[10px] text-center shadow-lg">
                    WORD POP KARAOKE
                  </div>
                  <span className="text-[8px] text-white/50">Safe Margin Guide</span>
                </div>
              </div>

              {/* Right Inspector */}
              <div className="col-span-3 rounded-lg bg-studio-900 border border-studio-800 p-3 flex flex-col gap-2 text-left">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-rose-400" /> Color Preset
                </span>
                <span className="text-[10px] text-rose-300 font-semibold">Cinematic Warm 35mm</span>
                <div className="space-y-1 mt-2">
                  <div className="h-1.5 w-full bg-studio-800 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-rose-500" />
                  </div>
                  <div className="h-1.5 w-full bg-studio-800 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Mockup */}
            <div className="h-20 rounded-lg bg-studio-900 border border-studio-800 p-2 flex flex-col gap-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-studio-400 w-16">Captions</span>
                <div className="flex-1 h-3.5 rounded bg-amber-600/80 border border-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-studio-400 w-16">Video V1</span>
                <div className="flex-1 h-3.5 rounded bg-blue-600/80 border border-blue-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-studio-400 w-16">Audio A1</span>
                <div className="flex-1 h-3.5 rounded bg-emerald-600/80 border border-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto border-t border-studio-800">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white">Full Non-Linear Editor + Generative Directing</h2>
          <p className="mt-3 text-sm text-studio-400">
            Never sacrifice manual precision for AI speed. Every AI change maps to editable timeline operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-studio-900/60 border border-studio-800 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Prompt-to-Edit & Conversational Memory</h3>
            <p className="text-xs text-studio-400 leading-relaxed">
              Ask the AI to create rough cuts, reduce silence, add captions, or tighten pacing. Give follow-up commands like "Captions are too big" or "Undo the last color change" to patch only the requested parts.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-studio-900/60 border border-studio-800 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Reference Video Style Matching</h3>
            <p className="text-xs text-studio-400 leading-relaxed">
              Upload any viral video as a benchmark. The AI extracts shot pacing, color grade, transition frequency, and caption styles into a reusable Style Profile without copying copyrighted media.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-studio-900/60 border border-studio-800 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Session-Based Privacy Architecture</h3>
            <p className="text-xs text-studio-400 leading-relaxed">
              Your media lives strictly in your browser session memory. No permanent cloud databases, no secret media uploads, and zero video retention after you close or clear your session.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-studio-800 bg-studio-950 py-8 px-6 text-xs text-studio-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-accent-blue" />
          <span className="font-semibold text-white">AI Video Studio</span>
          <span>• Privacy-First Non-Linear Video Editor</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/editor" className="hover:text-white transition-colors">Launch Studio</Link>
          <Link href="/settings" className="hover:text-white transition-colors">AI Providers</Link>
        </div>
      </footer>
    </div>
  );
}
