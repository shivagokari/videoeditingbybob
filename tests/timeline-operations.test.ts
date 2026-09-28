import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "@/lib/state/use-project-store";
import { Clip, ProjectSession } from "@/lib/schemas/project.schema";
import { MediaItem } from "@/lib/schemas/media.schema";
import { applyEditPlanToProject } from "@/lib/timeline/edit-plan-engine";
import { EditPlan } from "@/lib/schemas/edit-plan.schema";

describe("Timeline Operations & State Engine", () => {
  beforeEach(() => {
    useProjectStore.getState().clearSession();
  });

  it("should add a clip and recalculate duration", () => {
    const store = useProjectStore.getState();
    const clip: Clip = {
      id: "clip_1",
      trackId: "track_video_1",
      name: "Video 1",
      type: "video",
      start: 0,
      duration: 10,
      trimStart: 0,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
      colorGrade: { preset: "natural", exposure: 0, contrast: 0, brightness: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vignette: 0, grain: 0 },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
    };

    store.addClip(clip);

    const updated = useProjectStore.getState().project;
    expect(updated.clips.length).toBe(1);
    expect(updated.duration).toBeGreaterThanOrEqual(10);
  });

  it("should split a clip at specified timestamp", () => {
    const store = useProjectStore.getState();
    const clip: Clip = {
      id: "clip_split_target",
      trackId: "track_video_1",
      name: "Target Clip",
      type: "video",
      start: 0,
      duration: 10,
      trimStart: 0,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
      colorGrade: { preset: "natural", exposure: 0, contrast: 0, brightness: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vignette: 0, grain: 0 },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
    };

    store.addClip(clip);
    store.splitClip("clip_split_target", 4.0);

    const project = useProjectStore.getState().project;
    expect(project.clips.length).toBe(2);

    const first = project.clips.find((c) => c.id === "clip_split_target");
    expect(first?.duration).toBe(4.0);

    const second = project.clips.find((c) => c.id !== "clip_split_target");
    expect(second?.start).toBe(4.0);
    expect(second?.duration).toBe(6.0);
  });

  it("should support undo and redo on project changes", () => {
    const store = useProjectStore.getState();
    expect(store.canUndo()).toBe(false);

    const clip: Clip = {
      id: "clip_undo_test",
      trackId: "track_video_1",
      name: "Undo Test",
      type: "video",
      start: 0,
      duration: 5,
      trimStart: 0,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
      colorGrade: { preset: "natural", exposure: 0, contrast: 0, brightness: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vignette: 0, grain: 0 },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
    };

    store.addClip(clip);
    expect(useProjectStore.getState().canUndo()).toBe(true);

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.clips.length).toBe(0);

    useProjectStore.getState().redo();
    expect(useProjectStore.getState().project.clips.length).toBe(1);
  });

  it("should ripple delete and shift following clips left", () => {
    const store = useProjectStore.getState();
    const clip1: Clip = {
      id: "c1",
      trackId: "track_video_1",
      name: "Clip 1",
      type: "video",
      start: 0,
      duration: 5,
      trimStart: 0,
      speed: 1,
      volume: 1,
      muted: false,
      opacity: 1,
      transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
      colorGrade: { preset: "natural", exposure: 0, contrast: 0, brightness: 0, saturation: 0, temperature: 0, tint: 0, highlights: 0, shadows: 0, vignette: 0, grain: 0 },
      effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
      chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
    };
    const clip2: Clip = {
      ...clip1,
      id: "c2",
      name: "Clip 2",
      start: 5,
      duration: 8,
    };

    store.addClip(clip1);
    store.addClip(clip2);

    store.rippleDeleteClip("c1");

    const project = useProjectStore.getState().project;
    expect(project.clips.length).toBe(1);
    expect(project.clips[0].id).toBe("c2");
    expect(project.clips[0].start).toBe(0); // Shifted from 5 to 0
  });
});
