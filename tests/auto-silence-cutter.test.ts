import { describe, it, expect } from "vitest";
import { autoCutSilencesAndGaps } from "@/features/media/services/auto-silence-cutter";
import { ProjectSession, Clip } from "@/lib/schemas/project.schema";

describe("Auto AI Silence & Gap Cutter", () => {
  const dummyProject: ProjectSession = {
    projectId: "test_proj",
    title: "Test Project",
    duration: 30,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    tracks: [
      { id: "track_video_1", name: "Main Video", type: "video", order: 0, locked: false, muted: false, hidden: false, solo: false, volume: 1 },
    ],
    clips: [
      {
        id: "clip_speech_1",
        trackId: "track_video_1",
        mediaId: "media_video_1",
        name: "Talking Head.mp4",
        type: "video",
        start: 0,
        duration: 20,
        trimStart: 0,
        trimEnd: 20,
        speed: 1,
        volume: 1,
        muted: false,
        opacity: 1,
      },
    ],
    exportSettings: {
      aspectRatio: "9:16",
      resolution: "1080p",
      width: 1080,
      height: 1920,
      fps: "30",
      codec: "h264",
      quality: "high",
      bitrateMbps: 12,
      audioCodec: "aac",
      audioBitrateKbps: 192,
    },
  };

  it("should split and remove silence gaps from a long video clip", async () => {
    const result = await autoCutSilencesAndGaps(dummyProject, []);
    expect(result.silencesRemoved).toBeGreaterThan(0);
    expect(result.timeSavedSeconds).toBeGreaterThan(0);
    expect(result.updatedClips.length).toBeGreaterThan(1);
    expect(result.summary).toContain("AI Auto-Cut removed");

    // Verify clips are sequenced with zero gaps
    const videoClips = result.updatedClips.filter((c) => c.type === "video");
    for (let i = 1; i < videoClips.length; i++) {
      const prev = videoClips[i - 1];
      const curr = videoClips[i];
      expect(Math.abs(curr.start - (prev.start + prev.duration))).toBeLessThan(0.01);
    }
  });

  it("should handle empty project gracefully", async () => {
    const emptyProj: ProjectSession = { ...dummyProject, clips: [] };
    const result = await autoCutSilencesAndGaps(emptyProj, []);
    expect(result.silencesRemoved).toBe(0);
    expect(result.updatedClips.length).toBe(0);
  });
});
