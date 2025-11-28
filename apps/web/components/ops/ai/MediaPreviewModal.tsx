"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Play,
  Image as ImageIcon,
  Clock,
  User,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  duration?: number;
}

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  initialIndex?: number;
  postInfo?: {
    id: string;
    caption?: string;
    author?: string;
    createdAt?: string;
    likes?: number;
    comments?: number;
  };
}

export function MediaPreviewModal({
  isOpen,
  onClose,
  media,
  initialIndex = 0,
  postInfo
}: MediaPreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const currentMedia = media[currentIndex];
  const hasMultiple = media.length > 1;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
    setIsVideoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
    setIsVideoPlaying(false);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const handleDownload = () => {
    if (currentMedia?.url) {
      window.open(currentMedia.url, "_blank");
    }
  };

  if (!currentMedia) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {currentMedia.type === "video" ? (
                <Play className="size-5" />
              ) : (
                <ImageIcon className="size-5" />
              )}
              <span>
                {currentMedia.type === "video" ? "Video" : "Fotoğraf"}
                {hasMultiple && ` (${currentIndex + 1}/${media.length})`}
              </span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="size-4 mr-1" />
                İndir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentMedia.url, "_blank")}
              >
                <ExternalLink className="size-4 mr-1" />
                Yeni Sekmede Aç
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Media Content */}
        <div className="relative bg-black flex items-center justify-center min-h-[400px] max-h-[60vh]">
          {/* Navigation Arrows */}
          {hasMultiple && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={goToPrevious}
              >
                <ChevronLeft className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
                onClick={goToNext}
              >
                <ChevronRight className="size-6" />
              </Button>
            </>
          )}

          {/* Media Display */}
          {currentMedia.type === "video" ? (
            <video
              src={currentMedia.url}
              poster={currentMedia.thumbnail || undefined}
              controls
              autoPlay={isVideoPlaying}
              className="max-w-full max-h-[60vh] object-contain"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
          ) : (
            <img
              src={currentMedia.url}
              alt="Media preview"
              className="max-w-full max-h-[60vh] object-contain"
            />
          )}

          {/* Duration Badge for Videos */}
          {currentMedia.type === "video" && currentMedia.duration && (
            <Badge className="absolute bottom-4 right-4 bg-black/70">
              <Clock className="size-3 mr-1" />
              {formatDuration(currentMedia.duration)}
            </Badge>
          )}
        </div>

        {/* Thumbnail Strip */}
        {hasMultiple && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-muted/50 border-t">
            {media.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsVideoPlaying(false);
                }}
                className={cn(
                  "relative shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                  index === currentIndex
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <img
                  src={item.thumbnail || item.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="size-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Post Info */}
        {postInfo && (
          <div className="p-4 border-t bg-muted/30 space-y-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {postInfo.author && (
                <div className="flex items-center gap-1">
                  <User className="size-4" />
                  <span>@{postInfo.author}</span>
                </div>
              )}
              {postInfo.createdAt && (
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  <span>{postInfo.createdAt}</span>
                </div>
              )}
              {postInfo.likes !== undefined && (
                <Badge variant="secondary">❤️ {postInfo.likes}</Badge>
              )}
              {postInfo.comments !== undefined && (
                <Badge variant="secondary">💬 {postInfo.comments}</Badge>
              )}
            </div>
            {postInfo.caption && <p className="text-sm">{postInfo.caption}</p>}
            {postInfo.id && (
              <p className="text-xs text-muted-foreground font-mono">Post ID: {postInfo.id}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
