"use client";

/**
 * Tool UI Components
 * Her backend tool için özel UI component'leri
 * makeAssistantToolUI ile tanımlanır
 */

import { makeAssistantToolUI } from "@assistant-ui/react";
import { DataTable, type Column } from "./data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Mail,
  Calendar,
  Ban,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  BarChart3,
  MessageSquare,
  Coins,
  Star,
  FileText,
  Bell,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Helper Components
// ============================================

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/30">
      <Loader2 className="size-4 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
      <XCircle className="size-4 text-destructive" />
      <span className="text-sm text-destructive">{message}</span>
    </div>
  );
}

function SuccessState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 rounded-lg border border-green-500/50 bg-green-500/10">
      <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
      <span className="text-sm text-green-600 dark:text-green-400">{message}</span>
    </div>
  );
}

// ============================================
// User Tools
// ============================================

// searchUsers Tool UI
interface SearchUsersResult {
  success: boolean;
  query: string;
  count: number;
  users: Array<{
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    email: string;
    role: string;
    is_creator: boolean;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    last_login: string;
  }>;
}

export const SearchUsersUI = makeAssistantToolUI<
  { query?: string; role?: string; limit?: number },
  SearchUsersResult
>({
  toolName: "searchUsers",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <LoadingState
          message={`Kullanıcılar aranıyor${args.query ? `: "${args.query}"` : ""}...`}
        />
      );
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="Kullanıcı araması başarısız oldu" />;
    }

    if (!result?.users) return null;

    const columns: Column<SearchUsersResult["users"][0]>[] = [
      { key: "username", label: "Kullanıcı Adı", priority: "primary" },
      { key: "display_name", label: "Ad", truncate: true },
      { key: "email", label: "E-posta", truncate: true },
      {
        key: "role",
        label: "Rol",
        format: {
          kind: "status",
          statusMap: {
            admin: { tone: "danger", label: "Admin" },
            creator: { tone: "info", label: "Creator" },
            user: { tone: "neutral", label: "User" }
          }
        }
      },
      {
        key: "is_active",
        label: "Durum",
        format: {
          kind: "boolean",
          labels: { true: "✓ Aktif", false: "✕ Pasif" }
        }
      },
      {
        key: "created_at",
        label: "Kayıt",
        format: { kind: "date", dateFormat: "relative" }
      }
    ];

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <span>{result.count} kullanıcı bulundu</span>
          {args.role && <Badge variant="outline">{args.role}</Badge>}
        </div>
        <DataTable
          rowIdKey="id"
          columns={columns}
          data={result.users}
          defaultSort={{ by: "created_at", direction: "desc" }}
          maxRows={10}
        />
      </div>
    );
  }
});

// lookupUser Tool UI
interface LookupUserResult {
  success: boolean;
  user: {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    email: string;
    role: string;
    is_creator: boolean;
    is_verified: boolean;
    is_active: boolean;
    created_at: string;
    last_login: string;
    bio?: string;
    avatar_url?: string;
    stats?: {
      posts: number;
      followers: number;
      following: number;
    };
  };
}

export const LookupUserUI = makeAssistantToolUI<
  { identifier: string; identifierType?: string },
  LookupUserResult
>({
  toolName: "lookupUser",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return <LoadingState message={`Kullanıcı aranıyor: ${args.identifier}...`} />;
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="Kullanıcı bulunamadı" />;
    }

    if (!result?.user) return null;

    const { user } = result;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{user.display_name || user.username}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant={user.is_active ? "default" : "secondary"}>
                {user.is_active ? "Aktif" : "Pasif"}
              </Badge>
              <Badge variant="outline">{user.role}</Badge>
              {user.is_verified && <Badge variant="secondary">✓ Onaylı</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span>Kayıt: {user.created_at}</span>
            </div>
          </div>

          {user.stats && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{user.stats.posts}</div>
                  <div className="text-xs text-muted-foreground">Post</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{user.stats.followers}</div>
                  <div className="text-xs text-muted-foreground">Takipçi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{user.stats.following}</div>
                  <div className="text-xs text-muted-foreground">Takip</div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
});

// banUser Tool UI
interface BanUserResult {
  success: boolean;
  message: string;
  userId: string;
  username: string;
  duration: string;
  reason: string;
  bannedAt: string;
  expiresAt?: string;
}

export const BanUserUI = makeAssistantToolUI<
  { userId: string; duration: string; reason: string },
  BanUserResult
>({
  toolName: "banUser",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="size-4 text-orange-600 dark:text-orange-400" />
          <span className="text-sm text-orange-600 dark:text-orange-400">
            Kullanıcı banlanıyor... ({args.duration})
          </span>
        </div>
      );
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="Ban işlemi başarısız oldu" />;
    }

    if (!result) return null;

    return (
      <Card className="border-destructive/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Ban className="size-5 text-destructive" />
            <CardTitle className="text-base text-destructive">Kullanıcı Banlandı</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kullanıcı:</span>
            <span className="font-medium">{result.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Süre:</span>
            <Badge variant="destructive">{result.duration}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sebep:</span>
            <span>{result.reason}</span>
          </div>
          {result.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bitiş:</span>
              <span>{result.expiresAt}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
});

// ============================================
// System Stats Tool UI
// ============================================

interface SystemStatsResult {
  success: boolean;
  stats?: {
    users?: {
      total?: number;
      active_24h?: number;
      creators?: number;
      new_in_period?: number;
    };
    content?: {
      posts?: number;
      comments?: number;
      messages?: number;
    };
    moderation?: {
      pending_queue?: number;
    };
  };
  period?: string;
  generated_at?: string;
}

export const GetSystemStatsUI = makeAssistantToolUI<{ period?: string }, SystemStatsResult>({
  toolName: "getSystemStats",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Sistem istatistikleri yükleniyor..." />;
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="İstatistikler yüklenemedi" />;
    }

    if (!result?.stats) return null;

    const { stats } = result;

    const statCards = [
      {
        icon: Users,
        label: "Toplam Kullanıcı",
        value: stats.users?.total ?? 0,
        color: "text-blue-600"
      },
      { icon: Star, label: "Creator", value: stats.users?.creators ?? 0, color: "text-purple-600" },
      { icon: FileText, label: "Post", value: stats.content?.posts ?? 0, color: "text-green-600" },
      {
        icon: MessageSquare,
        label: "Mesaj",
        value: stats.content?.messages ?? 0,
        color: "text-orange-600"
      }
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="size-4" />
          <span>Sistem İstatistikleri</span>
          <Badge variant="outline">{result.period}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center gap-2">
                <stat.icon className={cn("size-4", stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold mt-1">{stat.value.toLocaleString("tr-TR")}</div>
            </Card>
          ))}
        </div>

        {(stats.users?.new_in_period ?? 0) > 0 && (
          <div className="text-sm text-muted-foreground">
            📈 Bu dönemde {stats.users.new_in_period} yeni kullanıcı katıldı
          </div>
        )}
      </div>
    );
  }
});

// ============================================
// Creator Stats Tool UI
// ============================================

interface CreatorStatsResult {
  success: boolean;
  creator: {
    username: string;
    displayName: string;
  };
  stats: {
    subscribers: number;
    posts: number;
    totalLikes: number;
    totalComments: number;
    engagementRate: number;
    earnings?: {
      total: number;
      thisMonth: number;
    };
  };
  period: string;
}

export const GetCreatorStatsUI = makeAssistantToolUI<
  { creatorId: string; period?: string },
  CreatorStatsResult
>({
  toolName: "getCreatorStats",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Creator istatistikleri yükleniyor..." />;
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="Creator istatistikleri yüklenemedi" />;
    }

    if (!result?.stats) return null;

    const { creator, stats } = result;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-yellow-500" />
            <div>
              <CardTitle className="text-base">{creator.displayName}</CardTitle>
              <CardDescription>@{creator.username} • Creator İstatistikleri</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{stats.subscribers}</div>
              <div className="text-xs text-muted-foreground">Abone</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.posts}</div>
              <div className="text-xs text-muted-foreground">Post</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <div className="text-xs text-muted-foreground">Beğeni</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-600">
                %{(stats.engagementRate * 100).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Engagement</div>
            </div>
          </div>

          {stats.earnings && (
            <div className="mt-4 p-3 rounded-lg border border-green-500/30 bg-green-500/10">
              <div className="flex items-center gap-2 text-sm">
                <Coins className="size-4 text-green-600" />
                <span className="text-green-600 font-medium">
                  Bu ay: {stats.earnings.thisMonth.toLocaleString("tr-TR")} coin
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
});

// ============================================
// Recent Posts Tool UI
// ============================================

interface RecentPostsResult {
  success: boolean;
  count: number;
  posts: Array<{
    id: string;
    content: string;
    author: string;
    likes: number;
    comments: number;
    created_at: string;
    is_hidden: boolean;
    moderation_status: string;
  }>;
}

export const GetRecentPostsUI = makeAssistantToolUI<
  { userId?: string; limit?: number },
  RecentPostsResult
>({
  toolName: "getRecentPosts",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Son postlar yükleniyor..." />;
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="Postlar yüklenemedi" />;
    }

    if (!result?.posts) return null;

    const columns: Column<RecentPostsResult["posts"][0]>[] = [
      { key: "content", label: "İçerik", priority: "primary", truncate: true },
      { key: "author", label: "Yazar" },
      { key: "likes", label: "Beğeni", align: "right", format: { kind: "number" } },
      { key: "comments", label: "Yorum", align: "right", format: { kind: "number" } },
      {
        key: "moderation_status",
        label: "Durum",
        format: {
          kind: "status",
          statusMap: {
            approved: { tone: "success", label: "Onaylı" },
            pending: { tone: "warning", label: "Bekliyor" },
            rejected: { tone: "danger", label: "Reddedildi" }
          }
        }
      },
      { key: "created_at", label: "Tarih", format: { kind: "date", dateFormat: "relative" } }
    ];

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          <span>{result.count} post</span>
        </div>
        <DataTable
          rowIdKey="id"
          columns={columns}
          data={result.posts}
          defaultSort={{ by: "created_at", direction: "desc" }}
          maxRows={10}
        />
      </div>
    );
  }
});

// ============================================
// Security Logs Tool UI
// ============================================

interface SecurityLogsResult {
  success: boolean;
  count: number;
  logs: Array<{
    id: string;
    event_type: string;
    user_id: string;
    username: string;
    details: string;
    ip_address?: string;
    created_at: string;
    severity: "low" | "medium" | "high";
  }>;
}

export const GetSecurityLogsUI = makeAssistantToolUI<
  { userId?: string; eventType?: string; limit?: number },
  SecurityLogsResult
>({
  toolName: "getSecurityLogs",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Güvenlik logları yükleniyor..." />;
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="Güvenlik logları yüklenemedi" />;
    }

    if (!result?.logs) return null;

    const columns: Column<SecurityLogsResult["logs"][0]>[] = [
      {
        key: "event_type",
        label: "Olay",
        priority: "primary",
        format: {
          kind: "badge",
          colorMap: {
            shadow_mode: "warning",
            screenshot: "danger",
            login_failed: "danger",
            password_change: "info"
          }
        }
      },
      { key: "username", label: "Kullanıcı" },
      { key: "details", label: "Detay", truncate: true },
      {
        key: "severity",
        label: "Seviye",
        format: {
          kind: "status",
          statusMap: {
            low: { tone: "neutral", label: "Düşük" },
            medium: { tone: "warning", label: "Orta" },
            high: { tone: "danger", label: "Yüksek" }
          }
        }
      },
      { key: "created_at", label: "Zaman", format: { kind: "date", dateFormat: "relative" } }
    ];

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" />
          <span>{result.count} güvenlik olayı</span>
        </div>
        <DataTable
          rowIdKey="id"
          columns={columns}
          data={result.logs}
          defaultSort={{ by: "created_at", direction: "desc" }}
          maxRows={15}
        />
      </div>
    );
  }
});

// ============================================
// Send Notification Tool UI
// ============================================

interface SendNotificationResult {
  success: boolean;
  message: string;
  notificationId: string;
  recipient: string;
  type: string;
  sentAt: string;
}

export const SendNotificationUI = makeAssistantToolUI<
  { userId: string; title: string; body: string; type?: string },
  SendNotificationResult
>({
  toolName: "sendNotification",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/30">
          <Bell className="size-4 text-muted-foreground animate-pulse" />
          <span className="text-sm text-muted-foreground">Bildirim gönderiliyor...</span>
        </div>
      );
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return <ErrorState message="Bildirim gönderilemedi" />;
    }

    if (!result) return null;

    return <SuccessState message={`✓ Bildirim gönderildi: ${result.recipient}`} />;
  }
});

// ============================================
// Export all Tool UIs
// ============================================

export const AllToolUIs = () => (
  <>
    <SearchUsersUI />
    <LookupUserUI />
    <BanUserUI />
    <GetSystemStatsUI />
    <GetCreatorStatsUI />
    <GetRecentPostsUI />
    <GetSecurityLogsUI />
    <SendNotificationUI />
  </>
);
