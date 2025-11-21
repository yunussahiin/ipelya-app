"use client";

import { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { createBrowserClient } from "@supabase/ssr";

interface StatsData {
  revenue: number;
  newUsers: number;
  activeUsers: number;
  activeCreators: number;
}

interface Profile {
  role?: string;
  created_at?: string;
}

export function SectionCards() {
  const [stats, setStats] = useState<StatsData>({
    revenue: 0,
    newUsers: 0,
    activeUsers: 0,
    activeCreators: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Yeni kullanıcılar (son 7 gün)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: newUsersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .gte("created_at", sevenDaysAgo.toISOString());

        // Aktif Kullanıcılar (role = 'user')
        const { count: activeUsersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("role", "user");

        // Aktif Creatorler (role = 'creator')
        const { count: activeCreatorsCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact" })
          .eq("role", "creator");

        setStats({
          revenue: 0, // Placeholder - gelir verisi için ayrı tablo gerekebilir
          newUsers: newUsersCount || 0,
          activeUsers: activeUsersCount || 0,
          activeCreators: activeCreatorsCount || 0
        });
      } catch (error) {
        console.error("İstatistikler yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const newUsersGrowth =
    stats.activeUsers > 0 ? Number(((stats.newUsers / stats.activeUsers) * 100).toFixed(1)) : 0;

  const creatorPercentage =
    stats.activeUsers > 0
      ? Number(((stats.activeCreators / stats.activeUsers) * 100).toFixed(1))
      : 0;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Gelir */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Toplam Gelir</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : `₺${stats.revenue.toLocaleString("tr-TR")}`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Bu ay artış <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Tüm zamanlar toplamı</div>
        </CardFooter>
      </Card>

      {/* Yeni Kullanıcılar */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Yeni Kullanıcılar</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : stats.newUsers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {newUsersGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Son 7 gün <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Yeni kayıtlar</div>
        </CardFooter>
      </Card>

      {/* Aktif Kullanıcılar */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Aktif Kullanıcılar</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : stats.activeUsers.toLocaleString("tr-TR")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Kullanıcı rolü <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Aktif hesaplar</div>
        </CardFooter>
      </Card>

      {/* Aktif Creatorler */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Aktif Creatorler</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading ? "-" : stats.activeCreators.toLocaleString("tr-TR")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {creatorPercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Creator rolü <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">İçerik üreticileri</div>
        </CardFooter>
      </Card>
    </div>
  );
}
