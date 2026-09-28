"use client";

import React, { useState } from "react";
import { useAIStore } from "@/lib/state/use-ai-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2, Play, CheckCircle2, RotateCcw, Sliders, Scissors, Volume2, Type } from "lucide-react";
import { EditPlan } from "@/lib/schemas/edit-plan.schema";

export function AIAssistantPanel() {
  const { conversation, addMessage, currentPlan, setCurrentPlan, isGenerating, setIsGenerating, providerConfig } = useAIStore();
  const { project, mediaItems, styleProfile, applyEditPlan, undo } = useProjectStore();
  const { setIsPlaying, setCurrentTime } = useEditorStore();
  const [prompt, setPrompt] = useState("");
  const [showInspector, setShowInspector] = useState(false);

  const handleGenerate = async (customPrompt?: string) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || isGenerating) return;

    addMessage({
      sender: "user",
      text: textToSend,
    });
    setPrompt("");
    setIsGenerating(true);

    try {
      // Check if we are refining an existing plan or generating new
      const isRefining = !!currentPlan && (
        textToSend.toLowerCase().includes("change") ||
        textToSend.toLowerCase().includes("make") ||
        textToSend.toLowerCase().includes("reduce") ||
        textToSend.toLowerCase().includes("increase") ||
        textToSend.toLowerCase().includes("undo") ||
        textToSend.toLowerCase().includes("remove") ||
        textToSend.toLowerCase().includes("adjust") ||
        textToSend.toLowerCase().includes("captions are") ||
        textToSend.toLowerCase().includes("too")
      );

      const endpoint = isRefining ? "/api/ai/refine" : "/api/ai/edit-plan";
      const payload = isRefining
        ? {
            feedback: textToSend,
            currentPlan,
            currentProject: project,
            conversationHistory: conversation,
            mediaItems,
            providerConfig,
          }
        : {
            prompt: textToSend,
            mediaItems,
            styleProfile,
            currentProject: project,
            providerConfig,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.plan) {
        setCurrentPlan(data.plan);
        applyEditPlan(data.plan);

        addMessage({
          sender: "ai",
          text: data.explanation || "Edit plan updated and applied to timeline.",
          operationsApplied: data.plan.operations.length,
          stats: data.stats,
        });

        // Seek to 0 and trigger preview
        setCurrentTime(0);
        setIsPlaying(true);
      } else {
        addMessage({
          sender: "ai",
          text: data.error || "Could not generate edit plan. Please check your prompt.",
        });
      }
    } catch (err: any) {
      addMessage({
        sender: "ai",
        text: `Error: ${err.message || "Failed to reach AI service."}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const samplePrompts = [
    "Make this a 30 second Instagram Reel with dynamic captions",
    "Remove silences, keep the best moments, and add cinematic warm color",
    "Captions are too large, reduce by 20%",
    "Make the colors more cinematic and warmer",
    "Make the first 5 seconds stronger and faster",
    "Undo the last color change",
  ];

  return (
    <div className="flex flex-col h-full bg-studio-950 border-r border-studio-800 text-white overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-studio-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white">AI Director Assistant</h3>
            <span className="text-[10px] text-studio-400 block font-mono">
              Provider: {providerConfig.provider}
            </span>
          </div>
        </div>

        {currentPlan && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInspector(!showInspector)}
            className="text-[11px] h-7 px-2 text-studio-300"
          >
            <Sliders className="w-3 h-3 text-accent-blue" />
            Plan ({currentPlan.operations.length})
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {conversation.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-accent-blue text-white rounded-br-xs"
                  : "bg-studio-900 border border-studio-800 text-studio-100 rounded-bl-xs"
              }`}
            >
              <p>{msg.text}</p>

              {/* Stats pill if returned by AI */}
              {msg.stats && (
                <div className="mt-2.5 pt-2 border-t border-studio-800/80 grid grid-cols-2 gap-1.5 text-[10px] text-studio-300">
                  {msg.stats.scenesDetected !== undefined && (
                    <span className="flex items-center gap-1">
                      <Scissors className="w-2.5 h-2.5 text-blue-400" />
                      {msg.stats.scenesDetected} scenes detected
                    </span>
                  )}
                  {msg.stats.silencesRemoved !== undefined && (
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-2.5 h-2.5 text-emerald-400" />
                      {msg.stats.silencesRemoved} silences removed
                    </span>
                  )}
                  {msg.stats.captionsCreated !== undefined && (
                    <span className="flex items-center gap-1">
                      <Type className="w-2.5 h-2.5 text-amber-400" />
                      {msg.stats.captionsCreated} captions created
                    </span>
                  )}
                  {msg.stats.transitionsAdded !== undefined && (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                      {msg.stats.transitionsAdded} transitions added
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className="text-[9px] text-studio-500 font-mono px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-studio-900/60 border border-studio-800 text-xs text-studio-300">
            <Loader2 className="w-4 h-4 animate-spin text-accent-blue" />
            <span>Analyzing media, pacing, cuts, and generating edit plan...</span>
          </div>
        )}
      </div>

      {/* Suggested prompts shortcuts */}
      <div className="p-2 border-t border-studio-900 bg-studio-950/90 overflow-x-auto flex gap-1.5 scrollbar-none">
        {samplePrompts.slice(0, 3).map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleGenerate(promptText)}
            className="text-[10px] bg-studio-900 hover:bg-studio-850 border border-studio-800 hover:border-studio-700 text-studio-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Prompt input */}
      <div className="p-3 border-t border-studio-800 bg-studio-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="flex flex-col gap-2"
        >
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your edit (e.g. 'Make a 30s Reel, remove pauses, add yellow captions, warm grade')..."
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              className="w-full bg-studio-950 border border-studio-700/80 focus:border-accent-blue rounded-lg px-3 py-2 text-xs text-white placeholder-studio-500 resize-none outline-none focus:ring-1 focus:ring-accent-blue/50 transition-colors"
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={!prompt.trim() || isGenerating}
              className="absolute right-2 bottom-2 h-7 w-7 rounded-md"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-studio-400">
            <span>Shift+Enter for new line</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleGenerate("Create a rough cut from uploaded media")}
                className="hover:text-accent-blue transition-colors"
              >
                Rough Cut
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleGenerate("Remove silences and tighten all clips")}
                className="hover:text-accent-blue transition-colors"
              >
                Remove Silences
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
