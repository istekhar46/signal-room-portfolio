import assert from "node:assert/strict";
import { TokenVerifier } from "livekit-server-sdk";

const base = process.env.API_BASE_URL;
if (!base || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
  throw new Error("Set API_BASE_URL and the LiveKit verification credentials before running this check.");
}
try {
  const statusResponse = await fetch(`${base}/api/livekit/status`);
  assert.equal(statusResponse.status, 200);
  assert.equal(statusResponse.headers.get("cache-control"), "no-store");
  const status = await statusResponse.json();
  assert.equal(status.configured, true);
  const origin = "https://signal-room-portfolio.onrender.com";
  const preflight = await fetch(`${base}/api/livekit/token`, {
    method: "OPTIONS",
    headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  const tokenResponse = await fetch(`${base}/api/livekit/token`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ persona: "architect", voiceKey: "alice" }),
  });
  assert.equal(tokenResponse.status, 200);
  const token = await tokenResponse.json();
  const claims = await new TokenVerifier(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET).verify(token.participantToken);
  assert.ok(claims.video.room === token.roomName && claims.video.roomJoin && claims.video.canPublishData);
  assert.ok(claims.sub === token.participantIdentity && claims.exp - claims.nbf === 900);
  const agent = claims.roomConfig.agents[0];
  assert.equal(agent.agentName, "signal-room-representative");
  assert.deepEqual(JSON.parse(agent.metadata), { persona: "architect", voiceId: "Xb7hH8MSUJpSbSDYk0k2" });
  const invalid = await fetch(`${base}/api/livekit/token`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voiceKey: "unsupported" }),
  });
  assert.equal(invalid.status, 400);
  const blocked = await fetch(`${base}/api/livekit/token`, {
    method: "POST", headers: { Origin: "https://unrelated.example", "Content-Type": "application/json" }, body: "{}",
  });
  assert.equal(blocked.status, 403);
  console.log("PASS: trusted HTTPS, status, no-store, CORS/preflight, signed room token, dispatch metadata, and rejected invalid requests. No JWT or credential values printed.");
} catch (error) {
  console.error(`Deployed API check failed (${error.name}). Credential and token values omitted.`);
  process.exitCode = 1;
}
