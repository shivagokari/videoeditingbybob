"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { useAIStore } from "@/lib/state/use-ai-store";
import { MediaUploadZone } from "@/features/media/components/media-upload-zone";
import { Sparkles, Loader2, Check, Flame, Sliders, Palette, Zap } from "lucide-react";
import { StyleProfile } from "@/lib/schemas/style-profile.schema";

export function ReferenceAnalysisModal() {
  const { isReferenceModalOpen, setIsReferenceModalOpen, setActiveTab } = useEditorStore();
  const { referenceMedia, setReferenceMedia, styleProfile, setStyleProfile, mediaItems } = useProjectStore();
  const { providerConfig, addMessage } = useAIStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!referenceMedia) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/media/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceMedia,
          providerConfig,
        }),
      });

      const data = await res.json();
      if (data.success && data.profile) {
        setStyleProfile(data.profile);
        addMessage({
          sender: "ai",
          text: `Analyzed Reference "${referenceMedia.name}": Extracted Style Profile with ${data.profile.pace} pacing (${data.profile.averageShotDuration}s avg shot), ${data.profile.colorCharacteristics.palette} color tone, and ${data.profile.captionStyle} captions.`,
        });
      }
    } catch (err) {
      console.error("Reference analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToFootage = () => {
    setIsReferenceModalOpen(false);
    setActiveTab("ai");
  };

  return (
    <Dialog open={isReferenceModalOpen} onOpenChange={setIsReferenceModalOpen}>
      <DialogContent className="max-w-2xl bg-studio-900 border-studio-700 text-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <DialogTitle>Reference Video & Style Extraction</DialogTitle>
          </div>
          <DialogDescription className="text-studio-400">
            Upload an inspiration video. The AI will extract its pacing, color scheme, hook structure, and caption aesthetics into a non-destructive Style Profile without copying copyrighted media.
          </DialogDescription>
        </DialogHeader>

        {/* Upload or Selected Reference */}
        <div className="mt-2 flex flex-col gap-3">
          {!referenceMedia ? (
            <MediaUploadZone isReferenceMode />
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-studio-950 border border-studio-800">
              <div className="flex items-center gap-3">
                <div className="w-16 h-10 rounded bg-studio-800 overflow-hidden shrink-0">
                  {referenceMedia.thumbnailUrl ? (
                    <img src={referenceMedia.thumbnailUrl} alt="Ref" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-studio-500 text-xs">Video</div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                    {referenceMedia.name}
                  </span>
                  <span className="text-[10px] text-studio-400 font-mono">
                    {referenceMedia.duration.toFixed(1)}s • {referenceMedia.width}×{referenceMedia.height}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReferenceMedia(null);
                    setStyleProfile(null);
                  }}
                  className="text-xs text-studio-400 hover:text-rose-400"
                >
                  Change
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={isAnalyzing}
                  onClick={handleAnalyze}
                  className="text-xs gap-1.5"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isAnalyzing ? "Analyzing..." : "Analyze Reference"}
                </Button>
              </div>
            </div>
          )}

          {/* Style Profile Details if extracted */}
          {styleProfile && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-studio-950/70 border border-studio-800 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Extracted Style Profile
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Ready to Apply
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-studio-900 border border-studio-800 flex flex-col gap-1">
                  <span className="text-[10px] text-studio-400 font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3 text-blue-400" /> Pacing
                  </span>
                  <span className="font-semibold capitalize text-white">{styleProfile.pace}</span>
                  <span className="text-[10px] text-studio-400 font-mono">
                    ~{styleProfile.averageShotDuration}s per cut
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-studio-900 border border-studio-800 flex flex-col gap-1">
                  <span className="text-[10px] text-studio-400 font-medium flex items-center gap-1">
                    <Palette className="w-3 h-3 text-purple-400" /> Color Grade
                  </span>
                  <span className="font-semibold text-white capitalize">
                    {styleProfile.colorCharacteristics.palette.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-studio-400 font-mono">
                    +{styleProfile.colorCharacteristics.contrast}% contrast
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-studio-900 border border-studio-800 flex flex-col gap-1">
                  <span className="text-[10px] text-studio-400 font-medium">Captions</span>
                  <span className="font-semibold text-white capitalize">
                    {styleProfile.captionStyle.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-studio-400 font-mono">Word-Pop Karaoke</span>
                </div>

                <div className="p-2.5 rounded-lg bg-studio-900 border border-studio-800 flex flex-col gap-1">
                  <span className="text-[10px] text-studio-400 font-medium">Transitions</span>
                  <span className="font-semibold text-white capitalize">
                    {styleProfile.transitionFrequency} Frequency
                  </span>
                  <span className="text-[10px] text-studio-400 font-mono">{styleProfile.transitionType}</span>
                </div>
              </div>

              <p className="text-xs text-studio-300 italic bg-studio-900/60 p-2.5 rounded-lg border border-studio-850">
                "{styleProfile.summary}"
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-studio-850">
                <Button variant="outline" size="sm" onClick={() => setIsReferenceModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleApplyToFootage}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white"
                >
                  <Check className="w-4 h-4" />
                  Use this reference style on my footage
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
