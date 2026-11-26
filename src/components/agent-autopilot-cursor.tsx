"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pause, Play, SkipForward, Square, Target } from "lucide-react";

export interface GhostCursorTarget {
  x: number;
  y: number;
  label: string;
  pulseKey: number;
}

interface AgentAutopilotCursorProps {
  target: GhostCursorTarget | null;
}

export function AgentAutopilotCursor({ target }: AgentAutopilotCursorProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {target && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
        >
          {/* SVG Sightline Targeting Beam from bottom Agent Dock to target coordinates */}
          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="autopilot-beam-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#38D9A9" stopOpacity="0.15" />
                <stop offset="55%" stopColor="#FF9F38" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <motion.line
              key={`beam-${target.pulseKey}`}
              x1="50%"
              y1="96%"
              x2={target.x}
              y2={target.y}
              stroke="url(#autopilot-beam-grad)"
              strokeWidth="1.5"
              strokeDasharray="6 5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          </svg>

          {/* Spring-gliding Stark HUD Ghost Cursor + Intent Badge */}
          <motion.div
            initial={
              reducedMotion
                ? { opacity: 0, x: target.x, y: target.y }
                : { opacity: 0, scale: 0.85, x: target.x, y: target.y + 40 }
            }
            animate={{ opacity: 1, scale: 1, x: target.x, y: target.y }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={
              reducedMotion
                ? { duration: 0.12 }
                : { type: "spring", stiffness: 260, damping: 24, mass: 0.75 }
            }
            className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
          >
            {/* Expanding click lock-on ripple */}
            {!reducedMotion && (
              <motion.span
                key={`ripple-${target.pulseKey}`}
                initial={{ scale: 0.35, opacity: 0.95 }}
                animate={{ scale: 2.3, opacity: 0 }}
                transition={{ duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 -m-3 rounded-full border border-[#FF5A1F]"
              />
            )}

            {/* Diamond targeting reticle */}
            <div className="relative w-7 h-7 flex items-center justify-center">
              <span className="absolute inset-0 border border-[#FF9F38] rotate-45 bg-[#FF5A1F]/15" />
              <span className="w-2 h-2 rounded-full bg-[#FF5A1F]" />
            </div>

            {/* Floating intent telemetry pill */}
            <div className="absolute left-6 top-5 whitespace-nowrap px-2.5 py-1 bg-[#14171D]/95 border border-[#FF9F38]/70 font-mono text-[10px] tracking-wider text-[#FF9F38] shadow-[0_10px_28px_rgba(0,0,0,0.65)]">
              AI PILOT // {target.label}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export interface AutopilotStepMeta {
  index: number;
  total: number;
  title: string;
  narration: string;
}

interface AutopilotHudBarProps {
  step: AutopilotStepMeta | null;
  paused: boolean;
  onTogglePause: () => void;
  onNext: () => void;
  onStop: () => void;
}

export function AutopilotHudBar({
  step,
  paused,
  onTogglePause,
  onNext,
  onStop,
}: AutopilotHudBarProps) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {step && (
        <motion.aside
          key="autopilot-hud-bar"
          role="region"
          aria-label="Auto-UI Pilot guided tour controls"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.97 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          className="hud-frame fixed top-[74px] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl bg-[#161920]/96 backdrop-blur-md border border-[#FF9F38]/65 px-4 py-3 shadow-[0_18px_46px_rgba(0,0,0,0.72)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 font-mono text-[11px] telemetry-nums">
              <Target className="w-3.5 h-3.5 text-[#FF5A1F] signal-pulse shrink-0" />
              <span className="text-[#FF9F38] font-semibold">
                AUTOPILOT {step.index + 1}/{step.total}
              </span>
              <span className="text-[#9499A3]">·</span>
              <span className="text-[#EFF0F1]">{step.title}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onTogglePause}
                className="hud-btn inline-flex items-center gap-1 px-2.5 py-1 bg-[#121418] border border-[#2B303B] font-mono text-[11px] text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
              >
                {paused ? (
                  <>
                    <Play className="w-3 h-3 fill-current text-[#38D9A9]" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-[#FF9F38]" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNext}
                className="hud-btn inline-flex items-center gap-1 px-2.5 py-1 bg-[#121418] border border-[#2B303B] font-mono text-[11px] text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#38D9A9] cursor-pointer"
              >
                <span>Next</span>
                <SkipForward className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={onStop}
                className="hud-btn inline-flex items-center gap-1 px-2.5 py-1 bg-[#FF5A1F] text-[#121418] font-mono font-semibold text-[11px] hover:bg-[#ff6d38] cursor-pointer"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Take Over</span>
              </button>
            </div>
          </div>

          <p aria-live="polite" className="text-xs text-[#C4C8D0] mt-2 leading-relaxed">
            {step.narration}
          </p>

          {/* Progress rail */}
          <div className="mt-2.5 h-1 w-full bg-[#121418] border border-[#2B303B] overflow-hidden">
            <motion.div
              className="h-full bg-[#FF5A1F]"
              initial={false}
              animate={{ width: `${((step.index + 1) / step.total) * 100}%` }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
