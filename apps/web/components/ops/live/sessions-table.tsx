"use client";

/**
 * SessionsTable Component
 * Aktif canlı yayınları tablo olarak gösterir
 * Referans: WEB_ADMIN_DASHBOARD.md → Live Overview
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Video, Mic, Eye, MoreVertical, Users, ExternalLink, Copy, XCircle } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

import type { LiveSession } from "@/lib/types/live";
import { TerminateDialog } from "./terminate-dialog";

interface SessionsTableProps {
  sessions: LiveSession[];
  title: string;
  icon: "video" | "audio";
  onTerminate?: (sessionId: string) => void;
  onRefresh?: () => void;
}

export function SessionsTable({
  sessions,
  title,
  icon,
  onTerminate,
  onRefresh
}: SessionsTableProps) {
  const router = useRouter();
  const [terminateSession, setTerminateSession] = useState<LiveSession | null>(null);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}s ${minutes}dk`;
    }
    return `${minutes}dk`;
  };

  const copyRoomId = (roomName: string) => {
    navigator.clipboard.writeText(roomName);
    toast.success("Room ID kopyalandı");
  };

  const handleTerminateConfirm = async (reason: string) => {
    if (!terminateSession) return;

    try {
      const response = await fetch(`/api/ops/live/sessions/${terminateSession.id}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error("Oturum sonlandırılamadı");
      }

      toast.success("Oturum başarıyla sonlandırıldı");
      onTerminate?.(terminateSession.id);
      onRefresh?.();
    } catch (error) {
      toast.error("Hata: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setTerminateSession(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <div className="flex flex-col items-center gap-2">
          {icon === "video" ? (
            <Video className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Mic className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-muted-foreground">
            Aktif {icon === "video" ? "video yayını" : "sesli oda"} bulunmuyor
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          {icon === "video" ? (
            <Video className="h-5 w-5 text-red-500" />
          ) : (
            <Mic className="h-5 w-5 text-purple-500" />
          )}
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="secondary" className="ml-auto">
            {sessions.length}
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creator</TableHead>
              <TableHead>Başlık</TableHead>
              <TableHead>İzleyici</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead>Erişim</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow
                key={session.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/ops/live/sessions/${session.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.creator?.avatar_url || undefined} />
                      <AvatarFallback>
                        {session.creator?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">@{session.creator?.username || "unknown"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="max-w-[200px] truncate">{session.title || "Başlıksız"}</span>
                    <Badge variant="outline" className="text-red-500 border-red-500">
                      🔴 CANLI
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{session.current_viewers || 0}</span>
                    {session.peak_viewers > 0 && (
                      <span className="text-muted-foreground text-sm">
                        (max: {session.peak_viewers})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {session.duration_seconds
                    ? formatDuration(session.duration_seconds)
                    : session.started_at
                      ? formatDistanceToNow(new Date(session.started_at), { locale: tr })
                      : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      session.access_type === "public"
                        ? "default"
                        : session.access_type === "subscribers_only"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {session.access_type === "public" && "Herkese Açık"}
                    {session.access_type === "subscribers_only" && "Abonelere Özel"}
                    {session.access_type === "pay_per_view" && `${session.ppv_coin_price} Coin`}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/ops/live/sessions/${session.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detayları Gör
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/ops/live/sessions/${session.id}?preview=true`)}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Canlı İzle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyRoomId(session.livekit_room_name)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Room ID Kopyala
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setTerminateSession(session)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Yayını Sonlandır
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TerminateDialog
        open={!!terminateSession}
        onOpenChange={(open: boolean) => !open && setTerminateSession(null)}
        sessionTitle={terminateSession?.title || "Bu yayın"}
        onConfirm={handleTerminateConfirm}
      />
    </>
  );
}
