import { NextResponse } from "next/server";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";
import { AGENT_VOICES, type AgentVoiceKey } from "@/lib/ui-actions";

const VOICE_MAP: Record<AgentVoiceKey, string> = Object.fromEntries(
  AGENT_VOICES.map((v) => [v.key, v.voiceId])
) as Record<AgentVoiceKey, string>;

export async function POST(request: Request) {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const agentName =
    process.env.LIVEKIT_AGENT_NAME ?? "signal-room-representative";

  if (!livekitUrl || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error:
          "LiveKit voice server is not configured yet. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET in .env.local and run the Python worker in agent/.",
        code: "LIVEKIT_UNCONFIGURED",
      },
      { status: 503 }
    );
  }

  let requestedIdentity: string | undefined;
  let persona: "representative" | "architect" | "opencalls-demo" = "representative";
  let voiceKey: AgentVoiceKey = "sarah";
  try {
    const body = (await request.json()) as {
      participantName?: string;
      persona?: string;
      voiceKey?: string;
    };
    requestedIdentity = body.participantName?.trim().slice(0, 48);
    if (
      body.persona === "representative" ||
      body.persona === "architect" ||
      body.persona === "opencalls-demo"
    ) {
      persona = body.persona;
    }
    if (body.voiceKey === "sarah" || body.voiceKey === "alice" || body.voiceKey === "bella") {
      voiceKey = body.voiceKey;
    }
  } catch {
    // Empty body is valid
  }
  const voiceId = VOICE_MAP[voiceKey];

  const sessionSuffix = crypto.randomUUID().slice(0, 8);
  const roomName = `signal-room-${sessionSuffix}`;
  const identity = requestedIdentity
    ? `${requestedIdentity.replace(/[^a-zA-Z0-9_-]/g, "")}-${sessionSuffix}`
    : `visitor-${sessionSuffix}`;

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: requestedIdentity || "Portfolio Visitor",
    ttl: "15m",
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  });

  token.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName,
        metadata: JSON.stringify({ persona, voiceId }),
      }),
    ],
  });

  const jwt = await token.toJwt();

  return NextResponse.json({
    serverUrl: livekitUrl,
    roomName,
    participantIdentity: identity,
    participantToken: jwt,
    persona,
    voiceKey,
  });
}
