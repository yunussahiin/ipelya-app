/**
 * Feed Yönetimi - Overview Sayfası
 *
 * Amaç: Home Feed sisteminin genel durumunu gösterir
 *
 * Özellikler:
 * - Feed istatistikleri (toplam post, engagement, vb.)
 * - Algoritma durumu
 * - Moderation queue özeti
 * - Hızlı erişim linkleri
 *
 * Caching:
 * - revalidate: 60 saniye (1 dakika)
 */

import {
  IconActivity,
  IconChartBar,
  IconFilter,
  IconMessageCircle,
  IconPhoto,
  IconSettings,
  IconShield,
  IconThumbUp,
  IconUsers
} from "@tabler/icons-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 60 saniyede bir revalidate et (sürekli yüklemeyi önle)
export const revalidate = 60;

export default async function FeedOverviewPage() {
  const supabase = await createServerSupabaseClient();

  // Feed istatistikleri
  const { count: totalPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  const { count: totalMiniPosts } = await supabase
    .from("mini_posts")
    .select("*", { count: "exact", head: true });

  const { count: totalPolls } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true });

  const { count: totalVoiceMoments } = await supabase
    .from("voice_moments")
    .select("*", { count: "exact", head: true });

  // Moderation queue
  const { count: pendingModeration } = await supabase
    .from("moderation_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Bugünkü etkileşimler
  const today = new Date().toISOString().split("T")[0];
  const { count: todayLikes } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  const { count: todayComments } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  // Aktif algoritma config
  const { data: activeConfig } = await supabase
    .from("algorithm_configs")
    .select("*")
    .eq("is_active", true)
    .eq("config_type", "weights")
    .single();

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feed Yönetimi</h1>
          <p className="text-muted-foreground">Home Feed sistemini yönetin ve izleyin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Post</CardTitle>
            <IconPhoto className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">+{totalMiniPosts || 0} mini post</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Etkileşim</CardTitle>
            <IconThumbUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(todayLikes || 0) + (todayComments || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {todayLikes || 0} beğeni, {todayComments || 0} yorum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anket & Ses</CardTitle>
            <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalPolls || 0) + (totalVoiceMoments || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {totalPolls || 0} anket, {totalVoiceMoments || 0} ses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderasyon Bekleyen</CardTitle>
            <IconShield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingModeration || 0}</div>
            <p className="text-xs text-muted-foreground">İnceleme bekliyor</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Algoritma Yönetimi */}
        <Link href="/ops/feed/algorithm">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                  <IconFilter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Algoritma Yönetimi</CardTitle>
                  <CardDescription>Scoring weights, vibe/intent matrix, diversity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {activeConfig ? (
                  <span className="text-green-600 dark:text-green-400">✓ Aktif config mevcut</span>
                ) : (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    ⚠ Config ayarlanmamış
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* İçerik Moderasyonu */}
        <Link href="/ops/feed/moderation">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900">
                  <IconShield className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">İçerik Moderasyonu</CardTitle>
                  <CardDescription>Moderation queue, user reports, bulk actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {(pendingModeration || 0) > 0 ? (
                  <span className="text-orange-600 dark:text-orange-400">
                    {pendingModeration} içerik bekliyor
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">✓ Bekleyen içerik yok</span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Feed Analytics */}
        <Link href="/ops/feed/analytics">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
                  <IconChartBar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Feed Analytics</CardTitle>
                  <CardDescription>
                    Engagement, content performance, algorithm metrics
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Günlük raporlar ve trendler</div>
            </CardContent>
          </Card>
        </Link>

        {/* A/B Testing */}
        <Link href="/ops/feed/experiments">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                  <IconActivity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">A/B Testing</CardTitle>
                  <CardDescription>Algoritma deneyleri ve sonuçları</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Experiment management</div>
            </CardContent>
          </Card>
        </Link>

        {/* Live Stats */}
        <Link href="/ops/feed/live">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900">
                  <IconUsers className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Canlı İstatistikler</CardTitle>
                  <CardDescription>Real-time feed activity ve kullanıcılar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Anlık izleme</div>
            </CardContent>
          </Card>
        </Link>

        {/* Settings */}
        <Link href="/ops/feed/algorithm/weights">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                  <IconSettings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Hızlı Ayarlar</CardTitle>
                  <CardDescription>Scoring weights'i hızlıca düzenle</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Weights, vibe, intent, diversity</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Algorithm Status */}
      {activeConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Aktif Algoritma Konfigürasyonu</CardTitle>
            <CardDescription>Şu anda kullanılan scoring weights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {Object.entries(activeConfig.config_data as Record<string, number>).map(
                ([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm font-medium capitalize">{key}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(value * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
