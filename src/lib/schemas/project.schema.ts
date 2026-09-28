import { z } from "zod";
import { ColorGradingParamsSchema, TransitionTypeSchema, AspectRatioPresetSchema } from "./edit-plan.schema";
import { StyleProfileSchema } from "./style-profile.schema";

export const TrackTypeSchema = z.enum([
  "video",
  "overlay",
  "broll",
  "text",
  "caption",
  "audio",
  "music",
  "sfx",
]);

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TrackTypeSchema,
  order: z.number(),
  locked: z.boolean().default(false),
  muted: z.boolean().default(false),
  hidden: z.boolean().default(false),
  solo: z.boolean().default(false),
  volume: z.number().min(0).max(2).default(1),
});

export const ClipTransformSchema = z.object({
  x: z.number().default(0), // offset px or percentage
  y: z.number().default(0),
  scale: z.number().default(1),
  rotation: z.number().default(0), // degrees
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
});

export const ClipEffectsSchema = z.object({
  blur: z.number().min(0).max(50).default(0),
  glow: z.number().min(0).max(100).default(0),
  vignette: z.number().min(0).max(100).default(0),
  grain: z.number().min(0).max(100).default(0),
  chromaticAberration: z.number().min(0).max(50).default(0),
});

export const ClipTransitionSchema = z.object({
  type: TransitionTypeSchema,
  duration: z.number().min(0.1).max(5).default(0.5),
});

export const ClipChromaKeySchema = z.object({
  enabled: z.boolean().default(false),
  keyColor: z.string().default("#00ff00"),
  threshold: z.number().min(0).max(1).default(0.35),
  softness: z.number().min(0).max(1).default(0.15),
  spillReduction: z.number().min(0).max(1).default(0.5),
});

export const TextPayloadSchema = z.object({
  text: z.string().default("Sample Text"),
  fontFamily: z.string().default("Inter"),
  fontSize: z.number().min(12).max(200).default(48),
  fontWeight: z.string().default("700"),
  color: z.string().default("#ffffff"),
  strokeColor: z.string().default("#000000"),
  strokeWidth: z.number().min(0).max(20).default(0),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).default("center"),
  animation: z.enum(["none", "fade", "pop", "slide_up", "typewriter"]).default("none"),
});

export const ClipSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  mediaId: z.string().optional(), // optional if text or solid element
  name: z.string(),
  type: TrackTypeSchema,
  start: z.number().min(0), // position on timeline in seconds
  duration: z.number().positive(), // length on timeline in seconds
  trimStart: z.number().min(0).default(0), // offset inside media
  trimEnd: z.number().min(0).optional(),
  speed: z.number().min(0.1).max(10).default(1),
  volume: z.number().min(0).max(2).default(1),
  muted: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  transform: ClipTransformSchema.default({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
  }),
  colorGrade: ColorGradingParamsSchema.default({
    preset: "natural",
    exposure: 0,
    contrast: 0,
    brightness: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    highlights: 0,
    shadows: 0,
    vignette: 0,
    grain: 0,
  }),
  effects: ClipEffectsSchema.default({
    blur: 0,
    glow: 0,
    vignette: 0,
    grain: 0,
    chromaticAberration: 0,
  }),
  transitionIn: ClipTransitionSchema.optional(),
  transitionOut: ClipTransitionSchema.optional(),
  chromaKey: ClipChromaKeySchema.default({
    enabled: false,
    keyColor: "#00ff00",
    threshold: 0.35,
    softness: 0.15,
    spillReduction: 0.5,
  }),
  textPayload: TextPayloadSchema.optional(),
});

export const ExportSettingsSchema = z.object({
  aspectRatio: AspectRatioPresetSchema.default("9:16"),
  resolution: z.enum(["720p", "1080p", "1440p", "4k", "custom"]).default("1080p"),
  width: z.number().int().default(1080),
  height: z.number().int().default(1920),
  fps: z.enum(["24", "25", "30", "50", "60"]).default("30"),
  codec: z.enum(["h264", "hevc", "webm_vp9"]).default("h264"),
  quality: z.enum(["draft", "standard", "high", "maximum"]).default("high"),
  bitrateMbps: z.number().default(12),
  audioCodec: z.enum(["aac", "opus", "mp3"]).default("aac"),
  audioBitrateKbps: z.number().default(192),
});

export const ProjectSessionSchema = z.object({
  projectId: z.string(),
  title: z.string().default("Untitled Video Project"),
  duration: z.number().default(60),
  aspectRatio: AspectRatioPresetSchema.default("9:16"),
  width: z.number().default(1080),
  height: z.number().default(1920),
  fps: z.number().default(30),
  tracks: z.array(TrackSchema),
  clips: z.array(ClipSchema),
  styleProfile: StyleProfileSchema.optional(),
  exportSettings: ExportSettingsSchema.default({
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
  }),
});

export type TrackType = z.infer<typeof TrackTypeSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Clip = z.infer<typeof ClipSchema>;
export type ClipTransform = z.infer<typeof ClipTransformSchema>;
export type ClipEffects = z.infer<typeof ClipEffectsSchema>;
export type ClipTransition = z.infer<typeof ClipTransitionSchema>;
export type ClipChromaKey = z.infer<typeof ClipChromaKeySchema>;
export type TextPayload = z.infer<typeof TextPayloadSchema>;
export type ExportSettings = z.infer<typeof ExportSettingsSchema>;
export type ProjectSession = z.infer<typeof ProjectSessionSchema>;
