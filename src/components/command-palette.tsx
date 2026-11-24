"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Code2,
  Copy,
  FileText,
  Layers,
  Mic,
  Radio,
  Search,
  Terminal,
  X,
} from "lucide-react";
import { PORTFOLIO } from "@/data/portfolio";
import { cn } from "@/lib/utils";

export interface CommandItem {
  id: string;
  group: "Voice & Quick Actions" | "Sections" | "Projects" | "Engineering Writing" | "External Links";
  label: string;
  hint?: string;
  keywords: string;
  icon: "mic" | "layers" | "radio" | "briefcase" | "book" | "code" | "copy" | "file" | "external" | "terminal";
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

function renderIcon(icon: CommandItem["icon"]) {
  const cls = "w-4 h-4 shrink-0";
  switch (icon) {
    case "mic":
      return <Mic className={cn(cls, "text-[#FF5A1F]")} />;
    case "layers":
      return <Layers className={cn(cls, "text-[#FF9F38]")} />;
    case "radio":
      return <Radio className={cn(cls, "text-[#38D9A9]")} />;
    case "briefcase":
      return <Briefcase className={cn(cls, "text-[#FF9F38]")} />;
    case "book":
      return <BookOpen className={cn(cls, "text-[#38D9A9]")} />;
    case "code":
      return <Code2 className={cn(cls, "text-[#C4C8D0]")} />;
    case "copy":
      return <Copy className={cn(cls, "text-[#C4C8D0]")} />;
    case "file":
      return <FileText className={cn(cls, "text-[#FF9F38]")} />;
    case "external":
      return <ArrowUpRight className={cn(cls, "text-[#9499A3]")} />;
    case "terminal":
      return <Terminal className={cn(cls, "text-[#38D9A9]")} />;
  }
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) =>
          filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length
        );
      } else if (e.key === "Enter" && filtered[activeIndex]) {
        e.preventDefault();
        filtered[activeIndex].run();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered, onClose, open]);

  const groups = useMemo(() => {
    const order: CommandItem["group"][] = [
      "Voice & Quick Actions",
      "Projects",
      "Engineering Writing",
      "Sections",
      "External Links",
    ];
    return order
      .map((group) => ({
        group,
        entries: filtered.filter((item) => item.group === group),
      }))
      .filter((g) => g.entries.length > 0);
  }, [filtered]);

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
            className="fixed inset-0 bg-[#08090C]/75"
          />

          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[11vh] px-4 pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Signal Room command launcher"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -10 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="hud-frame pointer-events-auto relative w-full max-w-2xl bg-[#161920] border border-[#3B4252] overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#2B303B] bg-[#121418]">
                <Search className="w-4 h-4 text-[#FF9F38] shrink-0" />
                <label htmlFor="command-palette-input" className="sr-only">
                  Search Signal Room commands, projects, and articles
                </label>
                <input
                  ref={inputRef}
                  id="command-palette-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Jump to OpenCalls, articles, resume, or voice mode… (${PORTFOLIO.person.brandMark})`}
                  className="flex-1 bg-transparent text-sm text-[#EFF0F1] placeholder:text-[#9499A3] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close command launcher"
                  className="px-2 py-1 border border-[#2B303B] bg-[#1A1D23] font-mono text-[11px] text-[#9499A3] hover:text-[#EFF0F1] inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>ESC</span>
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="max-h-[58vh] overflow-y-auto py-2">
                {groups.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-[#9499A3]">
                    No matching commands for &ldquo;{query}&rdquo;.
                  </div>
                ) : (
                  groups.map(({ group, entries }) => (
                    <div key={group} className="mb-2 last:mb-0">
                      <div className="px-4 py-1.5 font-mono text-[11px] text-[#9499A3] tracking-wider">
                        {group.toUpperCase()}
                      </div>
                      {entries.map((item) => {
                        const flatIdx = filtered.indexOf(item);
                        const isActive = flatIdx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            onClick={() => {
                              item.run();
                              onClose();
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left text-sm transition-colors cursor-pointer",
                              isActive
                                ? "bg-[#FF9F38]/12 text-[#EFF0F1]"
                                : "text-[#C4C8D0] hover:bg-[#1A1D23]"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {renderIcon(item.icon)}
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.hint && (
                              <span className="font-mono text-[11px] text-[#9499A3] shrink-0">
                                {item.hint}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 border-t border-[#2B303B] bg-[#111318] flex items-center justify-between font-mono text-[11px] text-[#9499A3]">
                <span>↑↓ Navigate · ↵ Execute · ESC Close</span>
                <span>⌘K / CTRL+K</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
