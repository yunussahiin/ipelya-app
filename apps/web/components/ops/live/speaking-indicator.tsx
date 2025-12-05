"use client";

/**
 * Konuşma Göstergesi
 * Katılımcının konuşup konuşmadığını animasyonlu olarak gösterir
 */

import { cn } from "@/lib/utils";

interface SpeakingIndicatorProps {
  isSpeaking: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "bars" | "ring" | "pulse";
  className?: string;
}

const SIZE_CONFIG = {
  sm: { container: "h-4 w-4", bar: "w-0.5", gap: "gap-0.5" },
  md: { container: "h-5 w-5", bar: "w-1", gap: "gap-0.5" },
  lg: { container: "h-6 w-6", bar: "w-1.5", gap: "gap-1" }
};

export function SpeakingIndicator({
  isSpeaking,
  size = "md",
  variant = "bars",
  className
}: SpeakingIndicatorProps) {
  const sizeConfig = SIZE_CONFIG[size];

  if (variant === "ring") {
    return (
      <div
        className={cn(
          "rounded-full border-2 transition-all duration-200",
          sizeConfig.container,
          isSpeaking
            ? "border-green-500 animate-pulse shadow-lg shadow-green-500/50"
            : "border-transparent",
          className
        )}
      />
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("relative", sizeConfig.container, className)}>
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-green-500 transition-opacity duration-200",
            isSpeaking ? "opacity-100 animate-ping" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-green-500 transition-opacity duration-200",
            isSpeaking ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    );
  }

  // Default: bars
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeConfig.container,
        sizeConfig.gap,
        className
      )}
    >
      {[1, 2, 3].map((bar) => (
        <div
          key={bar}
          className={cn(
            "rounded-full transition-all duration-150",
            sizeConfig.bar,
            isSpeaking ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
          )}
          style={{
            height: isSpeaking ? `${30 + bar * 20}%` : "30%",
            animation: isSpeaking
              ? `speaking-bar ${0.3 + bar * 0.1}s ease-in-out infinite alternate`
              : "none"
          }}
        />
      ))}

      <style jsx>{`
        @keyframes speaking-bar {
          0% {
            height: 30%;
          }
          100% {
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Avatar overlay version - wraps around an avatar
interface SpeakingAvatarWrapperProps {
  isSpeaking: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SpeakingAvatarWrapper({
  isSpeaking,
  children,
  className
}: SpeakingAvatarWrapperProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Speaking ring */}
      <div
        className={cn(
          "absolute -inset-1 rounded-full border-2 transition-all duration-200",
          isSpeaking ? "border-green-500 animate-pulse" : "border-transparent"
        )}
      />
      {children}

      {/* Speaking indicator badge */}
      {isSpeaking && (
        <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 bg-green-500 rounded-full">
          <SpeakingIndicator isSpeaking={true} size="sm" variant="bars" />
        </div>
      )}
    </div>
  );
}

// Inline indicator with label
interface SpeakingLabelProps {
  isSpeaking: boolean;
  username?: string;
  className?: string;
}

export function SpeakingLabel({ isSpeaking, username, className }: SpeakingLabelProps) {
  if (!isSpeaking) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-300 text-xs font-medium",
        className
      )}
    >
      <SpeakingIndicator isSpeaking={true} size="sm" />
      {username ? `${username} konuşuyor` : "Konuşuyor"}
    </div>
  );
}
