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
  Copy,
  FileText,
  Keyboard,
  Menu,
  Mic,
  X,
} from "lucide-react";
import { AcousticIris } from "@/components/acoustic-iris";
import { AgentDock } from "@/components/agent-dock";
import { CommandPalette, type CommandItem } from "@/components/command-palette";
import { ExperienceTimeline } from "@/components/experience-timeline";
import { ProjectsSection } from "@/components/projects-section";
import { StagePanel, type ActivePanelState } from "@/components/stage-panel";
import { VoiceLab } from "@/components/voice-lab";
import { WritingSection } from "@/components/writing-section";
import { PORTFOLIO, type VoiceTopicId } from "@/data/portfolio";
import { useLiveKitAgent } from "@/hooks/use-livekit-agent";
import type {
  ArticleId,
  HighlightTarget,
  ProjectId,
  ProjectTab,
  RoleId,
  UiAction,
} from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

type NavId = "about" | "voice-lab" | "projects" | "writing" | "experience" | "stack" | "contact";

const NAV_LINKS: { id: NavId; label: string }[] = [
  { id: "about", label: "About" },
  { id: "voice-lab", label: "Voice Lab" },
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
  const [hudNotice, setHudNotice] = useState<string | null>(null);
  const [dockVisible, setDockVisible] = useState(false);
  const [textInputOpen, setTextInputOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanelState>(null);
  const [selectedTopic, setSelectedTopic] = useState<VoiceTopicId>("stt");
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId>("opencalls");
  const [highlightedTarget, setHighlightedTarget] = useState<HighlightTarget | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const highlightTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const disconnectRef = useRef<(() => Promise<void>) | null>(null);

  const showHudNotice = useCallback((msg: string) => {
    setHudNotice(msg);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setHudNotice(null), 1800);
  }, []);

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
          showHudNotice(`HUD // TARGET LOCKED → ${action.args.section.toUpperCase()}`);
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return { ok: true };
        }
        case "open_project": {
          setActiveNav("projects");
          const el = document.getElementById("projects");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
          triggerHighlight(action.args.projectId);
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
          setActivePanel({ kind: "skills", topic: nextTopic });
          return { ok: true };
        }
        case "open_contact_panel": {
          setActiveNav("contact");
          triggerHighlight("contact-email");
          showHudNotice("HUD // DIRECT COMMS OPEN");
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
        case "end_voice_session": {
          setActivePanel(null);
          setHighlightedTarget(null);
          setActiveNav("about");
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
    [flashSignalBeam, selectedRoleId, showHudNotice, triggerHighlight]
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
    };
  }, []);

  // Scroll spy: keep top HUD reticle synced with the section currently in view
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveNav(visible[0].target.id as NavId);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Global Cmd+K / Ctrl+K command launcher shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const handleNavClick = useCallback(
    (id: NavId, openPopup = true) => {
      setActiveNav(id);
      setMobileMenuOpen(false);
      flashSignalBeam();
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });

      if (!openPopup) {
        showHudNotice(`HUD // SECTION · ${id.toUpperCase()}`);
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
    showHudNotice("J.A.R.V.I.S. LINK // INITIALIZING LIVEKIT");
    await livekit.connect({ enableMic: true });
  }, [livekit, showHudNotice]);

  const handleOpenTextMode = useCallback(async () => {
    setDockVisible(true);
    setTextInputOpen(true);
    if (livekit.serverConfigured) {
      await livekit.connect({ enableMic: false });
    }
  }, [livekit]);

  const handleAskAbout = useCallback(
    async (prompt: string) => {
      setActivePanel(null);
      setDockVisible(true);
      setTextInputOpen(true);
      showHudNotice("HUD // ROUTING QUERY TO LIVEKIT AGENT");
      await livekit.sendTextMessage(prompt);
    },
    [livekit, showHudNotice]
  );

  const handleClosePanel = () => {
    const closingName = activePanel?.kind ?? "none";
    setActivePanel(null);
    livekit.notifyPanelClosed(closingName);
  };

  const handleOpenProject = useCallback(
    (projectId: ProjectId, tab: ProjectTab = "overview") => {
      flashSignalBeam();
      showHudNotice(`HUD // PROJECTING ${projectId.toUpperCase()}`);
      setActivePanel({ kind: "project", projectId, tab });
    },
    [flashSignalBeam, showHudNotice]
  );

  const handleOpenArticle = useCallback(
    (articleId: ArticleId) => {
      flashSignalBeam();
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
  }, [copyEmail, handleNavClick, handleOpenArticle, handleOpenProject, handleOpenTextMode, handleStartVoice]);

  const statusText =
    livekit.serverConfigured === null
      ? "CHECKING AGENT"
      : livekit.connected
        ? "SESSION LIVE"
        : livekit.serverConfigured
          ? "AGENT ONLINE"
          : "AGENT OFFLINE";

  const statusLive = livekit.connected || livekit.serverConfigured === true;

  return (
    <div ref={rootRef} className="min-h-screen bg-[#121418] text-[#EFF0F1] relative">
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
            className="inline-flex items-center gap-3 text-[#EFF0F1] hover:text-[#FF9F38] transition-colors shrink-0"
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
              const active = activeNav === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
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
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command launcher"
              className="hud-btn hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
              title="Quick command launcher (⌘K / Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-[#FF9F38]" />
              <span>K</span>
            </button>

            <button
              type="button"
              onClick={() => setDockVisible((v) => !v)}
              className="hud-btn inline-flex items-center gap-2 px-3 py-1.5 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
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
              className="lg:hidden p-2 border border-[#2B303B] bg-[#1A1D23] text-[#EFF0F1] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              aria-label="Mobile navigation"
              className="lg:hidden border-t border-[#2B303B] bg-[#14171D] px-6 py-4 flex flex-col gap-2 text-sm"
            >
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className="text-left text-[#C4C8D0] hover:text-[#EFF0F1] py-1.5 cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPaletteOpen(true);
                }}
                className="text-left font-mono text-xs text-[#FF9F38] pt-2 border-t border-[#2B303B] cursor-pointer"
              >
                ⌘K Quick Command Launcher
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className={dockVisible ? "pb-44" : "pb-16"}>
        {/* HERO — First Viewport with J.A.R.V.I.S. 3D Core */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="relative max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-20 md:pt-18 md:pb-24"
        >
          <div className="grid lg:grid-cols-[1.12fr_0.98fr] gap-12 lg:gap-10 items-center">
            {/* Left column: monumental editorial headline with word masks */}
            <div className="min-w-0 space-y-7 lg:pr-8 lg:border-r lg:border-[#2B303B]">
              <h1
                id="hero-heading"
                className="text-[clamp(2.35rem,6.3vw,5.5rem)] font-extrabold leading-[0.94] tracking-[-0.03em] text-[#EFF0F1]"
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

              <p className="hero-reveal text-base md:text-lg text-[#C4C8D0] leading-relaxed max-w-[50ch]">
                {PORTFOLIO.person.heroSubcopy}
              </p>

              <div className="hero-reveal flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-sm">
                <a
                  href="#about"
                  className="inline-flex items-center gap-2 text-[#EFF0F1] hover:text-[#FF9F38] transition-colors"
                >
                  <ArrowDown className="w-4 h-4 text-[#FF5A1F]" />
                  <span>Explore my work</span>
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
                <span className="text-[#9499A3]">
                  {PORTFOLIO.person.name} · {PORTFOLIO.person.currentHeadline}
                </span>
              </div>
            </div>

            {/* Right column: J.A.R.V.I.S. 3D Holographic Core + controls */}
            <div className="hero-reveal min-w-0 flex flex-col items-center">
              <AcousticIris
                state={livekit.agentState}
                micLevelRef={livekit.micLevelRef}
                agentLevelRef={livekit.agentLevelRef}
                onActivate={handleStartVoice}
              />

              <div className="mt-3 font-mono text-xs tracking-wider text-[#9499A3] telemetry-nums">
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
                    ? "STANDBY — BROWSE OR CONNECT LIVEKIT"
                    : `${livekit.agentState.toUpperCase()} — READY`}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
                <button
                  type="button"
                  onClick={handleStartVoice}
                  className="hud-btn flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FF5A1F] text-[#121418] font-semibold text-sm hover:bg-[#ff6d38] cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Talk to my AI</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenTextMode}
                  className="hud-btn flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1D23] border border-[#3B4252] text-[#EFF0F1] text-sm hover:border-[#FF9F38] cursor-pointer"
                >
                  <Keyboard className="w-4 h-4 text-[#C4C8D0]" />
                  <span>Type instead</span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-lg">
                {PORTFOLIO.starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleAskAbout(prompt)}
                    className="hud-btn px-3 py-1.5 bg-[#1A1D23] border border-[#2B303B] text-xs text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#38D9A9] cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* A. ABOUT */}
        <section
          id="about"
          aria-labelledby="about-heading"
          className="py-24 md:py-32 border-t border-[#2B303B]"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-12">
            <h2
              id="about-heading"
              className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] font-normal leading-[1.2] tracking-[-0.02em] text-[#EFF0F1] max-w-4xl"
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

        {/* B. VOICE ENGINEERING LAB */}
        <VoiceLab
          selectedTopic={selectedTopic}
          onSelectTopic={(topic) => setSelectedTopic(topic)}
          agentState={livekit.agentState}
          connected={livekit.connected}
          latestMetrics={livekit.latestMetrics}
          highlighted={highlightedTarget === "voice-pipeline"}
          onStartVoice={handleStartVoice}
          onAskAbout={handleAskAbout}
        />

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

        {/* F. TECHNICAL STACK */}
        <section
          id="stack"
          aria-labelledby="stack-heading"
          className="py-24 md:py-32 border-t border-[#2B303B]"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <h2
                id="stack-heading"
                className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#EFF0F1]"
              >
                Technical Stack
              </h2>
              <p className="text-sm text-[#9499A3]">
                Every capability links directly to the systems where it ships.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2B303B] border border-[#2B303B]">
              {PORTFOLIO.stack.map((category) => (
                <div key={category.id} className="bg-[#121418] p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-[#EFF0F1] pb-3 border-b border-[#2B303B]">
                    {category.name}
                  </h3>
                  <ul className="space-y-3">
                    {category.items.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-[#C4C8D0]">{item.name}</span>
                        {item.projectIds.length > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.projectIds.map((pid) => (
                              <button
                                key={pid}
                                type="button"
                                onClick={() => handleOpenProject(pid, "stack")}
                                className="hud-btn font-mono text-[11px] px-1.5 py-0.5 bg-[#1A1D23] border border-[#2B303B] text-[#9499A3] hover:text-[#38D9A9] hover:border-[#38D9A9] cursor-pointer"
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
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* G. CONTACT */}
        <section
          id="contact"
          aria-labelledby="contact-heading"
          className="py-24 md:py-32 border-t border-[#2B303B]"
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
            {PORTFOLIO.person.name} — {PORTFOLIO.person.role}
          </span>
          <span className="font-mono">
            LIVEKIT WEBRTC · ELEVENLABS TTS · NEXT.JS · THREE.JS · MOTION · GSAP
          </span>
        </div>
      </footer>

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

      {/* Persistent bottom Agent Dock */}
      <AgentDock
        visible={dockVisible}
        connected={livekit.connected}
        agentState={livekit.agentState}
        micEnabled={livekit.micEnabled}
        micPermissionError={livekit.micPermissionError}
        connectionError={livekit.connectionError}
        transcript={livekit.transcript}
        traceLog={livekit.traceLog}
        latestMetrics={livekit.latestMetrics}
        textInputOpen={textInputOpen}
        onToggleTextInput={() => setTextInputOpen((v) => !v)}
        onToggleMic={livekit.toggleMic}
        onSendText={livekit.sendTextMessage}
        onEndSession={async () => {
          await livekit.disconnect();
          setDockVisible(false);
        }}
      />
    </div>
  );
}
