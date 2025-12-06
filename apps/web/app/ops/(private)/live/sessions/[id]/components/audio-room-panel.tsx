"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Mic } from "lucide-react";

import { AudioRoomView } from "@/components/ops/live/audio-room-view";

import type { SessionWithDetails } from "./types";

interface AudioRoomPanelProps {
  session: SessionWithDetails;
}

export function AudioRoomPanel({ session }: AudioRoomPanelProps) {
  if (session.status === "live") {
    return (
      <AudioRoomView
        sessionId={session.id}
        roomName={session.livekit_room_name}
        sessionTitle={session.title || "Sesli Oda"}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-[600px] rounded-xl border bg-linear-to-br from-purple-950/30 to-slate-900/50 text-muted-foreground">
      <div className="text-center">
        <Mic className="h-16 w-16 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">Sesli oda sona erdi</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {session.ended_at &&
            format(new Date(session.ended_at), "d MMMM yyyy, HH:mm", { locale: tr })}
        </p>
      </div>
    </div>
  );
}
