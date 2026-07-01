"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Keyword } from "@/lib/types";

interface Props {
  keywords: Keyword[];
  latestIds: string[];
}

const GOLDEN_ANGLE = 2.399963229728653;

export function KeywordField({ keywords, latestIds }: Props) {
  return (
    <div className="keyword-field" aria-live="polite">
      <AnimatePresence>
        {keywords.map((k, i) => {
          const angle = i * GOLDEN_ANGLE;
          const radius = 160 + Math.sqrt(i + 1) * 52;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius * 0.7;
          const size = 15 + Math.min(k.weight, 6) * 6;
          const isLatest = latestIds.includes(k.id);

          return (
            <motion.span
              key={k.id}
              className={`keyword${isLatest ? " keyword--latest" : ""}`}
              style={{ fontSize: size }}
              initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
              animate={{
                opacity: 1,
                scale: 1,
                x,
                y,
                transition: { type: "spring", stiffness: 90, damping: 13, mass: 0.7 },
              }}
              exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
            >
              {k.text}
              {k.weight > 1 && <sup className="keyword__count">×{k.weight}</sup>}
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
