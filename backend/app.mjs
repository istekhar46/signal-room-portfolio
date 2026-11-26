import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import voices from "./voices.json" with { type: "json" };

const personas = new Set(["representative", "architect", "opencalls-demo"]);
const voiceIds = new Map(voices.map(({ key, voiceId }) => [key, voiceId]));

export function createApp(config) {
  const app = express();
  const agentName = config.agentName || "signal-room-representative";
  const configured = Boolean(config.livekitUrl && config.apiKey && config.apiSecret);
  const allowedOrigins = config.allowedOrigin.split(",").map((origin) => origin.trim());
  app.disable("x-powered-by");
  // Caddy is the single public ingress hop; the API container has no published port.
  app.set("trust proxy", 1);
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "This browser origin is not allowed.", code: "ORIGIN_NOT_ALLOWED" });
    }
    next();
  });
  app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    maxAge: 600,
  }));
  app.use("/api/livekit", rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again in a minute.", code: "RATE_LIMITED" },
  }));
  app.use(express.json({ limit: "2kb" }));

  app.get("/api/livekit/status", (_req, res) => {
    res.json({ configured, agentName });
  });

  app.post("/api/livekit/token", rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many voice sessions. Please try again in a minute.", code: "RATE_LIMITED" },
  }), async (req, res) => {
    if (!configured) {
      return res.status(503).json({ error: "The voice service is not configured.", code: "LIVEKIT_UNCONFIGURED" });
    }
    const body = req.body ?? {};
    if (typeof body !== "object" || Array.isArray(body)
      || (body.participantName !== undefined && typeof body.participantName !== "string")
      || (body.persona !== undefined && !personas.has(body.persona))
      || (body.voiceKey !== undefined && !voiceIds.has(body.voiceKey))) {
      return res.status(400).json({ error: "Provide a valid persona, voice, and optional participant name.", code: "INVALID_REQUEST" });
    }
    const persona = body.persona ?? "representative";
    const voiceKey = body.voiceKey ?? "sarah";
    const sessionId = randomUUID();
    const roomName = `signal-room-${sessionId}`;
    // Keep personal names out of identities and room names in infrastructure logs.
    const identity = `visitor-${sessionId}`;
    const token = new AccessToken(config.apiKey, config.apiSecret, {
      identity,
      name: body.participantName?.trim().slice(0, 48) || "Portfolio Visitor",
      ttl: "15m",
    });
    token.addGrant({ room: roomName, roomJoin: true, canPublish: true, canPublishData: true, canSubscribe: true });
    token.roomConfig = new RoomConfiguration({
      agents: [new RoomAgentDispatch({
        agentName,
        metadata: JSON.stringify({ persona, voiceId: voiceIds.get(voiceKey) }),
      })],
    });
    res.json({
      serverUrl: config.livekitUrl,
      roomName,
      participantIdentity: identity,
      participantToken: await token.toJwt(),
      persona,
      voiceKey,
    });
  });

  app.use((_req, res) => res.status(404).json({ error: "Endpoint not found.", code: "NOT_FOUND" }));
  app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Send a valid JSON object.", code: "INVALID_JSON" });
    }
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "The request body is too large.", code: "REQUEST_TOO_LARGE" });
    }
    // Never log request bodies, token responses, or SDK error messages containing data.
    console.error(JSON.stringify({ event: "request_failed", errorType: error.name }));
    res.status(500).json({ error: "The voice session could not be created. Please try again.", code: "TOKEN_FAILED" });
  });
  return app;
}
