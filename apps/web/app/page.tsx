import { Metadata } from "next";

import { LandingPage } from "@/components/landing";

export const metadata: Metadata = {
  title: "İpelya – Creator Abonelik Platformu",
  description: "Favori creator'larınla özel içerikleri keşfet. İpelya şimdi mobilde.",
  openGraph: {
    title: "İpelya",
    description: "Creator ve hayranlar için özel içerik deneyimi.",
    images: ["/images/og.png"]
  }
};

export default function Page() {
  return <LandingPage />;
}
