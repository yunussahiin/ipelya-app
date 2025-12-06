"use client";

import { LandingScrollLayout } from "./landing-scroll-layout";
import { LandingHero } from "./landing-hero";
import { CreatorStripSection } from "./creator-strip-section";
import { ValuePropsSection } from "./value-props-section";
import { DownloadSection } from "./download-section";
import { LandingFooter } from "./landing-footer";
import type { LandingCreator } from "./types";

/**
 * Mock creator data - daha fazla creator
 */
const mockCreators: LandingCreator[] = [
  {
    id: "1",
    name: "Ayşe Yılmaz",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    tag: "Lifestyle",
    isPremium: true
  },
  {
    id: "2",
    name: "Mehmet Kaya",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    tag: "Fitness",
    isLive: true
  },
  { id: "3", name: "Zeynep Demir", avatarUrl: "https://i.pravatar.cc/150?img=3", tag: "Moda" },
  {
    id: "4",
    name: "Can Özkan",
    avatarUrl: "https://i.pravatar.cc/150?img=4",
    tag: "Müzik",
    isPremium: true
  },
  { id: "5", name: "Elif Şahin", avatarUrl: "https://i.pravatar.cc/150?img=5", tag: "Yemek" },
  {
    id: "6",
    name: "Burak Yıldız",
    avatarUrl: "https://i.pravatar.cc/150?img=6",
    tag: "Oyun",
    isLive: true
  },
  { id: "7", name: "Selin Arslan", avatarUrl: "https://i.pravatar.cc/150?img=7", tag: "Dans" },
  {
    id: "8",
    name: "Emre Çelik",
    avatarUrl: "https://i.pravatar.cc/150?img=8",
    tag: "Seyahat",
    isPremium: true
  },
  { id: "9", name: "Deniz Aydın", avatarUrl: "https://i.pravatar.cc/150?img=9", tag: "Sanat" },
  {
    id: "10",
    name: "Merve Koç",
    avatarUrl: "https://i.pravatar.cc/150?img=10",
    tag: "Yoga",
    isLive: true
  },
  {
    id: "11",
    name: "Oğuz Tan",
    avatarUrl: "https://i.pravatar.cc/150?img=11",
    tag: "Tech",
    isPremium: true
  },
  { id: "12", name: "Ceren Yurt", avatarUrl: "https://i.pravatar.cc/150?img=12", tag: "Makyaj" },
  { id: "13", name: "Kaan Erdem", avatarUrl: "https://i.pravatar.cc/150?img=13", tag: "Spor" },
  {
    id: "14",
    name: "Buse Kara",
    avatarUrl: "https://i.pravatar.cc/150?img=14",
    tag: "Podcast",
    isPremium: true
  },
  {
    id: "15",
    name: "Arda Güneş",
    avatarUrl: "https://i.pravatar.cc/150?img=15",
    tag: "Komedi",
    isLive: true
  },
  { id: "16", name: "Nil Öztürk", avatarUrl: "https://i.pravatar.cc/150?img=16", tag: "Fotoğraf" }
];

/**
 * Landing Page - Ana sayfa component
 * Bumble benzeri minimal landing deneyimi
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#05040A] to-[#0B0714] text-white">
      <LandingScrollLayout>
        <LandingHero />
        <CreatorStripSection creators={mockCreators} />
        <ValuePropsSection />
        <DownloadSection />
        <LandingFooter />
      </LandingScrollLayout>
    </div>
  );
}
