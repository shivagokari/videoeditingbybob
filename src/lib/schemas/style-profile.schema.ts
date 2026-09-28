import { z } from "zod";

export const StyleProfileSchema = z.object({
  referenceId: z.string().optional(),
  referenceName: z.string().optional(),
  pace: z.enum(["fast", "medium", "slow", "dynamic"]).default("dynamic"),
  averageShotDuration: z.number().positive().default(2.8),
  captionStyle: z.string().default("bold_dynamic"),
  colorCharacteristics: z.object({
    palette: z.string().default("high_contrast_warm"),
    contrast: z.number().default(20),
    saturation: z.number().default(15),
    temperature: z.number().default(10),
  }),
  transitionFrequency: z.enum(["high", "medium", "low", "minimal"]).default("medium"),
  transitionType: z.string().default("zoom"),
  zoomFrequency: z.enum(["high", "medium", "low", "none"]).default("medium"),
  brollFrequency: z.enum(["high", "medium", "low", "none"]).default("high"),
  musicIntensity: z.enum(["high", "medium", "low", "ambient"]).default("medium"),
  speechDensity: z.number().min(0).max(1).default(0.75),
  hookStructure: z.string().default("first_3s_high_energy_hook"),
  outroStructure: z.string().default("clean_cta_fade"),
  aspectRatio: z.string().default("9:16"),
  recommendedFps: z.number().default(30),
  summary: z.string().default("High retention modern social reel style with energetic cuts and dynamic captions."),
});

export type StyleProfile = z.infer<typeof StyleProfileSchema>;
