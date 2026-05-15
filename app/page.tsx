import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Cemrosta — Your roster, transformed. Built for Malaysian crew.",
  description: "Drop your Malaysia Airlines roster PDF. We sync your calendar, track your destinations, and build your lifetime flight passport. Ready in 10 seconds.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Cemrosta — Your roster, transformed.",
    description: "Built for Malaysian crew. Drop your PDF, sync your calendar, and build your flight passport.",
    images: ["/api/og/home"],
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Cemrosta",
    "description": "Convert your airline roster to calendar and build your digital destination passport.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Any (web)",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "MYR"
    },
    "screenshot": "https://cemrosta.vercel.app/api/og/home"
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
