"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Cpu, Layers, MessageSquare, Sparkles } from "lucide-react";
import { PORTFOLIO, type PortfolioProject } from "@/data/portfolio";
import { signalSound } from "@/lib/signal-sound";
import { cn } from "@/lib/utils";

type SystemFilter = "all" | PortfolioProject["id"];
type VisitorLensId = "voice-ai" | "fullstack-ai" | "founder-opencalls";

interface StackSignalMatrixProps {
  onOpenProject: (projectId: PortfolioProject["id"], tab?: "overview" | "architecture" | "stack") => void;
  onAskAbout: (prompt: string) => void;
}

const SYSTEM_FILTERS: { id: SystemFilter; label: string }[] = [
  { id: "all", label: "ALL SYSTEMS" },
  { id: "opencalls", label: "OPENCALLS" },
  { id: "ruh-ai-voice", label: "RUH AI" },
  { id: "invoiceo", label: "INVOICEO" },
];

const VISITOR_LENSES: {
  id: VisitorLensId;
  label: string;
  headline: string;
  bullets: string[];
  aiPrompt: string;
  filterSystem: SystemFilter;
}[] = [
  {
    id: "voice-ai",
    label: "Hiring: Voice AI",
    headline: "Production Telephony, WebRTC & Sub-Second Speech Pipelines",
    bullets: [
      "Ships real-time LiveKit WebRTC & SIP telephony agents with Silero VAD, Deepgram streaming STT, LLM tool calling, and ElevenLabs TTS.",
      "Measures caller-observed latency separately from per-stage timings via OpenTelemetry & SigNoz.",
      "Actively researching STFT audio representations and custom TTS model internals.",
    ],
    aiPrompt:
      "Give me a concise technical summary of Istekhar's production Voice AI experience across OpenCalls and RUH AI.",
    filterSystem: "opencalls",
  },
  {
    id: "fullstack-ai",
    label: "Hiring: Full-Stack AI",
    headline: "Distributed Control Planes + Modern Next.js / NestJS Products",
    bullets: [
      "Architects protobuf gRPC service boundaries, Celery + RabbitMQ queues, and atomic Redis Lua concurrency controls.",
      "Ships clean end-to-end TypeScript & Python stacks across Next.js, NestJS, PostgreSQL, GraphQL, and Docker.",
      "Proven track record from SWE Associate (Rapid Innovation) to Founding Engineer (RUH AI) to Founder (OpenCalls, invoiceo).",
    ],
    aiPrompt:
      "Walk through Istekhar's distributed backend and full-stack engineering experience across gRPC, Redis Lua, Next.js, and NestJS.",
    filterSystem: "all",
  },
  {
    id: "founder-opencalls",
    label: "Exploring: OpenCalls",
    headline: "Dual-Plane Voice AI Platform Built for Reliability",
    bullets: [
      "Explicit split between durable control-plane microservices (Auth, Call, Knowledge-Base, Payment) and LiveKit voice rooms.",
      "Immutable published agent snapshots so editing prompts or tools never corrupts an active phone call.",
      "Live at opencallsai.com with full architecture notes published on Medium.",
    ],
    aiPrompt: "Explain OpenCalls' dual-plane architecture and why Istekhar split control plane from execution plane.",
    filterSystem: "opencalls",
  },
];

export function StackSignalMatrix({ onOpenProject, onAskAbout }: StackSignalMatrixProps) {
  const [filter, setFilter] = useState<SystemFilter>("all");
  const [activeLens, setActiveLens] = useState<VisitorLensId>("voice-ai");
  const [copiedBrief, setCopiedBrief] = useState(false);

  const lens = VISITOR_LENSES.find((l) => l.id === activeLens) ?? VISITOR_LENSES[0];

  const counts = useMemo(() => {
    let total = 0;
    let matched = 0;
    for (const cat of PORTFOLIO.stack) {
      for (const item of cat.items) {
        total += 1;
        if (filter === "all" || item.projectIds.includes(filter)) {
          matched += 1;
        }
      }
    }
    return { total, matched };
  }, [filter]);

  const copyMarkdownBrief = async () => {
    const md = [
      `# ${PORTFOLIO.person.name} — ${PORTFOLIO.person.role}`,
      `Location: ${PORTFOLIO.person.location} | Current: ${PORTFOLIO.person.currentHeadline}`,
      `Email: ${PORTFOLIO.person.email} | Resume: ${PORTFOLIO.person.resumeUrl}`,
      `GitHub: ${PORTFOLIO.person.github} | LinkedIn: ${PORTFOLIO.person.linkedin} | Medium: ${PORTFOLIO.person.medium}`,
      "",
      `## Focus Lens: ${lens.headline}`,
      ...lens.bullets.map((b) => `- ${b}`),
      "",
      "## Flagship Systems",
      "- OpenCalls (Founder, opencallsai.com): Dual-plane Voice AI platform (HTTP/gRPC control plane + LiveKit WebRTC/SIP voice execution + ElevenLabs TTS + OpenTelemetry).",
      "- RUH AI (Founding Engineer): Production telephony & web voice agents + LangChain/AutoGen workflow automation.",
      "- invoiceo (Founder, invoiceo.site): Streamlined full-stack invoicing product (Next.js, TypeScript, NestJS, PostgreSQL, GraphQL).",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(md);
      signalSound.playTick(840);
      setCopiedBrief(true);
      window.setTimeout(() => setCopiedBrief(false), 2200);
    } catch {
      // ignore clipboard restriction
    }
  };

  return (
    <section
      id="stack"
      aria-labelledby="stack-heading"
      className="py-24 md:py-32 border-t border-[#2B303B]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-10">
        {/* Header + Interactive System Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <h2
              id="stack-heading"
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#EFF0F1]"
            >
              Technical Stack
            </h2>
            <p className="text-sm text-[#9499A3] mt-2">
              Filter by shipped system to trace where every protocol, runtime, and database runs in production.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter technical stack by system"
              className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#1A1D23] border border-[#2B303B]"
            >
              {SYSTEM_FILTERS.map((sf) => {
                const active = filter === sf.id;
                return (
                  <button
                    key={sf.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      signalSound.playTick(700);
                      setFilter(sf.id);
                    }}
                    className={cn(
                      "px-2.5 py-1.5 font-mono text-[11px] transition-colors cursor-pointer",
                      active
                        ? "bg-[#22262E] border border-[#38D9A9]/70 text-[#38D9A9]"
                        : "border border-transparent text-[#9499A3] hover:text-[#EFF0F1]"
                    )}
                  >
                    {sf.label}
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-[11px] text-[#9499A3] telemetry-nums px-2">
              {counts.matched}/{counts.total} ACTIVE
            </span>
          </div>
        </div>

        {/* Signal Matrix Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2B303B] border border-[#2B303B]">
          {PORTFOLIO.stack.map((category) => (
            <div key={category.id} className="bg-[#121418] p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2B303B]">
                <h3 className="text-sm font-semibold text-[#EFF0F1] flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#FF9F38]" />
                  <span>{category.name}</span>
                </h3>
                <span className="font-mono text-[10px] text-[#9499A3] telemetry-nums">
                  {category.items.filter((i) => filter === "all" || i.projectIds.includes(filter)).length}
                  /{category.items.length}
                </span>
              </div>
              <ul className="space-y-3">
                {category.items.map((item) => {
                  const isMatched = filter === "all" || item.projectIds.includes(filter);
                  return (
                    <li
                      key={item.name}
                      className={cn(
                        "flex items-center justify-between gap-3 text-sm transition-opacity duration-200",
                        isMatched ? "opacity-100" : "opacity-30"
                      )}
                    >
                      <span
                        className={cn(
                          "transition-colors",
                          isMatched && filter !== "all" ? "text-[#EFF0F1] font-medium" : "text-[#C4C8D0]"
                        )}
                      >
                        {item.name}
                      </span>
                      {item.projectIds.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.projectIds.map((pid) => (
                            <button
                              key={pid}
                              type="button"
                              onClick={() => onOpenProject(pid, "stack")}
                              className={cn(
                                "hud-btn font-mono text-[11px] px-1.5 py-0.5 border cursor-pointer",
                                filter === pid
                                  ? "bg-[#38D9A9]/15 border-[#38D9A9] text-[#38D9A9]"
                                  : "bg-[#1A1D23] border-[#2B303B] text-[#9499A3] hover:text-[#38D9A9] hover:border-[#38D9A9]"
                              )}
                              title={`Inspect ${pid}`}
                            >
                              {pid === "opencalls"
                                ? "OpenCalls"
                                : pid === "ruh-ai-voice"
                                  ? "RUH AI"
                                  : "invoiceo"}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Visitor / Recruiter Briefing Console */}
        <div className="hud-frame bg-[#161920] border border-[#2B303B] p-5 md:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#2B303B]">
            <div className="flex items-center gap-2 font-mono text-xs text-[#FF9F38]">
              <Layers className="w-4 h-4 text-[#FF5A1F]" />
              <span>VISITOR BRIEFING LENS // TAILORED SUMMARY</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Visitor briefing lens">
              {VISITOR_LENSES.map((item) => {
                const active = item.id === activeLens;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      signalSound.playTick(720);
                      setActiveLens(item.id);
                      setFilter(item.filterSystem);
                    }}
                    className={cn(
                      "hud-btn px-3 py-1.5 border font-mono text-[11px] cursor-pointer",
                      active
                        ? "border-[#FF9F38] bg-[#FF9F38]/12 text-[#EFF0F1]"
                        : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.5fr_auto] gap-6 items-start">
            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-[#EFF0F1]">{lens.headline}</h3>
              <ul className="space-y-2 text-sm text-[#C4C8D0]">
                {lens.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#38D9A9] mt-1 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onAskAbout(lens.aiPrompt)}
                className="hud-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF5A1F] text-[#121418] font-mono font-semibold text-xs hover:bg-[#ff6d38] cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask AI About This Fit</span>
              </button>
              <button
                type="button"
                onClick={() => void copyMarkdownBrief()}
                className="hud-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#121418] border border-[#3B4252] font-mono text-xs text-[#EFF0F1] hover:border-[#38D9A9] cursor-pointer"
              >
                {copiedBrief ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#38D9A9]" />
                    <span className="text-[#38D9A9]">Copied Brief (.md)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#C4C8D0]" />
                    <span>Copy Brief (.md)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
