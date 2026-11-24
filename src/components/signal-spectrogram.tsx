"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Mic, MicOff, Play, Square, Zap } from "lucide-react";
import { signalSound } from "@/lib/signal-sound";
import type { AgentVisualState, TurnLatencyMetrics } from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

export type SimPhase =
  | "idle"
  | "caller-speaking"
  | "llm-thinking"
  | "agent-speaking"
  | "barge-in";

export interface SimulationSnapshot {
  active: boolean;
  phase: SimPhase;
  stageState: AgentVisualState;
  bargeInFlashed: boolean;
  caption: string;
  metrics: TurnLatencyMetrics | null;
}

interface SignalSpectrogramProps {
  connected: boolean;
  agentState: AgentVisualState;
  micBinsRef: React.MutableRefObject<Uint8Array>;
  agentBinsRef: React.MutableRefObject<Uint8Array>;
  onSimUpdate: (snapshot: SimulationSnapshot) => void;
}

// Pre-computed 256-entry RGB thermal acoustic LUT:
// #121418 (floor) -> #153639 (deep teal) -> #38D9A9 (mint) -> #FF9F38 (amber) -> #FF5A1F (signal peak)
const SPECTROGRAM_LUT = (() => {
  const stops: [number, [number, number, number]][] = [
    [0, [18, 20, 24]],
    [45, [20, 44, 48]],
    [115, [56, 217, 169]],
    [190, [255, 159, 56]],
    [255, [255, 90, 31]],
  ];
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    let s0 = stops[0];
    let s1 = stops[stops.length - 1];
    for (let k = 0; k < stops.length - 1; k++) {
      if (i >= stops[k][0] && i <= stops[k + 1][0]) {
        s0 = stops[k];
        s1 = stops[k + 1];
        break;
      }
    }
    const span = Math.max(1, s1[0] - s0[0]);
    const f = (i - s0[0]) / span;
    lut[i * 3] = Math.round(s0[1][0] + (s1[1][0] - s0[1][0]) * f);
    lut[i * 3 + 1] = Math.round(s0[1][1] + (s1[1][1] - s0[1][1]) * f);
    lut[i * 3 + 2] = Math.round(s0[1][2] + (s1[1][2] - s0[1][2]) * f);
  }
  return lut;
})();

function synthesizeFormantSlice(
  dest: Uint8Array,
  t: number,
  mode: "idle" | "caller" | "llm" | "agent" | "barge-in"
) {
  const n = dest.length;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1); // 0..1 frequency axis (~80Hz..8kHz)
    let val = 8 + Math.sin(t * 1.4 + i * 0.35) * 4;

    if (mode === "caller") {
      // Lower fundamental + crisp vocal formants (F1 ~0.12, F2 ~0.34, F3 ~0.58)
      const cadence = 0.62 + 0.38 * Math.sin(t * 7.5) * Math.cos(t * 3.1);
      const f0 = Math.exp(-Math.pow((f - (0.09 + Math.sin(t * 2.2) * 0.02)) / 0.06, 2));
      const f1 = Math.exp(-Math.pow((f - (0.28 + Math.cos(t * 4.1) * 0.05)) / 0.09, 2));
      const f2 = Math.exp(-Math.pow((f - (0.52 + Math.sin(t * 5.2) * 0.06)) / 0.11, 2));
      val = (14 + (f0 * 145 + f1 * 125 + f2 * 70) * cadence) * (1 - f * 0.25);
    } else if (mode === "agent") {
      // Expressive ElevenLabs TTS harmonics (warmer upper formants peaking in amber/orange)
      const prosody = 0.68 + 0.32 * Math.sin(t * 6.2 + 0.7);
      const f0 = Math.exp(-Math.pow((f - (0.14 + Math.sin(t * 3.1) * 0.025)) / 0.065, 2));
      const f1 = Math.exp(-Math.pow((f - (0.36 + Math.sin(t * 4.8) * 0.06)) / 0.1, 2));
      const f2 = Math.exp(-Math.pow((f - (0.64 + Math.cos(t * 3.9) * 0.05)) / 0.12, 2));
      const air = Math.exp(-Math.pow((f - 0.82) / 0.09, 2)) * 45;
      val = 18 + (f0 * 195 + f1 * 175 + f2 * 115 + air) * prosody;
    } else if (mode === "barge-in") {
      // Sharp broadband onset spike across speech band
      const burst = Math.exp(-Math.pow((f - 0.3) / 0.28, 2));
      val = 40 + burst * 215;
    } else if (mode === "llm") {
      // Subtle low-floor processing shimmer while waiting for TTFT
      val = 12 + Math.sin(t * 9 + i * 0.6) * 8 + (i < 10 ? 18 : 0);
    }

    dest[i] = Math.max(0, Math.min(255, Math.round(val)));
  }
}

export function SignalSpectrogram({
  connected,
  agentState,
  micBinsRef,
  agentBinsRef,
  onSimUpdate,
}: SignalSpectrogramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const waterfallRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<HTMLCanvasElement>(null);

  const [inView, setInView] = useState(true);
  const [localMicActive, setLocalMicActive] = useState(false);
  const [localMicError, setLocalMicError] = useState<string | null>(null);
  const [simPhase, setSimPhase] = useState<SimPhase>("idle");
  const [simCaption, setSimCaption] = useState<string>(
    "Tap Simulate Call Turn or Test Mic Scope to inspect live STFT harmonics and barge-in cancellation."
  );
  const [readout, setReadout] = useState<{
    peakHz: number;
    rmsDb: number;
    vadActive: boolean;
  }>({ peakHz: 0, rmsDb: -60, vadActive: false });

  // Refs for 60fps loop without React re-render stalls
  const localMicBinsRef = useRef<Uint8Array>(new Uint8Array(64));
  const localAudioCtxRef = useRef<AudioContext | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const localRawDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const simBinsRef = useRef<Uint8Array>(new Uint8Array(64));
  const simPhaseRef = useRef<SimPhase>("idle");
  const simTimersRef = useRef<number[]>([]);
  const energyHistoryRef = useRef<Float32Array>(new Float32Array(180));
  const markerFlagRef = useRef<string | null>(null);
  const hoverNormYRef = useRef<number | null>(null);
  const hoverHzLabelRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  simPhaseRef.current = simPhase;

  const clearSimTimers = useCallback(() => {
    for (const id of simTimersRef.current) {
      window.clearTimeout(id);
    }
    simTimersRef.current = [];
  }, []);

  const stopLocalMic = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((tr) => tr.stop());
      localStreamRef.current = null;
    }
    if (localAudioCtxRef.current) {
      localAudioCtxRef.current.close().catch(() => {});
      localAudioCtxRef.current = null;
    }
    localAnalyserRef.current = null;
    localRawDataRef.current = null;
    localMicBinsRef.current.fill(0);
    setLocalMicActive(false);
  }, []);

  const toggleLocalMic = async () => {
    setLocalMicError(null);
    if (localMicActive) {
      stopLocalMic();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.68;
      source.connect(analyser);

      localStreamRef.current = stream;
      localAudioCtxRef.current = ctx;
      localAnalyserRef.current = analyser;
      localRawDataRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      setLocalMicActive(true);
    } catch {
      setLocalMicError(
        "Microphone permission blocked. Use Simulate Call Turn to test the STFT scope and barge-in loop."
      );
    }
  };

  const stopSimulation = useCallback(() => {
    clearSimTimers();
    setSimPhase("idle");
    setSimCaption(
      "Standby — tap Simulate Call Turn to watch VAD, STT, LLM TTFT, and ElevenLabs TTS stream concurrently."
    );
    onSimUpdate({
      active: false,
      phase: "idle",
      stageState: "idle",
      bargeInFlashed: false,
      caption: "",
      metrics: null,
    });
  }, [clearSimTimers, onSimUpdate]);

  const startCallTurnSim = useCallback(() => {
    clearSimTimers();
    signalSound.playTick(740);
    const now = Date.now();

    // Stage 1: Caller speaking (VAD + streaming STT)
    setSimPhase("caller-speaking");
    const c1 = 'Caller: "Can OpenCalls qualify inbound leads and book demos?"';
    setSimCaption(c1);
    onSimUpdate({
      active: true,
      phase: "caller-speaking",
      stageState: "listening",
      bargeInFlashed: false,
      caption: c1,
      metrics: { vadMs: 42, sttMs: 118, measuredAt: now },
    });

    // Stage 2: LLM TTFT + Tool call
    const t1 = window.setTimeout(() => {
      setSimPhase("llm-thinking");
      const c2 = "LLM + Tools: Streaming Gemini Flash → rpc.check_calendar()";
      setSimCaption(c2);
      onSimUpdate({
        active: true,
        phase: "llm-thinking",
        stageState: "thinking",
        bargeInFlashed: false,
        caption: c2,
        metrics: { vadMs: 42, sttMs: 118, llmTtftMs: 215, measuredAt: Date.now() },
      });
    }, 1050);

    // Stage 3: ElevenLabs TTS streaming synthesis
    const t2 = window.setTimeout(() => {
      setSimPhase("agent-speaking");
      const c3 =
        'Agent (TTS): "Yes — OpenCalls routes SIP calls into LiveKit rooms, qualifies callers, and books directly..." (Tap Trigger Barge-In!)';
      setSimCaption(c3);
      onSimUpdate({
        active: true,
        phase: "agent-speaking",
        stageState: "speaking",
        bargeInFlashed: false,
        caption: c3,
        metrics: {
          vadMs: 42,
          sttMs: 118,
          llmTtftMs: 215,
          ttsTtfbMs: 148,
          totalMs: 523,
          measuredAt: Date.now(),
        },
      });
    }, 1550);

    // Auto-finish cleanly if visitor doesn't interrupt
    const t3 = window.setTimeout(() => {
      stopSimulation();
    }, 6200);

    simTimersRef.current = [t1, t2, t3];
  }, [clearSimTimers, onSimUpdate, stopSimulation]);

  const triggerBargeIn = useCallback(() => {
    clearSimTimers();

    const executeInterrupt = () => {
      signalSound.playBargeIn();
      markerFlagRef.current = "BARGE-IN · 34ms FLUSH";
      setSimPhase("barge-in");
      const msg =
        "BARGE-IN DETECTED (34ms) — TTS stream cancelled, audio queue flushed, pipeline back to LISTENING.";
      setSimCaption(msg);
      onSimUpdate({
        active: true,
        phase: "barge-in",
        stageState: "listening",
        bargeInFlashed: true,
        caption: msg,
        metrics: {
          vadMs: 34,
          sttMs: 112,
          llmTtftMs: 215,
          ttsTtfbMs: 148,
          totalMs: 509,
          measuredAt: Date.now(),
        },
      });

      const resumeListening = window.setTimeout(() => {
        setSimPhase("caller-speaking");
        const followMsg = 'Caller interrupted: "Actually, skip the overview — show me latency."';
        setSimCaption(followMsg);
        onSimUpdate({
          active: true,
          phase: "caller-speaking",
          stageState: "listening",
          bargeInFlashed: true,
          caption: followMsg,
          metrics: {
            vadMs: 34,
            sttMs: 112,
            llmTtftMs: 215,
            ttsTtfbMs: 148,
            totalMs: 509,
            measuredAt: Date.now(),
          },
        });
      }, 420);

      const finish = window.setTimeout(() => {
        stopSimulation();
      }, 2800);

      simTimersRef.current = [resumeListening, finish];
    };

    // If clicked from standby, briefly stream TTS first so the cut is visibly unmistakable
    if (simPhaseRef.current !== "agent-speaking") {
      setSimPhase("agent-speaking");
      const prepMsg = 'Agent (TTS): "OpenCalls separates control-plane gRPC services from—"';
      setSimCaption(prepMsg);
      onSimUpdate({
        active: true,
        phase: "agent-speaking",
        stageState: "speaking",
        bargeInFlashed: false,
        caption: prepMsg,
        metrics: {
          vadMs: 42,
          sttMs: 118,
          llmTtftMs: 215,
          ttsTtfbMs: 148,
          totalMs: 523,
          measuredAt: Date.now(),
        },
      });
      const cutTimer = window.setTimeout(executeInterrupt, 520);
      simTimersRef.current = [cutTimer];
    } else {
      executeInterrupt();
    }
  }, [clearSimTimers, onSimUpdate, stopSimulation]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      clearSimTimers();
      stopLocalMic();
    };
  }, [clearSimTimers, stopLocalMic]);

  // Pause 60fps canvas animation when scrolled off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0.02 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Main 60fps STFT Waterfall + VAD Energy Scope renderer
  useEffect(() => {
    if (!inView) return;
    const wfCanvas = waterfallRef.current;
    const scopeCanvas = scopeRef.current;
    if (!wfCanvas || !scopeCanvas) return;

    const wfCtx = wfCanvas.getContext("2d", { willReadFrequently: false });
    const scCtx = scopeCanvas.getContext("2d");
    if (!wfCtx || !scCtx) return;

    const resize = () => {
      const rect = wfCanvas.getBoundingClientRect();
      const w = Math.max(240, Math.floor(rect.width));
      const h = 152;
      if (wfCanvas.width !== w || wfCanvas.height !== h) {
        wfCanvas.width = w;
        wfCanvas.height = h;
        wfCtx.fillStyle = "#121418";
        wfCtx.fillRect(0, 0, w, h);
      }
      const scH = 44;
      if (scopeCanvas.width !== w || scopeCanvas.height !== scH) {
        scopeCanvas.width = w;
        scopeCanvas.height = scH;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    let lastUiTick = 0;
    const colWidth = 2;

    const renderFrame = (nowMs: number) => {
      const t = nowMs * 0.001;
      const w = wfCanvas.width;
      const h = wfCanvas.height;

      // Determine active 64-bin frequency source
      let bins: Uint8Array;
      const phase = simPhaseRef.current;
      if (phase !== "idle") {
        const mode =
          phase === "caller-speaking"
            ? "caller"
            : phase === "agent-speaking"
              ? "agent"
              : phase === "barge-in"
                ? "barge-in"
                : "llm";
        synthesizeFormantSlice(simBinsRef.current, t, mode);
        bins = simBinsRef.current;
      } else if (localMicActive && localAnalyserRef.current && localRawDataRef.current) {
        localAnalyserRef.current.getByteFrequencyData(localRawDataRef.current);
        for (let i = 0; i < 64; i++) {
          localMicBinsRef.current[i] = localRawDataRef.current[i];
        }
        bins = localMicBinsRef.current;
      } else if (connected) {
        bins = agentState === "speaking" ? agentBinsRef.current : micBinsRef.current;
      } else {
        synthesizeFormantSlice(simBinsRef.current, t, "idle");
        // Interactive hover acoustic wave resonance across the hovered frequency band
        if (hoverNormYRef.current !== null && !reducedMotionRef.current) {
          const centerFreq = 1 - hoverNormYRef.current; // 0 (80Hz bottom) .. 1 (8kHz top)
          const ripple = 0.72 + 0.28 * Math.sin(t * 9.5);
          for (let i = 0; i < simBinsRef.current.length; i++) {
            const f = i / (simBinsRef.current.length - 1);
            const fundamental = Math.exp(-Math.pow((f - centerFreq) / 0.085, 2));
            const harmonic = Math.exp(
              -Math.pow((f - Math.min(0.96, centerFreq * 1.55 + 0.12)) / 0.1, 2)
            );
            const boost = (fundamental * 175 + harmonic * 95) * ripple;
            simBinsRef.current[i] = Math.min(255, Math.round(simBinsRef.current[i] + boost));
          }
        }
        bins = simBinsRef.current;
      }

      // Compute RMS energy + peak frequency bin
      let sumSq = 0;
      let peakVal = 0;
      let peakBin = 0;
      for (let i = 0; i < bins.length; i++) {
        const v = bins[i];
        sumSq += v * v;
        if (v > peakVal) {
          peakVal = v;
          peakBin = i;
        }
      }
      const rms = Math.sqrt(sumSq / bins.length) / 255;
      const vadThreshold = 0.14;
      const vadActive = rms > vadThreshold;

      // Shift waterfall left by 2px and paint newest STFT slice on the right edge
      if (!reducedMotionRef.current || phase !== "idle" || localMicActive || connected) {
        wfCtx.drawImage(wfCanvas, -colWidth, 0);
        const binH = h / bins.length;
        for (let i = 0; i < bins.length; i++) {
          const mag = bins[i];
          const lutIdx = mag * 3;
          wfCtx.fillStyle = `rgb(${SPECTROGRAM_LUT[lutIdx]},${SPECTROGRAM_LUT[lutIdx + 1]},${SPECTROGRAM_LUT[lutIdx + 2]})`;
          const y = h - (i + 1) * binH;
          wfCtx.fillRect(w - colWidth, y, colWidth, Math.ceil(binH) + 1);
        }

        // Paint crisp vertical barge-in cut marker directly into the scrolling waterfall
        if (markerFlagRef.current) {
          wfCtx.fillStyle = "#FF5A1F";
          wfCtx.fillRect(w - 3, 0, 3, h);
          wfCtx.fillStyle = "#121418";
          wfCtx.fillRect(Math.max(4, w - 144), 6, 138, 18);
          wfCtx.strokeStyle = "#FF5A1F";
          wfCtx.strokeRect(Math.max(4, w - 144), 6, 138, 18);
          wfCtx.fillStyle = "#FF9F38";
          wfCtx.font = "600 10px ui-monospace, monospace";
          wfCtx.fillText(markerFlagRef.current, Math.max(9, w - 138), 18);
          markerFlagRef.current = null;
        }
      }

      // Update rolling RMS energy oscilloscope + VAD threshold strip
      const hist = energyHistoryRef.current;
      hist.copyWithin(0, 1);
      hist[hist.length - 1] = rms;

      const scH = scopeCanvas.height;
      scCtx.fillStyle = "#121418";
      scCtx.fillRect(0, 0, w, scH);

      // Dashed VAD speech-onset threshold rail
      const threshY = scH - vadThreshold * (scH - 8) - 4;
      scCtx.save();
      scCtx.strokeStyle = "rgba(56, 217, 169, 0.4)";
      scCtx.setLineDash([4, 4]);
      scCtx.beginPath();
      scCtx.moveTo(0, threshY);
      scCtx.lineTo(w, threshY);
      scCtx.stroke();
      scCtx.restore();

      // Scrolling energy trace
      scCtx.strokeStyle =
        phase === "barge-in"
          ? "#FF5A1F"
          : phase === "agent-speaking" || agentState === "speaking"
            ? "#FF9F38"
            : vadActive
              ? "#38D9A9"
              : "#6B7280";
      scCtx.lineWidth = 1.6;
      scCtx.beginPath();
      for (let i = 0; i < hist.length; i++) {
        const x = (i / (hist.length - 1)) * w;
        const y = scH - Math.min(1, hist[i] * 1.45) * (scH - 8) - 4;
        if (i === 0) scCtx.moveTo(x, y);
        else scCtx.lineTo(x, y);
      }
      scCtx.stroke();

      // Throttle numeric HUD telemetry state updates to ~8Hz (zero layout thrash)
      if (nowMs - lastUiTick > 125) {
        lastUiTick = nowMs;
        const approxHz =
          hoverHzLabelRef.current !== null && phase === "idle" && !localMicActive && !connected
            ? hoverHzLabelRef.current
            : peakVal > 18
              ? Math.round((peakBin / 64) * 8000)
              : 0;
        const db = rms > 0.001 ? Math.max(-60, Math.round(20 * Math.log10(rms))) : -60;
        setReadout({ peakHz: approxHz, rmsDb: db, vadActive });
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [agentBinsRef, agentState, connected, inView, localMicActive, micBinsRef]);

  const sourceLabel =
    simPhase !== "idle"
      ? `SIMULATED // ${simPhase.toUpperCase()}`
      : localMicActive
        ? "LOCAL MIC // LIVE STFT"
        : connected
          ? `LIVEKIT // ${agentState.toUpperCase()}`
          : "STANDBY // NOISE FLOOR";

  return (
    <div
      ref={containerRef}
      className="mt-6 pt-6 border-t border-[#2B303B] space-y-4"
    >
      {/* Workbench header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#EFF0F1]">
            <Activity className="w-3.5 h-3.5 text-[#38D9A9]" />
            <span>STFT SPECTROGRAM &amp; BARGE-IN LAB</span>
          </div>
          <span
            className={cn(
              "font-mono text-[11px] px-2 py-0.5 border telemetry-nums",
              simPhase === "barge-in"
                ? "border-[#FF5A1F] text-[#FF5A1F] bg-[#FF5A1F]/12"
                : localMicActive || connected || simPhase !== "idle"
                  ? "border-[#38D9A9]/45 text-[#38D9A9] bg-[#38D9A9]/10"
                  : "border-[#2B303B] text-[#9499A3]"
            )}
          >
            {sourceLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={simPhase === "idle" ? startCallTurnSim : stopSimulation}
            className={cn(
              "hud-btn inline-flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs cursor-pointer",
              simPhase !== "idle"
                ? "border-[#FF9F38] bg-[#FF9F38]/14 text-[#EFF0F1]"
                : "border-[#3B4252] bg-[#121418] text-[#EFF0F1] hover:border-[#FF9F38]"
            )}
          >
            {simPhase !== "idle" ? (
              <>
                <Square className="w-3 h-3 fill-current text-[#FF9F38]" />
                <span>Stop Sim</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-[#38D9A9]" />
                <span>Simulate Call Turn</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={triggerBargeIn}
            className="hud-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF5A1F] text-[#121418] font-mono font-semibold text-xs hover:bg-[#ff6d38] cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Trigger Barge-In</span>
          </button>

          <button
            type="button"
            onClick={toggleLocalMic}
            aria-pressed={localMicActive}
            className={cn(
              "hud-btn inline-flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs cursor-pointer",
              localMicActive
                ? "border-[#38D9A9] bg-[#38D9A9]/15 text-[#EFF0F1]"
                : "border-[#2B303B] bg-[#121418] text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#38D9A9]"
            )}
          >
            {localMicActive ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-[#38D9A9]" />
                <span>Stop Mic Scope</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-[#38D9A9]" />
                <span>Test Mic Scope</span>
              </>
            )}
          </button>
        </div>
      </div>

      {localMicError && (
        <div
          role="status"
          className="px-3.5 py-2 bg-[#121418] border border-[#FF9F38]/50 text-xs text-[#EFF0F1]"
        >
          {localMicError}
        </div>
      )}

      {/* Dual-pane acoustic canvas instrument */}
      <div className="bg-[#121418] border border-[#2B303B] overflow-hidden">
        {/* Top VAD energy envelope strip */}
        <div className="relative border-b border-[#2B303B]">
          <canvas
            ref={scopeRef}
            className="block w-full h-[44px]"
            aria-label="Real-time audio RMS energy and VAD speech onset threshold"
          />
          <div className="pointer-events-none absolute top-1 left-2.5 font-mono text-[10px] text-[#9499A3]">
            VAD ENVELOPE · THRESHOLD
          </div>
          <div className="pointer-events-none absolute top-1 right-2.5 flex items-center gap-3 font-mono text-[10px] telemetry-nums">
            <span className={readout.vadActive ? "text-[#38D9A9]" : "text-[#9499A3]"}>
              VAD {readout.vadActive ? "SPEECH" : "QUIET"}
            </span>
            <span className="text-[#C4C8D0]">{readout.rmsDb} dBFS</span>
            <span className="text-[#FF9F38]">
              PEAK {readout.peakHz > 0 ? `${readout.peakHz} Hz` : "—"}
            </span>
          </div>
        </div>

        {/* Main 60fps rolling STFT waterfall spectrogram */}
        <div
          className="relative cursor-crosshair"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            hoverNormYRef.current = ny;
            hoverHzLabelRef.current = Math.round(80 + (1 - ny) * 7920);
          }}
          onPointerLeave={() => {
            hoverNormYRef.current = null;
            hoverHzLabelRef.current = null;
          }}
        >
          <canvas
            ref={waterfallRef}
            className="block w-full h-[152px]"
            aria-label="Scrolling real-time STFT frequency waterfall spectrogram from 80Hz to 8kHz"
          />
          {/* Calibrated frequency axis markers */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 left-2 flex flex-col justify-between font-mono text-[10px] text-[#EFF0F1]/65 telemetry-nums"
          >
            <span>8.0 kHz</span>
            <span>4.0 kHz</span>
            <span>2.0 kHz</span>
            <span>80 Hz</span>
          </div>
          {/* Thermal amplitude legend */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1.5 right-2.5 flex items-center gap-2 font-mono text-[10px] text-[#9499A3]"
          >
            <span>FLOOR</span>
            <span className="w-16 h-1.5 bg-gradient-to-r from-[#153639] via-[#38D9A9] via-60% to-[#FF5A1F]" />
            <span>PEAK</span>
          </div>
        </div>

        {/* Live event / transcript ticker */}
        <div
          aria-live="polite"
          className="px-3.5 py-2 border-t border-[#2B303B] bg-[#14171D] flex flex-wrap items-center justify-between gap-2 font-mono text-xs"
        >
          <span
            className={cn(
              "truncate",
              simPhase === "barge-in"
                ? "text-[#FF5A1F]"
                : simPhase === "agent-speaking"
                  ? "text-[#FF9F38]"
                  : simPhase === "caller-speaking"
                    ? "text-[#38D9A9]"
                    : "text-[#C4C8D0]"
            )}
          >
            {simCaption}
          </span>
          <span className="text-[11px] text-[#9499A3] shrink-0">
            64-BIN FFT · WINDOW 256
          </span>
        </div>
      </div>
    </div>
  );
}
