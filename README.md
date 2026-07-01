# Sahionext — 

This repository contains two tasks.

## Task 1 — Real-time Voice → Keywords experience  → [`task-1/`](./task-1)

**Problem statement:**
> Implement basic VAD, send non-silent chunks to any model that supports audio, get keywords, play the returned keywords, and show the keywords in a nice way (be as creative as you want).

**What's built:** a Next.js app called **echobloom**. The browser runs on-device
Voice Activity Detection (Silero VAD), sends only real speech to **Gemini 2.5 Flash**
(audio input) which returns keywords as JSON, reads them back aloud with the Web
Speech API, and blooms them around a living, sound-reactive "organism" that pulses
to your voice.

`mic → VAD → Gemini (audio → keywords) → speak → visualize`

Full setup, architecture, and run instructions are in **[`task-1/README.md`](./task-1/README.md)**.

## Task 2 — Talking Avatar design  → [`task-2/`](./task-2)

**Question:**
> How would you design a simple, good-looking talking avatar?
> (No code required — just answer this question with an approach.)

The written design approach is in **[`task-2/README.md`](./task-2/README.md)**.
