"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Sliders,
  Bell,
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface KYCSettings {
  // Otomatik Onay Eşikleri
  autoApproveThreshold: number; // 0-100
  manualReviewThreshold: number; // 0-100
  autoRejectThreshold: number; // 0-100

  // Skor Ağırlıkları (toplam 100 olmalı)
  weights: {
    ocrMatch: number;
    faceDetection: number;
    liveness: number;
    ocrConfidence: number;
  };

  // Otomatik İşlemler
  enableAutoApprove: boolean;
  enableAutoReject: boolean;
  requireManualReviewForFirstApplication: boolean;

  // Limitler
  basicLevelPayoutLimit: number;
  fullLevelPayoutLimit: number;
  maxPendingApplicationsPerUser: number;
  cooldownEnabled: boolean;
  cooldownAfterRejection: number; // gün

  // Bildirimler
  notifyOnNewApplication: boolean;
  notifyOnAutoApprove: boolean;
  notifyOnAutoReject: boolean;
  notifyUserOnApproval: boolean;
  notifyUserOnRejection: boolean;
}

const defaultSettings: KYCSettings = {
  // Önerilen eşikler (gerçek veri analizine dayalı)
  autoApproveThreshold: 90,
  manualReviewThreshold: 65,
  autoRejectThreshold: 40,

  // Önerilen ağırlıklar (OCR eşleşme daha kritik)
  weights: {
    ocrMatch: 30,
    faceDetection: 25,
    liveness: 25,
    ocrConfidence: 20
  },

  enableAutoApprove: false,
  enableAutoReject: false,
  requireManualReviewForFirstApplication: true,

  // TR regulasyonlarına uygun limitler
  basicLevelPayoutLimit: 5000,
  fullLevelPayoutLimit: 50000,
  maxPendingApplicationsPerUser: 1,
  cooldownEnabled: true,
  cooldownAfterRejection: 3,

  notifyOnNewApplication: true,
  notifyOnAutoApprove: true,
  notifyOnAutoReject: true,
  notifyUserOnApproval: true,
  notifyUserOnRejection: true
};

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function KYCSettingsPage() {
  const [settings, setSettings] = useState<KYCSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ops/kyc/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch {
      console.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/ops/kyc/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });

      if (res.ok) {
        toast.success("Ayarlar Kaydedildi", {
          description: "KYC ayarları başarıyla güncellendi."
        });
        setHasChanges(false);
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      toast.error("Hata", {
        description: "Ayarlar kaydedilemedi."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  const updateSetting = <K extends keyof KYCSettings>(key: K, value: KYCSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateWeight = (key: keyof KYCSettings["weights"], value: number) => {
    setSettings((prev) => ({
      ...prev,
      weights: { ...prev.weights, [key]: value }
    }));
    setHasChanges(true);
  };

  const totalWeight =
    settings.weights.ocrMatch +
    settings.weights.faceDetection +
    settings.weights.liveness +
    settings.weights.ocrConfidence;

  const isWeightValid = totalWeight === 100;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/ops/kyc">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6" />
                KYC Ayarları
              </h1>
              <p className="text-muted-foreground">
                Kimlik doğrulama sisteminin ayarlarını yönetin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={resetToDefaults} disabled={isSaving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Varsayılana Dön
            </Button>
            <Button onClick={saveSettings} disabled={isSaving || !hasChanges || !isWeightValid}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Kaydedilmemiş değişiklikler var
            </span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Otomatik Onay Eşikleri */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Otomatik Onay Eşikleri
              </CardTitle>
              <CardDescription>Skor bazlı otomatik karar eşiklerini ayarlayın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Approve */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Otomatik Onay Eşiği
                  </Label>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    ≥ {settings.autoApproveThreshold}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.autoApproveThreshold]}
                  onValueChange={([v]) => updateSetting("autoApproveThreshold", v)}
                  min={50}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-green-500"
                />
                <p className="text-xs text-muted-foreground">
                  Bu skorun üzerindeki başvurular otomatik onay önerisi alır
                </p>
              </div>

              {/* Manual Review */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Manuel İnceleme Eşiği
                  </Label>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                    ≥ {settings.manualReviewThreshold}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.manualReviewThreshold]}
                  onValueChange={([v]) => updateSetting("manualReviewThreshold", v)}
                  min={20}
                  max={settings.autoApproveThreshold - 5}
                  step={5}
                  className="[&_[role=slider]]:bg-yellow-500"
                />
                <p className="text-xs text-muted-foreground">
                  Bu aralıktaki başvurular manuel inceleme gerektirir
                </p>
              </div>

              {/* Auto Reject */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Otomatik Red Eşiği
                  </Label>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600">
                    {"<"} {settings.autoRejectThreshold}%
                  </Badge>
                </div>
                <Slider
                  value={[settings.autoRejectThreshold]}
                  onValueChange={([v]) => updateSetting("autoRejectThreshold", v)}
                  min={0}
                  max={settings.manualReviewThreshold - 5}
                  step={5}
                  className="[&_[role=slider]]:bg-red-500"
                />
                <p className="text-xs text-muted-foreground">
                  Bu skorun altındaki başvurular otomatik red önerisi alır
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Skor Ağırlıkları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Skor Ağırlıkları
                {!isWeightValid && (
                  <Badge variant="destructive" className="ml-2">
                    Toplam: {totalWeight}% (100 olmalı)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Her doğrulama kategorisinin ağırlığını belirleyin (toplam 100)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OCR Match */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>OCR Eşleşme</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.weights.ocrMatch}
                      onChange={(e) => updateWeight("ocrMatch", Number(e.target.value))}
                      className="w-20 text-right"
                      min={0}
                      max={100}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ad (%20), Soyad (%20), TC No (%30), Doğum Tarihi (%30)
                </p>
              </div>

              {/* Face Detection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Yüz Algılama</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.weights.faceDetection}
                      onChange={(e) => updateWeight("faceDetection", Number(e.target.value))}
                      className="w-20 text-right"
                      min={0}
                      max={100}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selfie&apos;de yüz algılama başarısı
                </p>
              </div>

              {/* Liveness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Canlılık Kontrolü</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.weights.liveness}
                      onChange={(e) => updateWeight("liveness", Number(e.target.value))}
                      className="w-20 text-right"
                      min={0}
                      max={100}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">4 adımlı canlılık kontrolü skoru</p>
              </div>

              {/* OCR Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>OCR Güven Skoru</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={settings.weights.ocrConfidence}
                      onChange={(e) => updateWeight("ocrConfidence", Number(e.target.value))}
                      className="w-20 text-right"
                      min={0}
                      max={100}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">OCR okuma güven seviyesi</p>
              </div>

              <Separator />

              <div className="flex items-center justify-between font-medium">
                <span>Toplam</span>
                <span className={totalWeight === 100 ? "text-green-600" : "text-red-600"}>
                  {totalWeight}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Otomatik İşlemler */}
          <Card>
            <CardHeader>
              <CardTitle>Otomatik İşlemler</CardTitle>
              <CardDescription>Otomatik onay ve red işlemlerini yapılandırın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Otomatik Onay</Label>
                  <p className="text-xs text-muted-foreground">
                    Eşiği geçen başvuruları otomatik onayla
                  </p>
                </div>
                <Switch
                  checked={settings.enableAutoApprove}
                  onCheckedChange={(v) => updateSetting("enableAutoApprove", v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Otomatik Red</Label>
                  <p className="text-xs text-muted-foreground">
                    Eşiğin altındaki başvuruları otomatik reddet
                  </p>
                </div>
                <Switch
                  checked={settings.enableAutoReject}
                  onCheckedChange={(v) => updateSetting("enableAutoReject", v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>İlk Başvuru Manuel İnceleme</Label>
                  <p className="text-xs text-muted-foreground">
                    Kullanıcının ilk başvurusunu her zaman manuel incele
                  </p>
                </div>
                <Switch
                  checked={settings.requireManualReviewForFirstApplication}
                  onCheckedChange={(v) =>
                    updateSetting("requireManualReviewForFirstApplication", v)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Limitler */}
          <Card>
            <CardHeader>
              <CardTitle>Limitler</CardTitle>
              <CardDescription>Ödeme limitleri ve başvuru kuralları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Basic Seviye Aylık Limit (₺)</Label>
                <Input
                  type="number"
                  value={settings.basicLevelPayoutLimit}
                  onChange={(e) => updateSetting("basicLevelPayoutLimit", Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Full Seviye Aylık Limit (₺)</Label>
                <Input
                  type="number"
                  value={settings.fullLevelPayoutLimit}
                  onChange={(e) => updateSetting("fullLevelPayoutLimit", Number(e.target.value))}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Kullanıcı Başına Maksimum Bekleyen Başvuru</Label>
                <Select
                  value={String(settings.maxPendingApplicationsPerUser)}
                  onValueChange={(v) => updateSetting("maxPendingApplicationsPerUser", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 başvuru</SelectItem>
                    <SelectItem value="2">2 başvuru</SelectItem>
                    <SelectItem value="3">3 başvuru</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Red Sonrası Bekleme Süresi</Label>
                    <p className="text-xs text-muted-foreground">
                      Reddedilen kullanıcıların yeniden başvuru yapabilmesi için bekleme süresi
                    </p>
                  </div>
                  <Switch
                    checked={settings.cooldownEnabled}
                    onCheckedChange={(v) => updateSetting("cooldownEnabled", v)}
                  />
                </div>
                {settings.cooldownEnabled && (
                  <Select
                    value={String(settings.cooldownAfterRejection)}
                    onValueChange={(v) => updateSetting("cooldownAfterRejection", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 gün</SelectItem>
                      <SelectItem value="3">3 gün</SelectItem>
                      <SelectItem value="7">7 gün</SelectItem>
                      <SelectItem value="14">14 gün</SelectItem>
                      <SelectItem value="30">30 gün</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bildirimler */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Bildirimler
              </CardTitle>
              <CardDescription>Bildirim ayarlarını yapılandırın</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Ops Bildirimleri</h4>
                  <div className="flex items-center justify-between">
                    <Label>Yeni başvuru bildirimi</Label>
                    <Switch
                      checked={settings.notifyOnNewApplication}
                      onCheckedChange={(v) => updateSetting("notifyOnNewApplication", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Otomatik onay bildirimi</Label>
                    <Switch
                      checked={settings.notifyOnAutoApprove}
                      onCheckedChange={(v) => updateSetting("notifyOnAutoApprove", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Otomatik red bildirimi</Label>
                    <Switch
                      checked={settings.notifyOnAutoReject}
                      onCheckedChange={(v) => updateSetting("notifyOnAutoReject", v)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Kullanıcı Bildirimleri</h4>
                  <div className="flex items-center justify-between">
                    <Label>Onay bildirimi gönder</Label>
                    <Switch
                      checked={settings.notifyUserOnApproval}
                      onCheckedChange={(v) => updateSetting("notifyUserOnApproval", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Red bildirimi gönder</Label>
                    <Switch
                      checked={settings.notifyUserOnRejection}
                      onCheckedChange={(v) => updateSetting("notifyUserOnRejection", v)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
