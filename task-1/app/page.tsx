"use client";

import { useVoicePipeline } from "@/lib/useVoicePipeline";
import { VoiceOrganism } from "@/components/VoiceOrganism";
import { KeywordField } from "@/components/KeywordField";
import { MicControls } from "@/components/MicControls";

export default function Home() {
  const { status, keywords, latest, latestIds, error, levelRef, start, stop, clear } =
    useVoicePipeline();

  return (
    <main className="stage">
      <div className="stage__vignette" />

      <header className="brand">
        <div className="brand__mark">
          <span className="brand__pulse" />
          echobloom
        </div>
        <p className="brand__tag">speak — and watch your words bloom</p>
      </header>

      <div className="stage__scene">
        <VoiceOrganism status={status} levelRef={levelRef} />
        <KeywordField keywords={keywords} latestIds={latestIds} />

        {keywords.length === 0 && status !== "loading" && (
          <p className="stage__hint">
            {status === "idle"
              ? "Press start, allow the mic, then just talk."
              : "Say something — your keywords will bloom here."}
          </p>
        )}
      </div>

      <MicControls
        status={status}
        error={error}
        latest={latest}
        hasKeywords={keywords.length > 0}
        onStart={start}
        onStop={stop}
        onClear={clear}
      />
    </main>
  );
}
