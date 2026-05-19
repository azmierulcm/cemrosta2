import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { RosterProvider } from "@/lib/contexts/RosterContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // Include every weight used in the app (font-bold=700, font-black=900).
  // Missing weights were previously synthesised by the browser (slow + blurry).
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  preload: true,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#e5484d",
};

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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
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
      className={`${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to external origins used at runtime */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text selection:bg-accent/30">
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-accent-fg focus:px-6 focus:py-3 focus:rounded-xl focus:font-bold focus:shadow-2xl"
        >
          Skip to content
        </a>
        <AuthProvider>
          <RosterProvider>
            {children}
          </RosterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
