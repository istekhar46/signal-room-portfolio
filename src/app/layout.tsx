import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Shippori_Mincho } from "next/font/google";
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
  openGraph: {
    title: "Istekhar Khan — Engineering Intelligence Into Conversations.",
    description:
      "Voice AI Engineer building real-time voice agents, telephony & WebRTC pipelines, and full-stack AI systems.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#121418",
  colorScheme: "dark",
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
        {children}
      </body>
    </html>
  );
}
