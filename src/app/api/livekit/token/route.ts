import { NextResponse } from "next/server";
import { AccessToken, RoomAgentDispatch, RoomConfiguration } from "livekit-server-sdk";

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
  try {
    const body = (await request.json()) as { participantName?: string };
    requestedIdentity = body.participantName?.trim().slice(0, 48);
  } catch {
    // Empty body is valid
  }

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
      }),
    ],
  });

  const jwt = await token.toJwt();

  return NextResponse.json({
    serverUrl: livekitUrl,
    roomName,
    participantIdentity: identity,
    participantToken: jwt,
  });
}
