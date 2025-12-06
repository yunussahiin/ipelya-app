"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";

import type { DownloadSectionProps } from "./types";

/**
 * Download Section - Bumble tarzı temiz tasarım
 */
export function DownloadSection({
  appStoreUrl = "https://apps.apple.com/app/ipelya",
  playStoreUrl = "https://play.google.com/store/apps/details?id=com.ipelya"
}: DownloadSectionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-[#FF2D92]"
        >
          <div className="flex flex-col items-center gap-8 p-8 md:flex-row md:p-12">
            {/* Left - Text & Buttons */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-white md:text-4xl">Uygulamayı İndir</h2>
              <p className="mt-4 text-lg text-white/80">
                iOS ve Android&apos;de ücretsiz. Hemen başla.
              </p>

              {/* Store buttons */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
                {/* App Store */}
                <Link
                  href={appStoreUrl}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black px-6 text-white transition-transform hover:scale-105 sm:w-auto"
                >
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-tight opacity-70">Download on the</div>
                    <div className="text-sm font-semibold leading-tight">App Store</div>
                  </div>
                </Link>

                {/* Google Play */}
                <Link
                  href={playStoreUrl}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black px-6 text-white transition-transform hover:scale-105 sm:w-auto"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-tight opacity-70">GET IT ON</div>
                    <div className="text-sm font-semibold leading-tight">Google Play</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Right - Phone Icon */}
            <div className="hidden md:block">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="flex h-48 w-48 items-center justify-center rounded-3xl bg-white/20"
              >
                <Smartphone className="h-24 w-24 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
