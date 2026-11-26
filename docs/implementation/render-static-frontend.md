# Render static frontend migration

## A. Original Requirements

- User: "make the fronted static service if backend is now on awws".
- Serve the portfolio as a Render static site/CDN now that token/status APIs run on AWS Lightsail.
- User explicitly chose **a new static-site URL** instead of preserving `signal-room-portfolio.onrender.com`.
- Preserve interactive UI, social images, voice/session behavior, and AWS API integration. Keep secrets server-side. Verify the replacement before retiring the old Node web service.

## B. Technical Assessment

- Start: `ff54a3f2468b79f3f78a6b6b7672335b26cd17d6` on `feat/interactive-acoustic-upgrades`, initially clean.
- Next.js 16.4.6 frontend has only prerendered pages/metadata assets. API routes were removed by the completed AWS migration. No `next/image` usage or request-dependent routes were found.
- Initial Next config lacked `output: "export"`. Enable it and verify actual `out/` artifacts, including ImageResponse social images. No image optimization setting is needed without `next/image`.
- Original Render web service: `srv-dc46p4vf3r2c73af9060`, `signal-room-portfolio`, old origin `https://signal-room-portfolio.onrender.com`.
- Render requires a separate static-site service. Create `signal-room-portfolio-static` through the CLI, publishing `out/`, using the existing branch/repository and public AWS API URL. Disable old service autodeploy before pushing the export configuration, so its working Node release is preserved until the new site is verified. Suspend the old web service after successful cutover; retain it as a reversible rollback rather than deleting its history.
- Build command: `npm ci --include=dev && NEXT_PUBLIC_SITE_URL="$RENDER_EXTERNAL_URL" npm run build`; build environment: `NODE_VERSION=24`, `SKIP_INSTALL_DEPS=true`, `NEXT_PUBLIC_API_BASE_URL=https://signal-room-api.16-178-253-21.sslip.io`. No frontend start command or private LiveKit credentials.
- AWS API runs as `signal-room-api` on existing `invoiceo-api-db`, account `988031157994`, region `ap-southeast-2`, static IP `16.178.253.21`. Do not create an instance or alter Invoiceo services. Voice worker remains on LiveKit Cloud.
- API initially allowed only the old frontend origin. Extend its configured CORS allowlist for both old and verified new origins during the migration/rollback window, using the existing cors middleware. Test allowed/denied origins. Keep the same private configuration variable, interpreting its value as a comma-separated list.
- Official evidence: Context7/Next.js static export guide and source confirm build-time metadata routes; Render static-site/Next.js guides specify `out/`, and Render migration docs require a new service for a runtime-type change.

## C. Implementation Checklist

- RSF-1 DONE: Inspect frontend/static compatibility, hosting constraints, and confirm new URL preference.
- RSF-2 DONE: Export and verify static output; adapt API origin configuration/tests and prepare safe Render rollout.
- RSF-3 DONE: Publish source, create the Render static service, update AWS CORS for its actual origin, and verify deployment/HTTP/social assets.
- RSF-4 DONE: Verify a real browser voice/UI session and terminal API ping on the static site; suspend old web service; restore temporary access and publish final evidence.

## D. Work Evidence

- Initial tree clean; all frontend routes are currently prerendered, and token/status endpoints are on AWS.
- User approved a new URL after the separate-service constraint was explained.
- Enabled Next static export and removed the obsolete `next start` script. The initial export failed because the generated social-image routes require explicit `dynamic = "force-static"`; added it to both image modules. A fresh production build passed, exporting the homepage, 404, icon, and both 89,419-byte PNGs to `out/`. Social metadata uses the intended static-site origin. Typecheck and diff whitespace checks passed.
- API CORS now accepts a comma-separated list through the existing `ALLOWED_ORIGIN` configuration. All nine HTTP regression tests passed, including both allowed origins and unrelated-origin rejection. Sandbox initially prevented test listeners; the network-enabled rerun passed. The live smoke check now requires `FRONTEND_ORIGIN` rather than hardcoding the old hostname.
- Render CLI update disabled old service autodeploy; subsequent service inventory confirmed `autoDeploy: no`, with the old web service still running. No duplicate static site exists for this repository. AWS identity rechecked: account `988031157994`, correct Sydney instance firewall unchanged.
- Export-capable source committed/pushed as `7406ae6174daa90a0d61f3d67149cb9fa4faa095`. Exact-value credential scan passed across 614 tracked/export files. Created `srv-dc48vdmq1p3s73d9behg` through `render services create`; provider confirms `type: static_site`, publish path `out`, actual URL `https://signal-room-portfolio-static.onrender.com`. Deploy `dep-dc48vduq1p3s73d9bfb0` finished `live` on this source. Remote build logs also confirm all routes static and site publication successful.
- Deployed AWS API image `signal-room-api:7725dc4d610b7739` from a 12,324-byte source-only archive. Updated only the API code/allowed origins, preserving existing server secrets/proxy metadata. Runtime inspection confirms healthy API, unprivileged user, read-only filesystem, resource limits, no published ports, no secrets in image configuration, and root-owned mode-0600 env file. Invoiceo API/database remain healthy on unchanged images; proxy/Docker aliases remain separate. API uses ~28 MiB.
- Deployed HTTPS smoke check passed with `FRONTEND_ORIGIN=https://signal-room-portfolio-static.onrender.com`: configured status/no-store, CORS/preflight, real JWT signature/room grants/15-minute TTL and dispatch, invalid requests and unrelated-origin rejection. Temporary SSH `/32` was removed; comparison verified all other rules preserved, then local private key/certificate/state files were deleted.
- Public static HTTP checks: homepage 200, removed `/api/livekit/status` 404, unknown route 404, both social images 200 with PNG bytes and correct new-origin metadata. Render initially served extensionless generated PNGs as `binary/octet-stream`; added two response-header rules through the Render API (CLI has no header command): `/opengraph-image` and `/twitter-image`, `Content-Type: image/png`. These rules are required if recreating this static service. Exact image URLs from HTML were rechecked successfully after the old service was suspended.
- Public browser voice check passed: AWS status GET/token POST both 200 from the new static origin, real incoming audio playing/live/unmuted, streamed answer captions, TTS timing, correct architecture panel, and `show_architecture("opencalls")` RPC success. A fresh session's End button removed dock/audio. Diagnostic terminal `ping` returned AWS 200. Mobile 390x844 with reduced motion: hero, navigation open/close, no horizontal overflow. Desktop hero fits at 1440px. Console: zero errors, existing Three.Clock deprecation warning only. Test-owned browser tab closed.
- Final provider inspection verified the new static service has exactly three public build settings (`NODE_VERSION`, `SKIP_INSTALL_DEPS`, `NEXT_PUBLIC_API_BASE_URL`) and no private LiveKit settings. Old web service suspension returned 202; subsequent inspection confirms `suspended`, `autoDeploy: no`. New homepage/social assets/AWS status still work afterward. No instance, IP, proxy, agent, or paid-plan changes were made.
- Limits: microphone capture was not exercised; browser testing used typed FAQ input with real agent audio output. Existing unconfigured ESLint remains unchanged; production build, typecheck, API tests, live smoke, and browser checks supplied validation. API keeps the approved temporary sslip.io hostname.

## E. Recovery State

- Complete. Live frontend: **https://signal-room-portfolio-static.onrender.com**, Render static service `srv-dc48vdmq1p3s73d9behg`, source/deploy above. GitHub branch `feat/interactive-acoustic-upgrades` auto-deploys; `agent/**` and `docs/**` are ignored. Final documentation-only publication needs no new build. [Static dashboard](https://dashboard.render.com/static/srv-dc48vdmq1p3s73d9behg).
- API: `https://signal-room-api.16-178-253-21.sslip.io`, image `signal-room-api:7725dc4d610b7739`, existing Lightsail Sydney instance/account above. `ALLOWED_ORIGIN` contains both `https://signal-room-portfolio-static.onrender.com` and `https://signal-room-portfolio.onrender.com`. Voice agent remains unchanged on LiveKit Cloud.
- [Old web service](https://dashboard.render.com/web/srv-dc46p4vf3r2c73af9060) is suspended with autodeploy off, retaining its last working Node release as rollback. To roll back, resume that service in Render; its old origin remains allowed by the API. **Do not deploy the current export branch to the old Node service**; it has no `next start` entry point. No old-URL redirect is configured; the user explicitly selected a new static URL.
- SSH rules restored and temporary credentials deleted. Future AWS commands must use `--profile invoice --region ap-southeast-2`, verifying account `988031157994` before mutation. Never print credentials/JWTs or put env files into Docker/static artifacts. Preserve Invoiceo workloads/proxy and the user's local development processes.
