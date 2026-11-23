import { z } from "zod";

export const SectionIdSchema = z.enum([
  "hero",
  "about",
  "voice-lab",
  "projects",
  "experience",
  "stack",
  "contact",
]);

export const ProjectIdSchema = z.enum(["opencalls", "invoiceo", "ruh-ai-voice"]);

export const ProjectTabSchema = z.enum([
  "overview",
  "problem",
  "architecture",
  "decisions",
  "stack",
  "contributions",
]);

export const RoleIdSchema = z.enum([
  "opencalls",
  "invoiceo",
  "ruh-ai",
  "rapid-innovation",
  "unbundl",
  "auralapp",
]);

export const VoiceTopicSchema = z.enum([
  "pipeline",
  "vad",
  "stt",
  "llm",
  "tts",
  "webrtc",
  "sip",
  "telephony",
  "latency",
  "tools",
]);

export const HighlightTargetSchema = z.enum([
  "active-projects",
  "opencalls",
  "invoiceo",
  "ruh-ai-voice",
  "voice-pipeline",
  "experience-current",
  "contact-email",
]);

export const UiActionSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("navigate_to_section"),
    args: z.object({ section: SectionIdSchema }),
  }),
  z.object({
    name: z.literal("open_project"),
    args: z.object({
      projectId: ProjectIdSchema,
      tab: ProjectTabSchema.optional(),
    }),
  }),
  z.object({
    name: z.literal("open_experience_panel"),
    args: z.object({
      roleId: RoleIdSchema.optional(),
    }),
  }),
  z.object({
    name: z.literal("open_skill_explorer"),
    args: z.object({
      topic: VoiceTopicSchema.optional(),
    }),
  }),
  z.object({
    name: z.literal("show_architecture"),
    args: z.object({
      projectId: ProjectIdSchema,
    }),
  }),
  z.object({
    name: z.literal("open_contact_panel"),
    args: z.object({}).default({}),
  }),
  z.object({
    name: z.literal("highlight_content"),
    args: z.object({
      targetId: HighlightTargetSchema,
    }),
  }),
  z.object({
    name: z.literal("close_active_panel"),
    args: z.object({}).default({}),
  }),
  z.object({
    name: z.literal("end_voice_session"),
    args: z
      .object({
        reason: z.string().max(120).optional(),
      })
      .default({}),
  }),
]);

export type UiAction = z.infer<typeof UiActionSchema>;
export type SectionId = z.infer<typeof SectionIdSchema>;
export type ProjectId = z.infer<typeof ProjectIdSchema>;
export type ProjectTab = z.infer<typeof ProjectTabSchema>;
export type RoleId = z.infer<typeof RoleIdSchema>;
export type HighlightTarget = z.infer<typeof HighlightTargetSchema>;

export interface TurnLatencyMetrics {
  vadMs?: number;
  sttMs?: number;
  llmTtftMs?: number;
  ttsTtfbMs?: number;
  totalMs?: number;
  measuredAt: number;
}

export interface SignalTraceEntry {
  id: string;
  timestamp: number;
  actionLabel: string;
  ok: boolean;
  error?: string;
  metrics?: TurnLatencyMetrics;
}

export type AgentVisualState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "executing"
  | "speaking"
  | "offline";

export function formatActionSignature(action: UiAction): string {
  switch (action.name) {
    case "navigate_to_section":
      return `navigate_to_section("${action.args.section}")`;
    case "open_project":
      return action.args.tab
        ? `open_project("${action.args.projectId}", tab="${action.args.tab}")`
        : `open_project("${action.args.projectId}")`;
    case "open_experience_panel":
      return action.args.roleId
        ? `open_experience_panel("${action.args.roleId}")`
        : `open_experience_panel()`;
    case "open_skill_explorer":
      return action.args.topic
        ? `open_skill_explorer("${action.args.topic}")`
        : `open_skill_explorer()`;
    case "show_architecture":
      return `show_architecture("${action.args.projectId}")`;
    case "open_contact_panel":
      return `open_contact_panel()`;
    case "highlight_content":
      return `highlight_content("${action.args.targetId}")`;
    case "close_active_panel":
      return `close_active_panel()`;
    case "end_voice_session":
      return action.args.reason
        ? `end_voice_session("${action.args.reason}")`
        : `end_voice_session()`;
  }
}
