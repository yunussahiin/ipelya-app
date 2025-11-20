"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { AlertCircle, Trash2, Archive, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CleanupStats {
  totalNotifications: number;
  oldNotifications: number;
  totalCampaigns: number;
  sentCampaigns: number;
  archivedCampaigns: number;
}

interface ArchivedCampaign {
  id: string;
  title: string;
  type: "single" | "bulk" | "scheduled";
  created_at: string;
  updated_at: string;
  total_recipients: number;
  sent_count: number;
}

export default function NotificationCleanup() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "delete" | "archive" | null;
  }>({
    open: false,
    type: null
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const supabase = createBrowserSupabaseClient();

      // Get total notifications
      const { count: totalNotifCount, error: allNotifsError } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true });

      if (allNotifsError) throw allNotifsError;

      // Get old notifications (30+ days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: oldNotifCount, error: oldNotifsError } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .lt("created_at", thirtyDaysAgo);

      if (oldNotifsError) throw oldNotifsError;

      // Get total campaigns
      const { count: totalCampaignCount, error: allCampaignsError } = await supabase
        .from("notification_campaigns")
        .select("id", { count: "exact", head: true });

      if (allCampaignsError) throw allCampaignsError;

      // Get sent campaigns
      const { count: sentCampaignCount, error: sentCampaignsError } = await supabase
        .from("notification_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent");

      if (sentCampaignsError) throw sentCampaignsError;

      // Get archived campaigns
      const { count: archivedCampaignCount, error: archivedCampaignsError } = await supabase
        .from("notification_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("status", "archived");

      if (archivedCampaignsError) throw archivedCampaignsError;

      setStats({
        totalNotifications: totalNotifCount || 0,
        oldNotifications: oldNotifCount || 0,
        totalCampaigns: totalCampaignCount || 0,
        sentCampaigns: sentCampaignCount || 0,
        archivedCampaigns: archivedCampaignCount || 0
      });
    } catch (err) {
      console.error("Error loading stats:", err);
      toast.error("İstatistikler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotifications = async () => {
    try {
      setCleaning(true);
      const supabase = createBrowserSupabaseClient();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .lt("created_at", thirtyDaysAgo);

      if (deleteError) throw deleteError;

      toast.success("✓ Eski bildirimler başarıyla silindi!");
      setLastCleanup(new Date().toLocaleString("tr-TR"));
      setConfirmDialog({ open: false, type: null });
      await loadStats();
    } catch (err) {
      console.error("Error deleting notifications:", err);
      toast.error("✕ Bildirim silme işlemi sırasında hata oluştu!");
    } finally {
      setCleaning(false);
    }
  };

  const handleArchiveCampaigns = async () => {
    try {
      setCleaning(true);
      const supabase = createBrowserSupabaseClient();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: archiveError } = await supabase
        .from("notification_campaigns")
        .update({ status: "archived" })
        .lt("created_at", thirtyDaysAgo)
        .eq("status", "sent");

      if (archiveError) throw archiveError;

      toast.success("✓ Eski kampanyalar başarıyla arşivlendi!");
      setLastCleanup(new Date().toLocaleString("tr-TR"));
      setConfirmDialog({ open: false, type: null });
      await loadStats();
    } catch (err) {
      console.error("Error archiving campaigns:", err);
      toast.error("✕ Kampanya arşivleme işlemi sırasında hata oluştu!");
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bildirim Temizliği</h1>
        <p className="text-gray-500 mt-1">Eski bildirimleri ve kampanyaları yönetin</p>
      </div>

      {/* Warning Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-900">Uyarı</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-orange-800">
          <p>
            Temizlik işlemi 30 günden eski bildirimleri kalıcı olarak silecek ve eski kampanyaları
            arşivleyecektir. Bu işlem geri alınamaz. Lütfen dikkatli olun.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Bildirim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotifications.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Veritabanında</p>
            </CardContent>
          </Card>

          {/* Old Notifications */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Silinecek Bildirim</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.oldNotifications.toLocaleString()}
              </div>
              <p className="text-xs text-red-500 mt-1">30+ gün eski</p>
            </CardContent>
          </Card>

          {/* Total Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam Kampanya</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Veritabanında</p>
            </CardContent>
          </Card>

          {/* Sent Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gönderilen Kampanya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sentCampaigns.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Arşivlenebilir</p>
            </CardContent>
          </Card>

          {/* Archived Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Arşivlenen Kampanya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.archivedCampaigns.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Arşivde</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cleanup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delete Old Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <CardTitle>Eski Bildirimleri Sil</CardTitle>
            </div>
            <CardDescription>30 günden eski bildirimleri kalıcı olarak sil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>
                <strong>{stats?.oldNotifications.toLocaleString()}</strong> eski bildirim
                silinecektir.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Bu işlem geri alınamaz. Lütfen dikkatli olun.
              </p>
            </div>
            <Button
              onClick={() => setConfirmDialog({ open: true, type: "delete" })}
              disabled={cleaning || !stats || stats.oldNotifications === 0}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {cleaning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Archive Old Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-blue-600" />
              <CardTitle>Eski Kampanyaları Arşivle</CardTitle>
            </div>
            <CardDescription>30 günden eski gönderilen kampanyaları arşivle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>
                <strong>{stats?.sentCampaigns.toLocaleString()}</strong> kampanya arşivlenecektir.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Arşivlenen kampanyalar hala görüntülenebilir ancak düzenlenemez.
              </p>
            </div>
            <Button
              onClick={() => setConfirmDialog({ open: true, type: "archive" })}
              disabled={cleaning || !stats || stats.sentCampaigns === 0}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {cleaning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Arşivleniyor...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Arşivle
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Last Cleanup Info */}
      {lastCleanup && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Son Temizlik</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-green-800">
            <p>
              Son temizlik işlemi: <strong>{lastCleanup}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Temizlik İşlemi Hakkında</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Ne yapılır?</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>30 günden eski tüm bildirimler kalıcı olarak silinir</li>
              <li>30 günden eski gönderilen kampanyalar arşivlenir</li>
              <li>Arşivlenen kampanyalar hala sorgulanabilir</li>
              <li>Veritabanı boyutu azalır ve performans iyileşir</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Ne silinmez?</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>30 günden yeni bildirimler</li>
              <li>Zamanlanmış kampanyalar</li>
              <li>Başarısız kampanyalar</li>
              <li>Taslak kampanyalar</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Öneriler</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Temizlik işlemini düzenli olarak çalıştırın (haftalık/aylık)</li>
              <li>Önemli kampanya verilerini önceden yedekleyin</li>
              <li>Temizlik işlemini yoğun saatlarda çalıştırmayın</li>
              <li>İşlem tamamlandıktan sonra analytics'i yenileyin</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === "delete" ? "Bildirimleri Sil" : "Kampanyaları Arşivle"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "delete"
                ? `${stats?.oldNotifications.toLocaleString()} eski bildirim kalıcı olarak silinecektir. Bu işlem geri alınamaz.`
                : `${stats?.sentCampaigns.toLocaleString()} kampanya arşivlenecektir. Arşivlenen kampanyalar hala görüntülenebilir ancak düzenlenemez.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: null })}
              disabled={cleaning}
            >
              İptal
            </Button>
            <Button
              onClick={() => {
                if (confirmDialog.type === "delete") {
                  handleDeleteNotifications();
                } else if (confirmDialog.type === "archive") {
                  handleArchiveCampaigns();
                }
              }}
              disabled={cleaning}
              className={
                confirmDialog.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {cleaning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : confirmDialog.type === "delete" ? (
                "Sil"
              ) : (
                "Arşivle"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
