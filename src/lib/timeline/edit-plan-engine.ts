import { EditPlan, EditPlanSchema, Operation } from "../schemas/edit-plan.schema";
import { Clip, ProjectSession, Track } from "../schemas/project.schema";
import { MediaItem } from "../schemas/media.schema";
import { COLOR_PRESETS } from "../utils/color-filters";

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  plan?: EditPlan;
}

export function validateEditPlan(rawPlan: unknown): ValidationResult {
  const result = EditPlanSchema.safeParse(rawPlan);
  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join(".") || "root"}: ${err.message}`
    );
    return { valid: false, errors };
  }
  return { valid: true, plan: result.data };
}

/**
 * Applies an EditPlan to the current ProjectSession without destroying original media.
 */
export function applyEditPlanToProject(
  currentProject: ProjectSession,
  plan: EditPlan,
  mediaItems: MediaItem[]
): ProjectSession {
  // Deep clone project state
  const updated: ProjectSession = JSON.parse(JSON.stringify(currentProject));

  // 1. Update project format/dimensions if specified
  if (plan.project) {
    updated.aspectRatio = plan.project.aspectRatio;
    updated.fps = plan.project.fps;
    if (plan.project.width && plan.project.height) {
      updated.width = plan.project.width;
      updated.height = plan.project.height;
    }
  }

  // Ensure standard video track exists
  ensureDefaultTracks(updated);

  // 2. Process operations sequentially
  for (const op of plan.operations) {
    switch (op.type) {
      case "trim": {
        const videoTrack = getOrCreateTrack(updated, "video");
        const media = mediaItems.find((m) => m.id === op.sourceId);
        const duration = Math.max(0.1, (op.end - op.start) / (op.speed || 1));
        
        // Find existing clip or create new one
        const existingClipIndex = op.clipId
          ? updated.clips.findIndex((c) => c.id === op.clipId)
          : -1;

        if (existingClipIndex >= 0) {
          const clip = updated.clips[existingClipIndex];
          clip.trimStart = op.start;
          clip.trimEnd = op.end;
          clip.duration = duration;
          clip.speed = op.speed || 1;
        } else {
          // Calculate start position on track (append after last video clip)
          const targetTrackId = op.targetTrack || videoTrack.id;
          const trackClips = updated.clips.filter((c) => c.trackId === targetTrackId);
          const lastEnd = trackClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);

          const newClip: Clip = {
            id: op.clipId || `clip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            trackId: targetTrackId,
            mediaId: op.sourceId,
            name: media ? media.name : "Video Clip",
            type: "video",
            start: lastEnd,
            duration,
            trimStart: op.start,
            trimEnd: op.end,
            speed: op.speed || 1,
            volume: 1,
            muted: false,
            opacity: 1,
            transform: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false },
            colorGrade: { ...COLOR_PRESETS.natural },
            effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
            chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
          };
          updated.clips.push(newClip);
        }
        break;
      }

      case "split": {
        const clip = updated.clips.find((c) => c.id === op.clipId);
        if (clip && op.atTime > clip.start && op.atTime < clip.start + clip.duration) {
          const splitOffset = op.atTime - clip.start;
          const firstDuration = splitOffset;
          const secondDuration = clip.duration - splitOffset;

          const originalTrimStart = clip.trimStart;
          const firstEnd = originalTrimStart + firstDuration * clip.speed;

          clip.duration = firstDuration;
          clip.trimEnd = firstEnd;

          const secondClip: Clip = {
            ...JSON.parse(JSON.stringify(clip)),
            id: `clip_split_${Date.now()}`,
            start: op.atTime,
            duration: secondDuration,
            trimStart: firstEnd,
          };
          updated.clips.push(secondClip);
        }
        break;
      }

      case "remove_silence": {
        // Find clips referencing sourceId and trim around silence
        const targetMedia = mediaItems.find((m) => m.id === op.sourceId);
        if (targetMedia && targetMedia.silenceIntervals && targetMedia.silenceIntervals.length > 0) {
          // Adjust clips or split to exclude silence
          const silences = targetMedia.silenceIntervals;
          const relevantClips = updated.clips.filter((c) => c.mediaId === op.sourceId);
          // For simplicity and stability, remove sections overlapping silence
          for (const s of silences) {
            if (s.end - s.start >= (op.minSilenceDuration ?? 0.4)) {
              for (const c of relevantClips) {
                if (c.trimStart < s.end && (c.trimEnd || c.trimStart + c.duration) > s.start) {
                  // Mark or adjust
                  c.duration = Math.max(0.5, c.duration - (s.end - s.start));
                }
              }
            }
          }
        }
        break;
      }

      case "caption": {
        const captionTrack = getOrCreateTrack(updated, "caption");
        // Remove old captions on caption track and add new ones
        updated.clips = updated.clips.filter((c) => c.trackId !== captionTrack.id);
        
        for (let i = 0; i < op.segments.length; i++) {
          const seg = op.segments[i];
          const segDuration = Math.max(0.2, seg.end - seg.start);
          const captionClip: Clip = {
            id: `caption_${i + 1}`,
            trackId: captionTrack.id,
            name: `Caption ${i + 1}`,
            type: "caption",
            start: seg.start,
            duration: segDuration,
            trimStart: 0,
            speed: 1,
            volume: 1,
            muted: false,
            opacity: 1,
            transform: { x: 0, y: op.yOffsetPercent || 15, scale: 1, rotation: 0, flipX: false, flipY: false },
            colorGrade: { ...COLOR_PRESETS.natural },
            effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
            chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
            textPayload: {
              text: seg.text,
              fontFamily: op.fontFamily || "Inter",
              fontSize: op.fontSize || 36,
              fontWeight: "800",
              color: op.textColor || "#ffffff",
              strokeColor: op.strokeColor || "#000000",
              strokeWidth: op.strokeWidth || 4,
              backgroundColor: op.backgroundColor,
              textAlign: "center",
              animation: op.animation === "word_pop" ? "pop" : "none",
            },
          };
          updated.clips.push(captionClip);
        }
        break;
      }

      case "transition": {
        if (op.fromClipId) {
          const fromClip = updated.clips.find((c) => c.id === op.fromClipId);
          if (fromClip) {
            fromClip.transitionOut = {
              type: op.transitionType || "dissolve",
              duration: op.duration || 0.5,
            };
          }
        }
        if (op.toClipId) {
          const toClip = updated.clips.find((c) => c.id === op.toClipId);
          if (toClip) {
            toClip.transitionIn = {
              type: op.transitionType || "dissolve",
              duration: op.duration || 0.5,
            };
          }
        }
        break;
      }

      case "color_grade": {
        const presetGrade = COLOR_PRESETS[op.grade.preset || "natural"] || COLOR_PRESETS.natural;
        const mergedGrade = { ...presetGrade, ...op.grade };

        if (op.targetClipId) {
          const target = updated.clips.find((c) => c.id === op.targetClipId);
          if (target) {
            target.colorGrade = mergedGrade;
          }
        } else {
          // Apply to all video clips
          for (const clip of updated.clips) {
            if (clip.type === "video" || clip.type === "broll") {
              clip.colorGrade = { ...mergedGrade };
            }
          }
        }
        break;
      }

      case "speed": {
        const clip = updated.clips.find((c) => c.id === op.clipId);
        if (clip) {
          const oldSpeed = clip.speed || 1;
          const originalSourceDuration = clip.duration * oldSpeed;
          const newSpeed = op.speed || 1;
          clip.speed = newSpeed;
          clip.duration = originalSourceDuration / newSpeed;
        }
        break;
      }

      case "audio_adjust": {
        const clip = updated.clips.find((c) => c.id === op.clipId);
        if (clip) {
          clip.volume = op.volume !== undefined ? op.volume : clip.volume;
          clip.muted = op.mute !== undefined ? op.mute : clip.muted;
        }
        break;
      }

      case "chroma_key": {
        const clip = updated.clips.find((c) => c.id === op.clipId);
        if (clip) {
          clip.chromaKey = {
            enabled: true,
            keyColor: op.keyColor || "#00ff00",
            threshold: op.threshold || 0.35,
            softness: op.softness || 0.15,
            spillReduction: op.spillReduction || 0.5,
          };
        }
        break;
      }

      case "overlay": {
        const overlayTrack = getOrCreateTrack(updated, "overlay");
        const newOverlayClip: Clip = {
          id: op.overlayId || `overlay_${Date.now()}`,
          trackId: overlayTrack.id,
          name: op.kind === "text" ? (op.content || "Text") : "Overlay Item",
          type: "overlay",
          start: op.start,
          duration: op.duration,
          trimStart: 0,
          speed: 1,
          volume: 1,
          muted: false,
          opacity: op.opacity,
          transform: {
            x: (op.position.x - 50) * 10,
            y: (op.position.y - 50) * 10,
            scale: op.scale,
            rotation: op.rotation,
            flipX: false,
            flipY: false,
          },
          colorGrade: { ...COLOR_PRESETS.natural },
          effects: { blur: 0, glow: 0, vignette: 0, grain: 0, chromaticAberration: 0 },
          chromaKey: { enabled: false, keyColor: "#00ff00", threshold: 0.35, softness: 0.15, spillReduction: 0.5 },
          textPayload: op.kind === "text" ? {
            text: op.content || "Title",
            fontFamily: "Inter",
            fontSize: 42,
            fontWeight: "700",
            color: "#ffffff",
            strokeColor: "#000000",
            strokeWidth: 2,
            textAlign: "center",
            animation: "fade",
          } : undefined,
        };
        updated.clips.push(newOverlayClip);
        break;
      }
    }
  }

  // Recalculate total project duration
  const maxEnd = updated.clips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
  updated.duration = Math.max(10, Math.ceil(maxEnd));

  return updated;
}

function getOrCreateTrack(project: ProjectSession, type: Track["type"]): Track {
  const existing = project.tracks.find((t) => t.type === type);
  if (existing) return existing;

  let newTrack: Track;
  if (type === "caption") {
    newTrack = { id: "track_text", name: "Captions & Text", type: "caption", order: 0, locked: false, muted: false, hidden: false, solo: false, volume: 1 };
    project.tracks.unshift(newTrack);
  } else if (type === "overlay") {
    newTrack = { id: "track_overlay", name: "Overlays & B-Roll", type: "overlay", order: 0.5, locked: false, muted: false, hidden: false, solo: false, volume: 1 };
    project.tracks.unshift(newTrack);
  } else if (type === "audio") {
    newTrack = { id: "track_audio_1", name: "Speech & Audio", type: "audio", order: 2, locked: false, muted: false, hidden: false, solo: false, volume: 1 };
    project.tracks.push(newTrack);
  } else if (type === "music") {
    newTrack = { id: "track_music", name: "Music / Ambience", type: "music", order: 3, locked: false, muted: false, hidden: false, solo: false, volume: 1 };
    project.tracks.push(newTrack);
  } else {
    newTrack = { id: "track_video_1", name: "Main Video (V1)", type: "video", order: 1, locked: false, muted: false, hidden: false, solo: false, volume: 1 };
    project.tracks.push(newTrack);
  }

  return newTrack;
}

function ensureDefaultTracks(project: ProjectSession) {
  if (!project.tracks || project.tracks.length === 0) {
    project.tracks = [
      { id: "track_video_1", name: "Main Video (V1)", type: "video", order: 1, locked: false, muted: false, hidden: false, solo: false, volume: 1 },
    ];
  }
}
