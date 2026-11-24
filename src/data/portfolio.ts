export type ProjectStatus = "active" | "shipped";

export interface ArchitectureNode {
  id: string;
  label: string;
  sublabel: string;
  detail: string;
}

export interface PortfolioProject {
  id: "opencalls" | "invoiceo" | "ruh-ai-voice";
  name: string;
  tagline: string;
  category: string;
  year: string;
  status: ProjectStatus;
  flagship?: boolean;
  overview: string;
  problem: string;
  architectureSummary: string;
  architectureNodes: ArchitectureNode[];
  decisions: { title: string; detail: string }[];
  contributions: string[];
  stack: string[];
  locationOrContext: string;
  liveUrl?: string;
  liveLabel?: string;
  articleUrl?: string;
  articleLabel?: string;
  repoUrl?: string;
}

export interface ExperienceEntry {
  id: "opencalls" | "invoiceo" | "ruh-ai" | "rapid-innovation" | "unbundl" | "auralapp";
  company: string;
  role: string;
  period: string;
  startYear: number;
  startMonth: number; // 1-12
  endYear: number;
  endMonth: number;
  current?: boolean;
  location: string;
  summary: string;
  highlights: string[];
  trackLabel: string;
}

export type VoiceTopicId =
  | "pipeline"
  | "vad"
  | "stt"
  | "llm"
  | "tts"
  | "webrtc"
  | "sip"
  | "telephony"
  | "latency"
  | "tools";

export interface VoicePipelineTopic {
  id: VoiceTopicId;
  shortLabel: string;
  title: string;
  stageOrder?: number;
  summary: string;
  engineeringFocus: string[];
  stackUsed: string[];
}

export interface EngineeringArticle {
  id:
    | "inside-opencalls"
    | "observability-signoz"
    | "celery-rabbitmq-redis"
    | "voice-agents-pain-points"
    | "redis-lua-idempotency"
    | "architecting-voice-agents";
  title: string;
  date: string;
  category: "Voice Systems" | "Distributed Systems" | "Observability";
  summary: string;
  takeaways: string[];
  tags: string[];
  url: string;
  featured?: boolean;
}

export interface StackCategory {
  id: string;
  name: string;
  items: {
    name: string;
    projectIds: PortfolioProject["id"][];
  }[];
}

export const PORTFOLIO = {
  person: {
    name: "Istekhar Khan",
    monogram: "IK",
    brandMark: "SIGNAL ROOM",
    role: "Voice AI & Full-Stack AI Engineer",
    currentHeadline: "Founder at OpenCalls",
    heroHeadline: "Engineering Intelligence Into Conversations.",
    heroSubcopy:
      "Voice AI Engineer building production telephony & WebRTC voice agents, distributed gRPC control planes, and full-stack AI systems.",
    location: "Delhi & Pune, India",
    email: "istekharkhan46@gmail.com",
    linkedin: "https://www.linkedin.com/in/istekhar46",
    github: "https://github.com/istekhar46",
    twitter: "https://x.com/istekharkhan46",
    medium: "https://medium.com/@istekharkhan46",
    resumeUrl:
      "https://drive.google.com/file/d/1us-TqPQcdhfOMK8W26gLw6LoGRYikV63/view?usp=sharing",
    currentResearch: "STFT & custom TTS model internals",
    education: {
      institution: "Dr. A.P.J. Abdul Kalam Technical University",
      degree: "B.Tech, Computer Science",
      period: "March 2020 – July 2024",
    },
    certifications: [
      "Bitcoin Enterprise Course Certificate",
      "C++ Programming Essentials Bootcamp",
      "Web Development Internship",
    ],
  },

  about: {
    statement:
      "Voice is the highest-bandwidth human interface — when latency drops and system boundaries stay clean, software stops feeling like forms and starts acting like a collaborator.",
    bio: "I'm Istekhar Khan, Founder at OpenCalls and former Founding Engineer at RUH AI. I architect and ship production voice AI platforms — separating real-time LiveKit speech execution from durable gRPC microservices, Redis concurrency controls, and OpenTelemetry observability — alongside full-stack engineering in Next.js, NestJS, PostgreSQL, and GraphQL.",
    specializations: [
      {
        title: "Real-Time Voice Execution",
        detail:
          "Production voice agents over SIP telephony and WebRTC (LiveKit, Vocode) engineered for low-latency streaming VAD, STT, LLM orchestration, ElevenLabs TTS, and natural barge-in.",
      },
      {
        title: "Distributed Control Planes",
        detail:
          "Protobuf gRPC service boundaries, Celery + RabbitMQ async queues, atomic Redis + Lua idempotency, RAG knowledge retrieval, and OpenTelemetry / SigNoz tracing.",
      },
      {
        title: "Full-Stack AI Products",
        detail:
          "End-to-end consoles, API gateways, and web workspaces built with Next.js, TypeScript, NestJS, PostgreSQL, and GraphQL.",
      },
    ],
  },

  starterPrompts: [
    "What is OpenCalls?",
    "How does OpenCalls' architecture work?",
    "His voice AI stack?",
    "Show his engineering articles",
  ],

  voiceTopics: [
    {
      id: "vad",
      shortLabel: "VAD",
      title: "Voice Activity Detection & Endpointing",
      stageOrder: 1,
      summary:
        "Detects speech boundaries in milliseconds so the agent knows when a caller starts talking, finishes a thought, or interrupts mid-sentence.",
      engineeringFocus: [
        "Low-latency speech onset detection to trigger instant barge-in and clear TTS audio buffers",
        "Turn-detection tuning so natural conversational pauses aren't misread as end-of-turn",
      ],
      stackUsed: ["Silero VAD", "LiveKit Turn Detector", "WebRTC Audio Tracks"],
    },
    {
      id: "stt",
      shortLabel: "STT",
      title: "Streaming Speech-to-Text",
      stageOrder: 2,
      summary:
        "Converts incoming audio frames into streaming partial and final transcripts while balancing transcription accuracy against first-token delay.",
      engineeringFocus: [
        "Streaming WebSocket audio ingestion with interim partials for responsive UI captions",
        "Clean handoff from endpointed transcripts into LLM context without redundant turns",
      ],
      stackUsed: ["Deepgram Nova-3", "Streaming STT", "LiveKit Agents", "Vocode"],
    },
    {
      id: "llm",
      shortLabel: "LLM + TOOLS",
      title: "LLM Orchestration & Structured Tool Calling",
      stageOrder: 3,
      summary:
        "Routes conversational intent, stays strictly grounded in verified context, and dispatches typed function tools without stalling spoken replies.",
      engineeringFocus: [
        "Keeping system context lean so time-to-first-token stays tight on every voice turn",
        "Strict schema-validated tool execution (RPC UI actions, knowledge retrieval, billing & CRM triggers) owned by code",
      ],
      stackUsed: ["LiveKit Agents", "LangChain", "AutoGen", "Function Tools"],
    },
    {
      id: "tts",
      shortLabel: "TTS",
      title: "Streaming Text-to-Speech Synthesis",
      stageOrder: 4,
      summary:
        "Streams natural, expressive speech synthesis chunk-by-chunk as soon as the first LLM clause is ready, with word-aligned captions.",
      engineeringFocus: [
        "ElevenLabs TTS plugin inside LiveKit with TTS-aligned transcription forwarding",
        "Immediate playback cancellation on user interruption so audio never talks over the caller",
      ],
      stackUsed: ["ElevenLabs TTS Plugin", "LiveKit Audio Stream", "STFT / Audio DSP"],
    },
    {
      id: "webrtc",
      shortLabel: "WEBRTC",
      title: "WebRTC Media Transport (LiveKit)",
      summary:
        "Sub-second full-duplex audio and structured RPC data channels directly between browser visitors and agent workers.",
      engineeringFocus: [
        "LiveKit SFU room architecture with scoped per-session access tokens",
        "Bidirectional RPC channels syncing agent tool calls to frontend UI state in real time",
      ],
      stackUsed: ["LiveKit", "WebRTC", "LiveKit RPC"],
    },
    {
      id: "sip",
      shortLabel: "SIP",
      title: "SIP & Telephony Integrations",
      summary:
        "Bridging real phone networks into conversational AI workers for inbound and outbound voice calls.",
      engineeringFocus: [
        "Connecting SIP trunks into LiveKit rooms for production customer service and sales calls",
        "Handling call lifecycle events, transfers, and natural telephony audio constraints",
      ],
      stackUsed: ["LiveKit SIP", "Telephony", "Vocode"],
    },
    {
      id: "telephony",
      shortLabel: "TELEPHONY",
      title: "Production Telephony Voice Workflows",
      summary:
        "End-to-end calling agents built to operate reliably across real telephone lines and web interfaces.",
      engineeringFocus: [
        "Designing conversational flows for customer service, sales qualification, and operational automation",
        "Consistent agent runtime shared across phone calls and browser voice sessions",
      ],
      stackUsed: ["OpenCalls", "LiveKit", "Vocode"],
    },
    {
      id: "latency",
      shortLabel: "LATENCY",
      title: "Latency, Observability & Interruption Handling",
      summary:
        "Distinguishing individual stage timings (VAD, STT, LLM TTFT, TTS TTFB) from caller-observed voice-response latency so replies feel human.",
      engineeringFocus: [
        "Streaming every stage concurrently rather than waiting for full completions",
        "Exporting turn and provider telemetry via OpenTelemetry & observing real metrics live in the Signal Trace",
      ],
      stackUsed: ["OpenTelemetry", "SigNoz", "Per-Stage Metrics", "Barge-In Control"],
    },
    {
      id: "tools",
      shortLabel: "TOOLS",
      title: "Agent Workflows & UI Orchestration",
      summary:
        "Connecting conversational agents to deterministic external workflows and live frontend interfaces.",
      engineeringFocus: [
        "Allowlisted, schema-validated UI actions (like the agent driving this portfolio)",
        "Async workflow automation via gRPC services, Celery, RabbitMQ, and Redis",
      ],
      stackUsed: ["LiveKit RPC", "Zod Schemas", "gRPC", "LangChain", "AutoGen"],
    },
    {
      id: "pipeline",
      shortLabel: "PIPELINE",
      title: "Full Real-Time Voice Pipeline",
      summary:
        "Every stage from microphone capture through LiveKit WebRTC, VAD, streaming STT, LLM tool orchestration, and ElevenLabs TTS back to the speaker.",
      engineeringFocus: [
        "Full-duplex audio with continuous interruption awareness",
        "Live stage illumination tied directly to this portfolio's active LiveKit voice session",
      ],
      stackUsed: ["LiveKit", "ElevenLabs TTS", "VAD", "STT", "LLM"],
    },
  ] as VoicePipelineTopic[],

  projects: [
    {
      id: "opencalls",
      name: "OpenCalls",
      tagline:
        "AI voice agents that sound natural, act intelligently, and automate real conversations.",
      category: "Voice AI Platform · Telephony & Web",
      year: "2026 — Present",
      status: "active",
      flagship: true,
      locationOrContext: "Founder · Pune District, Maharashtra, India",
      liveUrl: "https://www.opencallsai.com",
      liveLabel: "opencallsai.com",
      articleUrl:
        "https://medium.com/@istekharkhan46/inside-opencalls-how-our-voice-ai-services-work-together-cf367000d753",
      articleLabel: "Read architecture deep-dive",
      overview:
        "OpenCalls is my flagship voice AI platform separating durable business orchestration (backend control plane) from sub-second real-time conversation execution (LiveKit voice execution plane) so teams can run production phone and web voice agents reliably.",
      problem:
        "A voice AI platform carries two incompatible workloads: durable SaaS control (auth, published agent versions, phone assignments, RAG knowledge bases, wallets & billing) and millisecond-sensitive live audio dialogue. Mixing them causes brittle failures, untraceable latency spikes, and inconsistent billing state.",
      architectureSummary:
        "Split cleanly into an HTTP Gateway + protobuf gRPC domain microservices control plane (Auth, Admin, Call, Knowledge-Base, Payment) and a LiveKit real-time voice execution plane with domain-isolated PostgreSQL stores, Redis state/rate-limiting, GCS transcript artifacts, and OpenTelemetry turn telemetry.",
      architectureNodes: [
        {
          id: "gateway",
          label: "HTTP Gateway & gRPC",
          sublabel: "Control Plane Boundary",
          detail:
            "Customer & admin REST boundary translating authenticated requests into protobuf gRPC calls across Auth, Call, Knowledge-Base, and Payment services.",
        },
        {
          id: "call-orch",
          label: "Call & Version Service",
          sublabel: "Published Runtime",
          detail:
            "Separates editing from execution — resolves published agent versions, models, voices, tools, and phone assignments per call.",
        },
        {
          id: "livekit",
          label: "LiveKit Execution Plane",
          sublabel: "SIP & WebRTC SFU",
          detail:
            "Full-duplex voice rooms hosting streaming Silero VAD, STT, LLM dialogue, RAG retrieval, tool execution, and ElevenLabs TTS.",
        },
        {
          id: "storage-billing",
          label: "Domain Data & Ledger",
          sublabel: "Postgres · Redis · GCS",
          detail:
            "Logical PostgreSQL domain isolation, Redis sessions/rate limits, GCS recordings/transcripts, and strict Payment service wallet settlement.",
        },
        {
          id: "observability",
          label: "Voice Telemetry",
          sublabel: "OpenTelemetry",
          detail:
            "Tracks stage timings separately from caller-observed voice-response latency with optional OpenTelemetry collector export.",
        },
      ],
      decisions: [
        {
          title: "Explicit control plane vs. voice execution plane split",
          detail:
            "Workers report usage and run live audio turns, but never mutate wallet balances or document chunking directly — every domain owns its state behind protobuf gRPC contracts.",
        },
        {
          title: "Published agent versions decoupled from live edits",
          detail:
            "Editing an agent never mutates an in-flight call; Call Service resolves immutable published snapshots at session dispatch.",
        },
        {
          title: "Distinguishing stage timings from caller-observed latency",
          detail:
            "Because streaming stages overlap while retrieval/tools introduce waits, OpenCalls instruments both component timings and true end-of-speech to first-audio latency via OpenTelemetry.",
        },
      ],
      contributions: [
        "Founded OpenCalls and architected the dual-plane voice platform spanning HTTP/gRPC backend services and LiveKit real-time workers.",
        "Designed domain ownership across Auth, Call orchestration, Knowledge-Base retrieval, and Payment wallet settlement.",
        "Built real-time SIP & WebRTC voice pipelines with structured tool execution and OpenTelemetry latency instrumentation.",
      ],
      stack: [
        "LiveKit",
        "ElevenLabs TTS",
        "WebRTC & SIP",
        "gRPC / Protobuf",
        "Python",
        "Next.js",
        "PostgreSQL",
        "Redis",
        "OpenTelemetry",
      ],
    },
    {
      id: "ruh-ai-voice",
      name: "RUH AI Voice & Automation Systems",
      tagline:
        "Production telephony & web voice agents paired with end-to-end workflow automation.",
      category: "Voice Agents & Agentic Workflows",
      year: "2025 — 2026",
      status: "shipped",
      locationOrContext: "Founding Engineer · RUH AI (Jan 2025 – Mar 2026)",
      overview:
        "As Founding Engineer at RUH AI, I built and deployed production voice agents across both telephony and web interfaces alongside AI workflow automation systems.",
      problem:
        "Organizations needed AI agents capable of moving beyond passive text chat to actively handle voice interactions and automate multi-step operational workflows reliably.",
      architectureSummary:
        "Combined LiveKit and Vocode voice pipelines with LangChain and AutoGen agent workflows backed by scalable Node/Next/PostgreSQL full-stack services.",
      architectureNodes: [
        {
          id: "channels",
          label: "Phone & Web",
          sublabel: "Dual Interface",
          detail: "Unified caller experience across telephony trunks and web voice widgets.",
        },
        {
          id: "voice-engine",
          label: "LiveKit / Vocode",
          sublabel: "Voice Runtime",
          detail: "Real-time audio transport, turn detection, and STT/TTS orchestration.",
        },
        {
          id: "workflow",
          label: "LangChain / AutoGen",
          sublabel: "Agent Workflows",
          detail: "Context-aware dialogue and multi-step tool orchestration.",
        },
        {
          id: "backend",
          label: "API & Data Layer",
          sublabel: "PostgreSQL / GraphQL",
          detail: "Persistent state, call records, and external workflow integrations.",
        },
      ],
      decisions: [
        {
          title: "Unified voice + workflow layer",
          detail:
            "Coupled real-time voice sessions directly with automated downstream workflows so calls complete tasks instead of generating manual follow-ups.",
        },
        {
          title: "Production-grade full-stack visibility",
          detail:
            "Built web interfaces and data layers around the voice agents so teams could monitor, configure, and operate them cleanly.",
        },
      ],
      contributions: [
        "Served as Founding Engineer leading Voice AI (telephony & web interface) and workflow automation engineering.",
        "Integrated STT, TTS, and LLM dialogue systems for customer service, sales, and automated workflows.",
        "Delivered full-stack application surfaces and API integrations supporting agent deployments.",
      ],
      stack: [
        "LiveKit",
        "Vocode",
        "LangChain",
        "AutoGen",
        "Next.js",
        "NestJS",
        "PostgreSQL",
        "GraphQL",
      ],
    },
    {
      id: "invoiceo",
      name: "invoiceo",
      tagline: "Founder-built product focused on streamlined full-stack workflow automation.",
      category: "Full-Stack Product",
      year: "2026",
      status: "active",
      locationOrContext: "Founder · November 2026",
      liveUrl: "https://www.invoiceo.site",
      liveLabel: "invoiceo.site",
      overview:
        "Founded invoiceo to build fast, focused software for billing and invoicing workflows using a clean modern full-stack architecture.",
      problem:
        "Small teams and independent builders lose time to bloated invoicing tools with slow interfaces and rigid workflows.",
      architectureSummary:
        "Modern Next.js & TypeScript web application backed by structured relational data modeling and clean API workflows.",
      architectureNodes: [
        {
          id: "ui",
          label: "Web Workspace",
          sublabel: "Next.js / React",
          detail: "Fast, keyboard-friendly invoicing interface.",
        },
        {
          id: "api",
          label: "Application API",
          sublabel: "TypeScript / Node",
          detail: "Structured validation, document workflows, and automation hooks.",
        },
        {
          id: "db",
          label: "Relational Store",
          sublabel: "PostgreSQL",
          detail: "Auditable invoice records and client data.",
        },
      ],
      decisions: [
        {
          title: "Focused scope & speed",
          detail:
            "Prioritized crisp data flow and fast daily usability over sprawling dashboard complexity.",
        },
      ],
      contributions: [
        "Conceived, architected, and built invoiceo as Founder.",
        "Designed the end-to-end full-stack data model, APIs, and frontend experience.",
      ],
      stack: ["Next.js", "TypeScript", "NestJS", "PostgreSQL", "GraphQL"],
    },
  ] as PortfolioProject[],

  articles: [
    {
      id: "inside-opencalls",
      title: "Inside OpenCalls: How Our Voice AI Services Work Together",
      date: "Nov 2026",
      category: "Voice Systems",
      featured: true,
      summary:
        "How OpenCalls splits durable control-plane microservices (HTTP Gateway, protobuf gRPC Auth/Call/Knowledge-Base/Payment services) from the real-time LiveKit voice execution plane and OpenTelemetry observability.",
      takeaways: [
        "Control plane vs. execution plane isolation so audio workers never directly mutate wallet balances or vector indexes.",
        "Immutable published agent versions decoupled from live edits.",
        "Measuring caller-observed voice-response latency alongside individual stage timings.",
      ],
      tags: ["Voice AI", "gRPC", "LiveKit", "OpenTelemetry"],
      url: "https://medium.com/@istekharkhan46/inside-opencalls-how-our-voice-ai-services-work-together-cf367000d753",
    },
    {
      id: "observability-signoz",
      title:
        "Observability in Modern Systems: From Microservices to AI Applications using SigNoz & OpenTelemetry",
      date: "Jan 2026",
      category: "Observability",
      summary:
        "Instrumenting distributed microservices and AI pipelines end-to-end with OpenTelemetry traces, metrics, and SigNoz so production latency bottlenecks are measurable instead of guessed.",
      takeaways: [
        "Correlating traces across API boundaries, async queues, and model calls.",
        "Practical OpenTelemetry instrumentation patterns for AI applications.",
      ],
      tags: ["OpenTelemetry", "SigNoz", "Microservices"],
      url: "https://medium.com/@istekharkhan46/observability-in-modern-systems-from-microservices-to-ai-applications-using-signoz-and-d7d441871633",
    },
    {
      id: "celery-rabbitmq-redis",
      title: "Scaling AI Agents with Celery, RabbitMQ & Redis in Python",
      date: "Jan 2026",
      category: "Distributed Systems",
      summary:
        "Architecting resilient asynchronous execution pipelines for long-running AI agent workloads using RabbitMQ as the broker, Celery for distributed worker concurrency, and Redis for fast state storage.",
      takeaways: [
        "Decoupling slow agentic workflows from synchronous HTTP timeouts.",
        "Retry strategies, backpressure handling, and distributed worker scaling.",
      ],
      tags: ["Celery", "RabbitMQ", "Redis", "Python"],
      url: "https://medium.com/@istekharkhan46/scaling-ai-agents-with-celery-rabbitmq-redis-in-python-b30370a110a9",
    },
    {
      id: "voice-agents-pain-points",
      title: "What Building Voice Agents in 2025 Taught Us About Their Biggest Pain Points",
      date: "Dec 2025",
      category: "Voice Systems",
      summary:
        "Production lessons learned from real callers: why demos look easy while real telephony calls expose turn-taking failures, barge-in timing bugs, audio noise, and cascading pipeline latency.",
      takeaways: [
        "Why conversational turn-taking and barge-in matter more than benchmark demos.",
        "Hard-won engineering patterns from real telephony and web voice sessions.",
      ],
      tags: ["Voice Agents", "Barge-In", "Production"],
      url: "https://medium.com/@istekharkhan46/what-building-voice-agents-in-2025-taught-us-about-their-biggest-pain-points-c7ac2bddaf85",
    },
    {
      id: "redis-lua-idempotency",
      title:
        "How I Solved Race Conditions and Idempotency Issues in Batch Processing Using Redis and Lua",
      date: "Dec 2025",
      category: "Distributed Systems",
      summary:
        "Using atomic Redis Lua scripts to eliminate concurrent race conditions and guarantee idempotent batch job execution without heavy database locks.",
      takeaways: [
        "Atomic check-and-set state transitions executed inside Redis via Lua.",
        "Preventing duplicate execution across concurrent distributed workers.",
      ],
      tags: ["Redis", "Lua", "Concurrency", "Idempotency"],
      url: "https://medium.com/@istekharkhan46/how-i-solved-race-conditions-and-idempotency-issues-in-batch-processing-using-redis-and-lua-9f399d2ad74a",
    },
    {
      id: "architecting-voice-agents",
      title:
        "Architecting Production-Grade Voice Agents: A Practical Guide to Choosing the Right Stack",
      date: "Dec 2025",
      category: "Voice Systems",
      summary:
        "A practical engineering breakdown for choosing WebRTC vs. WebSockets, VAD, streaming STT, LLM orchestration, and TTS engines based on real latency and reliability constraints.",
      takeaways: [
        "Why production voice systems fail on architecture, not base LLM intelligence.",
        "Trade-off matrix across transport, transcription, reasoning, and synthesis.",
      ],
      tags: ["Voice Stack", "Architecture", "WebRTC"],
      url: "https://medium.com/@istekharkhan46/architecting-production-grade-voice-agents-a-practical-guide-to-choosing-the-right-stack-ead43c9882b3",
    },
  ] as EngineeringArticle[],

  experience: [
    {
      id: "opencalls",
      company: "OpenCalls",
      role: "Founder",
      period: "July 2026 – Present",
      startYear: 2026,
      startMonth: 7,
      endYear: 2026,
      endMonth: 12,
      current: true,
      location: "Pune District, Maharashtra, India",
      summary:
        "Building AI voice agents that sound natural, act intelligently, and automate real conversations.",
      highlights: [
        "Architected a dual-plane voice platform separating HTTP/gRPC control services (Auth, Call, Knowledge-Base, Payment) from LiveKit voice execution workers.",
        "Integrated LiveKit WebRTC & SIP telephony, streaming STT/VAD, RAG retrieval, tool orchestration, and ElevenLabs TTS.",
        "Instrumented per-stage and caller-observed voice latency with OpenTelemetry across production audio workflows.",
      ],
      trackLabel: "TRK 01 // OpenCalls",
    },
    {
      id: "invoiceo",
      company: "invoiceo",
      role: "Founder",
      period: "November 2026",
      startYear: 2026,
      startMonth: 11,
      endYear: 2026,
      endMonth: 12,
      current: true,
      location: "India",
      summary: "Founded invoiceo, building focused full-stack invoicing and workflow software.",
      highlights: [
        "Owned end-to-end product design, backend architecture, and frontend execution.",
      ],
      trackLabel: "TRK 02 // invoiceo",
    },
    {
      id: "ruh-ai",
      company: "RUH AI",
      role: "Founding Engineer",
      period: "January 2025 – March 2026",
      startYear: 2025,
      startMonth: 1,
      endYear: 2026,
      endMonth: 3,
      location: "Remote / India",
      summary:
        "AI Agents Developer — Voice (telephony and web interface) & Workflow Automation.",
      highlights: [
        "Designed and deployed production-ready voice AI agents for real-time phone calls and web interfaces.",
        "Built agentic workflows with LangChain, AutoGen, LiveKit, and Vocode across customer service, sales, and automation.",
        "Engineered full-stack services, APIs, and data flows supporting live voice deployments.",
      ],
      trackLabel: "TRK 03 // RUH AI",
    },
    {
      id: "rapid-innovation",
      company: "Rapid Innovation",
      role: "SWE Associate (prev. Software Developer Trainee)",
      period: "July 2024 – March 2025",
      startYear: 2024,
      startMonth: 7,
      endYear: 2025,
      endMonth: 3,
      location: "Noida, Uttar Pradesh, India",
      summary:
        "Progressed from Software Developer Trainee (Jul–Oct 2024) to SWE Associate (Oct 2024–Mar 2025), shipping full-stack web applications.",
      highlights: [
        "Built scalable frontend and backend features across modern JavaScript/TypeScript stacks (MERN, Next.js, NestJS).",
        "Worked on database design, GraphQL/REST API integrations, and production engineering practices.",
      ],
      trackLabel: "TRK 04 // Rapid Innovation",
    },
    {
      id: "unbundl",
      company: "unbundl",
      role: "Web Development Intern",
      period: "January 2024 – June 2024",
      startYear: 2024,
      startMonth: 1,
      endYear: 2024,
      endMonth: 6,
      location: "Delhi, India",
      summary:
        "Six-month internship focused on Shopify and e-commerce web development using HTML, CSS, JavaScript, and modern frameworks.",
      highlights: [
        "Built custom storefronts and interactive e-commerce features with Shopify, HTML, CSS, and JavaScript.",
        "Collaborated across engineering and product teams to solve real-world storefront and UX problems.",
      ],
      trackLabel: "TRK 05 // unbundl",
    },
    {
      id: "auralapp",
      company: "AuralApp",
      role: "Full Stack Intern",
      period: "January 2024",
      startYear: 2024,
      startMonth: 1,
      endYear: 2024,
      endMonth: 2,
      location: "India",
      summary: "Full-stack development internship contributing across frontend and backend layers.",
      highlights: [
        "Contributed full-stack web features and API integration work early in my engineering career.",
      ],
      trackLabel: "TRK 06 // AuralApp",
    },
  ] as ExperienceEntry[],

  stack: [
    {
      id: "voice",
      name: "Voice Infrastructure",
      items: [
        { name: "LiveKit (Agents & WebRTC)", projectIds: ["opencalls", "ruh-ai-voice"] },
        { name: "ElevenLabs TTS Plugin", projectIds: ["opencalls"] },
        { name: "Vocode", projectIds: ["ruh-ai-voice"] },
        { name: "SIP & Telephony", projectIds: ["opencalls", "ruh-ai-voice"] },
        { name: "Streaming STT / Silero VAD", projectIds: ["opencalls", "ruh-ai-voice"] },
      ],
    },
    {
      id: "ai",
      name: "AI & Agent Orchestration",
      items: [
        { name: "LangChain & AutoGen", projectIds: ["ruh-ai-voice"] },
        { name: "LLM Dialogue Orchestration", projectIds: ["opencalls", "ruh-ai-voice"] },
        { name: "Structured Tool Calling & RPC", projectIds: ["opencalls", "ruh-ai-voice"] },
        { name: "RAG / Embeddings Retrieval", projectIds: ["opencalls"] },
      ],
    },
    {
      id: "distributed",
      name: "Distributed Systems & Ops",
      items: [
        { name: "gRPC & Protobuf Services", projectIds: ["opencalls"] },
        { name: "Redis & Atomic Lua Scripting", projectIds: ["opencalls"] },
        { name: "Celery & RabbitMQ Queues", projectIds: ["ruh-ai-voice"] },
        { name: "OpenTelemetry & SigNoz", projectIds: ["opencalls"] },
      ],
    },
    {
      id: "languages",
      name: "Languages",
      items: [
        { name: "TypeScript / JavaScript", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
        { name: "Python", projectIds: ["opencalls", "ruh-ai-voice"] },
        { name: "C++ & Lua", projectIds: [] },
        { name: "SQL", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
      ],
    },
    {
      id: "frontend",
      name: "Frontend Engineering",
      items: [
        { name: "Next.js & React", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
        { name: "Tailwind CSS", projectIds: ["opencalls", "invoiceo"] },
        { name: "GSAP, Motion & Three.js", projectIds: ["opencalls"] },
        { name: "Shopify / HTML / CSS", projectIds: [] },
      ],
    },
    {
      id: "backend-data",
      name: "Backend & Data",
      items: [
        { name: "NestJS & Node.js (MERN)", projectIds: ["invoiceo", "ruh-ai-voice"] },
        { name: "GraphQL & REST Gateways", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
        { name: "PostgreSQL & MongoDB", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
        { name: "Docker & Cloud Storage (GCS)", projectIds: ["opencalls"] },
      ],
    },
  ] as StackCategory[],
} as const;
