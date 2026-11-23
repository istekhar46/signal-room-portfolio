# Portfolio — Agent Rules

## Project
Creative portfolio for a **Voice AI + Full-Stack AI Engineer**. It must feel distinctive, not templated.

## Voice stack (decided)
- **LiveKit** (Agents framework + WebRTC) is the core voice / realtime engine.
- **ElevenLabs** is used only as a TTS plugin inside LiveKit (`livekit-plugins-elevenlabs` / `@livekit/agents-plugin-elevenlabs`), not as a standalone hosted agent.
- Use the `building-livekit-agents` skill and the `livekit-docs` MCP before writing LiveKit code.

## Workflow
- Before writing UI, load `frontend-design` and/or `impeccable`; review with `web-design-guidelines`.
- Use Context7 (`context7` MCP) for version-accurate docs of any library (Next.js, GSAP, Three.js, AI SDK, LiveKit).
- Verify UI in a real browser with the `playwright` MCP or the `webapp-testing` skill.
- Hosting is undecided — do not add deploy config yet.

## Secrets
- Never commit API keys. `.agents/plugins/portfolio-mcp/mcp_config.json` holds the Context7 key and is gitignored. Use `.env.local` for app secrets.
