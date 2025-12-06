import type { MotionValue } from "framer-motion";

/**
 * Landing page creator tipi
 */
export interface LandingCreator {
  id: string;
  name: string;
  handle?: string;
  avatarUrl: string;
  isLive?: boolean;
  isPremium?: boolean;
  tag?: string;
}

/**
 * Scroll-aware component props
 */
export interface ScrollAwareProps {
  scrollProgress?: MotionValue<number>;
}

/**
 * Landing Header props
 */
export type LandingHeaderProps = ScrollAwareProps;

/**
 * Landing Hero props
 */
export type LandingHeroProps = ScrollAwareProps;

/**
 * Creator Strip Section props
 */
export interface CreatorStripSectionProps extends ScrollAwareProps {
  creators: LandingCreator[];
}

/**
 * Creator Strip props
 */
export interface CreatorStripProps {
  creators: LandingCreator[];
  direction?: "left" | "right";
  speed?: number;
}

/**
 * Creator Avatar Card props
 */
export interface CreatorAvatarCardProps {
  creator: LandingCreator;
}

/**
 * Value Prop item
 */
export interface ValueProp {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Value Props Section props
 */
export interface ValuePropsSectionProps {
  items?: ValueProp[];
}

/**
 * Download Section props
 */
export interface DownloadSectionProps {
  appStoreUrl?: string;
  playStoreUrl?: string;
}

/**
 * Landing Footer props
 */
export interface LandingFooterProps {
  className?: string;
}

/**
 * Landing Scroll Layout props
 */
export interface LandingScrollLayoutProps {
  children: React.ReactNode;
}
