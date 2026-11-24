"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpen, MessageSquare } from "lucide-react";
import { PORTFOLIO, type EngineeringArticle } from "@/data/portfolio";
import type { ArticleId } from "@/lib/ui-actions";
import { cn } from "@/lib/utils";

interface WritingSectionProps {
  onOpenArticle: (articleId: ArticleId) => void;
  onAskAbout: (prompt: string) => void;
  highlighted: boolean;
}

type CategoryFilter = "All" | EngineeringArticle["category"];
const FILTERS: CategoryFilter[] = ["All", "Voice Systems", "Distributed Systems", "Observability"];

export function WritingSection({
  onOpenArticle,
  onAskAbout,
  highlighted,
}: WritingSectionProps) {
  const [filter, setFilter] = useState<CategoryFilter>("All");

  const featured = PORTFOLIO.articles.find((a) => a.featured) ?? PORTFOLIO.articles[0];
  const filteredArticles = PORTFOLIO.articles.filter((a) => {
    if (filter === "All") return a.id !== featured.id;
    return a.category === filter;
  });

  return (
    <section
      id="writing"
      aria-labelledby="writing-heading"
      className="py-24 md:py-32 border-t border-[#2B303B]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2
              id="writing-heading"
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-[-0.02em] text-[#EFF0F1]"
            >
              Engineering Writing
            </h2>
            <p className="text-sm text-[#C4C8D0] mt-3 max-w-[58ch]">
              Field notes on real-time voice pipelines, distributed gRPC control planes, Redis
              concurrency, and production observability.
            </p>
          </div>

          <a
            href={PORTFOLIO.person.medium}
            target="_blank"
            rel="noopener noreferrer"
            className="hud-btn inline-flex items-center gap-2 px-4 py-2 bg-[#1A1D23] border border-[#2B303B] font-mono text-xs text-[#EFF0F1] hover:border-[#FF9F38] shrink-0 self-start md:self-auto"
          >
            <span>All articles on Medium</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#FF9F38]" />
          </a>
        </div>

        {/* Featured architecture essay */}
        <article
          className={cn(
            "bg-[#1A1D23] border border-[#2B303B] p-6 md:p-9 transition-colors",
            highlighted && "target-locked"
          )}
        >
          <div className="grid lg:grid-cols-[1.25fr_0.95fr] gap-8 items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs telemetry-nums">
                <span className="inline-flex items-center gap-1.5 text-[#FF9F38]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F38]" />
                  FEATURED DEEP-DIVE
                </span>
                <span className="text-[#9499A3]">{featured.date}</span>
                <span className="text-[#38D9A9]">{featured.category}</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-[#EFF0F1] leading-snug">
                {featured.title}
              </h3>

              <p className="text-sm text-[#C4C8D0] leading-relaxed max-w-[65ch]">
                {featured.summary}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-xs px-2.5 py-1 bg-[#121418] border border-[#2B303B] text-[#C4C8D0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={featured.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hud-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF5A1F] text-[#121418] font-semibold text-sm hover:bg-[#ff6d38]"
                >
                  <span>Read on Medium</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => onOpenArticle(featured.id)}
                  className="hud-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#121418] border border-[#3B4252] text-[#EFF0F1] text-sm hover:border-[#FF9F38] cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#FF9F38]" />
                  <span>Open briefing HUD</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onAskAbout(
                      `Summarize Istekhar's article "${featured.title}" and explain how OpenCalls separates its control plane from LiveKit.`
                    )
                  }
                  className="hud-btn inline-flex items-center gap-2 px-4 py-2.5 bg-[#121418] border border-[#2B303B] text-[#38D9A9] text-sm hover:border-[#38D9A9] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>

            <div className="bg-[#121418] border border-[#2B303B] p-5 md:p-6 space-y-4">
              <div className="font-mono text-xs text-[#9499A3] pb-3 border-b border-[#2B303B]">
                KEY ARCHITECTURAL TAKEAWAYS
              </div>
              <ul className="space-y-3 text-sm text-[#C4C8D0]">
                {featured.takeaways.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span className="mt-2 w-1.5 h-1.5 bg-[#38D9A9] shrink-0" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        {/* Category filter bar */}
        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-4 pb-4"
          role="tablist"
          aria-label="Filter engineering articles by topic"
        >
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((cat) => {
              const active = filter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "hud-btn font-mono text-xs px-3 py-1.5 border cursor-pointer",
                    active
                      ? "border-[#FF9F38] bg-[#FF9F38]/14 text-[#EFF0F1]"
                      : "border-[#2B303B] bg-[#1A1D23] text-[#9499A3] hover:text-[#EFF0F1]"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <span className="font-mono text-xs text-[#9499A3] telemetry-nums">
            {PORTFOLIO.articles.length} PUBLISHED NOTES
          </span>
        </div>

        {/* Editorial hairline index of articles */}
        <div className="border-y border-[#2B303B] divide-y divide-[#2B303B]">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="py-5 px-3 md:px-5 grid md:grid-cols-[1fr_auto_auto] gap-4 items-center hover:bg-[#1A1D23]/70 transition-colors"
            >
              <button
                type="button"
                onClick={() => onOpenArticle(article.id)}
                className="text-left group cursor-pointer"
              >
                <div className="font-serif text-xl md:text-2xl text-[#EFF0F1] group-hover:text-[#FF9F38] transition-colors">
                  {article.title}
                </div>
                <p className="text-sm text-[#C4C8D0] mt-1.5 max-w-[68ch] line-clamp-2">
                  {article.summary}
                </p>
              </button>

              <div className="flex items-center gap-3 font-mono text-xs telemetry-nums">
                <span className="px-2 py-0.5 bg-[#1A1D23] border border-[#2B303B] text-[#38D9A9]">
                  {article.category}
                </span>
                <span className="text-[#9499A3]">{article.date}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenArticle(article.id)}
                  className="hud-btn px-3 py-1.5 bg-[#121418] border border-[#2B303B] font-mono text-xs text-[#C4C8D0] hover:text-[#EFF0F1] hover:border-[#FF9F38] cursor-pointer"
                >
                  Briefing
                </button>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read ${article.title} on Medium`}
                  className="hud-btn p-2 bg-[#121418] border border-[#2B303B] text-[#C4C8D0] hover:text-[#FF5A1F] hover:border-[#FF5A1F]"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
