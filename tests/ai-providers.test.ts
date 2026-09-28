import { describe, it, expect } from "vitest";
import { AIProviderFactory } from "@/features/ai/services/ai-provider-factory";
import { validateEditPlan } from "@/lib/timeline/edit-plan-engine";
import { MediaItem } from "@/lib/schemas/media.schema";
import { ProjectSession } from "@/lib/schemas/project.schema";

describe("AI Provider System & Conversational Refinement", () => {
  const dummyProject: ProjectSession = {
    projectId: "test_proj",
    title: "Test",
    duration: 30,
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    tracks: [],
    clips: [],
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

  const dummyMedia: MediaItem[] = [
    {
      id: "video_1",
      name: "raw_footage.mp4",
      type: "video",
      size: 15_000_000,
      mimeType: "video/mp4",
      url: "blob://dummy",
      duration: 20,
      width: 1080,
      height: 1920,
      fps: 30,
      createdAt: Date.now(),
    },
  ];

  it("should instantiate appropriate providers via Factory", () => {
    const localProvider = AIProviderFactory.getProvider({ provider: "smart_heuristic" });
    expect(localProvider.id).toBe("smart_heuristic");

    const openAiProvider = AIProviderFactory.getProvider({ provider: "openai", apiKey: "test" });
    expect(openAiProvider.id).toBe("openai");

    const claudeProvider = AIProviderFactory.getProvider({ provider: "anthropic", apiKey: "test" });
    expect(claudeProvider.id).toBe("anthropic");

    const mcpProvider = AIProviderFactory.getProvider({ provider: "mcp", mcpServerUrl: "http://localhost:3001" });
    expect(mcpProvider.id).toBe("mcp");
  });

  it("should generate a valid EditPlan with SmartHeuristicProvider", async () => {
    const provider = AIProviderFactory.getProvider({ provider: "smart_heuristic" });
    const result = await provider.generateEditPlan({
      prompt: "Make a 30 second Instagram Reel with dynamic captions, warm colors, and remove silences",
      mediaItems: dummyMedia,
      currentProject: dummyProject,
    });

    expect(result.plan).toBeDefined();
    const validation = validateEditPlan(result.plan);
    expect(validation.valid).toBe(true);

    // Verify operations generated
    const hasTrim = result.plan.operations.some((op) => op.type === "trim");
    const hasCaptions = result.plan.operations.some((op) => op.type === "caption");
    const hasColor = result.plan.operations.some((op) => op.type === "color_grade");
    const hasSilence = result.plan.operations.some((op) => op.type === "remove_silence");

    expect(hasTrim).toBe(true);
    expect(hasCaptions).toBe(true);
    expect(hasColor).toBe(true);
    expect(hasSilence).toBe(true);
  });

  it("should refine edit plan on conversational feedback", async () => {
    const provider = AIProviderFactory.getProvider({ provider: "smart_heuristic" });

    // Step 1: initial plan
    const initial = await provider.generateEditPlan({
      prompt: "Make a 30 second reel with captions",
      mediaItems: dummyMedia,
      currentProject: dummyProject,
    });

    const initialCaptionOp = initial.plan.operations.find((op) => op.type === "caption");
    const initialFontSize = initialCaptionOp?.type === "caption" ? initialCaptionOp.fontSize : 36;

    // Step 2: User feedback "Captions are too large, reduce size"
    const refined = await provider.refineEditPlan({
      feedback: "Captions are too large, reduce them",
      currentPlan: initial.plan,
      currentProject: dummyProject,
      conversationHistory: [],
      mediaItems: dummyMedia,
    });

    const refinedCaptionOp = refined.plan.operations.find((op) => op.type === "caption");
    const refinedFontSize = refinedCaptionOp?.type === "caption" ? refinedCaptionOp.fontSize : 36;

    expect(refinedFontSize).toBeLessThan(initialFontSize);
    expect(refined.explanation).toContain("Reduced caption size");
  });

  it("should extract a StyleProfile from a reference video", async () => {
    const provider = AIProviderFactory.getProvider({ provider: "smart_heuristic" });
    const refMedia: MediaItem = {
      id: "ref_1",
      name: "viral_reference.mp4",
      type: "reference_video",
      size: 25_000_000,
      mimeType: "video/mp4",
      url: "blob://ref",
      duration: 35,
      width: 1080,
      height: 1920,
      createdAt: Date.now(),
    };

    const style = await provider.analyzeReference({ referenceMedia: refMedia });
    expect(style.pace).toBe("fast");
    expect(style.captionStyle).toBe("bold_dynamic");
    expect(style.colorCharacteristics.palette).toBe("high_contrast_warm");
  });
});
