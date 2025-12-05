"use client";

/**
 * Aktif Banlar Tablosu
 * Aktif yasakları listeler ve kaldırılmasına olanak tanır
 */

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import { Ban, Clock, Globe, Shield, Trash2, User, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

interface BanRecord {
  id: string;
  session_id: string | null;
  user_id: string;
  banned_by: string;
  reason: string;
  ban_type: string;
  is_permanent: boolean;
  expires_at: string | null;
  lifted_at: string | null;
  created_at: string;
  user: Profile | null;
  banned_by_user: Profile | null;
  session: Session | null;
}

interface BansTableProps {
  bans: BanRecord[];
  onLiftBan: (banId: string, reason: string) => Promise<void>;
}

const BAN_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  session: {
    label: "Oturum",
    icon: <Video className="h-3 w-3" />,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  creator: {
    label: "Creator",
    icon: <User className="h-3 w-3" />,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
  },
  global: {
    label: "Global",
    icon: <Globe className="h-3 w-3" />,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }
};

export function BansTable({ bans, onLiftBan }: BansTableProps) {
  const [selectedBan, setSelectedBan] = useState<BanRecord | null>(null);
  const [liftReason, setLiftReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLiftBan = async () => {
    if (!selectedBan) return;

    setLoading(true);
    try {
      await onLiftBan(selectedBan.id, liftReason);
      toast.success("Ban kaldırıldı");
      setSelectedBan(null);
      setLiftReason("");
    } catch {
      toast.error("Ban kaldırılamadı");
    } finally {
      setLoading(false);
    }
  };

  if (bans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aktif ban yok</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-500" />
            Aktif Yasaklar
          </CardTitle>
          <CardDescription>{bans.length} adet aktif yasak</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Neden</TableHead>
                <TableHead>Yasaklayan</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bans.map((ban) => {
                const config = BAN_TYPE_CONFIG[ban.ban_type] || BAN_TYPE_CONFIG.session;
                const isExpired = ban.expires_at && new Date(ban.expires_at) < new Date();

                return (
                  <TableRow key={ban.id} className={isExpired ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ban.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {ban.user?.display_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {ban.user?.display_name || "Bilinmiyor"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{ban.user?.username || "?"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={config.color}>
                        {config.icon}
                        <span className="ml-1">{config.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ban.reason || "Belirtilmemiş"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        @{ban.banned_by_user?.username || "sistem"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ban.is_permanent ? (
                        <Badge variant="destructive">Kalıcı</Badge>
                      ) : ban.expires_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {isExpired ? (
                            <span className="text-muted-foreground">Süresi doldu</span>
                          ) : (
                            <span>
                              {formatDistanceToNow(new Date(ban.expires_at), {
                                addSuffix: true,
                                locale: tr
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setSelectedBan(ban)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Kaldır
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ban Kaldırma Dialog */}
      <AlertDialog open={!!selectedBan} onOpenChange={() => setSelectedBan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Kaldır</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>@{selectedBan?.user?.username}</strong> kullanıcısının{" "}
              {BAN_TYPE_CONFIG[selectedBan?.ban_type || "session"]?.label.toLowerCase()} yasağını
              kaldırmak istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedBan && (
            <div className="space-y-4 py-2">
              <div className="text-sm space-y-1">
                <p>
                  <strong>Ban Tarihi:</strong>{" "}
                  {format(new Date(selectedBan.created_at), "d MMMM yyyy HH:mm", { locale: tr })}
                </p>
                <p>
                  <strong>Neden:</strong> {selectedBan.reason || "Belirtilmemiş"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lift-reason">Kaldırma Nedeni (Opsiyonel)</Label>
                <Input
                  id="lift-reason"
                  placeholder="Neden ban kaldırılıyor?"
                  value={liftReason}
                  onChange={(e) => setLiftReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLiftBan}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Kaldırılıyor..." : "Ban Kaldır"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
