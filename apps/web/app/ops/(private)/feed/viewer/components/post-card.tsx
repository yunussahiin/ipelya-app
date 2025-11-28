/**
 * PostCard Component (Web Ops Version)
 * Instagram tarzı post kartı - mobil ile aynı görünüm
 */

import {
  IconCheck,
  IconClock,
  IconCrown,
  IconEye,
  IconEyeOff,
  IconHeart,
  IconLock,
  IconMessageCircle,
  IconShare,
  IconUsers
} from "@tabler/icons-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { FeedItem } from "../types";
import { ModerationBadge } from "./moderation-badge";

interface PostCardProps {
  item: FeedItem;
  onClick?: () => void;
  onModerate?: () => void;
}

export function PostCard({ item, onClick, onModerate }: PostCardProps) {
  const { content, is_hidden, is_flagged, created_at } = item;

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
        <div className="flex flex-wrap items-center gap-1">
          {/* Post Type Badge */}
          {content.post_type === "exclusive" && (
            <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
              <IconCrown className="h-3 w-3" /> Exclusive
            </Badge>
          )}
          {content.post_type === "ppv" && (
            <Badge variant="outline" className="gap-1 border-purple-500 text-purple-600">
              <IconLock className="h-3 w-3" /> PPV
            </Badge>
          )}
          {content.post_type === "time_capsule" && (
            <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600">
              <IconClock className="h-3 w-3" /> 24h
            </Badge>
          )}
          {/* Visibility Badge */}
          {content.visibility && content.visibility !== "public" && (
            <Badge variant="outline" className="gap-1">
              {content.visibility === "followers" && <IconUsers className="h-3 w-3" />}
              {content.visibility === "subscribers" && <IconCrown className="h-3 w-3" />}
              {content.visibility === "private" && <IconLock className="h-3 w-3" />}
              {content.visibility}
            </Badge>
          )}
          {is_flagged && <Badge variant="destructive">İşaretli</Badge>}
          {/* Moderasyon Badge - detaylı bilgi gösterir */}
          <ModerationBadge item={item} onChangeAction={onModerate} />
        </div>
      </CardHeader>

      {/* Media */}
      {content.media && content.media.length > 0 && (
        <div className="relative aspect-square bg-muted">
          <Image src={content.media[0].media_url} alt="" fill className="object-cover" />
          {content.media.length > 1 && (
            <Badge className="absolute right-2 top-2" variant="secondary">
              +{content.media.length - 1}
            </Badge>
          )}
        </div>
      )}

      {/* Caption */}
      {content.caption && (
        <CardContent className="p-4">
          <p className="line-clamp-3 text-sm">{content.caption}</p>
        </CardContent>
      )}

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
          <span className="flex items-center gap-1">
            <IconShare className="h-4 w-4" />
            {content.shares_count || 0}
          </span>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
