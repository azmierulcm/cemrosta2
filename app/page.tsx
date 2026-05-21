import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Otarosta — Your roster, transformed.",
  description:
    "Otarosta converts your roster PDF into a synced calendar, destination passport, and monthly recap card. Free forever for MAS crew.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Otarosta — Your roster, transformed.",
    description:
      "Drop your Roster PDF. Get a synced calendar, lifetime destination passport, and proof your schedule exists — for your family. Free forever.",
    images: [{ url: "/api/og/home", width: 1200, height: 630, alt: "Otarosta — Your roster, transformed." }],
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Otarosta",
    "description": "Convert your airline roster to calendar and build your digital destination passport.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any (web)",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "MYR"
    },
    "screenshot": "https://otarosta.com/api/og/home"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
