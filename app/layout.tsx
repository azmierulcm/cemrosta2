import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { RosterProvider } from "@/lib/contexts/RosterContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cemrosta.vercel.app"),
  title: {
    default: "Cemrosta | The Crew Passport",
    template: "%s — Cemrosta",
  },
  description: "Convert your airline roster to calendar and build your digital destination passport.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://cemrosta.vercel.app",
    siteName: "Cemrosta",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@cemrosta",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text selection:bg-accent/30">
        <AuthProvider>
          <RosterProvider>
            {children}
          </RosterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
