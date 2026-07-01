// Thin wrapper over the browser's built-in SpeechSynthesis (Web Speech API).
// Free, no key, works offline. Resolves when playback finishes (or is skipped).

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Voices load asynchronously in some browsers; wait briefly for them.
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!supported()) return resolve([]);
    const existing = window.speechSynthesis.getVoices();
    if (existing.length) return resolve(existing);

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", finish, { once: true });
    setTimeout(finish, 600);
  });
}

async function pickVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = await loadVoices();
  // Prefer a natural-sounding English voice when available.
  const preferred =
    voices.find((v) => /Google US English|Samantha|Natural|Neural/i.test(v.name)) ??
    voices.find((v) => v.lang?.startsWith("en") && v.localService === false) ??
    voices.find((v) => v.lang?.startsWith("en")) ??
    voices[0] ??
    null;
  cachedVoice = preferred;
  return preferred;
}

export async function speak(text: string): Promise<void> {
  if (!supported() || !text.trim()) return;

  window.speechSynthesis.cancel(); // stop anything mid-flight
  const voice = await pickVoice();

  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    // Safety net in case the engine never fires onend.
    setTimeout(finish, Math.min(8000, 1500 + text.length * 90));

    window.speechSynthesis.speak(utterance);
  });
}

export function cancelSpeech(): void {
  if (supported()) window.speechSynthesis.cancel();
}
