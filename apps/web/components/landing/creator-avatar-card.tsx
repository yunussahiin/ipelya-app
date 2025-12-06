"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import type { CreatorAvatarCardProps } from "./types";

/**
 * Creator Avatar Card - Geniş, modern kart tasarımı - fotoğraf odaklı, gradient overlay
 */
export function CreatorAvatarCard({ creator }: CreatorAvatarCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-[#18181b] w-[180px] md:w-[200px]"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={creator.avatarUrl}
          alt={creator.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-sm font-semibold text-white">{creator.name}</p>
        {creator.tag && <p className="mt-0.5 text-xs text-white/60">{creator.tag}</p>}
      </div>
    </motion.div>
  );
}
