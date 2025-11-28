"use client";

/**
 * Tool UI Components
 * Her backend tool için özel UI component'leri
 * makeAssistantToolUI ile tanımlanır
 */

import { makeAssistantToolUI, useAssistantRuntime } from "@assistant-ui/react";
import { DataTable, type Column } from "./data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Lock,
  TrendingUp,
  Send
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
// Action Buttons Component
// ============================================

interface ActionButtonConfig {
  label: string;
  command: string;
  icon?: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost";
}

function ActionButtons({
  actions,
  title = "💡 İlgili İşlemler"
}: {
  actions: ActionButtonConfig[];
  title?: string;
}) {
  const runtime = useAssistantRuntime();

  const handleClick = (command: string) => {
    runtime.thread.append({
      role: "user",
      content: [{ type: "text", text: command }]
    });
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.command}
            variant={action.variant || "outline"}
            size="sm"
            onClick={() => handleClick(action.command)}
            className="gap-1.5"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
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
  user?: {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    email: string;
    phone?: string;
    role: string;
    is_creator: boolean;
    is_verified: boolean;
    is_active: boolean;
    gender?: string;
    bio?: string;
    location?: string;
    avatar_url?: string;
    cover_url?: string;
    created_at: string;
    last_login_at?: string;
    banned_until?: string | null;
    onboarding_completed?: boolean;
    shadow_profile_active?: boolean;
    biometric_enabled?: boolean;
  };
  stats?: {
    post_count: number;
    follower_count: number;
    following_count: number;
  };
  device_info?: object | null;
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

          {result.stats && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{result.stats.post_count}</div>
                  <div className="text-xs text-muted-foreground">Post</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{result.stats.follower_count}</div>
                  <div className="text-xs text-muted-foreground">Takipçi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{result.stats.following_count}</div>
                  <div className="text-xs text-muted-foreground">Takip</div>
                </div>
              </div>
            </>
          )}

          <ActionButtons
            actions={[
              {
                label: "Postlarını Göster",
                command: `${user.username} kullanıcısının postlarını göster`,
                icon: <FileText className="size-3.5" />
              },
              {
                label: "Bakiyesini Göster",
                command: `${user.username} bakiyesini göster`,
                icon: <Coins className="size-3.5" />
              },
              {
                label: "Bildirim Gönder",
                command: `${user.username} kullanıcısına bildirim gönder`,
                icon: <Send className="size-3.5" />
              },
              ...(user.is_creator
                ? [
                    {
                      label: "Creator İstatistikleri",
                      command: `${user.username} creator istatistikleri`,
                      icon: <TrendingUp className="size-3.5" />
                    }
                  ]
                : []),
              {
                label: "Banla",
                command: `${user.username} kullanıcısını banla`,
                icon: <Ban className="size-3.5" />,
                variant: "destructive" as const
              }
            ]}
          />
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
            📈 Bu dönemde {stats.users?.new_in_period ?? 0} yeni kullanıcı katıldı
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
    post_type: string; // 'standard' | 'vibe'
    caption?: string;
    is_exclusive?: boolean;
    is_anon?: boolean;
    visibility?: string;
    is_hidden?: boolean;
    is_flagged?: boolean;
    moderation_status?: string;
    created_at: string;
    engagement?: {
      likes: number;
      comments: number;
      shares: number;
      views: number;
    };
    media?: Array<{
      type: string; // 'image' | 'video' | 'audio'
      url?: string | null;
      thumbnail?: string | null;
      duration?: number | null; // Video süresi (saniye)
    }>;
    media_count?: number;
    author?: {
      username: string;
      display_name?: string;
      is_creator?: boolean;
      is_verified?: boolean;
    } | null;
    poll?: {
      question: string;
      options: string[] | object;
      expires_at?: string;
      total_votes: number;
    } | null;
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

    // Medya içeren postları ayır
    const postsWithMedia = result.posts.filter((p) => p.media && p.media.length > 0);
    const hasMediaPosts = postsWithMedia.length > 0;

    // Veriyi DataTable için düzleştir
    const flattenedPosts = result.posts.map((post) => ({
      id: post.id,
      caption: post.caption || "(İçerik yok)",
      author: post.author?.username || "Anonim",
      post_type: post.post_type,
      likes: post.engagement?.likes || 0,
      comments: post.engagement?.comments || 0,
      views: post.engagement?.views || 0,
      media_count: post.media_count || 0,
      moderation_status: post.moderation_status || "pending",
      created_at: post.created_at
    }));

    const columns: Column<(typeof flattenedPosts)[0]>[] = [
      { key: "caption", label: "İçerik", priority: "primary", truncate: true },
      { key: "author", label: "Yazar" },
      { key: "post_type", label: "Tip", format: { kind: "badge" } },
      { key: "media_count", label: "Medya", align: "right", format: { kind: "number" } },
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4" />
          <span>{result.count} post</span>
          {hasMediaPosts && <Badge variant="outline">{postsWithMedia.length} medyalı</Badge>}
        </div>

        {/* Medya Galerisi - Thumbnail'ler */}
        {hasMediaPosts && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">📸 Medya Önizleme</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {postsWithMedia.slice(0, 10).map((post) =>
                post.media?.slice(0, 1).map((m, idx) => (
                  <a
                    key={`${post.id}-${idx}`}
                    href={m.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden border bg-muted hover:opacity-80 transition-opacity group"
                  >
                    {m.thumbnail || m.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.thumbnail || m.url || ""}
                        alt={post.caption || "Post media"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {m.type === "video" ? "🎬" : "📷"}
                      </div>
                    )}
                    {m.type === "video" && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        {m.duration
                          ? `${Math.floor(m.duration / 60)}:${String(m.duration % 60).padStart(2, "0")}`
                          : "🎬"}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{post.author?.username}</p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        <DataTable
          rowIdKey="id"
          columns={columns}
          data={flattenedPosts}
          defaultSort={{ by: "created_at", direction: "desc" }}
          maxRows={10}
        />

        <ActionButtons
          actions={[
            {
              label: "Moderasyon Kuyruğu",
              command: "Moderasyon kuyruğunu göster",
              icon: <AlertTriangle className="size-3.5" />
            },
            {
              label: "Trend Postlar",
              command: "En çok beğenilen postları göster",
              icon: <TrendingUp className="size-3.5" />
            },
            {
              label: "Platform İstatistikleri",
              command: "Platform istatistiklerini göster",
              icon: <BarChart3 className="size-3.5" />
            }
          ]}
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
  userId?: string;
  period?: string;
  logType?: string;
  count: number;
  logs: Array<{
    type: string;
    username: string;
    description: string;
    ip_address?: string | null;
    created_at: string;
  }>;
}

export const GetSecurityLogsUI = makeAssistantToolUI<
  { userId?: string; logType?: string; limit?: number },
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

    // Veriyi DataTable için düzleştir (id ekle)
    const logsWithId = result.logs.map((log, index) => ({
      id: `log-${index}`,
      ...log
    }));

    const columns: Column<(typeof logsWithId)[0]>[] = [
      {
        key: "type",
        label: "Tip",
        priority: "primary",
        format: {
          kind: "badge",
          colorMap: {
            screenshot: "danger",
            login_failed: "danger",
            login: "info"
          }
        }
      },
      { key: "username", label: "Kullanıcı" },
      { key: "description", label: "Detay", truncate: true },
      { key: "ip_address", label: "IP" },
      { key: "created_at", label: "Zaman", format: { kind: "date", dateFormat: "relative" } }
    ];

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" />
          <span>{result.count} güvenlik olayı</span>
          {result.logType && <Badge variant="outline">{result.logType}</Badge>}
        </div>
        <DataTable
          rowIdKey="id"
          columns={columns}
          data={logsWithId}
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
// V2 Tool UIs - Yeni Eklenenler
// ============================================

// Approve Post UI
interface ApprovePostResult {
  success: boolean;
  message: string;
  postId: string;
  previousStatus?: string;
  error?: string;
}

export const ApprovePostUI = makeAssistantToolUI<{ postId: string }, ApprovePostResult>({
  toolName: "approvePost",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Post onaylanıyor..." />;
    }
    if (!result) return null;
    if (!result.success) {
      return <ErrorState message={result.error || "Post onaylanamadı"} />;
    }
    return <SuccessState message={result.message} />;
  }
});

// Reject Post UI
interface RejectPostResult {
  success: boolean;
  message: string;
  postId: string;
  reason: string;
  userNotified: boolean;
  error?: string;
}

export const RejectPostUI = makeAssistantToolUI<
  { postId: string; reason: string; notifyUser?: boolean },
  RejectPostResult
>({
  toolName: "rejectPost",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Post reddediliyor..." />;
    }
    if (!result) return null;
    if (!result.success) {
      return <ErrorState message={result.error || "Post reddedilemedi"} />;
    }
    return (
      <SuccessState
        message={`${result.message}${result.userNotified ? " (Kullanıcı bilgilendirildi)" : ""}`}
      />
    );
  }
});

// Adjust Coin Balance UI
interface AdjustCoinBalanceResult {
  success: boolean;
  message: string;
  username: string;
  previousBalance: number;
  adjustment: number;
  newBalance: number;
  reason: string;
  error?: string;
}

export const AdjustCoinBalanceUI = makeAssistantToolUI<
  { userId: string; amount: number; reason: string },
  AdjustCoinBalanceResult
>({
  toolName: "adjustCoinBalance",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Bakiye güncelleniyor..." />;
    }
    if (!result) return null;
    if (!result.success) {
      return <ErrorState message={result.error || "Bakiye güncellenemedi"} />;
    }
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <Coins className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium">{result.message}</p>
              <p className="text-sm text-muted-foreground">
                {result.previousBalance} → {result.newBalance} ({result.adjustment > 0 ? "+" : ""}
                {result.adjustment})
              </p>
              <p className="text-xs text-muted-foreground mt-1">Sebep: {result.reason}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
});

// Dashboard Summary UI
interface DashboardSummaryResult {
  success: boolean;
  period: string;
  periodLabel: string;
  summary: {
    newUsers: number;
    newPosts: number;
    pendingModeration: number;
    activeReports: number;
    totalCreators: number;
    totalRevenue: number;
  };
  alerts: string[];
  error?: string;
}

export const GetDashboardSummaryUI = makeAssistantToolUI<
  { period?: string },
  DashboardSummaryResult
>({
  toolName: "getDashboardSummary",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Dashboard yükleniyor..." />;
    }
    if (!result) return null;
    if (!result.success) {
      return <ErrorState message={result.error || "Dashboard yüklenemedi"} />;
    }

    const { summary, alerts, periodLabel } = result;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          <span className="font-medium">📊 {periodLabel} Özeti</span>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="text-sm p-2 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
              >
                {alert}
              </div>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{summary.newUsers}</div>
              <div className="text-xs text-muted-foreground">Yeni Kullanıcı</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{summary.newPosts}</div>
              <div className="text-xs text-muted-foreground">Yeni Post</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{summary.pendingModeration}</div>
              <div className="text-xs text-muted-foreground">Bekleyen Moderasyon</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-red-500">{summary.activeReports}</div>
              <div className="text-xs text-muted-foreground">Aktif Rapor</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-purple-500">{summary.totalCreators}</div>
              <div className="text-xs text-muted-foreground">Toplam Creator</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-500">{summary.totalRevenue}</div>
              <div className="text-xs text-muted-foreground">Coin Geliri</div>
            </CardContent>
          </Card>
        </div>

        <ActionButtons
          actions={[
            {
              label: "Moderasyon Kuyruğu",
              command: "Moderasyon kuyruğunu göster",
              icon: <AlertTriangle className="size-3.5" />
            },
            {
              label: "Raporları Göster",
              command: "Aktif raporları göster",
              icon: <FileText className="size-3.5" />
            },
            {
              label: "Son Postlar",
              command: "Son postları göster",
              icon: <FileText className="size-3.5" />
            }
          ]}
        />
      </div>
    );
  }
});

// Verify User UI
interface VerifyUserResult {
  success: boolean;
  message: string;
  username: string;
  verified: boolean;
  error?: string;
}

export const VerifyUserUI = makeAssistantToolUI<
  { userId: string; verified?: boolean },
  VerifyUserResult
>({
  toolName: "verifyUser",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return <LoadingState message="Doğrulama güncelleniyor..." />;
    }
    if (!result) return null;
    if (!result.success) {
      return <ErrorState message={result.error || "Doğrulama güncellenemedi"} />;
    }
    return <SuccessState message={result.message} />;
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
    {/* V2 Tool UIs */}
    <ApprovePostUI />
    <RejectPostUI />
    <AdjustCoinBalanceUI />
    <GetDashboardSummaryUI />
    <VerifyUserUI />
  </>
);
