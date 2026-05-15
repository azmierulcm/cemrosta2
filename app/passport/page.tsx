import { Metadata } from "next";
import PassportClient from "./PassportClient";

export const metadata: Metadata = {
  title: "Your Passport — Cemrosta",
  description: "View your lifetime flight statistics, destination stamps, and career milestones.",
};

export default function PassportPage() {
  return <PassportClient />;
}
