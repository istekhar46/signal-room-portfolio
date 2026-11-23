# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui primitives (custom-styled), GSAP (scroll, shutter reveals, timeline choreography), Three.js / React Three Fiber + custom GLSL shaders (3D Acoustic Iris Agent Core).
- **Voice & Realtime Engine:** LiveKit (WebRTC + LiveKit Agents Python worker) with ElevenLabs used strictly as a TTS plugin (`livekit-plugins-elevenlabs`).
- **UI Orchestration:** Structured LiveKit RPC action contract (`ui.action`) validated against strict Zod schemas on the client; single source of truth shared across voice and text modes.
- **Hosting:** Intentionally undecided — no deploy config yet.

## Users

- Engineering leaders, technical recruiters, founders, and potential clients evaluating a **Voice AI Engineer & Full-Stack AI Engineer** for senior/founding roles or technical engagements.
- Arrive skeptical of buzzword claims and generic developer templates; want immediate, tangible proof of real-time voice engineering and full-stack craft within the first 15 seconds.

## Product Purpose

A production-grade interactive portfolio powered by a real AI voice representative that speaks naturally with visitors and dynamically orchestrates the website UI (navigating sections, opening project case studies, scrubbing the experience timeline, exploring the voice pipeline, opening contact) in sync with conversation. Success means visitors leave thinking: *"This person builds real-time voice AI systems — the portfolio itself just proved it."*

## Positioning

Instead of describing voice AI work on a static page or bolting a corner chatbot onto a template, the portfolio **is** a live voice agent interface: the Agent Core is the primary navigation layer, the Voice Lab pipeline lights up in real time with the visitor's own conversation, and a collapsible Signal Trace exposes real tool calls and per-turn STT/LLM/TTS latency.

## Operating Context

- Desktop-first showcase experience with full mobile responsiveness (panels convert to sheets, Agent Dock remains pinned).
- Supports live microphone voice conversations via WebRTC, text-mode fallback using the same agent logic, and full browseability if microphone permissions are denied or the voice worker is offline (never faking a live agent).

## Capabilities and Constraints

- **Grounded knowledge only:** The voice agent must strictly answer from verified portfolio data and never fabricate roles, clients, metrics, projects, or achievements.
- **Structured UI action system only:** Fixed allowlisted actions (`navigate_to_section`, `open_project`, `open_experience_panel`, `open_skill_explorer`, `show_architecture`, `open_contact_panel`, `highlight_content`, `close_active_panel`) — never arbitrary code execution.
- **Five real agent states:** Idle, Listening (mic FFT), Thinking, Speaking (agent audio FFT), Executing (UI action transition), plus honest Offline/Error state.
- **Signature sections:** Hero with integrated Agent Core, About, Voice Lab (live-reactive STT/TTS/VAD/LLM/WebRTC/SIP pipeline), Projects (flagship **OpenCalls** + index rows), Experience (multitrack audio-editor timeline), Technical Stack (categorized with project links, no progress bars), and Contact.
- **Explicitly undecided:** Hosting provider & final deployment config.

## Brand Commitments

- **Headline:** `"Engineering Intelligence Into Conversations."`
- **Signal Trace:** Visible by default in the Agent Dock (collapsible).
- **Visual World (user-approved):** **Signal Room** — Japanese broadcast studio instrumentation + *Evangelion*/*Patlabor*-inspired stark editorial motion design. Deep graphite (`#0B0D10`), anodized slate (`#12161C`), warm broadcast white (`#F2EFE9`), muted ink (`#8B939E`), international vermilion-amber (`#FF5A1F`) for active signal/execution, and oscilloscope phosphor mint (`#38D9A9`) for live listening audio. Display/UI in **Archivo**, editorial chapter titles in **Shippori Mincho**, telemetry in **JetBrains Mono**.
- **Anti-goals:** No generic portfolio templates, no purple gradients, no excessive glassmorphism, no skill progress bars, no repetitive card grids, no corner chatbot bubbles, no simulated fake voice agents.

## Evidence on Hand

Verified directly from Istekhar Khan's LinkedIn PDF export (`linkedin.com/in/istekhar46`):
- **Identity:** Istekhar Khan — Founder at OpenCalls (`Opencallsai`), Delhi / Pune District, India. Contact: `istekharkhan46@gmail.com`, `https://www.linkedin.com/in/istekhar46`.
- **Flagship & Ventures:**
  - **OpenCalls** (Founder, Jul 2026 – Present, Pune District, Maharashtra, India) — Building AI voice agents that sound natural, act intelligently, and automate real conversations.
  - **invoiceo** (Founder, Nov 2026).
- **Experience Timeline:**
  - **OpenCalls** — Founder (Jul 2026 – Present)
  - **invoiceo** — Founder (Nov 2026)
  - **RUH AI** — Founding Engineer (Jan 2025 – Mar 2026, 1 yr 3 mos): AI Agents Developer — Voice (telephony and web interface) & Workflow Automation.
  - **Rapid Innovation** — SWE Associate (Oct 2024 – Mar 2025) & Software Developer Trainee (Jul 2024 – Oct 2024), Noida, UP, India.
  - **unbundl** — Web Development Intern (Jan 2024 – Jun 2024), Delhi, India: Shopify, HTML, CSS, JavaScript & frameworks, e-commerce development.
  - **AuralApp** — Full Stack Intern (Jan 2024), India.
- **Education:** Dr. A.P.J. Abdul Kalam Technical University — B.Tech, Computer Science (Mar 2020 – Jul 2024).
- **Verified Technical Stack:** LiveKit, Vocode, STT, TTS, LLM-driven dialogue systems, Telephony & Web Voice Agents, LangChain, AutoGen, Next.js, NestJS, MERN Stack (MongoDB, Express, React, Node.js), PostgreSQL, GraphQL, Shopify, HTML/CSS/JavaScript, C++.
- **Explicit Absences (do not fabricate):** No unverified GitHub/X URLs, no invented client logos, no invented commercial metrics or revenue numbers, and personal mobile phone intentionally omitted from public display unless explicitly requested.

## Product Principles

1. **Demonstrate, never merely claim:** Every capability claimed in copy (low-latency voice, tool calling, interruption handling, WebRTC) is visibly exercised by the site itself.
2. **Agent as primary navigator, page as complete stage:** Voice/text orchestration enriches the site without gating scroll or keyboard visitors.
3. **Motion carries state and meaning:** Animations communicate audio activity, agent transitions, and UI action targeting — never gratuitous decoration.
4. **Honesty over theater:** Real latency readouts, real LiveKit signals, and candid offline/mic-denied fallbacks.

## Accessibility & Inclusion

- Full keyboard navigation, focus-trapped Stage Panel dialogs (`Esc` closes and notifies agent), `aria-live` captions for agent speech, visible button equivalents for every voice action, and `prefers-reduced-motion` support replacing parallax/shutter animations with crisp cross-fades.
