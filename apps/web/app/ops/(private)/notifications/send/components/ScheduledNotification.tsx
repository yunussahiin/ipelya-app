"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSendNotification } from "@/hooks/useSendNotification";
import { CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRef, useEffect } from "react";
import ScheduledNotificationsList from "./ScheduledNotificationsList";

const TIME_SLOTS = Array.from({ length: 32 }, (_, i) => {
  const hours = Math.floor(i / 2) + 8;
  const minutes = (i % 2) * 30;
  return {
    time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    available: true
  };
});

export default function ScheduledNotification() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [data, setData] = useState("{}");
  const [scheduledDate, setScheduledDate] = useState<Date>(new Date());
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { loading, error, success, sendNotification, reset } = useSendNotification();

  const scheduledAt = scheduledTime
    ? new Date(`${format(scheduledDate, "yyyy-MM-dd")}T${scheduledTime}`)
    : undefined;

  // Scroll to first available time slot
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const firstAvailableButton =
        scrollContainerRef.current.querySelector(`button:not(:disabled)`);
      if (firstAvailableButton) {
        setTimeout(() => {
          firstAvailableButton.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [isOpen, scheduledDate]);

  const handleSend = async () => {
    try {
      const parsedData = JSON.parse(data);
      if (!scheduledAt) {
        alert("Lütfen bir tarih ve saat seçiniz");
        return;
      }
      await sendNotification({
        type: "scheduled",
        title,
        body,
        data: parsedData,
        scheduled_at: scheduledAt.toISOString()
      });
    } catch {
      alert("Invalid JSON in data field or invalid date");
    }
  };

  const handleReset = () => {
    setTitle("");
    setBody("");
    setData("{}");
    setScheduledDate(new Date());
    setScheduledTime(null);
    reset();
  };

  const isValidDate = scheduledAt && scheduledAt > new Date();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zamanlanmış Bildirim</CardTitle>
            <CardDescription>Belirli bir zamanda bildirim gönderin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Popover */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <div className="space-y-2">
                  <label className="text-sm font-medium">📅 Gönderim Tarihi ve Saati</label>
                  <Button variant="outline" className="w-full justify-between">
                    <span>
                      {scheduledAt
                        ? format(scheduledAt, "dd.MM.yyyy HH:mm")
                        : "Tarih ve saat seçiniz"}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-full max-w-2xl p-6" align="start">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Left Column: Calendar + Custom Time Input */}
                  <div className="flex flex-col gap-5 order-2 md:order-1">
                    {/* Calendar */}
                    <div className="flex justify-center">
                      <div className="w-full max-w-sm">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={(newDate) => {
                            if (newDate) {
                              setScheduledDate(newDate);
                              setScheduledTime(null);
                            }
                          }}
                          className="p-3 bg-background border border-border rounded-lg w-full"
                          disabled={[{ before: new Date(new Date().setHours(0, 0, 0, 0)) }]}
                          defaultMonth={scheduledDate}
                          formatters={{
                            formatMonthCaption: (date) => format(date, "MMMM yyyy", { locale: tr })
                          }}
                        />
                      </div>
                    </div>

                    {/* Custom Time Input */}
                    <div className="space-y-3">
                      <label className="text-base font-semibold text-slate-700">
                        Özel Saat Girin
                      </label>
                      <Input
                        type="time"
                        value={scheduledTime || ""}
                        onChange={(e) => setScheduledTime(e.target.value || null)}
                        disabled={loading}
                        className="w-full h-11 text-base"
                      />
                    </div>
                  </div>

                  {/* Right Column: Time Selection */}
                  <div className="flex flex-col gap-5 order-1 md:order-2">
                    {/* Date Display */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-base font-semibold text-blue-900">
                        {format(scheduledDate, "EEEE, d MMMM yyyy", { locale: tr })}
                      </p>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-3 flex-1">
                      <label className="text-base font-semibold text-slate-700">
                        Veya Saatleri Seçin
                      </label>
                      <div
                        ref={scrollContainerRef}
                        className="border border-border rounded-lg overflow-y-auto max-h-80 md:max-h-96 p-3 md:p-4 bg-slate-50"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                          {TIME_SLOTS.map(({ time: timeSlot }) => {
                            const [hours, minutes] = timeSlot.split(":").map(Number);
                            const slotTime = new Date(scheduledDate);
                            slotTime.setHours(hours, minutes, 0, 0);
                            const now = new Date();
                            const isInPast = slotTime < now;

                            // Geçmiş saatleri gizle
                            if (isInPast) return null;

                            return (
                              <Button
                                key={timeSlot}
                                data-time={timeSlot}
                                variant={scheduledTime === timeSlot ? "default" : "outline"}
                                size="sm"
                                className="w-full h-9 md:h-10 text-xs md:text-sm font-medium"
                                onClick={() => setScheduledTime(timeSlot)}
                                disabled={loading}
                              >
                                {timeSlot}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Selected Time Display */}
                    {scheduledTime && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-base font-semibold text-green-900">
                          ✓ {format(scheduledDate, "dd.MM.yyyy", { locale: tr })} {scheduledTime}
                        </p>
                      </div>
                    )}

                    {/* Confirm Button */}
                    <Button
                      onClick={() => setIsOpen(false)}
                      disabled={!scheduledTime || loading}
                      className="w-full h-11 text-base font-semibold"
                    >
                      Onayla
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {scheduledAt && !isValidDate && (
              <p className="text-xs text-red-600">⚠️ Gelecek bir tarih seçiniz</p>
            )}
            {scheduledAt && isValidDate && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-xs text-green-700 font-medium">
                  {format(scheduledAt, "dd.MM.yyyy HH:mm")}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Başlık</label>
              <Input
                placeholder="Bildirim başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">İçerik</label>
              <Textarea
                placeholder="Bildirim içeriği"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ek Veri (JSON)</label>
              <Textarea
                placeholder='{"key": "value"}'
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={loading}
                rows={3}
                className="font-mono text-xs"
              />
            </div>

            {error && (
              <div className="flex gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex gap-2 p-3 rounded-md bg-green-50 border border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">Zamanlanmış bildirim oluşturuldu!</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={loading || !title || !body || !isValidDate}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zamanla
              </Button>
              <Button onClick={handleReset} variant="outline" disabled={loading}>
                Temizle
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">⏰ Zamanlanmış Bildirim Önizlemesi</CardTitle>
            <CardDescription>Gönderilecek bildirim detayları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Schedule Time */}
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-1">📅 Gönderim Zamanı</p>
              <p className="text-sm font-bold text-slate-900">
                {scheduledAt ? (
                  <span className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                      {new Date(scheduledAt).toLocaleString("tr-TR")}
                    </span>
                    {isValidDate && <span className="text-green-600">✓ Geçerli</span>}
                    {!isValidDate && scheduledAt && (
                      <span className="text-red-600">✗ Geçmiş tarih</span>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-400">Seçilmedi</span>
                )}
              </p>
            </div>

            {/* Content Stack */}
            <div className="space-y-3">
              {/* Title */}
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-1">📝 Başlık</p>
                <p className="text-sm font-medium text-slate-900 line-clamp-3">
                  {title || "Bildirim başlığı..."}
                </p>
              </div>

              {/* Body Preview */}
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-1">💬 İçerik</p>
                <p className="text-sm text-slate-700 line-clamp-4">
                  {body || "Bildirim içeriği..."}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">⏰</span>
                <div>
                  <p className="text-xs font-semibold text-blue-900 mb-0.5">Durum</p>
                  <p className="text-xs text-blue-800">
                    Belirtilen zamanda cron job tarafından otomatik olarak gönderilecektir
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <p className="text-xs text-slate-600">Başlık</p>
                <p className="text-sm font-bold text-slate-900">{title.length || "0"}</p>
              </div>
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <p className="text-xs text-slate-600">İçerik</p>
                <p className="text-sm font-bold text-slate-900">{body.length || "0"}</p>
              </div>
              <div className="text-center p-2 bg-white rounded border border-slate-200">
                <p className="text-xs text-slate-600">Durum</p>
                <p className="text-sm font-bold text-slate-900">{isValidDate ? "✓" : "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Notifications List - Full Width */}
      <div className="mt-6">
        <ScheduledNotificationsList />
      </div>
    </>
  );
}
