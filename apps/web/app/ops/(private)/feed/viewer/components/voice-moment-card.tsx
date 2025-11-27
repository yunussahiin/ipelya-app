/**
 * VoiceMomentCard Component (Web Ops Version)
 * Ses paylaşımı kartı
 */

import { IconCheck, IconEyeOff, IconMicrophone, IconPlayerPlay } from "@tabler/icons-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { FeedItem } from "../types";

interface VoiceMomentCardProps {
  item: FeedItem;
  onClick?: () => void;
  onModerate?: () => void;
}

export function VoiceMomentCard({ item, onClick, onModerate }: VoiceMomentCardProps) {
  const { content, is_hidden, created_at } = item;
  const duration = content.duration || 0;
  const formattedDuration = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;

  return (
    <Card
      className={`cursor-pointer overflow-hidden transition-shadow hover:shadow-lg ${is_hidden ? "opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center gap-3 p-4">
        {content.user.avatar_url ? (
          <Image
            src={content.user.avatar_url}
            alt={content.user.username}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <span className="text-sm font-medium">
              {content.user.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium">@{content.user.username}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(created_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <IconMicrophone className="h-3 w-3" /> Ses
        </Badge>
      </CardHeader>

      {/* Voice Player */}
      <CardContent className="p-4">
        <div className="flex items-center gap-4 rounded-xl bg-muted p-4">
          <Button variant="secondary" size="icon" className="h-12 w-12 rounded-full">
            <IconPlayerPlay className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <p className="font-medium">{content.caption || "Ses paylaşımı"}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formattedDuration}</span>
              <span>•</span>
              <span>{content.plays_count || 0} dinlenme</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Footer - Actions */}
      <CardFooter className="flex items-center justify-end border-t p-4">
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onModerate?.();
                }}
              >
                {is_hidden ? (
                  <IconCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <IconEyeOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{is_hidden ? "Göster" : "Moderasyon"}</TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}
