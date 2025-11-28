/**
 * Diversity Settings Page
 *
 * Content type distribution settings for feed diversity
 * - Per-20-items distribution
 * - Slider controls for each content type
 * - Save to algorithm_configs table
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { IconChartPie, IconDeviceFloppy, IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";

// Content types with icons and descriptions
const CONTENT_TYPES = [
  {
    id: "post",
    label: "Post",
    emoji: "📷",
    description: "Fotoğraf ve video paylaşımları",
    color: "bg-blue-500 dark:bg-blue-600"
  },
  {
    id: "mini_post",
    label: "Vibe",
    emoji: "💬",
    description: "Kısa metin paylaşımları",
    color: "bg-purple-500 dark:bg-purple-600"
  },
  {
    id: "poll",
    label: "Anket",
    emoji: "📊",
    description: "Oylama içerikleri",
    color: "bg-green-500 dark:bg-green-600"
  },
  {
    id: "voice_moment",
    label: "Ses",
    emoji: "🎙️",
    description: "Sesli paylaşımlar",
    color: "bg-orange-500 dark:bg-orange-600"
  }
];

// Default distribution (per 20 items)
const DEFAULT_DISTRIBUTION: Record<string, number> = {
  post: 8,
  mini_post: 6,
  poll: 4,
  voice_moment: 2
};

export default function DiversitySettingsPage() {
  const [distribution, setDistribution] = useState<Record<string, number>>(DEFAULT_DISTRIBUTION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const totalItems = Object.values(distribution).reduce((a, b) => a + b, 0);

  // Fetch current config
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ops/feed/algorithm/diversity");
      const data = await response.json();

      if (data.success && data.data?.config) {
        setDistribution(data.data.config);
      }
    } catch (error) {
      console.error("Config fetch error:", error);
      toast.error("Konfigürasyon yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Update value
  const updateValue = (contentId: string, value: number) => {
    setDistribution((prev) => ({
      ...prev,
      [contentId]: value
    }));
    setHasChanges(true);
  };

  // Save config
  const saveConfig = async () => {
    if (totalItems !== 20) {
      toast.error("Toplam 20 item olmalı!");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/ops/feed/algorithm/diversity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: distribution })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Diversity ayarları kaydedildi");
        setHasChanges(false);
      } else {
        toast.error(data.error || "Kaydetme başarısız");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setDistribution(DEFAULT_DISTRIBUTION);
    setHasChanges(true);
    toast.info("Varsayılan değerlere sıfırlandı");
  };

  // Calculate percentage
  const getPercentage = (value: number) => Math.round((value / 20) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diversity Settings</h1>
          <p className="text-muted-foreground">Feed&apos;de içerik türü dağılımını ayarlayın</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Sıfırla
          </Button>
          <Button onClick={saveConfig} disabled={saving || !hasChanges || totalItems !== 20}>
            <IconDeviceFloppy className="mr-2 h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-border bg-muted">
        <CardContent className="flex items-start gap-3 pt-4">
          <IconInfoCircle className="mt-0.5 h-5 w-5 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Diversity Nasıl Çalışır?</p>
            <p className="text-sm text-muted-foreground">
              Her 20 item&apos;de kaç tane hangi içerik türünden gösterileceğini belirler. Toplam
              her zaman 20 olmalıdır. Bu ayar, kullanıcıların monoton bir feed görmemesini sağlar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartPie className="h-5 w-5" />
            İçerik Dağılımı (Her 20 Item)
          </CardTitle>
          <CardDescription>
            Toplam: {totalItems}/20 item
            {totalItems !== 20 && (
              <Badge variant="destructive" className="ml-2">
                {totalItems < 20 ? `${20 - totalItems} eksik` : `${totalItems - 20} fazla`}
              </Badge>
            )}
            {totalItems === 20 && (
              <Badge variant="outline" className="ml-2 border-green-500 text-green-600">
                ✓ Doğru
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {CONTENT_TYPES.map((content) => {
                const value = distribution[content.id] ?? 0;
                const percentage = getPercentage(value);

                return (
                  <div key={content.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{content.emoji}</span>
                        <div>
                          <Label className="text-base font-medium">{content.label}</Label>
                          <p className="text-sm text-muted-foreground">{content.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{value}</div>
                        <div className="text-sm text-muted-foreground">{percentage}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[value]}
                        onValueChange={([v]) => updateValue(content.id, v)}
                        min={0}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                    </div>
                    {/* Visual bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${content.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Görsel Dağılım</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-8 w-full overflow-hidden rounded-lg">
            {CONTENT_TYPES.map((content) => {
              const value = distribution[content.id] ?? 0;
              const percentage = getPercentage(value);

              return (
                <div
                  key={content.id}
                  className={`flex items-center justify-center text-xs font-medium text-white transition-all ${content.color}`}
                  style={{ width: `${percentage}%` }}
                  title={`${content.label}: ${value} (${percentage}%)`}
                >
                  {percentage >= 10 && content.emoji}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {CONTENT_TYPES.map((content) => (
              <div key={content.id} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded ${content.color}`} />
                <span className="text-sm">
                  {content.label} ({distribution[content.id] ?? 0})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
            <CardContent className="flex items-center gap-3 py-3">
              <Badge variant="outline" className="border-orange-500 text-orange-600">
                Kaydedilmemiş Değişiklikler
              </Badge>
              <Button size="sm" onClick={saveConfig} disabled={saving || totalItems !== 20}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
