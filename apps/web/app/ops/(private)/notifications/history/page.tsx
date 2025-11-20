"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Loader2 } from "lucide-react";

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

export default function NotificationHistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bildirim Geçmişi</h1>
        <p className="text-muted-foreground mt-2">
          Gönderilen ve zamanlanmış bildirimlerin geçmişini görüntüleyin
        </p>
      </div>

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
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                  <div>
                    <p className="text-sm font-semibold">{campaign.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaign.body.substring(0, 50)}...
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Tür</p>
                    <p className="text-sm font-medium capitalize">
                      {campaign.type === "single"
                        ? "Tekil"
                        : campaign.type === "bulk"
                          ? "Toplu"
                          : "Zamanlanmış"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Durum</p>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(campaign.status)}`}
                    >
                      {getStatusLabel(campaign.status)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Alıcılar</p>
                    <p className="text-sm font-medium">
                      {campaign.sent_count}/{campaign.total_recipients}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Tarih</p>
                    <p className="text-sm">
                      {new Date(campaign.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Detay
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
