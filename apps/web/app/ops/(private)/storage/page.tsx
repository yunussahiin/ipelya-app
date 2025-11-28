"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  Folder,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File,
  Download,
  Link,
  Trash2,
  RefreshCw,
  Loader2,
  HardDrive,
  Search,
  User,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StorageBucket } from "@ipelya/types";
import { formatFileSize, getFileCategory } from "@ipelya/types";

interface FileOwner {
  username: string;
  email: string;
  avatar_url: string | null;
  role?: "user" | "creator" | "admin";
}

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
  owner?: FileOwner | null;
}

interface Column {
  bucketId: string;
  path: string;
  files: StorageFile[];
  loading: boolean;
}

export default function StoragePage() {
  const [buckets, setBuckets] = useState<StorageBucket[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setUserMap] = useState<Record<string, FileOwner>>({});
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fetch buckets
  const fetchBuckets = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/storage?stats=true");
      if (!response.ok) throw new Error("Failed to fetch buckets");
      const data = await response.json();
      setBuckets(data.buckets || []);
      return data.buckets || [];
    } catch (error) {
      console.error("Error fetching buckets:", error);
      toast.error("Bucket'lar yüklenirken hata oluştu");
      return [];
    }
  }, []);

  // Fetch files in path
  const fetchFiles = useCallback(
    async (bucketId: string, path: string = ""): Promise<StorageFile[]> => {
      try {
        const params = new URLSearchParams({ path });
        const response = await fetch(`/api/ops/storage/${bucketId}?${params}`);
        if (!response.ok) throw new Error("Failed to fetch files");
        const data = await response.json();
        // Update userMap with new users
        if (data.userMap) {
          setUserMap((prev) => ({ ...prev, ...data.userMap }));
        }
        return data.files || [];
      } catch (error) {
        console.error("Error fetching files:", error);
        toast.error("Dosyalar yüklenirken hata oluştu");
        return [];
      }
    },
    []
  );

  // Initial load with URL params support
  useEffect(() => {
    const init = async () => {
      if (initialLoadDone) return;

      setLoading(true);
      const loadedBuckets = await fetchBuckets();

      // Check URL params for direct navigation
      const urlParams = new URLSearchParams(window.location.search);
      const bucketParam = urlParams.get("bucket");
      const pathParam = urlParams.get("path");

      if (bucketParam && loadedBuckets.length > 0) {
        const targetBucket = loadedBuckets.find((b: StorageBucket) => b.id === bucketParam);
        if (targetBucket) {
          // Navigate to bucket
          const files = await fetchFiles(targetBucket.id, "");
          setColumns([{ bucketId: targetBucket.id, path: "", files, loading: false }]);

          // If path param exists, navigate to that path
          if (pathParam) {
            const pathFiles = await fetchFiles(targetBucket.id, pathParam);
            setColumns([
              { bucketId: targetBucket.id, path: "", files, loading: false },
              { bucketId: targetBucket.id, path: pathParam, files: pathFiles, loading: false }
            ]);
            // Set search query to filter by user
            setSearchQuery(pathParam);
          }
        }
      }

      setLoading(false);
      setInitialLoadDone(true);
    };
    init();
  }, [fetchBuckets, fetchFiles, initialLoadDone]);

  // Handle bucket click
  const handleBucketClick = async (bucket: StorageBucket) => {
    setSelectedFile(null);
    setPreviewUrl(null);

    // Create first column with bucket files
    setColumns([{ bucketId: bucket.id, path: "", files: [], loading: true }]);

    const files = await fetchFiles(bucket.id, "");
    setColumns([{ bucketId: bucket.id, path: "", files, loading: false }]);
  };

  // Handle folder click
  const handleFolderClick = async (columnIndex: number, file: StorageFile) => {
    if (!file.isFolder) return;

    const column = columns[columnIndex];
    const newPath = column.path ? `${column.path}/${file.name}` : file.name;

    // Remove columns after current one and add new column
    const newColumns = columns.slice(0, columnIndex + 1);
    newColumns.push({ bucketId: column.bucketId, path: newPath, files: [], loading: true });
    setColumns(newColumns);
    setSelectedFile(null);
    setPreviewUrl(null);

    const files = await fetchFiles(column.bucketId, newPath);
    setColumns((prev) => {
      const updated = [...prev];
      if (updated[columnIndex + 1]) {
        updated[columnIndex + 1] = { ...updated[columnIndex + 1], files, loading: false };
      }
      return updated;
    });
  };

  // Handle file click
  const handleFileClick = async (file: StorageFile) => {
    if (file.isFolder) return;

    setSelectedFile(file);
    setPreviewUrl(null);

    // Get signed URL for preview
    try {
      const response = await fetch(`/api/ops/storage/${file.bucketId}/signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: file.fullPath, expiresIn: 3600 })
      });

      if (response.ok) {
        const { signedUrl } = await response.json();
        setPreviewUrl(signedUrl);
      }
    } catch (error) {
      console.error("Preview URL error:", error);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (columns.length > 0) {
      setColumns([]);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBuckets();
    if (columns.length > 0) {
      const lastColumn = columns[columns.length - 1];
      const files = await fetchFiles(lastColumn.bucketId, lastColumn.path);
      setColumns((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], files };
        return updated;
      });
    }
    setRefreshing(false);
    toast.success("Yenilendi");
  };

  // Handle download
  const handleDownload = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
      toast.success("İndirme başlatıldı");
    }
  };

  // Handle copy URL
  const handleCopyUrl = async () => {
    if (previewUrl) {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("URL kopyalandı");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedFile) return;

    if (!confirm(`"${selectedFile.name}" dosyasını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ops/storage/${selectedFile.bucketId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: [selectedFile.fullPath] })
      });

      if (!response.ok) throw new Error("Failed to delete file");

      toast.success("Dosya silindi");
      setSelectedFile(null);
      setPreviewUrl(null);

      // Refresh current column
      if (columns.length > 0) {
        const lastColumn = columns[columns.length - 1];
        const files = await fetchFiles(lastColumn.bucketId, lastColumn.path);
        setColumns((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], files };
          return updated;
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Dosya silinemedi");
    }
  };

  // Get file icon
  const getFileIcon = (file: StorageFile) => {
    if (file.isFolder) return Folder;
    const category = file.metadata?.mimetype ? getFileCategory(file.metadata.mimetype) : "other";
    switch (category) {
      case "image":
        return ImageIcon;
      case "video":
        return Video;
      case "audio":
        return Music;
      case "document":
        return FileText;
      default:
        return File;
    }
  };

  // Get file icon color
  const getFileIconColor = (file: StorageFile) => {
    if (file.isFolder) return "text-sky-500";
    const category = file.metadata?.mimetype ? getFileCategory(file.metadata.mimetype) : "other";
    switch (category) {
      case "image":
        return "text-green-500";
      case "video":
        return "text-purple-500";
      case "audio":
        return "text-orange-500";
      case "document":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Current bucket name
  const currentBucketName =
    columns.length > 0 ? buckets.find((b) => b.id === columns[0].bucketId)?.name : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {columns.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{currentBucketName || "Storage"}</h1>
            {columns.length > 0 && columns[columns.length - 1].path && (
              <p className="text-sm text-muted-foreground font-mono">
                /{columns[columns.length - 1].path}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Main Content */}
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* File Browser */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          {/* Search Bar - only show when inside a bucket */}
          {columns.length > 0 && (
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Klasör veya dosya ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : columns.length === 0 ? (
            // Bucket list
            <ScrollArea className="flex-1">
              <div className="p-2">
                {buckets.map((bucket) => (
                  <button
                    key={bucket.id}
                    onClick={() => handleBucketClick(bucket)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left transition-colors"
                  >
                    <HardDrive className="h-5 w-5 text-primary" />
                    <span className="flex-1 truncate">{bucket.name}</span>
                    {bucket.public && (
                      <Badge variant="secondary" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            // Multi-column file browser
            <div className="flex flex-1 overflow-hidden">
              {columns.map((column, columnIndex) => (
                <div
                  key={`${column.bucketId}-${column.path}`}
                  className={cn(
                    "w-64 border-r border-border shrink-0",
                    columnIndex === columns.length - 1 && "flex-1 min-w-64"
                  )}
                >
                  <ScrollArea className="h-full">
                    <div className="p-1">
                      {column.loading ? (
                        <div className="p-2 space-y-2">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-3 flex-1" />
                            </div>
                          ))}
                        </div>
                      ) : column.files.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          Boş klasör
                        </div>
                      ) : (
                        column.files
                          .filter((file) => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return (
                              file.name.toLowerCase().includes(query) ||
                              file.fullPath.toLowerCase().includes(query) ||
                              file.owner?.username?.toLowerCase().includes(query) ||
                              file.owner?.email?.toLowerCase().includes(query)
                            );
                          })
                          .map((file) => {
                            const FileIcon = getFileIcon(file);
                            const isSelected = selectedFile?.fullPath === file.fullPath;

                            return (
                              <button
                                key={file.id || file.name}
                                onClick={() =>
                                  file.isFolder
                                    ? handleFolderClick(columnIndex, file)
                                    : handleFileClick(file)
                                }
                                className={cn(
                                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors",
                                  "hover:bg-accent",
                                  isSelected && "bg-primary/20"
                                )}
                              >
                                <FileIcon
                                  className={cn("h-4 w-4 shrink-0", getFileIconColor(file))}
                                />
                                <span className="truncate flex-1">{file.name}</span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* File Preview Panel */}
        {selectedFile && (
          <Card className="w-80 shrink-0 flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Preview */}
                {previewUrl && selectedFile.metadata?.mimetype?.startsWith("image/") ? (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt={selectedFile.name} className="w-full h-auto" />
                  </div>
                ) : previewUrl && selectedFile.metadata?.mimetype?.startsWith("video/") ? (
                  <div className="rounded-lg overflow-hidden bg-black">
                    <video src={previewUrl} controls className="w-full" />
                  </div>
                ) : (
                  <div className="h-32 rounded-lg bg-muted flex items-center justify-center">
                    {(() => {
                      const FileIcon = getFileIcon(selectedFile);
                      return (
                        <FileIcon className={cn("h-12 w-12", getFileIconColor(selectedFile))} />
                      );
                    })()}
                  </div>
                )}

                {/* File name */}
                <div>
                  <h3 className="font-semibold break-all">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.metadata?.mimetype || "unknown"}
                    {selectedFile.metadata?.size &&
                      ` - ${formatFileSize(selectedFile.metadata.size)}`}
                  </p>
                </div>

                <Separator />

                {/* Owner Info */}
                {selectedFile.owner && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedFile.owner.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">@{selectedFile.owner.username}</p>
                          {selectedFile.owner.role && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                selectedFile.owner.role === "admin" &&
                                  "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
                                selectedFile.owner.role === "creator" &&
                                  "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                              )}
                            >
                              {selectedFile.owner.role === "admin"
                                ? "Admin"
                                : selectedFile.owner.role === "creator"
                                  ? "Creator"
                                  : "User"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedFile.owner.email}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Metadata */}
                <div className="space-y-3 text-sm">
                  {selectedFile.created_at && (
                    <div>
                      <p className="text-muted-foreground">Added on</p>
                      <p>{new Date(selectedFile.created_at).toLocaleString("tr-TR")}</p>
                    </div>
                  )}
                  {selectedFile.updated_at && (
                    <div>
                      <p className="text-muted-foreground">Last modified</p>
                      <p>{new Date(selectedFile.updated_at).toLocaleString("tr-TR")}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleDownload}
                    disabled={!previewUrl}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={handleCopyUrl}
                    disabled={!previewUrl}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Get URL
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete file
                </Button>
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}
