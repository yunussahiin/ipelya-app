"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Layers, Crown, Star, Sparkles } from "lucide-react";
import Link from "next/link";

export default function TierManagementPage() {
  const [stats, setStats] = React.useState({
    totalBenefits: 0,
    activeBenefits: 0,
    totalTemplates: 0,
    activeTemplates: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const [benefitsRes, templatesRes] = await Promise.all([
          fetch("/api/ops/tier-benefits?activeOnly=false"),
          fetch("/api/ops/tier-templates?activeOnly=false")
        ]);

        const benefitsData = await benefitsRes.json();
        const templatesData = await templatesRes.json();

        if (benefitsData.success && templatesData.success) {
          setStats({
            totalBenefits: benefitsData.total,
            activeBenefits:
              benefitsData.benefits?.filter((b: { is_active: boolean }) => b.is_active).length || 0,
            totalTemplates: templatesData.total,
            activeTemplates:
              templatesData.templates?.filter((t: { is_active: boolean }) => t.is_active).length ||
              0
          });
        }
      } catch (error) {
        console.error("Stats fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tier Yönetimi</h1>
        <p className="text-muted-foreground mt-2">
          Creator abonelik tier&apos;larını, avantajları ve şablonları yönetin
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Benefits Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-600" />
              <CardTitle>Avantajlar</CardTitle>
            </div>
            <CardDescription>
              Tier avantajlarını yönetin (özel içerik, DM erişimi, rozetler vb.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Creator&apos;ların abonelerine sunabileceği standart avantajları tanımlayın.
              Kategorilere göre düzenleyin ve limit ayarları yapın.
            </p>
            <Link href="/ops/tier-management/benefits">
              <Button className="w-full">
                Avantajları Yönet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Templates Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              <CardTitle>Tier Şablonları</CardTitle>
            </div>
            <CardDescription>
              Hazır tier şablonlarını yönetin (Bronze, Silver, Gold, Diamond, VIP)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Creator&apos;ların tier oluştururken kullanacağı şablonları düzenleyin. Önerilen
              fiyatları ve varsayılan avantajları belirleyin.
            </p>
            <Link href="/ops/tier-management/templates">
              <Button className="w-full" variant="outline">
                Şablonları Yönet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Avantaj
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalBenefits}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? "" : `${stats.activeBenefits} aktif`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Şablon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? "" : `${stats.activeTemplates} aktif`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              İçerik Avantajları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">📺</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Özel hikayeler, broadcast, arşiv</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Premium Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">👑</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">VIP tier en yüksek seviye</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Tier Sistemi Nasıl Çalışır?</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Avantajlar</h4>
              <p className="text-sm text-muted-foreground">
                Sistemde tanımlı standart avantajlar. Her avantaj bir kategoriye aittir (İçerik,
                İletişim, Ekstra) ve opsiyonel olarak limit içerebilir.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">2. Şablonlar</h4>
              <p className="text-sm text-muted-foreground">
                Creator&apos;ların tier oluştururken seçeceği hazır şablonlar. Her şablon önerilen
                fiyat ve varsayılan avantajlar içerir.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">3. Creator Tier&apos;ları</h4>
              <p className="text-sm text-muted-foreground">
                Creator şablon seçer, fiyatı kendisi belirler ve avantajları düzenleyebilir.
                Aboneler coin ile satın alır.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
