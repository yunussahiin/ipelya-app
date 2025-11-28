/**
 * AI Logs Table
 * Web Ops AI chat logları tablosu
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, MessageSquare, Bot, User, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Log tipi
interface ChatLog {
  id: string;
  admin_id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls: unknown[] | null;
  tool_results: unknown[] | null;
  model: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
  admin?: {
    full_name: string;
    email: string;
  };
}

interface LogStats {
  total_requests: number;
  total_tokens: number;
  avg_duration_ms: number;
  error_count: number;
}

export function AILogsTable() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Load logs
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ops/ai/logs?limit=50");
      if (!response.ok) throw new Error("Failed to load logs");

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(data.stats || null);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("[AI Logs] Load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  };

  // Role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "user":
        return (
          <Badge variant="outline">
            <User className="mr-1 h-3 w-3" />
            User
          </Badge>
        );
      case "assistant":
        return (
          <Badge variant="secondary">
            <Bot className="mr-1 h-3 w-3" />
            AI
          </Badge>
        );
      case "tool":
        return (
          <Badge>
            <MessageSquare className="mr-1 h-3 w-3" />
            Tool
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam İstek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_requests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_tokens.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ort. Süre</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_duration_ms}ms</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hata Sayısı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.error_count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chat Logları</CardTitle>
              <CardDescription>
                Son {logs.length} / {total} kayıt
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>İçerik</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Süre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Henüz log kaydı yok
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell className="text-sm">{log.admin?.full_name || "N/A"}</TableCell>
                      <TableCell>{getRoleBadge(log.role)}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {log.error ? (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {log.error}
                          </span>
                        ) : (
                          log.content?.slice(0, 100) || "-"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.model?.split("/").pop() || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.tokens_used?.toLocaleString() || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
