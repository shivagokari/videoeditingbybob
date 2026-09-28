import { create } from "zustand";

export type SidebarTab =
  | "media"
  | "ai"
  | "captions"
  | "color"
  | "audio"
  | "effects"
  | "transitions"
  | "elements"
  | "export"
  | "settings";

interface EditorStoreState {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  isMuted: boolean;
  volume: number;
  zoom: number; // px per second
  selectedClipId: string | null;
  selectedTrackId: string | null;
  activeTab: SidebarTab;
  safeZonesEnabled: boolean;
  inPoint: number | null;
  outPoint: number | null;
  snappingEnabled: boolean;
  isExportModalOpen: boolean;
  isShortcutsModalOpen: boolean;
  isReferenceModalOpen: boolean;

  // Actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlayPause: () => void;
  setPlaybackRate: (rate: number) => void;
  setIsMuted: (muted: boolean) => void;
  setVolume: (vol: number) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setSelectedClipId: (id: string | null) => void;
  setSelectedTrackId: (id: string | null) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setSafeZonesEnabled: (enabled: boolean) => void;
  setInPoint: (time: number | null) => void;
  setOutPoint: (time: number | null) => void;
  setSnappingEnabled: (enabled: boolean) => void;
  setIsExportModalOpen: (open: boolean) => void;
  setIsShortcutsModalOpen: (open: boolean) => void;
  setIsReferenceModalOpen: (open: boolean) => void;
  stepFrame: (direction: -1 | 1, fps?: number) => void;
  stepSecond: (direction: -1 | 1, seconds?: number) => void;
}

export const useEditorStore = create<EditorStoreState>((set, get) => ({
  currentTime: 0,
  isPlaying: false,
  playbackRate: 1,
  isMuted: false,
  volume: 1,
  zoom: 50, // 50px = 1 second
  selectedClipId: null,
  selectedTrackId: null,
  activeTab: "media",
  safeZonesEnabled: true,
  inPoint: null,
  outPoint: null,
  snappingEnabled: true,
  isExportModalOpen: false,
  isShortcutsModalOpen: false,
  isReferenceModalOpen: false,

  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlayPause: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
  setZoom: (zoom) => set({ zoom: Math.min(250, Math.max(10, zoom)) }),
  zoomIn: () => set((s) => ({ zoom: Math.min(250, s.zoom * 1.25) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(10, s.zoom / 1.25) })),
  setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSafeZonesEnabled: (safeZonesEnabled) => set({ safeZonesEnabled }),
  setInPoint: (inPoint) => set({ inPoint }),
  setOutPoint: (outPoint) => set({ outPoint }),
  setSnappingEnabled: (snappingEnabled) => set({ snappingEnabled }),
  setIsExportModalOpen: (isExportModalOpen) => set({ isExportModalOpen }),
  setIsShortcutsModalOpen: (isShortcutsModalOpen) => set({ isShortcutsModalOpen }),
  setIsReferenceModalOpen: (isReferenceModalOpen) => set({ isReferenceModalOpen }),

  stepFrame: (direction, fps = 30) => {
    const { currentTime } = get();
    const frameDuration = 1 / fps;
    set({ currentTime: Math.max(0, currentTime + direction * frameDuration) });
  },

  stepSecond: (direction, seconds = 1) => {
    const { currentTime } = get();
    set({ currentTime: Math.max(0, currentTime + direction * seconds) });
  },
}));
