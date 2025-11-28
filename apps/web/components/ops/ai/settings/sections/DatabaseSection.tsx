"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Table, Eye, Lock, Pencil } from "lucide-react";

interface TableInfo {
  name: string;
  description: string;
  columns: string[];
  access: "read" | "write";
  category: string;
}

const DATABASE_TABLES: TableInfo[] = [
  // Kullanıcı Yönetimi
  {
    name: "profiles",
    description:
      "Kullanıcı profil bilgileri (username, display_name, avatar, role, is_creator, is_verified)",
    columns: [
      "user_id",
      "username",
      "display_name",
      "avatar_url",
      "role",
      "is_creator",
      "is_verified",
      "is_active",
      "created_at"
    ],
    access: "write",
    category: "Kullanıcı"
  },
  {
    name: "user_bans",
    description: "Kullanıcı ban kayıtları",
    columns: ["user_id", "reason", "banned_at", "expires_at", "banned_by"],
    access: "write",
    category: "Kullanıcı"
  },
  {
    name: "notifications",
    description: "Kullanıcı bildirimleri",
    columns: ["recipient_id", "type", "title", "body", "is_read", "created_at"],
    access: "write",
    category: "Kullanıcı"
  },

  // İçerik Yönetimi
  {
    name: "posts",
    description:
      "Kullanıcı paylaşımları (caption, visibility, moderation_status, likes/comments/views count)",
    columns: [
      "id",
      "user_id",
      "caption",
      "post_type",
      "visibility",
      "is_hidden",
      "is_flagged",
      "moderation_status",
      "likes_count",
      "comments_count"
    ],
    access: "write",
    category: "İçerik"
  },
  {
    name: "post_media",
    description: "Post medya dosyaları (fotoğraf, video)",
    columns: ["post_id", "media_type", "media_url", "thumbnail_url", "duration"],
    access: "read",
    category: "İçerik"
  },
  {
    name: "post_polls",
    description: "Post anketleri",
    columns: ["post_id", "question", "options", "expires_at"],
    access: "read",
    category: "İçerik"
  },
  {
    name: "post_comments",
    description: "Post yorumları",
    columns: ["id", "post_id", "user_id", "content", "created_at"],
    access: "read",
    category: "İçerik"
  },

  // Moderasyon
  {
    name: "moderation_queue",
    description: "Moderasyon kuyruğu",
    columns: ["content_type", "content_id", "status", "priority", "created_at"],
    access: "read",
    category: "Moderasyon"
  },
  {
    name: "user_reports",
    description: "Kullanıcı raporları/şikayetleri",
    columns: ["reporter_id", "reported_id", "content_type", "reason", "status"],
    access: "read",
    category: "Moderasyon"
  },
  {
    name: "moderation_actions",
    description: "Moderasyon işlem logları",
    columns: ["content_type", "content_id", "action_type", "reason", "created_at"],
    access: "write",
    category: "Moderasyon"
  },

  // Finansal
  {
    name: "coin_balances",
    description: "Kullanıcı coin bakiyeleri",
    columns: ["user_id", "balance", "lifetime_earned", "lifetime_spent"],
    access: "write",
    category: "Finansal"
  },
  {
    name: "coin_transactions",
    description: "Coin işlem geçmişi",
    columns: ["user_id", "type", "amount", "balance_after", "description", "created_at"],
    access: "write",
    category: "Finansal"
  },

  // Mesajlaşma
  {
    name: "conversations",
    description: "Sohbet kayıtları",
    columns: ["id", "participant_ids", "last_message_at", "created_at"],
    access: "read",
    category: "Mesajlaşma"
  },
  {
    name: "messages",
    description: "Mesaj içerikleri",
    columns: ["conversation_id", "sender_id", "content", "is_read", "created_at"],
    access: "read",
    category: "Mesajlaşma"
  },

  // Creator
  {
    name: "creator_subscriptions",
    description: "Creator abonelikleri",
    columns: ["creator_id", "subscriber_id", "tier_id", "status", "started_at", "expires_at"],
    access: "read",
    category: "Creator"
  },
  {
    name: "creator_subscription_tiers",
    description: "Abonelik paketleri",
    columns: ["creator_id", "name", "coin_price_monthly", "benefits"],
    access: "read",
    category: "Creator"
  },

  // Güvenlik
  {
    name: "security_logs",
    description: "Güvenlik olayları (login, shadow mode, screenshot)",
    columns: ["user_id", "type", "description", "ip_address", "created_at"],
    access: "read",
    category: "Güvenlik"
  },
  {
    name: "screenshot_logs",
    description: "Ekran görüntüsü logları",
    columns: ["user_id", "action_taken", "device_info", "created_at"],
    access: "read",
    category: "Güvenlik"
  }
];

export function DatabaseSection() {
  const readTables = DATABASE_TABLES.filter((t) => t.access === "read");
  const writeTables = DATABASE_TABLES.filter((t) => t.access === "write");
  const categories = [...new Set(DATABASE_TABLES.map((t) => t.category))];

  // Kategoriye göre grupla
  const groupedTables = categories.reduce(
    (acc, cat) => {
      acc[cat] = DATABASE_TABLES.filter((t) => t.category === cat);
      return acc;
    },
    {} as Record<string, TableInfo[]>
  );

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Veritabanı Erişimi
          </CardTitle>
          <CardDescription>
            AI tool&apos;larının erişebildiği veritabanı tabloları ve alanları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{DATABASE_TABLES.length}</div>
              <div className="text-xs text-muted-foreground">Toplam Tablo</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-500">{readTables.length}</div>
              <div className="text-xs text-muted-foreground">Sadece Okuma</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-500">{writeTables.length}</div>
              <div className="text-xs text-muted-foreground">Okuma + Yazma</div>
            </div>
            <div className="p-4 bg-muted rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-500">{categories.length}</div>
              <div className="text-xs text-muted-foreground">Kategori</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables by Category */}
      {Object.entries(groupedTables).map(([category, tables]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Table className="h-5 w-5" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tables.map((table) => (
                <div
                  key={table.name}
                  className={`p-4 rounded-lg border space-y-2 ${
                    table.access === "write"
                      ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{table.name}</span>
                      <Badge
                        variant={table.access === "write" ? "default" : "outline"}
                        className={`text-xs ${table.access === "write" ? "bg-orange-500" : ""}`}
                      >
                        {table.access === "write" ? (
                          <>
                            <Pencil className="h-3 w-3 mr-1" />
                            read/write
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            read
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {table.columns.map((col) => (
                      <Badge key={col} variant="secondary" className="text-xs font-mono">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Security Note */}
      <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-800 dark:text-orange-200">Güvenlik Notu</h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Hassas veriler (şifreler, tam email adresleri, telefon numaraları) AI tool&apos;ları
                tarafından maskelenerek gösterilir. Yazma erişimi olan tablolar turuncu ile
                işaretlenmiştir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
