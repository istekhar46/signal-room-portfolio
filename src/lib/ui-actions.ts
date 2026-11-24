import { z } from "zod";

export const SectionIdSchema = z.enum([
  "hero",
  "about",
  "voice-lab",
  "projects",
  "writing",
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

export const ArticleIdSchema = z.enum([
  "inside-opencalls",
  "observability-signoz",
  "celery-rabbitmq-redis",
  "voice-agents-pain-points",
  "redis-lua-idempotency",
  "architecting-voice-agents",
]);

export const HighlightTargetSchema = z.enum([
  "active-projects",
  "opencalls",
  "invoiceo",
  "ruh-ai-voice",
  "voice-pipeline",
  "writing-notes",
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
    name: z.literal("open_writing_panel"),
    args: z.object({
      articleId: ArticleIdSchema.optional(),
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
export type ArticleId = z.infer<typeof ArticleIdSchema>;
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
  payload?: string;
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

export const AgentPersonaSchema = z.enum(["representative", "architect", "opencalls-demo"]);
export type AgentPersonaId = z.infer<typeof AgentPersonaSchema>;

export const AgentVoiceSchema = z.enum(["sarah", "alice", "bella"]);
export type AgentVoiceKey = z.infer<typeof AgentVoiceSchema>;

export const AGENT_VOICES: {
  key: AgentVoiceKey;
  label: string;
  tone: string;
  voiceId: string;
}[] = [
  {
    key: "sarah",
    label: "Sarah",
    tone: "Confident · Warm",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
  },
  {
    key: "alice",
    label: "Alice",
    tone: "Crisp · Editorial",
    voiceId: "Xb7hH8MSUJpSbSDYk0k2",
  },
  {
    key: "bella",
    label: "Bella",
    tone: "Bright · Natural",
    voiceId: "hpp4J3VqNfWAUOO0d1Us",
  },
];

export const AGENT_PERSONAS: {
  id: AgentPersonaId;
  label: string;
  badge: string;
  description: string;
  prompts: string[];
}[] = [
  {
    id: "representative",
    label: "Portfolio Rep",
    badge: "PORTFOLIO REP",
    description: "Guided walkthrough of Istekhar's projects, articles, and experience.",
    prompts: [
      "What is OpenCalls?",
      "How does OpenCalls' architecture work?",
      "His voice AI stack?",
      "Show his engineering articles",
    ],
  },
  {
    id: "architect",
    label: "Systems Architect",
    badge: "SYSTEMS ARCHITECT",
    description: "Deep technical Q&A on gRPC control planes, LiveKit, Redis Lua, and latency.",
    prompts: [
      "Why split OpenCalls into two planes?",
      "How did he solve Redis Lua idempotency?",
      "How does he measure voice latency?",
      "Explain Celery + RabbitMQ agent scaling",
    ],
  },
  {
    id: "opencalls-demo",
    label: "OpenCalls Demo",
    badge: "OPENCALLS LIVE DEMO",
    description: "Test-drive an OpenCalls-style live AI receptionist handling a simulated call.",
    prompts: [
      "Hi, I want to book a demo call for my sales team",
      "Can you qualify inbound phone leads 24/7?",
      "How fast do you handle interruptions?",
    ],
  },
];

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
    case "open_writing_panel":
      return action.args.articleId
        ? `open_writing_panel("${action.args.articleId}")`
        : `open_writing_panel()`;
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
