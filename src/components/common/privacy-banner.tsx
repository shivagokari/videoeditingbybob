"use client";

import React, { useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-studio-900/90 border-b border-studio-700/60 text-xs px-4 py-1.5 flex items-center justify-between text-studio-300 backdrop-blur-sm z-30">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-white font-medium">Privacy-First Architecture:</strong> Your media is processed exclusively in your browser session. Raw media, previews, and projects are never permanently stored.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-studio-400 hover:text-white p-0.5 rounded transition-colors"
        title="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
