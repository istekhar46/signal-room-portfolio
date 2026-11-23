"use client";

import { ArrowRight, Radio, RotateCcw } from "lucide-react";
import { PORTFOLIO, type VoiceTopicId } from "@/data/portfolio";
import type { AgentVisualState, TurnLatencyMetrics } from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

interface VoiceLabProps {
  selectedTopic: VoiceTopicId;
  onSelectTopic: (topic: VoiceTopicId) => void;
  agentState: AgentVisualState;
  connected: boolean;
  latestMetrics: TurnLatencyMetrics | null;
  highlighted: boolean;
}

const PIPELINE_NODES: { id: VoiceTopicId | "mic" | "speaker"; label: string; topic: VoiceTopicId }[] = [
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
  highlighted,
}: VoiceLabProps) {
  const activeTopicData =
    PORTFOLIO.voiceTopics.find((t) => t.id === selectedTopic) ?? PORTFOLIO.voiceTopics[0];

  const isNodeLive = (nodeId: string): "mint" | "signal" | null => {
    if (!connected) return null;
    if (agentState === "listening" && (nodeId === "mic" || nodeId === "vad" || nodeId === "stt")) {
      return "mint";
    }
    if ((agentState === "thinking" || agentState === "executing") && nodeId === "llm") {
      return "signal";
    }
    if (agentState === "speaking" && (nodeId === "tts" || nodeId === "speaker")) {
      return "signal";
    }
    return null;
  };

  const hasLiveMetrics = Boolean(
    latestMetrics &&
      (latestMetrics.vadMs || latestMetrics.sttMs || latestMetrics.llmTtftMs || latestMetrics.ttsTtfbMs)
  );

  return (
    <section
      id="voice-lab"
      aria-labelledby="voice-lab-heading"
      className="py-24 md:py-32 border-t border-[#232934]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <h2
            id="voice-lab-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#F2EFE9] max-w-2xl leading-[1.12]"
          >
            How a voice agent hears, thinks, and speaks.
          </h2>
          <div className="flex items-center gap-2 font-mono text-xs text-[#8B939E] telemetry-nums">
            <Radio
              className={cn(
                "w-3.5 h-3.5",
                connected ? "text-[#38D9A9] signal-pulse" : "text-[#8B939E]"
              )}
            />
            <span>
              {connected
                ? `LIVE SESSION SYNC · STATE ${agentState.toUpperCase()}`
                : "INTERACTIVE PIPELINE · SELECT ANY STAGE"}
            </span>
          </div>
        </div>

        {/* Calibrated signal schematic frame */}
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
                <div key={node.id} className="flex items-center gap-2 lg:gap-3 flex-1 min-w-[110px]">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => onSelectTopic(node.topic)}
                    className={cn(
                      "w-full py-4 px-3 border text-left transition-colors relative cursor-pointer",
                      live === "mint"
                        ? "border-[#38D9A9] bg-[#38D9A9]/10 text-[#F2EFE9]"
                        : live === "signal"
                          ? "border-[#FF5A1F] bg-[#FF5A1F]/12 text-[#F2EFE9]"
                          : isSelected
                            ? "border-[#F2EFE9]/70 bg-[#171C24] text-[#F2EFE9]"
                            : "border-[#2B3340] bg-[#0E1218] text-[#B8BFC9] hover:border-[#8B939E]"
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
                                ? "bg-[#F2EFE9]"
                                : "bg-[#2B3340]"
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
          <div className="mt-5 pt-4 border-t border-[#232934] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#B8BFC9]">
            <button
              type="button"
              onClick={() => onSelectTopic("latency")}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 border transition-colors cursor-pointer",
                selectedTopic === "latency"
                  ? "border-[#FF5A1F] text-[#F2EFE9] bg-[#FF5A1F]/10"
                  : "border-[#232934] bg-[#0B0D10] hover:border-[#8B939E]"
              )}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>Turn Detection &amp; Barge-In Interruption Loop</span>
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
                      "px-2.5 py-1 border transition-colors cursor-pointer",
                      selectedTopic === tid
                        ? "border-[#38D9A9] text-[#F2EFE9] bg-[#38D9A9]/10"
                        : "border-[#232934] bg-[#0B0D10] text-[#8B939E] hover:text-[#F2EFE9]"
                    )}
                  >
                    {t.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active stage inspector + real latency bar */}
          <div className="mt-6 grid lg:grid-cols-[1.25fr_1fr] gap-6 pt-6 border-t border-[#232934]">
            <div className="bg-[#0B0D10] border border-[#232934] p-5">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h3 className="text-lg font-semibold text-[#F2EFE9]">
                  {activeTopicData.title}
                </h3>
                <span className="font-mono text-xs text-[#38D9A9]">
                  {activeTopicData.shortLabel}
                </span>
              </div>
              <p className="text-sm text-[#B8BFC9] leading-relaxed mb-4 max-w-[68ch]">
                {activeTopicData.summary}
              </p>
              <ul className="space-y-2 text-sm text-[#B8BFC9]">
                {activeTopicData.engineeringFocus.map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <span className="mt-2 w-1.5 h-1.5 bg-[#FF5A1F] shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-[#232934] flex flex-wrap gap-2">
                {activeTopicData.stackUsed.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-xs px-2 py-0.5 bg-[#12161C] border border-[#232934] text-[#B8BFC9]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Real-time latency telemetry panel */}
            <div className="bg-[#0B0D10] border border-[#232934] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#F2EFE9]">
                    Turn Latency Telemetry
                  </span>
                  <span className="font-mono text-xs text-[#8B939E] telemetry-nums">
                    {hasLiveMetrics ? "LIVE MEASURED" : "STANDBY"}
                  </span>
                </div>

                {hasLiveMetrics && latestMetrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-px bg-[#232934] border border-[#232934] font-mono text-xs telemetry-nums">
                      <div className="bg-[#12161C] p-3">
                        <div className="text-[#8B939E]">VAD</div>
                        <div className="text-[#38D9A9] text-base mt-1">
                          {latestMetrics.vadMs ? `${latestMetrics.vadMs}ms` : "—"}
                        </div>
                      </div>
                      <div className="bg-[#12161C] p-3">
                        <div className="text-[#8B939E]">STT</div>
                        <div className="text-[#38D9A9] text-base mt-1">
                          {latestMetrics.sttMs ? `${latestMetrics.sttMs}ms` : "—"}
                        </div>
                      </div>
                      <div className="bg-[#12161C] p-3">
                        <div className="text-[#8B939E]">LLM</div>
                        <div className="text-[#FF5A1F] text-base mt-1">
                          {latestMetrics.llmTtftMs ? `${latestMetrics.llmTtftMs}ms` : "—"}
                        </div>
                      </div>
                      <div className="bg-[#12161C] p-3">
                        <div className="text-[#8B939E]">TTS</div>
                        <div className="text-[#FF5A1F] text-base mt-1">
                          {latestMetrics.ttsTtfbMs ? `${latestMetrics.ttsTtfbMs}ms` : "—"}
                        </div>
                      </div>
                    </div>
                    {latestMetrics.totalMs && (
                      <div className="flex items-center justify-between font-mono text-xs text-[#F2EFE9] telemetry-nums">
                        <span>Measured turn sum</span>
                        <span className="text-[#FF5A1F] font-semibold">
                          {latestMetrics.totalMs}ms
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[#B8BFC9] leading-relaxed">
                      Start a live LiveKit voice session to inspect real per-stage VAD, STT, LLM
                      time-to-first-token, and ElevenLabs TTS time-to-first-byte metrics from your
                      own conversation.
                    </p>
                    <div className="grid grid-cols-4 border border-[#232934] font-mono text-xs text-[#8B939E]">
                      <div className="p-2.5 border-r border-[#232934] bg-[#12161C]/60">VAD —</div>
                      <div className="p-2.5 border-r border-[#232934] bg-[#12161C]/60">STT —</div>
                      <div className="p-2.5 border-r border-[#232934] bg-[#12161C]/60">LLM —</div>
                      <div className="p-2.5 bg-[#12161C]/60">TTS —</div>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 pt-3 border-t border-[#232934] font-mono text-xs text-[#8B939E]">
                Engine: LiveKit WebRTC + LiveKit Agents · Voice: ElevenLabs TTS plugin
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
