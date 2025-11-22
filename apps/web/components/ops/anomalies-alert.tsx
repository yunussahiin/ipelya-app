"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription
} from "@/components/ui/empty";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, AlertOctagon } from "lucide-react";
import { toast } from "sonner";

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-50 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
    icon: AlertOctagon,
    color: "text-red-600 dark:text-red-400"
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-950",
    border: "border-orange-200 dark:border-orange-800",
    icon: AlertTriangle,
    color: "text-orange-600 dark:text-orange-400"
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
    icon: AlertCircle,
    color: "text-yellow-600 dark:text-yellow-400"
  },
  low: {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    icon: AlertCircle,
    color: "text-blue-600 dark:text-blue-400"
  }
};

export function AnomaliesAlert() {
  const queryClient = useQueryClient();

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ["anomalies"],
    queryFn: async () => {
      const res = await fetch("/api/ops/shadow/anomalies?limit=10");
      if (!res.ok) throw new Error("Failed to fetch anomalies");
      return res.json();
    },
    refetchInterval: 30000
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
      toast.success("✓ Anomali çözüldü");
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
    },
    onError: () => {
      toast.error("✕ Anomali çözülemedi");
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aktif Anomaliler</CardTitle>
          <CardDescription>Gerçek zamanlı güvenlik uyarıları</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const anomalyList = anomalies?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aktif Anomaliler</CardTitle>
        <CardDescription>{anomalyList.length} aktif uyarı</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalyList.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>Aktif Anomali Yok</EmptyTitle>
              <EmptyDescription>Şu anda hiçbir güvenlik uyarısı bulunmamaktadır</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          anomalyList.map(
            (anomaly: {
              id: string;
              alert_type: string;
              severity: string;
              message: string;
              created_at: string;
            }) => {
              const config =
                SEVERITY_CONFIG[anomaly.severity as keyof typeof SEVERITY_CONFIG] ||
                SEVERITY_CONFIG.low;
              const Icon = config.icon;

              return (
                <div
                  key={anomaly.id}
                  className={`p-4 border rounded-lg ${config.bg} ${config.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 flex-1">
                      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{anomaly.alert_type}</p>
                        <p className="text-sm mt-1 text-foreground">{anomaly.message}</p>
                        <p className="text-xs mt-2 text-muted-foreground">
                          {new Date(anomaly.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveMutation.mutate(anomaly.id)}
                      disabled={resolveMutation.isPending}
                    >
                      {resolveMutation.isPending ? "Çözülüyor..." : "Çöz"}
                    </Button>
                  </div>
                </div>
              );
            }
          )
        )}
      </CardContent>
    </Card>
  );
}
