"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";

import { Button } from "@/components/ui/button";

import type { LandingHeroProps } from "./types";

/**
 * Landing Hero - Scroll animasyonlu hero section
 * Scale, opacity ve translateY scroll'a göre değişir
 */
export function LandingHero({ scrollProgress }: LandingHeroProps) {
  // Fallback motion value
  const fallbackProgress = useMotionValue(0);
  const progress = scrollProgress ?? fallbackProgress;

  // Scroll-based transforms
  const scale = useTransform(progress, [0, 0.3], [1, 0.9]);
  const opacity = useTransform(progress, [0, 0.3], [1, 0]);
  const y = useTransform(progress, [0, 0.3], [0, -40]);

  return (
    <motion.section
      style={scrollProgress ? { scale, opacity, y } : undefined}
      className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center"
    >
      {/* Emoji */}
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-5xl"
      >
        👋
      </motion.span>

      {/* Başlık */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-3xl text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl"
      >
        Creator&apos;ların en gerçek hâli
      </motion.h1>

      {/* Alt metin */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6 max-w-xl text-base text-[#B5B5C0] md:text-lg"
      >
        Gerçek içerikler, gerçek kazançlar, tek yerde: İpelya.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10"
      >
        <Button
          size="lg"
          className="rounded-full bg-[#FF2D92] px-8 py-6 text-lg font-semibold text-white hover:bg-[#FF2D92]/90"
        >
          İpelya&apos;yı indir
        </Button>
      </motion.div>

      {/* Secondary text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6 text-sm text-[#B5B5C0]/70"
      >
        Sadece mobilde. iOS ve Android&apos;de ücretsiz.
      </motion.p>
    </motion.section>
  );
}
