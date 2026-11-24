"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Download,
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
import {
  AGENT_PERSONAS,
  AGENT_VOICES,
  type AgentPersonaId,
  type AgentVisualState,
  type AgentVoiceKey,
  type SignalTraceEntry,
  type TurnLatencyMetrics,
} from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

interface AgentDockProps {
  visible: boolean;
  connected: boolean;
  agentState: AgentVisualState;
  activePersona: AgentPersonaId;
  activeVoiceKey: AgentVoiceKey;
  onSelectVoice: (voiceKey: AgentVoiceKey) => void;
  micEnabled: boolean;
  micPermissionError: string | null;
  connectionError: string | null;
  transcript: TranscriptLine[];
  traceLog: SignalTraceEntry[];
  latestMetrics: TurnLatencyMetrics | null;
  metricsHistory: TurnLatencyMetrics[];
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
  activePersona,
  activeVoiceKey,
  onSelectVoice,
  micEnabled,
  micPermissionError,
  connectionError,
  transcript,
  traceLog,
  latestMetrics,
  metricsHistory,
  textInputOpen,
  onToggleTextInput,
  onToggleMic,
  onSendText,
  onEndSession,
}: AgentDockProps) {
  const [traceOpen, setTraceOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const reducedMotion = useReducedMotion();

  const latestLine = transcript[transcript.length - 1];
  const latestTrace = traceLog[0];

  // Keyboard hotkey: press M to toggle mute during an active voice session (ignored when typing)
  useEffect(() => {
    if (!visible || !connected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        onToggleMic();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [connected, onToggleMic, visible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await onSendText(draft);
    if (ok) setDraft("");
    setSending(false);
  };

  const handleExportSession = () => {
    const personaLabel =
      AGENT_PERSONAS.find((p) => p.id === activePersona)?.label ?? activePersona;
    const voiceLabel =
      AGENT_VOICES.find((v) => v.key === activeVoiceKey)?.label ?? activeVoiceKey;

    const lines: string[] = [
      `# Signal Room — LiveKit Voice Session Transcript`,
      ``,
      `- **Persona:** ${personaLabel}`,
      `- **ElevenLabs Voice:** ${voiceLabel}`,
      `- **Exported:** ${new Date().toISOString()}`,
      ``,
      `## Conversation`,
      ...(transcript.length === 0
        ? ["_No conversation lines recorded yet._"]
        : transcript.map((t) => `- **${t.speaker.toUpperCase()}:** ${t.text}`)),
      ``,
      `## RPC Tool Calls (\`ui.action\`)`,
      ...(traceLog.length === 0
        ? ["_No RPC tool calls recorded._"]
        : traceLog.map(
            (entry) =>
              `- \`${entry.actionLabel}\` — ${entry.ok ? "OK" : `ERROR: ${entry.error ?? ""}`}`
          )),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signal-room-session-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
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

          {/* Expandable RPC Telemetry & Voice Config Inspector */}
          <AnimatePresence>
            {inspectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="border-b border-[#2B303B] bg-[#111318] max-h-72 overflow-y-auto px-4 md:px-8 py-4"
              >
                <div className="max-w-7xl mx-auto space-y-4">
                  {/* Top row: ElevenLabs voice selector + export button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2B303B]">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="text-[#9499A3]">ELEVENLABS VOICE:</span>
                      {AGENT_VOICES.map((v) => {
                        const active = v.key === activeVoiceKey;
                        return (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => onSelectVoice(v.key)}
                            title={v.tone}
                            className={cn(
                              "hud-btn px-2.5 py-1 border text-[11px] cursor-pointer",
                              active
                                ? "border-[#FF9F38] bg-[#FF9F38]/14 text-[#EFF0F1]"
                                : "border-[#2B303B] bg-[#161920] text-[#9499A3] hover:text-[#EFF0F1]"
                            )}
                          >
                            {v.label} · {v.tone.split("·")[0].trim()}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportSession}
                        className="hud-btn inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#2B303B] bg-[#161920] font-mono text-[11px] text-[#38D9A9] hover:border-[#38D9A9] cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export .md</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectorOpen(false)}
                        className="font-mono text-xs text-[#9499A3] hover:text-[#EFF0F1] cursor-pointer"
                      >
                        Hide
                      </button>
                    </div>
                  </div>

                  {/* Two columns: Live RPC JSON Payloads + Multi-Turn Latency Log */}
                  <div className="grid md:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="space-y-2">
                      <div className="text-[#9499A3] text-[11px]">
                        LIVE RPC STREAM (`ui.action` · {traceLog.length})
                      </div>
                      {traceLog.length === 0 ? (
                        <div className="p-3 border border-[#2B303B] bg-[#14171D] text-[#9499A3]">
                          No agent RPC calls yet. Ask the voice agent to open OpenCalls, architecture,
                          or writing.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {traceLog.map((entry) => (
                            <div
                              key={entry.id}
                              className="p-2.5 border border-[#2B303B] bg-[#14171D] space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "truncate font-medium",
                                    entry.ok ? "text-[#38D9A9]" : "text-[#FF5A1F]"
                                  )}
                                >
                                  {entry.actionLabel}
                                </span>
                                <span className="text-[10px] text-[#9499A3] shrink-0 telemetry-nums">
                                  {entry.ok ? "OK" : "REJECTED"}
                                </span>
                              </div>
                              {entry.payload && (
                                <pre className="text-[10px] text-[#C4C8D0] bg-[#111318] p-2 overflow-x-auto border border-[#22262E]">
                                  {entry.payload}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-[#9499A3] text-[11px]">
                        MEASURED TURN LATENCY HISTORY ({metricsHistory.length})
                      </div>
                      {metricsHistory.length === 0 ? (
                        <div className="p-3 border border-[#2B303B] bg-[#14171D] text-[#9499A3]">
                          Real per-turn VAD / STT / LLM TTFT / TTS TTFB readings appear here during a
                          LiveKit session.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 telemetry-nums">
                          {metricsHistory.map((m, idx) => (
                            <div
                              key={`${m.measuredAt}-${idx}`}
                              className="px-3 py-2 border border-[#2B303B] bg-[#14171D] flex items-center justify-between gap-2 text-[11px]"
                            >
                              <span className="text-[#9499A3]">
                                T-{metricsHistory.length - idx}
                              </span>
                              <span className="text-[#38D9A9]">VAD {m.vadMs ?? "—"}ms</span>
                              <span className="text-[#38D9A9]">STT {m.sttMs ?? "—"}ms</span>
                              <span className="text-[#FF9F38]">LLM {m.llmTtftMs ?? "—"}ms</span>
                              <span className="text-[#FF5A1F]">TTS {m.ttsTtfbMs ?? "—"}ms</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleExportSession}
                      className="inline-flex items-center gap-1 text-[#38D9A9] hover:underline cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export .md</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen(false)}
                      className="hover:text-[#EFF0F1] cursor-pointer"
                    >
                      Hide
                    </button>
                  </div>
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
                  <span className="text-[#9499A3] hidden sm:inline">
                    ·{" "}
                    {AGENT_PERSONAS.find((p) => p.id === activePersona)?.badge ?? "PORTFOLIO REP"}{" "}
                    ·{" "}
                    {(
                      AGENT_VOICES.find((v) => v.key === activeVoiceKey)?.label ?? "Sarah"
                    ).toUpperCase()}
                    {connected ? " · LIVEKIT WEBRTC" : ""}
                  </span>
                </div>
                <p className="text-sm text-[#EFF0F1] truncate mt-0.5">
                  {latestLine
                    ? `${latestLine.speaker === "visitor" ? "You: " : ""}${latestLine.text}`
                    : connected
                      ? "Connected. Speak naturally (press M to mute) or type a question."
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
                title="Toggle microphone (shortcut: M)"
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
                className={cn(
                  "hud-btn inline-flex items-center gap-1.5 px-3 py-2 border text-xs cursor-pointer",
                  historyOpen
                    ? "border-[#FF9F38] bg-[#22262E] text-[#EFF0F1]"
                    : "border-[#3B4252] bg-[#1A1D23] text-[#C4C8D0] hover:text-[#EFF0F1]"
                )}
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
                onClick={() => {
                  setInspectorOpen((v) => !v);
                  setTraceOpen(true);
                }}
                className={cn(
                  "hud-btn inline-flex items-center gap-1.5 px-3 py-2 border font-mono text-xs cursor-pointer",
                  inspectorOpen
                    ? "border-[#38D9A9] bg-[#38D9A9]/12 text-[#EFF0F1]"
                    : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                )}
                aria-expanded={inspectorOpen}
                title="Inspect RPC JSON payloads, turn latency history, and ElevenLabs voice"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Inspector</span>
                {inspectorOpen ? (
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

          {/* Compact Signal Trace summary rail */}
          {traceOpen && (
            <div className="border-t border-[#2B303B] bg-[#0F1116] px-4 md:px-8 py-2">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-xs telemetry-nums">
                <button
                  type="button"
                  onClick={() => setInspectorOpen((v) => !v)}
                  className="flex items-center gap-2 min-w-0 text-left hover:text-[#EFF0F1] cursor-pointer"
                >
                  <span className="text-[#9499A3]">RPC ui.action</span>
                  <span className="text-[#FF9F38]">→</span>
                  {latestTrace ? (
                    <span className={latestTrace.ok ? "text-[#EFF0F1] truncate" : "text-[#FF5A1F]"}>
                      {latestTrace.actionLabel} {latestTrace.ok ? "✓" : `✕ ${latestTrace.error ?? ""}`}
                    </span>
                  ) : (
                    <span className="text-[#9499A3]">awaiting agent tool call…</span>
                  )}
                </button>

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
