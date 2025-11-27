/**
 * Scoring Weights Sayfası
 *
 * Amaç: Feed algoritması scoring ağırlıklarını yönetir
 *
 * Özellikler:
 * - 4 adet weight slider (base, vibe, intent, social)
 * - Toplam %100 olmalı validasyonu
 * - Kaydet/Sıfırla butonları
 * - Mevcut config'i yükle
 * - Değişiklik audit log'u
 *
 * Database:
 * - algorithm_configs tablosu (config_type: 'weights')
 */

import { WeightsEditor } from "./weights-editor";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function WeightsPage() {
  const supabase = await createServerSupabaseClient();

  // Mevcut aktif weights config'i getir
  const { data: currentConfig } = await supabase
    .from("algorithm_configs")
    .select("*")
    .eq("config_type", "weights")
    .eq("is_active", true)
    .single();

  // Default weights (eğer config yoksa)
  const defaultWeights = {
    base: 0.3,
    vibe: 0.25,
    intent: 0.25,
    social: 0.2
  };

  const initialWeights = (currentConfig?.config_data as typeof defaultWeights) || defaultWeights;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scoring Weights</h1>
          <p className="text-muted-foreground">Feed algoritması ağırlıklarını ayarlayın</p>
        </div>
      </div>

      {/* Weights Editor Component */}
      <WeightsEditor initialWeights={initialWeights} configId={currentConfig?.id} />
    </>
  );
}
