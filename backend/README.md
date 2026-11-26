# Signal Room API

The token/status backend runs on the existing **`invoiceo-api-db`** Lightsail
instance in **`ap-southeast-2`**, AWS account **`988031157994`** (CLI profile
`invoice`). The frontend stays on Render; the Python voice worker stays on
LiveKit Cloud.

Public API base: **https://signal-room-api.16-178-253-21.sslip.io**

- `GET /api/livekit/status` reports configuration presence, not worker health.
- `POST /api/livekit/token` accepts optional `persona`, `voiceKey`, and
  `participantName`. It returns the existing room-token response contract and
  dispatches `signal-room-representative` with the selected persona/voice.
- Defaults: representative persona, Sarah voice, 15-minute room-scoped token.
  Invalid JSON/choices return 400; oversized JSON returns 413. Token creation is
  limited to 10 requests/minute/client. Names are kept out of room IDs and
  participant identities.

`voices.json` is shared with the frontend to keep the three available voices
consistent. JWTs and dispatch configuration use the official LiveKit server SDK.

## Local development

Use Node.js 24 or newer. From the repository root:

```bash
npm ci --prefix backend
npm run dev:api
npm run test:api
```

The development command reads `.env` followed by `.env.local` if present. Set:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ALLOWED_ORIGIN=http://localhost:3000
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
LIVEKIT_AGENT_NAME=signal-room-representative
```

Only `NEXT_PUBLIC_API_BASE_URL` belongs in frontend configuration. The other
LiveKit settings are private. The API listens on loopback by default; the Docker
image listens on its private container interface.

## Existing-instance deployment

Deployment root: `/opt/signal-room-api`. Its Compose project is `signal-room`,
with one service/container named **`signal-room-api`**. Do not name it `api`:
Invoiceo already uses that Docker DNS alias. There are no published host ports.
The container joins only the existing external `invoiceo_web` network, with no
access to the `invoiceo_database` network. It runs as the unprivileged `node`
user with a read-only filesystem, dropped capabilities, a 256 MiB memory limit,
and a 0.5 CPU limit. Docker health checks and `unless-stopped` restart policy
manage the process.

- `api.env` is root-owned, mode 0600. It contains the LiveKit API settings above
  and `ALLOWED_ORIGIN`, a comma-separated list of allowed frontend origins.
  Allow both the new static-site origin and the retained old web-service origin
  during rollout/rollback. Transfer it
  through authenticated SSH, never in image layers or command arguments. Do not
  copy ElevenLabs, model-provider, or AWS account credentials to this service.
- `compose.yaml` is installed from `deploy/compose.yaml`. Its `.env` contains
  only `SIGNAL_API_IMAGE=signal-room-api:<release-id>`.
- Each source release lives under `releases/<release-id>` and is built using
  its Dockerfile and lockfile. `.dockerignore` allows only the runtime source and
  dependency manifests; it excludes environment files and local dependencies.
- `deployment.json` records the deployed release/image, hostname, and proxy
  configuration/backup locations. It contains no credentials.

After uploading a reviewed backend release to a new release directory, run on
the instance (replace `<release-id>`):

```bash
sudo docker build --tag signal-room-api:<release-id> /opt/signal-room-api/releases/<release-id>
```

Update `SIGNAL_API_IMAGE` in `/opt/signal-room-api/.env`, then validate and start
only this Compose project:

```bash
sudo docker compose --project-directory /opt/signal-room-api -f /opt/signal-room-api/compose.yaml config --quiet
sudo docker compose --project-directory /opt/signal-room-api -f /opt/signal-room-api/compose.yaml up --detach --no-build --wait --wait-timeout 90
```

## Shared HTTPS proxy

`invoiceo-proxy-1` owns ports 80/443. The portfolio's hostname is a separate
site block tracked in `deploy/Caddyfile.fragment`. Caddy obtains and renews its
publicly trusted TLS certificate. The temporary hostname uses sslip.io DNS and
the server's existing static IP. Use an owned domain for a permanent hostname.

The active Caddyfile is a file bind mount from Invoiceo's current release;
inspect `invoiceo-proxy-1` mounts to locate it. The portfolio block is marked
`# BEGIN SIGNAL ROOM API` / `# END SIGNAL ROOM API`. Back up this file before
changes, validate a candidate inside the existing proxy, preserve the mounted
file inode when writing, then gracefully reload Caddy. Do not replace the
existing `api.invoiceo.site` route or recreate Invoiceo containers.

**When deploying a new Invoiceo proxy release, retain the portfolio site block
in its Caddyfile.** The source fragment is kept here so the shared proxy's two
sites can be restored together. API image updates alone do not need a proxy
reload.

## Verification

From the repository root, with the actual LiveKit settings in `.env`:

```bash
API_BASE_URL=https://signal-room-api.16-178-253-21.sslip.io FRONTEND_ORIGIN=https://your-static-site.onrender.com node --env-file=.env backend/test/smoke.mjs
```

This checks trusted TLS, status, cache headers, preflight/CORS, a real JWT
signature/permissions/dispatch, and invalid-request handling without printing
tokens or credentials. Unit tests use dummy signing credentials and do not call
LiveKit Inference. Finish with a real conversation on the Render frontend and
confirm the existing Invoiceo containers remain healthy.
