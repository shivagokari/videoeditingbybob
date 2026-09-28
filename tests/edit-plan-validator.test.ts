import { describe, it, expect } from "vitest";
import { validateEditPlan } from "@/lib/timeline/edit-plan-engine";
import { EditPlan } from "@/lib/schemas/edit-plan.schema";

describe("EditPlan Validation Engine", () => {
  it("should validate a well-formed EditPlan", () => {
    const validPlan: EditPlan = {
      version: "1.0",
      title: "Sample 30s Reel",
      project: {
        aspectRatio: "9:16",
        fps: 30,
        durationTarget: 30,
        width: 1080,
        height: 1920,
      },
      operations: [
        {
          type: "trim",
          sourceId: "video_001",
          start: 0,
          end: 15.5,
          speed: 1,
          targetTrack: "video-1",
        },
        {
          type: "remove_silence",
          sourceId: "video_001",
          threshold: -38,
          minSilenceDuration: 0.4,
        },
        {
          type: "caption",
          style: "bold_center",
          animation: "word_pop",
          fontFamily: "Inter",
          fontSize: 36,
          textColor: "#ffffff",
          highlightColor: "#facc15",
          strokeColor: "#000000",
          strokeWidth: 4,
          position: "bottom",
          yOffsetPercent: 15,
          segments: [
            {
              start: 0.5,
              end: 2.5,
              text: "Hello world!",
              words: [{ word: "Hello", start: 0.5, end: 1.5 }, { word: "world!", start: 1.5, end: 2.5 }],
            },
          ],
        },
        {
          type: "transition",
          transitionType: "zoom",
          duration: 0.35,
        },
        {
          type: "color_grade",
          grade: {
            preset: "cinematic_warm",
            exposure: 5,
            contrast: 15,
            brightness: 0,
            saturation: 10,
            temperature: 20,
            tint: 0,
            highlights: 0,
            shadows: 0,
            vignette: 20,
            grain: 5,
          },
        },
      ],
      notes: ["Auto cut created"],
    };

    const result = validateEditPlan(validPlan);
    expect(result.valid).toBe(true);
    expect(result.plan).toBeDefined();
    expect(result.plan?.operations.length).toBe(5);
  });

  it("should reject an EditPlan with invalid operation types or missing required fields", () => {
    const invalidPlan = {
      version: "1.0",
      project: {
        aspectRatio: "invalid_ratio", // invalid
      },
      operations: [
        {
          type: "trim",
          // missing sourceId, start, end
        },
      ],
    };

    const result = validateEditPlan(invalidPlan);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});
