"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Radio, Globe, Lock, Crown, Users, MessageSquare, Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BroadcastChannel } from "../broadcast-channels-card";
import type { ChannelStats } from "./types";

interface ChannelHeaderProps {
  channel: BroadcastChannel;
  stats: ChannelStats;
}

function getAccessBadge(accessType: string, tierName?: string) {
  const config = {
    public: {
      icon: Globe,
      label: "Herkese Açık",
      className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
    },
    subscribers_only: {
      icon: Crown,
      label: "Abonelere Özel",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
    },
    tier_specific: {
      icon: Lock,
      label: tierName || "Özel Tier",
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
    }
  };
  const {
    icon: Icon,
    label,
    className
  } = config[accessType as keyof typeof config] || config.public;
  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString("tr-TR");
}

function StatBox({
  icon: Icon,
  label,
  value
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="p-2 rounded-lg border bg-card text-center">
      <Icon className="h-3.5 w-3.5 mx-auto mb-0.5 text-muted-foreground" />
      <p className="text-base font-bold">{formatNumber(value)}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function ChannelHeader({ channel, stats }: ChannelHeaderProps) {
  return (
    <SheetHeader className="space-y-3 px-6 pt-6">
      <div className="flex items-start gap-3">
        <Avatar className="h-14 w-14 rounded-xl">
          <AvatarImage src={channel.avatarUrl} alt={channel.name} />
          <AvatarFallback className="rounded-xl bg-primary/10">
            <Radio className="h-5 w-5 text-primary" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-lg">{channel.name}</SheetTitle>
            {!channel.isActive && (
              <Badge variant="outline" className="text-xs">
                Pasif
              </Badge>
            )}
          </div>
          <SheetDescription className="text-sm mt-0.5 line-clamp-1">
            {channel.description || "Açıklama yok"}
          </SheetDescription>
          <div className="mt-1.5">
            {getAccessBadge(channel.accessType, channel.requiredTierName || undefined)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatBox icon={Users} label="Üye" value={channel.memberCount} />
        <StatBox icon={MessageSquare} label="Mesaj" value={stats.totalMessages} />
        <StatBox icon={Eye} label="Görüntüleme" value={stats.totalViews} />
        <StatBox icon={Heart} label="Tepki" value={stats.totalReactions} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-lg bg-muted/50 text-center">
          <p className="text-base font-semibold">{stats.messagesThisWeek}</p>
          <p className="text-[10px] text-muted-foreground">Bu Hafta</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50 text-center">
          <p className="text-base font-semibold">{stats.messagesThisMonth}</p>
          <p className="text-[10px] text-muted-foreground">Bu Ay</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50 text-center">
          <p className="text-base font-semibold">{stats.pinnedMessages}</p>
          <p className="text-[10px] text-muted-foreground">Sabitlenmiş</p>
        </div>
      </div>
    </SheetHeader>
  );
}
