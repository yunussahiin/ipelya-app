"use client";

/**
 * Creator Detay Modal
 * Creator'ın detaylı istatistiklerini gösterir
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Video, Mic, Users, Clock, TrendingUp, Calendar, Eye, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CreatorStats {
  creator_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  totalSessions: number;
  videoSessions: number;
  audioSessions: number;
  totalViewers: number;
  maxViewers: number;
  totalDuration: number;
  avgDuration: number;
  lastSession: string;
}

interface CreatorDetailModalProps {
  creator: CreatorStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: string;
  rank?: number;
}

// Süreyi formatla
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} saniye`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} saat ${remainingMinutes} dakika`;
}

// Tarih formatla
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return formatDate(dateString);
}

export function CreatorDetailModal({
  creator,
  open,
  onOpenChange,
  period,
  rank
}: CreatorDetailModalProps) {
  if (!creator) return null;

  const periodLabel =
    {
      day: "Bugün",
      week: "Bu Hafta",
      month: "Bu Ay"
    }[period] || "Bu Hafta";

  const totalSessions = creator.totalSessions || 1;
  const videoPercentage = Math.round((creator.videoSessions / totalSessions) * 100);
  const audioPercentage = Math.round((creator.audioSessions / totalSessions) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={creator.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {creator.display_name?.charAt(0) || creator.username?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span>{creator.display_name || creator.username}</span>
                {rank && rank <= 3 && (
                  <Badge
                    variant="secondary"
                    className={
                      rank === 1
                        ? "bg-yellow-500 text-white"
                        : rank === 2
                          ? "bg-gray-400 text-white"
                          : "bg-amber-600 text-white"
                    }
                  >
                    <Award className="h-3 w-3 mr-1" />#{rank}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-normal">@{creator.username}</p>
            </div>
          </DialogTitle>
          <DialogDescription>{periodLabel} performans istatistikleri</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ana Metrikler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Toplam Oturum</span>
              </div>
              <p className="text-2xl font-bold">{creator.totalSessions}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Toplam İzleyici</span>
              </div>
              <p className="text-2xl font-bold">{creator.totalViewers.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-xs">Maksimum İzleyici</span>
              </div>
              <p className="text-2xl font-bold">{creator.maxViewers.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Toplam Süre</span>
              </div>
              <p className="text-2xl font-bold">{formatDuration(creator.totalDuration)}</p>
            </div>
          </div>

          <Separator />

          {/* Oturum Türü Dağılımı */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Oturum Türü Dağılımı</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-[hsl(var(--chart-1))]" />
                    <span>Video Yayınları</span>
                  </div>
                  <span className="font-medium">
                    {creator.videoSessions} ({videoPercentage}%)
                  </span>
                </div>
                <Progress value={videoPercentage} className="h-2" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-[hsl(var(--chart-2))]" />
                    <span>Sesli Odalar</span>
                  </div>
                  <span className="font-medium">
                    {creator.audioSessions} ({audioPercentage}%)
                  </span>
                </div>
                <Progress value={audioPercentage} className="h-2" />
              </div>
            </div>
          </div>

          <Separator />

          {/* Ek Bilgiler */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ortalama Oturum Süresi</span>
              <span className="font-medium">{formatDuration(creator.avgDuration)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Oturum Başına İzleyici</span>
              <span className="font-medium">
                {creator.totalSessions > 0
                  ? Math.round(creator.totalViewers / creator.totalSessions)
                  : 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Son Yayın</span>
              </div>
              <span className="font-medium">{getRelativeTime(creator.lastSession)}</span>
            </div>
          </div>

          {/* Profil Linki */}
          <div className="pt-2">
            <Link href={`/ops/users/${creator.creator_id}`}>
              <Button variant="outline" className="w-full">
                Kullanıcı Profilini Görüntüle
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
