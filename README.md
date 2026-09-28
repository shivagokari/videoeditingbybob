# AI Video Studio

A professional browser-based, privacy-first Non-Linear Video Editor (NLE) with conversational AI directing, reference video style extraction, dynamic word-pop captions, and manual export controls.

---

## Key Principles & Architecture

1. **AI-Assisted, Not AI-Controlled**: Every AI operation translates into structured, reversible JSON operations adhering to a strict schema.
2. **Non-Destructive Editing**: Raw uploaded media is never modified or overwritten.
3. **Session-Only Privacy Architecture**: Media files and projects live strictly in temporary browser session memory. No permanent video storage, no hidden databases, and zero tracking.
4. **Manual Export**: The application never automatically triggers downloads. Users review final previews before choosing resolution, framerate, and bitrate.
5. **Multi-Provider AI Abstraction**: Seamlessly switch between OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), custom Model Context Protocol (MCP) servers, or the built-in offline Studio Intelligence engine.

---

## Feature Matrix

| Feature | Description |
| :--- | :--- |
| **Multi-Track Timeline** | Video (V1), Overlay/B-roll, Captions, Text, Audio (A1), and Background Music tracks. |
| **Editing Operations** | Split (`S`), Trim handles, Ripple Delete, Delete, Duplicate, Snap to boundaries (`Magnet`), Zoom scale. |
| **Video Canvas Player** | Real-time HTML5 2D Canvas compositor with aspect ratios (9:16 Reel, 16:9 YouTube, 1:1 Square, 4:5 Portrait). |
| **Social Creator Safe Zones** | Live overlay guides for Instagram Reels, TikTok, and YouTube Shorts UI margins. |
| **Reference Video Matching** | Ingest any reference video to extract pacing, average shot duration, color tone, and caption styles into a reusable Style Profile. |
| **Dynamic Captions Engine** | Word-pop karaoke animations, Creator Yellow & Bold Center styling, inline segment editor, SRT/VTT import & export. |
| **Cinematic Color Grading** | Exposure, contrast, brightness, saturation, temperature (K), tint, vignette, film grain, and 8 LUT-inspired presets. |
| **Audio Processing** | Normalization (-14 LUFS standard), Voice Clarity Equalization, and Speech-aware Music Ducking. |
| **Chroma Keying** | Green/blue screen keying with eyedropper color picker, threshold, softness, and spill suppression. |
| **Manual Export Engine** | Client-side Canvas + MediaRecorder rendering producing high-bitrate WebM / MP4 video files with real frame-by-frame progress, ETA, and cancellation. |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── edit-plan/route.ts       # Validated JSON EditPlan generator
│   │   │   ├── refine/route.ts          # Conversational patch & refinement
│   │   │   └── test-connection/route.ts # Server-side API key verification
│   │   ├── mcp/route.ts                 # MCP tool registry & bridge
│   │   ├── media/analyze/route.ts       # Reference video analysis
│   │   └── render/export/route.ts       # FFmpeg pipeline argument generator
│   ├── editor/page.tsx                  # Full 3-column NLE studio workspace
│   ├── settings/page.tsx                # AI provider configuration & testing
│   ├── globals.css                      # Studio theme tokens & scrollbars
│   ├── layout.tsx                       # Root layout & tooltip provider
│   └── page.tsx                         # Landing page & feature showcase
├── components/
│   ├── ui/                              # Radix UI accessible primitives
│   └── common/                          # Header, privacy banner, shortcuts modal
├── features/
│   ├── ai/                              # Assistant panel, EditPlan inspector, reference modal
│   ├── media/                           # Media bin, upload zone, metadata extractor
│   ├── timeline/                        # Tracks, clips, playhead, snapping, toolbar
│   ├── preview/                         # Canvas compositor, Web Audio engine, safe zones
│   ├── inspector/                       # Color grading, captions, audio, transform, chroma
│   └── export/                          # Browser rendering engine, FFmpeg generator
├── lib/
│   ├── schemas/                         # Zod schemas for EditPlan, StyleProfile, Project
│   ├── state/                           # Zustand stores (Project, Editor, AI)
│   └── utils/                           # Timecode (SMPTE), SRT parser, color filters
└── tests/                               # Vitest automated test suite
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm** or **pnpm**

### 2. Installation
```bash
git clone <repository-url>
cd "editing web"
npm install
```

### 3. Environment Configuration (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add your optional keys if you wish to use cloud models:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MCP_SERVER_URL=http://localhost:3001/mcp
```
*(Note: Studio Intelligence runs offline without any external keys required.)*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Automated Tests
```bash
npm test
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| **Space** | Play / Pause playback |
| **J** | Step backward / Rewind |
| **K** | Pause |
| **L** | Fast forward |
| **S** | Split active clip at playhead |
| **Delete / Backspace** | Delete selected clip |
| **Ctrl / Cmd + Z** | Undo last change |
| **Ctrl / Cmd + Shift + Z** | Redo last change |
| **← / →** | Step 1 frame backward / forward |
| **Shift + ← / →** | Step 1 second backward / forward |
| **+ / -** | Zoom timeline in / out |

---

## License
MIT License. Built for creators and developers seeking a privacy-first video editing platform.
