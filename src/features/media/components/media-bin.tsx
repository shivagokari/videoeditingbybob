"use client";

import React, { useState } from "react";
import { useProjectStore } from "@/lib/state/use-project-store";
import { MediaUploadZone } from "./media-upload-zone";
import { MediaItemCard } from "./media-item-card";
import { MediaType } from "@/lib/schemas/media.schema";

export function MediaBin() {
  const { mediaItems } = useProjectStore();
  const [filter, setFilter] = useState<"all" | MediaType>("all");

  const filteredItems = mediaItems.filter((m) => {
    if (filter === "all") return true;
    return m.type === filter;
  });

  const categories: { label: string; value: "all" | MediaType; count: number }[] = [
    { label: "All", value: "all", count: mediaItems.length },
    { label: "Video", value: "video", count: mediaItems.filter((m) => m.type === "video").length },
    { label: "Audio", value: "audio", count: mediaItems.filter((m) => m.type === "audio").length },
    { label: "Images", value: "image", count: mediaItems.filter((m) => m.type === "image").length },
    { label: "Subtitles", value: "subtitle", count: mediaItems.filter((m) => m.type === "subtitle").length },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3">
      {/* Upload Zone */}
      <MediaUploadZone />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              filter === cat.value
                ? "bg-studio-800 text-slate-900 dark:text-white border border-studio-700 font-semibold"
                : "text-studio-400 hover:text-slate-800 dark:hover:text-studio-200 hover:bg-studio-850"
            }`}
          >
            <span>{cat.label}</span>
            <span className="text-[10px] px-1 rounded-full bg-studio-850 font-mono text-studio-400">
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filteredItems.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-studio-500 text-xs">
            No media files uploaded yet. Drag videos or music into the upload zone above.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredItems.map((item) => (
              <MediaItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
