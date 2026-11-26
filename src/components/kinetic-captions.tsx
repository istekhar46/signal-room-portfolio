"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { TranscriptLine } from "@/hooks/use-livekit-agent";
import { cn } from "@/lib/utils";

const HIGHLIGHT_TERMS = new Set([
  "opencalls",
  "livekit",
  "elevenlabs",
  "grpc",
  "opentelemetry",
  "webrtc",
  "sip",
  "redis",
  "lua",
  "celery",
  "rabbitmq",
  "signoz",
  "invoiceo",
  "vocode",
  "stft",
]);

interface KineticCaptionsProps {
  visible: boolean;
  line: TranscriptLine | undefined;
}

export function KineticCaptions({ visible, line }: KineticCaptionsProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && line && line.text.trim().length > 0 && (
        <motion.div
          key={line.id}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          aria-live="polite"
          className="pointer-events-none fixed bottom-32 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl px-4 py-2.5 bg-[#121418]/92 backdrop-blur-md border border-[#3B4252] shadow-[0_14px_38px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5 border shrink-0 mt-0.5",
                line.speaker === "agent"
                  ? "border-[#FF9F38]/55 text-[#FF9F38] bg-[#FF9F38]/10"
                  : "border-[#38D9A9]/55 text-[#38D9A9] bg-[#38D9A9]/10"
              )}
            >
              {line.speaker === "agent" ? "AI" : "YOU"}
            </span>
            <p className="text-sm text-[#EFF0F1] leading-snug">
              {line.text.split(/\s+/).map((word, idx) => {
                const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
                const emphasized = HIGHLIGHT_TERMS.has(clean);
                return (
                  <span
                    key={`${line.id}-${idx}`}
                    className={cn(
                      "inline-block mr-[0.28em]",
                      emphasized && "text-[#FF9F38] font-semibold"
                    )}
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const RAIL_SECTIONS: { id: string; short: string }[] = [
  { id: "hero", short: "00" },
  { id: "voice-lab", short: "VL" },
  { id: "about", short: "AB" },
  { id: "projects", short: "PR" },
  { id: "writing", short: "WR" },
  { id: "experience", short: "EX" },
  { id: "stack", short: "ST" },
  { id: "contact", short: "TX" },
];

interface SignalScrollRailProps {
  activeSectionId: string;
  onJump: (id: string) => void;
}

export function SignalScrollRail({ activeSectionId, onJump }: SignalScrollRailProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      setProgress(Math.max(0, Math.min(1, window.scrollY / max)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const pct = String(Math.round(progress * 100)).padStart(2, "0");

  return (
    <aside
      aria-label="Section telemetry fader"
      className="hidden xl:flex fixed right-3.5 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-2 py-2.5 px-1.5 bg-[#14171D]/85 border border-[#2B303B]"
    >
      <span className="font-mono text-[9px] text-[#9499A3] telemetry-nums">{pct}%</span>

      <div className="relative w-full flex flex-col items-center gap-1.5 py-1">
        {RAIL_SECTIONS.map((sec) => {
          const active = activeSectionId === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onJump(sec.id)}
              title={`Jump to ${sec.id}`}
              aria-label={`Jump to ${sec.id} section`}
              className={cn(
                "w-6 h-5 font-mono text-[9px] grid place-items-center border transition-colors cursor-pointer",
                active
                  ? "border-[#FF9F38] bg-[#FF9F38]/16 text-[#FF9F38] font-semibold"
                  : "border-transparent text-[#9499A3]/75 hover:text-[#EFF0F1] hover:border-[#2B303B]"
              )}
            >
              {sec.short}
            </button>
          );
        })}
      </div>

      {/* Mini vertical hardware fader gauge */}
      <div className="w-1 h-12 bg-[#121418] border border-[#2B303B] overflow-hidden">
        <div
          className="w-full bg-[#FF5A1F] transition-[height] duration-150"
          style={{ height: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </aside>
  );
}
