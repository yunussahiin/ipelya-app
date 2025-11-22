"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { HelpCircle } from "lucide-react";
import { ConfirmationDialog } from "@/components/ops/confirmation-dialog";
import { showToast } from "@/lib/toast-utils";

interface AnomalyDetectionConfig {
  excessive_failed_attempts: {
    enabled: boolean;
    threshold: number;
    window_minutes: number;
    severity: string;
  };
  multiple_ips: {
    enabled: boolean;
    threshold: number;
    window_minutes: number;
    severity: string;
  };
  long_sessions: {
    enabled: boolean;
    threshold_minutes: number;
    severity: string;
  };
  unusual_access_time: {
    enabled: boolean;
    normal_hours: string;
    severity: string;
  };
}

export default function ConfigurationPage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AnomalyDetectionConfig | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const { isLoading } = useQuery<AnomalyDetectionConfig>({
    queryKey: ["anomaly-detection-config"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/config/anomaly-detection");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data: AnomalyDetectionConfig = await res.json();
      setConfig(data);
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (newConfig: AnomalyDetectionConfig) => {
      const res = await fetch("/api/ops/shadow/config/anomaly-detection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (!res.ok) throw new Error("Failed to update config");
      return res.json();
    },
    onSuccess: () => {
      showToast.success("✓ Yapılandırma başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ["anomaly-detection-config"] });
      setConfirmDialog(false);
    },
    onError: () => {
      showToast.error("✕ Yapılandırma güncellenirken hata oluştu");
    }
  });

  const handleSave = () => {
    setConfirmDialog(true);
  };

  const handleConfirmSave = () => {
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
          <h1 className="text-3xl font-bold">Yapılandırma</h1>
          <p className="text-muted-foreground mt-2">Shadow profil sistem ayarlarını yönetin</p>
        </div>

        {config && (
          <>
            {/* Excessive Failed Attempts */}
            <Card>
              <CardHeader>
                <CardTitle>Aşırı Başarısız Deneme Algılaması</CardTitle>
                <CardDescription>
                  Kullanıcılar çok fazla başarısız kimlik doğrulama denemesi yaptığında algıla
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Etkinleştirildi</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bu anomali algılamasını etkinleştir veya devre dışı bırak</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={config.excessive_failed_attempts.enabled ? "true" : "false"}
                    onValueChange={(value) =>
                      setConfig({
                        ...config,
                        excessive_failed_attempts: {
                          ...config.excessive_failed_attempts,
                          enabled: value === "true"
                        }
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Etkinleştirildi</SelectItem>
                      <SelectItem value="false">Devre Dışı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Eşik Değeri</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Anomali tetiklemek için gereken başarısız deneme sayısı</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        value={config.excessive_failed_attempts.threshold}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            excessive_failed_attempts: {
                              ...config.excessive_failed_attempts,
                              threshold: parseInt(e.target.value)
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
                            <p>Denemelerin sayılacağı zaman penceresi</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        value={config.excessive_failed_attempts.window_minutes}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            excessive_failed_attempts: {
                              ...config.excessive_failed_attempts,
                              window_minutes: parseInt(e.target.value)
                            }
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Önem Derecesi</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Algılanan anomalinin önem seviyesi</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={config.excessive_failed_attempts.severity}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          excessive_failed_attempts: {
                            ...config.excessive_failed_attempts,
                            severity: value
                          }
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Kritik</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="low">Düşük</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multiple IPs */}
            <Card>
              <CardHeader>
                <CardTitle>Çoklu IP Algılaması</CardTitle>
                <CardDescription>
                  Aynı kullanıcı birden fazla IP'den eriştiğinde algıla
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Etkinleştirildi</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bu anomali algılamasını etkinleştir veya devre dışı bırak</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={config.multiple_ips.enabled ? "true" : "false"}
                    onValueChange={(value) =>
                      setConfig({
                        ...config,
                        multiple_ips: {
                          ...config.multiple_ips,
                          enabled: value === "true"
                        }
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Etkinleştirildi</SelectItem>
                      <SelectItem value="false">Devre Dışı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Eşik Değeri</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Anomali tetiklemek için gereken IP sayısı</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        value={config.multiple_ips.threshold}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            multiple_ips: {
                              ...config.multiple_ips,
                              threshold: parseInt(e.target.value)
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
                            <p>IP'lerin sayılacağı zaman penceresi</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        value={config.multiple_ips.window_minutes}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            multiple_ips: {
                              ...config.multiple_ips,
                              window_minutes: parseInt(e.target.value)
                            }
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Önem Derecesi</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Algılanan anomalinin önem seviyesi</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select
                      value={config.multiple_ips.severity}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          multiple_ips: {
                            ...config.multiple_ips,
                            severity: value
                          }
                        })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Kritik</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="low">Düşük</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Long Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Uzun Oturum Algılaması</CardTitle>
                <CardDescription>Oturumlar normal süreyi aştığında uyarı ver</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Etkinleştirildi</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bu anomali algılamasını etkinleştir veya devre dışı bırak</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={config.long_sessions.enabled ? "true" : "false"}
                    onValueChange={(value) =>
                      setConfig({
                        ...config,
                        long_sessions: {
                          ...config.long_sessions,
                          enabled: value === "true"
                        }
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Etkinleştirildi</SelectItem>
                      <SelectItem value="false">Devre Dışı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Eşik Değeri (dakika)</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Anomali tetiklemek için maksimum oturum süresi</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        value={config.long_sessions.threshold_minutes}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            long_sessions: {
                              ...config.long_sessions,
                              threshold_minutes: parseInt(e.target.value)
                            }
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Önem Derecesi</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Algılanan anomalinin önem seviyesi</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={config.long_sessions.severity}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            long_sessions: {
                              ...config.long_sessions,
                              severity: value
                            }
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Kritik</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="low">Düşük</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unusual Access Time */}
            <Card>
              <CardHeader>
                <CardTitle>Olağandışı Erişim Saati Algılaması</CardTitle>
                <CardDescription>
                  Erişim normal saatler dışında gerçekleştiğinde uyarı ver
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Etkinleştirildi</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bu anomali algılamasını etkinleştir veya devre dışı bırak</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={config.unusual_access_time.enabled ? "true" : "false"}
                    onValueChange={(value) =>
                      setConfig({
                        ...config,
                        unusual_access_time: {
                          ...config.unusual_access_time,
                          enabled: value === "true"
                        }
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Etkinleştirildi</SelectItem>
                      <SelectItem value="false">Devre Dışı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Normal Saatler (SS:DD-SS:DD)</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Normal erişim saatleri (örn: 08:00-23:00)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="text"
                        value={config.unusual_access_time.normal_hours}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            unusual_access_time: {
                              ...config.unusual_access_time,
                              normal_hours: e.target.value
                            }
                          })
                        }
                        className="mt-1"
                        placeholder="08:00-23:00"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Önem Derecesi</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Algılanan anomalinin önem seviyesi</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={config.unusual_access_time.severity}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            unusual_access_time: {
                              ...config.unusual_access_time,
                              severity: value
                            }
                          })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Kritik</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="low">Düşük</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full"
              size="lg"
            >
              {updateMutation.isPending ? "Kaydediliyor..." : "Yapılandırmayı Kaydet"}
            </Button>

            <ConfirmationDialog
              open={confirmDialog}
              onOpenChange={setConfirmDialog}
              title="Yapılandırmayı Kaydet"
              description="Anomali algılama ayarlarını değiştirmek istediğinizden emin misiniz? Bu değişiklikler hemen yürürlüğe girecektir."
              confirmText="Kaydet"
              cancelText="İptal"
              onConfirm={handleConfirmSave}
              isLoading={updateMutation.isPending}
              isDangerous
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
