"use client";

/**
 * WeightsEditor Component
 *
 * Amaç: Scoring weights'leri düzenlemek için interaktif editor
 *
 * Özellikler:
 * - 4 adet slider (base, vibe, intent, social)
 * - Real-time toplam hesaplama
 * - %100 validasyonu
 * - Kaydet/Sıfırla butonları
 * - Loading ve error states
 * - Toast notifications
 *
 * Props:
 * - initialWeights: Mevcut weight değerleri
 * - configId: Mevcut config ID (update için)
 */

import { useState } from "react";
import { IconCheck, IconRefresh, IconScale } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Weight türleri ve açıklamaları
const WEIGHT_CONFIG = {
  base: {
    label: "Base Relevance",
    description: "Temel ilgi skoru (recency, engagement, quality)",
    color: "bg-blue-500"
  },
  vibe: {
    label: "Vibe Match",
    description: "Kullanıcı mood uyumu skoru",
    color: "bg-pink-500"
  },
  intent: {
    label: "Intent Match",
    description: "Dating intent eşleşme skoru",
    color: "bg-purple-500"
  },
  social: {
    label: "Social Graph",
    description: "Sosyal bağlantı skoru (takip, arkadaş)",
    color: "bg-green-500"
  }
} as const;

type WeightKey = keyof typeof WEIGHT_CONFIG;

interface WeightsEditorProps {
  initialWeights: Record<WeightKey, number>;
  configId?: string;
}

export function WeightsEditor({ initialWeights, configId }: WeightsEditorProps) {
  const [weights, setWeights] = useState(initialWeights);
  const [isLoading, setIsLoading] = useState(false);

  // Toplam hesapla
  const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(total - 1) < 0.01; // %1 tolerans

  // Tek bir weight'i güncelle
  const updateWeight = (key: WeightKey, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // Sıfırla
  const handleReset = () => {
    setWeights(initialWeights);
    toast.info("Değerler sıfırlandı");
  };

  // Kaydet
  const handleSave = async () => {
    if (!isValid) {
      toast.error("Toplam %100 olmalıdır!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ops/feed/algorithm/weights", {
        method: configId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configId,
          weights
        })
      });

      if (!response.ok) {
        throw new Error("Kaydetme başarısız");
      }

      toast.success("✓ Weights başarıyla kaydedildi!");
    } catch (error) {
      toast.error("✕ Kaydetme sırasında hata oluştu");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Weights Sliders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconScale className="h-5 w-5" />
            Weight Ayarları
          </CardTitle>
          <CardDescription>
            Her bir faktörün feed skorlamasındaki ağırlığını belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(WEIGHT_CONFIG) as WeightKey[]).map((key) => (
            <WeightSlider
              key={key}
              weightKey={key}
              value={weights[key]}
              onChange={(value) => updateWeight(key, value)}
              config={WEIGHT_CONFIG[key]}
            />
          ))}
        </CardContent>
      </Card>

      {/* Total & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {/* Toplam Göstergesi */}
            <div className="space-y-1">
              <p className="text-sm font-medium">Toplam</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${isValid ? "text-green-600 dark:text-green-400" : "text-destructive"}`}
                >
                  {(total * 100).toFixed(0)}%
                </span>
                {isValid ? (
                  <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <span className="text-sm text-destructive">(Toplam %100 olmalı)</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                <IconRefresh className="mr-2 h-4 w-4" />
                Sıfırla
              </Button>
              <Button onClick={handleSave} disabled={!isValid || isLoading}>
                {isLoading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-border bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Önizleme</CardTitle>
          <CardDescription>Bu ayarlarla örnek bir içerik skoru hesaplaması</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Score (0.8)</span>
              <span>
                × {weights.base.toFixed(2)} = {(0.8 * weights.base).toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vibe Match (0.9)</span>
              <span>
                × {weights.vibe.toFixed(2)} = {(0.9 * weights.vibe).toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intent Match (0.7)</span>
              <span>
                × {weights.intent.toFixed(2)} = {(0.7 * weights.intent).toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Social Score (0.6)</span>
              <span>
                × {weights.social.toFixed(2)} = {(0.6 * weights.social).toFixed(3)}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between font-medium">
                <span>Final Score</span>
                <span className="text-primary">
                  {(
                    0.8 * weights.base +
                    0.9 * weights.vibe +
                    0.7 * weights.intent +
                    0.6 * weights.social
                  ).toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * WeightSlider Component
 *
 * Amaç: Tek bir weight için slider ve label
 *
 * Props:
 * - weightKey: Weight anahtarı
 * - value: Mevcut değer (0-1)
 * - onChange: Değer değiştiğinde çağrılır
 * - config: Label, description, color
 */
interface WeightSliderProps {
  weightKey: string;
  value: number;
  onChange: (value: number) => void;
  config: {
    label: string;
    description: string;
    color: string;
  };
}

function WeightSlider({ weightKey, value, onChange, config }: WeightSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor={weightKey} className="text-sm font-medium">
            {config.label}
          </Label>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </div>
        <span className="text-lg font-semibold tabular-nums">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
        <Slider
          id={weightKey}
          min={0}
          max={100}
          step={5}
          value={[value * 100]}
          onValueChange={(values: number[]) => onChange(values[0] / 100)}
          className="flex-1"
        />
      </div>
    </div>
  );
}
