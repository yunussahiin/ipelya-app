"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { HelpCircle } from "lucide-react";

interface RateLimitConfig {
  pin: {
    max_attempts: number;
    window_minutes: number;
    lockout_minutes: number;
  };
  biometric: {
    max_attempts: number;
    window_minutes: number;
    lockout_minutes: number;
  };
}

export default function RateLimitsPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<RateLimitConfig | null>(null);

  const { data: rateLimitStats } = useQuery({
    queryKey: ["rate-limits"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/rate-limits");
      if (!res.ok) throw new Error("Failed to fetch rate limits");
      return res.json();
    }
  });

  const { isLoading } = useQuery<RateLimitConfig>({
    queryKey: ["rate-limit-config"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/config/rate-limits");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data: RateLimitConfig = await res.json();
      setConfig(data);
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (newConfig: RateLimitConfig) => {
      const res = await fetch("/api/ops/shadow/config/rate-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => {
      toast.success("✓ Configuration updated");
      queryClient.invalidateQueries({ queryKey: ["rate-limit-config"] });
    },
    onError: () => {
      toast.error("✕ Failed to update configuration");
    }
  });

  const handleSave = () => {
    if (config) {
      updateMutation.mutate(config);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hız Sınırlaması</h1>
          <p className="text-muted-foreground mt-2">
            Hız sınırlaması ayarlarını yapılandırın ve izleyin
          </p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>PIN Denemeleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Toplam İhlaller</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tüm zamanlar boyunca PIN hız sınırlaması ihlal sayısı</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {rateLimitStats?.pin_attempts?.total_violations || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Kilitli Kullanıcılar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Şu anda PIN hız sınırlaması nedeniyle kilitli olan kullanıcı sayısı</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {rateLimitStats?.pin_attempts?.locked_users || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Son 24 Saat İhlalleri</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Son 24 saat içinde meydana gelen PIN hız sınırlaması ihlal sayısı</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {rateLimitStats?.pin_attempts?.violations_last_24h || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Biyometrik Denemeler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Toplam İhlaller</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tüm zamanlar boyunca biyometrik hız sınırlaması ihlal sayısı</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {rateLimitStats?.biometric_attempts?.total_violations || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Kilitli Kullanıcılar</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Şu anda biyometrik hız sınırlaması nedeniyle kilitli olan kullanıcı sayısı
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {rateLimitStats?.biometric_attempts?.locked_users || 0}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Son 24 Saat İhlalleri</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Son 24 saat içinde meydana gelen biyometrik hız sınırlaması ihlal sayısı
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-2xl font-bold">
                  {rateLimitStats?.biometric_attempts?.violations_last_24h || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yapılandırma */}
        {config && (
          <Card>
            <CardHeader>
              <CardTitle>Yapılandırma</CardTitle>
              <CardDescription>Hız sınırlaması eşiklerini ayarlayın</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PIN Yapılandırması */}
              <div className="space-y-4">
                <h3 className="font-semibold">PIN Denemeleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Maksimum Deneme</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Belirli bir zaman penceresinde izin verilen maksimum PIN deneme sayısı
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      value={config.pin.max_attempts}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pin: {
                            ...config.pin,
                            max_attempts: parseInt(e.target.value)
                          }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Pencere (dakika)</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Deneme sayısının sıfırlanacağı zaman penceresi (dakika cinsinden)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      value={config.pin.window_minutes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pin: {
                            ...config.pin,
                            window_minutes: parseInt(e.target.value)
                          }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Kilitleme (dakika)</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Maksimum deneme aşıldığında kullanıcının kilitleneceği süre (dakika
                            cinsinden)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      value={config.pin.lockout_minutes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pin: {
                            ...config.pin,
                            lockout_minutes: parseInt(e.target.value)
                          }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Biyometrik Yapılandırması */}
              <div className="space-y-4">
                <h3 className="font-semibold">Biyometrik Denemeler</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Maksimum Deneme</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Belirli bir zaman penceresinde izin verilen maksimum biyometrik deneme
                            sayısı
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      value={config.biometric.max_attempts}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          biometric: {
                            ...config.biometric,
                            max_attempts: parseInt(e.target.value)
                          }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Pencere (dakika)</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Biyometrik deneme sayısının sıfırlanacağı zaman penceresi (dakika
                            cinsinden)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      value={config.biometric.window_minutes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          biometric: {
                            ...config.biometric,
                            window_minutes: parseInt(e.target.value)
                          }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Kilitleme (dakika)</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Maksimum biyometrik deneme aşıldığında kullanıcının kilitleneceği süre
                            (dakika cinsinden)
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      value={config.biometric.lockout_minutes}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          biometric: {
                            ...config.biometric,
                            lockout_minutes: parseInt(e.target.value)
                          }
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? "Kaydediliyor..." : "Yapılandırmayı Kaydet"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
