# Task 2 — Designing a Simple, Good-Looking Talking Avatar

> **Question:** How would you design a simple, good-looking talking avatar?
> *(Approach only — no code.)*

## 1. Framing the problem

A "talking avatar" is a visual character that appears to **speak** given some text
or audio. "Simple" and "good-looking" pull in slightly different directions, so the
core design principle I'd commit to is:

> **Stylized, not realistic.** A clean, characterful design that is deliberately
> non-photoreal avoids the *uncanny valley*, is far cheaper to build, and reads as
> intentional and polished. Realistic 3D faces look wrong the moment lip-sync is
> slightly off; a stylized face stays charming even when the sync is approximate.

So the goal becomes: **a small set of well-crafted mouth shapes + expressive
secondary motion, driven by speech timing, on an appealing character.**

## 2. What actually makes it "talk" — the four layers

A convincing talking avatar is the sum of four layers, in order of importance:

1. **Lip-sync (mouth shapes)** — the mouth must move in time with the audio. This is
   the single most important cue; get this ~80% right and the brain accepts it.
2. **Idle / secondary motion** — blinking, subtle head sway, breathing. A perfectly
   still face reads as "frozen/dead" even while the mouth moves. Constant micro-motion
   is what sells "alive."
3. **Expression / emotion** — eyebrows and eye shape mapped to sentiment (neutral,
   happy, thinking). Optional but hugely raises perceived quality.
4. **Gaze** — eyes tracking the user / cursor, occasional look-away. Cheap, big impact.

## 3. Recommended approach: 2D layered / "puppet" avatar

For *simple + good-looking*, I'd choose a **2D vector/layered character** over 3D:

| Approach | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **2D layered (SVG/sprites)** | Easy, tiny, artist-friendly, always on-model, fast | Limited head turns | ✅ **Best for "simple + good-looking"** |
| Live2D / Rive | Rigged 2D with smooth deformation, very polished | Needs the tool + a rig | ✅ Great if a rig is available |
| 3D (Three.js + morph targets / Ready Player Me) | Full head rotation, depth | Heavier, uncanny risk, more assets | Use only if 3D/AR is a requirement |

**The 2D "puppet" model:** the character is drawn as separate layers — head, eyes,
pupils, eyelids, eyebrows, and a **mouth that swaps between a handful of shapes**.
Animation = swapping the mouth layer and nudging/rotating the other layers.

### The mouth: visemes

Human speech only needs a small set of mouth shapes called **visemes** (visual
phonemes). A classic, sufficient set is ~**8–12 shapes** (e.g. the Preston Blair
set): rest/closed, `A/I` (open), `E`, `O`, `U`, `M/B/P` (lips together), `F/V`
(teeth on lip), `L`, `WQ`, etc. You draw these once; talking is just showing the
right one at the right time.

## 4. Driving the mouth — two levels of fidelity

**Level 1 — Amplitude-driven (simplest, looks good enough):**
Analyze the speech audio's loudness in real time (Web Audio `AnalyserNode` → RMS).
Map volume to mouth openness: quiet → closed, loud → open, with 2–3 intermediate
shapes. No phoneme knowledge needed. This is the fastest path and already reads as
"talking." *(This is exactly the live-amplitude technique used in Task 1's organism.)*

**Level 2 — Viseme-driven (higher quality):**
Get **phoneme + timing** data and map each phoneme to its viseme on a timeline:
- Many TTS engines return timing metadata — e.g. the Web Speech API's
  `SpeechSynthesisUtterance` fires **`boundary` events** per word, and cloud TTS
  (Azure, Amazon Polly, ElevenLabs) can return **viseme/speech marks** with millisecond
  timestamps.
- Play the audio and, on each timestamp, switch to the matching mouth shape.
- Smooth transitions (blend/tween between shapes) so it doesn't look robotic.

I'd ship **Level 1 for the MVP**, then upgrade the mouth to **Level 2** if a TTS with
viseme output is available.

## 5. The pipeline

```
text ──► TTS engine ──► audio + timing (visemes / word boundaries / amplitude)
                               │
                               ├─► audio playback  ────────────► 🔊 voice
                               └─► timeline driver
                                        │
             ┌──────────────────────────┼───────────────────────────┐
             ▼                          ▼                            ▼
        mouth shape                 expression                  idle motion
      (viseme swap)          (eyebrows/eyes by sentiment)   (blink, sway, breathe)
             └──────────────────────────┴───────────────────────────┘
                                        ▼
                                  render (2D layers)
```

A single animation loop (`requestAnimationFrame`) reads the current audio time,
picks the active viseme, applies eased transitions, and runs the always-on idle
motion (a blink every few seconds, a slow sinusoidal head bob, gentle breathing scale).

## 6. Making it *good-looking* (the design details that matter)

- **Character design first.** A friendly, simple, on-brand face with a limited, tasteful
  color palette beats any amount of animation tech. Rounded forms read as approachable.
- **Never fully still.** Idle blink + micro head-motion + breathing is what separates
  "alive" from "creepy mannequin."
- **Ease everything.** Snap-swapping mouth shapes looks robotic; blend between them and
  slightly overshoot (spring) for life.
- **Anticipation & rest pose.** Return to a neutral, slightly-smiling rest pose between
  utterances; a tiny lead-in before speech starts.
- **Eyes and gaze.** Eyes that occasionally saccade and track the user create a strong
  sense of attention and presence.
- **A little glow / soft shadow / depth** to lift it off the background, plus a subtle
  reactive backdrop, gives a premium feel without extra complexity.
- **Sync tolerance.** Keep audio and mouth within ~100 ms; beyond that the illusion breaks.

## 7. Suggested stack

- **Rendering:** SVG or Canvas for a layered 2D avatar (or **Rive/Live2D** if a rig is
  available; **Three.js + morph targets / Ready Player Me** only if 3D is required).
- **Voice:** browser **Web Speech API** for a zero-cost MVP; **Azure / Polly / ElevenLabs**
  when you want natural voices *and* viseme timing.
- **Timing/animation:** Web Audio `AnalyserNode` (amplitude) or TTS viseme marks, driven
  in a `requestAnimationFrame` loop; a spring/tween library for smoothing.

## 8. MVP vs. polished

| | MVP (a day) | Polished |
| --- | --- | --- |
| Mouth | 3–4 amplitude-based shapes | 8–12 visemes with blending |
| Motion | blink + head bob | + breathing, gaze tracking, anticipation |
| Expression | neutral only | sentiment-mapped eyebrows/eyes |
| Voice | Web Speech API | neural TTS with viseme timing |

## 9. Tie-in with Task 1

Task 1 already implements the hard half of an avatar pipeline: **mic/audio →
live-amplitude analysis → a face-like reactive visual (the organism) → synced speech
playback.** Turning that into a talking avatar is mostly **swapping the abstract blob
for a layered character and mapping the same live-amplitude signal to viseme mouth
shapes** — the plumbing (audio capture, level analysis, TTS, render loop) is the same.
