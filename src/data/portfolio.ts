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
      "Voice AI Engineer building intelligent conversational systems, real-time voice agents, and full-stack AI products.",
    location: "Delhi & Pune, India",
    email: "istekharkhan46@gmail.com",
    linkedin: "https://www.linkedin.com/in/istekhar46",
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
      "Voice is the highest-bandwidth human interface — when latency drops and dialogue stays grounded, software stops feeling like forms and starts acting like a collaborator.",
    bio: "I'm Istekhar Khan, Founder at OpenCalls and former Founding Engineer at RUH AI. I design and deploy production-ready voice AI agents across telephony and web interfaces, pairing low-latency speech pipelines (LiveKit, Vocode, STT, TTS, VAD, LLM orchestration) with full-stack engineering in Next.js, NestJS, PostgreSQL, and GraphQL.",
    specializations: [
      {
        title: "Real-Time Voice Agents",
        detail:
          "Production voice systems over telephony (SIP) and WebRTC web interfaces that hold natural, interruption-aware conversations for customer service, sales, and workflow automation.",
      },
      {
        title: "AI Agent & Workflow Orchestration",
        detail:
          "Context-aware LLM dialogue pipelines, deterministic tool execution, and multi-step agentic workflows using LiveKit Agents, LangChain, and AutoGen.",
      },
      {
        title: "Full-Stack Product Engineering",
        detail:
          "End-to-end web platforms built with Next.js, NestJS, MERN Stack, PostgreSQL, GraphQL, and clean API integrations.",
      },
    ],
  },

  starterPrompts: [
    "What is OpenCalls?",
    "His voice AI stack?",
    "His experience?",
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
      stackUsed: ["Streaming STT", "LiveKit Agents", "Vocode"],
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
        "Strict schema-validated tool execution (RPC UI actions, CRM/workflow triggers) owned by code",
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
      stackUsed: ["ElevenLabs TTS Plugin", "LiveKit Audio Stream"],
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
        "Consistent agent logic shared across phone calls and browser voice sessions",
      ],
      stackUsed: ["OpenCalls", "LiveKit", "Vocode"],
    },
    {
      id: "latency",
      shortLabel: "LATENCY",
      title: "Latency & Interruption Handling",
      summary:
        "Measuring and minimizing every stage of the conversational loop — VAD, STT, LLM TTFT, and TTS TTFB — so replies feel human.",
      engineeringFocus: [
        "Streaming every stage concurrently rather than waiting for full completions",
        "Observing per-stage turn metrics live in the Signal Trace during real sessions",
      ],
      stackUsed: ["Per-Stage Metrics", "Streaming Pipelines", "Barge-In Control"],
    },
    {
      id: "tools",
      shortLabel: "TOOLS",
      title: "Agent Workflows & UI Orchestration",
      summary:
        "Connecting conversational agents to deterministic external workflows and live frontend interfaces.",
      engineeringFocus: [
        "Allowlisted, schema-validated UI actions (like the agent driving this portfolio)",
        "Backend workflow automation tying voice outcomes into databases and APIs",
      ],
      stackUsed: ["LiveKit RPC", "Zod Schemas", "LangChain", "AutoGen"],
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
      tagline: "AI voice agents that sound natural, act intelligently, and automate real conversations.",
      category: "Voice AI Platform · Telephony & Web",
      year: "2026 — Present",
      status: "active",
      flagship: true,
      locationOrContext: "Founder · Pune District, Maharashtra, India",
      overview:
        "OpenCalls is my flagship venture focused on building production-ready AI voice agents that hold natural, low-latency conversations and automate real customer service, sales, and operational workflows across telephony and web interfaces.",
      problem:
        "Conventional IVRs and scripted voice bots sound robotic, break on interruptions, and fail to connect natural dialogue to real backend actions. Teams need voice agents that feel genuinely conversational while reliably executing structured workflows.",
      architectureSummary:
        "Built on a real-time full-duplex audio pipeline connecting SIP telephony and browser WebRTC peers through LiveKit rooms into streaming VAD, STT, context-aware LLM orchestration with deterministic tool calling, and expressive streaming TTS.",
      architectureNodes: [
        {
          id: "ingress",
          label: "SIP / WebRTC",
          sublabel: "Telephony & Browser",
          detail: "Full-duplex voice ingress from phone networks and web clients.",
        },
        {
          id: "livekit",
          label: "LiveKit Room",
          sublabel: "Realtime SFU",
          detail: "Low-latency media routing, participant state, and structured RPC data channels.",
        },
        {
          id: "perception",
          label: "VAD + STT",
          sublabel: "Streaming Audio",
          detail: "Instant speech onset detection, barge-in handling, and streaming transcripts.",
        },
        {
          id: "brain",
          label: "LLM + Tools",
          sublabel: "Dialogue & Workflows",
          detail: "Context-aware reasoning paired with schema-validated workflow actions.",
        },
        {
          id: "voice",
          label: "ElevenLabs TTS",
          sublabel: "Streaming Voice",
          detail: "Natural chunked speech synthesis with word-aligned transcript sync.",
        },
      ],
      decisions: [
        {
          title: "LiveKit as the real-time media core",
          detail:
            "Standardizing on LiveKit WebRTC & SIP keeps phone calls and browser voice interfaces on one unified agent runtime.",
        },
        {
          title: "Separation of reasoning and execution",
          detail:
            "The LLM interprets conversational intent while deterministic backend code validates and executes every workflow action.",
        },
        {
          title: "Streaming-first turn architecture",
          detail:
            "VAD, STT, LLM tokens, and ElevenLabs TTS stream concurrently to keep conversational turn latency natural and interruptible.",
        },
      ],
      contributions: [
        "Founded OpenCalls and own end-to-end product vision, voice architecture, and full-stack implementation.",
        "Engineered real-time voice agent pipelines spanning telephony (SIP) and web interfaces.",
        "Designed natural dialogue orchestration and tool-driven workflow automation for real-world call scenarios.",
      ],
      stack: ["LiveKit", "ElevenLabs TTS", "WebRTC", "SIP Telephony", "Python", "Next.js", "PostgreSQL"],
    },
    {
      id: "ruh-ai-voice",
      name: "RUH AI Voice & Automation Systems",
      tagline: "Production telephony & web voice agents paired with end-to-end workflow automation.",
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
      stack: ["LiveKit", "Vocode", "LangChain", "AutoGen", "Next.js", "NestJS", "PostgreSQL", "GraphQL"],
    },
    {
      id: "invoiceo",
      name: "invoiceo",
      tagline: "Founder-built product focused on streamlined full-stack workflow automation.",
      category: "Full-Stack Product",
      year: "2026",
      status: "active",
      locationOrContext: "Founder · November 2026",
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
        "Architecting real-time voice agent systems spanning telephony and web interfaces.",
        "Integrating LiveKit WebRTC, streaming STT/TTS, and LLM orchestration for natural, low-latency dialogue.",
        "Leading product direction, core engineering, and full-stack platform delivery.",
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
        { name: "Streaming STT / VAD", projectIds: ["opencalls", "ruh-ai-voice"] },
      ],
    },
    {
      id: "ai",
      name: "AI & LLM Frameworks",
      items: [
        { name: "LangChain", projectIds: ["ruh-ai-voice"] },
        { name: "AutoGen", projectIds: ["ruh-ai-voice"] },
        { name: "LLM Dialogue Orchestration", projectIds: ["opencalls", "ruh-ai-voice"] },
        { name: "Structured Tool Calling", projectIds: ["opencalls", "ruh-ai-voice"] },
      ],
    },
    {
      id: "languages",
      name: "Languages",
      items: [
        { name: "TypeScript / JavaScript", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
        { name: "Python", projectIds: ["opencalls", "ruh-ai-voice"] },
        { name: "C++", projectIds: [] },
        { name: "SQL", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
      ],
    },
    {
      id: "frontend",
      name: "Frontend Engineering",
      items: [
        { name: "Next.js & React", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
        { name: "Tailwind CSS", projectIds: ["opencalls", "invoiceo"] },
        { name: "GSAP & Three.js / WebGL", projectIds: ["opencalls"] },
        { name: "Shopify / HTML / CSS", projectIds: [] },
      ],
    },
    {
      id: "backend",
      name: "Backend Engineering",
      items: [
        { name: "NestJS", projectIds: ["invoiceo", "ruh-ai-voice"] },
        { name: "Node.js & Express (MERN)", projectIds: ["ruh-ai-voice"] },
        { name: "GraphQL", projectIds: ["invoiceo", "ruh-ai-voice"] },
        { name: "REST & Realtime RPC", projectIds: ["opencalls", "ruh-ai-voice"] },
      ],
    },
    {
      id: "data",
      name: "Databases & Data Flow",
      items: [
        { name: "PostgreSQL", projectIds: ["opencalls", "invoiceo", "ruh-ai-voice"] },
        { name: "MongoDB", projectIds: ["ruh-ai-voice"] },
        { name: "API & Workflow Integrations", projectIds: ["opencalls", "ruh-ai-voice"] },
      ],
    },
  ] as StackCategory[],
} as const;
