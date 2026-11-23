"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Keyboard,
  MessageSquareText,
  Mic,
  MicOff,
  Send,
  Square,
  Terminal,
} from "lucide-react";
import { MiniAcousticIris } from "@/components/acoustic-iris";
import type { TranscriptLine } from "@/hooks/use-livekit-agent";
import type {
  AgentVisualState,
  SignalTraceEntry,
  TurnLatencyMetrics,
} from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

interface AgentDockProps {
  visible: boolean;
  connected: boolean;
  agentState: AgentVisualState;
  micEnabled: boolean;
  micPermissionError: string | null;
  connectionError: string | null;
  transcript: TranscriptLine[];
  traceLog: SignalTraceEntry[];
  latestMetrics: TurnLatencyMetrics | null;
  textInputOpen: boolean;
  onToggleTextInput: () => void;
  onToggleMic: () => void;
  onSendText: (text: string) => Promise<boolean>;
  onEndSession: () => void;
}

const STATE_LABEL: Record<AgentVisualState, string> = {
  idle: "IDLE",
  connecting: "CONNECTING",
  listening: "LISTENING",
  thinking: "THINKING",
  executing: "EXECUTING",
  speaking: "SPEAKING",
  offline: "OFFLINE",
};

export function AgentDock({
  visible,
  connected,
  agentState,
  micEnabled,
  micPermissionError,
  connectionError,
  transcript,
  traceLog,
  latestMetrics,
  textInputOpen,
  onToggleTextInput,
  onToggleMic,
  onSendText,
  onEndSession,
}: AgentDockProps) {
  const [traceOpen, setTraceOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const reducedMotion = useReducedMotion();

  const latestLine = transcript[transcript.length - 1];
  const latestTrace = traceLog[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await onSendText(draft);
    if (ok) setDraft("");
    setSending(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="agent-dock"
          role="region"
          aria-label="Live AI Voice Agent Dock"
          initial={reducedMotion ? { opacity: 0 } : { y: 84, opacity: 0 }}
          animate={reducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { y: 84, opacity: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-[#14171D] border-t border-[#3B4252] shadow-[0_-16px_42px_rgba(0,0,0,0.7)]"
        >
          {/* Thinking scan bar */}
          {agentState === "thinking" && (
            <div className="h-[2px] w-full bg-[#22262E] overflow-hidden" aria-hidden="true">
              <div className="h-full w-1/3 bg-[#FF9F38] scan-sweep" />
            </div>
          )}

          {/* Expandable full transcript history */}
          <AnimatePresence>
            {historyOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="border-b border-[#2B303B] bg-[#121418] max-h-56 overflow-y-auto px-4 md:px-8 py-4 space-y-2.5"
              >
                <div className="flex items-center justify-between font-mono text-xs text-[#9499A3] pb-2 border-b border-[#2B303B]">
                  <span>SESSION TRANSCRIPT ({transcript.length})</span>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(false)}
                    className="hover:text-[#EFF0F1] cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
                {transcript.length === 0 ? (
                  <p className="text-xs text-[#9499A3]">No messages yet in this session.</p>
                ) : (
                  transcript.map((line) => (
                    <div key={line.id} className="text-sm flex gap-3">
                      <span
                        className={cn(
                          "font-mono text-xs uppercase w-16 shrink-0 pt-0.5",
                          line.speaker === "agent" ? "text-[#FF9F38]" : "text-[#38D9A9]"
                        )}
                      >
                        {line.speaker}
                      </span>
                      <p className="text-[#EFF0F1]/90 leading-relaxed">{line.text}</p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {(connectionError || micPermissionError) && (
            <div
              role="status"
              className="px-4 md:px-8 py-2.5 bg-[#22262E] border-b border-[#2B303B] text-xs text-[#EFF0F1] flex flex-wrap items-center justify-between gap-2"
            >
              <span>{connectionError || micPermissionError}</span>
              <span className="font-mono text-[#9499A3]">
                {connectionError ? "See .env.example & agent/README.md" : "Text fallback active"}
              </span>
            </div>
          )}

          {/* Main Dock row */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center gap-3 md:gap-5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="shrink-0">
                <MiniAcousticIris state={agentState} size={42} />
              </div>

              <div className="min-w-0 flex-1" aria-live="polite">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={cn(
                      "font-semibold",
                      agentState === "listening"
                        ? "text-[#38D9A9]"
                        : agentState === "speaking" || agentState === "executing"
                          ? "text-[#FF9F38]"
                          : "text-[#9499A3]"
                    )}
                  >
                    {STATE_LABEL[agentState]}
                  </span>
                  {connected && (
                    <span className="text-[#9499A3] hidden sm:inline">· LIVEKIT WEBRTC</span>
                  )}
                </div>
                <p className="text-sm text-[#EFF0F1] truncate mt-0.5">
                  {latestLine
                    ? `${latestLine.speaker === "visitor" ? "You: " : ""}${latestLine.text}`
                    : connected
                      ? "Connected. Speak naturally or type a question about Istekhar's work."
                      : "Voice backend offline — browse the portfolio directly or configure LiveKit in .env."}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onToggleMic}
                className={cn(
                  "hud-btn inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium cursor-pointer",
                  micEnabled
                    ? "border-[#38D9A9] bg-[#38D9A9]/15 text-[#EFF0F1]"
                    : "border-[#3B4252] bg-[#1A1D23] text-[#C4C8D0] hover:text-[#EFF0F1]"
                )}
                aria-pressed={micEnabled}
              >
                {micEnabled ? (
                  <Mic className="w-3.5 h-3.5 text-[#38D9A9]" />
                ) : (
                  <MicOff className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{micEnabled ? "Mute" : "Mic"}</span>
              </button>

              <button
                type="button"
                onClick={onToggleTextInput}
                className={cn(
                  "hud-btn inline-flex items-center gap-1.5 px-3 py-2 border text-xs font-medium cursor-pointer",
                  textInputOpen
                    ? "border-[#EFF0F1] bg-[#22262E] text-[#EFF0F1]"
                    : "border-[#3B4252] bg-[#1A1D23] text-[#C4C8D0] hover:text-[#EFF0F1]"
                )}
                aria-expanded={textInputOpen}
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Type</span>
              </button>

              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className="hud-btn inline-flex items-center gap-1.5 px-3 py-2 border border-[#3B4252] bg-[#1A1D23] text-xs text-[#C4C8D0] hover:text-[#EFF0F1] cursor-pointer"
                title="Toggle transcript history"
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Log</span>
              </button>

              <button
                type="button"
                onClick={onEndSession}
                className="hud-btn inline-flex items-center gap-1.5 px-3 py-2 border border-[#FF5A1F]/55 bg-[#1A1D23] text-xs text-[#FF5A1F] hover:bg-[#FF5A1F]/15 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>End</span>
              </button>

              <button
                type="button"
                onClick={() => setTraceOpen((v) => !v)}
                className="hud-btn inline-flex items-center gap-1.5 px-3 py-2 border border-[#2B303B] bg-[#121418] font-mono text-xs text-[#9499A3] hover:text-[#EFF0F1] cursor-pointer"
                aria-expanded={traceOpen}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Signal Trace</span>
                {traceOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Text fallback input row */}
          <AnimatePresence>
            {textInputOpen && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmit}
                className="border-t border-[#2B303B] bg-[#121418] px-4 md:px-8 py-2.5 overflow-hidden"
              >
                <div className="max-w-7xl mx-auto flex items-center gap-2">
                  <label htmlFor="dock-text-input" className="sr-only">
                    Ask Istekhar&apos;s AI representative a question
                  </label>
                  <input
                    id="dock-text-input"
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder='Ask via text — e.g. "What is OpenCalls?" or "How can I contact him?"'
                    className="flex-1 bg-[#1A1D23] border border-[#3B4252] px-3.5 py-2 text-sm text-[#EFF0F1] placeholder:text-[#9499A3] focus:border-[#FF5A1F] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="hud-btn inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5A1F] text-[#121418] font-semibold text-xs disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Collapsible Signal Trace bar */}
          {traceOpen && (
            <div className="border-t border-[#2B303B] bg-[#0F1116] px-4 md:px-8 py-2">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-xs telemetry-nums">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#9499A3]">RPC ui.action</span>
                  <span className="text-[#FF9F38]">→</span>
                  {latestTrace ? (
                    <span className={latestTrace.ok ? "text-[#EFF0F1] truncate" : "text-[#FF5A1F]"}>
                      {latestTrace.actionLabel} {latestTrace.ok ? "✓" : `✕ ${latestTrace.error ?? ""}`}
                    </span>
                  ) : (
                    <span className="text-[#9499A3]">awaiting agent tool call…</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[#9499A3]">
                  <span>VAD {latestMetrics?.vadMs ? `${latestMetrics.vadMs}ms` : "—"}</span>
                  <span>STT {latestMetrics?.sttMs ? `${latestMetrics.sttMs}ms` : "—"}</span>
                  <span>LLM {latestMetrics?.llmTtftMs ? `${latestMetrics.llmTtftMs}ms` : "—"}</span>
                  <span>TTS {latestMetrics?.ttsTtfbMs ? `${latestMetrics.ttsTtfbMs}ms` : "—"}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
