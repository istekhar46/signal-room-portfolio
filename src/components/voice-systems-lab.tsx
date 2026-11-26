"use client";

import { useReducer, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";
import { ArrowRight, AudioLines, Braces, Check, CircleStop, GitBranch, LockKeyhole, Play, RotateCcw } from "lucide-react";
import { CALL_STAGES, INITIAL_CALL_LAB, callLabReducer, isCallActive } from "@/lib/call-lab";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const WAVEFORM = Array.from({ length: 128 }, (_, i) => {
  const envelope = Math.sin((i / 127) * Math.PI) ** 0.6;
  return Math.round(4 + envelope * (9 + Math.abs(Math.sin(i * 1.71) * Math.cos(i * 0.37)) * 52));
});

const NODES = [
  { phase: "listening", label: "Audio in", service: "WebRTC room" },
  { phase: "transcribing", label: "Transcript", service: "Streaming STT" },
  { phase: "thinking", label: "Generation", service: "LLM + tools" },
  { phase: "speaking", label: "Audio out", service: "Streaming TTS" },
] as const;

export function VoiceSystemsLab() {
  const rootRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [state, dispatch] = useReducer(callLabReducer, INITIAL_CALL_LAB);
  const reducedMotion = useReducedMotion();
  const active = isCallActive(state.phase);
  const interrupted = state.phase === "interrupted";
  const complete = state.phase === "complete";
  const stageIndex = CALL_STAGES.findIndex((stage) => stage.phase === state.phase);
  const latestEvent = state.events.at(-1);
  const versionChanged = state.snapshotVersion !== null && state.publishedVersion !== state.snapshotVersion;

  useGSAP(() => {
    if (state.run === 0) return;
    const run = state.run;
    const timeline = gsap.timeline({ paused: true });
    timelineRef.current = timeline;
    if (!reducedMotion) {
      timeline.fromTo(playheadRef.current, { scaleX: 0 }, { scaleX: 1, duration: 8, ease: "none" }, 0);
    }
    for (const stage of CALL_STAGES.slice(1)) {
      timeline.call(() => dispatch({ type: "stage", run, phase: stage.phase }), [], stage.at);
    }
    timeline.play(0);
    return () => { timeline.kill(); timelineRef.current = null; };
    // Each run owns one timeline. State transitions never rebuild its clock.
  }, { scope: rootRef, dependencies: [state.run], revertOnUpdate: true });

  const interrupt = () => {
    timelineRef.current?.kill();
    dispatch({ type: "interrupt" });
  };

  return (
    <div ref={rootRef} className="call-lab overflow-hidden border border-[#3B4252] bg-[#15181D]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3B4252] px-5 py-3 md:px-7">
        <div className="flex items-center gap-2.5 text-sm text-[#C4C8D0]">
          <span className={cn("h-2 w-2 rounded-full", active ? "bg-[#38D9A9]" : interrupted ? "bg-[#FF9F38]" : "bg-[#9499A3]")} />
          <span>Interactive model</span>
          <span className="text-[#9499A3]">/ illustrative timings</span>
        </div>
        <span className="font-mono text-xs text-[#9499A3] tabular-nums">
          {state.run ? `call-${String(state.run).padStart(3, "0")}` : "Ready when you are"}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.65fr_1fr]">
        <div className="min-w-0 border-b border-[#3B4252] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 pt-6 md:px-7">
            <span className="text-sm font-medium text-[#C4C8D0]">Control plane</span>
            <span className="text-xs text-[#9499A3]">Configuration &amp; event state</span>
          </div>

          <div className="grid grid-cols-[1fr_36px_1fr] items-center gap-2 px-5 py-5 md:gap-4 md:px-7">
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-xs text-[#9499A3]"><GitBranch className="h-3.5 w-3.5" />Published prompt</span>
              <span className={cn("block font-mono text-3xl tabular-nums", versionChanged ? "text-[#FF9F38]" : "text-[#EFF0F1]")}>v{state.publishedVersion}</span>
              <button type="button" onClick={() => dispatch({ type: "publish" })} className="call-lab-link">
                Publish v{state.publishedVersion + 1}<ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-2 text-[#9499A3]" aria-hidden="true"><LockKeyhole className="h-4 w-4" /><span className="h-px w-full bg-[#3B4252]" /></div>
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-xs text-[#9499A3]"><LockKeyhole className="h-3.5 w-3.5" />Call snapshot</span>
              <span className="block font-mono text-3xl text-[#38D9A9] tabular-nums">{state.snapshotVersion === null ? "--" : `v${state.snapshotVersion}`}</span>
              <span className="flex min-h-11 items-center text-xs leading-relaxed text-[#C4C8D0]">{versionChanged ? "This call keeps its original prompt." : "Captured when the call starts."}</span>
            </div>
          </div>

          <div className="relative border-y border-[#2B303B] bg-[#101216] px-5 py-7 md:px-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#C4C8D0]">Execution plane</span>
              <span className={cn("font-mono text-xs", interrupted ? "text-[#FF9F38]" : "text-[#38D9A9]")}>
                {interrupted ? "CANCELLED" : state.phase === "ready" ? "AWAITING INPUT" : complete ? "TURN COMPLETE" : state.phase.toUpperCase()}
              </span>
            </div>

            <div className="relative mb-6 h-24 overflow-hidden" aria-hidden="true">
              <svg className="h-full w-full" viewBox="0 0 640 128" preserveAspectRatio="none" fill="none">
                <line x1="0" y1="64" x2="640" y2="64" stroke="#2B303B" />
                {WAVEFORM.map((height, i) => <line key={i} x1={i * 5 + 2} x2={i * 5 + 2} y1={64 - height} y2={64 + height} stroke={interrupted ? "#FF9F38" : "#38D9A9"} strokeWidth="2" opacity={state.phase === "ready" ? 0.25 : 0.75} />)}
              </svg>
              <div className="absolute inset-0 origin-left scale-x-0 border-r-2 border-[#EFF0F1] bg-[#EFF0F1]/[0.06]" ref={playheadRef} />
              <span className="absolute bottom-0 right-0 bg-[#101216] pl-2 font-mono text-[10px] text-[#9499A3]">ILLUSTRATIVE SIGNAL</span>
            </div>

            <ol className="relative grid grid-cols-4 gap-2">
              {NODES.map((node, i) => {
                const selected = node.phase === state.phase;
                const reached = stageIndex >= i && !interrupted;
                return (
                  <li key={node.phase} className="relative min-w-0">
                    {i < 3 && <span aria-hidden="true" className={cn("absolute left-3 right-[-8px] top-[7px] h-px", reached && stageIndex > i ? "bg-[#38D9A9]/65" : "bg-[#3B4252]")} />}
                    <span aria-hidden="true" className={cn("relative z-10 mb-3 block h-[15px] w-[15px] rounded-full border-[3px] border-[#101216] outline outline-1", selected ? "bg-[#38D9A9] outline-[#38D9A9]" : reached ? "bg-[#38D9A9]/60 outline-[#38D9A9]/60" : "bg-[#3B4252] outline-[#3B4252]")} />
                    <span className={cn("block text-xs font-medium sm:text-sm", selected ? "text-[#38D9A9]" : "text-[#EFF0F1]")}>{node.label}</span>
                    <span className="mt-1 hidden text-[11px] text-[#9499A3] sm:block">{node.service}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 py-5 md:px-7">
            <button type="button" data-start-call disabled={active} onClick={() => dispatch({ type: "start" })} className="call-lab-run inline-flex min-h-11 items-center justify-center gap-2 bg-[#38D9A9] px-5 py-3 text-sm font-semibold text-[#101216] transition-colors hover:bg-[#68E6C1] disabled:cursor-default disabled:bg-[#273B36] disabled:text-[#B4C6C1]">
              {state.run ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {active ? "Turn running" : state.run ? "Run another turn" : "Run a voice turn"}
            </button>
            <button type="button" disabled={!active} onClick={interrupt} className="inline-flex min-h-11 items-center gap-2 border border-[#FF9F38]/60 px-4 py-3 text-sm text-[#FF9F38] transition-colors hover:bg-[#FF9F38]/10 disabled:cursor-default disabled:border-[#3B4252] disabled:text-[#9499A3]">
              <CircleStop className="h-4 w-4" />Interrupt the turn
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-[#121418]">
          <div className="flex items-center justify-between border-b border-[#2B303B] px-5 py-4 md:px-6">
            <span className="flex items-center gap-2 text-sm font-medium text-[#EFF0F1]"><Braces className="h-4 w-4 text-[#FF9F38]" />Event trace</span>
            <span className="font-mono text-[11px] text-[#9499A3]">LOCAL MODEL</span>
          </div>
          <ol aria-label="Recent call model events" className="h-[330px] flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6 lg:min-h-[292px]">
            {state.events.length ? state.events.slice(-4).map((event, i) => (
              <li key={`${state.run}-${i}-${event.name}`} className="call-lab-event">
                <code className={cn("block text-xs", event.kind === "guard" ? "text-[#FF9F38]" : event.kind === "change" ? "text-[#EFF0F1]" : "text-[#38D9A9]")}>{event.name}</code>
                <span className="mt-1 block text-xs leading-relaxed text-[#9499A3]">{event.detail}</span>
              </li>
            )) : (
              <li className="space-y-4 py-2">
                <AudioLines className="h-7 w-7 text-[#38D9A9]" />
                <p className="max-w-[28ch] text-lg leading-snug text-[#EFF0F1]">The interesting part is what happens when things change.</p>
                <p className="text-sm leading-relaxed text-[#9499A3]">Start a turn. Publish a prompt while it runs, or cut it short. Every action leaves a trace here.</p>
              </li>
            )}
          </ol>
          <div className="border-t border-[#2B303B] px-5 py-4 md:px-6">
            <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-[#C4C8D0]">
              <span>Event deliveries <b className="ml-1 font-mono font-medium text-[#EFF0F1]">{state.eventDeliveries}</b></span>
              <span>Side effects <b className="ml-1 font-mono font-medium text-[#38D9A9]">{state.eventApplications}</b></span>
            </div>
            <button type="button" onClick={() => dispatch({ type: "deliver", run: state.run })} disabled={!complete} className="call-lab-link disabled:cursor-default disabled:text-[#9499A3]">
              Redeliver completion<RotateCcw className="h-3.5 w-3.5" />
            </button>
            <p className="mt-1 text-xs text-[#9499A3]">{complete ? "Try it twice. The event key prevents a second write." : "Available after a turn completes."}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-t border-[#3B4252] px-5 py-4 md:grid-cols-3 md:px-7">
        {[
          { title: "Pinned configuration", detail: "Edits belong to the next call.", passed: versionChanged },
          { title: "Cancellable output", detail: "Interruption ends the current turn.", passed: interrupted },
          { title: "Idempotent events", detail: "Many deliveries. One side effect.", passed: state.eventDeliveries > 1 },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-2.5">
            <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center border", item.passed ? "border-[#38D9A9] bg-[#38D9A9] text-[#101216]" : "border-[#3B4252] text-transparent")}><Check className="h-3 w-3" /></span>
            <div><span className="block text-xs font-medium text-[#EFF0F1]">{item.title}</span><span className="mt-1 block text-xs text-[#9499A3]">{item.detail}</span></div>
          </div>
        ))}
      </div>
      <p role="status" className="sr-only">{latestEvent ? `${latestEvent.name}. ${latestEvent.detail}` : "Call model ready. Start a turn to explore."}</p>
    </div>
  );
}
