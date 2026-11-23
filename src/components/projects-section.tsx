"use client";

import { ArrowRight, ArrowUpRight, Layers } from "lucide-react";
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
      className="py-24 md:py-32 border-t border-[#232934]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <h2
            id="projects-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#F2EFE9]"
          >
            Selected Systems &amp; Ventures
          </h2>
          <p className="text-sm text-[#8B939E] max-w-sm">
            Select any system to open its Stage Panel — or ask the voice representative to walk
            through its architecture.
          </p>
        </div>

        {/* Flagship OpenCalls full-width editorial showcase */}
        <article
          className={cn(
            "bg-[#12161C] border border-[#232934] p-6 md:p-10 transition-colors",
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
                <span className="text-[#8B939E]">{flagship.year}</span>
                <span className="text-[#8B939E]">{flagship.locationOrContext}</span>
              </div>

              <h3 className="font-serif text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#F2EFE9]">
                {flagship.name}
              </h3>

              <p className="text-lg text-[#F2EFE9]/90 leading-relaxed max-w-[60ch]">
                {flagship.tagline}
              </p>

              <p className="text-sm text-[#B8BFC9] leading-relaxed max-w-[65ch]">
                {flagship.overview}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {flagship.stack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-xs px-2.5 py-1 bg-[#0B0D10] border border-[#232934] text-[#B8BFC9]"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => onOpenProject("opencalls", "overview")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF5A1F] text-[#0B0D10] font-semibold text-sm hover:bg-[#ff6d38] transition-colors cursor-pointer"
                >
                  <span>Open case study</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenProject("opencalls", "architecture")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B0D10] border border-[#323B49] text-[#F2EFE9] text-sm hover:border-[#F2EFE9] transition-colors cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#38D9A9]" />
                  <span>Inspect architecture</span>
                </button>
              </div>
            </div>

            {/* Live animated call-flow architecture preview */}
            <div className="bg-[#0B0D10] border border-[#232934] p-5 md:p-6 signal-grid">
              <div className="flex items-center justify-between text-xs font-mono text-[#8B939E] pb-4 mb-5 border-b border-[#232934]">
                <span>OPENCALLS // REAL-TIME VOICE PATH</span>
                <span className="text-[#38D9A9]">FULL-DUPLEX</span>
              </div>

              <div className="space-y-3">
                {flagship.architectureNodes.map((node, idx) => (
                  <div key={node.id} className="relative">
                    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[#12161C] border border-[#232934]">
                      <div>
                        <div className="font-mono text-xs font-medium text-[#F2EFE9]">
                          {node.label}
                        </div>
                        <div className="text-xs text-[#8B939E] mt-0.5">{node.detail}</div>
                      </div>
                      <span className="font-mono text-xs text-[#8B939E] shrink-0">
                        {node.sublabel}
                      </span>
                    </div>
                    {idx < flagship.architectureNodes.length - 1 && (
                      <div className="flex justify-center py-1" aria-hidden="true">
                        <div className="w-px h-3 bg-[#FF5A1F]/70" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Index rows for remaining real projects (not generic cards) */}
        <div className="mt-10 border-y border-[#232934] divide-y divide-[#232934]">
          {indexProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenProject(project.id, "overview")}
              className={cn(
                "w-full text-left py-6 px-4 md:px-6 grid md:grid-cols-[1.4fr_1fr_auto_auto] gap-3 md:gap-6 items-center hover:bg-[#12161C] transition-colors cursor-pointer group",
                isHighlighted(project) && "target-locked"
              )}
            >
              <div>
                <div className="font-serif text-2xl text-[#F2EFE9] group-hover:text-[#FF5A1F] transition-colors">
                  {project.name}
                </div>
                <p className="text-sm text-[#B8BFC9] mt-1 max-w-[54ch]">{project.tagline}</p>
              </div>
              <div className="text-xs font-mono text-[#8B939E]">{project.category}</div>
              <div className="flex items-center gap-3 font-mono text-xs telemetry-nums">
                <span className="text-[#8B939E]">{project.year}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 border",
                    project.status === "active"
                      ? "border-[#38D9A9]/40 text-[#38D9A9]"
                      : "border-[#232934] text-[#8B939E]"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      project.status === "active" ? "bg-[#38D9A9]" : "bg-[#8B939E]"
                    )}
                  />
                  {project.status}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8B939E] group-hover:text-[#F2EFE9] group-hover:translate-x-1 transition-all hidden md:block" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
