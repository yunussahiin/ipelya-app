"use client";

/**
 * Şikayet Kuyruğu Bileşeni
 * Bekleyen şikayetleri listeler ve işlem yapılmasına olanak tanır
 */

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertTriangle,
  Ban,
  Check,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Shield,
  UserX,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface Session {
  id: string;
  title: string;
  type: string;
  status: string;
}

interface Report {
  id: string;
  session_id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  action_taken: string | null;
  created_at: string;
  reporter: Profile | null;
  reported_user: Profile | null;
  session: Session | null;
}

interface ReportsQueueProps {
  reports: Report[];
  onAction: (reportId: string, action: string, options?: Record<string, unknown>) => Promise<void>;
  onViewDetail: (report: Report) => void;
}

const REASON_LABELS: Record<string, string> = {
  harassment: "Taciz",
  spam: "Spam",
  nudity: "Uygunsuz İçerik",
  violence: "Şiddet",
  hate_speech: "Nefret Söylemi",
  scam: "Dolandırıcılık",
  underage: "Yaş İhlali",
  copyright: "Telif Hakkı",
  other: "Diğer"
};

const REASON_COLORS: Record<string, string> = {
  harassment: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  spam: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  nudity: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  violence: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  hate_speech: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  scam: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  underage: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  copyright: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
};

export function ReportsQueue({ reports, onAction, onViewDetail }: ReportsQueueProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAction = async (
    reportId: string,
    action: string,
    options?: Record<string, unknown>
  ) => {
    setLoadingId(reportId);
    try {
      await onAction(reportId, action, options);
      toast.success(action === "dismiss" ? "Şikayet reddedildi" : "Şikayet işlendi");
    } catch {
      toast.error("İşlem başarısız");
    } finally {
      setLoadingId(null);
    }
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bekleyen şikayet yok</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Bekleyen Şikayetler
        </CardTitle>
        <CardDescription>{reports.length} adet şikayet inceleme bekliyor</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Şikayet Eden</TableHead>
              <TableHead>Şikayet Edilen</TableHead>
              <TableHead>Neden</TableHead>
              <TableHead>Oturum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={report.reporter?.avatar_url || undefined} />
                      <AvatarFallback>
                        {report.reporter?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">@{report.reporter?.username || "bilinmiyor"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={report.reported_user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {report.reported_user?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      @{report.reported_user?.username || "bilinmiyor"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={REASON_COLORS[report.reason] || REASON_COLORS.other}>
                    {REASON_LABELS[report.reason] || report.reason}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {report.session?.title || "Bilinmiyor"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(report.created_at), {
                      addSuffix: true,
                      locale: tr
                    })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onViewDetail(report)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={loadingId === report.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction(report.id, "dismiss")}>
                          <X className="h-4 w-4 mr-2" />
                          Reddet
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(report.id, "warn")}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Uyar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction(report.id, "kick")}>
                          <UserX className="h-4 w-4 mr-2" />
                          Oturumdan Çıkar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(report.id, "ban_session")}>
                          <Ban className="h-4 w-4 mr-2" />
                          Oturumdan Yasakla
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(report.id, "ban_creator", {
                              banType: "temporary",
                              banDuration: 7
                            })
                          }
                          className="text-orange-600"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Creator&apos;dan Yasakla (7 gün)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction(report.id, "ban_global")}
                          className="text-red-600"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Global Yasakla
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-600"
                      onClick={() => handleAction(report.id, "dismiss")}
                      disabled={loadingId === report.id}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
