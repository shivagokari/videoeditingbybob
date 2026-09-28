import { z } from "zod";

export const AspectRatioPresetSchema = z.enum([
  "9:16",
  "16:9",
  "1:1",
  "4:5",
  "4:3",
  "3:4",
  "21:9",
  "custom",
]);

export const CaptionStylePresetSchema = z.enum([
  "bold_center",
  "karaoke_pop",
  "minimal_bottom",
  "podcast",
  "cinematic",
  "dynamic_yellow",
]);

export const TransitionTypeSchema = z.enum([
  "cut",
  "fade",
  "dissolve",
  "crossfade",
  "dip_to_black",
  "dip_to_white",
  "zoom",
  "push",
  "slide",
  "wipe",
]);

export const ColorPresetSchema = z.enum([
  "cinematic_warm",
  "moody_teal_orange",
  "vintage_film",
  "clean_commercial",
  "social_punch",
  "noir",
  "cyberpunk",
  "natural",
  "custom",
]);

export const ColorGradingParamsSchema = z.object({
  preset: ColorPresetSchema.optional().default("natural"),
  exposure: z.number().min(-100).max(100).default(0),
  contrast: z.number().min(-100).max(100).default(0),
  brightness: z.number().min(-100).max(100).default(0),
  saturation: z.number().min(-100).max(100).default(0),
  temperature: z.number().min(-100).max(100).default(0),
  tint: z.number().min(-100).max(100).default(0),
  highlights: z.number().min(-100).max(100).default(0),
  shadows: z.number().min(-100).max(100).default(0),
  vignette: z.number().min(0).max(100).default(0),
  grain: z.number().min(0).max(100).default(0),
});

export const KeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.number(),
  easing: z.enum(["linear", "ease_in", "ease_out", "ease_in_out"]).default("ease_in_out"),
});

export const TrimOperationSchema = z.object({
  type: z.literal("trim"),
  sourceId: z.string(),
  clipId: z.string().optional(),
  start: z.number().min(0),
  end: z.number().min(0),
  targetTrack: z.string().optional().default("video-1"),
  speed: z.number().positive().default(1).optional(),
});

export const SplitOperationSchema = z.object({
  type: z.literal("split"),
  clipId: z.string(),
  atTime: z.number().min(0),
});

export const RemoveSilenceOperationSchema = z.object({
  type: z.literal("remove_silence"),
  sourceId: z.string(),
  threshold: z.number().min(-80).max(0).default(-38).optional(),
  minSilenceDuration: z.number().positive().default(0.4).optional(),
});

export const WordTimingSchema = z.object({
  word: z.string(),
  start: z.number().min(0),
  end: z.number().min(0),
});

export const CaptionSegmentSchema = z.object({
  id: z.string().optional(),
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
  words: z.array(WordTimingSchema).optional(),
});

export const CaptionOperationSchema = z.object({
  type: z.literal("caption"),
  style: CaptionStylePresetSchema.default("bold_center").optional(),
  animation: z.enum(["none", "word_pop", "fade", "bounce", "highlight"]).default("word_pop").optional(),
  fontFamily: z.string().default("Inter").optional(),
  fontSize: z.number().min(12).max(120).default(36).optional(),
  textColor: z.string().default("#ffffff").optional(),
  highlightColor: z.string().default("#facc15").optional(),
  strokeColor: z.string().default("#000000").optional(),
  strokeWidth: z.number().min(0).max(12).default(4).optional(),
  backgroundColor: z.string().optional(),
  position: z.enum(["top", "center", "bottom"]).default("bottom").optional(),
  yOffsetPercent: z.number().min(-50).max(50).default(15).optional(),
  segments: z.array(CaptionSegmentSchema).default([]),
});

export const TransitionOperationSchema = z.object({
  type: z.literal("transition"),
  fromClipId: z.string().optional(),
  toClipId: z.string().optional(),
  transitionType: TransitionTypeSchema.default("dissolve").optional(),
  duration: z.number().positive().default(0.5).optional(),
  atTime: z.number().min(0).optional(),
});

export const ColorGradeOperationSchema = z.object({
  type: z.literal("color_grade"),
  targetClipId: z.string().optional(), // undefined means global project grade
  grade: ColorGradingParamsSchema,
});

export const SpeedOperationSchema = z.object({
  type: z.literal("speed"),
  clipId: z.string(),
  speed: z.number().min(0.1).max(10).default(1).optional(),
  preservePitch: z.boolean().default(true).optional(),
});

export const AudioAdjustOperationSchema = z.object({
  type: z.literal("audio_adjust"),
  clipId: z.string(),
  volume: z.number().min(0).max(2).default(1).optional(),
  mute: z.boolean().default(false).optional(),
  fadeIn: z.number().min(0).default(0).optional(),
  fadeOut: z.number().min(0).default(0).optional(),
  ducking: z.boolean().default(false).optional(),
  duckingUnderSpeechDb: z.number().default(-14).optional(),
  enhanceVoice: z.boolean().default(false).optional(),
  noiseReduction: z.boolean().default(false).optional(),
});

export const ChromaKeyOperationSchema = z.object({
  type: z.literal("chroma_key"),
  clipId: z.string(),
  keyColor: z.string().default("#00ff00").optional(),
  threshold: z.number().min(0).max(1).default(0.4).optional(),
  softness: z.number().min(0).max(1).default(0.1).optional(),
  spillReduction: z.number().min(0).max(1).default(0.5).optional(),
  replacementType: z.enum(["color", "image", "video", "transparent"]).default("transparent").optional(),
  replacementValue: z.string().optional(),
});

export const OverlayOperationSchema = z.object({
  type: z.literal("overlay"),
  overlayId: z.string().optional(),
  kind: z.enum(["text", "image", "sticker", "shape", "broll"]),
  sourceId: z.string().optional(),
  content: z.string().optional(), // text content or asset URL
  start: z.number().min(0),
  duration: z.number().positive(),
  position: z.object({
    x: z.number().default(50), // percentage 0-100
    y: z.number().default(50),
  }),
  scale: z.number().default(1),
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
});

export const OperationSchema = z.discriminatedUnion("type", [
  TrimOperationSchema,
  SplitOperationSchema,
  RemoveSilenceOperationSchema,
  CaptionOperationSchema,
  TransitionOperationSchema,
  ColorGradeOperationSchema,
  SpeedOperationSchema,
  AudioAdjustOperationSchema,
  ChromaKeyOperationSchema,
  OverlayOperationSchema,
]);

export const EditPlanSchema = z.object({
  version: z.literal("1.0").default("1.0"),
  title: z.string().default("AI Edit Plan"),
  description: z.string().optional(),
  project: z.object({
    aspectRatio: AspectRatioPresetSchema.default("9:16"),
    fps: z.number().int().min(12).max(120).default(30),
    durationTarget: z.number().positive().optional(),
    width: z.number().int().positive().default(1080),
    height: z.number().int().positive().default(1920),
  }),
  operations: z.array(OperationSchema).default([]),
  notes: z.array(z.string()).default([]),
});

export type AspectRatioPreset = z.infer<typeof AspectRatioPresetSchema>;
export type CaptionStylePreset = z.infer<typeof CaptionStylePresetSchema>;
export type TransitionType = z.infer<typeof TransitionTypeSchema>;
export type ColorPreset = z.infer<typeof ColorPresetSchema>;
export type ColorGradingParams = z.infer<typeof ColorGradingParamsSchema>;
export type Operation = z.infer<typeof OperationSchema>;
export type EditPlan = z.infer<typeof EditPlanSchema>;
export type CaptionSegment = z.infer<typeof CaptionSegmentSchema>;
export type WordTiming = z.infer<typeof WordTimingSchema>;
