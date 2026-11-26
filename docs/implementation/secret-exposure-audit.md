# Secret exposure audit

Audit date: **27 November 2026 (Asia/Kolkata)**. Result: **no private credential exposure detected in the checked surfaces**. Local secret-file permissions were tightened; no application code, deployed service settings, or credential values were changed.

## A. Original Requirements

- User: "do audit if secret is not being leaked".
- Inspect source/Git history, local/build artifacts, live static assets/API responses, and deployed configuration/logs. Never print credential values or tokens. Preserve running services and Invoiceo workloads.
- Scope is exposure of this portfolio's credentials; this is not a full infrastructure penetration test or dependency audit.

## B. Technical Assessment

- Start: clean tree at `0868227`, branch `feat/interactive-acoustic-upgrades`.
- Frontend is Render static service `srv-dc48vdmq1p3s73d9behg`; AWS API is `signal-room-api` on existing Lightsail `invoiceo-api-db`, account `988031157994`, Sydney. Voice worker is LiveKit Cloud `CA_TxwKWcpbt9ne`.
- Source reads private credentials only in backend/agent modules. Frontend uses public API/site URLs. API intentionally returns short-lived room tokens to anonymous visitors; verify scope/cache/logging rather than treating these tokens as project credentials.
- Use redacted mature scanner plus exact-value comparisons against local configured credentials. Scan raw results privately; reports contain only rule identifiers, paths, locations/counts, and classifications.
- Initial observation: local `.env` and ignored MCP configuration were mode 0644. Desktop is mode 0700, preventing other local users from traversing the path. Tighten files to 0600 as local hardening; this is not evidence of public disclosure.
- Current service audit requires read-only provider API/CLI access. If temporary instance SSH access is required, preserve original rules, remove only audit-added access, and delete ephemeral credentials afterward.

## C. Implementation Checklist

- SEA-1 DONE: Source/configuration review, current/history exact-value and pattern scan.
- SEA-2 DONE: Scan public static artifacts and probe common secret paths/API responses.
- SEA-3 DONE: Verify Render, AWS API runtime/image/logs, and LiveKit secret handling; clean temporary access.
- SEA-4 DONE: Resolve confirmed low-impact issues within scope, verify, and publish a redacted report with limits.

## D. Work Evidence

- Initial tree clean. `.gitignore` excludes `.env*` except `.env.example`, private MCP configuration, dependencies, build outputs, and browser tooling artifacts. Tracked sensitive-path inventory contains only `.env.example`, whose values are placeholders.
- Backend Docker build context is an explicit runtime allowlist. Agent Docker context excludes env files. Both images use unprivileged runtime users. API code logs only an error type and disables response caching; inspect deployed artifacts/logs independently before concluding.
- Context7 confirmed Next.js `NEXT_PUBLIC_` values are inlined at build time. LiveKit docs confirmed server-side API-secret signing, browser-visible room JWTs/API-key issuer identifier, and runtime-injected encrypted agent secrets. CLI can list secret metadata but cannot retrieve values. References: [tokens/grants](https://docs.livekit.io/frontends/reference/tokens-grants/), [agent secrets](https://docs.livekit.io/deploy/agents/secrets/).
- Fetched remote Git refs. All 18 reachable commits / 151 distinct Git blobs checked for six currently configured credential values, including plaintext, URL encoding, Base64, and Base64url forms: no matches. Names checked: LiveKit API key/secret, ElevenLabs, Google, Deepgram, Context7. This does not reveal their values.
- Downloaded official Gitleaks 8.30.1 macOS Arm64 release into a mode-0700 temporary folder and verified its published SHA-256. Default-rule scans with full redaction and no inline allow-comment exclusions: Git history (scanner reports 15 commits / ~1.59 MB), local exported content (~4.34 MB), and actual downloaded live content (~4.56 MB) all returned zero findings. The independent full-object scan covered all 18 reachable commits. Exact-value scan also covered 615 source/export files. GitHub secret-scanning alerts endpoint returned no alerts.
- Live frontend scan fetched 40 successful public artifacts (~4.56 MB), including generated HTML/JS/CSS/RSC and social images. Seven additional local-build filenames returned 404 because Render's build has different entry hashes; production HTML references supplied the live entry files. No private values/patterns found. Probed 19 common sensitive paths on each host (38 total), including env files, Git metadata, MCP config, backend source, server output, and Dockerfile: all 404. All 29 source-map URL probes returned 404. Font/image pixels and unreferenced unknown URLs were not exhaustively crawled.
- Live API checks: status exposes only `configured`/agent name; token response contains room connection data and JWT, with 900-second initial validity, exactly one room, and no admin/list/create/record/SIP grants. Signed token's `iss` matches the LiveKit API-key **identifier**, intentionally readable in JWTs; it is not the signing secret. No private credentials in decoded token or any tested response. Status/token/errors/preflight use `Cache-Control: no-store`; invalid input is 400, unrelated browser origin 403. Requests without Origin also receive a token, consistent with the intentionally anonymous API. CORS is not authentication; rate limiting and current public visitor access remain unchanged.
- Read-only Render configuration audit: active static service has only `NEXT_PUBLIC_API_BASE_URL`, `NODE_VERSION`, `SKIP_INSTALL_DEPS`; suspended old web service has only API URL and Node version. Neither has private credential variables or known private values in its configuration. Bounded samples of 20 log records from each service (8,954/8,030 bytes) had no configured credential matches. A larger 200-record CLI query stalled, was stopped, and was replaced with successful time-limited samples; complete historical Render logs were not audited.
- LiveKit agent lists only provider secret names `ELEVEN_API_KEY`, `ELEVENLABS_VOICE_ID`. Metadata has no known credential values. Bounded CLI log captures: 222 runtime lines / 126,230 bytes and 109 build lines / 6,302 bytes; neither contains known configured credential values. Redacted Gitleaks scan of all captured provider logs (~154 KB, including a smaller preliminary Render query) returned zero findings. Provider secrets are not retrievable, so the deployed agent image/complete historical logs cannot be independently certified by these checks.
- AWS account/target verified before temporary SSH access. Audit ran entirely read-only on the portfolio service: current image `signal-room-api:7725dc4d610b7739` healthy; env file root-owned mode 0600, only expected LiveKit/CORS settings; unprivileged/read-only container, no host ports, only web network. Complete image stream (16 outer members, 7 decoded gzip blobs, 187,736,870 bytes), image config, and build history contain neither runtime LiveKit credential. API runtime log: one 61-byte startup line, no credentials/JWTs. Image context allowlist and agent env exclusions reviewed. Invoiceo API/database/proxy stayed running; images unchanged.
- Fixed the two local secret-file permissions to 0600 without changing contents. `/opt/signal-room-api/.env` holds only a public image tag; actual private settings stay in `api.env`. No key rotation was performed because no credential disclosure was found.
- Scanned 110 portfolio-task temporary files for configured credential values/encodings: zero matches, no large files skipped. Temporary files from unrelated applications/accounts were outside scope.
- Removed the audit-added SSH `/32`, compared final firewall rules against the originals (all other rules preserved), and deleted ephemeral SSH keys/certificate/state. Raw sampled logs/assets/scanner artifacts were kept under a mode-0700 temporary folder and removed after verification; only this redacted report is published.

### Interpretation and limits

- Public API/site URLs, LiveKit project/agent identifiers, voice IDs, and JWT issuer API-key identifiers are expected public metadata. They do not let callers sign tokens. The API signing secret and provider keys must remain private; none were detected in checked public content/responses.
- The public voice endpoint intentionally issues anonymous room-scoped tokens, including to clients without a browser Origin header. This is an existing product contract, not a leaked project credential. CORS does not prevent non-browser usage. The current per-client rate limits were not changed; abuse/cost controls are a separate review.
- This is a point-in-time source/configuration/artifact audit, not proof that a credential has never been copied or used elsewhere. It does not cover provider account access history, deleted Git objects/unavailable remote refs, complete historical logs, inaccessible LiveKit image layers, arbitrary undiscovered URLs, or other services on the instance. No account-wide key rotation is warranted by the evidence collected here.
- No frontend/backend behavior changed, so no production rebuild or functional test rerun was required. Validation consisted of secret scanners, exact-value/object/asset scans, HTTP/JWT checks, metadata/file-permission/image/log inspections, Git whitespace checks, and cleanup verification.

## E. Recovery State

- Complete. Audited application source remains `0868227`; this report is a documentation-only publication ignored by Render's build filter. Live frontend/API/agent deployments remain unchanged. No exposed private credentials were detected; no outstanding remediation from this scoped audit.
- Both local credential files use 0600, AWS private env uses root-owned 0600, and audit-added SSH access/credentials are removed. Future audits should repeat Gitleaks `git --log-opts='--all --full-history' --ignore-gitleaks-allow --redact=100`, scan the actual public build, and compare configured secrets in memory without outputting them. Recheck coverage after changes or suspected incidents.
- Never print `.env`, API credential values, JWTs, raw provider config/log output, or scanner matching lines. Store raw scan outputs mode 0600 outside the repository and summarize only safe fields. Do not rotate/revoke working credentials without evidence and a coordinated deployment plan.
