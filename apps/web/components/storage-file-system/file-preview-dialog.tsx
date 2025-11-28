"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Link,
  Trash2,
  X,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import type { StorageNode } from "@ipelya/types";
import { formatFileSize, getFileCategory } from "@ipelya/types";

interface FilePreviewDialogProps {
  file: StorageNode | null;
  bucketId: string;
  isPublic: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (file: StorageNode) => void;
}

export function FilePreviewDialog({
  file,
  bucketId,
  isPublic,
  open,
  onOpenChange,
  onDelete
}: FilePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get preview URL when file changes
  useEffect(() => {
    if (!file || !open) {
      setPreviewUrl(null);
      return;
    }

    const getPreviewUrl = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/ops/storage/${bucketId}/signed-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: file.path, expiresIn: 3600 })
        });

        if (!response.ok) throw new Error("Failed to get preview URL");
        const { signedUrl } = await response.json();
        setPreviewUrl(signedUrl);
      } catch (error) {
        console.error("Preview URL error:", error);
        toast.error("Önizleme URL'si alınamadı");
      } finally {
        setLoading(false);
      }
    };

    getPreviewUrl();
  }, [file, bucketId, open]);

  if (!file) return null;

  const category = file.metadata?.mimetype ? getFileCategory(file.metadata.mimetype) : "other";
  const mimetype = file.metadata?.mimetype || "application/octet-stream";

  const handleDownload = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
      toast.success("İndirme başlatıldı");
    }
  };

  const handleCopyUrl = async () => {
    if (previewUrl) {
      await navigator.clipboard.writeText(previewUrl);
      toast.success("URL kopyalandı");
    }
  };

  const handleDelete = () => {
    if (file && onDelete) {
      onDelete(file);
      onOpenChange(false);
    }
  };

  // Render preview based on file type
  const renderPreview = () => {
    if (loading) {
      return <Skeleton className="w-full h-64 rounded-lg" />;
    }

    if (!previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
          <File className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Önizleme yüklenemedi</p>
        </div>
      );
    }

    switch (category) {
      case "image":
        return (
          <div className="relative w-full max-h-[60vh] overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-full object-contain"
              onError={() => setPreviewUrl(null)}
            />
          </div>
        );

      case "video":
        return (
          <div className="relative w-full max-h-[60vh] overflow-hidden rounded-lg bg-black">
            <video
              src={previewUrl}
              controls
              className="w-full h-full"
              onError={() => setPreviewUrl(null)}
            >
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg p-8">
            <Music className="h-16 w-16 text-orange-500 mb-4" />
            <audio src={previewUrl} controls className="w-full max-w-md">
              Tarayıcınız ses oynatmayı desteklemiyor.
            </audio>
          </div>
        );

      case "document":
        if (mimetype === "application/pdf") {
          return (
            <div className="w-full h-[60vh] rounded-lg overflow-hidden">
              <iframe src={previewUrl} className="w-full h-full" title={file.name} />
            </div>
          );
        }
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
            <FileText className="h-16 w-16 text-blue-500 mb-4" />
            <p className="text-muted-foreground">Bu dosya türü önizlenemez</p>
            <Button variant="outline" className="mt-4" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              İndir
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
            <File className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Bu dosya türü önizlenemez</p>
            <Button variant="outline" className="mt-4" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              İndir
            </Button>
          </div>
        );
    }
  };

  // Get icon for file type
  const getFileIcon = () => {
    switch (category) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-green-500" />;
      case "video":
        return <Video className="h-5 w-5 text-purple-500" />;
      case "audio":
        return <Music className="h-5 w-5 text-orange-500" />;
      case "document":
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            <span className="truncate">{file.name}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{mimetype}</Badge>
            {file.metadata?.size && (
              <Badge variant="secondary">{formatFileSize(file.metadata.size)}</Badge>
            )}
            {isPublic && <Badge variant="default">Public</Badge>}
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="mt-4">{renderPreview()}</div>

        {/* File info */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Yol:</span>
            <p className="font-mono text-xs truncate">{file.path}</p>
          </div>
          {file.createdAt && (
            <div>
              <span className="text-muted-foreground">Oluşturulma:</span>
              <p>{new Date(file.createdAt).toLocaleString("tr-TR")}</p>
            </div>
          )}
          {file.updatedAt && (
            <div>
              <span className="text-muted-foreground">Güncelleme:</span>
              <p>{new Date(file.updatedAt).toLocaleString("tr-TR")}</p>
            </div>
          )}
          {file.metadata?.cacheControl && (
            <div>
              <span className="text-muted-foreground">Cache Control:</span>
              <p className="font-mono text-xs">{file.metadata.cacheControl}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={!previewUrl}>
              <Download className="mr-2 h-4 w-4" />
              İndir
            </Button>
            <Button variant="outline" onClick={handleCopyUrl} disabled={!previewUrl}>
              <Link className="mr-2 h-4 w-4" />
              URL Kopyala
            </Button>
            {previewUrl && (
              <Button variant="outline" asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Yeni Sekmede Aç
                </a>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {onDelete && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Sil
              </Button>
            )}
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
