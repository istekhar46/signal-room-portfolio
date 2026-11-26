"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Terminal, X } from "lucide-react";
import { PORTFOLIO, type PortfolioProject } from "@/data/portfolio";
import { signalSound } from "@/lib/signal-sound";
import { cn } from "@/lib/utils";

interface TerminalLine {
  id: string;
  kind: "cmd" | "info" | "accent" | "mint" | "code" | "error";
  text: string;
}

interface SignalTerminalProps {
  open: boolean;
  onClose: () => void;
  onOpenProject: (projectId: PortfolioProject["id"]) => void;
  onStartAutopilot: () => void;
  onStartVoice: () => void;
}

const QUICK_COMMANDS = [
  "whoami",
  "trace opencalls",
  "redis-lua",
  "ls projects",
  "ping",
  "autopilot",
];

const COMMAND_NAMES = [
  "help",
  "whoami",
  "ls projects",
  "open opencalls",
  "open invoiceo",
  "open ruh-ai",
  "trace opencalls",
  "redis-lua",
  "articles",
  "ping",
  "autopilot",
  "voice",
  "clear",
  "exit",
];

const INITIAL_LINES: TerminalLine[] = [
  {
    id: "boot-1",
    kind: "accent",
    text: "SIGNAL ROOM DIAGNOSTIC SHELL v2.6 // ISTEKHAR KHAN",
  },
  {
    id: "boot-2",
    kind: "info",
    text: 'Type "help" or click any quick-command chip below. Press ESC to close.',
  },
];

export function SignalTerminal({
  open,
  onClose,
  onOpenProject,
  onStartAutopilot,
  onStartVoice,
}: SignalTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const appendLines = useCallback((entries: Omit<TerminalLine, "id">[]) => {
    const stamp = Date.now();
    setLines((prev) => [
      ...prev,
      ...entries.map((entry, idx) => ({ ...entry, id: `${stamp}-${idx}-${Math.random()}` })),
    ]);
  }, []);

  const executeCommand = useCallback(
    async (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;
      signalSound.playTick(740);
      setHistory((prev) => [cmd, ...prev.slice(0, 24)]);
      setHistoryIdx(-1);
      setInput("");

      appendLines([{ kind: "cmd", text: `$ ${cmd}` }]);
      const lower = cmd.toLowerCase();

      if (lower === "clear") {
        setLines(INITIAL_LINES);
        return;
      }

      if (lower === "exit" || lower === "quit") {
        onClose();
        return;
      }

      if (lower === "help") {
        appendLines([
          { kind: "accent", text: "AVAILABLE DIAGNOSTIC COMMANDS:" },
          { kind: "info", text: "  whoami               Verified profile, role, current R&D" },
          { kind: "info", text: "  ls projects          List shipped Voice AI & full-stack systems" },
          { kind: "info", text: "  open <project>       Project HUD (opencalls | invoiceo | ruh-ai)" },
          { kind: "info", text: "  trace opencalls      Live OpenTelemetry dual-plane call trace" },
          { kind: "info", text: "  redis-lua            Atomic Redis Lua idempotency script pattern" },
          { kind: "info", text: "  articles             Published Medium architecture deep-dives" },
          { kind: "info", text: "  ping                 Measure live /api/livekit/status RTT & audio Hz" },
          { kind: "info", text: "  autopilot            Launch 5-stop Auto-UI Pilot guided tour" },
          { kind: "info", text: "  voice                Connect directly to LiveKit Voice AI" },
          { kind: "info", text: "  clear / exit         Reset buffer or dismiss shell" },
        ]);
        return;
      }

      if (lower === "whoami") {
        appendLines([
          {
            kind: "mint",
            text: `${PORTFOLIO.person.name} · ${PORTFOLIO.person.role}`,
          },
          {
            kind: "info",
            text: `Current:  ${PORTFOLIO.person.currentHeadline} (${PORTFOLIO.person.location})`,
          },
          {
            kind: "info",
            text: `R&D:      ${PORTFOLIO.person.currentResearch}`,
          },
          {
            kind: "info",
            text: `Contact:  ${PORTFOLIO.person.email}`,
          },
          {
            kind: "info",
            text: `Stack:    LiveKit, ElevenLabs TTS, gRPC/Protobuf, Python, Next.js, NestJS, Redis/Lua, OpenTelemetry`,
          },
        ]);
        return;
      }

      if (lower === "ls projects" || lower === "projects") {
        appendLines([
          { kind: "accent", text: "SHIPPED & ACTIVE SYSTEMS:" },
          ...PORTFOLIO.projects.map((p) => ({
            kind: "info" as const,
            text: `  [${p.status.toUpperCase()}] ${p.id.padEnd(14)} ${p.name} ${p.liveUrl ? `-> ${p.liveUrl}` : ""}`,
          })),
          { kind: "mint", text: 'Tip: run "open opencalls" or "open invoiceo" to inspect in HUD.' },
        ]);
        return;
      }

      if (lower.startsWith("open ")) {
        const arg = lower.replace("open ", "").trim();
        if (arg === "opencalls") {
          onClose();
          onOpenProject("opencalls");
          return;
        }
        if (arg === "invoiceo") {
          onClose();
          onOpenProject("invoiceo");
          return;
        }
        if (arg === "ruh-ai" || arg === "ruh-ai-voice") {
          onClose();
          onOpenProject("ruh-ai-voice");
          return;
        }
        appendLines([
          { kind: "error", text: `Unknown project "${arg}". Try: opencalls, invoiceo, ruh-ai.` },
        ]);
        return;
      }

      if (lower === "trace opencalls" || lower === "trace") {
        appendLines([
          { kind: "accent", text: "OTEL TRACE // trace_id=9f3a8c12e4b0 // INBOUND SIP CALL" },
          { kind: "mint", text: "  000ms  [SIP TRUNK]       INVITE sip:+1-opencalls -> LiveKit SIP Ingress" },
          { kind: "info", text: "  024ms  [gRPC CALL SVC]   Resolve published agent snapshot v14 (Postgres)" },
          { kind: "info", text: "  039ms  [REDIS LUA]       Atomic rate-limit & concurrency slot acquired" },
          { kind: "mint", text: "  062ms  [LIVEKIT ROOM]    WebRTC SFU worker attached · Silero VAD armed" },
          { kind: "info", text: "  198ms  [DEEPGRAM STT]    Streaming partial -> final endpoint transcript" },
          { kind: "accent", text: "  385ms  [LLM + RAG]       First clause streamed (KB gRPC retrieval hit)" },
          { kind: "mint", text: "  490ms  [ELEVENLABS TTS]  First PCM audio frame delivered to caller" },
          { kind: "info", text: "  END    [PAYMENT SVC]     Usage event settled async via gRPC ledger" },
        ]);
        return;
      }

      if (lower === "redis-lua" || lower === "lua") {
        appendLines([
          {
            kind: "accent",
            text: "REDIS + LUA // ATOMIC IDEMPOTENCY LOCK (No DB Row Contention)",
          },
          { kind: "code", text: "local key = KEYS[1]" },
          { kind: "code", text: "local ttl = tonumber(ARGV[1])" },
          { kind: "code", text: 'if redis.call("EXISTS", key) == 1 then' },
          { kind: "code", text: "  return 0 -- duplicate batch worker prevented atomically" },
          { kind: "code", text: "end" },
          { kind: "code", text: 'redis.call("SET", key, "LOCKED", "EX", ttl)' },
          { kind: "code", text: "return 1" },
          {
            kind: "mint",
            text: "Published write-up: medium.com/@istekharkhan46 (Dec 2025)",
          },
        ]);
        return;
      }

      if (lower === "articles" || lower === "writing") {
        appendLines([
          { kind: "accent", text: "PUBLISHED ENGINEERING FIELD NOTES (MEDIUM):" },
          ...PORTFOLIO.articles.map((a, idx) => ({
            kind: "info" as const,
            text: `  0${idx + 1}. [${a.date}] ${a.title}`,
          })),
        ]);
        return;
      }

      if (lower === "ping") {
        const t0 = performance.now();
        try {
          const res = await fetch("/api/livekit/status", { cache: "no-store" });
          const rtt = Math.round(performance.now() - t0);
          const data = (await res.json()) as { configured?: boolean };
          let sampleRate = "unknown";
          try {
            const AC =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AC) {
              const ctx = new AC();
              sampleRate = `${ctx.sampleRate} Hz`;
              await ctx.close();
            }
          } catch {
            // ignore
          }
          appendLines([
            {
              kind: "mint",
              text: `PONG /api/livekit/status · ${res.status} OK · RTT ${rtt}ms`,
            },
            {
              kind: "info",
              text: `LiveKit Cloud Token Route: ${data.configured ? "CONFIGURED" : "STANDBY (local env)"}`,
            },
            {
              kind: "info",
              text: `Browser Audio Engine:      ${sampleRate} · WebRTC ${typeof RTCPeerConnection !== "undefined" ? "READY" : "UNAVAILABLE"}`,
            },
          ]);
        } catch {
          appendLines([{ kind: "error", text: "Failed to reach /api/livekit/status." }]);
        }
        return;
      }

      if (lower === "autopilot" || lower === "tour") {
        onClose();
        onStartAutopilot();
        return;
      }

      if (lower === "voice" || lower === "call") {
        onClose();
        onStartVoice();
        return;
      }

      appendLines([
        {
          kind: "error",
          text: `Command not found: "${cmd}". Type "help" for valid diagnostic commands.`,
        },
      ]);
    },
    [appendLines, onClose, onOpenProject, onStartAutopilot, onStartVoice]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-[#08090C]/78"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Signal Room diagnostic terminal"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="hud-frame pointer-events-auto relative w-full max-w-3xl bg-[#111318] border border-[#3B4252] flex flex-col max-h-[82vh] overflow-hidden shadow-[0_28px_72px_rgba(0,0,0,0.85)]"
            >
              {/* Title bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#2B303B] bg-[#161920]">
                <div className="flex items-center gap-2 font-mono text-xs text-[#EFF0F1]">
                  <Terminal className="w-4 h-4 text-[#38D9A9]" />
                  <span>SIGNAL SHELL // DIAGNOSTIC CONSOLE</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close diagnostic terminal"
                  className="px-2 py-1 border border-[#2B303B] bg-[#1A1D23] font-mono text-[11px] text-[#9499A3] hover:text-[#EFF0F1] inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>ESC</span>
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Quick command bar */}
              <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-[#2B303B] bg-[#13161C]">
                <span className="font-mono text-[10px] text-[#9499A3] mr-1">QUICK RUN:</span>
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => void executeCommand(cmd)}
                    className="hud-btn px-2 py-1 bg-[#1A1D23] border border-[#2B303B] font-mono text-[11px] text-[#C4C8D0] hover:text-[#38D9A9] hover:border-[#38D9A9] cursor-pointer"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              {/* Scrollable output buffer */}
              <div
                ref={scrollRef}
                onClick={() => inputRef.current?.focus()}
                className="flex-1 overflow-y-auto px-4 py-3.5 font-mono text-xs leading-relaxed space-y-1.5 min-h-[260px]"
              >
                {lines.map((line) => (
                  <div
                    key={line.id}
                    className={cn(
                      "whitespace-pre-wrap break-words",
                      line.kind === "cmd" && "text-[#EFF0F1] font-semibold pt-1",
                      line.kind === "accent" && "text-[#FF9F38]",
                      line.kind === "mint" && "text-[#38D9A9]",
                      line.kind === "code" && "text-[#C4C8D0] pl-3 border-l-2 border-[#38D9A9]/45",
                      line.kind === "error" && "text-[#FF5A1F]",
                      line.kind === "info" && "text-[#C4C8D0]"
                    )}
                  >
                    {line.text}
                  </div>
                ))}
              </div>

              {/* Prompt input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void executeCommand(input);
                }}
                className="flex items-center gap-2.5 px-4 py-3 border-t border-[#2B303B] bg-[#14171D]"
              >
                <span className="font-mono text-xs text-[#38D9A9] shrink-0">istekhar@signal:~$</span>
                <label htmlFor="signal-terminal-input" className="sr-only">
                  Enter diagnostic shell command
                </label>
                <input
                  ref={inputRef}
                  id="signal-terminal-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      const nextIdx = Math.min(history.length - 1, historyIdx + 1);
                      if (history[nextIdx]) {
                        setHistoryIdx(nextIdx);
                        setInput(history[nextIdx]);
                      }
                    } else if (e.key === "ArrowDown") {
                      e.preventDefault();
                      const nextIdx = historyIdx - 1;
                      if (nextIdx < 0) {
                        setHistoryIdx(-1);
                        setInput("");
                      } else if (history[nextIdx]) {
                        setHistoryIdx(nextIdx);
                        setInput(history[nextIdx]);
                      }
                    } else if (e.key === "Tab") {
                      e.preventDefault();
                      const q = input.trim().toLowerCase();
                      if (!q) return;
                      const match = COMMAND_NAMES.find((c) => c.startsWith(q));
                      if (match) setInput(match);
                    }
                  }}
                  placeholder='Type "help", "trace opencalls", "redis-lua", or "ping"...'
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent font-mono text-xs text-[#EFF0F1] placeholder:text-[#9499A3] focus:outline-none"
                />
                <button
                  type="submit"
                  className="hud-btn px-3 py-1.5 bg-[#38D9A9] text-[#121418] font-mono font-semibold text-[11px] hover:bg-[#4ee6b8] cursor-pointer"
                >
                  RUN
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
