"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/state/use-editor-store";
import { useProjectStore } from "@/lib/state/use-project-store";
import { BrowserRenderEngine, RenderProgress } from "../engines/browser-render-engine";
import { Download, Loader2, Play, CheckCircle2, Film, XCircle, Sliders } from "lucide-react";
import { ExportSettings } from "@/lib/schemas/project.schema";

export function ExportDialog() {
  const { isExportModalOpen, setIsExportModalOpen } = useEditorStore();
  const { project, mediaItems, updateExportSettings } = useProjectStore();

  const settings = project.exportSettings;

  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [renderEngine, setRenderEngine] = useState<BrowserRenderEngine | null>(null);

  // Compute estimated file size based on duration and bitrate
  const durationSec = project.duration || 30;
  const estimatedMB = (durationSec * (settings.bitrateMbps || 12)) / 8;

  const handleStartExport = async () => {
    setIsRendering(true);
    setExportedBlob(null);
    setExportedUrl(null);

    const engine = new BrowserRenderEngine();
    setRenderEngine(engine);

    try {
      const blob = await engine.renderVideo({
        project,
        mediaItems,
        settings,
        onProgress: (p) => setProgress(p),
      });

      const url = URL.createObjectURL(blob);
      setExportedBlob(blob);
      setExportedUrl(url);
    } catch (err: any) {
      console.error("Export error:", err);
      if (err.message !== "Rendering cancelled by user.") {
        alert(`Export failed: ${err.message}`);
      }
    } finally {
      setIsRendering(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    if (renderEngine) {
      renderEngine.cancel();
    }
    setIsRendering(false);
    setProgress(null);
  };

  const handleDownload = () => {
    if (!exportedUrl) return;
    const a = document.createElement("a");
    a.href = exportedUrl;
    const ext = settings.codec === "webm_vp9" ? "webm" : "mp4";
    a.download = `${project.title.replace(/\s+/g, "_")}_${settings.resolution}.${ext}`;
    a.click();
  };

  return (
    <Dialog
      open={isExportModalOpen}
      onOpenChange={(open) => {
        if (!isRendering) setIsExportModalOpen(open);
      }}
    >
      <DialogContent className="max-w-xl bg-studio-900 border-studio-700 text-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-accent-blue" />
            <DialogTitle>Manual Video Export</DialogTitle>
          </div>
          <DialogDescription className="text-studio-400">
            Export is 100% manual. Configure your rendering parameters, review the preview, and download when you are ready.
          </DialogDescription>
        </DialogHeader>

        {exportedUrl ? (
          /* Render Complete Preview & Download Screen */
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Rendering Finished Successfully! Preview your final video below:</span>
            </div>

            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-studio-800 flex items-center justify-center">
              <video
                src={exportedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-studio-400 font-mono">
              <span>Resolution: {settings.width}×{settings.height}</span>
              <span>Codec: {settings.codec.toUpperCase()}</span>
              <span>Size: ~{(exportedBlob?.size ? (exportedBlob.size / 1024 / 1024).toFixed(1) : estimatedMB.toFixed(1))} MB</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-studio-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setExportedUrl(null);
                  setExportedBlob(null);
                }}
              >
                Export Again
              </Button>
              <Button variant="primary" size="sm" onClick={handleDownload} className="gap-1.5">
                <Download className="w-4 h-4" />
                Download Video
              </Button>
            </div>
          </div>
        ) : isRendering ? (
          /* Live Progress Modal */
          <div className="flex flex-col gap-4 py-6 text-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
              <span className="text-sm font-semibold text-white">
                {progress?.status || "Compositing video frames..."}
              </span>
              <span className="text-xs text-studio-400 font-mono">
                Frame {progress?.currentFrame} / {progress?.totalFrames} • ETA: {progress?.etaSeconds}s
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-studio-800 overflow-hidden">
              <div
                style={{ width: `${progress?.percent || 0}%` }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-150"
              />
            </div>

            <div className="flex justify-center mt-2">
              <Button variant="danger" size="sm" onClick={handleCancel} className="gap-1.5">
                <XCircle className="w-4 h-4" />
                Cancel Export
              </Button>
            </div>
          </div>
        ) : (
          /* Export Configuration Screen */
          <div className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Aspect Ratio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-studio-400 font-medium">Aspect Ratio</label>
                <select
                  value={settings.aspectRatio}
                  onChange={(e) => {
                    const ratio = e.target.value as any;
                    let width = 1080;
                    let height = 1920;
                    if (ratio === "16:9") {
                      width = 1920;
                      height = 1080;
                    } else if (ratio === "1:1") {
                      width = 1080;
                      height = 1080;
                    }
                    updateExportSettings({ aspectRatio: ratio, width, height });
                  }}
                  className="bg-studio-950 border border-studio-700 rounded-md px-2.5 py-1.5 text-white outline-none focus:border-accent-blue"
                >
                  <option value="9:16">9:16 Vertical Reel (1080×1920)</option>
                  <option value="16:9">16:9 Landscape YouTube (1920×1080)</option>
                  <option value="1:1">1:1 Square Feed (1080×1080)</option>
                  <option value="4:5">4:5 Portrait (1080×1350)</option>
                </select>
              </div>

              {/* Resolution */}
              <div className="flex flex-col gap-1.5">
                <label className="text-studio-400 font-medium">Resolution</label>
                <select
                  value={settings.resolution}
                  onChange={(e) => updateExportSettings({ resolution: e.target.value as any })}
                  className="bg-studio-950 border border-studio-700 rounded-md px-2.5 py-1.5 text-white outline-none focus:border-accent-blue"
                >
                  <option value="720p">720p HD</option>
                  <option value="1080p">1080p Full HD (Recommended)</option>
                  <option value="1440p">1440p 2K QHD</option>
                  <option value="4k">4K Ultra HD</option>
                </select>
              </div>

              {/* FPS */}
              <div className="flex flex-col gap-1.5">
                <label className="text-studio-400 font-medium">Framerate (FPS)</label>
                <select
                  value={settings.fps}
                  onChange={(e) => updateExportSettings({ fps: e.target.value as any })}
                  className="bg-studio-950 border border-studio-700 rounded-md px-2.5 py-1.5 text-white outline-none focus:border-accent-blue"
                >
                  <option value="24">24 FPS (Cinematic film)</option>
                  <option value="30">30 FPS (Standard video)</option>
                  <option value="60">60 FPS (Ultra smooth)</option>
                </select>
              </div>

              {/* Quality Preset */}
              <div className="flex flex-col gap-1.5">
                <label className="text-studio-400 font-medium">Encoding Quality</label>
                <select
                  value={settings.quality}
                  onChange={(e) => {
                    const q = e.target.value as any;
                    const bitrate = q === "draft" ? 6 : q === "standard" ? 10 : q === "high" ? 16 : 24;
                    updateExportSettings({ quality: q, bitrateMbps: bitrate });
                  }}
                  className="bg-studio-950 border border-studio-700 rounded-md px-2.5 py-1.5 text-white outline-none focus:border-accent-blue"
                >
                  <option value="draft">Draft (Fast render, 6 Mbps)</option>
                  <option value="standard">Standard (10 Mbps)</option>
                  <option value="high">High Quality (16 Mbps)</option>
                  <option value="maximum">Maximum Fidelity (24 Mbps)</option>
                </select>
              </div>
            </div>

            {/* Estimated File Size summary */}
            <div className="p-3 rounded-lg bg-studio-950 border border-studio-800 flex items-center justify-between text-xs font-mono">
              <span className="text-studio-400">Estimated File Size:</span>
              <span className="text-white font-semibold">~{estimatedMB.toFixed(1)} MB</span>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-studio-800">
              <Button variant="outline" size="sm" onClick={() => setIsExportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartExport}
                className="bg-blue-600 hover:bg-blue-500 font-semibold gap-1.5"
              >
                <Download className="w-4 h-4" />
                Render & Export
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
