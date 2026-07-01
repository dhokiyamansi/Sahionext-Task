# echobloom 

A real-time voice experience. Speak, and your words **bloom** around a living, sound-reactive organism.

**Pipeline:** `mic → VAD (on-device) → Gemini (audio→keywords) → speak → visualize`

- **VAD** — [`@ricky0123/vad-web`](https://github.com/ricky0123/vad) (Silero v5) runs in the browser and detects when you're actually speaking, so only real speech is sent onward.
- **Keywords** — each detected utterance is encoded to WAV and sent to a Next.js API route, which asks **Gemini 2.5 Flash** (audio input) for the key terms as structured JSON.
- **Play** — the keywords are read back aloud via the browser's built-in `SpeechSynthesis` (free, no key).
- **Show** — a hand-drawn Canvas "organism" pulses to your live mic level, and keywords bloom outward in a golden-angle field, accumulating across the session (repeats grow larger).

Everything is free to run — the only credential is a free Gemini API key.

## Prerequisites

- **Node.js 20+**
- A **free Gemini API key** — https://aistudio.google.com → *Get API key* (no credit card).

## Setup

```bash
npm install
cp .env.example .env.local      # then paste your key into .env.local
npm run dev                     # http://localhost:3000
```

`.env.local`:

```
GEMINI_API_KEY=your_key_here
```

Open http://localhost:3000, press **Start**, allow the microphone, and talk.

> The mic requires a **secure context** — `localhost` works in dev; in production you need **HTTPS** (Vercel provides it automatically).

## How the pieces fit

| File | Role |
| --- | --- |
| `lib/useVoicePipeline.ts` | Orchestrates mic → VAD → API → TTS → state (the brain) |
| `lib/audio.ts` | Float32 PCM → base64 WAV encoder |
| `lib/tts.ts` | `SpeechSynthesis` wrapper |
| `app/api/keywords/route.ts` | Server proxy: audio → Gemini → keywords JSON (holds the key) |
| `components/VoiceOrganism.tsx` | Canvas sound-reactive organism |
| `components/KeywordField.tsx` | Blooming keyword layout (framer-motion) |
| `components/MicControls.tsx` | Controls, status, "just heard" chips |
| `scripts/copy-vad-assets.mjs` | Copies VAD/ONNX runtime assets into `public/vad` (runs automatically on `dev`/`build`) |

**Security note:** the Gemini key lives only in the server route (`process.env.GEMINI_API_KEY`) and never reaches the browser. The VAD gate means the model is called **once per utterance**, not continuously — cheap and quota-friendly.

## Tuning

- VAD sensitivity: `positiveSpeechThreshold` / `negativeSpeechThreshold` / `redemptionMs` in `lib/useVoicePipeline.ts`.
- Keyword count & prompt: `app/api/keywords/route.ts`.
- Visual identity: `PALETTE` in `components/VoiceOrganism.tsx` and `app/globals.css`.

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · `@ricky0123/vad-web` · `@google/genai` · framer-motion · Web Speech API · Canvas.
