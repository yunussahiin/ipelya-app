/**
 * Intent Matrix Editor
 *
 * 4x4 matrix editor for intent-content type matching
 * - Intent types: meet_new, activity_partner, flirt, serious_relationship
 * - Content types: post, mini_post, poll, voice_moment
 * - Heatmap visualization
 * - Save to algorithm_configs table
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  IconDeviceFloppy,
  IconInfoCircle,
  IconRefresh,
  IconTarget,
  IconUsers
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Intent types
const INTENT_TYPES = [
  {
    id: "meet_new",
    label: "Yeni İnsanlar",
    emoji: "👋",
    description: "Yeni insanlarla tanışmak isteyen kullanıcılar"
  },
  {
    id: "activity_partner",
    label: "Aktivite Partneri",
    emoji: "🎯",
    description: "Aktivite partneri arayan kullanıcılar"
  },
  {
    id: "flirt",
    label: "Flört",
    emoji: "💕",
    description: "Flört etmek isteyen kullanıcılar"
  },
  {
    id: "serious_relationship",
    label: "Ciddi İlişki",
    emoji: "💍",
    description: "Ciddi ilişki arayan kullanıcılar"
  }
];

// Content types
const CONTENT_TYPES = [
  { id: "post", label: "Post", description: "Fotoğraf/video paylaşımları" },
  { id: "mini_post", label: "Vibe", description: "Kısa metin paylaşımları" },
  { id: "poll", label: "Anket", description: "Oylama içerikleri" },
  { id: "voice_moment", label: "Ses", description: "Sesli paylaşımlar" }
];

// Default matrix values
const DEFAULT_MATRIX: Record<string, Record<string, number>> = {
  meet_new: { post: 85, mini_post: 90, poll: 80, voice_moment: 75 },
  activity_partner: { post: 80, mini_post: 75, poll: 95, voice_moment: 70 },
  flirt: { post: 90, mini_post: 85, poll: 70, voice_moment: 80 },
  serious_relationship: { post: 95, mini_post: 70, poll: 65, voice_moment: 85 }
};

// Get color based on value (heatmap)
function getHeatmapColor(value: number): string {
  if (value >= 90) return "bg-purple-500 dark:bg-purple-600";
  if (value >= 80) return "bg-purple-400 dark:bg-purple-500";
  if (value >= 70) return "bg-pink-400 dark:bg-pink-500";
  if (value >= 60) return "bg-pink-500 dark:bg-pink-600";
  if (value >= 50) return "bg-rose-500 dark:bg-rose-600";
  return "bg-red-500 dark:bg-red-600";
}

export default function IntentMatrixPage() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>(DEFAULT_MATRIX);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current config
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ops/feed/algorithm/intent");
      const data = await response.json();

      if (data.success && data.data?.config) {
        setMatrix(data.data.config);
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

  // Update cell value
  const updateCell = (intentId: string, contentId: string, value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    setMatrix((prev) => ({
      ...prev,
      [intentId]: {
        ...prev[intentId],
        [contentId]: clampedValue
      }
    }));
    setHasChanges(true);
  };

  // Save config
  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/ops/feed/algorithm/intent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: matrix })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Intent matrix kaydedildi");
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
    setMatrix(DEFAULT_MATRIX);
    setHasChanges(true);
    toast.info("Varsayılan değerlere sıfırlandı");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intent Matrix</h1>
          <p className="text-muted-foreground">
            Kullanıcı amacına göre içerik türü eşleştirme skorları
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Sıfırla
          </Button>
          <Button onClick={saveConfig} disabled={saving || !hasChanges}>
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
            <p className="text-sm font-medium text-foreground">Intent Matrix Nasıl Çalışır?</p>
            <p className="text-sm text-muted-foreground">
              Her hücre, belirli bir amaca sahip kullanıcıya o içerik türünün ne kadar uygun
              olduğunu belirtir (0-100). Örneğin, &quot;Ciddi İlişki&quot; arayan birine
              &quot;Post&quot; içerikleri daha uygun olabilir çünkü daha detaylı profil gösterimi
              sağlar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTarget className="h-5 w-5" />
            Eşleştirme Matrisi
          </CardTitle>
          <CardDescription>
            Her hücreye 0-100 arası bir değer girin. Yüksek değerler, o içerik türünün o amaca daha
            uygun olduğunu gösterir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <TooltipProvider>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-muted-foreground">
                        Amaç / İçerik
                      </th>
                      {CONTENT_TYPES.map((content) => (
                        <th key={content.id} className="p-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <Badge variant="outline" className="text-xs">
                                  {content.label}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{content.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {INTENT_TYPES.map((intent) => (
                      <tr key={intent.id} className="border-t">
                        <td className="p-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex cursor-help items-center gap-2">
                                <span className="text-lg">{intent.emoji}</span>
                                <span className="text-sm font-medium">{intent.label}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{intent.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        {CONTENT_TYPES.map((content) => {
                          const value = matrix[intent.id]?.[content.id] ?? 50;
                          return (
                            <td key={content.id} className="p-2">
                              <div className="flex flex-col items-center gap-1">
                                <div
                                  className={`h-10 w-16 rounded border ${getHeatmapColor(value)} flex items-center justify-center`}
                                >
                                  <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={value}
                                    onChange={(e) =>
                                      updateCell(
                                        intent.id,
                                        content.id,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="h-full w-full text-center text-sm font-medium bg-transparent border-0 p-0"
                                  />
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>

      {/* Intent Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <IconUsers className="h-4 w-4" />
            Amaç Açıklamaları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {INTENT_TYPES.map((intent) => (
              <div key={intent.id} className="flex items-start gap-3 rounded-lg bg-muted p-3">
                <span className="text-2xl">{intent.emoji}</span>
                <div>
                  <p className="font-medium">{intent.label}</p>
                  <p className="text-sm text-muted-foreground">{intent.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Renk Skalası</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded bg-purple-500" />
              <span className="text-sm">90-100 (Çok Uygun)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded bg-purple-400" />
              <span className="text-sm">80-89 (Uygun)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded bg-pink-400" />
              <span className="text-sm">70-79 (Orta)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded bg-pink-500" />
              <span className="text-sm">60-69 (Düşük)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded bg-rose-500" />
              <span className="text-sm">50-59 (Çok Düşük)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-8 rounded bg-red-500" />
              <span className="text-sm">&lt;50 (Uygun Değil)</span>
            </div>
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
              <Button size="sm" onClick={saveConfig} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
