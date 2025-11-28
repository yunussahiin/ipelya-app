"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Mail, HardDrive, FileText, ExternalLink, FolderOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatFileSize } from "@ipelya/types";

import { TopUser } from "./user-columns";

interface BucketStat {
  bucket_id: string;
  bucket_name: string;
  file_count: number;
  total_size: number;
}

interface UserDetailDialogProps {
  user: TopUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getRoleBadge = (role: string) => {
  switch (role) {
    case "admin":
      return (
        <Badge className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Admin</Badge>
      );
    case "creator":
      return (
        <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
          Creator
        </Badge>
      );
    default:
      return <Badge variant="secondary">User</Badge>;
  }
};

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
  const router = useRouter();
  const [bucketStats, setBucketStats] = useState<BucketStat[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  // Fetch user bucket stats
  const fetchBucketStats = useCallback(async (userId: string) => {
    setLoadingBuckets(true);
    try {
      const res = await fetch(`/api/ops/storage/analytics/user/${userId}`);
      const data = await res.json();
      setBucketStats(data.bucketStats || []);
    } catch (error) {
      console.error("Error fetching bucket stats:", error);
    } finally {
      setLoadingBuckets(false);
    }
  }, []);

  // Fetch when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchBucketStats(user.user_id);
    }
  }, [open, user, fetchBucketStats]);

  if (!user) return null;

  const avgFileSize = user.file_count > 0 ? user.total_size / user.file_count : 0;

  const handleBucketClick = (bucketId: string) => {
    // Navigate to storage page with bucket and user path
    router.push(`/ops/storage?bucket=${bucketId}&path=${user.user_id}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kullanıcı Detayları</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">@{user.username}</h3>
                {getRoleBadge(user.role)}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>

          <Separator />

          {/* Storage Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{user.file_count.toLocaleString("tr-TR")}</p>
              <p className="text-xs text-muted-foreground">Dosya</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <HardDrive className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatFileSize(user.total_size)}</p>
              <p className="text-xs text-muted-foreground">Toplam</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatFileSize(avgFileSize)}</p>
              <p className="text-xs text-muted-foreground">Ortalama</p>
            </div>
          </div>

          <Separator />

          {/* Bucket Stats */}
          <div>
            <h4 className="text-sm font-medium mb-3">Bucket Bazlı Depolama</h4>
            {loadingBuckets ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : bucketStats.length > 0 ? (
              <ScrollArea className="h-[180px]">
                <div className="space-y-2">
                  {bucketStats.map((bucket) => (
                    <button
                      key={bucket.bucket_id}
                      onClick={() => handleBucketClick(bucket.bucket_id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{bucket.bucket_name}</p>
                          <p className="text-xs text-muted-foreground">{bucket.file_count} dosya</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatFileSize(bucket.total_size)}</p>
                        <p className="text-xs text-muted-foreground">Tıkla → Gör</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Bu kullanıcının dosyası yok
              </p>
            )}
          </div>

          <Separator />

          {/* User ID */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1">User ID</p>
            <code className="text-sm font-mono">{user.user_id}</code>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`/ops/users/${user.user_id}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Kullanıcı Sayfası
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
