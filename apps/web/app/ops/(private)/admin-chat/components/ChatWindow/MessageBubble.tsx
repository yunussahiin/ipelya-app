"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Drawer, DrawerContent, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Reply,
  CheckCheck,
  Shield,
  Copy,
  FileText,
  Download,
  Play,
  Image as ImageIcon,
  X,
  ZoomIn
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { OpsMessage } from "../../types";

interface MessageBubbleProps {
  message: OpsMessage;
  isMine: boolean;
  showAvatar: boolean;
  showName: boolean;
  onReply: (msg: OpsMessage) => void;
}

function RoleBadge({ role }: { role?: string }) {
  if (role === "super_admin") {
    return (
      <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0 h-4">
        <Shield className="h-2.5 w-2.5 mr-0.5" />
        Super
      </Badge>
    );
  }
  if (role === "admin") {
    return (
      <Badge variant="default" className="ml-1 text-[10px] px-1 py-0 h-4">
        Admin
      </Badge>
    );
  }
  return null;
}

interface MediaContentProps {
  message: OpsMessage;
  onImageClick: (url: string) => void;
  isMine?: boolean;
}

function MediaContent({ message, onImageClick, isMine }: MediaContentProps) {
  const { content_type, media_url, media_metadata } = message;

  if (!media_url) return null;

  if (content_type === "image") {
    return (
      <div
        className="mt-2 rounded-lg overflow-hidden max-w-xs relative group/media cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onImageClick(media_url);
        }}
        onContextMenu={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media_url} alt="Shared image" className="w-full h-auto max-h-64 object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover/media:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  if (content_type === "video") {
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-sm bg-black">
        <video
          src={media_url}
          controls
          className="w-full h-auto max-h-80"
          poster={media_metadata?.thumbnail_url}
        />
      </div>
    );
  }

  if (content_type === "audio") {
    return (
      <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-48">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Play className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <audio src={media_url} controls className="w-full h-8" />
          {media_metadata?.duration && (
            <span className="text-xs text-muted-foreground">
              {Math.floor(media_metadata.duration / 60)}:
              {String(media_metadata.duration % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (content_type === "file") {
    const filename = media_metadata?.filename || "Dosya";
    const isPdf = filename.toLowerCase().endsWith(".pdf");
    const isDoc = filename.toLowerCase().match(/\.(doc|docx|xls|xlsx)$/);

    return (
      <div
        className={cn(
          "mt-2 flex items-center gap-3 p-3 rounded-xl transition-colors min-w-48 cursor-pointer",
          isMine
            ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 border border-primary-foreground/20"
            : "bg-card border border-border hover:bg-accent"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // PDF'leri modal'da aç, diğerlerini yeni sekmede
          if (isPdf) {
            onImageClick(media_url); // PDF için de modal kullan
          } else {
            window.open(media_url, "_blank");
          }
        }}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
            isMine ? "bg-primary-foreground/20" : "bg-muted"
          )}
        >
          <FileText
            className={cn(
              "h-6 w-6",
              isMine ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isMine ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {filename}
          </p>
          <div className="flex items-center gap-2">
            {media_metadata?.size && (
              <span
                className={cn(
                  "text-xs",
                  isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {formatFileSize(media_metadata.size)}
              </span>
            )}
            {isPdf && (
              <span
                className={cn(
                  "text-xs font-medium",
                  isMine ? "text-primary-foreground" : "text-destructive"
                )}
              >
                PDF
              </span>
            )}
            {isDoc && (
              <span
                className={cn(
                  "text-xs font-medium",
                  isMine ? "text-primary-foreground" : "text-blue-500 dark:text-blue-400"
                )}
              >
                DOC
              </span>
            )}
          </div>
        </div>
        <Download
          className={cn("h-5 w-5", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}
        />
      </div>
    );
  }

  return null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageBubble({
  message,
  isMine,
  showAvatar,
  showName,
  onReply
}: MessageBubbleProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Mesaj kopyalandı");
  };

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxUrl) {
        setLightboxUrl(null);
      }
    };

    if (lightboxUrl) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [lightboxUrl]);

  return (
    <>
      {/* Image Lightbox - Dialog */}
      {lightboxUrl && !lightboxUrl.toLowerCase().endsWith(".pdf") && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm bg-black/40 flex items-center justify-center cursor-pointer group"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative w-[90vw] h-[90vh] flex items-center justify-center cursor-default">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-20 rounded-full bg-background/80 hover:bg-background/90 backdrop-blur-sm border border-border"
              onClick={() => setLightboxUrl(null)}
              title="Kapat (ESC)"
            >
              <X className="h-5 w-5" />
            </Button>
            {lightboxUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightboxUrl}
                alt="Full size"
                className="max-w-[80vw] max-h-[80vh] object-contain cursor-default group-hover:cursor-pointer"
              />
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(lightboxUrl!, "_blank")}
              >
                <Download className="h-4 w-4 mr-2" />
                İndir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF/Document Viewer - Drawer from bottom */}
      <Drawer
        open={!!lightboxUrl && lightboxUrl.toLowerCase().endsWith(".pdf")}
        onOpenChange={() => setLightboxUrl(null)}
      >
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <div className="relative w-full h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <DrawerTitle>Döküman Önizleme</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </DrawerClose>
            </div>
            {lightboxUrl && (
              <iframe
                src={lightboxUrl}
                className="w-full h-[calc(100%-60px)] bg-background"
                title="PDF Viewer"
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className={cn("flex group py-0.5", isMine ? "justify-end" : "justify-start")}>
            <div className={cn("flex gap-2 max-w-[75%]", isMine ? "flex-row-reverse" : "")}>
              {/* Avatar - always show for both sides */}
              <div className="w-8 shrink-0">
                {showAvatar && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                    <AvatarFallback
                      className={cn(
                        "text-xs",
                        isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                    >
                      {message.sender?.full_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              <div className="flex flex-col">
                {/* Sender name */}
                {!isMine && showName && (
                  <div className="flex items-center mb-1 ml-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {message.sender?.full_name || "Anonim"}
                    </span>
                    <RoleBadge role={message.sender?.role} />
                  </div>
                )}

                {/* Reply preview */}
                {message.reply_to && (
                  <div className="mb-1 px-3 py-1.5 rounded-lg bg-muted/50 border-l-2 border-primary text-xs max-w-64">
                    <span className="font-medium text-primary">{message.reply_to.sender_name}</span>
                    <p className="text-muted-foreground truncate">{message.reply_to.content}</p>
                  </div>
                )}

                {/* Message content */}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {message.content && message.content_type === "text" && (
                    <p className="whitespace-pre-wrap text-sm" style={{ wordBreak: "break-word" }}>
                      {message.content}
                    </p>
                  )}
                  <MediaContent message={message} onImageClick={setLightboxUrl} isMine={isMine} />
                </div>

                {/* Time and read status */}
                <div
                  className={cn(
                    "flex items-center gap-1 mt-1",
                    isMine ? "justify-end mr-1" : "ml-1"
                  )}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(message.created_at), "HH:mm", { locale: tr })}
                  </span>
                  {isMine && <CheckCheck className="h-3 w-3 text-primary" />}
                </div>
              </div>

              {/* Reply button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                      onClick={() => onReply(message)}
                    >
                      <Reply className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Yanıtla</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onReply(message)}>
            <Reply className="h-4 w-4 mr-2" />
            Yanıtla
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Kopyala
          </ContextMenuItem>
          {message.media_url && message.content_type === "image" && (
            <ContextMenuItem onClick={() => setLightboxUrl(message.media_url!)}>
              <ImageIcon className="h-4 w-4 mr-2" />
              Tam Boyut Görüntüle
            </ContextMenuItem>
          )}
          {message.media_url && message.content_type === "file" && (
            <>
              <ContextMenuItem onClick={() => setLightboxUrl(message.media_url!)}>
                <FileText className="h-4 w-4 mr-2" />
                Önizle
              </ContextMenuItem>
              <ContextMenuItem onClick={() => window.open(message.media_url!, "_blank")}>
                <Download className="h-4 w-4 mr-2" />
                İndir
              </ContextMenuItem>
            </>
          )}
          {message.media_url && message.content_type === "video" && (
            <ContextMenuItem onClick={() => window.open(message.media_url!, "_blank")}>
              <Download className="h-4 w-4 mr-2" />
              Videoyu İndir
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
