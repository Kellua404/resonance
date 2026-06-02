import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Fraunces — a soft, optical, *emotional* serif: warm and human, exactly the feeling of
// reading emotion in words (PLAN §2/§3.2). Its optical + SOFT axes give it character.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Resonance — read the feeling in your words",
  description:
    "A real transformer model runs inside our own server (transformers.js, no API key) and paints a calm, living emotional spectrum from your text.",
  metadataBase: new URL("https://resonance.vercel.app"),
  openGraph: {
    title: "Resonance",
    description: "Read the feeling in your words — self-hosted emotion model, no API.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink-950 text-mist-100">{children}</body>
    </html>
  );
}
