# Signal Room — Istekhar Khan Portfolio

Interactive Voice AI + Full-Stack AI Engineer portfolio for **Istekhar Khan** (Founder at OpenCalls).

Visitors can speak with a real-time **LiveKit WebRTC** voice representative that orchestrates the interface via structured RPC actions — materializing project dossiers, architecture specs, career timeline tracks, and live voice-pipeline telemetry.

## Stack

- **Frontend:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Three.js / React Three Fiber, GSAP, `motion/react`, Zod
- **Voice / Realtime Engine:** LiveKit Agents (`livekit-agents`) + WebRTC (`livekit-client`, `livekit-server-sdk`)
- **Voice Pipeline:** Silero VAD → Deepgram Nova-3 STT → Google Gemini 3.8 Flash (LiveKit Inference) → ElevenLabs TTS (`livekit-plugins-elevenlabs`)

## Local Development

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `ELEVEN_API_KEY`

### 2. Frontend (Next.js)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. LiveKit Voice Agent Worker

See [`agent/README.md`](./agent/README.md) for full details:

```bash
cd agent
uv sync
uv run python agent.py download-files
uv run python agent.py dev
```

## Project Structure

- `src/app/` — Next.js App Router pages, layout, global styles, and LiveKit token/status API routes
- `src/components/` — 3D Acoustic Iris hero, holographic Stage HUD panel, persistent Agent Dock, Voice Lab, Projects, and Experience Timeline
- `src/hooks/use-livekit-agent.ts` — WebRTC room connection, Web Audio FFT analysers, and `ui.action` RPC handler
- `src/lib/ui-actions.ts` — Zod-validated RPC action schemas shared with the voice agent
- `agent/` — Python LiveKit Agents worker (`agent.py`, `portfolio_context.py`)
- `PRODUCT.md` & `DESIGN.md` — Product brief and Signal Room design tokens
