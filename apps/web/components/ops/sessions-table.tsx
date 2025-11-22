"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription
} from "@/components/ui/empty";
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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Zap } from "lucide-react";
import { useState } from "react";
import { SessionTerminationDialog } from "./session-termination-dialog";

interface Session {
  id: string;
  user_id: string;
  started_at: string;
  last_activity: string;
  status: string;
  device_type?: string;
}

export function SessionsTable() {
  const queryClient = useQueryClient();
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [terminateDialog, setTerminateDialog] = useState<{
    open: boolean;
    sessionId?: string;
    userId?: string;
  }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["sessions", offset],
    queryFn: async () => {
      const res = await fetch(
        `/api/ops/shadow/sessions?limit=${limit}&offset=${offset}&status=active`
      );
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    staleTime: 0 // Always refetch when invalidated
  });

  const handleTerminateClick = (sessionId: string, userId: string) => {
    setTerminateDialog({ open: true, sessionId, userId });
  };

  const handleTerminateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktif Oturumlar</CardTitle>
          <CardDescription>Shadow mod oturumlarını izleyin ve yönetin</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  const sessions = data?.data || [];
  const total = data?.total || 0;
  const page = data?.page || 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktif Oturumlar</CardTitle>
        <CardDescription>
          {sessions.length} / {total} oturum gösteriliyor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Aktif Oturum Yok</EmptyTitle>
              <EmptyDescription>Şu anda hiçbir aktif oturum bulunmamaktadır</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Oturum ID</TableHead>
                  <TableHead>Kullanıcı ID</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Son Aktivite</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Cihaz</TableHead>
                  <TableHead className="w-12">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: Session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs">{session.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-xs">
                      {session.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(session.started_at)}</TableCell>
                    <TableCell className="text-sm">
                      {formatRelativeTime(session.last_activity)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.status === "active" ? "default" : "secondary"}>
                        {session.status === "active" ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{session.device_type || "Bilinmiyor"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleTerminateClick(session.id, session.user_id)}
                            className="text-red-600"
                          >
                            Sonlandır
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Sayfalandırma */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={page >= totalPages}
            >
              Sonraki
            </Button>
          </div>
        </div>
      </CardContent>

      {terminateDialog.sessionId && terminateDialog.userId && (
        <SessionTerminationDialog
          open={terminateDialog.open}
          onOpenChange={(open) => setTerminateDialog({ ...terminateDialog, open })}
          sessionId={terminateDialog.sessionId}
          userId={terminateDialog.userId}
          onSuccess={handleTerminateSuccess}
        />
      )}
    </Card>
  );
}
