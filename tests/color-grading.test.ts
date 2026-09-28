import { describe, it, expect } from "vitest";
import { buildCssFilter, COLOR_PRESETS } from "@/lib/utils/color-filters";

describe("Color Grading & CSS Filter Engine", () => {
  it("should calculate CSS filters correctly for natural preset", () => {
    const natural = COLOR_PRESETS.natural;
    const filterStr = buildCssFilter(natural);
    expect(filterStr).toContain("brightness(1.00)");
    expect(filterStr).toContain("contrast(1.00)");
    expect(filterStr).toContain("saturate(1.00)");
  });

  it("should compute sepia and warmth for cinematic warm preset", () => {
    const warm = COLOR_PRESETS.cinematic_warm;
    const filterStr = buildCssFilter(warm);
    expect(filterStr).toContain("sepia");
    expect(filterStr).toContain("saturate(1.12)");
  });

  it("should compute negative saturation for noir preset", () => {
    const noir = COLOR_PRESETS.noir;
    const filterStr = buildCssFilter(noir);
    expect(filterStr).toContain("saturate(0.00)");
  });
});
