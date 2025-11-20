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
  const [archivedCampaigns, setArchivedCampaigns] = useState<ArchivedCampaign[]>([]);
  const [toArchiveCampaigns, setToArchiveCampaigns] = useState<ArchivedCampaign[]>([]);
  const [selectedArchived, setSelectedArchived] = useState<string | null>(null);
  const [daysUntilCleanup, setDaysUntilCleanup] = useState<number>(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "delete" | "archive" | "unarchive" | null;
  }>({
    open: false,
    type: null
  });

  // Calculate days until next cleanup (02:00 UTC daily)
  useEffect(() => {
    const calculateDaysUntilCleanup = () => {
      const now = new Date();
      const nextCleanup = new Date(now);
      nextCleanup.setUTCHours(2, 0, 0, 0);

      // If 02:00 UTC has already passed today, set to tomorrow
      if (nextCleanup <= now) {
        nextCleanup.setDate(nextCleanup.getDate() + 1);
      }

      const diffMs = nextCleanup.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setDaysUntilCleanup(diffDays);
    };

    calculateDaysUntilCleanup();
    const interval = setInterval(calculateDaysUntilCleanup, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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

      // Get archived campaigns data
      const { data: archivedData, error: archivedDataError } = await supabase
        .from("notification_campaigns")
        .select("id, title, type, created_at, updated_at, total_recipients, sent_count")
        .eq("status", "archived")
        .order("updated_at", { ascending: false });

      if (archivedDataError) throw archivedDataError;

      // Get campaigns to be archived (30+ days old, sent status)
      const thirtyDaysAgoForArchive = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: toArchiveData, error: toArchiveError } = await supabase
        .from("notification_campaigns")
        .select("id, title, type, created_at, updated_at, total_recipients, sent_count")
        .lt("created_at", thirtyDaysAgoForArchive)
        .eq("status", "sent")
        .order("created_at", { ascending: false });

      if (toArchiveError) throw toArchiveError;

      setStats({
        totalNotifications: totalNotifCount || 0,
        oldNotifications: oldNotifCount || 0,
        totalCampaigns: totalCampaignCount || 0,
        sentCampaigns: sentCampaignCount || 0,
        archivedCampaigns: archivedCampaignCount || 0
      });

      setArchivedCampaigns(archivedData || []);
      setToArchiveCampaigns(toArchiveData || []);
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

  const handleUnarchiveCampaign = async () => {
    if (!selectedArchived) return;

    try {
      setCleaning(true);
      const supabase = createBrowserSupabaseClient();

      const { error: unarchiveError } = await supabase
        .from("notification_campaigns")
        .update({ status: "sent" })
        .eq("id", selectedArchived);

      if (unarchiveError) throw unarchiveError;

      toast.success("✓ Kampanya arşivden başarıyla çıkarıldı!");
      setConfirmDialog({ open: false, type: null });
      setSelectedArchived(null);
      await loadStats();
    } catch (err) {
      console.error("Error unarchiving campaign:", err);
      toast.error("✕ Kampanya arşivden çıkarma işlemi sırasında hata oluştu!");
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bildirim Temizliği</h1>
        <p className="text-muted-foreground mt-1">Eski bildirimleri ve kampanyaları yönetin</p>
      </div>

      {/* Warning Card */}
      <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <CardTitle className="text-orange-900 dark:text-orange-100">Uyarı</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-orange-800 dark:text-orange-200">
          <p>
            Manuel temizlik işlemi 30 günden eski bildirimleri kalıcı olarak silecek ve eski
            kampanyaları arşivleyecektir. Bu işlem geri alınamaz. Lütfen dikkatli olun.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Bildirim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotifications.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Veritabanında</p>
            </CardContent>
          </Card>

          {/* Old Notifications */}
          <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
                Silinecek Bildirim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.oldNotifications.toLocaleString()}
              </div>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">30+ gün eski</p>
            </CardContent>
          </Card>

          {/* Total Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Kampanya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Veritabanında</p>
            </CardContent>
          </Card>

          {/* Sent Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gönderilen Kampanya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sentCampaigns.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Arşivlenebilir</p>
            </CardContent>
          </Card>

          {/* Archived Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Arşivlenen Kampanya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.archivedCampaigns.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Arşivde</p>
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
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle>Eski Bildirimleri Sil</CardTitle>
            </div>
            <CardDescription>30 günden eski bildirimleri kalıcı olarak sil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-foreground">
              <p>
                <strong>{stats?.oldNotifications.toLocaleString()}</strong> eski bildirim
                silinecektir.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
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
              <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle>Eski Kampanyaları Arşivle</CardTitle>
            </div>
            <CardDescription>30 günden eski gönderilen kampanyaları arşivle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-foreground">
              <p>
                <strong>{stats?.sentCampaigns.toLocaleString()}</strong> kampanya arşivlenecektir.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
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
        <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-green-900 dark:text-green-100">Son Temizlik</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-green-800 dark:text-green-200">
            <p>
              Son temizlik işlemi: <strong>{lastCleanup}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Archived Campaigns */}
      {archivedCampaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arşivlenen Kampanyalar</CardTitle>
            <CardDescription>{archivedCampaigns.length} kampanya arşivde</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {archivedCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-3 bg-muted rounded-lg border border-border flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{campaign.title}</p>
                    <div className="text-xs text-muted-foreground mt-1 space-y-1">
                      <p>
                        Tür:{" "}
                        {campaign.type === "single"
                          ? "Tekil"
                          : campaign.type === "bulk"
                            ? "Toplu"
                            : "Zamanlanmış"}
                      </p>
                      <p>
                        Arşivleme:{" "}
                        {new Date(campaign.updated_at).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      <p>
                        İletim: {campaign.sent_count} / {campaign.total_recipients}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedArchived(campaign.id);
                      setConfirmDialog({ open: true, type: "unarchive" });
                    }}
                    className="ml-2"
                  >
                    Çıkar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Cleanup Info */}
      <Card>
        <CardHeader>
          <CardTitle>Otomatik Temizlik Sistemi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Silinecek Bildirimler</p>
              <p className="text-2xl font-bold text-primary mt-1">30+ gün</p>
              <p className="text-xs text-muted-foreground mt-1">Otomatik silme süresi</p>
            </div>
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Arşivlenecek Kampanyalar</p>
              <p className="text-2xl font-bold text-primary mt-1">30+ gün</p>
              <p className="text-xs text-muted-foreground mt-1">Otomatik arşivleme süresi</p>
            </div>
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">Sonraki Temizlik</p>
              <p className="text-2xl font-bold text-primary mt-1">{daysUntilCleanup} gün</p>
              <p className="text-xs text-muted-foreground mt-1">02:00 UTC&apos;de çalışacak</p>
            </div>
          </div>
          <div className="text-xs text-foreground bg-muted p-3 rounded-lg border border-border">
            <p className="font-semibold mb-1">📌 Nasıl çalışır?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Her gün 02:00 UTC&apos;de otomatik temizlik başlar</li>
              <li>30+ gün eski tüm bildirimler silinir</li>
              <li>30+ gün eski gönderilen kampanyalar arşivlenir</li>
              <li>Arşivlenen kampanyalar hala sorgulanabilir</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Temizlik İşlemi Hakkında</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground">
          <div>
            <h4 className="font-semibold mb-2">Ne yapılır?</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>30 günden eski tüm bildirimler kalıcı olarak silinir</li>
              <li>30 günden eski gönderilen kampanyalar arşivlenir</li>
              <li>Arşivlenen kampanyalar hala sorgulanabilir</li>
              <li>Veritabanı boyutu azalır ve performans iyileşir</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Ne silinmez?</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>30 günden yeni bildirimler</li>
              <li>Zamanlanmış kampanyalar</li>
              <li>Başarısız kampanyalar</li>
              <li>Taslak kampanyalar</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Öneriler</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Temizlik işlemini düzenli olarak çalıştırın (haftalık/aylık)</li>
              <li>Önemli kampanya verilerini önceden yedekleyin</li>
              <li>Temizlik işlemini yoğun saatlarda çalıştırmayın</li>
              <li>İşlem tamamlandıktan sonra analytics&apos;i yenileyin</li>
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
              {confirmDialog.type === "delete"
                ? "Bildirimleri Sil"
                : confirmDialog.type === "archive"
                  ? "Kampanyaları Arşivle"
                  : "Kampanyayı Arşivden Çıkar"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === "delete"
                ? `${stats?.oldNotifications.toLocaleString()} eski bildirim kalıcı olarak silinecektir. Bu işlem geri alınamaz.`
                : confirmDialog.type === "archive"
                  ? `${stats?.sentCampaigns.toLocaleString()} kampanya arşivlenecektir. Arşivlenen kampanyalar hala görüntülenebilir ancak düzenlenemez.`
                  : `Seçili kampanya arşivden çıkarılacak ve yeniden düzenlenebilir hale gelecektir.`}
            </DialogDescription>
            {confirmDialog.type === "archive" && stats?.sentCampaigns ? (
              <div className="mt-4 p-3 bg-muted rounded-lg border border-border max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold mb-2">
                  Arşivlenecek Kampanyalar ({toArchiveCampaigns.length}):
                </p>
                <div className="space-y-2">
                  {toArchiveCampaigns.length > 0 ? (
                    toArchiveCampaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="text-xs p-2 bg-card rounded border border-border"
                      >
                        <p className="font-medium">{campaign.title}</p>
                        <div className="text-muted-foreground mt-1 space-y-0.5">
                          <p>
                            Tür:{" "}
                            {campaign.type === "single"
                              ? "Tekil"
                              : campaign.type === "bulk"
                                ? "Toplu"
                                : "Zamanlanmış"}
                          </p>
                          <p>
                            Oluşturma: {new Date(campaign.created_at).toLocaleDateString("tr-TR")}
                          </p>
                          <p>
                            İletim: {campaign.sent_count} / {campaign.total_recipients}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      30 günden eski ve &quot;sent&quot; status&apos;unda kampanya bulunamadı.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
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
                } else if (confirmDialog.type === "unarchive") {
                  handleUnarchiveCampaign();
                }
              }}
              disabled={cleaning}
              className={
                confirmDialog.type === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : confirmDialog.type === "archive"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
              }
            >
              {cleaning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : confirmDialog.type === "delete" ? (
                "Sil"
              ) : confirmDialog.type === "archive" ? (
                "Arşivle"
              ) : (
                "Çıkar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
