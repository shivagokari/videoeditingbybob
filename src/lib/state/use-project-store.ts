import { create } from "zustand";
import { ProjectSession, Clip, Track, ExportSettings } from "../schemas/project.schema";
import { MediaItem } from "../schemas/media.schema";
import { EditPlan } from "../schemas/edit-plan.schema";
import { StyleProfile } from "../schemas/style-profile.schema";
import { applyEditPlanToProject } from "../timeline/edit-plan-engine";
import { COLOR_PRESETS } from "../utils/color-filters";

interface ProjectStoreState {
  project: ProjectSession;
  mediaItems: MediaItem[];
  referenceMedia: MediaItem | null;
  styleProfile: StyleProfile | null;
  history: ProjectSession[];
  future: ProjectSession[];

  // Actions
  setProjectTitle: (title: string) => void;
  setAspectRatio: (ratio: ProjectSession["aspectRatio"]) => void;
  addMediaItem: (item: MediaItem) => void;
  removeMediaItem: (id: string) => void;
  setReferenceMedia: (item: MediaItem | null) => void;
  setStyleProfile: (profile: StyleProfile | null) => void;

  addClip: (clip: Clip) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  splitClip: (clipId: string, atTime: number) => void;
  removeClip: (id: string) => void;
  rippleDeleteClip: (id: string) => void;
  duplicateClip: (id: string) => void;
  moveClip: (id: string, newTrackId: string, newStart: number) => void;
  trimClip: (id: string, trimStart: number, duration: number) => void;

  updateTrack: (id: string, updates: Partial<Track>) => void;
  setTracks: (tracks: Track[]) => void;

  applyEditPlan: (plan: EditPlan) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  clearSession: () => void;
}

const DEFAULT_TRACKS: Track[] = [
  { id: "track_video_1", name: "Main Video (V1)", type: "video", order: 1, locked: false, muted: false, hidden: false, solo: false, volume: 1 },
];

const INITIAL_PROJECT: ProjectSession = {
  projectId: "session_default",
  title: "Untitled Video",
  duration: 45,
  aspectRatio: "9:16",
  width: 1080,
  height: 1920,
  fps: 30,
  tracks: DEFAULT_TRACKS,
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

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: INITIAL_PROJECT,
  mediaItems: [],
  referenceMedia: null,
  styleProfile: null,
  history: [],
  future: [],

  setProjectTitle: (title) => {
    set((state) => ({
      project: { ...state.project, title },
    }));
  },

  setAspectRatio: (aspectRatio) => {
    let width = 1080;
    let height = 1920;
    if (aspectRatio === "16:9") {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    } else if (aspectRatio === "4:5") {
      width = 1080;
      height = 1350;
    }
    set((state) => ({
      project: {
        ...state.project,
        aspectRatio,
        width,
        height,
        exportSettings: {
          ...state.project.exportSettings,
          aspectRatio,
          width,
          height,
        },
      },
    }));
  },

  addMediaItem: (item) => {
    set((state) => {
      const exists = state.mediaItems.some((m) => m.id === item.id);
      if (exists) return state;
      return { mediaItems: [...state.mediaItems, item] };
    });
  },

  removeMediaItem: (id) => {
    set((state) => {
      const item = state.mediaItems.find((m) => m.id === id);
      if (item && item.url.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
      return {
        mediaItems: state.mediaItems.filter((m) => m.id !== id),
        project: {
          ...state.project,
          clips: state.project.clips.filter((c) => c.mediaId !== id),
        },
      };
    });
  },

  setReferenceMedia: (item) => set({ referenceMedia: item }),
  setStyleProfile: (profile) => set({ styleProfile: profile }),

  addClip: (clip) => {
    const { project, history } = get();
    let currentTracks = [...project.tracks];

    // Enforce strict track types & dynamically create tracks ONLY when needed
    if (clip.type === "caption" || clip.textPayload) {
      clip.trackId = "track_text";
      clip.type = "caption";
      if (!currentTracks.some((t) => t.id === "track_text")) {
        currentTracks.unshift({
          id: "track_text",
          name: "Captions & Text",
          type: "caption",
          order: 0,
          locked: false,
          muted: false,
          hidden: false,
          solo: false,
          volume: 1,
        });
      }
    } else if (clip.type === "overlay") {
      clip.trackId = "track_overlay";
      if (!currentTracks.some((t) => t.id === "track_overlay")) {
        currentTracks.unshift({
          id: "track_overlay",
          name: "Overlays & B-Roll",
          type: "overlay",
          order: 0.5,
          locked: false,
          muted: false,
          hidden: false,
          solo: false,
          volume: 1,
        });
      }
    } else if (clip.type === "audio" || clip.type === "music") {
      clip.trackId = "track_audio_1";
      if (!currentTracks.some((t) => t.id === "track_audio_1")) {
        currentTracks.push({
          id: "track_audio_1",
          name: "Speech & Audio",
          type: "audio",
          order: 2,
          locked: false,
          muted: false,
          hidden: false,
          solo: false,
          volume: 1,
        });
      }
    } else {
      // Main Video layer: STRICTLY video only! No audio, no text, no captions
      clip.trackId = "track_video_1";
      clip.type = "video";
      if (!currentTracks.some((t) => t.id === "track_video_1")) {
        currentTracks.push({
          id: "track_video_1",
          name: "Main Video (V1)",
          type: "video",
          order: 1,
          locked: false,
          muted: false,
          hidden: false,
          solo: false,
          volume: 1,
        });
      }
    }

    const newClips = [...project.clips, clip];
    const maxEnd = newClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
    set({
      history: [...history.slice(-30), JSON.parse(JSON.stringify(project))],
      future: [],
      project: {
        ...project,
        tracks: currentTracks,
        clips: newClips,
        duration: Math.max(project.duration, Math.ceil(maxEnd)),
      },
    });
  },

  updateClip: (id, updates) => {
    const { project, history } = get();
    const updatedClips = project.clips.map((c) => (c.id === id ? { ...c, ...updates } : c));
    const maxEnd = updatedClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
    set({
      history: [...history.slice(-30), JSON.parse(JSON.stringify(project))],
      future: [],
      project: {
        ...project,
        clips: updatedClips,
        duration: Math.max(project.duration, Math.ceil(maxEnd)),
      },
    });
  },

  splitClip: (clipId, atTime) => {
    const { project, history } = get();
    const clip = project.clips.find((c) => c.id === clipId);
    if (!clip || atTime <= clip.start || atTime >= clip.start + clip.duration) return;

    const firstDuration = atTime - clip.start;
    const secondDuration = clip.duration - firstDuration;
    const splitTrimEnd = clip.trimStart + firstDuration * clip.speed;

    const firstClip = {
      ...clip,
      duration: firstDuration,
      trimEnd: splitTrimEnd,
    };

    const secondClip: Clip = {
      ...JSON.parse(JSON.stringify(clip)),
      id: `clip_split_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      start: atTime,
      duration: secondDuration,
      trimStart: splitTrimEnd,
    };

    const updatedClips = project.clips.map((c) => (c.id === clipId ? firstClip : c));
    updatedClips.push(secondClip);

    set({
      history: [...history, JSON.parse(JSON.stringify(project))],
      future: [],
      project: { ...project, clips: updatedClips },
    });
  },

  removeClip: (id) => {
    const { project, history } = get();
    const remainingClips = project.clips.filter((c) => c.id !== id);
    
    // Automatically prune empty auxiliary tracks (overlay/text/audio) if no clips remain on them
    const hasOverlayClips = remainingClips.some((c) => c.trackId === "track_overlay" || c.type === "overlay");
    const hasTextClips = remainingClips.some((c) => c.trackId === "track_text" || c.type === "caption" || c.textPayload);
    const hasAudioClips = remainingClips.some((c) => c.trackId === "track_audio_1" || c.type === "audio");

    const cleanedTracks = project.tracks.filter((t) => {
      if (t.id === "track_video_1") return true; // Always preserve Main Video track
      if (t.id === "track_overlay" && !hasOverlayClips) return false;
      if (t.id === "track_text" && !hasTextClips) return false;
      if (t.id === "track_audio_1" && !hasAudioClips) return false;
      return true;
    });

    set({
      history: [...history.slice(-30), JSON.parse(JSON.stringify(project))],
      future: [],
      project: {
        ...project,
        tracks: cleanedTracks,
        clips: remainingClips,
      },
    });
  },

  rippleDeleteClip: (id) => {
    const { project, history } = get();
    const clip = project.clips.find((c) => c.id === id);
    if (!clip) return;

    const clipEnd = clip.start + clip.duration;
    const shiftAmount = clip.duration;

    // Shift later clips on the same track to the left
    const remainingClips = project.clips
      .filter((c) => c.id !== id)
      .map((c) => {
        if (c.trackId === clip.trackId && c.start >= clipEnd) {
          return { ...c, start: Math.max(0, c.start - shiftAmount) };
        }
        return c;
      });

    // Prune empty auxiliary tracks
    const hasOverlayClips = remainingClips.some((c) => c.trackId === "track_overlay" || c.type === "overlay");
    const hasTextClips = remainingClips.some((c) => c.trackId === "track_text" || c.type === "caption" || c.textPayload);
    const hasAudioClips = remainingClips.some((c) => c.trackId === "track_audio_1" || c.type === "audio");

    const cleanedTracks = project.tracks.filter((t) => {
      if (t.id === "track_video_1") return true;
      if (t.id === "track_overlay" && !hasOverlayClips) return false;
      if (t.id === "track_text" && !hasTextClips) return false;
      if (t.id === "track_audio_1" && !hasAudioClips) return false;
      return true;
    });

    set({
      history: [...history.slice(-30), JSON.parse(JSON.stringify(project))],
      future: [],
      project: { ...project, tracks: cleanedTracks, clips: remainingClips },
    });
  },

  duplicateClip: (id) => {
    const { project, history } = get();
    const clip = project.clips.find((c) => c.id === id);
    if (!clip) return;

    const duplicated: Clip = {
      ...JSON.parse(JSON.stringify(clip)),
      id: `clip_dup_${Date.now()}`,
      start: clip.start + clip.duration + 0.1,
      name: `${clip.name} (Copy)`,
    };

    set({
      history: [...history.slice(-30), JSON.parse(JSON.stringify(project))],
      future: [],
      project: {
        ...project,
        clips: [...project.clips, duplicated],
      },
    });
  },

  moveClip: (id, newTrackId, newStart) => {
    const { project, history } = get();
    const clip = project.clips.find((c) => c.id === id);
    if (!clip) return;

    // Strict layer type enforcement:
    // Video layer (track_video_1) must ONLY ever hold video/broll clips!
    let validatedTrackId = newTrackId;
    if (newTrackId === "track_video_1") {
      if (clip.type === "caption" || clip.textPayload || clip.type === "audio" || clip.type === "music") {
        // Reject placing audio or text onto video track
        validatedTrackId = clip.trackId;
      }
    } else if (newTrackId === "track_audio_1") {
      if (clip.type === "video" || clip.type === "caption" || clip.textPayload) {
        validatedTrackId = clip.trackId;
      }
    } else if (newTrackId === "track_text") {
      if (clip.type === "video" || clip.type === "audio") {
        validatedTrackId = clip.trackId;
      }
    }

    const safeStart = Math.max(0, newStart);
    const updatedClips = project.clips.map((c) =>
      c.id === id ? { ...c, trackId: validatedTrackId, start: safeStart } : c
    );
    const maxEnd = updatedClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0);
    set({
      history: [...history.slice(-30), JSON.parse(JSON.stringify(project))],
      future: [],
      project: {
        ...project,
        clips: updatedClips,
        duration: Math.max(project.duration, Math.ceil(maxEnd)),
      },
    });
  },

  trimClip: (id, trimStart, duration) => {
    const { project, history } = get();
    set({
      history: [...history.slice(-30), JSON.parse(JSON.stringify(project))],
      future: [],
      project: {
        ...project,
        clips: project.clips.map((c) =>
          c.id === id ? { ...c, trimStart: Math.max(0, trimStart), duration: Math.max(0.1, duration) } : c
        ),
      },
    });
  },

  updateTrack: (id, updates) => {
    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      },
    }));
  },

  setTracks: (tracks) => {
    set((state) => ({
      project: { ...state.project, tracks },
    }));
  },

  applyEditPlan: (plan) => {
    const { project, mediaItems, history } = get();
    const updated = applyEditPlanToProject(project, plan, mediaItems);
    set({
      history: [...history, JSON.parse(JSON.stringify(project))],
      future: [],
      project: updated,
    });
  },

  updateExportSettings: (settings) => {
    set((state) => ({
      project: {
        ...state.project,
        exportSettings: { ...state.project.exportSettings, ...settings },
      },
    }));
  },

  undo: () => {
    const { history, project, future } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    set({
      history: newHistory,
      future: [JSON.parse(JSON.stringify(project)), ...future],
      project: previous,
    });
  },

  redo: () => {
    const { future, project, history } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      history: [...history, JSON.parse(JSON.stringify(project))],
      future: newFuture,
      project: next,
    });
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  clearSession: () => {
    const { mediaItems } = get();
    // Revoke all Object URLs
    for (const item of mediaItems) {
      if (item.url && item.url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(item.url);
        } catch {}
      }
    }
    set({
      project: JSON.parse(JSON.stringify(INITIAL_PROJECT)),
      mediaItems: [],
      referenceMedia: null,
      styleProfile: null,
      history: [],
      future: [],
    });
  },
}));
