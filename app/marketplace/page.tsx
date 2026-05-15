import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export const metadata: Metadata = {
  title: "Marketplace — Cemrosta",
  description: "Crew-only classifieds for headsets, luggage, watches, uniforms, and manuals. Verified Malaysia Airlines crew sellers only.",
  alternates: {
    canonical: "/marketplace",
  },
  openGraph: {
    title: "Marketplace — Cemrosta",
    description: "Premium crew gear for Malaysia Airlines professionals. Verified sellers only.",
    images: ["/api/og/marketplace"],
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
