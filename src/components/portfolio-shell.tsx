"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Command,
  Compass,
  Copy,
  FileText,
  Keyboard,
  Menu,
  Mic,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { AcousticIris } from "@/components/acoustic-iris";
import {
  AgentAutopilotCursor,
  AutopilotHudBar,
  type AutopilotStepMeta,
  type GhostCursorTarget,
} from "@/components/agent-autopilot-cursor";
import { AgentDock } from "@/components/agent-dock";
import { CommandPalette, type CommandItem } from "@/components/command-palette";
import { ExperienceTimeline } from "@/components/experience-timeline";
import { KineticCaptions, SignalScrollRail } from "@/components/kinetic-captions";
import { ProjectsSection } from "@/components/projects-section";
import { SignalTerminal } from "@/components/signal-terminal";
import { StackSignalMatrix } from "@/components/stack-signal-matrix";
import { StagePanel, type ActivePanelState } from "@/components/stage-panel";
import { VoiceLab } from "@/components/voice-lab";
import { WritingSection } from "@/components/writing-section";
import { PORTFOLIO, type VoiceTopicId } from "@/data/portfolio";
import { useLiveKitAgent } from "@/hooks/use-livekit-agent";
import { signalSound } from "@/lib/signal-sound";
import {
  AGENT_PERSONAS,
  AGENT_VOICES,
  type AgentPersonaId,
  type AgentVoiceKey,
  type ArticleId,
  type HighlightTarget,
  type ProjectId,
  type ProjectTab,
  type RoleId,
  type UiAction,
} from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

type NavId = "about" | "voice-lab" | "projects" | "writing" | "experience" | "stack" | "contact";

const NAV_LINKS: { id: NavId; label: string }[] = [
  { id: "voice-lab", label: "Voice Lab" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "writing", label: "Writing" },
  { id: "experience", label: "Experience" },
  { id: "stack", label: "Stack" },
  { id: "contact", label: "Contact" },
];

export function PortfolioShell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const signalBeamRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [activeNav, setActiveNav] = useState<NavId>("about");
  const [activeSectionId, setActiveSectionId] = useState<string>("hero");
  const [hudNotice, setHudNotice] = useState<string | null>(null);
  const [ghostTarget, setGhostTarget] = useState<GhostCursorTarget | null>(null);
  const [autopilotIndex, setAutopilotIndex] = useState<number | null>(null);
  const [autopilotPaused, setAutopilotPaused] = useState(false);
  const [dockVisible, setDockVisible] = useState(false);
  const [textInputOpen, setTextInputOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<AgentPersonaId>("representative");
  const [selectedVoiceKey, setSelectedVoiceKey] = useState<AgentVoiceKey>("sarah");
  const [activePanel, setActivePanel] = useState<ActivePanelState>(null);
  const [selectedTopic, setSelectedTopic] = useState<VoiceTopicId>("stt");
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>("opencalls");
  const [highlightedTarget, setHighlightedTarget] = useState<HighlightTarget | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const highlightTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const ghostTimerRef = useRef<number | null>(null);
  const autopilotTimerRef = useRef<number | null>(null);
  const autopilotSubTimersRef = useRef<number[]>([]);
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);
  const startAutopilotRef = useRef<((startAt?: number) => void) | null>(null);

  const clearAutopilotSubTimers = useCallback(() => {
    for (const id of autopilotSubTimersRef.current) {
      window.clearTimeout(id);
    }
    autopilotSubTimersRef.current = [];
  }, []);

  const scheduleAutopilotSub = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      autopilotSubTimersRef.current = autopilotSubTimersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    autopilotSubTimersRef.current.push(id);
  }, []);

  const showHudNotice = useCallback((msg: string) => {
    setHudNotice(msg);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setHudNotice(null), 1800);
  }, []);

  const aimGhostCursor = useCallback(
    (targetEl: Element | null, label: string, durationMs = 1700) => {
      if (typeof window === "undefined") return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let x = vw * 0.5;
      let y = vh * 0.42;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          x = Math.max(72, Math.min(vw - 140, rect.left + rect.width * 0.5));
          y = Math.max(96, Math.min(vh - 120, rect.top + Math.min(rect.height * 0.35, 160)));
        }
      }
      signalSound.playTick(780);
      setGhostTarget({ x, y, label, pulseKey: Date.now() });
      if (ghostTimerRef.current) window.clearTimeout(ghostTimerRef.current);
      ghostTimerRef.current = window.setTimeout(() => setGhostTarget(null), durationMs);
    },
    []
  );

  const triggerHighlight = useCallback((target: HighlightTarget) => {
    setHighlightedTarget(target);
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedTarget(null);
    }, 3200);
  }, []);

  const flashSignalBeam = useCallback(() => {
    if (!signalBeamRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      signalBeamRef.current,
      { scaleX: 0, opacity: 0.95, transformOrigin: "left center" },
      {
        scaleX: 1,
        opacity: 0,
        duration: 0.52,
        ease: "power4.out",
      }
    );
  }, []);

  // Structured UI action executor called via validated LiveKit RPC (`ui.action`)
  const executeUiAction = useCallback(
    async (action: UiAction): Promise<{ ok: boolean; detail?: string }> => {
      flashSignalBeam();
      switch (action.name) {
        case "navigate_to_section": {
          const el = document.getElementById(action.args.section);
          if (!el) return { ok: false, detail: `Section ${action.args.section} not found` };
          if (action.args.section !== "hero") {
            setActiveNav(action.args.section);
          }
          setActiveSectionId(action.args.section);
          showHudNotice(`HUD // TARGET LOCKED → ${action.args.section.toUpperCase()}`);
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          window.setTimeout(() => aimGhostCursor(el, `LOCK ${action.args.section.toUpperCase()}`), 260);
          return { ok: true };
        }
        case "open_project": {
          setActiveNav("projects");
          const el = document.getElementById("projects");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          triggerHighlight(action.args.projectId);
          aimGhostCursor(el, `OPEN ${action.args.projectId.toUpperCase()}`);
          showHudNotice(`HUD // PROJECTING ${action.args.projectId.toUpperCase()}`);
          setActivePanel({
            kind: "project",
            projectId: action.args.projectId,
            tab: action.args.tab ?? "overview",
          });
          return { ok: true };
        }
        case "show_architecture": {
          setActiveNav("projects");
          const el = document.getElementById("projects");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          triggerHighlight(action.args.projectId);
          aimGhostCursor(el, `ARCH ${action.args.projectId.toUpperCase()}`);
          showHudNotice(`HUD // ARCHITECTURE · ${action.args.projectId.toUpperCase()}`);
          setActivePanel({
            kind: "project",
            projectId: action.args.projectId,
            tab: "architecture",
          });
          return { ok: true };
        }
        case "open_writing_panel": {
          setActiveNav("writing");
          const articleId: ArticleId = action.args.articleId ?? "inside-opencalls";
          triggerHighlight("writing-notes");
          showHudNotice(`HUD // WRITING · ${articleId.toUpperCase()}`);
          const el = document.getElementById("writing");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          aimGhostCursor(el, `WRITING · ${articleId.toUpperCase()}`);
          setActivePanel({ kind: "writing", articleId });
          return { ok: true };
        }
        case "open_experience_panel": {
          setActiveNav("experience");
          const targetRole = action.args.roleId ?? selectedRoleId;
          setSelectedRoleId(targetRole);
          triggerHighlight("experience-current");
          showHudNotice(`HUD // TIMELINE · ${targetRole.toUpperCase()}`);
          const el = document.getElementById("experience");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          aimGhostCursor(el, `TIMELINE · ${targetRole.toUpperCase()}`);
          setActivePanel({ kind: "experience", roleId: targetRole });
          return { ok: true };
        }
        case "open_skill_explorer": {
          setActiveNav("voice-lab");
          const nextTopic = action.args.topic ?? "pipeline";
          setSelectedTopic(nextTopic);
          triggerHighlight("voice-pipeline");
          showHudNotice(`HUD // VOICE LAB · ${nextTopic.toUpperCase()}`);
          const el = document.getElementById("voice-lab");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          aimGhostCursor(el, `VOICE LAB · ${nextTopic.toUpperCase()}`);
          setActivePanel({ kind: "skills", topic: nextTopic });
          return { ok: true };
        }
        case "open_contact_panel": {
          setActiveNav("contact");
          triggerHighlight("contact-email");
          showHudNotice("HUD // DIRECT COMMS OPEN");
          aimGhostCursor(document.getElementById("contact"), "DIRECT COMMS");
          setActivePanel({ kind: "contact" });
          return { ok: true };
        }
        case "highlight_content": {
          triggerHighlight(action.args.targetId);
          showHudNotice(`HUD // LOCK → ${action.args.targetId.toUpperCase()}`);
          return { ok: true };
        }
        case "close_active_panel": {
          setActivePanel(null);
          showHudNotice("HUD // PROJECTION DISMISSED");
          return { ok: true };
        }
        case "start_autopilot_tour": {
          startAutopilotRef.current?.(action.args.startStep ?? 0);
          return { ok: true };
        }
        case "end_voice_session": {
          setAutopilotIndex(null);
          setGhostTarget(null);
          setActivePanel(null);
          setHighlightedTarget(null);
          setActiveNav("about");
          setActiveSectionId("hero");
          showHudNotice("HUD // SESSION COMPLETE · RETURNING TO HERO");
          window.scrollTo({ top: 0, behavior: "smooth" });
          // Disconnect after returning RPC ack so LiveKit worker receives clean confirmation
          window.setTimeout(() => {
            disconnectRef.current?.().catch(() => {});
            setDockVisible(false);
            setTextInputOpen(false);
          }, 450);
          return { ok: true };
        }
      }
    },
    [aimGhostCursor, flashSignalBeam, selectedRoleId, showHudNotice, triggerHighlight]
  );

  const livekit = useLiveKitAgent({ onUiAction: executeUiAction });
  disconnectRef.current = livekit.disconnect;

  useEffect(() => {
    if (livekit.micPermissionError) {
      setTextInputOpen(true);
    }
  }, [livekit.micPermissionError]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
      if (ghostTimerRef.current) window.clearTimeout(ghostTimerRef.current);
      if (autopilotTimerRef.current) window.clearTimeout(autopilotTimerRef.current);
      clearAutopilotSubTimers();
    };
  }, [clearAutopilotSubTimers]);

  const AUTOPILOT_STOPS = useMemo<
    {
      title: string;
      narration: string;
      durationMs: number;
      execute: () => void;
    }[]
  >(
    () => [
      {
        title: "VOICE LAB · A CALL UNDER PRESSURE",
        narration:
          "Run a browser model of a voice turn. Publish a prompt mid-call, interrupt the output, or redeliver an event to explore the system's guarantees.",
        durationMs: 5200,
        execute: () => {
          setActivePanel(null);
          setActiveNav("voice-lab");
          setActiveSectionId("voice-lab");
          setSelectedTopic("vad");
          triggerHighlight("voice-pipeline");
          const el = document.getElementById("voice-lab");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          scheduleAutopilotSub(() => {
            const simBtn = document.querySelector<HTMLButtonElement>("#voice-lab [data-start-call]");
            aimGhostCursor(simBtn ?? el, "START A MODELLED VOICE TURN", 2200);
            scheduleAutopilotSub(() => simBtn?.click(), 380);
          }, 460);
        },
      },
      {
        title: "OPENCALLS · DUAL-PLANE TOPOLOGY",
        narration:
          "OpenCalls splits durable protobuf gRPC control services (Auth, Call, Knowledge-Base, Payment) from real-time LiveKit voice execution rooms.",
        durationMs: 5400,
        execute: () => {
          setActivePanel(null);
          setActiveNav("projects");
          setActiveSectionId("projects");
          triggerHighlight("opencalls");
          const el = document.getElementById("projects");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          scheduleAutopilotSub(() => {
            const traceBtn = Array.from(document.querySelectorAll("#projects button")).find((b) =>
              b.textContent?.includes("Trace Inbound Call")
            ) as HTMLButtonElement | undefined;
            aimGhostCursor(traceBtn ?? el, "TRACE gRPC + LIVEKIT CALL", 2400);
            scheduleAutopilotSub(() => traceBtn?.click(), 380);
          }, 460);
        },
      },
      {
        title: "WRITING · INSIDE OPENCALLS",
        narration:
          "Published architecture field notes on Medium covering OpenCalls microservices, OpenTelemetry/SigNoz tracing, Celery + RabbitMQ scaling, and Redis Lua idempotency.",
        durationMs: 4800,
        execute: () => {
          setActiveNav("writing");
          setActiveSectionId("writing");
          triggerHighlight("writing-notes");
          const el = document.getElementById("writing");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          scheduleAutopilotSub(() => {
            const briefBtn = Array.from(document.querySelectorAll("#writing button")).find((b) =>
              b.textContent?.includes("Open briefing HUD")
            ) as HTMLButtonElement | undefined;
            aimGhostCursor(briefBtn ?? el, "OPEN BRIEFING HUD", 2000);
          }, 460);
        },
      },
      {
        title: "EXPERIENCE · MULTITRACK DAW",
        narration:
          "Scrubbing Istekhar's engineering timeline from Founding Engineer at RUH AI to Founder at OpenCalls and invoiceo.",
        durationMs: 4800,
        execute: () => {
          setActivePanel(null);
          setActiveNav("experience");
          setActiveSectionId("experience");
          setSelectedRoleId("ruh-ai");
          triggerHighlight("experience-current");
          const el = document.getElementById("experience");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          scheduleAutopilotSub(() => {
            aimGhostCursor(el, "SCRUB TIMELINE → OPENCALLS", 2200);
            scheduleAutopilotSub(() => setSelectedRoleId("opencalls"), 1100);
          }, 460);
        },
      },
      {
        title: "DIRECT COMMS · READY TO TALK",
        narration:
          "Reach Istekhar directly at istekharkhan46@gmail.com, inspect his resume, or click Talk to my AI to start a live WebRTC conversation.",
        durationMs: 4400,
        execute: () => {
          setActivePanel(null);
          setActiveNav("contact");
          setActiveSectionId("contact");
          triggerHighlight("contact-email");
          const el = document.getElementById("contact");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          scheduleAutopilotSub(() => {
            const emailLink = el?.querySelector('a[href^="mailto:"]') ?? el;
            aimGhostCursor(emailLink, "DIRECT COMMS LOCKED", 2400);
          }, 460);
        },
      },
    ],
    [aimGhostCursor, scheduleAutopilotSub, triggerHighlight]
  );

  const stopAutopilotTour = useCallback(() => {
    if (autopilotTimerRef.current) {
      window.clearTimeout(autopilotTimerRef.current);
      autopilotTimerRef.current = null;
    }
    if (ghostTimerRef.current) {
      window.clearTimeout(ghostTimerRef.current);
      ghostTimerRef.current = null;
    }
    clearAutopilotSubTimers();
    setAutopilotIndex(null);
    setAutopilotPaused(false);
    setGhostTarget(null);
    showHudNotice("AUTOPILOT // MANUAL CONTROL RESTORED");
  }, [clearAutopilotSubTimers, showHudNotice]);

  const startAutopilotTour = useCallback(
    (startAt = 0) => {
      if (autopilotTimerRef.current) window.clearTimeout(autopilotTimerRef.current);
      clearAutopilotSubTimers();
      setActivePanel(null);
      setMobileMenuOpen(false);
      setAutopilotPaused(false);
      setAutopilotIndex(Math.max(0, Math.min(AUTOPILOT_STOPS.length - 1, startAt)));
      signalSound.playHudOpen();
    },
    [AUTOPILOT_STOPS.length, clearAutopilotSubTimers]
  );
  startAutopilotRef.current = startAutopilotTour;

  // Execute current autopilot stop only when step index changes
  useEffect(() => {
    if (autopilotIndex === null) return;
    const stop = AUTOPILOT_STOPS[autopilotIndex];
    if (!stop) {
      setAutopilotIndex(null);
      return;
    }
    clearAutopilotSubTimers();
    stop.execute();
    return () => {
      clearAutopilotSubTimers();
    };
  }, [AUTOPILOT_STOPS, autopilotIndex, clearAutopilotSubTimers]);

  // Schedule auto-advance timer separately so pausing/resuming never re-executes the current stop
  useEffect(() => {
    if (autopilotIndex === null || autopilotPaused) return;
    const stop = AUTOPILOT_STOPS[autopilotIndex];
    if (!stop) return;

    autopilotTimerRef.current = window.setTimeout(() => {
      if (autopilotIndex + 1 < AUTOPILOT_STOPS.length) {
        setAutopilotIndex(autopilotIndex + 1);
      } else {
        setAutopilotIndex(null);
        setGhostTarget(null);
        showHudNotice("AUTOPILOT // TOUR COMPLETE");
      }
    }, stop.durationMs);

    return () => {
      if (autopilotTimerRef.current) {
        window.clearTimeout(autopilotTimerRef.current);
        autopilotTimerRef.current = null;
      }
    };
  }, [AUTOPILOT_STOPS, autopilotIndex, autopilotPaused, showHudNotice]);

  const autopilotStepMeta: AutopilotStepMeta | null =
    autopilotIndex !== null && AUTOPILOT_STOPS[autopilotIndex]
      ? {
          index: autopilotIndex,
          total: AUTOPILOT_STOPS.length,
          title: AUTOPILOT_STOPS[autopilotIndex].title,
          narration: AUTOPILOT_STOPS[autopilotIndex].narration,
        }
      : null;

  // Scroll spy: keep top HUD reticle & right hardware fader rail synced with visible section
  useEffect(() => {
    const ids = ["hero", ...NAV_LINKS.map((l) => l.id)];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topId = visible[0]?.target.id;
        if (topId) {
          setActiveSectionId(topId);
          if (topId !== "hero") {
            setActiveNav(topId as NavId);
          }
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Global Cmd+K / Ctrl+K shortcut, backtick (`) Signal Shell, & Escape to exit Autopilot
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setTerminalOpen(false);
        setPaletteOpen((v) => !v);
      } else if (!inEditable && !e.metaKey && !e.ctrlKey && !e.altKey && e.key === "`") {
        e.preventDefault();
        setPaletteOpen(false);
        setTerminalOpen((v) => !v);
      } else if (e.key === "Escape" && autopilotIndex !== null) {
        e.preventDefault();
        stopAutopilotTour();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [autopilotIndex, stopAutopilotTour]);

  // Line-by-line word-mask hero entrance (once on load)
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".hero-line", {
        yPercent: 105,
        duration: 0.72,
        stagger: 0.08,
        ease: "power4.out",
        clearProps: "transform",
      });
      gsap.from(".hero-reveal", {
        y: 14,
        opacity: 0,
        duration: 0.56,
        stagger: 0.06,
        delay: 0.22,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    },
    { scope: rootRef }
  );

  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => {
      const next = !prev;
      signalSound.setEnabled(next);
      try {
        window.localStorage.setItem("signal-room-sfx", next ? "1" : "0");
      } catch {
        // Ignore storage errors
      }
      showHudNotice(next ? "HUD // ACOUSTIC SFX ENABLED" : "HUD // ACOUSTIC SFX MUTED");
      return next;
    });
  }, [showHudNotice]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem("signal-room-sfx") === "1") {
        setSfxEnabled(true);
        signalSound.setEnabled(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSelectPersona = useCallback(
    async (persona: AgentPersonaId) => {
      signalSound.playTick(700);
      setSelectedPersona(persona);
      const meta = AGENT_PERSONAS.find((p) => p.id === persona);
      showHudNotice(`AGENT MODE // ${meta?.badge ?? persona.toUpperCase()}`);
      if (livekit.connected) {
        await livekit.disconnect();
        await livekit.connect({
          enableMic: livekit.micEnabled,
          persona,
          voiceKey: selectedVoiceKey,
        });
      }
    },
    [livekit, selectedVoiceKey, showHudNotice]
  );

  const handleSelectVoice = useCallback(
    async (voiceKey: AgentVoiceKey) => {
      signalSound.playTick(760);
      setSelectedVoiceKey(voiceKey);
      const meta = AGENT_VOICES.find((v) => v.key === voiceKey);
      showHudNotice(`ELEVENLABS VOICE // ${(meta?.label ?? voiceKey).toUpperCase()}`);
      if (livekit.connected) {
        await livekit.disconnect();
        await livekit.connect({
          enableMic: livekit.micEnabled,
          persona: selectedPersona,
          voiceKey,
        });
      }
    },
    [livekit, selectedPersona, showHudNotice]
  );

  const handleNavClick = useCallback(
    (id: NavId, openPopup = true) => {
      setActiveNav(id);
      setMobileMenuOpen(false);
      if (openPopup && id !== "stack") {
        flashSignalBeam();
        signalSound.playHudOpen();
      } else {
        signalSound.playTick(620);
      }
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });

      if (!openPopup) {
        setActivePanel(null);
        return;
      }

      switch (id) {
        case "about":
          showHudNotice("HUD // PROFILE · ISTEKHAR KHAN");
          setActivePanel({ kind: "about" });
          break;
        case "voice-lab":
          showHudNotice("HUD // VOICE ENGINEERING LAB");
          triggerHighlight("voice-pipeline");
          setActivePanel({ kind: "skills", topic: selectedTopic });
          break;
        case "projects":
          showHudNotice("HUD // FLAGSHIP · OPENCALLS");
          triggerHighlight("opencalls");
          setActivePanel({ kind: "project", projectId: "opencalls", tab: "overview" });
          break;
        case "writing":
          showHudNotice("HUD // ENGINEERING WRITING");
          triggerHighlight("writing-notes");
          setActivePanel({ kind: "writing", articleId: "inside-opencalls" });
          break;
        case "experience":
          showHudNotice("HUD // MULTITRACK TIMELINE");
          triggerHighlight("experience-current");
          setActivePanel({ kind: "experience", roleId: selectedRoleId });
          break;
        case "stack":
          showHudNotice("HUD // TECHNICAL STACK");
          setActivePanel(null);
          break;
        case "contact":
          showHudNotice("HUD // DIRECT COMMS");
          triggerHighlight("contact-email");
          setActivePanel({ kind: "contact" });
          break;
      }
    },
    [flashSignalBeam, selectedRoleId, selectedTopic, showHudNotice, triggerHighlight]
  );

  const handleStartVoice = useCallback(async () => {
    setDockVisible(true);
    signalSound.playVoiceLink(true);
    const meta = AGENT_PERSONAS.find((p) => p.id === selectedPersona);
    showHudNotice(`J.A.R.V.I.S. LINK // ${meta?.badge ?? "LIVEKIT"}`);
    await livekit.connect({
      enableMic: true,
      persona: selectedPersona,
      voiceKey: selectedVoiceKey,
    });
  }, [livekit, selectedPersona, selectedVoiceKey, showHudNotice]);

  const handleOpenTextMode = useCallback(async () => {
    setDockVisible(true);
    setTextInputOpen(true);
    signalSound.playTick(680);
    if (livekit.serverConfigured) {
      await livekit.connect({
        enableMic: false,
        persona: selectedPersona,
        voiceKey: selectedVoiceKey,
      });
    }
  }, [livekit, selectedPersona, selectedVoiceKey]);

  const handleAskAbout = useCallback(
    async (prompt: string) => {
      setActivePanel(null);
      setDockVisible(true);
      setTextInputOpen(true);
      signalSound.playTick(740);
      showHudNotice("HUD // ROUTING QUERY TO LIVEKIT AGENT");
      if (!livekit.connected && livekit.serverConfigured) {
        await livekit.connect({
          enableMic: false,
          persona: selectedPersona,
          voiceKey: selectedVoiceKey,
        });
      }
      await livekit.sendTextMessage(prompt);
    },
    [livekit, selectedPersona, selectedVoiceKey, showHudNotice]
  );

  const handleClosePanel = () => {
    const closingName = activePanel?.kind ?? "none";
    signalSound.playHudClose();
    setActivePanel(null);
    livekit.notifyPanelClosed(closingName);
  };

  const handleOpenProject = useCallback(
    (projectId: ProjectId, tab: ProjectTab = "overview") => {
      flashSignalBeam();
      signalSound.playHudOpen();
      showHudNotice(`HUD // PROJECTING ${projectId.toUpperCase()}`);
      setActivePanel({ kind: "project", projectId, tab });
    },
    [flashSignalBeam, showHudNotice]
  );

  const handleOpenArticle = useCallback(
    (articleId: ArticleId) => {
      flashSignalBeam();
      signalSound.playHudOpen();
      showHudNotice(`HUD // BRIEFING · ${articleId.toUpperCase()}`);
      setActivePanel({ kind: "writing", articleId });
    },
    [flashSignalBeam, showHudNotice]
  );

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO.person.email);
      setCopiedEmail(true);
      showHudNotice("HUD // EMAIL COPIED TO CLIPBOARD");
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Clipboard blocked
    }
  }, [showHudNotice]);

  const commandItems = useMemo<CommandItem[]>(() => {
    const quick: CommandItem[] = [
      {
        id: "cmd-autopilot",
        group: "Voice & Quick Actions",
        label: "Launch Auto-UI Pilot Guided Tour",
        hint: "5 stops",
        keywords: "autopilot tour guided walkthrough demo cursor beam",
        icon: "radio",
        run: () => startAutopilotTour(0),
      },
      {
        id: "cmd-terminal",
        group: "Voice & Quick Actions",
        label: "Open Signal Shell Diagnostic Console",
        hint: "Press `",
        keywords: "terminal cli shell console trace redis lua ping diagnostics",
        icon: "terminal",
        run: () => {
          signalSound.playHudOpen();
          setTerminalOpen(true);
        },
      },
      {
        id: "cmd-voice",
        group: "Voice & Quick Actions",
        label: "Talk to Istekhar's LiveKit Voice AI",
        hint: "WebRTC",
        keywords: "voice talk mic agent jarvis livekit",
        icon: "mic",
        run: () => {
          void handleStartVoice();
        },
      },
      {
        id: "cmd-text",
        group: "Voice & Quick Actions",
        label: "Ask AI representative via text",
        hint: "Chat",
        keywords: "type text chat message prompt",
        icon: "terminal",
        run: () => {
          void handleOpenTextMode();
        },
      },
      {
        id: "cmd-sfx",
        group: "Voice & Quick Actions",
        label: sfxEnabled ? "Mute HUD Sound Effects (SFX)" : "Enable HUD Sound Effects (SFX)",
        hint: sfxEnabled ? "ON" : "OFF",
        keywords: "sound audio sfx mute unmute synth chime",
        icon: "radio",
        run: () => toggleSfx(),
      },
      {
        id: "cmd-opencalls-demo",
        group: "Voice & Quick Actions",
        label: "Switch AI to OpenCalls Live Receptionist Demo",
        hint: "Persona",
        keywords: "opencalls demo receptionist persona voice test",
        icon: "mic",
        run: () => {
          void handleSelectPersona("opencalls-demo");
        },
      },
      {
        id: "cmd-architect-mode",
        group: "Voice & Quick Actions",
        label: "Switch AI to Systems Architect Interview Mode",
        hint: "Persona",
        keywords: "architect interview grpc latency redis persona",
        icon: "terminal",
        run: () => {
          void handleSelectPersona("architect");
        },
      },
      {
        id: "cmd-copy-email",
        group: "Voice & Quick Actions",
        label: `Copy email (${PORTFOLIO.person.email})`,
        hint: "Clipboard",
        keywords: "email contact mail copy hire",
        icon: "copy",
        run: () => {
          void copyEmail();
        },
      },
      {
        id: "cmd-resume",
        group: "Voice & Quick Actions",
        label: "Open Resume (PDF)",
        hint: "Drive",
        keywords: "resume cv pdf download experience",
        icon: "file",
        run: () => window.open(PORTFOLIO.person.resumeUrl, "_blank", "noopener,noreferrer"),
      },
    ];

    const projectItems: CommandItem[] = [
      {
        id: "cmd-opencalls-arch",
        group: "Projects",
        label: "OpenCalls — Control Plane & LiveKit Architecture",
        hint: "Flagship",
        keywords: "opencalls architecture grpc livekit sip webrtc telephony",
        icon: "layers",
        run: () => handleOpenProject("opencalls", "architecture"),
      },
      ...PORTFOLIO.projects.map((p) => ({
        id: `cmd-proj-${p.id}`,
        group: "Projects" as const,
        label: `${p.name} — ${p.category}`,
        hint: p.year,
        keywords: `${p.name} ${p.stack.join(" ")} ${p.tagline}`,
        icon: "layers" as const,
        run: () => handleOpenProject(p.id, "overview"),
      })),
    ];

    const writingItems: CommandItem[] = PORTFOLIO.articles.map((a) => ({
      id: `cmd-art-${a.id}`,
      group: "Engineering Writing",
      label: a.title,
      hint: a.date,
      keywords: `${a.title} ${a.tags.join(" ")} ${a.category} medium blog article`,
      icon: "book",
      run: () => handleOpenArticle(a.id),
    }));

    const sectionItems: CommandItem[] = NAV_LINKS.map((nav) => ({
      id: `cmd-sec-${nav.id}`,
      group: "Sections",
      label: `Jump to ${nav.label}`,
      hint: `#${nav.id}`,
      keywords: `section scroll ${nav.label} ${nav.id}`,
      icon: nav.id === "voice-lab" ? "radio" : nav.id === "experience" ? "briefcase" : "code",
      run: () => handleNavClick(nav.id, false),
    }));

    const externalItems: CommandItem[] = [
      {
        id: "cmd-opencalls-live",
        group: "External Links",
        label: "OpenCalls Live — opencallsai.com",
        hint: "Product",
        keywords: "opencalls website live app voice ai product",
        icon: "external",
        run: () => window.open("https://www.opencallsai.com", "_blank", "noopener,noreferrer"),
      },
      {
        id: "cmd-invoiceo-live",
        group: "External Links",
        label: "invoiceo Live — invoiceo.site",
        hint: "Product",
        keywords: "invoiceo website live app invoicing billing product",
        icon: "external",
        run: () => window.open("https://www.invoiceo.site", "_blank", "noopener,noreferrer"),
      },
      {
        id: "cmd-github",
        group: "External Links",
        label: "GitHub — github.com/istekhar46",
        hint: "70 repos",
        keywords: "github code open source repos",
        icon: "external",
        run: () => window.open(PORTFOLIO.person.github, "_blank", "noopener,noreferrer"),
      },
      {
        id: "cmd-linkedin",
        group: "External Links",
        label: "LinkedIn — linkedin.com/in/istekhar46",
        hint: "Profile",
        keywords: "linkedin network profile",
        icon: "external",
        run: () => window.open(PORTFOLIO.person.linkedin, "_blank", "noopener,noreferrer"),
      },
      {
        id: "cmd-medium",
        group: "External Links",
        label: "Medium — @istekharkhan46",
        hint: "Articles",
        keywords: "medium blog writing posts",
        icon: "external",
        run: () => window.open(PORTFOLIO.person.medium, "_blank", "noopener,noreferrer"),
      },
      {
        id: "cmd-x",
        group: "External Links",
        label: "X / Twitter — @istekharkhan46",
        hint: "Social",
        keywords: "twitter x social",
        icon: "external",
        run: () => window.open(PORTFOLIO.person.twitter, "_blank", "noopener,noreferrer"),
      },
    ];

    return [...quick, ...projectItems, ...writingItems, ...sectionItems, ...externalItems];
  }, [
    copyEmail,
    handleNavClick,
    handleOpenArticle,
    handleOpenProject,
    handleOpenTextMode,
    handleSelectPersona,
    handleStartVoice,
    sfxEnabled,
    startAutopilotTour,
    toggleSfx,
  ]);

  const statusText =
    livekit.serverConfigured === null
      ? "CHECKING AGENT"
      : livekit.connected
        ? "SESSION LIVE"
        : livekit.serverConfigured
          ? "AGENT ONLINE"
          : "BROWSE MODE";

  const statusLive = livekit.connected || livekit.serverConfigured === true;

  return (
    <div ref={rootRef} className="min-h-screen bg-[#121418] text-[#EFF0F1] relative">
      {/* Accessible skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-[60] focus:px-4 focus:py-2.5 focus:bg-[#FF5A1F] focus:text-[#121418] focus:font-semibold focus:text-sm"
      >
        Skip to content
      </a>

      {/* Hidden audio attachment container for LiveKit remote voice tracks */}
      <div ref={livekit.audioContainerRef} className="sr-only" aria-hidden="true" />

      {/* Top 2px Safety Orange signal bar */}
      <div className="h-[2px] w-full bg-[#FF5A1F]" aria-hidden="true" />

      {/* Holographic signal beam flashed on HUD popup / RPC execution */}
      <div
        ref={signalBeamRef}
        aria-hidden="true"
        className="pointer-events-none fixed bottom-24 left-12 right-0 h-[2px] bg-[#FF9F38] z-50 opacity-0"
      />

      {/* Stark HUD floating telemetry lock-on banner */}
      <AnimatePresence>
        {hudNotice && (
          <motion.div
            key={hudNotice}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.96 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 bg-[#161920]/95 border border-[#FF9F38]/60 font-mono text-xs text-[#FF9F38] tracking-wider shadow-[0_8px_28px_rgba(0,0,0,0.6)]"
          >
            {hudNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top broadcast HUD navigation bar with sliding targeting reticle */}
      <header className="sticky top-0 z-30 bg-[#121418]/95 border-b border-[#2B303B]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between gap-4">
          <a
            href="#hero"
            onClick={() => setActivePanel(null)}
            className="inline-flex items-center gap-3 min-h-11 text-[#EFF0F1] hover:text-[#FF9F38] transition-colors shrink-0"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <polygon
                points="12,2 21,7 21,17 12,22 3,17 3,7"
                stroke="#EFF0F1"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="12" r="3" fill="#FF5A1F" />
            </svg>
            <span className="font-semibold tracking-[0.06em] text-sm">
              {PORTFOLIO.person.brandMark}
            </span>
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-1 text-sm"
          >
            {NAV_LINKS.map((link) => {
              const active = activeSectionId !== "hero" && activeNav === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  aria-current={active ? "location" : undefined}
                  onClick={() => handleNavClick(link.id, false)}
                  className={cn(
                    "relative px-3 py-1.5 transition-colors cursor-pointer",
                    active ? "text-[#EFF0F1]" : "text-[#C4C8D0] hover:text-[#EFF0F1]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-hud-reticle"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 border border-[#FF9F38]/55 bg-[#FF9F38]/8 pointer-events-none"
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                signalSound.playHudOpen();
                setPaletteOpen(true);
              }}
              aria-label="Open command launcher"
              className="hud-btn hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
              title="Quick command launcher (⌘K / Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-[#FF9F38]" />
              <span>K</span>
            </button>

            <button
              type="button"
              onClick={() => livekit.serverConfigured ? setDockVisible((v) => !v) : handleNavClick("voice-lab", false)}
              title={livekit.serverConfigured ? "Open voice controls" : "Live voice unavailable. Explore the interactive call lab."}
              className="hud-btn inline-flex items-center gap-2 min-h-10 px-3 py-2 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  statusLive ? "bg-[#38D9A9]" : "bg-[#9499A3]"
                )}
              />
              <span>{statusText}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-w-11 min-h-11 grid place-items-center border border-[#2B303B] bg-[#1A1D23] text-[#EFF0F1] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                key="mobile-nav-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
                className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-30 bg-[#08090C]/65"
              />
              <motion.nav
                key="mobile-nav-drawer"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.16 }}
                aria-label="Mobile navigation"
                className="lg:hidden absolute top-full left-0 right-0 z-40 border-b border-[#3B4252] bg-[#14171D]/98 backdrop-blur-md px-6 py-4 flex flex-col gap-2 text-sm shadow-[0_24px_48px_rgba(0,0,0,0.75)]"
              >
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => handleNavClick(link.id, false)}
                    className={cn(
                      "text-left py-1.5 cursor-pointer transition-colors",
                      activeNav === link.id
                        ? "text-[#FF9F38] font-medium"
                        : "text-[#C4C8D0] hover:text-[#EFF0F1]"
                    )}
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-2.5 mt-1 border-t border-[#2B303B] flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signalSound.playHudOpen();
                        setPaletteOpen(true);
                      }}
                      className="text-left font-mono text-xs text-[#FF9F38] cursor-pointer"
                    >
                      ⌘K Launcher
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signalSound.playHudOpen();
                        setTerminalOpen(true);
                      }}
                      className="text-left font-mono text-xs text-[#38D9A9] cursor-pointer"
                    >
                      &gt;_ Signal CLI
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSfx}
                    aria-pressed={sfxEnabled}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 border font-mono text-xs cursor-pointer",
                      sfxEnabled
                        ? "border-[#38D9A9]/60 text-[#38D9A9] bg-[#38D9A9]/12"
                        : "border-[#2B303B] text-[#9499A3]"
                    )}
                  >
                    {sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>SFX</span>
                  </button>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
      </header>

      <main id="main-content" className={dockVisible ? "pb-44" : "pb-16"}>
        {/* HERO — First Viewport with J.A.R.V.I.S. 3D Core */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative max-w-7xl mx-auto px-6 md:px-10 pt-8 pb-14 sm:pt-12 md:pt-16 md:pb-20"
        >
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-center">
            {/* Left column: monumental editorial headline with word masks */}
            <div className="min-w-0 space-y-5 lg:space-y-7">
              <h1
                id="hero-heading"
                className="text-[clamp(2.25rem,5vw,4.75rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-[#EFF0F1]"
              >
                <span className="block overflow-hidden">
                  <span className="hero-line block">Engineering</span>
                </span>
                <span className="block overflow-hidden">
                  <span className="hero-line block">Intelligence Into</span>
                </span>
                <span className="block overflow-hidden">
                  <span className="hero-line block">Conversations.</span>
                </span>
              </h1>

              <div className="hero-reveal space-y-2">
                <p className="text-base font-medium text-[#EFF0F1] sm:text-lg">I’m {PORTFOLIO.person.name}. Founder at OpenCalls.</p>
                <p className="text-sm sm:text-base text-[#C4C8D0] leading-relaxed max-w-[48ch]">{PORTFOLIO.person.heroSubcopy}</p>
              </div>

              <div className="hero-reveal flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm">
                <a href="#voice-lab" className="hud-btn inline-flex min-h-12 items-center gap-3 bg-[#FF5A1F] px-5 py-3 font-semibold text-[#121418] hover:bg-[#ff6d38]">
                  Enter the call lab<ArrowDown className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => startAutopilotTour(0)}
                  className="inline-flex items-center gap-2 py-2 text-[#FF9F38] hover:text-[#EFF0F1] transition-colors cursor-pointer font-medium"
                >
                  <Compass className="w-4 h-4 text-[#FF5A1F]" />
                  <span>Take the guided tour</span>
                </button>
                <a
                  href={PORTFOLIO.person.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-2 text-[#C4C8D0] hover:text-[#EFF0F1] transition-colors"
                >
                  <FileText className="w-4 h-4 text-[#FF9F38]" />
                  <span>Resume</span>
                </a>
              </div>
            </div>

            {/* Right column: J.A.R.V.I.S. 3D Holographic Core + controls */}
            <div className="hero-reveal min-w-0 flex flex-col items-center">
              <AcousticIris
                state={livekit.agentState}
                micLevelRef={livekit.micLevelRef}
                agentLevelRef={livekit.agentLevelRef}
                micBinsRef={livekit.micBinsRef}
                agentBinsRef={livekit.agentBinsRef}
                onActivate={livekit.serverConfigured ? handleStartVoice : () => handleNavClick("voice-lab", false)}
                activationLabel={livekit.serverConfigured ? "Start a live voice session" : "Explore the interactive call lab"}
              />

              <div className="mt-2 sm:mt-3 font-mono text-xs tracking-wider text-[#9499A3] telemetry-nums">
                CORE //{" "}
                <span
                  className={cn(
                    livekit.agentState === "listening"
                      ? "text-[#38D9A9]"
                      : livekit.agentState === "speaking" || livekit.agentState === "executing"
                        ? "text-[#FF9F38]"
                        : livekit.agentState === "offline"
                          ? "text-[#9499A3]"
                          : "text-[#38D9A9]"
                  )}
                >
                  {livekit.agentState === "offline"
                    ? "STANDBY · EXPLORE THE CALL LAB"
                    : `${livekit.agentState.toUpperCase()} · READY`}
                </span>
              </div>

              {livekit.serverConfigured ? (
                <>
              {/* Multi-Persona LiveKit Agent Mode Selector */}
              <div
                role="radiogroup"
                aria-label="Select LiveKit AI voice persona"
                className="mt-3 sm:mt-4 inline-flex flex-wrap items-center justify-center gap-1 p-1 bg-[#1A1D23] border border-[#2B303B]"
              >
                {AGENT_PERSONAS.map((persona) => {
                  const active = selectedPersona === persona.id;
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => handleSelectPersona(persona.id)}
                      title={persona.description}
                      className={cn(
                        "relative min-h-9 sm:min-h-8 px-3 py-1.5 font-mono text-[11px] transition-colors cursor-pointer",
                        active ? "text-[#EFF0F1]" : "text-[#9499A3] hover:text-[#EFF0F1]"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="persona-pill-bg"
                          transition={{ type: "spring", stiffness: 420, damping: 32 }}
                          className="absolute inset-0 bg-[#22262E] border border-[#FF9F38]/60 pointer-events-none"
                        />
                      )}
                      <span className="relative z-10">{persona.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
                <button
                  type="button"
                  onClick={handleStartVoice}
                  className="hud-btn flex-1 min-w-[160px] min-h-11 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FF5A1F] text-[#121418] font-semibold text-sm hover:bg-[#ff6d38] cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {selectedPersona === "opencalls-demo"
                      ? "Try OpenCalls Demo"
                      : selectedPersona === "architect"
                        ? "Grill Systems Architect"
                        : "Talk to my AI"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenTextMode}
                  className="hud-btn flex-1 min-w-[140px] min-h-11 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1D23] border border-[#3B4252] text-[#EFF0F1] text-sm hover:border-[#FF9F38] cursor-pointer"
                >
                  <Keyboard className="w-4 h-4 text-[#C4C8D0]" />
                  <span>Type instead</span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 max-w-lg">
                {(
                  AGENT_PERSONAS.find((p) => p.id === selectedPersona)?.prompts ??
                  PORTFOLIO.starterPrompts
                ).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAskAbout(prompt)}
                    className="hud-btn min-h-10 px-3 py-2 bg-[#1A1D23] border border-[#2B303B] text-xs text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#38D9A9] cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
                </>
              ) : (
                <p className="mt-4 max-w-[36ch] text-center text-sm leading-relaxed text-[#9499A3]">
                  Live voice is currently unavailable. Explore the call lab without a microphone.
                </p>
              )}
            </div>
          </div>
        </section>

        <VoiceLab
          selectedTopic={selectedTopic}
          onSelectTopic={(topic) => setSelectedTopic(topic)}
          agentState={livekit.agentState}
          connected={livekit.connected}
          latestMetrics={livekit.latestMetrics}
          micBinsRef={livekit.micBinsRef}
          agentBinsRef={livekit.agentBinsRef}
          highlighted={highlightedTarget === "voice-pipeline"}
          onStartVoice={handleStartVoice}
          onAskAbout={handleAskAbout}
          onInspectArchitecture={() => handleOpenProject("opencalls", "architecture")}
        />

        {/* A. ABOUT */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="py-16 md:py-20 border-t border-[#2B303B]"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-8">
            <h2
              id="about-heading"
              className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal leading-[1.3] tracking-[-0.02em] text-[#EFF0F1] max-w-4xl"
            >
              {PORTFOLIO.about.statement}
            </h2>

            <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 pt-8 border-t border-[#2B303B]">
              <div className="space-y-4">
                <p className="text-base text-[#C4C8D0] leading-relaxed max-w-[58ch]">
                  {PORTFOLIO.about.bio}
                </p>
                <div className="pt-2 space-y-1.5 font-mono text-xs">
                  <div className="text-[#9499A3]">
                    {PORTFOLIO.person.name} · {PORTFOLIO.person.location}
                  </div>
                  <div className="text-[#38D9A9]">
                    CURRENT R&amp;D // {PORTFOLIO.person.currentResearch.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-6">
                {PORTFOLIO.about.specializations.map((spec) => (
                  <div key={spec.title} className="space-y-2 border-t border-[#2B303B] pt-4">
                    <h3 className="text-sm font-semibold text-[#EFF0F1]">{spec.title}</h3>
                    <p className="text-sm text-[#C4C8D0] leading-relaxed">{spec.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* C. PROJECTS & FLAGSHIP OPENCALLS */}
        <ProjectsSection
          onOpenProject={handleOpenProject}
          highlightedTarget={highlightedTarget}
        />

        {/* D. ENGINEERING WRITING (MEDIUM FIELD NOTES) */}
        <WritingSection
          onOpenArticle={handleOpenArticle}
          onAskAbout={handleAskAbout}
          highlighted={highlightedTarget === "writing-notes"}
        />

        {/* E. MULTITRACK EXPERIENCE TIMELINE */}
        <ExperienceTimeline
          selectedRoleId={selectedRoleId}
          onSelectRole={(roleId) => setSelectedRoleId(roleId)}
          highlighted={highlightedTarget === "experience-current"}
        />

        {/* F. INTERACTIVE TECHNICAL STACK MATRIX & VISITOR BRIEFING LENS */}
        <StackSignalMatrix
          onOpenProject={handleOpenProject}
          onAskAbout={handleAskAbout}
        />

        {/* G. CONTACT */}
        <section
          id="contact"
          aria-labelledby="contact-heading"
          className="py-28 md:py-36 border-t border-[#2B303B]"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-8">
            <h2
              id="contact-heading"
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#EFF0F1]"
            >
              Start a conversation.
            </h2>

            <div
              className={cn(
                "flex flex-wrap items-center gap-5 pt-2",
                highlightedTarget === "contact-email" && "target-locked p-4"
              )}
            >
              <a
                href={`mailto:${PORTFOLIO.person.email}`}
                className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-[-0.02em] text-[#EFF0F1] hover:text-[#FF5A1F] transition-colors break-all"
              >
                {PORTFOLIO.person.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="hud-btn inline-flex items-center gap-2 px-4 py-2 bg-[#1A1D23] border border-[#3B4252] font-mono text-xs text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#38D9A9]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy address</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-[#2B303B] text-sm">
              <a
                href={PORTFOLIO.person.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#EFF0F1] hover:text-[#FF9F38] transition-colors"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href={PORTFOLIO.person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#EFF0F1] hover:text-[#FF5A1F] transition-colors"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href={PORTFOLIO.person.medium}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#EFF0F1] hover:text-[#38D9A9] transition-colors"
              >
                <span>Medium</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href={PORTFOLIO.person.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#EFF0F1] hover:text-[#FF9F38] transition-colors"
              >
                <span>X</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href={PORTFOLIO.person.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#C4C8D0] hover:text-[#EFF0F1] transition-colors"
              >
                <FileText className="w-4 h-4 text-[#FF9F38]" />
                <span>Resume</span>
              </a>

              <button
                type="button"
                onClick={handleStartVoice}
                className="text-[#38D9A9] hover:underline transition-colors cursor-pointer"
              >
                Prefer talking? Ask my AI agent first
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2B303B] py-8 px-6 md:px-10 text-xs text-[#9499A3]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>
            {PORTFOLIO.person.name} · {PORTFOLIO.person.role}
          </span>
          <span className="font-mono">
            LIVEKIT WEBRTC · ELEVENLABS TTS · NEXT.JS · THREE.JS · MOTION · GSAP
          </span>
        </div>
      </footer>

      {/* Agentic Ghost Cursor + Sightline Targeting Beam */}
      <AgentAutopilotCursor target={ghostTarget} />

      {/* Autopilot Guided Tour Controller HUD */}
      <AutopilotHudBar
        step={autopilotStepMeta}
        paused={autopilotPaused}
        onTogglePause={() => setAutopilotPaused((p) => !p)}
        onNext={() => {
          if (autopilotIndex === null) return;
          if (autopilotIndex + 1 < AUTOPILOT_STOPS.length) {
            setAutopilotIndex(autopilotIndex + 1);
          } else {
            stopAutopilotTour();
          }
        }}
        onStop={stopAutopilotTour}
      />

      {/* Desktop right-edge hardware telemetry scroll rail */}
      <SignalScrollRail
        activeSectionId={activeSectionId}
        onJump={(id) => {
          signalSound.playTick(660);
          setActiveSectionId(id);
          if (id === "hero") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            handleNavClick(id as NavId, false);
          }
        }}
      />

      {/* Kinetic floating live captions above dock during active LiveKit voice sessions */}
      <KineticCaptions
        visible={livekit.connected && dockVisible}
        line={livekit.transcript[livekit.transcript.length - 1]}
      />

      {/* Iron Man Holographic HUD Popup */}
      <StagePanel
        panel={activePanel}
        onChangePanel={setActivePanel}
        onClose={handleClosePanel}
        onStartVoice={handleStartVoice}
        onAskAbout={handleAskAbout}
      />

      {/* Quick Command Launcher (Cmd+K / Ctrl+K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={commandItems}
      />

      {/* Signal Shell Diagnostic Console (Press `) */}
      <SignalTerminal
        open={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        onOpenProject={(pid) => handleOpenProject(pid, "architecture")}
        onStartAutopilot={() => startAutopilotTour(0)}
        onStartVoice={() => {
          void handleStartVoice();
        }}
      />

      {/* Persistent bottom Agent Dock */}
      <AgentDock
        visible={dockVisible}
        connected={livekit.connected}
        agentState={livekit.agentState}
        activePersona={selectedPersona}
        activeVoiceKey={selectedVoiceKey}
        onSelectVoice={handleSelectVoice}
        micEnabled={livekit.micEnabled}
        micPermissionError={livekit.micPermissionError}
        connectionError={livekit.connectionError}
        transcript={livekit.transcript}
        traceLog={livekit.traceLog}
        latestMetrics={livekit.latestMetrics}
        metricsHistory={livekit.metricsHistory}
        textInputOpen={textInputOpen}
        onToggleTextInput={() => setTextInputOpen((v) => !v)}
        onToggleMic={livekit.toggleMic}
        onSendText={livekit.sendTextMessage}
        onEndSession={async () => {
          signalSound.playVoiceLink(false);
          await livekit.disconnect();
          setDockVisible(false);
        }}
      />
    </div>
  );
}
