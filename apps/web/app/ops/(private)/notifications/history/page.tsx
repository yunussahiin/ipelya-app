"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  Loader2,
  X,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from "lucide-react";
import { HistoryChart } from "./components/HistoryChart";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Campaign {
  id: string;
  type: "single" | "bulk" | "scheduled";
  title: string;
  body: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  sent_at?: string;
}

const ITEMS_PER_PAGE = 5;

export default function NotificationHistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(campaigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCampaigns = campaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("notification_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error("Error loading campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Gönderildi";
      case "scheduled":
        return "Zamanlanmış";
      case "failed":
        return "Başarısız";
      default:
        return "Taslak";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bildirim Geçmişi</h1>
        <p className="text-muted-foreground mt-2">
          Gönderilen ve zamanlanmış bildirimlerin geçmişini ve analizini görüntüleyin
        </p>
      </div>

      {/* Chart */}
      {!loading && campaigns.length > 0 && <HistoryChart campaigns={campaigns} />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Henüz bildirim kampanyası yok</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left: Campaigns List */}
          <div className="md:col-span-2 lg:col-span-2 flex flex-col">
            <div className="space-y-3 p-4 flex-1 overflow-y-auto">
              {paginatedCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className={`cursor-pointer transition-all ${
                    selectedCampaign?.id === campaign.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{campaign.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{campaign.body}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 ${getStatusColor(campaign.status)}`}
                        >
                          {getStatusLabel(campaign.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t">
                        <span>
                          {campaign.type === "single"
                            ? "📧 Tekil"
                            : campaign.type === "bulk"
                              ? "👥 Toplu"
                              : "⏰ Zamanlanmış"}
                        </span>
                        <span>
                          {campaign.sent_count}/{campaign.total_recipients} gönderildi
                        </span>
                        <span>
                          {format(new Date(campaign.created_at), "dd MMM", { locale: tr })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Sayfa {currentPage} / {totalPages} ({campaigns.length} kampanya)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Sonraki
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Campaign Details */}
          <div>
            {selectedCampaign ? (
              <Card className="sticky top-0">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">Detaylar</CardTitle>
                    <button
                      onClick={() => setSelectedCampaign(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Başlık</p>
                    <p className="text-sm font-medium">{selectedCampaign.title}</p>
                  </div>

                  {/* Body */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">İçerik</p>
                    <p className="text-sm text-gray-700 line-clamp-4">{selectedCampaign.body}</p>
                  </div>

                  {/* Type */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Tür</p>
                    <p className="text-sm">
                      {selectedCampaign.type === "single"
                        ? "📧 Tekil Bildirim"
                        : selectedCampaign.type === "bulk"
                          ? "👥 Toplu Bildirim"
                          : "⏰ Zamanlanmış Bildirim"}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Durum</p>
                    <Badge className={getStatusColor(selectedCampaign.status)}>
                      {getStatusLabel(selectedCampaign.status)}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-600">Toplam</p>
                      <p className="text-lg font-bold">{selectedCampaign.total_recipients}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-green-600">Gönderildi</p>
                      <p className="text-lg font-bold text-green-700">
                        {selectedCampaign.sent_count}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <p className="text-xs text-red-600">Başarısız</p>
                      <p className="text-lg font-bold text-red-700">
                        {selectedCampaign.failed_count}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-600">Başarı %</p>
                      <p className="text-lg font-bold text-blue-700">
                        {selectedCampaign.total_recipients > 0
                          ? Math.round(
                              (selectedCampaign.sent_count / selectedCampaign.total_recipients) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 pt-2 border-t text-xs">
                    <div>
                      <p className="text-gray-600">Oluşturulma</p>
                      <p className="font-medium">
                        {format(new Date(selectedCampaign.created_at), "dd MMMM yyyy HH:mm", {
                          locale: tr
                        })}
                      </p>
                    </div>
                    {selectedCampaign.sent_at && (
                      <div>
                        <p className="text-gray-600">Gönderilme</p>
                        <p className="font-medium">
                          {format(new Date(selectedCampaign.sent_at), "dd MMMM yyyy HH:mm", {
                            locale: tr
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="sticky top-0 text-center py-12">
                <p className="text-sm text-gray-500">Detayları görmek için bir kampanya seçin</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
