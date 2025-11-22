"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription
} from "@/components/ui/empty";
import { Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ops/confirmation-dialog";
import { showToast } from "@/lib/toast-utils";

interface Anomaly {
  id: string;
  user_id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  resolved_at?: string;
}

const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
};

export default function AnomaliesPage() {
  const queryClient = useQueryClient();
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("active");
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    anomalyId?: string;
  }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["anomalies", severity, status, offset],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (severity) params.append("severity", severity);
      params.append("status", status);

      const res = await fetch(`/api/ops/shadow/anomalies?${params}`);
      if (!res.ok) throw new Error("Failed to fetch anomalies");
      return res.json();
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const res = await fetch(`/api/ops/shadow/anomalies/${anomalyId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: "resolved_by_ops",
          notes: "Resolved by operations team"
        })
      });
      if (!res.ok) throw new Error("Failed to resolve anomaly");
      return res.json();
    },
    onSuccess: () => {
      showToast.success("✓ Anomali başarıyla çözüldü");
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      setConfirmDialog({ open: false });
    },
    onError: () => {
      showToast.error("✕ Anomali çözülemedi");
    }
  });

  const handleResolveClick = (anomalyId: string) => {
    setConfirmDialog({ open: true, anomalyId });
  };

  const handleConfirmResolve = () => {
    if (confirmDialog.anomalyId) {
      resolveMutation.mutate(confirmDialog.anomalyId);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const anomalies = data?.data || [];
  const total = data?.total || 0;
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Anomali Yönetimi</h1>
        <p className="text-muted-foreground mt-2">Güvenlik anomalilerini izleyin ve çözün</p>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Önem Derecesi</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tüm Önem Dereceleri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Durum</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Durum Seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="resolved">Çözüldü</SelectItem>
                <SelectItem value="all">Tümü</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Anomaliler Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>Anomaliler</CardTitle>
          <CardDescription>
            {anomalies.length} / {total} anomali gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Yükleniyor...</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kullanıcı ID</TableHead>
                      <TableHead>Uyarı Türü</TableHead>
                      <TableHead>Önem Derecesi</TableHead>
                      <TableHead>Mesaj</TableHead>
                      <TableHead>Oluşturma Tarihi</TableHead>
                      <TableHead className="w-24">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <Empty>
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <Shield className="h-6 w-6 text-muted-foreground" />
                              </EmptyMedia>
                              <EmptyTitle>Anomali Bulunamadı</EmptyTitle>
                              <EmptyDescription>
                                Şu anda hiçbir güvenlik anomalisi bulunmamaktadır
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        </TableCell>
                      </TableRow>
                    ) : (
                      anomalies.map((anomaly: Anomaly) => (
                        <TableRow key={anomaly.id}>
                          <TableCell className="font-mono text-xs">
                            {anomaly.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-sm">
                            {anomaly.alert_type.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                SEVERITY_COLORS[anomaly.severity as keyof typeof SEVERITY_COLORS] ||
                                SEVERITY_COLORS.low
                              }
                            >
                              {anomaly.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">
                            {anomaly.message}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(anomaly.created_at)}
                          </TableCell>
                          <TableCell>
                            {!anomaly.resolved_at && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveClick(anomaly.id)}
                                disabled={resolveMutation.isPending}
                              >
                                {resolveMutation.isPending ? "..." : "Çöz"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Sayfalandırma */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Sayfa {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={page >= totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
          title="Anomaliyi Çöz"
          description="Bu güvenlik anomalisini çözüldü olarak işaretlemek istediğinizden emin misiniz?"
          confirmText="Çöz"
          cancelText="İptal"
          onConfirm={handleConfirmResolve}
          isLoading={resolveMutation.isPending}
          isDangerous
        />
      </Card>
    </div>
  );
}
