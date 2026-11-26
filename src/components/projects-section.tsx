"use client";

import { ArrowRight, ArrowUpRight, BookOpen, Layers } from "lucide-react";
import { OpenCallsTopology } from "@/components/opencalls-topology";
import { PORTFOLIO, type PortfolioProject } from "@/data/portfolio";
import type { HighlightTarget, ProjectId, ProjectTab } from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

interface ProjectsSectionProps {
  onOpenProject: (projectId: ProjectId, tab?: ProjectTab) => void;
  highlightedTarget: HighlightTarget | null;
}

export function ProjectsSection({
  onOpenProject,
  highlightedTarget,
}: ProjectsSectionProps) {
  const flagship = PORTFOLIO.projects.find((p) => p.flagship) ?? PORTFOLIO.projects[0];
  const indexProjects = PORTFOLIO.projects.filter((p) => p.id !== flagship.id);

  const isHighlighted = (project: PortfolioProject) => {
    if (!highlightedTarget) return false;
    if (highlightedTarget === project.id) return true;
    if (highlightedTarget === "active-projects" && project.status === "active") return true;
    return false;
  };

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="py-24 md:py-32 border-t border-[#2B303B]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <h2
            id="projects-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#EFF0F1]"
          >
            Selected Systems &amp; Ventures
          </h2>
          <p className="text-sm text-[#9499A3] max-w-sm">
            Select any system to open its Stage Panel, or ask the voice representative to walk
            through its architecture.
          </p>
        </div>

        {/* Flagship OpenCalls full-width editorial showcase */}
        <article
          className={cn(
            "bg-[#1A1D23] border border-[#2B303B] p-6 md:p-10 transition-colors",
            isHighlighted(flagship) && "target-locked"
          )}
        >
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-12 items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 text-[#38D9A9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38D9A9]" />
                  ACTIVE FLAGSHIP
                </span>
                <span className="text-[#9499A3]">{flagship.year}</span>
                <span className="text-[#9499A3]">{flagship.locationOrContext}</span>
              </div>

              <h3 className="font-serif text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#EFF0F1]">
                {flagship.name}
              </h3>

              <p className="text-lg text-[#EFF0F1]/90 leading-relaxed max-w-[60ch]">
                {flagship.tagline}
              </p>

              <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[65ch]">
                {flagship.overview}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {flagship.stack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-xs px-2.5 py-1 bg-[#121418] border border-[#2B303B] text-[#C4C8D0]"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onOpenProject("opencalls", "overview")}
                  className="hud-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5A1F] text-[#121418] font-semibold text-sm hover:bg-[#ff6d38] cursor-pointer"
                >
                  <span>Open case study</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenProject("opencalls", "architecture")}
                  className="hud-btn inline-flex items-center gap-2 px-5 py-2.5 bg-[#121418] border border-[#3B4252] text-[#EFF0F1] text-sm hover:border-[#FF9F38] cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#38D9A9]" />
                  <span>Inspect architecture</span>
                </button>
                {flagship.liveUrl && (
                  <a
                    href={flagship.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hud-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#121418] border border-[#38D9A9]/45 text-[#38D9A9] text-sm hover:border-[#38D9A9]"
                  >
                    <span>Visit {flagship.liveLabel ?? "live site"}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
                {flagship.articleUrl && (
                  <a
                    href={flagship.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hud-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#121418] border border-[#2B303B] text-[#C4C8D0] text-sm hover:text-[#EFF0F1] hover:border-[#FF9F38]"
                  >
                    <BookOpen className="w-4 h-4 text-[#FF9F38]" />
                    <span>{flagship.articleLabel ?? "Architecture post"}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Interactive Dual-Plane Systems Topology Simulator */}
            <OpenCallsTopology />
          </div>
        </article>

        {/* Index rows for remaining real projects */}
        <div className="mt-10 border-y border-[#2B303B] divide-y divide-[#2B303B]">
          {indexProjects.map((project) => (
            <div
              key={project.id}
              className={cn(
                "w-full py-6 px-4 md:px-6 grid md:grid-cols-[1.4fr_1fr_auto_auto] gap-3 md:gap-6 items-center hover:bg-[#1A1D23] transition-colors group",
                isHighlighted(project) && "target-locked"
              )}
            >
              <button
                type="button"
                onClick={() => onOpenProject(project.id, "overview")}
                className="text-left cursor-pointer"
              >
                <div className="font-serif text-2xl text-[#EFF0F1] group-hover:text-[#FF9F38] transition-colors">
                  {project.name}
                </div>
                <p className="text-sm text-[#C4C8D0] mt-1 max-w-[54ch]">{project.tagline}</p>
              </button>
              <div className="text-xs font-mono text-[#9499A3]">{project.category}</div>
              <div className="flex items-center gap-3 font-mono text-xs telemetry-nums">
                <span className="text-[#9499A3]">{project.year}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 border",
                    project.status === "active"
                      ? "border-[#38D9A9]/40 text-[#38D9A9]"
                      : "border-[#2B303B] text-[#9499A3]"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      project.status === "active" ? "bg-[#38D9A9]" : "bg-[#9499A3]"
                    )}
                  />
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-start md:justify-end">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hud-btn inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#121418] border border-[#38D9A9]/45 font-mono text-xs text-[#38D9A9] hover:border-[#38D9A9]"
                  >
                    <span>{project.liveLabel ?? "Live"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onOpenProject(project.id, "overview")}
                  aria-label={`Open ${project.name} case study`}
                  className="hud-btn p-2 bg-[#121418] border border-[#2B303B] text-[#9499A3] hover:text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
