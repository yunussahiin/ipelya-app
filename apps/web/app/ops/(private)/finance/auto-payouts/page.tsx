import { Suspense } from "react";
import { Settings, Users, BarChart3, Check, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCoin, formatTL } from "@/components/ops/finance";

// ─────────────────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────────────────

async function getAutoPayoutsData() {
  const supabase = await createServerSupabaseClient();

  // Auto-payout ayarları olan creator'lar
  const { data: settings } = await supabase
    .from("auto_payout_settings")
    .select(
      `
      *,
      payment_methods (
        id,
        type,
        bank_name,
        crypto_network,
        status
      )
    `
    )
    .eq("is_enabled", true);

  // Creator profilleri
  const creatorIds = settings?.map((s) => s.creator_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", creatorIds)
    .eq("type", "real");

  const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

  // Son auto-generated talepler
  const { data: recentAutoPayouts } = await supabase
    .from("payout_requests")
    .select("creator_id, created_at, status")
    .eq("is_auto_created", true)
    .order("created_at", { ascending: false })
    .limit(50);

  const lastAutoPayoutMap = new Map<string, { date: string; status: string }>();
  recentAutoPayouts?.forEach((p) => {
    if (!lastAutoPayoutMap.has(p.creator_id)) {
      lastAutoPayoutMap.set(p.creator_id, { date: p.created_at, status: p.status });
    }
  });

  const enrichedSettings = settings?.map((s) => ({
    ...s,
    creator: profileMap.get(s.creator_id),
    lastAutoPayout: lastAutoPayoutMap.get(s.creator_id),
    hasPaymentMethodIssue: s.payment_methods?.status !== "approved"
  }));

  // İstatistikler - son 4 hafta
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const { data: autoPayoutStats } = await supabase
    .from("payout_requests")
    .select("created_at, status, tl_amount")
    .eq("is_auto_created", true)
    .gte("created_at", fourWeeksAgo.toISOString());

  // Haftalık grupla
  const weeklyStats: Record<string, { count: number; amount: number; success: number }> = {};

  autoPayoutStats?.forEach((p) => {
    const date = new Date(p.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = { count: 0, amount: 0, success: 0 };
    }

    weeklyStats[weekKey].count++;
    weeklyStats[weekKey].amount += Number(p.tl_amount || 0);
    if (p.status === "paid") {
      weeklyStats[weekKey].success++;
    }
  });

  const weeklyData = Object.entries(weeklyStats)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 4)
    .map(([week, stats]) => ({
      week: new Date(week).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
      ...stats,
      successRate: stats.count > 0 ? Math.round((stats.success / stats.count) * 100) : 0
    }));

  return {
    settings: enrichedSettings || [],
    weeklyStats: weeklyData,
    activeCount: enrichedSettings?.filter((s) => !s.hasPaymentMethodIssue).length || 0,
    issueCount: enrichedSettings?.filter((s) => s.hasPaymentMethodIssue).length || 0
  };
}

// ─────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────

function StatusIcon({ hasIssue }: { hasIssue: boolean }) {
  if (hasIssue) {
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }
  return <Check className="h-4 w-4 text-green-500" />;
}

async function AutoPayoutsContent() {
  const { settings, weeklyStats, activeCount, issueCount } = await getAutoPayoutsData();

  // Varsayılan sistem ayarları (gerçek sistemde settings tablosundan gelir)
  const now = Date.now();
  const systemSettings = {
    enabled: true,
    dayOfWeek: "Pazartesi",
    timeOfDay: "10:00",
    lastRun: new Date(now).toISOString(),
    nextRun: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  return (
    <div className="space-y-6">
      {/* Sistem Ayarları */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistem Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Otomatik Ödeme Sistemi</p>
              <p className="text-sm text-muted-foreground">
                Haftalık otomatik ödeme taleplerini etkinleştir
              </p>
            </div>
            <Switch checked={systemSettings.enabled} disabled />
          </div>

          <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Çalışma Günü</p>
              <p className="font-medium">{systemSettings.dayOfWeek}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Çalışma Saati</p>
              <p className="font-medium">{systemSettings.timeOfDay}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Son Çalışma</p>
              <p className="font-medium">
                {new Date(systemSettings.lastRun).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sonraki Çalışma</p>
              <p className="font-medium">
                {new Date(systemSettings.nextRun).toLocaleDateString("tr-TR")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Payout Creator'lar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Auto-Payout Aktif Creator&apos;lar
              </CardTitle>
              <CardDescription>
                {activeCount} aktif, {issueCount} sorunlu
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settings.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Min Tutar</TableHead>
                    <TableHead>Ödeme Yöntemi</TableHead>
                    <TableHead>Son Oto-Talep</TableHead>
                    <TableHead className="text-center">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.map((s) => (
                    <TableRow key={s.creator_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={s.creator?.avatar_url || undefined} />
                            <AvatarFallback>
                              {s.creator?.username?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">@{s.creator?.username || "unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        🪙 {formatCoin(s.minimum_coin_amount)}
                      </TableCell>
                      <TableCell>
                        {s.payment_methods?.type === "bank" ? (
                          <span>🏦 {s.payment_methods.bank_name}</span>
                        ) : (
                          <span>💎 {s.payment_methods?.crypto_network}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.lastAutoPayout
                          ? new Date(s.lastAutoPayout.date).toLocaleDateString("tr-TR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusIcon hasIssue={s.hasPaymentMethodIssue} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" /> Aktif
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-yellow-500" /> Ödeme yöntemi sorunu
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Henüz auto-payout aktif eden creator yok</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Son 4 Hafta İstatistikleri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Son 4 Hafta İstatistikleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hafta</TableHead>
                  <TableHead className="text-right">Talep Sayısı</TableHead>
                  <TableHead className="text-right">Toplam Tutar</TableHead>
                  <TableHead className="text-right">Başarı Oranı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyStats.map((stat, i) => (
                  <TableRow key={i}>
                    <TableCell>{stat.week}</TableCell>
                    <TableCell className="text-right">{stat.count}</TableCell>
                    <TableCell className="text-right">{formatTL(stat.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={stat.successRate >= 90 ? "default" : "secondary"}>
                        %{stat.successRate}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Henüz otomatik ödeme verisi yok</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AutoPayoutsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function AutoPayoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Otomatik Ödemeler</h1>
        <p className="text-muted-foreground">Haftalık otomatik ödeme sistemi yönetimi</p>
      </div>

      <Suspense fallback={<AutoPayoutsSkeleton />}>
        <AutoPayoutsContent />
      </Suspense>
    </div>
  );
}
