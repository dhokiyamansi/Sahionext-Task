# Task 2 — Designing a Simple, Good-Looking Talking Avatar

> **Question:** How would you design a simple, good-looking talking avatar?
> *(Approach only — no code.)*

---

## The approach in one line

Build a **stylized, real-time rigged 3D avatar** that runs entirely in the browser: a
3D head with facial **blendshapes**, driven by **visemes** (mouth shapes) synced to
text-to-speech, with always-on idle motion (blink, breathe, sway) so it feels alive.

## 1. Why real-time rigged 3D (and why stylized)

- **Rigged 3D, not AI-generated video** (SadTalker/D-ID/HeyGen): generated video is
  cloud-bound, costs money, adds latency, and risks the *uncanny valley*. A rigged 3D
  head runs live in the browser at 30–60 FPS, is free, and is fully controllable.
- **Stylized, not photorealistic**: a clean, characterful (non-realistic) look sidesteps
  the uncanny valley and stays appealing even when lip-sync is only approximate. A
  realistic face looks wrong the instant sync is a few ms off.

## 2. How the mouth moves — blendshapes + visemes

A 3D avatar face is animated with **blendshapes** (morph targets): named sliders like
"jaw open," "mouth pucker," "smile" that deform the mesh. The standard rig exposes
**ARKit / Oculus viseme blendshapes**.

Speech only needs a small set of **visemes** (visual phonemes / mouth shapes) — in
practice **8–12** shapes (rest/closed, `AA` open, `E`, `O`, `U`, `M/B/P` lips-together,
`F/V` teeth-on-lip, `L`, `WQ`, …). "Talking" is just blending the right viseme blendshape
in at the right time, with smooth transitions between them.

## 3. Where the timing comes from

The avatar needs to know **which viseme, when**. Options, all browser-friendly:

| Source | Gives you | Cost |
| --- | --- | --- |
| **HeadTTS (Kokoro)** | **Free, in-browser** neural TTS returning **visemes + phoneme timestamps** (WebGPU/WASM) | Free |
| **Audio-driven detection** (HeadAudio / wawa-lipsync) | Visemes derived from *any* audio in real time — no text/timing needed | Free |
| **Azure Neural TTS** | Visemes + timestamps out-of-the-box (`VisemeReceived` event) | Paid |
| **ElevenLabs** | Character-level timestamps (derive visemes) | Paid |

**Key point:** no paid API is required — **HeadTTS/Kokoro** produces visemes for free in
the browser, and audio-driven detection can lip-sync any audio with no timing data at all.

## 4. The four layers that make it feel *alive*

Lip-sync alone isn't enough. In priority order:

1. **Lip-sync** — mouth in time with audio. The dominant cue; get it ~80% right and the brain accepts it.
2. **Idle / secondary motion** — **blinking, subtle head sway, breathing.** A perfectly
   still face reads as frozen/creepy even while the mouth moves. Constant micro-motion sells "alive."
3. **Expression** — eyebrows/eye-shape blendshapes mapped to sentiment (neutral, happy, thinking).
4. **Gaze** — eyes that track the user and occasionally look away. Cheap, big presence boost.

## 5. Reference pipeline

```
text ──► TTS ──► audio + viseme timeline (or audio-driven detection)
                        │
                        ├─► audio playback ─────────────► 🔊 voice
                        └─► timeline driver
                                   │
          ┌────────────────────────┼─────────────────────────┐
          ▼                        ▼                          ▼
   viseme blendshape          expression                 idle motion
   (jaw/lips morph)     (eyebrow/eye blendshapes)    (blink, sway, breathe)
          └────────────────────────┴─────────────────────────┘
                                   ▼
                      Three.js / WebGL render (30–60 FPS)
```

A single `requestAnimationFrame` loop reads the current audio time, blends in the active
viseme, applies expression, and always runs the idle motion.

## 6. What makes it *good-looking* (the details)

- **Character design first.** A friendly, on-brand face with a limited, tasteful palette
  beats any amount of animation tech. Rounded forms read as approachable.
- **Never fully still** — idle blink + micro head-motion + breathing separates "alive" from "mannequin."
- **Ease/blend everything** — snapping between visemes looks robotic; tween and slightly overshoot (spring) for life.
- **Rest pose & anticipation** — return to a neutral, slightly-smiling pose between utterances; a tiny lead-in before speech.
- **Gaze & saccades** — occasional eye movement + user tracking = strong sense of attention.
- **Lighting & soft shadow** — good 3-point-ish lighting and a simple backdrop lift the character and give a premium feel cheaply.
- **Sync tolerance** — keep audio and mouth within ~100 ms; beyond that the illusion breaks.

## 7. Recommended concrete stack

- **Avatar model:** a **Ready Player Me** 3D head (free, customizable, ships with ARKit/Oculus
  viseme blendshapes) exported as **GLB**.
- **Engine:** **[`met4citizen/TalkingHead`](https://github.com/met4citizen/TalkingHead)** —
  a Three.js class that loads the GLB and does real-time, in-browser lip-sync at 30–60 FPS,
  with built-in idle motion, expressions, and gaze.
- **Voice + timing:** **[HeadTTS](https://github.com/met4citizen/HeadTTS)** (Kokoro) for
  free in-browser visemes + timestamps — upgrade to Azure/ElevenLabs only if a specific
  voice is required.

This gives an impressive, good-looking 3D talking avatar, real-time, **with no paid API keys**.

## 8. Simple vs. polished (scope ladder)

| | MVP | Polished |
| --- | --- | --- |
| Mouth | 3–4 visemes (or audio-amplitude → jaw) | 8–12 blended visemes |
| Motion | blink + head bob | + breathing, gaze tracking, anticipation |
| Expression | neutral only | sentiment-mapped brows/eyes |
| Voice | free in-browser Kokoro / Web Speech API | neural TTS (Azure / ElevenLabs) |
| Model | one Ready Player Me head | custom-styled model, better lighting |

## 9. Summary

Design a **stylized real-time 3D head** (e.g. Ready Player Me GLB) rendered in **Three.js**,
animate the mouth by blending **8–12 viseme blendshapes** on a timeline from a TTS that
provides viseme timing (**free in-browser Kokoro/HeadTTS**, or audio-driven detection), and
spend the real effort on **character design + always-on idle motion (blink, breathe, sway) +
gaze + eased transitions**. That combination — not photorealism — is what makes a talking
avatar look simple, alive, and good.

## Sources

- [met4citizen/TalkingHead — real-time 3D lip-sync in the browser](https://github.com/met4citizen/TalkingHead)
- [met4citizen/HeadTTS — free in-browser neural TTS (Kokoro) with visemes + timestamps](https://github.com/met4citizen/HeadTTS)
- [Ready Player Me — 3D avatars with ARKit/Oculus blendshapes](https://readyplayer.me/)
- [Azure Neural TTS — lip-sync with viseme events](https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-neural-text-to-speech-extended-to-support-lip-sync-with-viseme/2356748)
- [ElevenLabs — speech with character-level timestamps](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps)
