import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MessageSquare, Radio, Users, Ghost, Flag, Clock, FileText } from "lucide-react";
import Link from "next/link";

export default async function MessagingPage() {
  const supabase = await createServerSupabaseClient();

  // DM İstatistikleri
  const { count: totalConversations } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true });

  const { count: totalMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true });

  // Broadcast İstatistikleri
  const { count: totalChannels } = await supabase
    .from("broadcast_channels")
    .select("*", { count: "exact", head: true });

  const { count: totalBroadcastMessages } = await supabase
    .from("broadcast_messages")
    .select("*", { count: "exact", head: true });

  // Shadow Mesajlar
  const { count: shadowMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("is_shadow", true);

  // Flagged Mesajlar
  const { count: flaggedMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("is_flagged", true);

  // Son 24 saat mesaj sayısı
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentMessages } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yesterday);

  const stats = [
    {
      title: "Toplam Sohbet",
      value: totalConversations || 0,
      description: "Kullanıcı sohbetleri",
      icon: MessageSquare,
      href: "/ops/messaging/conversations"
    },
    {
      title: "Toplam Mesaj",
      value: totalMessages || 0,
      description: "DM mesajları",
      icon: MessageSquare,
      href: "/ops/messaging/conversations"
    },
    {
      title: "Broadcast Kanalları",
      value: totalChannels || 0,
      description: "Creator kanalları",
      icon: Radio,
      href: "/ops/messaging/broadcast"
    },
    {
      title: "Yayın Mesajları",
      value: totalBroadcastMessages || 0,
      description: "Broadcast mesajları",
      icon: Radio,
      href: "/ops/messaging/broadcast"
    },
    {
      title: "Shadow Mesajlar",
      value: shadowMessages || 0,
      description: "Gizli mod mesajları",
      icon: Ghost,
      href: "/ops/messaging/conversations"
    },
    {
      title: "Flagged Mesajlar",
      value: flaggedMessages || 0,
      description: "İşaretli mesajlar",
      icon: Flag,
      href: "/ops/messaging/conversations"
    }
  ];

  const quickActions = [
    {
      title: "DM Sohbetleri",
      description: "Kullanıcı mesajlaşmalarını görüntüle ve yönet",
      href: "/ops/messaging/conversations",
      icon: MessageSquare
    },
    {
      title: "Broadcast Kanalları",
      description: "Creator yayın kanallarını görüntüle",
      href: "/ops/messaging/broadcast",
      icon: Radio
    },
    {
      title: "Kullanıcı Olarak Mesaj",
      description: "Kullanıcı adına mesaj gönder (Impersonation)",
      href: "/ops/messaging/impersonate",
      icon: Users
    },
    {
      title: "Impersonation Logları",
      description: "Kullanıcı adına yapılan işlemleri görüntüle",
      href: "/ops/messaging/impersonate/logs",
      icon: FileText
    },
    {
      title: "Admin Chat",
      description: "Diğer admin'lerle mesajlaş",
      href: "/ops/admin-chat",
      icon: Users
    }
  ];

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mesajlaşma Yönetimi</h1>
        <p className="text-muted-foreground">
          Kullanıcı mesajlaşmalarını ve broadcast kanallarını yönetin
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Son 24 Saat
          </CardTitle>
          <CardDescription>Son 24 saatteki mesajlaşma aktivitesi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{(recentMessages || 0).toLocaleString()}</div>
          <p className="text-sm text-muted-foreground mt-1">yeni mesaj gönderildi</p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Hızlı Erişim</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-sm">{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
