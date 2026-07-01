"use client";

import { motion } from "framer-motion";
import type { PipelineStatus } from "@/lib/types";

interface Props {
  status: PipelineStatus;
  error: string | null;
  latest: string[];
  hasKeywords: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
}

const STATUS_LABEL: Record<PipelineStatus, string> = {
  idle: "Tap to begin",
  loading: "Warming up the microphone…",
  listening: "Listening — speak now",
  thinking: "Extracting keywords…",
  speaking: "Reading them back…",
  error: "Something needs attention",
};

export function MicControls({
  status,
  error,
  latest,
  hasKeywords,
  onStart,
  onStop,
  onClear,
}: Props) {
  const active = status !== "idle" && status !== "error";
  const busy = status === "loading";

  return (
    <div className="controls">
      {latest.length > 0 && active && (
        <motion.div
          className="controls__latest"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={latest.join("|")}
        >
          <span className="controls__latest-label">just heard</span>
          {latest.map((k) => (
            <span className="chip" key={k}>
              {k}
            </span>
          ))}
        </motion.div>
      )}

      <div className="controls__status">
        <span className={`dot dot--${status}`} />
        {error ?? STATUS_LABEL[status]}
      </div>

      <div className="controls__buttons">
        <button
          className={`mic-btn${active ? " mic-btn--active" : ""}`}
          onClick={active ? onStop : onStart}
          disabled={busy}
          aria-label={active ? "Stop listening" : "Start listening"}
        >
          {busy ? "…" : active ? "Stop" : "Start"}
        </button>

        {hasKeywords && (
          <button className="ghost-btn" onClick={onClear} aria-label="Clear keywords">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
