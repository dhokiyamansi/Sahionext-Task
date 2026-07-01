"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MicVAD } from "@ricky0123/vad-web";
import { encodeWavBase64 } from "./audio";
import { speak, cancelSpeech } from "./tts";
import type { Keyword, KeywordsResponse, PipelineStatus } from "./types";

const VAD_ASSET_PATH = "/vad/";

export interface VoicePipeline {
  status: PipelineStatus;
  keywords: Keyword[];
  latest: string[];
  latestIds: string[];
  error: string | null;
  /** Live mic loudness 0..~1, updated ~60fps. Read in animation loops (no re-render). */
  levelRef: React.MutableRefObject<number>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
}

export function useVoicePipeline(): VoicePipeline {
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [latest, setLatest] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const levelRef = useRef(0);
  const statusRef = useRef<PipelineStatus>("idle");
  const vadRef = useRef<MicVAD | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const setPhase = useCallback((s: PipelineStatus) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  const mergeKeywords = useCallback((incoming: string[]) => {
    setKeywords((prev) => {
      const map = new Map(prev.map((k) => [k.text.toLowerCase(), k]));
      for (const raw of incoming) {
        const text = raw.trim();
        if (!text) continue;
        const key = text.toLowerCase();
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, weight: existing.weight + 1, createdAt: Date.now() });
        } else {
          map.set(key, {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${key}-${Date.now()}`,
            text,
            weight: 1,
            createdAt: Date.now(),
          });
        }
      }
      return Array.from(map.values());
    });
  }, []);

  // rAF loop: read RMS loudness from the analyser into levelRef (smoothed).
  const startLevelLoop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      levelRef.current = levelRef.current * 0.82 + rms * 0.18;
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const handleSpeechEnd = useCallback(
    async (audio: Float32Array) => {
      // Ignore anything captured while we're busy (e.g. TTS echo).
      if (statusRef.current === "thinking" || statusRef.current === "speaking") return;

      setPhase("thinking");
      try {
        const audioB64 = encodeWavBase64(audio, 16000);
        const res = await fetch("/api/keywords", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: audioB64 }),
        });
        const data: KeywordsResponse = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

        const kws = (data.keywords ?? []).filter(Boolean);
        if (kws.length) {
          setLatest(kws);
          mergeKeywords(kws);
          setPhase("speaking");
          // Pause the VAD so the spoken keywords don't feed back into it.
          try {
            vadRef.current?.pause();
          } catch {
            /* noop */
          }
          await speak(kws.join(", "));
          try {
            await vadRef.current?.start();
          } catch {
            /* noop */
          }
        }
      } catch (e) {
        console.error("[pipeline] speech handling failed:", e);
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        if (statusRef.current !== "error") setPhase("listening");
      }
    },
    [mergeKeywords, setPhase]
  );

  const start = useCallback(async () => {
    if (statusRef.current !== "idle" && statusRef.current !== "error") return;
    setError(null);
    setPhase("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Own AudioContext + analyser for the live loudness visualization.
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;
      startLevelLoop();

      // Dynamically import so onnxruntime-web never runs during SSR.
      const { MicVAD } = await import("@ricky0123/vad-web");
      const vad = await MicVAD.new({
        model: "v5",
        baseAssetPath: VAD_ASSET_PATH,
        onnxWASMBasePath: VAD_ASSET_PATH,
        getStream: async () => stream,
        startOnLoad: false,
        submitUserSpeechOnPause: false,
        ortConfig: (ort) => {
          // Single-threaded: avoids needing cross-origin isolation (SharedArrayBuffer).
          ort.env.wasm.numThreads = 1;
        },
        positiveSpeechThreshold: 0.5,
        negativeSpeechThreshold: 0.35,
        redemptionMs: 700,
        preSpeechPadMs: 250,
        minSpeechMs: 250,
        onSpeechStart: () => {
          if (statusRef.current === "listening") setPhase("listening");
        },
        onSpeechEnd: handleSpeechEnd,
        onVADMisfire: () => {
          /* too-short blip; ignore */
        },
      });
      vadRef.current = vad;
      await vad.start();
      setPhase("listening");
    } catch (e) {
      console.error("[pipeline] failed to start:", e);
      const msg =
        e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")
          ? "Microphone access was blocked. Allow mic permission (and use https or localhost), then retry."
          : e instanceof Error
            ? e.message
            : "Could not start the microphone.";
      setError(msg);
      setPhase("error");
    }
  }, [handleSpeechEnd, setPhase, startLevelLoop]);

  const stop = useCallback(async () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    levelRef.current = 0;
    cancelSpeech();
    try {
      await vadRef.current?.destroy();
    } catch {
      /* noop */
    }
    vadRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      await audioCtxRef.current?.close();
    } catch {
      /* noop */
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setPhase("idle");
  }, [setPhase]);

  const clear = useCallback(() => {
    setKeywords([]);
    setLatest([]);
  }, []);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      cancelSpeech();
      void vadRef.current?.destroy().catch(() => {});
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const latestIds = useMemo(() => {
    const set = new Set(latest.map((l) => l.toLowerCase()));
    return keywords.filter((k) => set.has(k.text.toLowerCase())).map((k) => k.id);
  }, [keywords, latest]);

  return { status, keywords, latest, latestIds, error, levelRef, start, stop, clear };
}
