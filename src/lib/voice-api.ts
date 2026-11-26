export function livekitApiUrl(endpoint: "status" | "token"): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("The voice API endpoint is not configured.");
  return `${base.replace(/\/+$/, "")}/api/livekit/${endpoint}`;
}
