"use client";

/**
 * ParticipantsList Component
 * Oturum katılımcılarını listeler ve yönetim işlemleri sunar
 */

import { useState } from "react";
import { Users, Crown, Mic, Eye, MoreVertical, UserX, Ban } from "lucide-react";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import type { LiveParticipant } from "@/lib/types/live";

interface ParticipantsListProps {
  participants: LiveParticipant[];
  sessionId: string;
  onRefresh?: () => void;
}

type ActionType = "kick" | "ban" | null;

export function ParticipantsList({
  participants,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sessionId,
  onRefresh
}: ParticipantsListProps) {
  // _sessionId will be used for future features like sending announcements
  const [selectedParticipant, setSelectedParticipant] = useState<LiveParticipant | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [loading, setLoading] = useState(false);

  const getRoleIcon = (role: LiveParticipant["role"]) => {
    switch (role) {
      case "host":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "co_host":
        return <Crown className="h-4 w-4 text-orange-500" />;
      case "moderator":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "speaker":
        return <Mic className="h-4 w-4 text-purple-500" />;
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: LiveParticipant["role"]) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      host: "default",
      co_host: "default",
      moderator: "secondary",
      speaker: "secondary",
      viewer: "outline",
      listener: "outline"
    };

    const labels: Record<string, string> = {
      host: "Host",
      co_host: "Co-Host",
      moderator: "Moderatör",
      speaker: "Konuşmacı",
      viewer: "İzleyici",
      listener: "Dinleyici",
      invited_guest: "Davetli"
    };

    return <Badge variant={variants[role] || "outline"}>{labels[role] || role}</Badge>;
  };

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}s ${minutes}dk`;
    }
    return `${minutes}dk`;
  };

  const handleAction = async () => {
    if (!selectedParticipant || !actionType) return;

    setLoading(true);
    try {
      const endpoint =
        actionType === "kick"
          ? `/api/ops/live/participants/${selectedParticipant.id}/kick`
          : `/api/ops/live/participants/${selectedParticipant.id}/ban`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason:
            actionType === "kick" ? "Admin tarafından çıkarıldı" : "Admin tarafından yasaklandı",
          ban_type: "session"
        })
      });

      if (!response.ok) {
        throw new Error("İşlem başarısız");
      }

      toast.success(actionType === "kick" ? "Katılımcı çıkarıldı" : "Katılımcı yasaklandı");
      onRefresh?.();
    } catch (error) {
      toast.error("Hata: " + (error instanceof Error ? error.message : "Bilinmeyen hata"));
    } finally {
      setLoading(false);
      setSelectedParticipant(null);
      setActionType(null);
    }
  };

  const activeParticipants = participants.filter((p) => p.is_active);
  const inactiveParticipants = participants.filter((p) => !p.is_active);

  return (
    <>
      <div className="rounded-lg border">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Users className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold">Katılımcılar</h3>
          <Badge variant="secondary" className="ml-auto">
            {activeParticipants.length} aktif / {participants.length} toplam
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İzleme Süresi</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...activeParticipants, ...inactiveParticipants].map((participant) => (
              <TableRow key={participant.id} className={!participant.is_active ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {participant.profile?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        @{participant.profile?.username || "unknown"}
                      </span>
                      {participant.profile?.display_name && (
                        <span className="text-xs text-muted-foreground">
                          {participant.profile.display_name}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(participant.role)}
                    {getRoleBadge(participant.role)}
                  </div>
                </TableCell>
                <TableCell>
                  {participant.is_active ? (
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Ayrıldı
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {formatWatchTime(
                    (participant as LiveParticipant & { watch_time_seconds?: number })
                      .watch_time_seconds ||
                      participant.total_watch_time_seconds ||
                      0
                  )}
                </TableCell>
                <TableCell>
                  {participant.is_active && participant.role !== "host" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setActionType("kick");
                          }}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Çıkar (Kick)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedParticipant(participant);
                            setActionType("ban");
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Yasakla (Ban)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!selectedParticipant && !!actionType}
        onOpenChange={(open) => !open && setSelectedParticipant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "kick" ? "Katılımcıyı Çıkar" : "Katılımcıyı Yasakla"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "kick"
                ? `@${selectedParticipant?.profile?.username} kullanıcısını oturumdan çıkarmak istediğinize emin misiniz? Kullanıcı tekrar katılabilir.`
                : `@${selectedParticipant?.profile?.username} kullanıcısını bu oturumdan yasaklamak istediğinize emin misiniz? Kullanıcı bu oturuma bir daha katılamaz.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={loading}
              className={
                actionType === "ban"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {loading ? "İşleniyor..." : actionType === "kick" ? "Çıkar" : "Yasakla"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
