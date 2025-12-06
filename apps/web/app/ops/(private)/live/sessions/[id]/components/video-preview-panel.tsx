"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Video } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MobilePreview } from "@/components/ops/live/mobile-preview";

import type { SessionWithDetails } from "./types";

interface VideoPreviewPanelProps {
  session: SessionWithDetails;
  phoneZoom: "1x" | "2x" | "3x" | "4x";
  onZoomChange: (zoom: "1x" | "2x" | "3x" | "4x") => void;
}

export function VideoPreviewPanel({ session, phoneZoom, onZoomChange }: VideoPreviewPanelProps) {
  return (
    <div className="flex flex-col items-center justify-start">
      {/* Zoom Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <ToggleGroup
          type="single"
          value={phoneZoom}
          onValueChange={(value) => value && onZoomChange(value as "1x" | "2x" | "3x")}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem value="1x" className="text-xs px-3 data-[state=on]:bg-background">
            1x
          </ToggleGroupItem>
          <ToggleGroupItem value="2x" className="text-xs px-3 data-[state=on]:bg-background">
            2x
          </ToggleGroupItem>
          <ToggleGroupItem value="3x" className="text-xs px-3 data-[state=on]:bg-background">
            3x
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Phone Preview */}
      <div
        className={`transition-transform duration-300 origin-top ${
          phoneZoom === "2x" ? "scale-125" : phoneZoom === "3x" ? "scale-150" : ""
        }`}
      >
        {session.status === "live" ? (
          <MobilePreview
            sessionId={session.id}
            roomName={session.livekit_room_name}
            creator={
              session.creator
                ? {
                    username: session.creator.username,
                    display_name: session.creator.display_name,
                    avatar_url: session.creator.avatar_url
                  }
                : undefined
            }
          />
        ) : (
          <div className="flex items-center justify-center h-[500px] text-muted-foreground">
            <div className="text-center">
              <Video className="h-16 w-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Yayın sona erdi</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {session.ended_at &&
                  format(new Date(session.ended_at), "d MMMM yyyy, HH:mm", { locale: tr })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
