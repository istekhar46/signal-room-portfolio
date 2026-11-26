"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Play, RotateCcw, Sliders, Volume2 } from "lucide-react";
import { signalSound } from "@/lib/signal-sound";
import { cn } from "@/lib/utils";

type TransportChoice = "webrtc" | "websocket";
type SttChoice = "deepgram" | "whisper-batch";
type LlmChoice = "streaming-lean" | "heavy-context";
type TtsChoice = "elevenlabs-stream" | "http-batch";

interface StageSpan {
  id: string;
  label: string;
  otelName: string;
  startMs: number;
  durationMs: number;
  color: string;
}

export function LatencyPlayground() {
  const [transport, setTransport] = useState<TransportChoice>("webrtc");
  const [stt, setStt] = useState<SttChoice>("deepgram");
  const [llm, setLlm] = useState<LlmChoice>("streaming-lean");
  const [tts, setTts] = useState<TtsChoice>("elevenlabs-stream");
  const [overlapStreaming, setOverlapStreaming] = useState(true);

  const [testing, setTesting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completedMs, setCompletedMs] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const spans = useMemo<StageSpan[]>(() => {
    const transportMs = transport === "webrtc" ? 28 : 135;
    const vadMs = 42;
    const sttMs = stt === "deepgram" ? 132 : 620;
    const llmMs = llm === "streaming-lean" ? 195 : 760;
    const ttsMs = tts === "elevenlabs-stream" ? 105 : 540;

    // When concurrent streaming overlap is enabled on streaming components,
    // STT overlaps VAD tail and TTS begins as soon as the first LLM clause arrives.
    const sttStart =
      overlapStreaming && stt === "deepgram"
        ? Math.max(transportMs, transportMs + vadMs - 24)
        : transportMs + vadMs;
    const sttEnd = sttStart + sttMs;

    const llmStart =
      overlapStreaming && stt === "deepgram" ? Math.max(sttStart + 65, sttEnd - 30) : sttEnd;
    const llmEnd = llmStart + llmMs;

    const ttsStart =
      overlapStreaming && llm === "streaming-lean" && tts === "elevenlabs-stream"
        ? Math.max(llmStart + 120, llmEnd - 45)
        : llmEnd;

    return [
      {
        id: "transport",
        label: transport === "webrtc" ? "LiveKit WebRTC" : "WebSocket Relay",
        otelName:
          transport === "webrtc" ? "net.livekit_sfu_ingress" : "net.ws_relay_roundtrip",
        startMs: 0,
        durationMs: transportMs,
        color: "#38D9A9",
      },
      {
        id: "vad",
        label: "Silero VAD",
        otelName: "vad.silero_endpoint",
        startMs: transportMs,
        durationMs: vadMs,
        color: "#38D9A9",
      },
      {
        id: "stt",
        label: stt === "deepgram" ? "Deepgram Nova-3" : "Batch Whisper",
        otelName: stt === "deepgram" ? "stt.deepgram_stream" : "stt.whisper_batch_wait",
        startMs: sttStart,
        durationMs: sttMs,
        color: "#38D9A9",
      },
      {
        id: "llm",
        label: llm === "streaming-lean" ? "LLM Lean TTFT" : "LLM Heavy Context",
        otelName: llm === "streaming-lean" ? "llm.first_clause_ttft" : "llm.uncached_prompt",
        startMs: llmStart,
        durationMs: llmMs,
        color: "#FF9F38",
      },
      {
        id: "tts",
        label: tts === "elevenlabs-stream" ? "ElevenLabs Stream" : "HTTP Batch TTS",
        otelName:
          tts === "elevenlabs-stream" ? "tts.elevenlabs_ttfb" : "tts.http_full_synthesis",
        startMs: ttsStart,
        durationMs: ttsMs,
        color: "#FF5A1F",
      },
    ];
  }, [llm, overlapStreaming, stt, transport, tts]);

  const callerObservedMs = useMemo(() => {
    const last = spans[spans.length - 1];
    return last ? last.startMs + last.durationMs : 500;
  }, [spans]);

  const serialSumMs = useMemo(
    () => spans.reduce((acc, s) => acc + s.durationMs, 0),
    [spans]
  );

  const overlapSavedMs = Math.max(0, serialSumMs - callerObservedMs);
  const scaleCapMs = Math.max(callerObservedMs, 2200);

  const verdict = useMemo(() => {
    if (callerObservedMs <= 600) {
      return {
        label: "HUMAN CADENCE",
        tone: "text-[#38D9A9] border-[#38D9A9]/50 bg-[#38D9A9]/10",
        detail: "Natural conversational turn-taking. Callers stay in flow without repeating themselves.",
      };
    }
    if (callerObservedMs <= 1150) {
      return {
        label: "NOTICEABLE PAUSE",
        tone: "text-[#FF9F38] border-[#FF9F38]/50 bg-[#FF9F38]/10",
        detail: "Callers perceive hesitation and occasionally start speaking again before audio arrives.",
      };
    }
    return {
      label: "CONVERSATIONAL BREAKDOWN",
      tone: "text-[#FF5A1F] border-[#FF5A1F]/60 bg-[#FF5A1F]/12",
      detail: 'Awkward silence. Callers ask "Hello?" and trigger colliding double-talk.',
    };
  }, [callerObservedMs]);

  const stopTest = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setTesting(false);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const runFeelTest = () => {
    stopTest();
    setTesting(true);
    setElapsedMs(0);
    setCompletedMs(null);
    signalSound.playAcousticCue("caller-eos");
    startTimeRef.current = performance.now();

    const target = callerObservedMs;
    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      if (elapsed >= target) {
        setElapsedMs(target);
        setCompletedMs(target);
        setTesting(false);
        rafRef.current = null;
        signalSound.playAcousticCue("agent-first-audio");
        return;
      }
      setElapsedMs(Math.round(elapsed));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const applyPreset = (preset: "opencalls" | "naive") => {
    stopTest();
    setElapsedMs(0);
    setCompletedMs(null);
    signalSound.playTick(preset === "opencalls" ? 760 : 480);
    if (preset === "opencalls") {
      setTransport("webrtc");
      setStt("deepgram");
      setLlm("streaming-lean");
      setTts("elevenlabs-stream");
      setOverlapStreaming(true);
    } else {
      setTransport("websocket");
      setStt("whisper-batch");
      setLlm("heavy-context");
      setTts("http-batch");
      setOverlapStreaming(false);
    }
  };

  const playheadPct = testing
    ? Math.min(100, (elapsedMs / scaleCapMs) * 100)
    : completedMs !== null
      ? Math.min(100, (completedMs / scaleCapMs) * 100)
      : 0;

  return (
    <div className="mt-5 border border-[#2B303B] bg-[#121418] p-4 md:p-5 space-y-5">
      {/* Header & presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2B303B]">
        <div className="flex items-center gap-2.5 font-mono text-xs">
          <Sliders className="w-4 h-4 text-[#FF9F38]" />
          <span className="text-[#EFF0F1] font-semibold">
            LATENCY FEEL LAB // OPENTELEMETRY SPAN WATERFALL
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset("opencalls")}
            className="hud-btn px-2.5 py-1.5 border border-[#38D9A9]/60 bg-[#38D9A9]/10 font-mono text-[11px] text-[#38D9A9] hover:bg-[#38D9A9]/18 cursor-pointer"
          >
            Preset: OpenCalls Streaming
          </button>
          <button
            type="button"
            onClick={() => applyPreset("naive")}
            className="hud-btn px-2.5 py-1.5 border border-[#2B303B] bg-[#1A1D23] font-mono text-[11px] text-[#C4C8D0] hover:border-[#FF5A1F] hover:text-[#EFF0F1] cursor-pointer"
          >
            Preset: Naive Batch Stack
          </button>
          <button
            type="button"
            onClick={() => {
              stopTest();
              setOverlapStreaming((v) => !v);
              signalSound.playTick(680);
            }}
            aria-pressed={overlapStreaming}
            className={cn(
              "hud-btn px-2.5 py-1.5 border font-mono text-[11px] cursor-pointer",
              overlapStreaming
                ? "border-[#FF9F38] bg-[#FF9F38]/12 text-[#FF9F38]"
                : "border-[#2B303B] bg-[#1A1D23] text-[#9499A3]"
            )}
          >
            Clause Overlap: {overlapStreaming ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* 4 Architecture stage selectors */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="border border-[#2B303B] bg-[#171A21] p-3 space-y-2">
          <div className="font-mono text-[10px] text-[#9499A3] tracking-wider">01 // TRANSPORT</div>
          <div className="grid grid-cols-1 gap-1.5">
            {(
              [
                { id: "webrtc", label: "LiveKit WebRTC", ms: "28ms" },
                { id: "websocket", label: "WebSocket Relay", ms: "135ms" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  stopTest();
                  setTransport(opt.id);
                  signalSound.playTick(700);
                }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 border font-mono text-[11px] text-left cursor-pointer transition-colors",
                  transport === opt.id
                    ? "border-[#38D9A9] bg-[#38D9A9]/12 text-[#EFF0F1]"
                    : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                )}
              >
                <span>{opt.label}</span>
                <span className="telemetry-nums text-[#38D9A9]">{opt.ms}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-[#2B303B] bg-[#171A21] p-3 space-y-2">
          <div className="font-mono text-[10px] text-[#9499A3] tracking-wider">02 // STREAMING STT</div>
          <div className="grid grid-cols-1 gap-1.5">
            {(
              [
                { id: "deepgram", label: "Deepgram Nova-3", ms: "132ms" },
                { id: "whisper-batch", label: "Batch Whisper", ms: "620ms" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  stopTest();
                  setStt(opt.id);
                  signalSound.playTick(700);
                }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 border font-mono text-[11px] text-left cursor-pointer transition-colors",
                  stt === opt.id
                    ? "border-[#38D9A9] bg-[#38D9A9]/12 text-[#EFF0F1]"
                    : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                )}
              >
                <span>{opt.label}</span>
                <span className="telemetry-nums text-[#38D9A9]">{opt.ms}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-[#2B303B] bg-[#171A21] p-3 space-y-2">
          <div className="font-mono text-[10px] text-[#9499A3] tracking-wider">03 // LLM TTFT</div>
          <div className="grid grid-cols-1 gap-1.5">
            {(
              [
                { id: "streaming-lean", label: "Lean Context Stream", ms: "195ms" },
                { id: "heavy-context", label: "Uncached Heavy", ms: "760ms" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  stopTest();
                  setLlm(opt.id);
                  signalSound.playTick(700);
                }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 border font-mono text-[11px] text-left cursor-pointer transition-colors",
                  llm === opt.id
                    ? "border-[#FF9F38] bg-[#FF9F38]/12 text-[#EFF0F1]"
                    : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                )}
              >
                <span>{opt.label}</span>
                <span className="telemetry-nums text-[#FF9F38]">{opt.ms}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-[#2B303B] bg-[#171A21] p-3 space-y-2">
          <div className="font-mono text-[10px] text-[#9499A3] tracking-wider">04 // TTS SYNTHESIS</div>
          <div className="grid grid-cols-1 gap-1.5">
            {(
              [
                { id: "elevenlabs-stream", label: "ElevenLabs Stream", ms: "105ms" },
                { id: "http-batch", label: "HTTP Batch TTS", ms: "540ms" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  stopTest();
                  setTts(opt.id);
                  signalSound.playTick(700);
                }}
                className={cn(
                  "flex items-center justify-between px-2.5 py-1.5 border font-mono text-[11px] text-left cursor-pointer transition-colors",
                  tts === opt.id
                    ? "border-[#FF5A1F] bg-[#FF5A1F]/14 text-[#EFF0F1]"
                    : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                )}
              >
                <span>{opt.label}</span>
                <span className="telemetry-nums text-[#FF5A1F]">{opt.ms}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OpenTelemetry Span Waterfall */}
      <div className="border border-[#2B303B] bg-[#0D0F13] p-4 space-y-3 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#9499A3] telemetry-nums">
          <span>OTEL TRACE // voice.turn.response_budget</span>
          <div className="flex items-center gap-4">
            <span>SERIAL SUM: {serialSumMs}ms</span>
            {overlapSavedMs > 0 && (
              <span className="text-[#38D9A9]">OVERLAP SAVED: -{overlapSavedMs}ms</span>
            )}
            <span className="text-[#EFF0F1] font-semibold">
              CALLER-OBSERVED: {callerObservedMs}ms
            </span>
          </div>
        </div>

        {/* Waterfall rows */}
        <div className="relative space-y-2 pt-1">
          {/* Playhead line during live acoustic feel test */}
          {(testing || completedMs !== null) && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 left-[170px] right-0 hidden sm:block"
            >
              <div
                className="absolute top-0 bottom-0 w-px bg-[#EFF0F1] shadow-[0_0_8px_#EFF0F1]"
                style={{ left: `${playheadPct}%` }}
              />
            </div>
          )}

          {spans.map((span) => {
            const leftPct = (span.startMs / scaleCapMs) * 100;
            const widthPct = Math.max(2.5, (span.durationMs / scaleCapMs) * 100);
            const activeNow =
              testing && elapsedMs >= span.startMs && elapsedMs <= span.startMs + span.durationMs;

            return (
              <div
                key={span.id}
                className="grid sm:grid-cols-[170px_1fr] gap-2 items-center font-mono text-[11px]"
              >
                <div className="truncate text-[#C4C8D0]" title={span.otelName}>
                  {span.otelName}
                </div>
                <div className="relative h-6 bg-[#14171D] border border-[#232833] overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0.5 bottom-0.5 flex items-center px-1.5 text-[10px] font-semibold text-[#121418] transition-all duration-200 telemetry-nums",
                      activeNow && "ring-1 ring-[#EFF0F1]"
                    )}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: span.color,
                    }}
                  >
                    <span className="truncate">{span.durationMs}ms</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scale markers */}
        <div className="hidden sm:grid sm:grid-cols-[170px_1fr] gap-2 font-mono text-[10px] text-[#9499A3] telemetry-nums">
          <span />
          <div className="flex items-center justify-between">
            <span>0ms (Caller EOS)</span>
            <span>{Math.round(scaleCapMs * 0.25)}ms</span>
            <span>{Math.round(scaleCapMs * 0.5)}ms</span>
            <span>{Math.round(scaleCapMs * 0.75)}ms</span>
            <span>{scaleCapMs}ms</span>
          </div>
        </div>
      </div>

      {/* Live Acoustic Feel Action Bar + Verdict */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runFeelTest}
            className="hud-btn inline-flex items-center gap-2 min-h-10 px-4 py-2 bg-[#FF5A1F] text-[#121418] font-mono font-semibold text-xs hover:bg-[#ff6d38] cursor-pointer"
          >
            {testing ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span className="telemetry-nums">MEASURING {elapsedMs}ms...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Feel This Latency ({callerObservedMs}ms)</span>
              </>
            )}
          </button>

          {completedMs !== null && !testing && (
            <button
              type="button"
              onClick={() => {
                setElapsedMs(0);
                setCompletedMs(null);
              }}
              className="hud-btn inline-flex items-center gap-1.5 px-3 py-2 border border-[#2B303B] bg-[#1A1D23] font-mono text-[11px] text-[#C4C8D0] hover:text-[#EFF0F1] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#9499A3]">
            <Volume2 className="w-3.5 h-3.5 text-[#38D9A9]" />
            <span>Plays 2 studio chimes separated by exact turn delay</span>
          </span>
        </div>

        <div
          aria-live="polite"
          className={cn("border px-3 py-2 font-mono text-[11px] max-w-md", verdict.tone)}
        >
          <span className="font-semibold">{verdict.label}:</span>{" "}
          <span className="text-[#EFF0F1] font-sans text-xs">{verdict.detail}</span>
        </div>
      </div>
    </div>
  );
}
