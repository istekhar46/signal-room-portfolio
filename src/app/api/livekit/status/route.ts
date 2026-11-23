import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(
    process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET
  );

  return NextResponse.json({
    configured,
    agentName: process.env.LIVEKIT_AGENT_NAME ?? "signal-room-representative",
  });
}
