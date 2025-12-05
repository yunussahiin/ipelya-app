"use client";

/**
 * Bağlantı Kalitesi Göstergesi
 * LiveKit bağlantı kalitesini görsel olarak gösterir
 */

import { Wifi, WifiOff, WifiLow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ConnectionQuality = "excellent" | "good" | "poor" | "lost" | "unknown";

interface ConnectionIndicatorProps {
  quality: ConnectionQuality;
  showLabel?: boolean;
}

const CONFIG: Record<
  ConnectionQuality,
  {
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
    bars: number;
  }
> = {
  excellent: {
    icon: <Wifi className="h-4 w-4" />,
    label: "Mükemmel",
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    bars: 4
  },
  good: {
    icon: <Wifi className="h-4 w-4" />,
    label: "İyi",
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    bars: 3
  },
  poor: {
    icon: <WifiLow className="h-4 w-4" />,
    label: "Zayıf",
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    bars: 2
  },
  lost: {
    icon: <WifiOff className="h-4 w-4" />,
    label: "Bağlantı Yok",
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    bars: 0
  },
  unknown: {
    icon: <Wifi className="h-4 w-4" />,
    label: "Bilinmiyor",
    color: "text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    bars: 1
  }
};

export function ConnectionIndicator({ quality, showLabel = false }: ConnectionIndicatorProps) {
  const config = CONFIG[quality];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 ${config.color}`}>
            {/* Signal Bars */}
            <div className="flex items-end gap-0.5 h-4">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-1 rounded-sm transition-all ${
                    bar <= config.bars
                      ? quality === "excellent"
                        ? "bg-green-500"
                        : quality === "good"
                          ? "bg-yellow-500"
                          : quality === "poor"
                            ? "bg-orange-500"
                            : "bg-gray-300"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  style={{ height: `${bar * 25}%` }}
                />
              ))}
            </div>

            {showLabel && <span className="text-xs font-medium">{config.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bağlantı: {config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Badge version
export function ConnectionBadge({ quality }: { quality: ConnectionQuality }) {
  const config = CONFIG[quality];

  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} gap-1`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// Helper to convert LiveKit ConnectionQuality to our type
export function mapLiveKitQuality(lkQuality: number): ConnectionQuality {
  // LiveKit ConnectionQuality enum: Unknown=0, Poor=1, Good=2, Excellent=3, Lost=4
  switch (lkQuality) {
    case 3:
      return "excellent";
    case 2:
      return "good";
    case 1:
      return "poor";
    case 4:
      return "lost";
    default:
      return "unknown";
  }
}
