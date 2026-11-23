# Signal Room — LiveKit Voice Agent Worker

Real-time voice representative for Istekhar Khan powered by **LiveKit Agents** (WebRTC) with **ElevenLabs** as the TTS plugin.

## Setup

1. Copy `../.env.example` to `../.env.local` (or `../.env`) and fill in:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `ELEVEN_API_KEY` (required for `livekit-plugins-elevenlabs`)
   - *(Optional)* `LIVEKIT_USE_GOOGLE_PLUGIN=true` + `GOOGLE_API_KEY` — only if you want to bill Google AI Studio directly instead of using **Google Gemini 3.8 Flash** through LiveKit Inference (default).
2. Install Python dependencies with [uv](https://docs.astral.sh/uv/):
   ```bash
   cd agent
   uv sync
   ```
3. Download local VAD model weights once:
   ```bash
   uv run python agent.py download-files
   ```
4. Start the worker in development mode:
   ```bash
   uv run python agent.py dev
   ```

The Next.js frontend dispatches `signal-room-representative` automatically via `/api/livekit/token` and registers the `ui.action` RPC handler to execute validated UI transitions in real time.
