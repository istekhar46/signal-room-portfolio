# LiveKit Cloud agent deployment

## A. Original Requirements

- Deploy the existing portfolio voice agent on LiveKit Cloud using the credentials in the root `.env`.
- Keep credential values out of logs, Git, and container images.
- Preserve the decided architecture: LiveKit Agents/WebRTC, with ElevenLabs only as a TTS plugin inside the worker.
- Acceptance: deployment targets the `.env` project, the agent registers with the expected dispatch name, and a dispatched session is verified. Connect the existing portfolio frontend to the deployed worker as needed for the public feature to work.

## B. Technical Assessment

- Worker: `agent/agent.py`, context: `agent/portfolio_context.py`, dependencies: `agent/pyproject.toml` and `agent/uv.lock`.
- Installed LiveKit Agents Python version: 1.8.13. CLI: `lk` 2.18.2; `uv` is installed.
- `.env` contains LiveKit project credentials and ElevenLabs, Google, and Deepgram keys. Values are never printed. The source defaults to LiveKit Inference STT/LLM and the ElevenLabs TTS plugin.
- Required target project hostname from `.env`: `portfolio-yruwo1tv.livekit.cloud`. A credentialed `lk --url <env-url> agent list --json` returned no agents. The CLI's unrelated default project must not be used.
- No Dockerfile or LiveKit deployment manifest existed initially. Use the CLI-generated deployment files and inspect them before uploading. Build context must be `agent/`, with `.env*`, virtualenvs, caches, and unrelated frontend source excluded.
- LiveKit Cloud injects its own project credentials into workers. Pass provider secrets separately through `--secrets-file`; never bake them into the image.
- Deployment region is immutable after creation; confirm the region before creation if not already fixed by project configuration/user context.
- Region clarification: user chose "what ever free version gives". Stay within the existing free plan; use an included region with preference for Mumbai (`ap-south`) when supported. Do not upgrade plans or introduce paid resources to resolve a limitation.
- Official evidence: [deployment quickstart](https://docs.livekit.io/deploy/agents/quickstart/), [builds](https://docs.livekit.io/deploy/agents/builds/), [secrets](https://docs.livekit.io/deploy/agents/secrets/), [agent regions](https://docs.livekit.io/deploy/admin/regions/agent-deployment/). Read via LiveKit Docs MCP; Context7 consulted for the Python starter deployment pattern. Installed CLI help governs flags.
- Current frontend is hosted on Render (`srv-dc46p4vf3r2c73af9060`). Its token endpoint dispatches `signal-room-representative`; its status endpoint reports credentials configured, not worker health.

## C. Implementation Checklist

- LCD-1 DONE: Verify project, region, runtime configuration, and deployment requirements.
- LCD-2 DONE: Prepare a reproducible, secret-free agent build and inspect startup locally where practical.
- LCD-3 DONE: Create/deploy the LiveKit Cloud worker with runtime provider secrets; verify registration/status/logs.
- LCD-4 IN PROGRESS: Configure the public frontend's server-side connection and verify a real dispatched session, response, and UI RPC. Verify and deploy the tool-error regression fix.
- LCD-5 TODO: Record verified results and publish only non-secret deployment configuration/documentation.

## D. Work Evidence

- `.env` credentials successfully authenticate a read-only agent-list request to the portfolio Cloud project; no existing agents returned.
- Verified source dispatch name matches the frontend: `signal-room-representative`.
- Initial Dockerfile generation without explicitly loading `.env` attempted to use the CLI's unrelated default project and failed on sandbox network access before writing files. Subsequent commands explicitly load `.env` credentials and set the project URL. No resource was created in that unrelated project.
- Generated the official Dockerfile and `.dockerignore` using the intended project's credentials. The CLI incorrectly autodetected a dependency's `av/__main__.py` inside the local virtualenv as the entrypoint; corrected CMD to `uv run --no-sync agent.py start` and matched the tested local Python 3.12 runtime. Docker ignore excludes `.venv/`, `.env*`, caches, and tests. Dependencies use the checked-in lockfile, and ML assets download during image build.
- Verified current docs support the existing `google/gemini-3.8-flash` inference model and `reasoning_effort: low`; no model/provider changes needed.
- `agent.py --help` imports successfully and exposes the expected production `start` command. The optional local Docker daemon check was unavailable in the sandbox; use the actual LiveKit remote build as container validation.
- Started `lk agent create agent --region ap-south` against the `.env` project. Runtime secret transfer uses a permission-restricted temporary file outside the build context containing only ElevenLabs/runtime settings; LiveKit project credentials are injected by Cloud. No unused Google or Deepgram API keys transferred.
- Free Build pricing verified from LiveKit: one deployment and included usage/inference allowance; no paid plan changes requested. Existing ElevenLabs provider quota still applies.
- Cloud agent `CA_TxwKWcpbt9ne`, initial version `m6My338FDDmN`, built remotely and is Running in `ap-south`. Logs confirm worker registration as `signal-room-representative` in India South. Stored provider secret names are only `ELEVEN_API_KEY` and `ELEVENLABS_VOICE_ID`.
- User explicitly approved adding LiveKit credentials and the agent name to the existing Render frontend. Per-variable API updates preserved other settings. Render deployment `dep-dc47g5c9v7es73e3klqg` is live; public `/api/livekit/status` returns configured=true with the expected agent name.
- Audio simulation run `SR_hGTbVa4kR3Gq` passed 2/2 scenarios: grounded RUH AI/OpenCalls experience and no invented revenue. Simulation history storage is disabled for this project; the CLI returned graded summaries. Simulated callers do not implement the browser UI RPC.
- Added provider-backed SDK tests for project-tool dispatch, failed UI actions, and unknown revenue. The first run caught an incorrect success claim after a tool error. Added an explicit instruction requiring successful tool results before reporting page actions completed.
- Corrected the regression test to use the installed 1.8.13 typed assertion API (`next_event(type=...)` already returns a typed assertion). All three provider-backed tests then passed in 32.883s, including honest reporting after a failed UI tool. One model request timed out and recovered through the SDK's existing retry behavior.
- Public browser session verified an agent greeting, streaming captions, active incoming audio (`readyState=4`, playing, live/unmuted audio track), and timing metrics. Asking to show the OpenCalls architecture produced successful `show_architecture("opencalls")` RPC and opened the correct architecture panel. Ending the session removed both dock and audio element. Browser microphone input was unavailable; the separate audio simulations exercised STT/TTS.
- Secret scan of all Git-tracked and nonignored candidate files passed against the actual local credential values; `.env`, `.venv`, and Python test caches remain ignored. No keys are in the deployment configuration.
- Updated `agent/README.md` with existing-deployment update commands, server-side Render configuration, regression tests, and simulation verification. Corrected prompt deployed successfully as version `EfTRURcUoCgj` (remote container build passed), status Running. Final audio simulation run `SR_TyYre35NbAnS` passed 2/2 scenarios against this version.
- Browser verification also exposed a first-message race: room transport connection succeeds before the worker joins and registers its text handler. An immediate submission produced no response; resending after the greeting succeeded. The client currently broadcasts `lk.chat` as soon as the room connects. Fix text submission to await the documented active agent states (`listening`, `thinking`, `speaking`), with a bounded wait and an explicit error on timeout/disconnect. Keep the existing Room-based architecture; no component SDK migration or new dependency is needed. See [agent state](https://docs.livekit.io/frontends/build/agent-state/); Context7 checked client SDK 2.25.0 event contracts.
- Implemented readiness waiting in `src/hooks/use-livekit-agent.ts`: temporary room listeners are removed on success, timeout, or disconnection; the pending message remains in the input on failure, and errors state that it was not sent. Updated dock copy to distinguish connection progress from unavailability. Local browser test from a fresh connection passed with one immediate architecture question: correct panel, successful RPC, captions, and playing audio. Ending a session during startup also exercised the explicit disconnection error. `npm run build`, `npm run typecheck`, and `git diff --check` passed. Lint remains unconfigured as documented by the earlier frontend task.

## E. Recovery State

- Active: LCD-4. Agent prompt fix is Running as `EfTRURcUoCgj`; final audio simulations passed. Next: commit/push the client startup fix and deployment files, deploy that revision to Render, and verify the first prompt on the public site. Finish evidence and publish the documentation update.
- Starting source: `a7dff2b` on `feat/interactive-acoustic-upgrades`; working tree initially clean.
- Use `.env` via python-dotenv in a subprocess environment, not shell sourcing or secrets on command arguments. Redact credential values from captured command output.
- Existing Cloud agent is `CA_TxwKWcpbt9ne`; use `agent deploy agent`, not another create. Do not alter the CLI's unrelated default project. Render is already configured with the user's explicit approval.
