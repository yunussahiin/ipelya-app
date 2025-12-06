"use client";

import { motion } from "framer-motion";

import { CreatorAvatarCard } from "./creator-avatar-card";
import type { CreatorStripProps } from "./types";

/**
 * Creator Strip - Auto-scroll yapan avatar strip
 * Sonsuz döngü için liste 3 kere renderlanır
 * direction: "left" (sola) veya "right" (sağa)
 */
export function CreatorStrip({ creators, direction = "left", speed = 40 }: CreatorStripProps) {
  // Sonsuz scroll için listeyi 3 kere tekrarla (daha smooth)
  const duplicatedCreators = [...creators, ...creators, ...creators];

  // Animasyon yönü
  const xAnimation = direction === "left" ? ["0%", "-66.666%"] : ["-66.666%", "0%"];

  return (
    <div className="relative w-full overflow-hidden">
      {/* Auto-scrolling strip */}
      <motion.div
        animate={{ x: xAnimation }}
        transition={{
          repeat: Infinity,
          duration: speed,
          ease: "linear"
        }}
        className="flex gap-4 py-4"
      >
        {duplicatedCreators.map((creator, index) => (
          <CreatorAvatarCard key={`${creator.id}-${index}`} creator={creator} />
        ))}
      </motion.div>
    </div>
  );
}
