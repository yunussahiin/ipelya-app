"use client";

import { Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParticipantsList } from "@/components/ops/live/participants-list";

import type { LiveParticipant } from "./types";

interface ParticipantsPanelProps {
  participants: LiveParticipant[];
  sessionId: string;
  onRefresh: () => void;
}

export function ParticipantsPanel({ participants, sessionId, onRefresh }: ParticipantsPanelProps) {
  const activeParticipants = participants.filter((p) => p.is_active);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Katılımcılar
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            {activeParticipants.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <ParticipantsList
              participants={participants}
              sessionId={sessionId}
              onRefresh={onRefresh}
              compact
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
