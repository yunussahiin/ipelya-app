"use client";

import { useState, useCallback, useEffect } from "react";
import {
  HardDrive,
  RefreshCw,
  ChevronRight,
  Home,
  Search,
  Grid,
  List,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { StorageFileItem } from "./filesystem-item";
import type { StorageBucket, StorageNode, StorageStats } from "@ipelya/types";
import { formatFileSize } from "@ipelya/types";

interface StorageFile {
  id?: string;
  name: string;
  fullPath: string;
  isFolder: boolean;
  publicUrl: string | null;
  bucketId: string;
  metadata?: {
    size?: number;
    mimetype?: string;
    cacheControl?: string;
    lastModified?: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface StorageBrowserProps {
  onFileSelect?: (file: StorageNode) => void;
  onFilePreview?: (file: StorageNode) => void;
}

export function StorageBrowser({ onFileSelect, onFilePreview }: StorageBrowserProps) {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState<StorageBucket | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<StorageNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree");

  // Fetch buckets and stats
  const fetchBuckets = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/storage?stats=true");
      if (!response.ok) throw new Error("Failed to fetch buckets");
      const data = await response.json();
      setBuckets(data.buckets || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching buckets:", error);
      toast.error("Bucket'lar yüklenirken hata oluştu");
    }
  }, []);

  // Fetch files in bucket/path
  const fetchFiles = useCallback(async (bucketId: string, path: string = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ path });
      const response = await fetch(`/api/ops/storage/${bucketId}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Dosyalar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchBuckets();
      setLoading(false);
    };
    init();
  }, [fetchBuckets]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBuckets();
    if (selectedBucket) {
      await fetchFiles(selectedBucket.id, currentPath.join("/"));
    }
    setRefreshing(false);
    toast.success("Yenilendi");
  };

  // Navigate to bucket
  const handleBucketSelect = async (bucket: StorageBucket) => {
    setSelectedBucket(bucket);
    setCurrentPath([]);
    setSelectedFile(null);
    await fetchFiles(bucket.id);
  };

  // Navigate to folder
  const handleFolderNavigate = async (folderName: string) => {
    if (!selectedBucket) return;
    const newPath = [...currentPath, folderName];
    setCurrentPath(newPath);
    await fetchFiles(selectedBucket.id, newPath.join("/"));
  };

  // Navigate back
  const handleNavigateBack = async (index: number) => {
    if (!selectedBucket) return;
    if (index === -1) {
      // Go to bucket root
      setCurrentPath([]);
      await fetchFiles(selectedBucket.id);
    } else {
      const newPath = currentPath.slice(0, index + 1);
      setCurrentPath(newPath);
      await fetchFiles(selectedBucket.id, newPath.join("/"));
    }
  };

  // Go to buckets list
  const handleGoHome = () => {
    setSelectedBucket(null);
    setCurrentPath([]);
    setFiles([]);
    setSelectedFile(null);
  };

  // File actions
  const handleFileSelect = (node: StorageNode) => {
    setSelectedFile(node);
    onFileSelect?.(node);
  };

  const handleFilePreview = (node: StorageNode) => {
    onFilePreview?.(node);
  };

  const handleFileDownload = async (node: StorageNode) => {
    if (!selectedBucket) return;

    try {
      // Get signed URL for download
      const response = await fetch(`/api/ops/storage/${selectedBucket.id}/signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: node.path, expiresIn: 60 })
      });

      if (!response.ok) throw new Error("Failed to get download URL");
      const { signedUrl } = await response.json();

      // Open in new tab to download
      window.open(signedUrl, "_blank");
      toast.success("İndirme başlatıldı");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("İndirme başlatılamadı");
    }
  };

  const handleFileCopyUrl = async (node: StorageNode) => {
    if (!selectedBucket) return;

    try {
      let url: string;

      // For public buckets, use public URL
      if (selectedBucket.public) {
        const file = files.find((f) => f.fullPath === node.path);
        if (file?.publicUrl) {
          url = file.publicUrl;
        } else {
          throw new Error("Public URL not available");
        }
      } else {
        // For private buckets, generate signed URL
        const response = await fetch(`/api/ops/storage/${selectedBucket.id}/signed-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: node.path, expiresIn: 3600 })
        });

        if (!response.ok) throw new Error("Failed to get signed URL");
        const { signedUrl } = await response.json();
        url = signedUrl;
      }

      await navigator.clipboard.writeText(url);
      toast.success("URL kopyalandı");
    } catch (error) {
      console.error("Copy URL error:", error);
      toast.error("URL kopyalanamadı");
    }
  };

  const handleFileDelete = async (node: StorageNode) => {
    if (!selectedBucket) return;

    if (!confirm(`"${node.name}" dosyasını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ops/storage/${selectedBucket.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [node.path] })
      });

      if (!response.ok) throw new Error("Failed to delete file");

      toast.success("Dosya silindi");
      // Refresh file list
      await fetchFiles(selectedBucket.id, currentPath.join("/"));
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Dosya silinemedi");
    }
  };

  // Convert files to StorageNode format
  const filesToNodes = (files: StorageFile[]): StorageNode[] => {
    return files
      .filter((file) => {
        if (!searchQuery) return true;
        return file.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map((file) => ({
        id: file.id || `folder-${file.name}`,
        name: file.name,
        path: file.fullPath,
        type: file.isFolder ? ("folder" as const) : ("file" as const),
        bucketId: file.bucketId,
        metadata: file.metadata
          ? {
              size: file.metadata.size || 0,
              mimetype: file.metadata.mimetype || "application/octet-stream",
              cacheControl: file.metadata.cacheControl,
              lastModified: file.metadata.lastModified
            }
          : undefined,
        createdAt: file.created_at,
        updatedAt: file.updated_at
      }));
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-2 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );

  // Render buckets list
  const renderBucketsList = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {buckets.map((bucket) => {
        const bucketStat = stats?.bucketStats.find((s) => s.bucketId === bucket.id);
        return (
          <Card
            key={bucket.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleBucketSelect(bucket)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="h-5 w-5 text-primary" />
                {bucket.name}
                {bucket.public && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Public
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{bucketStat?.fileCount || 0} dosya</p>
                <p>{formatFileSize(bucketStat?.totalSize || 0)}</p>
                {bucket.file_size_limit && (
                  <p className="text-xs">Max: {formatFileSize(bucket.file_size_limit)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Render file tree
  const renderFileTree = () => {
    const nodes = filesToNodes(files);

    if (nodes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <HardDrive className="h-12 w-12 mb-4 opacity-50" />
          <p>Bu klasör boş</p>
        </div>
      );
    }

    return (
      <ul className="space-y-1">
        {nodes.map((node) => (
          <StorageFileItem
            key={node.id}
            node={node}
            selectedId={selectedFile?.id}
            onSelect={handleFileSelect}
            onPreview={handleFilePreview}
            onDownload={handleFileDownload}
            onCopyUrl={handleFileCopyUrl}
            onDelete={handleFileDelete}
            onNavigate={node.type === "folder" ? () => handleFolderNavigate(node.name) : undefined}
          />
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleGoHome} disabled={!selectedBucket}>
            <Home className="h-4 w-4" />
          </Button>

          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={handleGoHome}
                  className="cursor-pointer hover:text-foreground"
                >
                  Storage
                </BreadcrumbLink>
              </BreadcrumbItem>

              {selectedBucket && (
                <>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {currentPath.length === 0 ? (
                      <BreadcrumbPage>{selectedBucket.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => handleNavigateBack(-1)}
                        className="cursor-pointer hover:text-foreground"
                      >
                        {selectedBucket.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </>
              )}

              {currentPath.map((folder, index) => (
                <span key={folder} className="contents">
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {index === currentPath.length - 1 ? (
                      <BreadcrumbPage>{folder}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        onClick={() => handleNavigateBack(index)}
                        className="cursor-pointer hover:text-foreground"
                      >
                        {folder}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          {selectedBucket && (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Dosya ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
          )}

          {/* View mode toggle */}
          {selectedBucket && (
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "tree" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode("tree")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Refresh */}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      {!selectedBucket && stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Bucket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBuckets}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Dosya
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Boyut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {loading ? (
              renderSkeleton()
            ) : selectedBucket ? (
              <div className="p-4">{renderFileTree()}</div>
            ) : (
              <div className="p-4">{renderBucketsList()}</div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
