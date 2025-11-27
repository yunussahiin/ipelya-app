/**
 * Algoritma Yönetimi - Overview Sayfası
 *
 * Amaç: Feed algoritması ayarlarına genel bakış sağlar
 *
 * Özellikler:
 * - Scoring weights özeti ve durumu
 * - Vibe matrix özeti
 * - Intent matrix özeti
 * - Diversity settings özeti
 * - Her config için hızlı erişim kartları
 *
 * Database:
 * - algorithm_configs tablosu (config_type: weights, vibe, intent, diversity)
 */

import { IconChartPie, IconHeart, IconScale, IconTarget } from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AlgorithmOverviewPage() {
  const supabase = await createServerSupabaseClient();

  // Tüm aktif configleri getir
  const { data: configs } = await supabase
    .from("algorithm_configs")
    .select("*")
    .eq("is_active", true);

  // Config type'a göre ayır
  const weightsConfig = configs?.find((c) => c.config_type === "weights");
  const vibeConfig = configs?.find((c) => c.config_type === "vibe");
  const intentConfig = configs?.find((c) => c.config_type === "intent");
  const diversityConfig = configs?.find((c) => c.config_type === "diversity");

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Algoritma Yönetimi</h1>
          <p className="text-muted-foreground">Feed algoritması parametrelerini yapılandırın</p>
        </div>
      </div>

      {/* Config Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scoring Weights Card */}
        <AlgorithmConfigCard
          href="/ops/feed/algorithm/weights"
          icon={<IconScale className="h-5 w-5" />}
          iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
          iconClass="text-blue-600 dark:text-blue-400"
          title="Scoring Weights"
          description="Base, vibe, intent, social graph ağırlıkları"
          config={weightsConfig}
          renderContent={(data) => (
            <div className="space-y-2">
              {Object.entries(data as Record<string, number>).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="font-medium">{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}
        />

        {/* Vibe Matrix Card */}
        <AlgorithmConfigCard
          href="/ops/feed/algorithm/vibe"
          icon={<IconHeart className="h-5 w-5" />}
          iconBgClass="bg-pink-500/10 dark:bg-pink-500/20"
          iconClass="text-pink-600 dark:text-pink-400"
          title="Vibe Matrix"
          description="Mood uyumluluk matrisi (5x5)"
          config={vibeConfig}
          renderContent={() => (
            <div className="flex flex-wrap gap-1">
              {["energetic", "chill", "social", "creative", "adventurous"].map((vibe) => (
                <Badge key={vibe} variant="secondary" className="text-xs">
                  {vibe}
                </Badge>
              ))}
            </div>
          )}
        />

        {/* Intent Matrix Card */}
        <AlgorithmConfigCard
          href="/ops/feed/algorithm/intent"
          icon={<IconTarget className="h-5 w-5" />}
          iconBgClass="bg-purple-500/10 dark:bg-purple-500/20"
          iconClass="text-purple-600 dark:text-purple-400"
          title="Intent Matrix"
          description="Intent-content type eşleştirme matrisi"
          config={intentConfig}
          renderContent={() => (
            <div className="flex flex-wrap gap-1">
              {["meet_new", "activity_partner", "flirt", "serious"].map((intent) => (
                <Badge key={intent} variant="secondary" className="text-xs">
                  {intent.replace("_", " ")}
                </Badge>
              ))}
            </div>
          )}
        />

        {/* Diversity Settings Card */}
        <AlgorithmConfigCard
          href="/ops/feed/algorithm/diversity"
          icon={<IconChartPie className="h-5 w-5" />}
          iconBgClass="bg-green-500/10 dark:bg-green-500/20"
          iconClass="text-green-600 dark:text-green-400"
          title="Diversity Settings"
          description="İçerik türü dağılım ayarları"
          config={diversityConfig}
          renderContent={(data) => (
            <div className="space-y-2">
              {Object.entries(data as Record<string, number>).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{key.replace("_", " ")}</span>
                  <span className="font-medium">{value}/20</span>
                </div>
              ))}
            </div>
          )}
        />
      </div>

      {/* Info Card */}
      <Card className="border-border bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Algoritma Nasıl Çalışır?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p className="mb-3">
            Feed algoritması her içerik için bir <strong>relevance score</strong> hesaplar:
          </p>
          <code className="block rounded bg-muted p-3 text-xs">
            final_score = base × base_weight + vibe_match × vibe_weight + intent_match ×
            intent_weight + social × social_weight
          </code>
          <p className="mt-3">
            Diversity settings, her 20 içerikte maksimum kaç adet hangi türden içerik
            gösterileceğini belirler.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * AlgorithmConfigCard Component
 *
 * Amaç: Algoritma config kartı - reusable component
 *
 * Props:
 * - href: Link URL
 * - icon: React node (icon)
 * - iconBgClass: Icon background class
 * - iconClass: Icon color class
 * - title: Kart başlığı
 * - description: Kart açıklaması
 * - config: Database'den gelen config objesi
 * - renderContent: Config data'yı render eden fonksiyon
 */
interface AlgorithmConfigCardProps {
  href: string;
  icon: React.ReactNode;
  iconBgClass: string;
  iconClass: string;
  title: string;
  description: string;
  config: { config_data: unknown } | null | undefined;
  renderContent: (data: unknown) => React.ReactNode;
}

function AlgorithmConfigCard({
  href,
  icon,
  iconBgClass,
  iconClass,
  title,
  description,
  config,
  renderContent
}: AlgorithmConfigCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${iconBgClass}`}>
              <span className={iconClass}>{icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{title}</CardTitle>
                {config ? (
                  <Badge
                    variant="outline"
                    className="border-green-500/50 text-green-600 dark:text-green-400"
                  >
                    Aktif
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400"
                  >
                    Ayarlanmamış
                  </Badge>
                )}
              </div>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {config ? (
            renderContent(config.config_data)
          ) : (
            <p className="text-sm text-muted-foreground">Yapılandırmak için tıklayın</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
