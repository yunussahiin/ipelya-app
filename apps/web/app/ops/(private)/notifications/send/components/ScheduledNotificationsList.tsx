"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { AlertCircle, Clock, CheckCircle2, Edit2, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { NotificationDistributionChart } from "./NotificationDistributionChart";

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduled_at: string;
  status: "scheduled" | "sent" | "failed";
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

export default function ScheduledNotificationsList() {
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editTime, setEditTime] = useState<string | null>(null);

  useEffect(() => {
    fetchScheduledNotifications();
    const interval = setInterval(fetchScheduledNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchScheduledNotifications = async () => {
    try {
      const supabase = createBrowserSupabaseClient();

      // Admin view: Get all scheduled notifications
      const { data, error } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase error:", error);
        // Continue anyway - show empty list
        setNotifications([]);
        return;
      }
      console.log("Fetched notifications:", data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      // Show empty list on error instead of blocking
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.from("scheduled_notifications").delete().eq("id", id);

      if (error) throw error;
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  };

  const handleEditOpen = (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      setEditTitle(notification.title);
      setEditBody(notification.body);
      const date = new Date(notification.scheduled_at);
      setEditDate(date);
      const timeStr = format(date, "HH:mm");
      setEditTime(timeStr);
      setEditingId(id);
    }
  };

  const handleEditSave = async () => {
    if (!editingId || !editDate || !editTime) return;

    try {
      const supabase = createBrowserSupabaseClient();

      // Combine date and time
      const [hours, minutes] = editTime.split(":").map(Number);
      const scheduledDate = new Date(editDate);
      scheduledDate.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from("scheduled_notifications")
        .update({
          title: editTitle,
          body: editBody,
          scheduled_at: scheduledDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", editingId);

      if (error) throw error;

      // Update local state
      setNotifications(
        notifications.map((n) =>
          n.id === editingId
            ? {
                ...n,
                title: editTitle,
                body: editBody,
                scheduled_at: scheduledDate.toISOString()
              }
            : n
        )
      );

      // Close modal and show success
      setEditingId(null);
      toast.success("✓ Bildirim başarıyla güncellendi!");
    } catch (error) {
      console.error("Error saving notification:", error);
      toast.error("✕ Bildirim güncellenirken hata oluştu!");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">⏱️ Zamanlanmış</Badge>;
      case "sent":
        return <Badge className="bg-green-100 text-green-800">✓ Gönderildi</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">✕ Başarısız</Badge>;
      default:
        return <Badge>Bilinmiyor</Badge>;
    }
  };

  const getTimeStatus = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return "Geçmiş";

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}g`);
    if (hours > 0) parts.push(`${hours}s`);
    if (minutes > 0) parts.push(`${minutes}d`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}sn`);

    return parts.join(" ");
  };

  const chartConfig = {
    scheduled: {
      label: "Zamanlanmış",
      color: "hsl(var(--chart-1))"
    },
    sent: {
      label: "Gönderildi",
      color: "hsl(var(--chart-2))"
    },
    failed: {
      label: "Başarısız",
      color: "hsl(var(--chart-3))"
    }
  } satisfies ChartConfig;

  const getChartData = () => {
    const scheduled = notifications.filter((n) => n.status === "scheduled").length;
    const sent = notifications.filter((n) => n.status === "sent").length;
    const failed = notifications.filter((n) => n.status === "failed").length;

    return [
      { status: "Zamanlanmış", count: scheduled, fill: "var(--color-scheduled)" },
      { status: "Gönderildi", count: sent, fill: "var(--color-sent)" },
      { status: "Başarısız", count: failed, fill: "var(--color-failed)" }
    ];
  };

  const getStatusData = () => {
    const statusCounts = {
      scheduled: notifications.filter((n) => n.status === "scheduled").length,
      sent: notifications.filter((n) => n.status === "sent").length,
      failed: notifications.filter((n) => n.status === "failed").length
    };
    return statusCounts;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zamanlanmış Bildirimler</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Left (Stats + List) and Right (Status Chart) */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Stats + Notifications List */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Zamanlanmış Bildirimler</CardTitle>
                <CardDescription>
                  {notifications.length} bildirim (
                  {notifications.filter((n) => n.status === "scheduled").length} beklemede)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Zamanlanmış</p>
                    <p className="text-2xl font-bold text-blue-900">{getStatusData().scheduled}</p>
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Gönderildi</p>
                    <p className="text-2xl font-bold text-green-900">{getStatusData().sent}</p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Başarısız</p>
                    <p className="text-2xl font-bold text-red-900">{getStatusData().failed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications List Card */}
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Listesi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Zamanlanmış bildirim yok
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Title & Status */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 truncate">
                              {notification.title}
                            </h3>
                            {getStatusBadge(notification.status)}
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {notification.body}
                          </p>

                          {/* Time Info */}
                          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(new Date(notification.scheduled_at), "dd.MM.yyyy HH:mm", {
                                  locale: tr
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{getTimeStatus(notification.scheduled_at)}</span>
                            </div>

                            {/* Status Details */}
                            {notification.status === "sent" && notification.sent_at && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  {format(new Date(notification.sent_at), "dd.MM.yyyy HH:mm", {
                                    locale: tr
                                  })}
                                </span>
                              </div>
                            )}

                            {notification.status === "failed" && notification.error_message && (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                <span>{notification.error_message}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          {notification.status === "scheduled" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditOpen(notification.id)}
                                title="Düzenle"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleCancel(notification.id)}
                                title="İptal Et"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {notification.status === "sent" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Detayları Gör"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Status Chart */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Bildirim Durumu</CardTitle>
                <CardDescription>Zamanlanmış, Gönderildi, Başarısız</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <BarChart accessibilityLayer data={getChartData()}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="status" tickLine={false} tickMargin={10} axisLine={false} />
                    <ChartTooltip
                      content={<ChartTooltipContent labelKey="status" nameKey="count" />}
                      formatter={(value) => [`${value} Bildirim `, "Toplam"]}
                    />
                    <Bar dataKey="count" fill="var(--color-scheduled)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Bottom Row: Distribution Chart - Full Width */}
      {notifications.length > 0 && <NotificationDistributionChart notifications={notifications} />}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Bildirimi Düzenle</CardTitle>
              <CardDescription>
                {notifications.find((n) => n.id === editingId)?.scheduled_at &&
                  `Gönderim: ${format(new Date(notifications.find((n) => n.id === editingId)!.scheduled_at), "dd.MM.yyyy HH:mm", { locale: tr })}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Başlık</label>
                <Input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Bildirim başlığı"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">İçerik</label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Bildirim içeriği"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Gönderim Tarihi ve Saati</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Calendar */}
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      disabled={[{ before: new Date(new Date().setHours(0, 0, 0, 0)) }]}
                      defaultMonth={editDate}
                      formatters={{
                        formatMonthCaption: (date) => format(date, "MMMM yyyy", { locale: tr })
                      }}
                      className="p-3 bg-background border border-border rounded-lg"
                    />
                  </div>

                  {/* Custom Time Input */}
                  <div className="flex flex-col justify-center">
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">
                        Özel Saat Girin
                      </label>
                      <Input
                        type="time"
                        value={editTime || ""}
                        onChange={(e) => setEditTime(e.target.value || null)}
                        className="w-full h-10 text-base"
                      />
                      {editDate && editTime && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-900">
                            ✓ {format(editDate, "dd.MM.yyyy", { locale: tr })} {editTime}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">
                  İptal
                </Button>
                <Button onClick={handleEditSave} className="flex-1">
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
