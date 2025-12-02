"use client";

import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCoin, formatTL, coinToTL } from "./utils";

// Re-export for backwards compatibility
export { formatCoin, formatTL, coinToTL } from "./utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface CoinDisplayProps {
  amount: number;
  rate?: number;
  showTL?: boolean;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface TLDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

export function CoinDisplay({
  amount,
  rate,
  showTL = true,
  showIcon = true,
  size = "md",
  className
}: CoinDisplayProps) {
  const sizes = {
    sm: { icon: 14, text: "text-sm", tlText: "text-xs" },
    md: { icon: 16, text: "text-base", tlText: "text-sm" },
    lg: { icon: 20, text: "text-lg", tlText: "text-base" }
  };

  const config = sizes[size];
  const tlAmount = rate ? coinToTL(amount, rate) : null;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn("flex items-center gap-1 font-medium", config.text)}>
        {showIcon && <Coins className="text-amber-500" size={config.icon} />}
        <span>{formatCoin(amount)}</span>
      </div>
      {showTL && tlAmount !== null && (
        <span className={cn("text-muted-foreground", config.tlText)}>≈ {formatTL(tlAmount)}</span>
      )}
    </div>
  );
}

export function TLDisplay({ amount, size = "md", className }: TLDisplayProps) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return <span className={cn("font-medium", sizes[size], className)}>{formatTL(amount)}</span>;
}

// ─────────────────────────────────────────────────────────
// Rate Display
// ─────────────────────────────────────────────────────────

interface RateDisplayProps {
  rate: number;
  className?: string;
}

export function RateDisplay({ rate, className }: RateDisplayProps) {
  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      <span className="text-muted-foreground">1</span>
      <Coins className="text-amber-500" size={14} />
      <span className="text-muted-foreground">=</span>
      <span className="font-medium">{formatTL(rate)}</span>
    </div>
  );
}
