"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSendNotification } from "@/hooks/useSendNotification";
import { CheckCircle, Loader2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const PRESET_SEGMENTS = [
  { value: "all", label: "Tüm Kullanıcılar", description: "Tüm aktif kullanıcılar" },
  {
    value: "users",
    label: "Sadece Kullanıcılar",
    description: "Normal kullanıcılar (creator değil)"
  },
  { value: "creators", label: "Sadece Creator'ler", description: "İçerik Creator'lerı" }
];

interface CustomFilter {
  role?: "user" | "creator";
  gender?: "M" | "F";
  device_type?: "ios" | "android";
  has_device_token?: boolean;
}

interface SegmentConfig {
  type: "preset" | "custom";
  preset?: string;
  custom?: CustomFilter;
}

export default function BulkNotification() {
  const [segmentType, setSegmentType] = useState<"preset" | "custom">("preset");
  const [presetSegment, setPresetSegment] = useState("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [customFilter, setCustomFilter] = useState<CustomFilter>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [data, setData] = useState("{}");
  const [filterPreview, setFilterPreview] = useState<{ count: number; users: any[] } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { loading, error, success, sendNotification, reset } = useSendNotification();

  // Filtre preview'ı güncelle
  useEffect(() => {
    if (segmentType === "custom" && Object.keys(customFilter).length > 0) {
      loadFilterPreview();
    } else if (segmentType === "preset") {
      loadPresetPreview();
    } else {
      setFilterPreview(null);
    }
  }, [customFilter, segmentType, presetSegment]);

  const loadPresetPreview = async () => {
    try {
      setLoadingPreview(true);
      const supabase = createBrowserSupabaseClient();
      let query = supabase
        .from("profiles")
        .select("id, username, display_name, role, gender, user_id")
        .neq("role", "admin");

      if (presetSegment === "users") {
        query = query.eq("role", "user");
      } else if (presetSegment === "creators") {
        query = query.eq("role", "creator");
      }

      const { data, error } = await query.limit(100);

      if (!error && data) {
        setFilterPreview({
          count: data.length,
          users: data.slice(0, 5)
        });
      }
    } catch (err) {
      console.error("Preset preview error:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadFilterPreview = async () => {
    try {
      setLoadingPreview(true);
      const supabase = createBrowserSupabaseClient();
      let query = supabase
        .from("profiles")
        .select("id, username, display_name, role, gender, user_id")
        .neq("role", "admin");

      if (customFilter.role) {
        query = query.eq("role", customFilter.role);
      }
      if (customFilter.gender) {
        query = query.eq("gender", customFilter.gender);
      }
      if (customFilter.device_type) {
        // Device type'ı kontrol etmek için device_tokens'a join gerekir
        // Şimdilik skip edelim, backend'de yapacağız
      }
      if (customFilter.has_device_token) {
        // Device token'ı olan kullanıcıları bulmak için device_tokens'a join gerekir
        // Şimdilik skip edelim, backend'de yapacağız
      }

      const { data, error } = await query.limit(100);

      if (!error && data) {
        setFilterPreview({
          count: data.length,
          users: data.slice(0, 5) // İlk 5'i göster
        });
      }
    } catch (err) {
      console.error("Filter preview error:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const getSegmentLabel = () => {
    if (segmentType === "preset") {
      return PRESET_SEGMENTS.find((s) => s.value === presetSegment)?.label || "Segment";
    }
    const filters = [];
    if (customFilter.role)
      filters.push(customFilter.role === "user" ? "Kullanıcılar" : "Creator'ler");
    if (customFilter.gender) filters.push(customFilter.gender === "M" ? "Erkekler" : "Kadınlar");
    if (customFilter.device_type)
      filters.push(customFilter.device_type === "ios" ? "iOS" : "Android");
    if (customFilter.has_device_token) filters.push("Device Token'ı Var");
    return filters.length > 0 ? `Özel: ${filters.join(", ")}` : "Özel Filtre";
  };

  const handleSend = async () => {
    try {
      const parsedData = JSON.parse(data);
      const segmentValue = segmentType === "preset" ? presetSegment : JSON.stringify(customFilter);
      await sendNotification({
        type: "bulk",
        title,
        body,
        data: parsedData,
        recipient_segment: segmentValue,
        filter: segmentType === "custom" ? (customFilter as Record<string, unknown>) : undefined
      });
    } catch {
      alert("Invalid JSON in data field");
    }
  };

  const handleReset = () => {
    setSegmentType("preset");
    setPresetSegment("all");
    setCustomFilter({});
    setTitle("");
    setBody("");
    setData("{}");
    reset();
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Toplu Bildirim Gönder</CardTitle>
          <CardDescription>Segmente göre bildirim gönderin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segment Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Segment Türü</label>
            <div className="flex gap-2">
              <Button
                variant={segmentType === "preset" ? "default" : "outline"}
                size="sm"
                onClick={() => setSegmentType("preset")}
                className="flex-1"
              >
                Hazır Segmentler
              </Button>
              <Button
                variant={segmentType === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setSegmentType("custom")}
                className="flex-1"
              >
                Özel Filtre
              </Button>
            </div>
          </div>

          {/* Preset Segments */}
          {segmentType === "preset" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Hedef Segment</label>
              <select
                value={presetSegment}
                onChange={(e) => setPresetSegment(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border rounded-md"
              >
                {PRESET_SEGMENTS.map((seg) => (
                  <option key={seg.value} value={seg.value}>
                    {seg.label} - {seg.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Filter Button */}
          {segmentType === "custom" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtre Ayarları</label>
              <Button
                variant="outline"
                onClick={() => setShowFilterModal(true)}
                className="w-full justify-start"
              >
                ⚙️ Filtreleri Düzenle
              </Button>
              {Object.keys(customFilter).length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-900">Aktif Filtreler:</p>
                  <div className="space-y-1">
                    {customFilter.role && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          👤 {customFilter.role === "user" ? "Kullanıcılar" : "Creator'ler"}
                        </span>
                      </div>
                    )}
                    {customFilter.gender && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                          {customFilter.gender === "M" ? "👨 Erkek" : "👩 Kadın"}
                        </span>
                      </div>
                    )}
                    {customFilter.device_type && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {customFilter.device_type === "ios" ? "📱 iOS" : "🤖 Android"}
                        </span>
                      </div>
                    )}
                    {customFilter.has_device_token && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ✓ Device Token'ı Var
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlık</label>
            <Input
              placeholder="Bildirim başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Body */}
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

          {/* Data */}
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
              <p className="text-sm text-green-800">Toplu bildirim kampanyası oluşturuldu!</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSend} disabled={loading || !title || !body} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gönder
            </Button>
            <Button onClick={handleReset} variant="outline" disabled={loading}>
              Temizle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">📊 Kampanya Önizlemesi</CardTitle>
          <CardDescription>Gönderilecek bildirim detayları</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segment Info */}
          <div className="bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-1">🎯 Hedef Segment</p>
            <p className="text-sm font-bold text-slate-900">{getSegmentLabel()}</p>
          </div>

          {/* Target Users Preview */}
          {filterPreview && (
            <button
              onClick={() => setShowPreviewModal(true)}
              className="w-full bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 text-left hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-blue-900">👥 Hedef Kullanıcılar</p>
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {filterPreview.count}
                </span>
              </div>
              {filterPreview.users.length > 0 && (
                <div className="space-y-2">
                  {filterPreview.users.map((user: any) => (
                    <div
                      key={user.id}
                      className="text-xs bg-white bg-opacity-70 rounded px-2 py-1 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-semibold text-slate-900 truncate">
                          {user.display_name || user.username}
                        </span>
                        <span className="text-slate-500 truncate">(@{user.username})</span>
                      </div>
                      <span className="text-xs ml-2">{user.role === "creator" ? "⭐" : "👤"}</span>
                    </div>
                  ))}
                  {filterPreview.count > 5 && (
                    <p className="text-xs text-blue-700 font-semibold pt-2 border-t border-blue-200">
                      → +{filterPreview.count - 5} daha (Tıkla hepsini gör)
                    </p>
                  )}
                </div>
              )}
            </button>
          )}

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
              <p className="text-sm text-slate-700 line-clamp-4">{body || "Bildirim içeriği..."}</p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">⏳</span>
              <div>
                <p className="text-xs font-semibold text-amber-900 mb-0.5">Durum</p>
                <p className="text-xs text-amber-800">
                  Kampanya oluşturulduktan sonra edge function tarafından işlenecektir
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="text-xs text-slate-600">Hedef</p>
              <p className="text-sm font-bold text-slate-900">{filterPreview?.count || "—"}</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="text-xs text-slate-600">Başlık</p>
              <p className="text-sm font-bold text-slate-900">{title.length || "0"}</p>
            </div>
            <div className="text-center p-2 bg-white rounded border border-slate-200">
              <p className="text-xs text-slate-600">İçerik</p>
              <p className="text-sm font-bold text-slate-900">{body.length || "0"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Modal */}
      {showFilterModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFilterModal(false)}
        >
          <Card
            className="w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <div>
                <CardTitle>Filtre Ayarları</CardTitle>
                <CardDescription>Özel segment filtrele ve sonuçları gör</CardDescription>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Filters */}
              <div className="w-1/3 border-r p-4 overflow-y-auto space-y-4">
                <h3 className="font-semibold text-sm">Filtreler</h3>

                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kullanıcı Rolü</label>
                  <select
                    value={customFilter.role || ""}
                    onChange={(e) =>
                      setCustomFilter({
                        ...customFilter,
                        role: (e.target.value as "user" | "creator") || undefined
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Tümü</option>
                    <option value="user">Kullanıcılar</option>
                    <option value="creator">Creator'ler</option>
                  </select>
                </div>

                {/* Gender Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cinsiyet</label>
                  <select
                    value={customFilter.gender || ""}
                    onChange={(e) =>
                      setCustomFilter({
                        ...customFilter,
                        gender: (e.target.value as "M" | "F") || undefined
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Tümü</option>
                    <option value="M">👨 Erkek</option>
                    <option value="F">👩 Kadın</option>
                  </select>
                </div>

                {/* Device Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cihaz Türü</label>
                  <select
                    value={customFilter.device_type || ""}
                    onChange={(e) =>
                      setCustomFilter({
                        ...customFilter,
                        device_type: (e.target.value as "ios" | "android") || undefined
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Tümü</option>
                    <option value="ios">📱 iOS</option>
                    <option value="android">🤖 Android</option>
                  </select>
                </div>

                {/* Device Token Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Token</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={customFilter.has_device_token || false}
                      onChange={(e) =>
                        setCustomFilter({
                          ...customFilter,
                          has_device_token: e.target.checked || undefined
                        })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Sadece device token'ı olan</span>
                  </div>
                </div>
              </div>

              {/* Right: Users List */}
              <div className="w-2/3 p-4 overflow-y-auto">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm mb-3">
                    👥 Seçilen Kullanıcılar ({filterPreview?.count || 0})
                  </h3>
                  {filterPreview && filterPreview.users.length > 0 ? (
                    <div className="space-y-2">
                      {filterPreview.users.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {user.display_name || user.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                          </div>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                            {user.role === "creator" ? "⭐" : "👤"}
                          </span>
                        </div>
                      ))}
                      {filterPreview.count > 5 && (
                        <div className="text-center py-3 text-sm text-gray-500 border-t">
                          +{filterPreview.count - 5} daha...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">Filtre uygulanmamış</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex gap-2">
              <Button onClick={() => setShowFilterModal(false)} className="flex-1">
                Tamam
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCustomFilter({});
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && filterPreview && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
              <div>
                <CardTitle>Hedef Kullanıcılar</CardTitle>
                <CardDescription>Toplam {filterPreview.count} kullanıcı seçildi</CardDescription>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <div className="space-y-2">
                {filterPreview.users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{user.display_name || user.username}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {user.role === "creator" ? "⭐ Creator" : "👤 User"}
                    </span>
                  </div>
                ))}
                {filterPreview.count > 5 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    +{filterPreview.count - 5} daha...
                  </div>
                )}
              </div>
            </CardContent>
            <div className="border-t p-4">
              <Button onClick={() => setShowPreviewModal(false)} className="w-full">
                Kapat
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
