"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Pin, Eye, Heart, AlertCircle, Image as ImageIcon, Video } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { BroadcastMessage } from "./types";

interface MessageBubbleProps {
  message: BroadcastMessage;
  creatorAvatarUrl?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function MessageBubble({ message, creatorAvatarUrl }: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-3", message.isPinned && "relative")}>
      {/* Creator Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={creatorAvatarUrl} />
        <AvatarFallback className="text-xs bg-primary/10">C</AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "rounded-2xl rounded-tl-sm px-4 py-2.5 bg-muted",
            message.isPinned && "bg-amber-500/10 border border-amber-500/30",
            message.isCritical && "bg-red-500/10 border border-red-500/30"
          )}
        >
          {/* Badges */}
          {(message.isPinned || message.isCritical) && (
            <div className="flex gap-1.5 mb-1.5">
              {message.isPinned && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400"
                >
                  <Pin className="h-2.5 w-2.5" />
                  Sabit
                </Badge>
              )}
              {message.isCritical && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 gap-1 border-red-500/50 text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-2.5 w-2.5" />
                  Kritik
                </Badge>
              )}
            </div>
          )}

          {/* Text Content */}
          {message.content && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}

          {/* Media */}
          {message.mediaUrl && (
            <div className="mt-2">
              {message.contentType === "image" && (
                <div className="relative rounded-lg overflow-hidden max-w-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={message.mediaThumbnailUrl || message.mediaUrl}
                    alt=""
                    className="w-full h-auto max-h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 rounded px-1.5 py-0.5">
                    <ImageIcon className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              {message.contentType === "video" && (
                <div className="relative rounded-lg bg-black/20 h-32 w-48 flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                  <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                    Video
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Time & Stats */}
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(message.createdAt), "d MMM HH:mm", { locale: tr })}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Eye className="h-3 w-3" />
            {formatNumber(message.viewCount)}
          </span>
          {message.reactionCount > 0 ? (
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <Heart className="h-3 w-3" />
                  {formatNumber(message.reactionCount)}
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-2" side="top" align="start">
                {message.reactions && message.reactions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {message.reactions.map((r) => (
                      <div
                        key={r.emoji}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted"
                      >
                        <span className="text-base">{r.emoji}</span>
                        <span className="text-xs font-medium text-muted-foreground">{r.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-xs text-muted-foreground">
                      {message.reactionCount} tepki
                    </span>
                  </div>
                )}
              </HoverCardContent>
            </HoverCard>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Heart className="h-3 w-3" />
              {formatNumber(message.reactionCount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
