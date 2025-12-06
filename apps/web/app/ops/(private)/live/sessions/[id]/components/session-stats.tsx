"use client";

import { Video, Mic, Eye, Clock, MessageCircle, Gift } from "lucide-react";

import type { SessionWithDetails } from "./types";

interface SessionStatsProps {
  session: SessionWithDetails;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function SessionStats({ session }: SessionStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div
          className={`p-2 rounded-lg ${session.session_type === "video_live" ? "bg-red-500/10" : "bg-purple-500/10"}`}
        >
          {session.session_type === "video_live" ? (
            <Video className="h-4 w-4 text-red-500" />
          ) : (
            <Mic className="h-4 w-4 text-purple-500" />
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tür</p>
          <p className="font-semibold text-sm">
            {session.session_type === "video_live" ? "Video" : "Sesli"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <Eye className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">İzleyici</p>
          <p className="font-bold">{session.current_viewers}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Clock className="h-4 w-4 text-orange-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Süre</p>
          <p className="font-bold font-mono text-sm">{formatDuration(session.duration_seconds)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div className="p-2 rounded-lg bg-green-500/10">
          <MessageCircle className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mesaj</p>
          <p className="font-bold">{session.message_count}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div className="p-2 rounded-lg bg-pink-500/10">
          <Gift className="h-4 w-4 text-pink-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Hediye</p>
          <p className="font-bold">{session.gift_count}</p>
        </div>
      </div>
    </div>
  );
}
