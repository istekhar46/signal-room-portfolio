import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "Istekhar Khan — Voice AI & Full-Stack AI Engineer · Signal Room";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#121418",
          color: "#EFF0F1",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Top 4px Safety Orange signal bar */}
        <div style={{ width: "100%", height: 5, backgroundColor: "#FF5A1F", display: "flex" }} />

        {/* Subtle grid background accent */}
        <div
          style={{
            flex: 1,
            display: "flex",
            padding: "56px 68px",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left editorial column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 670,
              height: "100%",
            }}
          >
            {/* Brand bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  backgroundColor: "#38D9A9",
                  display: "flex",
                }}
              />
              <span
                style={{
                  fontSize: 18,
                  letterSpacing: "0.14em",
                  color: "#FF9F38",
                  fontWeight: 600,
                }}
              >
                SIGNAL ROOM // LIVE VOICE AI PORTFOLIO
              </span>
            </div>

            {/* Monumental headline */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                  color: "#EFF0F1",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span>Engineering</span>
                <span>Intelligence Into</span>
                <span>Conversations.</span>
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: "#C4C8D0",
                  lineHeight: 1.4,
                  display: "flex",
                }}
              >
                Istekhar Khan — Voice AI &amp; Full-Stack AI Engineer · Founder at OpenCalls
              </div>
            </div>

            {/* Bottom telemetry rail */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                borderTop: "1px solid #2B303B",
                paddingTop: 22,
                fontSize: 16,
                color: "#9499A3",
                letterSpacing: "0.08em",
              }}
            >
              <span style={{ color: "#38D9A9" }}>LIVEKIT WEBRTC</span>
              <span>·</span>
              <span>ELEVENLABS TTS</span>
              <span>·</span>
              <span>gRPC CONTROL PLANE</span>
              <span>·</span>
              <span>OPENTELEMETRY</span>
            </div>
          </div>

          {/* Right J.A.R.V.I.S. holographic core emblem */}
          <div
            style={{
              width: 370,
              height: 370,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <svg width="360" height="360" viewBox="0 0 360 360" fill="none">
              <circle cx="180" cy="180" r="168" stroke="#2B303B" strokeWidth="1.5" />
              <circle
                cx="180"
                cy="180"
                r="148"
                stroke="#FF9F38"
                strokeWidth="2.5"
                strokeDasharray="68 22 44 26"
                opacity="0.85"
              />
              <circle
                cx="180"
                cy="180"
                r="118"
                stroke="#FF5A1F"
                strokeWidth="3"
                strokeDasharray="96 34 62 30"
                opacity="0.9"
              />
              <circle
                cx="180"
                cy="180"
                r="92"
                stroke="#38D9A9"
                strokeWidth="2"
                strokeDasharray="52 18 36 18"
                opacity="0.85"
              />
              <circle cx="180" cy="180" r="64" stroke="#FF9F38" strokeWidth="1.5" opacity="0.6" />
              <polygon
                points="180,126 226,153 226,207 180,234 134,207 134,153"
                stroke="#FF9F38"
                strokeWidth="2"
                fill="rgba(255, 159, 56, 0.1)"
              />
              <circle cx="180" cy="180" r="22" fill="#FF5A1F" />
              <circle cx="180" cy="180" r="9" fill="#EFF0F1" />
              {/* Axis crosshairs */}
              <line x1="0" y1="180" x2="36" y2="180" stroke="#FF5A1F" strokeWidth="2" />
              <line x1="324" y1="180" x2="360" y2="180" stroke="#FF5A1F" strokeWidth="2" />
              <line x1="180" y1="0" x2="180" y2="36" stroke="#FF5A1F" strokeWidth="2" />
              <line x1="180" y1="324" x2="180" y2="360" stroke="#FF5A1F" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
