"use client";

import { useState } from "react";
import { ArrowRight, MessageSquare, Mic, Plus, Radio, RotateCcw } from "lucide-react";
import { LatencyPlayground } from "@/components/latency-playground";
import { VoiceSystemsLab } from "@/components/voice-systems-lab";
import { SignalSpectrogram, type SimulationSnapshot } from "@/components/signal-spectrogram";
import { PORTFOLIO, type VoiceTopicId } from "@/data/portfolio";
import { signalSound } from "@/lib/signal-sound";
import type { AgentVisualState, TurnLatencyMetrics } from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

interface VoiceLabProps {
  selectedTopic: VoiceTopicId;
  onSelectTopic: (topic: VoiceTopicId) => void;
  agentState: AgentVisualState;
  connected: boolean;
  latestMetrics: TurnLatencyMetrics | null;
  micBinsRef: React.RefObject<Uint8Array>;
  agentBinsRef: React.RefObject<Uint8Array>;
  highlighted: boolean;
  onStartVoice: () => void;
  onAskAbout: (prompt: string) => void;
  onInspectArchitecture: () => void;
}

const PIPELINE_NODES: {
  id: VoiceTopicId | "mic" | "speaker";
  label: string;
  topic: VoiceTopicId;
}[] = [
  { id: "mic", label: "MIC", topic: "webrtc" },
  { id: "vad", label: "VAD", topic: "vad" },
  { id: "stt", label: "STT", topic: "stt" },
  { id: "llm", label: "LLM + TOOLS", topic: "llm" },
  { id: "tts", label: "TTS", topic: "tts" },
  { id: "speaker", label: "SPEAKER", topic: "tts" },
];

const EXTRA_TOPICS: VoiceTopicId[] = ["webrtc", "sip", "telephony", "latency", "tools"];

export function VoiceLab({
  selectedTopic,
  onSelectTopic,
  agentState,
  connected,
  latestMetrics,
  micBinsRef,
  agentBinsRef,
  highlighted,
  onStartVoice,
  onAskAbout,
  onInspectArchitecture,
}: VoiceLabProps) {
  const [audioWorkbenchOpen, setAudioWorkbenchOpen] = useState(false);
  const [workbenchMode, setWorkbenchMode] = useState<"spectrogram" | "latency">("spectrogram");
  const [sim, setSim] = useState<SimulationSnapshot>({
    active: false,
    phase: "idle",
    stageState: "idle",
    bargeInFlashed: false,
    caption: "",
    metrics: null,
  });

  const activeTopicData =
    PORTFOLIO.voiceTopics.find((t) => t.id === selectedTopic) ?? PORTFOLIO.voiceTopics[0];

  const effectiveLive = connected || sim.active;
  const effectiveState: AgentVisualState = connected ? agentState : sim.stageState;

  const isNodeLive = (nodeId: string): "mint" | "signal" | null => {
    if (!effectiveLive) return null;
    if (
      effectiveState === "listening" &&
      (nodeId === "mic" || nodeId === "vad" || nodeId === "stt")
    ) {
      return "mint";
    }
    if ((effectiveState === "thinking" || effectiveState === "executing") && nodeId === "llm") {
      return "signal";
    }
    if (effectiveState === "speaking" && (nodeId === "tts" || nodeId === "speaker")) {
      return "signal";
    }
    return null;
  };

  const hasLiveMetrics = Boolean(
    latestMetrics &&
      (latestMetrics.vadMs ||
        latestMetrics.sttMs ||
        latestMetrics.llmTtftMs ||
        latestMetrics.ttsTtfbMs)
  );
  const displayMetrics = hasLiveMetrics ? latestMetrics : sim.active ? sim.metrics : null;
  const metricsMode: "live" | "simulated" | "standby" = hasLiveMetrics
    ? "live"
    : sim.active && sim.metrics
      ? "simulated"
      : "standby";

  // Proportional latency budget segments against a 900ms conversational budget bar
  const budgetCapMs = Math.max(900, displayMetrics?.totalMs ?? 900);
  const segWidth = (ms?: number) => (ms ? `${Math.min(100, (ms / budgetCapMs) * 100)}%` : "0%");

  return (
    <section
      id="voice-lab"
      aria-labelledby="voice-lab-heading"
      className="py-16 md:py-20 border-t border-[#2B303B]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <h2
            id="voice-lab-heading"
            className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] font-medium tracking-[-0.02em] text-[#EFF0F1] max-w-3xl leading-[1.2]"
          >
            A conversation, under pressure.
          </h2>
          <div className={cn("items-center gap-2 font-mono text-xs text-[#9499A3] telemetry-nums", connected || sim.active ? "flex" : "hidden")}>
            <Radio
              className={cn(
                "w-3.5 h-3.5",
                connected
                  ? "text-[#38D9A9] signal-pulse"
                  : sim.active
                    ? "text-[#FF9F38] signal-pulse"
                    : "text-[#9499A3]"
              )}
            />
            <span>
              {connected
                ? `LIVE SESSION SYNC · STATE ${agentState.toUpperCase()}`
                : sim.active
                  ? `SIMULATED CALL · ${sim.phase.toUpperCase()}`
                  : "VOICE AI + DISTRIBUTED SYSTEMS"}
            </span>
          </div>
        </div>

        <p className="mb-8 max-w-2xl text-base leading-relaxed text-[#C4C8D0]">
          Interrupt a turn. Change its prompt. Deliver an event twice.
          Explore the decisions that keep a voice system coherent when things change.
        </p>
        <VoiceSystemsLab />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[#9499A3]">The model is local. The engineering decisions come from building OpenCalls.</p>
          <button type="button" onClick={onInspectArchitecture} className="inline-flex min-h-11 items-center gap-2 text-[#EFF0F1] hover:text-[#38D9A9]">Inspect the architecture<ArrowRight className="h-4 w-4" /></button>
        </div>

        <details
          id="audio-workbench"
          className="group mt-8 border-y border-[#3B4252]"
          onToggle={(event) => {
            const open = event.currentTarget.open;
            setAudioWorkbenchOpen(open);
            if (!open) setSim((previous) => ({ ...previous, active: false, phase: "idle", stageState: "idle", metrics: null }));
          }}
        >
          <summary className="flex min-h-16 cursor-pointer list-none flex-wrap items-center justify-between gap-2 py-5 text-sm text-[#EFF0F1] hover:text-[#38D9A9]">
            <span>Open the audio workbench</span>
            <span className="flex items-center gap-3 text-xs text-[#9499A3]">
              STFT spectrum, barge-in &amp; latency experiments
              <Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-[#38D9A9] group-open:rotate-45" />
            </span>
          </summary>
          {audioWorkbenchOpen ? (

        <div
          className={cn(
            "bg-[#1A1D23] border border-[#2B303B] p-5 md:p-8 signal-grid transition-colors relative overflow-hidden",
            highlighted && "target-locked"
          )}
        >
          {/* Animated holographic signal flow rail */}
          <svg
            viewBox="0 0 1000 18"
            className="w-full h-4 mb-4 hidden lg:block"
            fill="none"
            aria-hidden="true"
          >
            <line x1="20" y1="9" x2="980" y2="9" stroke="#2B303B" strokeWidth="1.5" />
            <line
              x1="20"
              y1="9"
              x2="500"
              y2="9"
              stroke="#38D9A9"
              strokeWidth="2"
              className="signal-travel"
            />
            <line
              x1="500"
              y1="9"
              x2="980"
              y2="9"
              stroke="#FF9F38"
              strokeWidth="2"
              className="signal-travel"
              style={{ animationDelay: "-1.2s" }}
            />
          </svg>

          {/* Main horizontal pipeline */}
          <div
            className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3"
            role="tablist"
            aria-label="Real-time voice pipeline stages"
          >
            {PIPELINE_NODES.map((node, index) => {
              const live = isNodeLive(node.id);
              const isSelected = selectedTopic === node.topic && node.id !== "speaker";

              return (
                <div
                  key={node.id}
                  className="flex items-center gap-2 lg:gap-3 flex-1 min-w-[110px]"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => onSelectTopic(node.topic)}
                    className={cn(
                      "hud-btn w-full py-4 px-3 border text-left relative cursor-pointer",
                      live === "mint"
                        ? "border-[#38D9A9] bg-[#38D9A9]/10 text-[#EFF0F1]"
                        : live === "signal"
                          ? "border-[#FF5A1F] bg-[#FF5A1F]/12 text-[#EFF0F1]"
                          : isSelected
                            ? "border-[#EFF0F1]/75 bg-[#22262E] text-[#EFF0F1]"
                            : "border-[#2B303B] bg-[#121418] text-[#C4C8D0] hover:border-[#9499A3]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs md:text-sm font-medium tracking-wide">
                        {node.label}
                      </span>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          live === "mint"
                            ? "bg-[#38D9A9]"
                            : live === "signal"
                              ? "bg-[#FF5A1F]"
                              : isSelected
                                ? "bg-[#EFF0F1]"
                                : "bg-[#2B303B]"
                        )}
                      />
                    </div>
                  </button>
                  {index < PIPELINE_NODES.length - 1 && (
                    <ArrowRight
                      aria-hidden="true"
                      className={cn(
                        "w-4 h-4 shrink-0 hidden sm:block",
                        live === "mint"
                          ? "text-[#38D9A9]"
                          : live === "signal"
                            ? "text-[#FF5A1F]"
                            : "text-[#4D5768]"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback loop rail */}
          <div className="mt-5 pt-4 border-t border-[#2B303B] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#C4C8D0]">
            <button
              type="button"
              onClick={() => onSelectTopic("latency")}
              className={cn(
                "hud-btn inline-flex items-center gap-2 px-3 py-1.5 border cursor-pointer transition-colors",
                sim.bargeInFlashed
                  ? "border-[#FF5A1F] text-[#EFF0F1] bg-[#FF5A1F]/22 shadow-[0_0_20px_rgba(255,90,31,0.28)]"
                  : selectedTopic === "latency"
                    ? "border-[#FF5A1F] text-[#EFF0F1] bg-[#FF5A1F]/12"
                    : "border-[#2B303B] bg-[#121418] hover:border-[#9499A3]"
              )}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>
                {sim.bargeInFlashed
                  ? "BARGE-IN LOOP TRIGGERED · TTS CANCELLED (34ms)"
                  : "Turn Detection & Barge-In Interruption Loop"}
              </span>
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {EXTRA_TOPICS.map((tid) => {
                const t = PORTFOLIO.voiceTopics.find((item) => item.id === tid);
                if (!t) return null;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => onSelectTopic(tid)}
                    className={cn(
                      "hud-btn px-2.5 py-1 border cursor-pointer",
                      selectedTopic === tid
                        ? "border-[#38D9A9] text-[#EFF0F1] bg-[#38D9A9]/10"
                        : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                    )}
                  >
                    {t.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual-instrument mode switcher: STFT Waterfall vs Interactive Latency Feel Lab */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label="Voice Lab instruments"
              className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#121418] border border-[#2B303B]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={workbenchMode === "spectrogram"}
                onClick={() => {
                  signalSound.playTick(720);
                  setWorkbenchMode("spectrogram");
                }}
                className={cn(
                  "px-3 py-1.5 font-mono text-[11px] cursor-pointer transition-colors",
                  workbenchMode === "spectrogram"
                    ? "bg-[#22262E] border border-[#38D9A9]/70 text-[#EFF0F1]"
                    : "border border-transparent text-[#9499A3] hover:text-[#EFF0F1]"
                )}
              >
                01 // STFT SPECTROGRAM &amp; BARGE-IN
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={workbenchMode === "latency"}
                onClick={() => {
                  signalSound.playTick(780);
                  setWorkbenchMode("latency");
                }}
                className={cn(
                  "px-3 py-1.5 font-mono text-[11px] cursor-pointer transition-colors",
                  workbenchMode === "latency"
                    ? "bg-[#22262E] border border-[#FF9F38]/75 text-[#FF9F38]"
                    : "border border-transparent text-[#9499A3] hover:text-[#EFF0F1]"
                )}
              >
                02 // LATENCY FEEL &amp; OTEL WATERFALL
              </button>
            </div>
            <span className="font-mono text-[11px] text-[#9499A3]">
              {workbenchMode === "spectrogram"
                ? "REAL-TIME 60FPS FFT SPECTRUM"
                : "INTERACTIVE TURN DELAY BENCHMARK"}
            </span>
          </div>

          {workbenchMode === "spectrogram" ? (
            <SignalSpectrogram
              connected={connected}
              agentState={agentState}
              micBinsRef={micBinsRef}
              agentBinsRef={agentBinsRef}
              onSimUpdate={setSim}
            />
          ) : (
            <LatencyPlayground />
          )}

          {/* Active stage inspector + real/simulated latency bar */}
          <div className="mt-6 grid lg:grid-cols-[1.25fr_1fr] gap-6 pt-6 border-t border-[#2B303B]">
            <div className="bg-[#121418] border border-[#2B303B] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="text-lg font-semibold text-[#EFF0F1]">{activeTopicData.title}</h3>
                  <span className="font-mono text-xs text-[#38D9A9]">
                    {activeTopicData.shortLabel}
                  </span>
                </div>
                <p className="text-sm text-[#C4C8D0] leading-relaxed mb-4 max-w-[68ch]">
                  {activeTopicData.summary}
                </p>
                <ul className="space-y-2 text-sm text-[#C4C8D0]">
                  {activeTopicData.engineeringFocus.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <span className="mt-2 w-1.5 h-1.5 bg-[#FF5A1F] shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-[#2B303B] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {activeTopicData.stackUsed.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-xs px-2 py-0.5 bg-[#1A1D23] border border-[#2B303B] text-[#C4C8D0]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onAskAbout(
                      `How does Istekhar design ${activeTopicData.title} in real-time voice systems?`
                    )
                  }
                  className="hud-btn inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#38D9A9] hover:border-[#38D9A9] cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>

            {/* Real-time latency telemetry panel */}
            <div className="bg-[#121418] border border-[#2B303B] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#EFF0F1]">
                    Turn Latency Telemetry
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs telemetry-nums",
                      metricsMode === "live"
                        ? "text-[#38D9A9]"
                        : metricsMode === "simulated"
                          ? "text-[#FF9F38]"
                          : "text-[#9499A3]"
                    )}
                  >
                    {metricsMode === "live"
                      ? "LIVE MEASURED"
                      : metricsMode === "simulated"
                        ? "SIMULATED TURN"
                        : "STANDBY"}
                  </span>
                </div>

                {displayMetrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-px bg-[#2B303B] border border-[#2B303B] font-mono text-xs telemetry-nums">
                      <div className="bg-[#1A1D23] p-3">
                        <div className="text-[#9499A3]">VAD</div>
                        <div className="text-[#38D9A9] text-base mt-1">
                          {displayMetrics.vadMs ? `${displayMetrics.vadMs}ms` : "—"}
                        </div>
                      </div>
                      <div className="bg-[#1A1D23] p-3">
                        <div className="text-[#9499A3]">STT</div>
                        <div className="text-[#38D9A9] text-base mt-1">
                          {displayMetrics.sttMs ? `${displayMetrics.sttMs}ms` : "—"}
                        </div>
                      </div>
                      <div className="bg-[#1A1D23] p-3">
                        <div className="text-[#9499A3]">LLM</div>
                        <div className="text-[#FF9F38] text-base mt-1">
                          {displayMetrics.llmTtftMs ? `${displayMetrics.llmTtftMs}ms` : "—"}
                        </div>
                      </div>
                      <div className="bg-[#1A1D23] p-3">
                        <div className="text-[#9499A3]">TTS</div>
                        <div className="text-[#FF5A1F] text-base mt-1">
                          {displayMetrics.ttsTtfbMs ? `${displayMetrics.ttsTtfbMs}ms` : "—"}
                        </div>
                      </div>
                    </div>

                    {/* Proportional turn latency budget bar */}
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-full bg-[#1A1D23] border border-[#2B303B] flex overflow-hidden">
                        <div
                          className="h-full bg-[#38D9A9]/75 transition-[width] duration-300"
                          style={{ width: segWidth(displayMetrics.vadMs) }}
                          title={`VAD: ${displayMetrics.vadMs ?? 0}ms`}
                        />
                        <div
                          className="h-full bg-[#38D9A9] transition-[width] duration-300"
                          style={{ width: segWidth(displayMetrics.sttMs) }}
                          title={`STT: ${displayMetrics.sttMs ?? 0}ms`}
                        />
                        <div
                          className="h-full bg-[#FF9F38] transition-[width] duration-300"
                          style={{ width: segWidth(displayMetrics.llmTtftMs) }}
                          title={`LLM TTFT: ${displayMetrics.llmTtftMs ?? 0}ms`}
                        />
                        <div
                          className="h-full bg-[#FF5A1F] transition-[width] duration-300"
                          style={{ width: segWidth(displayMetrics.ttsTtfbMs) }}
                          title={`TTS TTFB: ${displayMetrics.ttsTtfbMs ?? 0}ms`}
                        />
                      </div>
                      {displayMetrics.totalMs && (
                        <div className="flex items-center justify-between font-mono text-xs text-[#EFF0F1] telemetry-nums">
                          <span className="text-[#9499A3]">
                            {metricsMode === "live"
                              ? "Measured stage sum"
                              : "Illustrative turn budget"}
                          </span>
                          <span className="text-[#FF9F38] font-semibold">
                            {displayMetrics.totalMs}ms
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <p className="text-sm text-[#C4C8D0] leading-relaxed">
                      Start a live LiveKit voice session for measured telemetry, or tap{" "}
                      <span className="text-[#EFF0F1] font-medium">Simulate Call Turn</span> above
                      to trace streaming stages and barge-in cancellation.
                    </p>
                    <div className="grid grid-cols-4 border border-[#2B303B] font-mono text-xs text-[#9499A3]">
                      <div className="p-2.5 border-r border-[#2B303B] bg-[#1A1D23]/60">VAD --</div>
                      <div className="p-2.5 border-r border-[#2B303B] bg-[#1A1D23]/60">STT --</div>
                      <div className="p-2.5 border-r border-[#2B303B] bg-[#1A1D23]/60">LLM --</div>
                      <div className="p-2.5 bg-[#1A1D23]/60">TTS --</div>
                    </div>
                    {!connected && (
                      <button
                        type="button"
                        onClick={onStartVoice}
                        className="hud-btn inline-flex items-center gap-2 px-3.5 py-2 bg-[#FF5A1F] text-[#121418] font-semibold text-xs hover:bg-[#ff6d38] cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Run live LiveKit session</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-4 pt-3 border-t border-[#2B303B] font-mono text-xs text-[#9499A3]">
                Engine: LiveKit WebRTC + LiveKit Agents · Voice: ElevenLabs TTS plugin
              </p>
            </div>
          </div>
        </div>
          ) : null}
        </details>
      </div>
    </section>
  );
}
