"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  MessageSquare,
  X,
} from "lucide-react";
import { PORTFOLIO, type VoiceTopicId } from "@/data/portfolio";
import type { ArticleId, ProjectId, ProjectTab, RoleId } from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

export type ActivePanelState =
  | { kind: "project"; projectId: ProjectId; tab: ProjectTab }
  | { kind: "skills"; topic: VoiceTopicId }
  | { kind: "experience"; roleId: RoleId }
  | { kind: "writing"; articleId: ArticleId }
  | { kind: "about" }
  | { kind: "contact" }
  | null;

interface StagePanelProps {
  panel: ActivePanelState;
  onChangePanel: (next: ActivePanelState) => void;
  onClose: () => void;
  onStartVoice: () => void;
  onAskAbout: (prompt: string) => void;
}

const PROJECT_TABS: { id: ProjectTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "problem", label: "Problem" },
  { id: "architecture", label: "Architecture" },
  { id: "decisions", label: "Decisions" },
  { id: "stack", label: "Stack" },
  { id: "contributions", label: "My Role" },
];

export function StagePanel({
  panel,
  onChangePanel,
  onClose,
  onStartVoice,
  onAskAbout,
}: StagePanelProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!panel) return;
    closeBtnRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [panel, onClose]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(PORTFOLIO.person.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const panelKey = panel
    ? panel.kind === "project"
      ? `project-${panel.projectId}`
      : panel.kind
    : "none";

  const hudCode = panel
    ? panel.kind === "project"
      ? `HUD // PROJECT · ${panel.projectId.toUpperCase()}`
      : panel.kind === "skills"
        ? `HUD // VOICE LAB · ${panel.topic.toUpperCase()}`
        : panel.kind === "experience"
          ? `HUD // EXPERIENCE · ${panel.roleId.toUpperCase()}`
          : panel.kind === "writing"
            ? `HUD // WRITING · ${panel.articleId.toUpperCase()}`
            : panel.kind === "about"
              ? "HUD // PROFILE · ISTEKHAR KHAN"
              : "HUD // DIRECT COMMS"
    : "";

  return (
    <AnimatePresence>
      {panel && (
        <div className="fixed inset-0 z-40" style={{ perspective: "1200px" }}>
          {/* Dimmed workshop backdrop */}
          <motion.div
            key="hud-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-[#08090C]/75"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Floating Iron Man Holographic HUD Popup centered in viewport */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8 pb-28 pointer-events-none">
            <motion.aside
              key={panelKey}
              role="dialog"
              aria-modal="true"
              aria-labelledby="stage-panel-title"
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.9, y: 24, rotateX: 6 }
              }
              animate={
                reducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1, y: 0, rotateX: 0 }
              }
              exit={
                reducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.92, y: 16, rotateX: -4 }
              }
              transition={{
                type: "spring",
                stiffness: 340,
                damping: 28,
                mass: 0.85,
              }}
              className="hud-frame pointer-events-auto relative w-full max-w-4xl max-h-[calc(100vh-11rem)] bg-[#161920] border border-[#3B4252] flex flex-col overflow-hidden"
            >
              {/* Holographic scanline drop on open */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 right-0 top-0 h-14 bg-gradient-to-b from-[#FF9F38]/22 via-[#FF5A1F]/8 to-transparent hud-scan-drop z-30"
              />

              {/* Top Stark telemetry ribbon */}
              <div className="flex items-center justify-between px-5 md:px-7 py-2 bg-[#111318] border-b border-[#2B303B] font-mono text-[11px] text-[#9499A3]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F38] signal-pulse" />
                  <span className="text-[#FF9F38]">{hudCode}</span>
                </div>
                <span className="hidden sm:inline telemetry-nums">PROJECTION // LOCKED</span>
              </div>

              {/* Panel header */}
              <div className="flex items-center justify-between gap-4 px-5 md:px-7 py-4 border-b border-[#2B303B] bg-[#14171D]">
                <div className="flex flex-wrap items-center gap-3">
                  {panel.kind === "project" &&
                    (() => {
                      const proj = PORTFOLIO.projects.find((p) => p.id === panel.projectId)!;
                      return (
                        <>
                          <h2
                            id="stage-panel-title"
                            className="font-serif text-2xl md:text-3xl text-[#EFF0F1]"
                          >
                            {proj.name}
                          </h2>
                          <span
                            className={cn(
                              "font-mono text-xs px-2.5 py-0.5 border",
                              proj.status === "active"
                                ? "border-[#38D9A9]/45 text-[#38D9A9] bg-[#38D9A9]/10"
                                : "border-[#3B4252] text-[#9499A3]"
                            )}
                          >
                            {proj.flagship ? "FLAGSHIP · ACTIVE" : proj.status.toUpperCase()}
                          </span>
                        </>
                      );
                    })()}
                  {panel.kind === "skills" && (
                    <h2
                      id="stage-panel-title"
                      className="font-serif text-2xl md:text-3xl text-[#EFF0F1]"
                    >
                      Voice Engineering Explorer
                    </h2>
                  )}
                  {panel.kind === "experience" && (
                    <h2
                      id="stage-panel-title"
                      className="font-serif text-2xl md:text-3xl text-[#EFF0F1]"
                    >
                      Engineering Timeline
                    </h2>
                  )}
                  {panel.kind === "writing" && (
                    <h2
                      id="stage-panel-title"
                      className="font-serif text-2xl md:text-3xl text-[#EFF0F1]"
                    >
                      Engineering Writing
                    </h2>
                  )}
                  {panel.kind === "about" && (
                    <h2
                      id="stage-panel-title"
                      className="font-serif text-2xl md:text-3xl text-[#EFF0F1]"
                    >
                      {PORTFOLIO.person.name}
                    </h2>
                  )}
                  {panel.kind === "contact" && (
                    <h2
                      id="stage-panel-title"
                      className="font-serif text-2xl md:text-3xl text-[#EFF0F1]"
                    >
                      Contact {PORTFOLIO.person.name}
                    </h2>
                  )}
                </div>

                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  className="hud-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#121418] border border-[#3B4252] font-mono text-xs text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
                >
                  <span>ESC</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6">
                {panel.kind === "project" &&
                  (() => {
                    const project = PORTFOLIO.projects.find((p) => p.id === panel.projectId)!;
                    return (
                      <div className="space-y-6">
                        {/* Sliding layoutId tab bar */}
                        <div
                          role="tablist"
                          aria-label="Case study sections"
                          className="flex flex-wrap gap-1 border-b border-[#2B303B] pb-2"
                        >
                          {PROJECT_TABS.map((t) => {
                            const active = panel.tab === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() =>
                                  onChangePanel({ kind: "project", projectId: project.id, tab: t.id })
                                }
                                className={cn(
                                  "relative px-3.5 py-2 text-sm transition-colors cursor-pointer",
                                  active
                                    ? "text-[#EFF0F1] font-semibold"
                                    : "text-[#9499A3] hover:text-[#EFF0F1]"
                                )}
                              >
                                {t.label}
                                {active && (
                                  <motion.div
                                    layoutId="stage-tab-underline"
                                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                                    className="absolute left-0 right-0 -bottom-[9px] h-[2px] bg-[#FF5A1F]"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={panel.tab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                          >
                            {panel.tab === "overview" && (
                              <div className="space-y-5">
                                <div className="font-mono text-xs text-[#9499A3]">
                                  {project.locationOrContext} · {project.year}
                                </div>
                                <p className="text-xl text-[#EFF0F1] leading-relaxed max-w-[60ch]">
                                  {project.tagline}
                                </p>
                                <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[68ch]">
                                  {project.overview}
                                </p>
                                <div className="pt-2">
                                  <div className="font-mono text-xs text-[#9499A3] mb-3">
                                    SYSTEM HIGHLIGHTS
                                  </div>
                                  <ul className="space-y-2.5 text-sm text-[#C4C8D0]">
                                    {project.contributions.map((c) => (
                                      <li key={c} className="flex items-start gap-2.5">
                                        <span className="mt-2 w-1.5 h-1.5 bg-[#FF5A1F] shrink-0" />
                                        <span>{c}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {panel.tab === "problem" && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#EFF0F1]">
                                  The engineering problem
                                </h3>
                                <p className="text-base text-[#C4C8D0] leading-relaxed max-w-[65ch]">
                                  {project.problem}
                                </p>
                              </div>
                            )}

                            {panel.tab === "architecture" && (
                              <div className="space-y-5">
                                <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[68ch]">
                                  {project.architectureSummary}
                                </p>
                                <div className="bg-[#121418] border border-[#2B303B] p-5 signal-grid space-y-3">
                                  {project.architectureNodes.map((node, i) => (
                                    <motion.div
                                      key={node.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.06, duration: 0.24 }}
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-[#1A1D23] border border-[#323846]">
                                        <div>
                                          <div className="font-mono text-xs font-semibold text-[#EFF0F1]">
                                            {node.label}
                                          </div>
                                          <div className="text-sm text-[#C4C8D0] mt-1">
                                            {node.detail}
                                          </div>
                                        </div>
                                        <span className="font-mono text-xs text-[#38D9A9] shrink-0">
                                          {node.sublabel}
                                        </span>
                                      </div>
                                      {i < project.architectureNodes.length - 1 && (
                                        <div className="flex justify-center py-1" aria-hidden="true">
                                          <div className="w-px h-4 bg-[#FF9F38]" />
                                        </div>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {panel.tab === "decisions" && (
                              <div className="space-y-4">
                                {project.decisions.map((d) => (
                                  <div
                                    key={d.title}
                                    className="bg-[#121418] border border-[#2B303B] p-5"
                                  >
                                    <h3 className="text-base font-semibold text-[#EFF0F1]">
                                      {d.title}
                                    </h3>
                                    <p className="text-sm text-[#C4C8D0] mt-2 leading-relaxed">
                                      {d.detail}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {panel.tab === "stack" && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#EFF0F1]">
                                  Technologies used
                                </h3>
                                <div className="flex flex-wrap gap-2.5">
                                  {project.stack.map((tech) => (
                                    <span
                                      key={tech}
                                      className="font-mono text-xs px-3 py-2 bg-[#121418] border border-[#2B303B] text-[#EFF0F1]"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {panel.tab === "contributions" && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-[#EFF0F1]">
                                  My specific contributions
                                </h3>
                                <ul className="space-y-3 text-sm text-[#C4C8D0]">
                                  {project.contributions.map((item) => (
                                    <li
                                      key={item}
                                      className="bg-[#121418] border border-[#2B303B] p-4 flex items-start gap-3"
                                    >
                                      <span className="mt-2 w-1.5 h-1.5 bg-[#38D9A9] shrink-0" />
                                      <span className="leading-relaxed">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>

                        {/* Contextual footer actions */}
                        <div className="pt-4 border-t border-[#2B303B] flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              onAskAbout(
                                `Walk me through ${project.name}'s ${panel.tab} in detail.`
                              )
                            }
                            className="hud-btn inline-flex items-center gap-2 px-3.5 py-2 bg-[#121418] border border-[#2B303B] text-xs font-mono text-[#38D9A9] hover:border-[#38D9A9] cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Ask AI about {project.name}</span>
                          </button>

                          <div className="flex flex-wrap items-center gap-2.5">
                            {project.liveUrl && (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hud-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FF5A1F] text-[#121418] font-semibold text-xs font-mono hover:bg-[#ff6d38]"
                              >
                                <span>Visit {project.liveLabel ?? "live site"}</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {project.articleUrl && (
                              <a
                                href={project.articleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hud-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#121418] border border-[#3B4252] text-xs font-mono text-[#EFF0F1] hover:border-[#FF9F38]"
                              >
                                <span>{project.articleLabel ?? "Read engineering post"}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#FF9F38]" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {panel.kind === "skills" &&
                  (() => {
                    const topicData =
                      PORTFOLIO.voiceTopics.find((t) => t.id === panel.topic) ??
                      PORTFOLIO.voiceTopics[0];
                    return (
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {PORTFOLIO.voiceTopics.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => onChangePanel({ kind: "skills", topic: t.id })}
                              className={cn(
                                "hud-btn font-mono text-xs px-3 py-1.5 border cursor-pointer",
                                t.id === panel.topic
                                  ? "border-[#FF5A1F] bg-[#FF5A1F]/16 text-[#EFF0F1]"
                                  : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                              )}
                            >
                              {t.shortLabel}
                            </button>
                          ))}
                        </div>

                        <div className="bg-[#121418] border border-[#2B303B] p-6 space-y-4">
                          <div className="font-mono text-xs text-[#38D9A9]">
                            {topicData.shortLabel}
                          </div>
                          <h3 className="font-serif text-2xl text-[#EFF0F1]">{topicData.title}</h3>
                          <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[65ch]">
                            {topicData.summary}
                          </p>
                          <ul className="space-y-2.5 pt-2 text-sm text-[#C4C8D0]">
                            {topicData.engineeringFocus.map((pt) => (
                              <li key={pt} className="flex items-start gap-2.5">
                                <span className="mt-2 w-1.5 h-1.5 bg-[#FF5A1F] shrink-0" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="pt-4 border-t border-[#2B303B] flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              {topicData.stackUsed.map((s) => (
                                <span
                                  key={s}
                                  className="font-mono text-xs px-2.5 py-1 bg-[#1A1D23] border border-[#2B303B] text-[#EFF0F1]"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onAskAbout(
                                  `How does Istekhar engineer ${topicData.title} in production voice agents?`
                                )
                              }
                              className="hud-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#38D9A9] hover:border-[#38D9A9] cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Ask AI</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {panel.kind === "writing" &&
                  (() => {
                    const article =
                      PORTFOLIO.articles.find((a) => a.id === panel.articleId) ??
                      PORTFOLIO.articles[0];
                    return (
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {PORTFOLIO.articles.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => onChangePanel({ kind: "writing", articleId: a.id })}
                              className={cn(
                                "hud-btn font-mono text-xs px-3 py-1.5 border cursor-pointer",
                                a.id === article.id
                                  ? "border-[#FF9F38] bg-[#FF9F38]/14 text-[#EFF0F1]"
                                  : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                              )}
                            >
                              {a.date} · {a.category}
                            </button>
                          ))}
                        </div>

                        <div className="bg-[#121418] border border-[#2B303B] p-6 space-y-4">
                          <div className="font-mono text-xs text-[#FF9F38] telemetry-nums">
                            {article.date} · {article.category.toUpperCase()} · MEDIUM
                          </div>
                          <h3 className="font-serif text-2xl md:text-3xl text-[#EFF0F1] leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[66ch]">
                            {article.summary}
                          </p>
                          <div className="pt-2">
                            <div className="font-mono text-xs text-[#9499A3] mb-2.5">
                              KEY TAKEAWAYS
                            </div>
                            <ul className="space-y-2.5 text-sm text-[#C4C8D0]">
                              {article.takeaways.map((point) => (
                                <li key={point} className="flex items-start gap-2.5">
                                  <span className="mt-2 w-1.5 h-1.5 bg-[#38D9A9] shrink-0" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="pt-4 border-t border-[#2B303B] flex flex-wrap items-center justify-between gap-3">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hud-btn inline-flex items-center gap-2 px-4 py-2 bg-[#FF5A1F] text-[#121418] font-semibold text-sm hover:bg-[#ff6d38]"
                            >
                              <span>Read full article on Medium</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                onAskAbout(
                                  `Tell me the core engineering lessons from Istekhar's article "${article.title}".`
                                )
                              }
                              className="hud-btn inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#38D9A9] hover:border-[#38D9A9] cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Ask AI about this</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {panel.kind === "experience" &&
                  (() => {
                    const role =
                      PORTFOLIO.experience.find((e) => e.id === panel.roleId) ??
                      PORTFOLIO.experience[0];
                    return (
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {PORTFOLIO.experience.map((e) => (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => onChangePanel({ kind: "experience", roleId: e.id })}
                              className={cn(
                                "hud-btn font-mono text-xs px-3 py-1.5 border cursor-pointer",
                                e.id === role.id
                                  ? "border-[#FF9F38] bg-[#FF9F38]/14 text-[#EFF0F1]"
                                  : "border-[#2B303B] bg-[#121418] text-[#9499A3] hover:text-[#EFF0F1]"
                              )}
                            >
                              {e.company}
                            </button>
                          ))}
                        </div>

                        <div className="bg-[#121418] border border-[#2B303B] p-6 space-y-4">
                          <div className="font-mono text-xs text-[#FF9F38] telemetry-nums">
                            {role.period} · {role.location}
                          </div>
                          <h3 className="font-serif text-2xl text-[#EFF0F1]">{role.company}</h3>
                          <div className="text-sm font-medium text-[#38D9A9]">{role.role}</div>
                          <p className="text-sm text-[#C4C8D0] leading-relaxed">{role.summary}</p>
                          <ul className="space-y-2.5 pt-2 text-sm text-[#C4C8D0]">
                            {role.highlights.map((h) => (
                              <li key={h} className="flex items-start gap-2.5">
                                <span className="mt-2 w-1.5 h-1.5 bg-[#FF5A1F] shrink-0" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}

                {panel.kind === "about" && (
                  <div className="space-y-6">
                    <p className="font-serif text-2xl text-[#EFF0F1] leading-snug">
                      {PORTFOLIO.about.statement}
                    </p>
                    <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[65ch]">
                      {PORTFOLIO.about.bio}
                    </p>
                    <div className="font-mono text-xs text-[#38D9A9]">
                      CURRENT R&amp;D // {PORTFOLIO.person.currentResearch.toUpperCase()}
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                      {PORTFOLIO.about.specializations.map((spec) => (
                        <div
                          key={spec.title}
                          className="bg-[#121418] border border-[#2B303B] p-4 space-y-2"
                        >
                          <div className="text-sm font-semibold text-[#EFF0F1]">{spec.title}</div>
                          <p className="text-xs text-[#C4C8D0] leading-relaxed">{spec.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {panel.kind === "contact" && (
                  <div className="space-y-6">
                    <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[60ch]">
                      Direct email is the fastest way to discuss Voice AI systems, OpenCalls,
                      founding engineering roles, or technical collaborations.
                    </p>

                    <div className="bg-[#121418] border border-[#2B303B] p-6 space-y-4">
                      <div className="font-mono text-xs text-[#9499A3]">EMAIL</div>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <a
                          href={`mailto:${PORTFOLIO.person.email}`}
                          className="text-xl sm:text-2xl font-semibold text-[#EFF0F1] hover:text-[#FF5A1F] transition-colors break-all"
                        >
                          {PORTFOLIO.person.email}
                        </a>
                        <button
                          type="button"
                          onClick={copyEmail}
                          className="hud-btn inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A1D23] border border-[#3B4252] text-xs font-mono text-[#EFF0F1] hover:border-[#EFF0F1] cursor-pointer"
                        >
                          {copiedEmail ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#38D9A9]" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy email</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3.5">
                      <a
                        href={PORTFOLIO.person.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hud-btn bg-[#121418] border border-[#2B303B] p-4 hover:border-[#FF9F38] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-xs text-[#9499A3]">GITHUB</div>
                          <div className="text-sm font-medium text-[#EFF0F1] mt-1">
                            github.com/istekhar46
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#FF9F38]" />
                      </a>

                      <a
                        href={PORTFOLIO.person.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hud-btn bg-[#121418] border border-[#2B303B] p-4 hover:border-[#FF5A1F] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-xs text-[#9499A3]">LINKEDIN</div>
                          <div className="text-sm font-medium text-[#EFF0F1] mt-1">
                            linkedin.com/in/istekhar46
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#FF5A1F]" />
                      </a>

                      <a
                        href={PORTFOLIO.person.medium}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hud-btn bg-[#121418] border border-[#2B303B] p-4 hover:border-[#38D9A9] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-xs text-[#9499A3]">MEDIUM</div>
                          <div className="text-sm font-medium text-[#EFF0F1] mt-1">
                            @istekharkhan46
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#38D9A9]" />
                      </a>

                      <a
                        href={PORTFOLIO.person.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hud-btn bg-[#121418] border border-[#2B303B] p-4 hover:border-[#EFF0F1] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-xs text-[#9499A3]">X / TWITTER</div>
                          <div className="text-sm font-medium text-[#EFF0F1] mt-1">
                            @istekharkhan46
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#EFF0F1]" />
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartVoice();
                        }}
                        className="hud-btn px-4 py-2.5 bg-[#FF5A1F] text-[#121418] font-semibold text-sm hover:bg-[#ff6d38] cursor-pointer"
                      >
                        Talk to Istekhar&apos;s AI representative
                      </button>

                      <a
                        href={PORTFOLIO.person.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hud-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#121418] border border-[#3B4252] text-sm text-[#EFF0F1] hover:border-[#FF9F38]"
                      >
                        <FileText className="w-4 h-4 text-[#FF9F38]" />
                        <span>View Resume</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
