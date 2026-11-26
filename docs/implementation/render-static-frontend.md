# Render static frontend migration

## A. Original Requirements

- User: "make the fronted static service if backend is now on awws".
- Serve the portfolio as a Render static site/CDN now that token/status APIs run on AWS Lightsail.
- User explicitly chose **a new static-site URL** instead of preserving `signal-room-portfolio.onrender.com`.
- Preserve interactive UI, social images, voice/session behavior, and AWS API integration. Keep secrets server-side. Verify the replacement before retiring the old Node web service.

## B. Technical Assessment

- Start: `ff54a3f2468b79f3f78a6b6b7672335b26cd17d6` on `feat/interactive-acoustic-upgrades`, initially clean.
- Next.js 16.4.6 frontend has only prerendered pages/metadata assets. API routes were removed by the completed AWS migration. No `next/image` usage or request-dependent routes were found.
- Current Next config lacks `output: "export"`. Enable it and verify actual `out/` artifacts, including ImageResponse social images. No image optimization setting is needed without `next/image`.
- Current Render web service: `srv-dc46p4vf3r2c73af9060`, `signal-room-portfolio`, old origin `https://signal-room-portfolio.onrender.com`.
- Render requires a separate static-site service. Create `signal-room-portfolio-static` through the CLI, publishing `out/`, using the existing branch/repository and public AWS API URL. Disable old service autodeploy before pushing the export configuration, so its working Node release is preserved until the new site is verified. Suspend the old web service after successful cutover; retain it as a reversible rollback rather than deleting its history.
- Build command: `npm ci --include=dev && NEXT_PUBLIC_SITE_URL="$RENDER_EXTERNAL_URL" npm run build`; build environment: `NODE_VERSION=24`, `SKIP_INSTALL_DEPS=true`, `NEXT_PUBLIC_API_BASE_URL=https://signal-room-api.16-178-253-21.sslip.io`. No frontend start command or private LiveKit credentials.
- AWS API runs as `signal-room-api` on existing `invoiceo-api-db`, account `988031157994`, region `ap-southeast-2`, static IP `16.178.253.21`. Do not create an instance or alter Invoiceo services. Voice worker remains on LiveKit Cloud.
- API currently allows only the old frontend origin. Extend its configured CORS allowlist for both old and verified new origins during the migration/rollback window, using the existing cors middleware. Test allowed/denied origins. Keep the same private configuration variable, interpreting its value as a comma-separated list.
- Official evidence: Context7/Next.js static export guide and source confirm build-time metadata routes; Render static-site/Next.js guides specify `out/`, and Render migration docs require a new service for a runtime-type change.

## C. Implementation Checklist

- RSF-1 DONE: Inspect frontend/static compatibility, hosting constraints, and confirm new URL preference.
- RSF-2 DONE: Export and verify static output; adapt API origin configuration/tests and prepare safe Render rollout.
- RSF-3 IN PROGRESS: Publish source, create the Render static service, update AWS CORS for its actual origin, and verify deployment/HTTP/social assets.
- RSF-4 TODO: Verify a real browser voice/UI session and terminal API ping on the static site; suspend old web service; restore temporary access and publish final evidence.

## D. Work Evidence

- Initial tree clean; all frontend routes are currently prerendered, and token/status endpoints are on AWS.
- User approved a new URL after the separate-service constraint was explained.
- Enabled Next static export and removed the obsolete `next start` script. The initial export failed because the generated social-image routes require explicit `dynamic = "force-static"`; added it to both image modules. A fresh production build passed, exporting the homepage, 404, icon, and both 89,419-byte PNGs to `out/`. Social metadata uses the intended static-site origin. Typecheck and diff whitespace checks passed.
- API CORS now accepts a comma-separated list through the existing `ALLOWED_ORIGIN` configuration. All nine HTTP regression tests passed, including both allowed origins and unrelated-origin rejection. Sandbox initially prevented test listeners; the network-enabled rerun passed. The live smoke check now requires `FRONTEND_ORIGIN` rather than hardcoding the old hostname.
- Render CLI update disabled old service autodeploy; subsequent service inventory confirmed `autoDeploy: no`, with the old web service still running. No duplicate static site exists for this repository. AWS identity rechecked: account `988031157994`, correct Sydney instance firewall unchanged.

## E. Recovery State

- Active: RSF-3. Next: scan/review source and export for secrets, commit/push export-capable changes, then create `signal-room-portfolio-static` through the Render CLI. Verify its actual URL before updating AWS CORS and smoke checks. The old service's autodeploy is already off.
- Old production remains `https://signal-room-portfolio.onrender.com` until replacement is verified. API and voice deployments are healthy. New URL is explicitly authorized.
- AWS commands must use `--profile invoice --region ap-southeast-2`, verifying account `988031157994` before mutation. SSH needs fresh short-lived credentials; original instance SSH rule permits `27.59.102.223/32` and `lightsail-connect`. Any temporary operator `/32` must be removed after deployment. Do not print credentials/JWTs or include env files in Docker/static artifacts. Leave the user's dev server on port 3000 running.
