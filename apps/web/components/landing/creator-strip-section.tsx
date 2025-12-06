"use client";

import { motion } from "framer-motion";

import { CreatorStrip } from "./creator-strip";
import type { CreatorStripSectionProps } from "./types";

/**
 * Creator Strip Section - Full-width, minimal tasarım
 * İki yönlü auto-scroll animasyonu
 */
export function CreatorStripSection({ creators }: CreatorStripSectionProps) {
  // İlk yarı ve ikinci yarı için creator'ları böl
  const midPoint = Math.ceil(creators.length / 2);
  const topRowCreators = creators.slice(0, midPoint);
  const bottomRowCreators = creators.slice(midPoint);

  return (
    <section className="relative overflow-hidden py-20">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <h2 className="text-2xl font-semibold text-white md:text-3xl">Binlerce Creator</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
          En sevdiğin creator&apos;ların özel içeriklerine anında ulaş
        </p>
      </motion.div>

      {/* Full-width strips container */}
      <div className="space-y-8">
        <CreatorStrip creators={topRowCreators} direction="left" speed={30} />
        <CreatorStrip creators={bottomRowCreators} direction="right" speed={35} />
      </div>

      {/* Minimal edge fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-[#05040A] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-[#05040A] to-transparent" />
    </section>
  );
}
