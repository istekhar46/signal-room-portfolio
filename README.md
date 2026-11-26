# Signal Room — Istekhar Khan Portfolio

Interactive Voice AI + Full-Stack AI Engineer portfolio for **Istekhar Khan** (Founder at OpenCalls).

Visitors can speak with a real-time **LiveKit WebRTC** voice representative that orchestrates the interface via structured RPC actions — materializing project dossiers, architecture specs, career timeline tracks, and live voice-pipeline telemetry.

## Stack

- **Frontend:** Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Three.js / React Three Fiber, GSAP, `motion/react`, Zod
- **API:** Express + LiveKit server SDK, deployed as an isolated Docker service on the existing AWS Lightsail instance
- **Voice / Realtime Engine:** LiveKit Agents (`livekit-agents`) + WebRTC (`livekit-client`, `livekit-server-sdk`)
- **Voice Pipeline:** Silero VAD → Deepgram Nova-3 STT → Google Gemini 3.8 Flash (LiveKit Inference) → ElevenLabs TTS (`livekit-plugins-elevenlabs`)

## Local Development

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_API_BASE_URL` — `http://localhost:3001` for the local API; the Lightsail HTTPS URL on Render
- `ALLOWED_ORIGIN` — `http://localhost:3000` for the local API; comma-separated frontend origins in production
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

### 3. Local API

In a separate terminal, using the same `.env` or `.env.local`:

```bash
npm ci --prefix backend
npm run dev:api
```

Run API regression tests with `npm run test:api`. Deployment and configuration are documented in [`backend/README.md`](./backend/README.md).

### Static frontend deployment

`npm run build` exports the frontend to `out/`, including the social preview
images. Deploy that directory to a Render **Static Site**; no Node start command
is needed. Configure these build variables:

- `NODE_VERSION=24`
- `SKIP_INSTALL_DEPS=true`
- `NEXT_PUBLIC_API_BASE_URL=https://signal-room-api.16-178-253-21.sslip.io`

Build command:

```bash
npm ci --include=dev && NEXT_PUBLIC_SITE_URL="$RENDER_EXTERNAL_URL" npm run build
```

The API must allow the static site's actual origin through its private
`ALLOWED_ORIGIN` setting. LiveKit credentials belong on the API and agent only.
See [the static-site deployment record](docs/implementation/render-static-frontend.md)
for the active service and verification results.

### 4. LiveKit Voice Agent Worker

See [`agent/README.md`](./agent/README.md) for full details:

```bash
cd agent
uv sync
uv run python agent.py download-files
uv run python agent.py dev
```

## Project Structure

- `src/app/` — Next.js App Router pages, layout, and global styles
- `backend/` — Standalone token/status API, shared voice choices, tests, Docker image, and Lightsail proxy/container configuration
- `src/components/` — 3D Acoustic Iris hero, holographic Stage HUD panel, persistent Agent Dock, Voice Lab, Projects, and Experience Timeline
- `src/hooks/use-livekit-agent.ts` — WebRTC room connection, Web Audio FFT analysers, and `ui.action` RPC handler
- `src/lib/ui-actions.ts` — Zod-validated RPC action schemas shared with the voice agent
- `agent/` — Python LiveKit Agents worker (`agent.py`, `portfolio_context.py`)
- `PRODUCT.md` & `DESIGN.md` — Product brief and Signal Room design tokens
