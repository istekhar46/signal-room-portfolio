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

The frontend requests a room token from the AWS API's `/api/livekit/token` endpoint, dispatching `signal-room-representative` automatically. It registers the `ui.action` RPC handler for validated UI transitions in real time.

## Cloud deployment

The existing deployment is `CA_TxwKWcpbt9ne` in Mumbai (`ap-south`), in project
`portfolio-yruwo1tv`. `livekit.toml` identifies this deployment; update it with
`deploy`, rather than creating another agent.

The Docker build uses Python 3.12, locked dependencies, downloaded model assets,
and a non-root runtime. Its build context is this directory. `.dockerignore`
excludes environment files, virtual environments, and tests.

With the intended project's `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and
`LIVEKIT_API_SECRET` exported in the shell, deploy from `agent/`:

```bash
lk --url "$LIVEKIT_URL" agent deploy .
lk --url "$LIVEKIT_URL" agent status --id CA_TxwKWcpbt9ne
```

LiveKit Cloud injects its project credentials into the worker. Provider settings
are separate runtime secrets: this deployment uses `ELEVEN_API_KEY` and
`ELEVENLABS_VOICE_ID`. To update them, add `--secrets-file` with the path to a
private provider-only environment file outside the build context. Never commit
that file or include credentials in command arguments.

The standalone AWS API needs the same project's server-only `LIVEKIT_URL`,
`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and
`LIVEKIT_AGENT_NAME=signal-room-representative`. Render needs only the public
`NEXT_PUBLIC_API_BASE_URL`; API deployment details are in
[`backend/README.md`](../backend/README.md). The API's `/api/livekit/status` checks
configuration presence; use an actual conversation to verify worker health.

## Deployment checks

From the repository root, run the provider-backed regression checks:

```bash
PYTHONPATH=agent uv run --project agent python -m unittest discover -s agent/tests -v
```

These use LiveKit Inference for model responses and judging. Browser RPC is
mocked to cover successful dispatch and an unavailable browser, while another
check prevents invented revenue figures. They consume the project's inference
allowance.

Run the two full speech-pipeline scenarios with the deployed agent (CLI 2.18):

```bash
lk --url "$LIVEKIT_URL" agent simulate --audio \
  --agent-name signal-room-representative \
  --scenarios agent/scenarios.yaml --concurrency 1
```

Audio simulations consume the project's included usage and the configured TTS
provider's quota. Also verify a conversation on the public site: receive audio
and captions, ask to show the OpenCalls architecture, confirm the panel opens,
then end the session. Simulated callers do not implement the browser's UI RPC.
