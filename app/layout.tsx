import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "../styles/globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { RosterProvider } from "@/lib/contexts/RosterContext";
import { InstallBanner } from "@/components/shared/InstallBanner";
import { BottomNav } from "@/components/shared/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // Include every weight used in the app (font-bold=700, font-black=900).
  // Missing weights were previously synthesised by the browser (slow + blurry).
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  preload: true,
});

// Used exclusively on the family-share departure-board page (/roster/view)
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: false, // loaded only when the page is visited
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#e5484d",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://otarosta.com"),
  title: {
    default: "Otarosta — Your roster, transformed.",
    template: "%s — Otarosta",
  },
  description:
    "Otarosta converts your roster PDF into a synced calendar, destination passport, and monthly recap card. Free forever for MAS crew.",
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
    url: "https://otarosta.com",
    siteName: "Otarosta",
    title: "Otarosta — Your roster, transformed.",
    description:
      "Drop your Roster PDF. Get a synced calendar, lifetime destination passport, and proof your schedule exists — for your family. Free forever.",
    images: [{ url: "/api/og/home", width: 1200, height: 630, alt: "Otarosta — Your roster, transformed." }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@otarosta",
    title: "Otarosta — Your roster, transformed.",
    description:
      "Drop your Roster PDF. Get a synced calendar, lifetime destination passport, and proof your schedule exists — for your family. Free forever.",
    images: ["/api/og/home"],
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
      className={`${inter.variable} ${bricolage.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect to external origins used at runtime */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body className="h-full flex flex-col bg-bg text-text selection:bg-accent/30">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-accent focus:text-accent-fg focus:px-6 focus:py-3 focus:rounded-xl focus:font-bold focus:shadow-2xl"
        >
          Skip to content
        </a>
        <AuthProvider>
          <RosterProvider>
            {/* flex-1 + min-h-0 makes this div the scroll container (not the body/window).
                position:fixed elements (BottomNav, InstallBanner) stay truly viewport-fixed
                on all pages and browsers — including iOS Safari with long roster content. */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0">
              {children}
            </div>
            <InstallBanner />
            <BottomNav />
          </RosterProvider>
        </AuthProvider>
        {/* Register service worker — afterInteractive ensures it runs after hydration */}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}</Script>
      </body>
    </html>
  );
}
