import { z } from "zod";

export const MediaTypeSchema = z.enum(["video", "audio", "image", "subtitle", "reference_video"]);

export const MediaItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: MediaTypeSchema,
  size: z.number(),
  mimeType: z.string(),
  url: z.string(), // Object URL
  duration: z.number().default(0), // seconds
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  sampleRate: z.number().optional(),
  audioChannels: z.number().optional(),
  codec: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  createdAt: z.number().default(() => Date.now()),
  // Extracted scene timestamps or audio analysis
  scenes: z.array(z.object({ start: z.number(), end: z.number(), label: z.string().optional() })).optional(),
  silenceIntervals: z.array(z.object({ start: z.number(), end: z.number() })).optional(),
  transcript: z.array(z.object({ start: z.number(), end: z.number(), text: z.string() })).optional(),
});

export type MediaType = z.infer<typeof MediaTypeSchema>;
export type MediaItem = z.infer<typeof MediaItemSchema>;
