import { once } from "node:events";
import assert from "node:assert/strict";
import test from "node:test";
import { TokenVerifier } from "livekit-server-sdk";
import { createApp } from "../app.mjs";
import voices from "../voices.json" with { type: "json" };

const config = {
  livekitUrl: "wss://test.livekit.cloud",
  apiKey: "test-api-key",
  apiSecret: "test-only-secret-for-jwt-verification",
  agentName: "signal-room-representative",
  allowedOrigin: "https://portfolio.example",
};
const verifier = new TokenVerifier(config.apiKey, config.apiSecret);

async function withApi(run, overrides = {}) {
  const server = createApp({ ...config, ...overrides }).listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

function post(base, body, headers = {}) {
  return fetch(`${base}/api/livekit/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

test("status exposes configuration presence without credentials and disables caching", async () => {
  await withApi(async (base) => {
    const response = await fetch(`${base}/api/livekit/status`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { configured: true, agentName: config.agentName });
  });
});

test("tokens have a valid signature, room-scoped grants, 15-minute TTL, and explicit dispatch", async () => {
  await withApi(async (base) => {
    const response = await post(base, { participantName: "Private Visitor Name" });
    assert.equal(response.status, 200);
    const data = await response.json();
    const claims = await verifier.verify(data.participantToken);
    assert.equal(data.serverUrl, config.livekitUrl);
    assert.equal(claims.sub, data.participantIdentity);
    assert.ok(!data.participantIdentity.includes("Private"));
    assert.equal(claims.video.room, data.roomName);
    assert.equal(claims.video.roomJoin, true);
    assert.equal(claims.video.canPublishData, true);
    assert.equal(claims.video.canPublish, true);
    assert.equal(claims.video.canSubscribe, true);
    assert.equal(claims.video.roomAdmin, undefined);
    assert.equal(claims.exp - claims.nbf, 900);
    assert.equal(claims.roomConfig.agents[0].agentName, config.agentName);
    assert.deepEqual(JSON.parse(claims.roomConfig.agents[0].metadata), {
      persona: "representative", voiceId: voices[0].voiceId,
    });
  });
});

test("each supported voice and selected persona reaches dispatch metadata", async () => {
  await withApi(async (base) => {
    const rooms = new Set();
    for (const voice of voices) {
      const response = await post(base, { persona: "architect", voiceKey: voice.key });
      assert.equal(response.status, 200);
      const data = await response.json();
      const claims = await verifier.verify(data.participantToken);
      assert.equal(data.voiceKey, voice.key);
      assert.deepEqual(JSON.parse(claims.roomConfig.agents[0].metadata), {
        persona: "architect", voiceId: voice.voiceId,
      });
      rooms.add(data.roomName);
    }
    assert.equal(rooms.size, voices.length);
  });
});

test("malformed fields, unknown selections, and arrays receive explicit 400 responses", async () => {
  await withApi(async (base) => {
    for (const body of [{ participantName: 123 }, { persona: "unknown" }, { voiceKey: "unknown" }, []]) {
      const response = await post(base, body);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, "INVALID_REQUEST");
    }
    const malformed = await fetch(`${base}/api/livekit/token`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).code, "INVALID_JSON");
  });
});

test("oversized bodies are rejected without issuing a token", async () => {
  await withApi(async (base) => {
    const response = await post(base, { participantName: "x".repeat(3000) });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).code, "REQUEST_TOO_LARGE");
  });
});

test("only the configured browser origin passes CORS and preflight", async () => {
  await withApi(async (base) => {
    const response = await fetch(`${base}/api/livekit/token`, {
      method: "OPTIONS",
      headers: { Origin: config.allowedOrigin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), config.allowedOrigin);
    const denied = await post(base, {}, { Origin: "https://unrelated.example" });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
  });
});

test("token requests are rate limited per client", async () => {
  await withApi(async (base) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await post(base, {});
      assert.equal(response.status, 200);
      await response.arrayBuffer();
    }
    const response = await post(base, {});
    assert.equal(response.status, 429);
    assert.equal((await response.json()).code, "RATE_LIMITED");
    assert.ok(response.headers.get("retry-after"));
    const otherClient = await post(base, {}, { "X-Forwarded-For": "203.0.113.20" });
    assert.equal(otherClient.status, 200);
    await otherClient.arrayBuffer();
  });
});

test("missing configuration is explicit and unknown endpoints return 404", async () => {
  await withApi(async (base) => {
    const status = await fetch(`${base}/api/livekit/status`).then((response) => response.json());
    assert.equal(status.configured, false);
    assert.equal((await post(base, {})).status, 503);
    assert.equal((await fetch(`${base}/unknown`)).status, 404);
  }, { apiSecret: undefined });
});
