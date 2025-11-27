/**
 * PollCard Component (Web Ops Version)
 * Anket kartı - oy sonuçlarını gösterir
 * Kim oy verdi modalı için tıklanabilir
 */

import { IconChartBar, IconCheck, IconClock, IconEyeOff, IconUsers } from "@tabler/icons-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { FeedItem } from "../types";

interface PollCardProps {
  item: FeedItem;
  onClick?: () => void;
  onModerate?: () => void;
}

export function PollCard({ item, onClick, onModerate }: PollCardProps) {
  const { content, is_hidden, created_at } = item;
  const totalVotes = content.total_votes || 0;

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
          <IconChartBar className="h-3 w-3" /> Anket
        </Badge>
      </CardHeader>

      {/* Poll Content */}
      <CardContent className="space-y-4 p-4">
        {/* Context/Caption */}
        {content.caption && <p className="text-sm text-muted-foreground">{content.caption}</p>}

        {/* Question - Anket Sorusu */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Anket Sorusu
          </p>
          <p className="mt-1 font-medium">{content.question}</p>
        </div>

        {/* Options with progress bars */}
        <div className="space-y-3">
          {content.options?.map((option) => {
            const percentage =
              totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{option.option_text}</span>
                  <span className="text-muted-foreground">
                    {option.votes_count} oy ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconUsers className="h-4 w-4" />
            {totalVotes} oy
          </span>
          {content.expires_at && (
            <span className="flex items-center gap-1">
              <IconClock className="h-4 w-4" />
              {new Date(content.expires_at) > new Date() ? (
                <>Bitiş: {new Date(content.expires_at).toLocaleDateString("tr-TR")}</>
              ) : (
                <span className="text-orange-600">Sona erdi</span>
              )}
            </span>
          )}
          {content.multiple_choice && (
            <Badge variant="secondary" className="text-xs">
              Çoklu Seçim
            </Badge>
          )}
        </div>
        <Button variant="link" size="sm" className="h-auto p-0 text-primary">
          Kim oy verdi?
        </Button>
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
