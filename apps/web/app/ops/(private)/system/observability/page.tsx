"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  BarChart3,
  Layers,
  TrendingUp,
  Server,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import {
  StatsCards,
  OverviewTab,
  TablesTab,
  IndexesTab,
  QueriesTab,
  AdvisorsTab
} from "./components";

import type {
  DatabaseStats,
  TableSize,
  IndexUsage,
  SlowQuery,
  ConnectionStats,
  PerformanceAdvisor
} from "./types";

export default function ObservabilityPage() {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [tableSizes, setTableSizes] = useState<TableSize[]>([]);
  const [indexUsage, setIndexUsage] = useState<IndexUsage[]>([]);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [advisors, setAdvisors] = useState<PerformanceAdvisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch database observability data
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/system/observability");
      if (!response.ok) throw new Error("Failed to fetch observability data");

      const data = await response.json();
      setDbStats(data.database?.stats || null);
      setTableSizes(data.database?.tableSizes || []);
      setIndexUsage(data.database?.indexUsage || []);
      setSlowQueries(data.database?.slowQueries || []);
      setConnectionStats(data.database?.connectionStats || null);
    } catch (error) {
      console.error("Error fetching observability data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    }
  }, []);

  // Fetch performance advisors (placeholder for now)
  const fetchAdvisors = useCallback(async () => {
    try {
      // This would normally come from Supabase MCP get_advisors
      setAdvisors([]);
    } catch (error) {
      console.error("Error fetching advisors:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchData(), fetchAdvisors()]);
      setLoading(false);
    };
    init();
  }, [fetchData, fetchAdvisors]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchAdvisors()]);
    setRefreshing(false);
    toast.success("Yenilendi");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Observability</h1>
          <p className="text-sm text-muted-foreground">
            Sistem performansı ve veritabanı metrikleri
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards dbStats={dbStats} connectionStats={connectionStats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="tables">
            <Layers className="h-4 w-4 mr-2" />
            Tablolar
          </TabsTrigger>
          <TabsTrigger value="indexes">
            <TrendingUp className="h-4 w-4 mr-2" />
            İndeksler
          </TabsTrigger>
          <TabsTrigger value="queries">
            <Server className="h-4 w-4 mr-2" />
            Sorgular
          </TabsTrigger>
          <TabsTrigger value="advisors">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Öneriler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            connectionStats={connectionStats}
            tableSizes={tableSizes}
            indexUsage={indexUsage}
          />
        </TabsContent>

        <TabsContent value="tables">
          <TablesTab tableSizes={tableSizes} />
        </TabsContent>

        <TabsContent value="indexes">
          <IndexesTab indexUsage={indexUsage} />
        </TabsContent>

        <TabsContent value="queries">
          <QueriesTab slowQueries={slowQueries} />
        </TabsContent>

        <TabsContent value="advisors">
          <AdvisorsTab advisors={advisors} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
