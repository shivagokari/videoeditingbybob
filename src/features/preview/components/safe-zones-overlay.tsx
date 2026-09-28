"use client";

import React from "react";
import { Heart, MessageCircle, Share2, Music, Bookmark } from "lucide-react";

interface SafeZonesOverlayProps {
  aspectRatio: string;
}

export function SafeZonesOverlay({ aspectRatio }: SafeZonesOverlayProps) {
  if (aspectRatio !== "9:16") {
    // Show standard 90% Title Safe zone for non-vertical videos
    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[90%] h-[90%] border border-dashed border-white/20 rounded pointer-events-none">
          <span className="text-[9px] text-white/40 font-mono absolute top-1 left-1">Action Safe 90%</span>
        </div>
      </div>
    );
  }

  // 9:16 Instagram Reels / TikTok Simulation Overlay
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 overflow-hidden select-none">
      {/* Top Header Safe boundary */}
      <div className="flex items-center justify-between text-white/40 text-[10px] font-mono border-b border-dashed border-white/20 pb-1">
        <span>Header Safe Area (Top 12%)</span>
        <span>Reels / Shorts</span>
      </div>

      {/* Right Action Icons (Like, Comment, Share) */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 text-white/30">
        <div className="flex flex-col items-center gap-0.5">
          <Heart className="w-5 h-5" />
          <span className="text-[8px]">142K</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <MessageCircle className="w-5 h-5" />
          <span className="text-[8px]">1.2K</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Bookmark className="w-5 h-5" />
          <span className="text-[8px]">9.4K</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Share2 className="w-5 h-5" />
          <span className="text-[8px]">Share</span>
        </div>
        <div className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center animate-spin">
          <Music className="w-3 h-3" />
        </div>
      </div>

      {/* Bottom Caption Safe boundary */}
      <div className="mt-auto border-t border-dashed border-white/20 pt-1 text-white/40 text-[9px] font-mono flex items-center justify-between">
        <span>UI & Title Margin (Bottom 20%)</span>
        <span className="text-amber-400/60 font-semibold">Keep Captions Above Here</span>
      </div>
    </div>
  );
}
