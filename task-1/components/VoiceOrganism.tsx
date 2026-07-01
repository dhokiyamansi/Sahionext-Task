"use client";

import { useEffect, useRef } from "react";
import type { PipelineStatus } from "@/lib/types";

interface Props {
  status: PipelineStatus;
  levelRef: React.MutableRefObject<number>;
}

const PALETTE: Record<PipelineStatus, [string, string]> = {
  idle: ["#1b9ea8", "#0e5b66"],
  loading: ["#6d7bd6", "#3b3f8f"],
  listening: ["#3ef0e0", "#0fa9b8"],
  thinking: ["#9b7bff", "#5a3fd6"],
  speaking: ["#ff7ac6", "#c23fa0"],
  error: ["#ff6b6b", "#8f2f2f"],
};

export function VoiceOrganism({ status, levelRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let energy = 0;
    let hueMix = 0;
    const start = performance.now();

    const lerpColor = (a: string, b: string, t: number) => {
      const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
      const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
      const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const phase = statusRef.current;
      const [inner, outer] = PALETTE[phase];

      const cx = width / 2;
      const cy = height / 2;
      const baseR = Math.min(width, height) * 0.17;

      const level = Math.min(1, levelRef.current * 4);
      let target = 0.12;
      if (phase === "listening") target = 0.12 + level * 0.9;
      else if (phase === "speaking") target = 0.35 + Math.abs(Math.sin(t * 6)) * 0.5;
      else if (phase === "thinking") target = 0.28 + Math.abs(Math.sin(t * 3)) * 0.22;
      else if (phase === "loading") target = 0.2 + Math.abs(Math.sin(t * 2)) * 0.15;
      energy += (target - energy) * 0.12;
      hueMix += ((phase === "idle" ? 0 : 1) - hueMix) * 0.05;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      const layers = 3;
      for (let l = 0; l < layers; l++) {
        const lf = 1 - l * 0.22;
        const points = 96;
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const a = (i / points) * Math.PI * 2;
          const wobble =
            Math.sin(a * 3 + t * 1.3 + l) * 0.06 +
            Math.sin(a * 5 - t * 1.7 + l * 2) * 0.045 +
            Math.sin(a * 8 + t * 0.9) * 0.03;
          const r =
            baseR * lf * (1 + wobble * (0.6 + energy * 2.4) + energy * 0.55);
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        const glow = ctx.createRadialGradient(cx, cy, baseR * 0.1, cx, cy, baseR * (1 + energy) * 1.3);
        glow.addColorStop(0, lerpColor(inner, outer, l / layers));
        glow.addColorStop(1, "rgba(5,7,13,0)");
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.5 - l * 0.12;
        ctx.shadowBlur = 40 + energy * 90;
        ctx.shadowColor = inner;
        ctx.fill();
      }

      ctx.globalAlpha = 0.9;
      ctx.shadowBlur = 12;
      const particles = 26;
      for (let i = 0; i < particles; i++) {
        const a = (i / particles) * Math.PI * 2 + t * (0.3 + hueMix * 0.5);
        const orbit = baseR * (1.5 + energy * 1.1) + Math.sin(t * 2 + i) * 6;
        const x = cx + Math.cos(a) * orbit;
        const y = cy + Math.sin(a) * orbit;
        const pr = 1 + (i % 3) * 0.9 + energy * 2.5;
        ctx.beginPath();
        ctx.arc(x, y, pr, 0, Math.PI * 2);
        ctx.fillStyle = inner;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [levelRef]);

  return <canvas ref={canvasRef} className="organism" aria-hidden="true" />;
}
