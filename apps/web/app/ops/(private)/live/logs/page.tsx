"use client";

/**
 * LiveKit Webhook Logs Sayfası
 * Webhook event'lerini ve hataları gösterir
 */

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Webhook,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Video,
  Users,
  Unplug,
  Radio,
  MonitorPlay,
  Upload,
  Download,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  RefreshCw
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { DataTable, columns, type WebhookLog } from "./components";

interface Stats {
  eventCounts: Record<string, number>;
  statusCounts: { success: number; error: number; skipped: number };
  total: number;
}

// İkon bileşenleri map'i
const ICON_COMPONENTS = {
  Video,
  Users,
  Radio,
  Unplug,
  Upload,
  Download,
  MicOff,
  Mic,
  MonitorPlay,
  RefreshCw,
  Camera,
  CameraOff,
  Webhook
} as const;

type IconName = keyof typeof ICON_COMPONENTS;

// Event konfigürasyonu - ikon adı, isim ve açıklama
const EVENT_CONFIG: Record<
  string,
  { iconName: IconName; name: string; description: string; color: string }
> = {
  room_started: {
    iconName: "Video",
    name: "Oda Başlatıldı",
    description: "Yeni bir canlı yayın odası oluşturuldu",
    color: "text-green-500"
  },
  room_finished: {
    iconName: "Video",
    name: "Oda Sonlandırıldı",
    description: "Canlı yayın odası kapatıldı",
    color: "text-red-500"
  },
  participant_joined: {
    iconName: "Users",
    name: "Katılımcı Katıldı",
    description: "Bir kullanıcı odaya katıldı",
    color: "text-blue-500"
  },
  participant_left: {
    iconName: "Users",
    name: "Katılımcı Ayrıldı",
    description: "Bir kullanıcı odadan ayrıldı",
    color: "text-orange-500"
  },
  participant_active: {
    iconName: "Radio",
    name: "Katılımcı Aktif",
    description: "Katılımcı aktif duruma geçti",
    color: "text-green-500"
  },
  participant_connection_aborted: {
    iconName: "Unplug",
    name: "Bağlantı Kesildi",
    description: "Katılımcının bağlantısı beklenmedik şekilde kesildi",
    color: "text-red-500"
  },
  track_published: {
    iconName: "Upload",
    name: "Track Yayınlandı",
    description: "Ses veya video track'i yayına başladı",
    color: "text-purple-500"
  },
  track_unpublished: {
    iconName: "Download",
    name: "Track Kaldırıldı",
    description: "Ses veya video track'i yayından kaldırıldı",
    color: "text-gray-500"
  },
  track_subscribed: {
    iconName: "Radio",
    name: "Track Abone Olundu",
    description: "Bir katılımcı track'e abone oldu",
    color: "text-blue-500"
  },
  track_unsubscribed: {
    iconName: "Radio",
    name: "Track Abonelik İptal",
    description: "Track aboneliği iptal edildi",
    color: "text-gray-500"
  },
  track_muted: {
    iconName: "MicOff",
    name: "Track Susturuldu",
    description: "Ses veya video track'i susturuldu",
    color: "text-yellow-500"
  },
  track_unmuted: {
    iconName: "Mic",
    name: "Track Açıldı",
    description: "Ses veya video track'i açıldı",
    color: "text-green-500"
  },
  egress_started: {
    iconName: "MonitorPlay",
    name: "Kayıt Başladı",
    description: "Oda kaydı başlatıldı",
    color: "text-red-500"
  },
  egress_updated: {
    iconName: "RefreshCw",
    name: "Kayıt Güncellendi",
    description: "Kayıt durumu güncellendi",
    color: "text-blue-500"
  },
  egress_ended: {
    iconName: "MonitorPlay",
    name: "Kayıt Bitti",
    description: "Oda kaydı tamamlandı",
    color: "text-green-500"
  },
  ingress_started: {
    iconName: "Camera",
    name: "Giriş Başladı",
    description: "Harici kaynak girişi başladı (RTMP vb.)",
    color: "text-purple-500"
  },
  ingress_ended: {
    iconName: "CameraOff",
    name: "Giriş Bitti",
    description: "Harici kaynak girişi sonlandı",
    color: "text-gray-500"
  }
};

// Event config'i al ve ikonu renderla
function getEventConfig(eventType: string) {
  const config = EVENT_CONFIG[eventType];
  if (config) {
    const IconComponent = ICON_COMPONENTS[config.iconName];
    return {
      ...config,
      icon: <IconComponent className="h-5 w-5" />
    };
  }
  return {
    iconName: "Webhook" as IconName,
    name: eventType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `LiveKit ${eventType} event'i`,
    color: "text-muted-foreground",
    icon: <Webhook className="h-5 w-5" />
  };
}

// Geriye uyumluluk için
const EVENT_NAMES_TR: Record<string, string> = Object.fromEntries(
  Object.entries(EVENT_CONFIG).map(([key, val]) => [key, val.name])
);

const EVENT_ICONS: Record<string, React.ReactNode> = {};
Object.entries(EVENT_CONFIG).forEach(([key, val]) => {
  const IconComponent = ICON_COMPONENTS[val.iconName];
  EVENT_ICONS[key] = (
    <span className={val.color}>
      <IconComponent className="h-5 w-5" />
    </span>
  );
});

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    eventCounts: {},
    statusCounts: { success: 0, error: 0, skipped: 0 },
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/ops/live/webhook-logs?limit=500`);
      if (!response.ok) throw new Error("Loglar alınamadı");

      const data = await response.json();
      setLogs(data.logs || []);
      setStats(
        data.stats || {
          eventCounts: {},
          statusCounts: { success: 0, error: 0, skipped: 0 },
          total: 0
        }
      );
    } catch (error) {
      console.error("Logs fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh her 30 saniyede
  useEffect(() => {
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Webhook className="h-6 w-6" />
          Webhook Logları
        </h1>
        <p className="text-muted-foreground">LiveKit webhook event&apos;leri ve durumları</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son 24 Saat</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">webhook event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarılı</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.statusCounts.success}</div>
            <p className="text-xs text-muted-foreground">işlenen event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hatalı</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.statusCounts.error}</div>
            <p className="text-xs text-muted-foreground">başarısız event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atlanan</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.statusCounts.skipped}</div>
            <p className="text-xs text-muted-foreground">skip edilen event</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Distribution - Carousel */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Event Dağılımı (Son 24 Saat)</h3>
        {Object.keys(stats.eventCounts).length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            Henüz event yok
          </div>
        ) : (
          <TooltipProvider delayDuration={100}>
            <Carousel
              opts={{
                align: "start",
                loop: false
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-3">
                {Object.entries(stats.eventCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([event, count]) => {
                    const total = stats.total || 1;
                    const percentage = Math.round((count / total) * 100);
                    const config = getEventConfig(event);
                    return (
                      <CarouselItem
                        key={event}
                        className="pl-2 md:pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative flex flex-col items-center p-4 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all cursor-default h-full">
                              <div
                                className={`flex items-center justify-center w-11 h-11 rounded-full bg-muted/80 mb-2.5 ${config.color}`}
                              >
                                {config.icon}
                              </div>
                              <span className="text-2xl font-bold">{count}</span>
                              <span className="text-xs text-muted-foreground text-center mt-1 line-clamp-2 min-h-8">
                                {config.name}
                              </span>
                              <div className="w-full mt-2.5 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary/70 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-muted-foreground mt-1 font-medium">
                                {percentage}%
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            className="max-w-[280px] p-0 overflow-hidden"
                          >
                            <div className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex items-center justify-center w-8 h-8 rounded-full bg-muted ${config.color}`}
                                >
                                  {config.icon}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{config.name}</p>
                                  <p className="text-[10px] font-mono text-muted-foreground">
                                    {event}
                                  </p>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {config.description}
                              </p>
                              <div className="flex items-center justify-between pt-2 border-t text-xs">
                                <span className="text-muted-foreground">Toplam</span>
                                <span className="font-bold">
                                  {count} event ({percentage}%)
                                </span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </CarouselItem>
                    );
                  })}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-4" />
              <CarouselNext className="hidden sm:flex -right-4" />
            </Carousel>
          </TooltipProvider>
        )}
      </div>

      {/* DataTable */}
      <Card>
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={logs}
            isLoading={loading}
            onRefresh={handleRefresh}
            onRowClick={(log) => setSelectedLog(log)}
            meta={{
              onViewDetail: (log: WebhookLog) => setSelectedLog(log)
            }}
          />
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && EVENT_ICONS[selectedLog.event_type]}
              {selectedLog && (EVENT_NAMES_TR[selectedLog.event_type] || selectedLog.event_type)}
            </DialogTitle>
            <DialogDescription>
              {selectedLog &&
                format(new Date(selectedLog.created_at), "d MMMM yyyy HH:mm:ss", { locale: tr })}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Oda Adı</p>
                  <p className="font-mono text-sm truncate">{selectedLog.room_name || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Oda SID</p>
                  <p className="font-mono text-xs truncate">{selectedLog.room_sid || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Katılımcı</p>
                  {selectedLog.participant_profile ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={selectedLog.participant_profile.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-[10px]">
                          {selectedLog.participant_profile.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{selectedLog.participant_profile.username}</span>
                    </div>
                  ) : (
                    <p className="font-mono text-sm">{selectedLog.participant_identity || "-"}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">İşlem Süresi</p>
                  <p className="text-sm">
                    {selectedLog.processing_time_ms ? `${selectedLog.processing_time_ms}ms` : "-"}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {selectedLog.error_message && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Hata Mesajı</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1 break-all">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}

              {/* Raw Payload */}
              <div className="flex-1 min-h-0 flex flex-col">
                <p className="text-sm font-medium mb-2">Ham Veri (Raw Payload)</p>
                <div className="flex-1 min-h-0 rounded-lg border bg-muted overflow-hidden">
                  <ScrollArea className="h-[250px] w-full">
                    <pre className="text-xs font-mono p-3 whitespace-pre-wrap break-all">
                      {JSON.stringify(selectedLog.raw_payload, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
