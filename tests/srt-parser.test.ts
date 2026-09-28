import { describe, it, expect } from "vitest";
import { parseSrtOrVtt, exportToSrt, parseSrtTimestamp, formatSrtTimestamp } from "@/lib/utils/srt-parser";

describe("SRT and VTT Subtitle Parser Engine", () => {
  it("should parse SRT timestamps accurately", () => {
    const ts = "00:01:23,450";
    const seconds = parseSrtTimestamp(ts);
    expect(seconds).toBeCloseTo(83.45, 2);

    const formatted = formatSrtTimestamp(seconds);
    expect(formatted).toBe("00:01:23,450");
  });

  it("should parse multi-line SRT text into structured CaptionSegments", () => {
    const srtSample = `
1
00:00:01,000 --> 00:00:03,500
Welcome to AI Video Studio.

2
00:00:04,200 --> 00:00:07,800
Edit videos with conversational AI.
    `;

    const segments = parseSrtOrVtt(srtSample);
    expect(segments.length).toBe(2);

    expect(segments[0].start).toBe(1.0);
    expect(segments[0].end).toBe(3.5);
    expect(segments[0].text).toBe("Welcome to AI Video Studio.");
    expect(segments[0].words?.length).toBe(5);

    expect(segments[1].start).toBe(4.2);
    expect(segments[1].end).toBe(7.8);
    expect(segments[1].text).toBe("Edit videos with conversational AI.");
  });

  it("should export segments to valid SRT text", () => {
    const segments = [
      { id: "1", start: 0.5, end: 2.5, text: "First caption line" },
      { id: "2", start: 3.0, end: 5.0, text: "Second caption line" },
    ];

    const exported = exportToSrt(segments);
    expect(exported).toContain("00:00:00,500 --> 00:00:02,500");
    expect(exported).toContain("First caption line");
    expect(exported).toContain("00:00:03,000 --> 00:00:05,000");
    expect(exported).toContain("Second caption line");
  });
});
