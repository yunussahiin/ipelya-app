"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  FileText,
  BarChart3,
  Shield,
  Database,
  Activity,
  Ban,
  UserCheck,
  Flag,
  EyeOff,
  Trash2,
  Bell,
  Coins,
  Wallet,
  MessageSquare,
  MessagesSquare,
  Star,
  Lock,
  CheckCircle,
  XCircle,
  PlusCircle,
  LayoutDashboard,
  BadgeCheck
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
  example: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  dangerous?: boolean;
}

interface ToolCategory {
  name: string;
  description: string;
  tools: Tool[];
}

const TOOL_CATEGORIES: ToolCategory[] = [
  {
    name: "👥 Kullanıcı Yönetimi",
    description: "Kullanıcı bilgilerini sorgula ve yönet",
    tools: [
      {
        id: "lookupUser",
        name: "Kullanıcı Detayı",
        description: "ID, email veya username ile kullanıcı bilgilerini getir",
        example: '"yunussahin38 kullanıcısını bul"',
        icon: Users,
        enabled: true
      },
      {
        id: "searchUsers",
        name: "Kullanıcı Ara/Listele",
        description: "Kullanıcıları ara veya tümünü listele. Rol filtresi destekler.",
        example: '"Tüm creator\'ları listele"',
        icon: Search,
        enabled: true
      },
      {
        id: "getUserActivity",
        name: "Aktivite Geçmişi",
        description: "Kullanıcının post, beğeni, mesaj aktivitelerini göster",
        example: '"X\'in bu haftaki aktivitesi"',
        icon: Activity,
        enabled: true
      },
      {
        id: "banUser",
        name: "Kullanıcı Banla",
        description: "Kullanıcıyı belirli süre veya kalıcı olarak banla",
        example: '"X\'i 7 gün banla, spam nedeniyle"',
        icon: Ban,
        enabled: true,
        dangerous: true
      },
      {
        id: "unbanUser",
        name: "Ban Kaldır",
        description: "Kullanıcının banını kaldır",
        example: '"X\'in banını kaldır"',
        icon: UserCheck,
        enabled: true
      },
      {
        id: "verifyUser",
        name: "Kullanıcı Doğrula",
        description: "Kullanıcıya mavi tik ekle veya kaldır",
        example: '"X\'i doğrula" veya "X\'e mavi tik ekle"',
        icon: BadgeCheck,
        enabled: true
      }
    ]
  },
  {
    name: "📝 İçerik Yönetimi",
    description: "Post ve içerikleri yönet",
    tools: [
      {
        id: "getRecentPosts",
        name: "Son Postlar",
        description: "Son paylaşılan postları listele",
        example: '"Son 20 postu göster"',
        icon: FileText,
        enabled: true
      },
      {
        id: "getPostDetails",
        name: "Post Detayları",
        description: "Belirli bir postun tüm detaylarını getir",
        example: '"X postunun detayları"',
        icon: Database,
        enabled: true
      },
      {
        id: "hidePost",
        name: "Post Gizle",
        description: "Postu kullanıcılardan gizle (silinmez)",
        example: '"X postunu gizle"',
        icon: EyeOff,
        enabled: true,
        dangerous: true
      },
      {
        id: "deletePost",
        name: "Post Sil",
        description: "Postu sil ve kullanıcıya bildirim gönder",
        example: '"X postunu sil, uygunsuz içerik"',
        icon: Trash2,
        enabled: true,
        dangerous: true
      },
      {
        id: "approvePost",
        name: "Post Onayla",
        description: "Bekleyen postu onayla ve yayınla",
        example: '"X postunu onayla"',
        icon: CheckCircle,
        enabled: true
      },
      {
        id: "rejectPost",
        name: "Post Reddet",
        description: "Postu reddet ve kullanıcıyı bilgilendir",
        example: '"X postunu reddet, spam içeriyor"',
        icon: XCircle,
        enabled: true,
        dangerous: true
      }
    ]
  },
  {
    name: "🛡️ Moderasyon",
    description: "İçerik moderasyonu ve raporlar",
    tools: [
      {
        id: "getModerationQueue",
        name: "Moderasyon Kuyruğu",
        description: "Bekleyen moderasyon işlemlerini listele",
        example: '"Bekleyen moderasyonları göster"',
        icon: Shield,
        enabled: true
      },
      {
        id: "getContentReports",
        name: "İçerik Raporları",
        description: "Kullanıcılar tarafından bildirilen içerikleri listele",
        example: '"Spam raporlarını göster"',
        icon: Flag,
        enabled: true
      }
    ]
  },
  {
    name: "📊 Sistem & Analitik",
    description: "Platform istatistikleri ve sistem durumu",
    tools: [
      {
        id: "getSystemStats",
        name: "Sistem İstatistikleri",
        description: "Kullanıcı, post, mesaj sayıları ve trendler",
        example: '"Bu haftanın istatistikleri"',
        icon: BarChart3,
        enabled: true
      },
      {
        id: "getDashboardSummary",
        name: "Dashboard Özeti",
        description: "Günlük özet: yeni kullanıcılar, postlar, moderasyon, gelir",
        example: '"Günlük özet ver" veya "Dashboard göster"',
        icon: LayoutDashboard,
        enabled: true
      }
    ]
  },
  {
    name: "🔔 Bildirimler",
    description: "Kullanıcılara bildirim gönder",
    tools: [
      {
        id: "sendNotification",
        name: "Bildirim Gönder",
        description: "Kullanıcıya push bildirim gönder",
        example: '"X\'e uyarı bildirimi gönder"',
        icon: Bell,
        enabled: true
      }
    ]
  },
  {
    name: "💰 Finansal",
    description: "Coin işlemleri ve bakiye yönetimi",
    tools: [
      {
        id: "getUserTransactions",
        name: "Coin İşlemleri",
        description: "Kullanıcının satın alma, harcama, kazanç işlemleri",
        example: '"X\'in bu ayki işlemleri"',
        icon: Coins,
        enabled: true
      },
      {
        id: "getUserBalance",
        name: "Coin Bakiyesi",
        description: "Kullanıcının mevcut coin bakiyesi",
        example: '"X\'in bakiyesi ne kadar?"',
        icon: Wallet,
        enabled: true
      },
      {
        id: "adjustCoinBalance",
        name: "Coin Ekle/Çıkar",
        description: "Kullanıcının bakiyesine coin ekle veya çıkar",
        example: '"X\'e 100 coin ekle, hediye"',
        icon: PlusCircle,
        enabled: true,
        dangerous: true
      }
    ]
  },
  {
    name: "💬 Mesajlaşma",
    description: "Sohbet ve mesaj izleme",
    tools: [
      {
        id: "getConversations",
        name: "Sohbet Listesi",
        description: "Tüm sohbetleri veya belirli kullanıcının sohbetlerini listele",
        example: '"X\'in sohbetlerini göster"',
        icon: MessagesSquare,
        enabled: true
      },
      {
        id: "getMessages",
        name: "Mesajları Getir",
        description: "Bir sohbetin mesajlarını getir",
        example: '"X sohbetinin mesajları"',
        icon: MessageSquare,
        enabled: true
      }
    ]
  },
  {
    name: "⭐ Creator",
    description: "Creator istatistikleri ve yönetimi",
    tools: [
      {
        id: "getCreatorStats",
        name: "Creator İstatistikleri",
        description: "Abone sayısı, kazanç, engagement metrikleri",
        example: '"Creator X\'in istatistikleri"',
        icon: Star,
        enabled: true
      }
    ]
  },
  {
    name: "🔒 Güvenlik",
    description: "Güvenlik logları ve izleme",
    tools: [
      {
        id: "getSecurityLogs",
        name: "Güvenlik Logları",
        description: "Shadow mode, screenshot ve güvenlik olayları",
        example: '"X\'in güvenlik logları"',
        icon: Lock,
        enabled: true
      }
    ]
  }
];

export function ToolsSection() {
  const totalTools = TOOL_CATEGORIES.reduce((sum, cat) => sum + cat.tools.length, 0);
  const dangerousTools = TOOL_CATEGORIES.reduce(
    (sum, cat) => sum + cat.tools.filter((t) => t.dangerous).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Özet Kart */}
      <Card>
        <CardHeader>
          <CardTitle>AI Tool&apos;ları</CardTitle>
          <CardDescription>
            AI asistanın veritabanı sorguları ve yönetim işlemleri için kullanabileceği
            tool&apos;lar. Chat&apos;te @ yazarak tool seçebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {totalTools}
              </Badge>
              <span className="text-sm text-muted-foreground">Toplam Tool</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {dangerousTools}
              </Badge>
              <span className="text-sm text-muted-foreground">Dikkatli Kullan</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kategori Kartları */}
      {TOOL_CATEGORIES.map((category) => (
        <Card key={category.name}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{category.name}</CardTitle>
            <CardDescription>{category.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {category.tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.id}
                    className={`flex items-start justify-between p-4 rounded-lg border ${
                      tool.dangerous ? "bg-destructive/5 border-destructive/20" : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 rounded-md ${
                          tool.dangerous ? "bg-destructive/10" : "bg-primary/10"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            tool.dangerous ? "text-destructive" : "text-primary"
                          }`}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{tool.name}</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {tool.id}
                          </Badge>
                          {tool.dangerous && (
                            <Badge variant="destructive" className="text-xs">
                              Dikkat
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                        <p className="text-xs text-muted-foreground/70 italic">
                          Örnek: {tool.example}
                        </p>
                      </div>
                    </div>
                    <Switch checked={tool.enabled} disabled />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Bilgi Kartı */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium">💡 İpucu: @ ile Tool Seçimi</p>
            <p className="text-sm text-muted-foreground">
              Chat input&apos;ta <code className="bg-muted px-1 rounded">Shift + /</code> yazarak
              tool listesini açabilir ve direkt tool çalıştırabilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Tool izinleri şu anda tüm admin kullanıcılar için aktiftir. Kırmızı işaretli
            tool&apos;lar dikkatli kullanılmalıdır.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
