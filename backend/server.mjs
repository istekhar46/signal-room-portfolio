import { createApp } from "./app.mjs";

const required = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "ALLOWED_ORIGIN"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing required configuration: ${missing.join(", ")}`);

const app = createApp({
  livekitUrl: process.env.LIVEKIT_URL,
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET,
  agentName: process.env.LIVEKIT_AGENT_NAME,
  allowedOrigin: process.env.ALLOWED_ORIGIN,
});
const server = app.listen(Number(process.env.PORT || 3001), process.env.HOST || "127.0.0.1", () => {
  console.log("Signal Room API is listening.");
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
