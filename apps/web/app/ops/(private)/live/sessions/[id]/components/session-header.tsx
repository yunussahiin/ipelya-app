"use client";

import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModerationActions } from "@/components/ops/live/moderation-actions";

import type { SessionWithDetails } from "./types";

interface SessionHeaderProps {
  session: SessionWithDetails;
  refreshing: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onSessionEnd: () => void;
}

export function SessionHeader({
  session,
  refreshing,
  onBack,
  onRefresh,
  onSessionEnd
}: SessionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{session.title || "Başlıksız Yayın"}</h1>
            {session.status === "live" && (
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20 shrink-0">
                <span className="animate-pulse mr-1">●</span> CANLI
              </Badge>
            )}
            {session.status === "ended" && (
              <Badge variant="secondary" className="shrink-0">
                Sona Erdi
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={session.creator?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {session.creator?.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">@{session.creator?.username}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>
              {session.started_at
                ? formatDistanceToNow(new Date(session.started_at), {
                    locale: tr,
                    addSuffix: true
                  })
                : "Başlangıç yok"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
        {session.status === "live" && (
          <ModerationActions
            sessionId={session.id}
            sessionTitle={session.title || "Bu yayın"}
            onRefresh={onSessionEnd}
          />
        )}
      </div>
    </div>
  );
}
