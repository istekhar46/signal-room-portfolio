"use client";

import { ArrowUpRight, FileText } from "lucide-react";
import { PORTFOLIO, type ExperienceEntry } from "@/data/portfolio";
import type { RoleId } from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

interface ExperienceTimelineProps {
  selectedRoleId: RoleId;
  onSelectRole: (roleId: RoleId) => void;
  highlighted: boolean;
}

// Calibrated multitrack timeline span: Jan 2024 (month 0) to Dec 2026 (month 36)
const TIMELINE_START_YEAR = 2024;
const TOTAL_MONTHS = 36;

function toMonthOffset(year: number, month: number): number {
  return (year - TIMELINE_START_YEAR) * 12 + (month - 1);
}

function getClipMetrics(entry: ExperienceEntry) {
  const start = Math.max(0, toMonthOffset(entry.startYear, entry.startMonth));
  const end = Math.min(TOTAL_MONTHS, toMonthOffset(entry.endYear, entry.endMonth) + 1);
  const rawLeft = (start / TOTAL_MONTHS) * 100;
  const widthPct = Math.max(12, ((end - start) / TOTAL_MONTHS) * 100);
  const leftPct = Math.min(rawLeft, Math.max(0, 99 - widthPct));
  const centerPct = Math.min(96, leftPct + widthPct * 0.5);
  return { leftPct, widthPct, centerPct };
}

export function ExperienceTimeline({
  selectedRoleId,
  onSelectRole,
  highlighted,
}: ExperienceTimelineProps) {
  const activeRole =
    PORTFOLIO.experience.find((e) => e.id === selectedRoleId) ?? PORTFOLIO.experience[0];
  const { centerPct: playheadPct } = getClipMetrics(activeRole);

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="py-24 md:py-32 border-t border-[#2B303B]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <h2
            id="experience-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#EFF0F1]"
          >
            Experience
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-xs text-[#9499A3] telemetry-nums">
              MULTITRACK TIMELINE · 2024 — 2026
            </span>
            <a
              href={PORTFOLIO.person.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hud-btn inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#EFF0F1] hover:border-[#FF9F38]"
            >
              <FileText className="w-3.5 h-3.5 text-[#FF9F38]" />
              <span>Resume</span>
              <ArrowUpRight className="w-3 h-3 text-[#9499A3]" />
            </a>
          </div>
        </div>

        {/* Desktop DAW-style multitrack view */}
        <div
          className={cn(
            "hidden md:block bg-[#1A1D23] border border-[#2B303B] overflow-hidden",
            highlighted && "target-locked"
          )}
        >
          {/* Ruler row */}
          <div className="grid grid-cols-[210px_1fr] border-b border-[#2B303B] bg-[#14171D]">
            <div className="px-4 py-3 font-mono text-xs text-[#9499A3] border-r border-[#2B303B]">
              TRACK / ORG
            </div>
            <div className="grid grid-cols-3 font-mono text-xs text-[#9499A3] telemetry-nums">
              <div className="px-3 py-3 border-r border-[#2B303B]">2024</div>
              <div className="px-3 py-3 border-r border-[#2B303B]">2025</div>
              <div className="px-3 py-3">2026</div>
            </div>
          </div>

          {/* Tracks + animated playhead */}
          <div className="relative signal-grid">
            {/* Playhead overlay aligned to timeline columns */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 left-[210px] right-0 z-20"
            >
              <div
                className="absolute top-0 bottom-0 w-px bg-[#FF5A1F] transition-[left] duration-500 ease-out"
                style={{ left: `${playheadPct}%` }}
              >
                <div className="w-2.5 h-2.5 -translate-x-[4.5px] -translate-y-1 bg-[#FF5A1F] rotate-45" />
              </div>
            </div>

            {PORTFOLIO.experience.map((entry) => {
              const { leftPct, widthPct } = getClipMetrics(entry);
              const isSelected = entry.id === activeRole.id;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "grid grid-cols-[210px_1fr] border-b border-[#2B303B] last:border-b-0 transition-colors",
                    isSelected ? "bg-[#22262E]/90" : "hover:bg-[#22262E]/40"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectRole(entry.id)}
                    className="px-4 py-3.5 text-left border-r border-[#2B303B] font-mono text-xs cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className={isSelected ? "text-[#EFF0F1] font-medium" : "text-[#9499A3]"}>
                      {entry.trackLabel}
                    </span>
                    {entry.current && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#38D9A9]"
                        title="Current role"
                      />
                    )}
                  </button>

                  <div className="relative py-2.5 px-2">
                    <button
                      type="button"
                      onClick={() => onSelectRole(entry.id)}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className={cn(
                        "group relative h-8 px-3 border text-left text-xs font-medium truncate transition-colors cursor-pointer flex items-center gap-2",
                        isSelected
                          ? "daw-clip-active border-[#38D9A9] bg-[#38D9A9]/15 text-[#EFF0F1]"
                          : "border-[#3B4252] bg-[#161920] text-[#C4C8D0] hover:border-[#FF9F38] hover:text-[#EFF0F1]"
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="truncate">{entry.role}</span>
                      <span
                        className={cn(
                          "ml-auto shrink-0 inline-flex items-center gap-[2px] h-4",
                          isSelected
                            ? "text-[#38D9A9]"
                            : "text-[#9499A3]/60 group-hover:text-[#FF9F38]"
                        )}
                        aria-hidden="true"
                      >
                        {[0.55, 0.95, 0.4, 0.85, 0.65, 1, 0.5, 0.8, 0.45].map((h, barIdx) => (
                          <span
                            key={barIdx}
                            className="daw-wave-bar w-[2px] bg-current rounded-none"
                            style={{
                              height: `${Math.round(h * 14)}px`,
                              animationDelay: `${barIdx * 70}ms`,
                            }}
                          />
                        ))}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical timeline list */}
        <div className="md:hidden space-y-2">
          {PORTFOLIO.experience.map((entry) => {
            const isSelected = entry.id === activeRole.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelectRole(entry.id)}
                className={cn(
                  "w-full text-left p-4 border transition-colors cursor-pointer",
                  isSelected
                    ? "border-[#38D9A9] bg-[#22262E]"
                    : "border-[#2B303B] bg-[#1A1D23]"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#EFF0F1]">{entry.company}</span>
                  <span className="font-mono text-xs text-[#9499A3] telemetry-nums">
                    {entry.period}
                  </span>
                </div>
                <div className="text-sm text-[#C4C8D0] mt-1">{entry.role}</div>
              </button>
            );
          })}
        </div>

        {/* Active role detail strip */}
        <div className="mt-4 bg-[#14171D] border border-[#2B303B] p-6 md:p-8 grid lg:grid-cols-[1fr_1.4fr] gap-6">
          <div>
            <div className="font-mono text-xs text-[#FF9F38] telemetry-nums">
              {activeRole.period} · {activeRole.location}
            </div>
            <h3 className="font-serif text-2xl md:text-3xl text-[#EFF0F1] mt-2">
              {activeRole.company}
            </h3>
            <p className="text-sm font-medium text-[#38D9A9] mt-1">{activeRole.role}</p>
            <p className="text-sm text-[#C4C8D0] mt-3 leading-relaxed max-w-[55ch]">
              {activeRole.summary}
            </p>
          </div>
          <ul className="space-y-3 text-sm text-[#C4C8D0] self-center">
            {activeRole.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 bg-[#FF5A1F] shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Education & certifications strip */}
        <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-[#1A1D23] border border-[#2B303B] p-5">
            <div className="font-mono text-xs text-[#9499A3]">EDUCATION</div>
            <div className="text-[#EFF0F1] font-semibold mt-1.5">
              {PORTFOLIO.person.education.degree}
            </div>
            <div className="text-[#C4C8D0] mt-0.5">{PORTFOLIO.person.education.institution}</div>
            <div className="font-mono text-xs text-[#9499A3] mt-1.5 telemetry-nums">
              {PORTFOLIO.person.education.period}
            </div>
          </div>
          <div className="bg-[#1A1D23] border border-[#2B303B] p-5">
            <div className="font-mono text-xs text-[#9499A3]">CERTIFICATIONS</div>
            <ul className="mt-2 space-y-1 text-[#C4C8D0]">
              {PORTFOLIO.person.certifications.map((cert) => (
                <li key={cert}>{cert}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
