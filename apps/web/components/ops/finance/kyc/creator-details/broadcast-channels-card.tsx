"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Radio, Users, MessageSquare, Globe, Lock, Crown, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BroadcastChannelDetailSheet } from "./channel-detail";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface BroadcastChannel {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  accessType: "public" | "subscribers_only" | "tier_specific";
  requiredTierId?: string;
  requiredTierName?: string;
  memberCount: number;
  messageCount: number;
  isActive: boolean;
  createdAt: string;
  lastMessageAt?: string;
}

interface BroadcastChannelsCardProps {
  channels: BroadcastChannel[];
  creatorAvatarUrl?: string;
}

// ─────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────

function getAccessBadge(channel: BroadcastChannel) {
  const config = {
    public: {
      icon: Globe,
      label: "Herkese Açık",
      variant: "default" as const,
      className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
    },
    subscribers_only: {
      icon: Crown,
      label: "Abonelere Özel",
      variant: "secondary" as const,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
    },
    tier_specific: {
      icon: Lock,
      label: channel.requiredTierName || "Özel Tier",
      variant: "outline" as const,
      className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
    }
  };

  const { icon: Icon, label, className } = config[channel.accessType];

  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────

export function BroadcastChannelsCard({ channels, creatorAvatarUrl }: BroadcastChannelsCardProps) {
  const [selectedChannel, setSelectedChannel] = useState<BroadcastChannel | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeChannels = channels.filter((c) => c.isActive);
  const totalMembers = channels.reduce((sum, c) => sum + c.memberCount, 0);
  const totalMessages = channels.reduce((sum, c) => sum + c.messageCount, 0);

  const handleChannelClick = (channel: BroadcastChannel) => {
    setSelectedChannel(channel);
    setSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Yayın Kanalları
            </CardTitle>
            <Badge variant="secondary">{channels.length} kanal</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatBox icon={Radio} label="Aktif Kanal" value={activeChannels.length} />
            <StatBox icon={Users} label="Toplam Üye" value={totalMembers} />
            <StatBox icon={MessageSquare} label="Toplam Mesaj" value={totalMessages} />
          </div>

          {/* Channels List */}
          {channels.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Henüz kanal oluşturulmamış</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {channels.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    onClick={() => handleChannelClick(channel)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <BroadcastChannelDetailSheet
        channel={selectedChannel}
        creatorAvatarUrl={creatorAvatarUrl}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────

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
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
      <p className="text-2xl font-bold">{formatNumber(value)}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ChannelItem({ channel, onClick }: { channel: BroadcastChannel; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left cursor-pointer",
        !channel.isActive && "opacity-60"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 rounded-lg">
        <AvatarImage src={channel.avatarUrl} alt={channel.name} />
        <AvatarFallback className="rounded-lg bg-primary/10">
          <Radio className="h-5 w-5 text-primary" />
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{channel.name}</span>
          {!channel.isActive && (
            <Badge variant="outline" className="text-xs">
              Pasif
            </Badge>
          )}
        </div>
        {channel.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{channel.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatNumber(channel.memberCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {formatNumber(channel.messageCount)}
          </span>
          {channel.lastMessageAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDistanceToNow(new Date(channel.lastMessageAt), {
                addSuffix: true,
                locale: tr
              })}
            </span>
          )}
        </div>
      </div>

      {/* Access Badge */}
      <div className="shrink-0">{getAccessBadge(channel)}</div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────

export function BroadcastChannelsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Yayın Kanalları
          </CardTitle>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
              <Skeleton className="h-4 w-4 mx-auto mb-1" />
              <Skeleton className="h-8 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
