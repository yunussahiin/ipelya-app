/**
 * Feed Analytics Sayfası
 *
 * Amaç: Feed performans metriklerini gösterir
 *
 * Özellikler:
 * - Engagement metrikleri (likes, comments)
 * - Content performance
 * - Trend analizi
 *
 * Database:
 * - posts, mini_posts, polls, voice_moments
 * - post_likes, post_comments
 */

import {
  IconChartBar,
  IconMessageCircle,
  IconPhoto,
  IconThumbUp,
  IconTrendingUp
} from "@tabler/icons-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// 5 dakikada bir revalidate
export const revalidate = 300;

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();

  // Bugünün tarihi
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // 7 gün önce
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  // Toplam içerik sayıları
  const { count: totalPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  const { count: totalMiniPosts } = await supabase
    .from("mini_posts")
    .select("*", { count: "exact", head: true });

  const { count: totalPolls } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true });

  // Bugünkü etkileşimler
  const { count: todayLikes } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStr);

  const { count: todayComments } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStr);

  // Haftalık etkileşimler
  const { count: weeklyLikes } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgoStr);

  const { count: weeklyComments } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgoStr);

  // Bu hafta oluşturulan içerikler
  const { count: weeklyPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgoStr);

  // Toplam etkileşimler
  const { count: totalLikes } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true });

  const { count: totalComments } = await supabase
    .from("post_comments")
    .select("*", { count: "exact", head: true });

  // Engagement rate hesapla
  const totalContent = (totalPosts || 0) + (totalMiniPosts || 0);
  const totalEngagement = (totalLikes || 0) + (totalComments || 0);
  const engagementRate =
    totalContent > 0 ? ((totalEngagement / totalContent) * 100).toFixed(1) : "0";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feed Analytics</h1>
          <p className="text-muted-foreground">
            Feed performansını ve kullanıcı etkileşimlerini analiz edin
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İçerik</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {totalPosts || 0} post, {totalMiniPosts || 0} mini post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Beğeni</CardTitle>
            <IconThumbUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes || 0}</div>
            <p className="text-xs text-muted-foreground">+{todayLikes || 0} bugün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Yorum</CardTitle>
            <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComments || 0}</div>
            <p className="text-xs text-muted-foreground">+{todayComments || 0} bugün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementRate}%</div>
            <p className="text-xs text-muted-foreground">İçerik başına etkileşim</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Haftalık Özet</CardTitle>
            <CardDescription>Son 7 günün istatistikleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconPhoto className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Yeni Postlar</span>
                </div>
                <span className="font-medium">{weeklyPosts || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconThumbUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Beğeniler</span>
                </div>
                <span className="font-medium">{weeklyLikes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Yorumlar</span>
                </div>
                <span className="font-medium">{weeklyComments || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İçerik Dağılımı</CardTitle>
            <CardDescription>İçerik türlerine göre dağılım</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Posts</span>
                  <span className="font-medium">{totalPosts || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${totalContent > 0 ? ((totalPosts || 0) / totalContent) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Mini Posts (Vibes)</span>
                  <span className="font-medium">{totalMiniPosts || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-pink-500"
                    style={{
                      width: `${totalContent > 0 ? ((totalMiniPosts || 0) / totalContent) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Anketler</span>
                  <span className="font-medium">{totalPolls || 0}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-purple-500"
                    style={{
                      width: `${totalContent + (totalPolls || 0) > 0 ? ((totalPolls || 0) / (totalContent + (totalPolls || 0))) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="border-border bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            📊 Analytics verileri 5 dakikada bir güncellenir. Daha detaylı analizler için algoritma
            yönetimi sayfasını ziyaret edin.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
