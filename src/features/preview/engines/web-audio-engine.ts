import { ProjectSession } from "@/lib/schemas/project.schema";
import { MediaItem } from "@/lib/schemas/media.schema";

export class WebAudioEngine {
  private audioContext: AudioContext | null = null;
  private audioElements = new Map<string, HTMLAudioElement>();
  private sourceNodes = new Map<string, MediaElementAudioSourceNode>();
  private gainNodes = new Map<string, GainNode>();
  private masterGain: GainNode | null = null;

  public init() {
    if (!this.audioContext && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
      }
    }
  }

  public syncPlayback({
    isPlaying,
    currentTime,
    project,
    mediaItems,
    volume,
    isMuted,
  }: {
    isPlaying: boolean;
    currentTime: number;
    project: ProjectSession;
    mediaItems: MediaItem[];
    volume: number;
    isMuted: boolean;
  }) {
    if (this.audioContext && this.audioContext.state === "suspended" && isPlaying) {
      this.audioContext.resume().catch(() => {});
    }

    if (this.masterGain) {
      this.masterGain.gain.value = isMuted ? 0 : volume;
    }

    // Find active audio & video clips
    const activeClips = project.clips.filter((clip) => {
      const track = project.tracks.find((t) => t.id === clip.trackId);
      if (track?.muted) return false;
      return currentTime >= clip.start && currentTime < clip.start + clip.duration;
    });

    // Check which audio items need to play
    for (const clip of activeClips) {
      const media = mediaItems.find((m) => m.id === clip.mediaId);
      if (!media || (media.type !== "audio" && media.type !== "video")) continue;

      let audio = this.audioElements.get(media.id);
      if (!audio) {
        audio = new Audio(media.url);
        audio.preload = "auto";
        this.audioElements.set(media.id, audio);

        if (this.audioContext && this.masterGain) {
          try {
            const source = this.audioContext.createMediaElementSource(audio);
            const gain = this.audioContext.createGain();
            source.connect(gain);
            gain.connect(this.masterGain);
            this.sourceNodes.set(media.id, source);
            this.gainNodes.set(media.id, gain);
          } catch {
            // May fail if already connected
          }
        }
      }

      // Calculate clip audio time
      const clipElapsed = currentTime - clip.start;
      const targetTime = clip.trimStart + clipElapsed * (clip.speed || 1);

      // Only seek if difference is significant and not already seeking
      if (!audio.seeking && Math.abs(audio.currentTime - targetTime) > 0.25) {
        audio.currentTime = targetTime;
      }

      // Update volume
      const track = project.tracks.find((t) => t.id === clip.trackId);
      const trackVol = track?.volume ?? 1;
      const clipVol = clip.muted ? 0 : (clip.volume ?? 1);
      const totalGain = trackVol * clipVol;

      const gainNode = this.gainNodes.get(media.id);
      if (gainNode) {
        gainNode.gain.value = totalGain;
      } else {
        audio.volume = Math.min(1, Math.max(0, totalGain * (isMuted ? 0 : volume)));
      }

      if (isPlaying) {
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    }

    // Pause audio elements that are no longer active
    this.audioElements.forEach((audio, mediaId) => {
      const isActive = activeClips.some((c) => c.mediaId === mediaId);
      if (!isActive && !audio.paused) {
        audio.pause();
      }
    });
  }

  public pauseAll() {
    this.audioElements.forEach((audio) => {
      if (!audio.paused) audio.pause();
    });
  }

  public cleanup() {
    this.pauseAll();
    this.audioElements.clear();
    this.sourceNodes.clear();
    this.gainNodes.clear();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}
