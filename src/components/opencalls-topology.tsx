"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Radio, ShieldCheck } from "lucide-react";
import { signalSound } from "@/lib/signal-sound";
import { cn } from "@/lib/utils";

type TopologyNodeId =
  | "gateway"
  | "auth"
  | "call-service"
  | "kb-service"
  | "payment"
  | "sip-webrtc"
  | "livekit"
  | "voice-worker"
  | "otel";

type TraceId = "inbound-call" | "rag-retrieval" | "usage-settlement";

interface TopologyNode {
  id: TopologyNodeId;
  plane: "control" | "execution";
  label: string;
  protocol: string;
  ownership: string;
}

const NODES: TopologyNode[] = [
  {
    id: "gateway",
    plane: "control",
    label: "HTTP Gateway",
    protocol: "REST → gRPC",
    ownership:
      "Validates console/admin HTTP requests, enforces auth/rate limits (Redis), and translates operations into internal protobuf gRPC calls.",
  },
  {
    id: "auth",
    plane: "control",
    label: "Auth Service",
    protocol: "gRPC · Postgres",
    ownership:
      "Owns customer identity, verification, OAuth sessions, and organization boundaries in its isolated logical database.",
  },
  {
    id: "call-service",
    plane: "control",
    label: "Call & Version Service",
    protocol: "gRPC · Snapshots",
    ownership:
      "Decouples editing from runtime — resolves immutable published agent versions, models, voices, tools, and phone routing per call.",
  },
  {
    id: "kb-service",
    plane: "control",
    label: "Knowledge-Base Service",
    protocol: "gRPC · Embeddings",
    ownership:
      "Owns source ingestion, document chunking, embeddings, and low-latency vector retrieval; gateway never touches vector search directly.",
  },
  {
    id: "payment",
    plane: "control",
    label: "Payment Ledger",
    protocol: "gRPC · Wallets",
    ownership:
      "Strict owner of wallets, ledger entries, rates, holds, and settlement — voice workers report usage but never mutate balances.",
  },
  {
    id: "sip-webrtc",
    plane: "execution",
    label: "SIP / WebRTC Ingress",
    protocol: "Full-Duplex",
    ownership:
      "Bridges real telephony SIP trunks and browser WebRTC clients into unified low-latency media sessions.",
  },
  {
    id: "livekit",
    plane: "execution",
    label: "LiveKit SFU Room",
    protocol: "WebRTC · RPC",
    ownership:
      "Routes real-time audio frames, participant state, and structured data channels with sub-second transport overhead.",
  },
  {
    id: "voice-worker",
    plane: "execution",
    label: "Voice Execution Worker",
    protocol: "VAD · STT · LLM · TTS",
    ownership:
      "Runs streaming Silero VAD, STT, LLM dialogue, RAG/tool calls, and ElevenLabs TTS with instant barge-in cancellation.",
  },
  {
    id: "otel",
    plane: "execution",
    label: "OpenTelemetry & GCS",
    protocol: "OTLP · Artifacts",
    ownership:
      "Exports stage timings separately from caller-observed voice-response latency while archiving transcripts & recordings to GCS.",
  },
];

interface TraceFlow {
  id: TraceId;
  label: string;
  steps: {
    nodeId: TopologyNodeId;
    wire: string;
    detail: string;
  }[];
}

const TRACES: TraceFlow[] = [
  {
    id: "inbound-call",
    label: "Trace Inbound Call",
    steps: [
      {
        nodeId: "sip-webrtc",
        wire: "SIP INVITE",
        detail: "Inbound phone call arrives on SIP trunk and requests room dispatch.",
      },
      {
        nodeId: "call-service",
        wire: "gRPC ResolveVersion",
        detail: "Call Service resolves the immutable published agent snapshot & voice config.",
      },
      {
        nodeId: "livekit",
        wire: "WebRTC SFU",
        detail: "LiveKit opens full-duplex audio room and dispatches the voice worker.",
      },
      {
        nodeId: "voice-worker",
        wire: "VAD → STT → LLM → TTS",
        detail: "Worker streams speech recognition, LLM reasoning, and ElevenLabs audio back.",
      },
      {
        nodeId: "otel",
        wire: "OTLP Span",
        detail: "Records caller-observed voice-response latency alongside stage timings.",
      },
    ],
  },
  {
    id: "rag-retrieval",
    label: "Trace RAG Retrieval",
    steps: [
      {
        nodeId: "voice-worker",
        wire: "Tool Intent",
        detail: "Caller asks a domain question; LLM triggers grounded knowledge lookup.",
      },
      {
        nodeId: "kb-service",
        wire: "gRPC VectorSearch",
        detail: "Knowledge-Base Service retrieves ranked chunks from its isolated store.",
      },
      {
        nodeId: "voice-worker",
        wire: "Grounded TTS",
        detail: "Worker streams concise spoken answer via ElevenLabs TTS without stalling.",
      },
      {
        nodeId: "otel",
        wire: "Retrieval Latency",
        detail: "Tracks retrieval wait separately from model TTFT for accurate debugging.",
      },
    ],
  },
  {
    id: "usage-settlement",
    label: "Trace Billing Settlement",
    steps: [
      {
        nodeId: "voice-worker",
        wire: "Usage Report",
        detail: "Call ends; worker emits measured audio & provider usage (no direct wallet write).",
      },
      {
        nodeId: "call-service",
        wire: "gRPC CallSummary",
        detail: "Call Service persists durable call history and forwards usage to Payment.",
      },
      {
        nodeId: "payment",
        wire: "Ledger Settle",
        detail: "Payment Service releases hold and writes immutable wallet settlement entry.",
      },
      {
        nodeId: "otel",
        wire: "GCS Archive",
        detail: "Transcript and recording artifacts stored under domain retention policy.",
      },
    ],
  },
];

export function OpenCallsTopology() {
  const [selectedNodeId, setSelectedNodeId] = useState<TopologyNodeId>("call-service");
  const [activeTraceId, setActiveTraceId] = useState<TraceId | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const runTrace = (trace: TraceFlow) => {
    clearTimers();
    signalSound.playTick(760);
    setActiveTraceId(trace.id);
    setActiveStepIndex(0);
    setSelectedNodeId(trace.steps[0].nodeId);

    const stepTimers: number[] = [];
    trace.steps.forEach((step, idx) => {
      if (idx === 0) return;
      const tid = window.setTimeout(() => {
        signalSound.playTick(620 + idx * 55);
        setActiveStepIndex(idx);
        setSelectedNodeId(step.nodeId);
      }, idx * 820);
      stepTimers.push(tid);
    });

    const endTimer = window.setTimeout(() => {
      setActiveTraceId(null);
      setActiveStepIndex(-1);
    }, trace.steps.length * 820 + 950);
    stepTimers.push(endTimer);

    timersRef.current = stepTimers;
  };

  const controlNodes = NODES.filter((n) => n.plane === "control");
  const execNodes = NODES.filter((n) => n.plane === "execution");
  const selectedNode = NODES.find((n) => n.id === selectedNodeId) ?? NODES[0];

  const currentTrace = TRACES.find((t) => t.id === activeTraceId) ?? null;
  const currentStep =
    currentTrace && activeStepIndex >= 0 ? currentTrace.steps[activeStepIndex] : null;
  const visitedNodeIds = new Set(
    currentTrace && activeStepIndex >= 0
      ? currentTrace.steps.slice(0, activeStepIndex + 1).map((s) => s.nodeId)
      : []
  );

  return (
    <div className="bg-[#121418] border border-[#2B303B] p-4 md:p-5 signal-grid space-y-4">
      {/* Header + Trace Triggers */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#2B303B]">
        <div className="flex items-center gap-2 font-mono text-xs text-[#EFF0F1]">
          <Radio
            className={cn(
              "w-3.5 h-3.5",
              activeTraceId ? "text-[#FF9F38] signal-pulse" : "text-[#38D9A9]"
            )}
          />
          <span>INTERACTIVE DUAL-PLANE TOPOLOGY</span>
        </div>
        <span className="font-mono text-[11px] text-[#38D9A9]">gRPC + LIVEKIT</span>
      </div>

      {/* 3 One-click packet trace controls */}
      <div className="flex flex-wrap gap-2">
        {TRACES.map((trace) => {
          const running = activeTraceId === trace.id;
          return (
            <button
              key={trace.id}
              type="button"
              onClick={() => runTrace(trace)}
              className={cn(
                "hud-btn inline-flex items-center gap-1.5 px-2.5 py-1.5 border font-mono text-[11px] cursor-pointer",
                running
                  ? "border-[#FF5A1F] bg-[#FF5A1F]/16 text-[#EFF0F1]"
                  : "border-[#2B303B] bg-[#1A1D23] text-[#C4C8D0] hover:border-[#FF9F38] hover:text-[#EFF0F1]"
              )}
            >
              <Play
                className={cn(
                  "w-2.5 h-2.5 fill-current",
                  running ? "text-[#FF5A1F]" : "text-[#38D9A9]"
                )}
              />
              <span>{trace.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dual-Plane Columns */}
      <div className="grid sm:grid-cols-2 gap-3">
        {/* Control Plane */}
        <div className="border border-[#2B303B] bg-[#161920]/90 p-3 space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-[#FF9F38] pb-1.5 border-b border-[#2B303B]">
            <span>CONTROL PLANE</span>
            <span className="text-[#9499A3]">DURABLE STATE</span>
          </div>
          {controlNodes.map((node) => {
            const isCurrent = currentStep?.nodeId === node.id;
            const isVisited = visitedNodeIds.has(node.id);
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  signalSound.playTick(600);
                  setSelectedNodeId(node.id);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 border transition-colors cursor-pointer",
                  isCurrent
                    ? "border-[#FF5A1F] bg-[#FF5A1F]/15 text-[#EFF0F1]"
                    : isSelected
                      ? "border-[#FF9F38] bg-[#1E232D] text-[#EFF0F1]"
                      : isVisited
                        ? "border-[#38D9A9]/60 bg-[#38D9A9]/8 text-[#EFF0F1]"
                        : "border-[#2B303B] bg-[#121418] text-[#C4C8D0] hover:border-[#9499A3]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium">{node.label}</span>
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isCurrent
                        ? "bg-[#FF5A1F] signal-pulse"
                        : isVisited
                          ? "bg-[#38D9A9]"
                          : isSelected
                            ? "bg-[#FF9F38]"
                            : "bg-[#2B303B]"
                    )}
                  />
                </div>
                <div className="font-mono text-[10px] text-[#9499A3] mt-0.5">{node.protocol}</div>
              </button>
            );
          })}
        </div>

        {/* Voice Execution Plane */}
        <div className="border border-[#2B303B] bg-[#161920]/90 p-3 space-y-2">
          <div className="flex items-center justify-between font-mono text-[10px] tracking-wider text-[#38D9A9] pb-1.5 border-b border-[#2B303B]">
            <span>VOICE EXECUTION PLANE</span>
            <span className="text-[#9499A3]">REAL-TIME MEDIA</span>
          </div>
          {execNodes.map((node) => {
            const isCurrent = currentStep?.nodeId === node.id;
            const isVisited = visitedNodeIds.has(node.id);
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => {
                  signalSound.playTick(680);
                  setSelectedNodeId(node.id);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 border transition-colors cursor-pointer",
                  isCurrent
                    ? "border-[#FF5A1F] bg-[#FF5A1F]/15 text-[#EFF0F1]"
                    : isSelected
                      ? "border-[#38D9A9] bg-[#1E232D] text-[#EFF0F1]"
                      : isVisited
                        ? "border-[#38D9A9]/60 bg-[#38D9A9]/8 text-[#EFF0F1]"
                        : "border-[#2B303B] bg-[#121418] text-[#C4C8D0] hover:border-[#9499A3]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium">{node.label}</span>
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isCurrent
                        ? "bg-[#FF5A1F] signal-pulse"
                        : isVisited
                          ? "bg-[#38D9A9]"
                          : isSelected
                            ? "bg-[#38D9A9]"
                            : "bg-[#2B303B]"
                    )}
                  />
                </div>
                <div className="font-mono text-[10px] text-[#9499A3] mt-0.5">{node.protocol}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live packet / boundary ownership inspector */}
      <div
        aria-live="polite"
        className="border border-[#2B303B] bg-[#161920] p-3.5 space-y-1.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
          <span className="inline-flex items-center gap-1.5 text-[#EFF0F1] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#38D9A9]" />
            <span>{selectedNode.label}</span>
          </span>
          <span
            className={cn(
              "px-1.5 py-0.5 border text-[10px]",
              currentStep
                ? "border-[#FF5A1F]/60 text-[#FF9F38] bg-[#FF5A1F]/10"
                : "border-[#2B303B] text-[#9499A3]"
            )}
          >
            {currentStep
              ? `WIRE // ${currentStep.wire} (${activeStepIndex + 1}/${currentTrace?.steps.length})`
              : `BOUNDARY // ${selectedNode.protocol}`}
          </span>
        </div>
        <p className="text-xs text-[#C4C8D0] leading-relaxed">
          {currentStep ? currentStep.detail : selectedNode.ownership}
        </p>
      </div>
    </div>
  );
}
