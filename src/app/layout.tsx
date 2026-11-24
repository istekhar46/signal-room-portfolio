import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Shippori_Mincho } from "next/font/google";
import { PORTFOLIO } from "@/data/portfolio";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
  display: "swap",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mincho",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Istekhar Khan — Voice AI & Full-Stack AI Engineer",
  description:
    "Interactive Signal Room portfolio of Istekhar Khan, Founder at OpenCalls. Speak directly with a LiveKit-powered AI voice representative that orchestrates the interface in real time.",
  keywords: [
    "Istekhar Khan",
    "Voice AI Engineer",
    "OpenCalls",
    "LiveKit Agents",
    "WebRTC",
    "ElevenLabs TTS",
    "gRPC",
    "Full-Stack AI Engineer",
  ],
  openGraph: {
    title: "Istekhar Khan — Engineering Intelligence Into Conversations.",
    description:
      "Voice AI Engineer building real-time voice agents, telephony & WebRTC pipelines, distributed gRPC control planes, and full-stack AI systems.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@istekharkhan46",
    title: "Istekhar Khan — Voice AI & Full-Stack AI Engineer",
    description:
      "Founder at OpenCalls. Speak directly with a LiveKit WebRTC voice representative inside Signal Room.",
  },
};

export const viewport: Viewport = {
  themeColor: "#121418",
  colorScheme: "dark",
};

const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PORTFOLIO.person.name,
  jobTitle: PORTFOLIO.person.role,
  worksFor: {
    "@type": "Organization",
    name: "OpenCalls",
    url: "https://www.opencallsai.com",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pune",
    addressCountry: "IN",
  },
  email: `mailto:${PORTFOLIO.person.email}`,
  sameAs: [
    PORTFOLIO.person.github,
    PORTFOLIO.person.linkedin,
    PORTFOLIO.person.medium,
    PORTFOLIO.person.twitter,
  ],
  knowsAbout: [
    "Voice AI",
    "LiveKit Agents",
    "WebRTC",
    "SIP Telephony",
    "ElevenLabs TTS",
    "gRPC",
    "OpenTelemetry",
    "Redis",
    "Next.js",
    "Python",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${shipporiMincho.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#121418] text-[#EFF0F1] font-sans antialiased overflow-x-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}
