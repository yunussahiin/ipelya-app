"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, HardDrive, File, Users, TrendingUp, RefreshCw, Loader2 } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { StorageBucket } from "@ipelya/types";
import { formatFileSize } from "@ipelya/types";

import { DataTable } from "./components/data-table";
import { bucketColumns, BucketStat } from "./components/bucket-columns";
import { userColumns, TopUser } from "./components/user-columns";
import { UserDetailDialog } from "./components/user-detail-dialog";

interface StorageStats {
  totalBuckets: number;
  totalFiles: number;
  totalSize: number;
  bucketStats: BucketStat[];
}

export default function StorageAnalyticsPage() {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TopUser | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    console.log("[Storage Analytics] Fetching storage data...");
    try {
      const response = await fetch("/api/ops/storage?stats=true");
      console.log("[Storage Analytics] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Storage Analytics] Error response:", errorText);
        throw new Error("Failed to fetch storage data");
      }

      const data = await response.json();
      console.log("[Storage Analytics] Buckets count:", data.buckets?.length || 0);
      console.log("[Storage Analytics] Stats:", data.stats);

      setBuckets(data.buckets || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("[Storage Analytics] Error fetching storage data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    }
  }, []);

  // Fetch top users
  const fetchTopUsers = useCallback(async () => {
    console.log("[Storage Analytics] Fetching top users...");
    try {
      const response = await fetch("/api/ops/storage/analytics/top-users");
      console.log("[Storage Analytics] Top users response status:", response.status);

      if (!response.ok) {
        console.warn("[Storage Analytics] Top users endpoint returned:", response.status);
        return;
      }

      const data = await response.json();
      console.log("[Storage Analytics] Top users count:", data.users?.length || 0);
      console.log("[Storage Analytics] Top users data:", data.users);

      setTopUsers(data.users || []);
    } catch (error) {
      console.error("[Storage Analytics] Error fetching top users:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchData(), fetchTopUsers()]);
      setLoading(false);
    };
    init();
  }, [fetchData, fetchTopUsers]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchTopUsers()]);
    setRefreshing(false);
    toast.success("Yenilendi");
  };

  // Handle user click
  const handleUserClick = (user: TopUser) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
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
        <div className="flex items-center gap-2">
          <NextLink href="/ops/storage">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </NextLink>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Storage Analytics</h1>
            <p className="text-sm text-muted-foreground">Depolama kullanımı ve istatistikleri</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Bucket
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBuckets || buckets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Dosya
            </CardTitle>
            <File className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFiles || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Boyut
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalSize ? formatFileSize(stats.totalSize) : "0 B"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Public Bucket
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buckets.filter((b) => b.public).length} / {buckets.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bucket Details - DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Bucket Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={bucketColumns}
            data={stats?.bucketStats || []}
            isLoading={loading}
            searchPlaceholder="Bucket ara..."
            searchColumn="bucketName"
          />
        </CardContent>
      </Card>

      {/* Top Users - DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>En Çok Depolama Kullanan Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={userColumns}
            data={topUsers}
            isLoading={loading}
            searchPlaceholder="Kullanıcı ara (username, email, ID)..."
            searchColumn="username"
            onRowClick={handleUserClick}
          />
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <UserDetailDialog
        user={selectedUser}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
      />
    </div>
  );
}
