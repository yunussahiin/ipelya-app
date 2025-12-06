"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";

import { Button } from "@/components/ui/button";

import type { LandingHeaderProps } from "./types";

/**
 * Landing Header - Scroll-aware header with logo and CTA
 * Scroll'a göre arka plan ve blur değişir
 */
export function LandingHeader({ scrollProgress }: LandingHeaderProps) {
  // Fallback motion value
  const fallbackProgress = useMotionValue(0);
  const progress = scrollProgress ?? fallbackProgress;

  // Scroll-based transforms
  const bgOpacity = useTransform(progress, [0, 0.1], [0, 1]);
  const borderOpacity = useTransform(progress, [0, 0.1], [0, 0.1]);

  return (
    <motion.header
      className="fixed left-0 right-0 top-0 z-50"
      style={{
        backgroundColor: scrollProgress ? `rgba(5, 4, 10, ${bgOpacity.get()})` : "transparent"
      }}
    >
      <motion.div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          opacity: scrollProgress ? bgOpacity : 0
        }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-white"
        style={{
          opacity: scrollProgress ? borderOpacity : 0
        }}
      />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-80"
        >
          ipelya
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            className="rounded-full bg-[#FF2D92] px-5 text-white hover:bg-[#FF2D92]/90"
          >
            Uygulamayı İndir
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}
