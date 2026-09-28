/**
 * Timecode formatting and parsing utilities
 */

export function formatTimecode(seconds: number, fps: number = 30, showFrames: boolean = true): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  
  const totalFrames = Math.floor(seconds * fps);
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(seconds);
  const secs = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const mins = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (n: number, z: number = 2) => String(n).padStart(z, "0");

  if (showFrames) {
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatSecondsShort(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const totalSeconds = Math.floor(seconds);
  const secs = totalSeconds % 60;
  const mins = Math.floor(totalSeconds / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(mins)}:${pad(secs)}`;
}

export function parseTimecode(tc: string, fps: number = 30): number {
  const parts = tc.split(":").map(Number);
  if (parts.length === 4) {
    const [h, m, s, f] = parts;
    return h * 3600 + m * 60 + s + (f || 0) / fps;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return 0;
}

export function snapToFrame(time: number, fps: number = 30): number {
  return Math.round(time * fps) / fps;
}
