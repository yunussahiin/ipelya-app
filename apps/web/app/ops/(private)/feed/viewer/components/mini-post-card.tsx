/**
 * MiniPostCard Component (Web Ops Version)
 * Vibe kartı - renkli arka planlı kısa metin
 * Mobil ile aynı görünüm
 */

import { IconCheck, IconEye, IconEyeOff, IconHeart, IconMessageCircle } from "@tabler/icons-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { FeedItem } from "../types";
import { ModerationBadge } from "./moderation-badge";

interface MiniPostCardProps {
  item: FeedItem;
  onClick?: () => void;
  onModerate?: () => void;
}

// Arka plan renkleri - mobil ile aynı
const BACKGROUND_COLORS: Record<string, string> = {
  gradient_pink: "bg-pink-500",
  gradient_blue: "bg-cyan-500",
  gradient_purple: "bg-violet-500",
  gradient_orange: "bg-amber-500",
  gradient_green: "bg-emerald-500",
  solid_dark: "bg-slate-800"
};

export function MiniPostCard({ item, onClick, onModerate }: MiniPostCardProps) {
  const { content, is_hidden, is_flagged, created_at } = item;
  const bgClass = BACKGROUND_COLORS[content.background_style || "gradient_pink"] || "bg-pink-500";

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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <IconMessageCircle className="h-3 w-3" /> Vibe
          </Badge>
          {is_flagged && <Badge variant="destructive">İşaretli</Badge>}
          <ModerationBadge item={item} onChangeAction={onModerate} />
        </div>
      </CardHeader>

      {/* Vibe Card - Renkli arka plan */}
      <div
        className={`mx-4 mb-4 flex min-h-32 items-center justify-center rounded-xl p-6 ${bgClass}`}
      >
        <p className="text-center text-lg font-semibold text-white">
          {content.content || content.caption}
        </p>
      </div>

      {/* Footer - Stats & Actions */}
      <CardFooter className="flex items-center justify-between border-t p-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconHeart
              className={`h-4 w-4 ${content.is_liked ? "fill-red-500 text-red-500" : ""}`}
            />
            {content.likes_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <IconMessageCircle className="h-4 w-4" />
            {content.comments_count || 0}
          </span>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Detay Butonu */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <IconEye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Detay</TooltipContent>
          </Tooltip>
          {/* Moderasyon Butonu */}
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
