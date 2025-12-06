"use client";

/**
 * En Aktif Creator'lar Tablosu
 * Creator bazlı oturum ve izleyici istatistiklerini gösterir
 */

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Video, Mic, Users, Clock, TrendingUp } from "lucide-react";
import { CreatorDetailModal } from "./creator-detail-modal";

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

interface TopCreatorsTableProps {
  creators: CreatorStats[];
  period: string;
}

// Süreyi formatla
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}s ${remainingMinutes}dk`;
}

// Tarih formatla
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function TopCreatorsTable({ creators, period }: TopCreatorsTableProps) {
  const [selectedCreator, setSelectedCreator] = useState<CreatorStats | null>(null);
  const [selectedRank, setSelectedRank] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreatorClick = (creator: CreatorStats, rank: number) => {
    setSelectedCreator(creator);
    setSelectedRank(rank);
    setModalOpen(true);
  };

  const periodLabel =
    {
      day: "Bugün",
      week: "Bu Hafta",
      month: "Bu Ay"
    }[period] || "Bu Hafta";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            En Aktif Creator&apos;lar
          </CardTitle>
          <CardDescription>{periodLabel} en çok yayın yapan creator&apos;lar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead className="text-center">Oturumlar</TableHead>
                <TableHead className="text-center">İzleyici</TableHead>
                <TableHead className="text-center">Süre</TableHead>
                <TableHead className="text-right">Son Yayın</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Bu dönemde aktif creator bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                creators.map((creator, index) => (
                  <TableRow
                    key={creator.creator_id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleCreatorClick(creator, index + 1)}
                  >
                    <TableCell className="font-medium">
                      {index < 3 ? (
                        <Badge
                          variant={index === 0 ? "default" : "secondary"}
                          className={
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                                ? "bg-gray-400"
                                : "bg-amber-600"
                          }
                        >
                          {index + 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={creator.avatar_url || undefined} />
                          <AvatarFallback>
                            {creator.display_name?.charAt(0) || creator.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{creator.display_name || creator.username}</p>
                          <p className="text-xs text-muted-foreground">@{creator.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{creator.totalSessions}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Video className="h-3 w-3" />
                            {creator.videoSessions}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Mic className="h-3 w-3" />
                            {creator.audioSessions}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {creator.totalViewers.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          max: {creator.maxViewers}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(creator.totalDuration)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ort: {formatDuration(creator.avgDuration)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(creator.lastSession)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreatorDetailModal
        creator={selectedCreator}
        open={modalOpen}
        onOpenChange={setModalOpen}
        period={period}
        rank={selectedRank}
      />
    </>
  );
}
