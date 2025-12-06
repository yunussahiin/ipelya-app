"use client";

import { useRef, Children, cloneElement, isValidElement } from "react";
import { useScroll } from "framer-motion";

import { LandingHeader } from "./landing-header";
import type { LandingScrollLayoutProps, ScrollAwareProps } from "./types";

/**
 * Landing Scroll Layout - Scroll context wrapper
 * useScroll ile scrollYProgress'i child component'lere geçirir
 */
export function LandingScrollLayout({ children }: LandingScrollLayoutProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  // scrollProgress'i scroll-aware children'a geçir
  const enhancedChildren = Children.map(children, (child) => {
    if (isValidElement<ScrollAwareProps>(child)) {
      // Sadece scrollProgress prop'u bekleyen component'lere geçir
      if (child.type && typeof child.type !== "string") {
        return cloneElement(child, { scrollProgress: scrollYProgress });
      }
    }
    return child;
  });

  return (
    <div ref={ref} className="relative">
      {/* Header - scroll-aware */}
      <LandingHeader scrollProgress={scrollYProgress} />

      {/* Main content */}
      <main className="pt-20">{enhancedChildren}</main>
    </div>
  );
}
