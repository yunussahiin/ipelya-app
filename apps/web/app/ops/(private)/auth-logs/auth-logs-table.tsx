"use client";

import {
  IconChevronLeft,
  IconChevronRight,
  IconLogin,
  IconLogout,
  IconUserPlus,
  IconKey,
  IconTrash,
  IconRefresh,
  IconMail,
  IconDeviceMobile,
  IconBrandApple,
  IconBrandGoogle,
  IconShield,
  IconCrown,
  IconUser,
  IconCheck,
  IconExternalLink
} from "@tabler/icons-react";
import { formatDistanceToNow, format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface AuthLog {
  id: string;
  ip_address: string;
  created_at: string;
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_username: string | null;
  provider: string | null;
  log_type: string | null;
  user_type: "admin" | "creator" | "user";
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    role: string | null;
  } | null;
  admin_profile: {
    full_name: string;
    email: string;
  } | null;
  device_info: Record<string, unknown> | null;
}

interface AuthLogsTableProps {
  page: number;
  action: string;
  search: string;
  period: string;
  userType?: string;
}

const ITEMS_PER_PAGE = 25;

export function AuthLogsTable({ page, action, search, period, userType }: AuthLogsTableProps) {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();

      // Calculate period date
      const getPeriodDate = (): Date => {
        const now = new Date();
        switch (period) {
          case "1h":
            return new Date(now.getTime() - 60 * 60 * 1000);
          case "24h":
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
          case "7d":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case "30d":
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          default:
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
      };

      const periodDate = getPeriodDate();
      const offset = (page - 1) * ITEMS_PER_PAGE;

      const { data, error } = await supabase.rpc("get_auth_logs", {
        p_action: action === "all" ? null : action,
        p_search: search || null,
        p_period_start: periodDate.toISOString(),
        p_limit: ITEMS_PER_PAGE,
        p_offset: offset,
        p_user_type: userType === "all" ? null : userType || null
      });

      if (error) {
        console.error("Error fetching auth logs:", error);
        setLogs([]);
        setTotalCount(0);
      } else {
        setLogs(data?.logs || []);
        setTotalCount(data?.total_count || 0);
      }

      setLoading(false);
    }

    fetchLogs();
  }, [page, action, search, period, userType]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "login":
        return <IconLogin className="h-4 w-4 text-green-500" />;
      case "logout":
        return <IconLogout className="h-4 w-4 text-blue-500" />;
      case "user_signedup":
        return <IconUserPlus className="h-4 w-4 text-purple-500" />;
      case "user_deleted":
        return <IconTrash className="h-4 w-4 text-red-500" />;
      case "token_refreshed":
        return <IconRefresh className="h-4 w-4 text-gray-500" />;
      case "user_recovery_requested":
        return <IconKey className="h-4 w-4 text-orange-500" />;
      default:
        return <IconMail className="h-4 w-4 text-gray-400" />;
    }
  };

  // Supabase Auth Audit Log action labels
  // https://supabase.com/docs/guides/auth/audit-logs
  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case "login":
        return "Giriş";
      case "logout":
        return "Çıkış";
      case "user_signedup":
        return "Kayıt";
      case "user_deleted":
        return "Hesap Silindi";
      case "user_modified":
        return "Profil Güncellendi";
      case "user_invited":
        return "Davet Gönderildi";
      case "invite_accepted":
        return "Davet Kabul Edildi";
      case "user_recovery_requested":
        return "Şifre Sıfırlama Talebi";
      case "user_reauthenticate_requested":
        return "Yeniden Doğrulama";
      case "user_confirmation_requested":
        return "Onay Talebi";
      case "user_repeated_signup":
        return "Tekrarlı Kayıt";
      case "user_updated_password":
        return "Şifre Değiştirildi";
      case "token_revoked":
        return "Token İptal";
      case "token_refreshed":
        return "Token Yenilendi";
      // MFA actions
      case "generate_recovery_codes":
        return "MFA Kurtarma Kodları";
      case "factor_in_progress":
        return "MFA Kurulum";
      case "factor_unenrolled":
        return "MFA Kaldırıldı";
      case "challenge_created":
        return "MFA Challenge";
      case "verification_attempted":
        return "MFA Doğrulama";
      case "factor_deleted":
        return "MFA Silindi";
      case "recovery_codes_deleted":
        return "Kurtarma Kodları Silindi";
      case "factor_updated":
        return "MFA Güncellendi";
      case "mfa_code_login":
        return "MFA ile Giriş";
      case "identity_unlinked":
        return "Kimlik Bağlantısı Kaldırıldı";
      default:
        return actionType;
    }
  };

  const getProviderIcon = (provider: string | null) => {
    switch (provider) {
      case "apple":
        return <IconBrandApple className="h-4 w-4" />;
      case "google":
        return <IconBrandGoogle className="h-4 w-4" />;
      case "phone":
        return <IconDeviceMobile className="h-4 w-4" />;
      default:
        return <IconMail className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      // Başarılı işlemler - yeşil/default
      case "login":
      case "user_signedup":
      case "invite_accepted":
      case "user_updated_password":
      case "mfa_code_login":
        return "default";
      // Bilgi işlemleri - secondary
      case "logout":
      case "user_recovery_requested":
      case "user_confirmation_requested":
      case "user_reauthenticate_requested":
      case "token_refreshed":
        return "secondary";
      // Tehlikeli/dikkat gerektiren - destructive
      case "user_deleted":
      case "token_revoked":
      case "user_repeated_signup":
      case "factor_deleted":
      case "recovery_codes_deleted":
      case "identity_unlinked":
        return "destructive";
      // Diğer - outline
      default:
        return "outline";
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case "admin":
        return <IconShield className="h-4 w-4 text-red-500" />;
      case "creator":
        return <IconCrown className="h-4 w-4 text-yellow-500" />;
      default:
        return <IconUser className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUserTypeBadge = (type: string) => {
    switch (type) {
      case "admin":
        return (
          <Badge variant="destructive" className="text-xs">
            Admin
          </Badge>
        );
      case "creator":
        return <Badge className="bg-yellow-500 text-xs">Creator</Badge>;
      default:
        return (
          <Badge variant="outline" className="text-xs">
            User
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auth Logları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Auth Logları ({totalCount} kayıt)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Tarih</TableHead>
              <TableHead>Kullanıcı</TableHead>
              <TableHead className="w-[100px]">Tip</TableHead>
              <TableHead>İşlem</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>IP Adresi</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Kayıt bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-sm">
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                              locale: tr
                            })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss", {
                            locale: tr
                          })}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {log.profile?.avatar_url ? (
                        <img
                          src={log.profile.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          {getUserTypeIcon(log.user_type)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {log.profile?.display_name ||
                              log.admin_profile?.full_name ||
                              log.actor_name ||
                              "Bilinmiyor"}
                          </span>
                          {log.profile?.is_verified && (
                            <IconCheck className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          @
                          {log.profile?.username ||
                            log.actor_username?.split("@")[0] ||
                            log.actor_id?.slice(0, 8) ||
                            "-"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getUserTypeBadge(log.user_type)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <Badge
                        variant={
                          getActionBadgeVariant(log.action) as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline"
                        }
                      >
                        {getActionLabel(log.action)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getProviderIcon(log.provider)}
                      <span className="text-sm capitalize">{log.provider || "email"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="font-mono text-xs">{log.ip_address || "-"}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {log.device_info ? (
                            <div className="text-xs">
                              <p>
                                Platform:{" "}
                                {(log.device_info as Record<string, string>).platform ||
                                  "Bilinmiyor"}
                              </p>
                              <p>
                                OS: {(log.device_info as Record<string, string>).os || "Bilinmiyor"}
                              </p>
                            </div>
                          ) : (
                            "Cihaz bilgisi yok"
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {log.actor_id && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={
                                log.user_type === "admin"
                                  ? "#"
                                  : `/ops/users?search=${log.actor_id}`
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <IconExternalLink className="h-4 w-4" />
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>Kullanıcıya Git</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Sayfa {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} asChild>
                <Link
                  href={`/ops/auth-logs?page=${page - 1}&action=${action}&search=${search}&period=${period}&userType=${userType || "all"}`}
                >
                  <IconChevronLeft className="h-4 w-4" />
                  Önceki
                </Link>
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
                <Link
                  href={`/ops/auth-logs?page=${page + 1}&action=${action}&search=${search}&period=${period}&userType=${userType || "all"}`}
                >
                  Sonraki
                  <IconChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
