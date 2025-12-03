"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Paperclip, Image as ImageIcon, FileText, Mic, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { VoiceRecorder } from "./VoiceRecorder";
import type { OpsMessage, UploadResult } from "../../types";

interface MessageInputProps {
  replyTo: OpsMessage | null;
  isSending: boolean;
  isUploading: boolean;
  onSend: (
    content: string,
    replyToId?: string,
    mediaUrl?: string,
    contentType?: string,
    metadata?: object
  ) => void;
  onCancelReply: () => void;
  onUpload: (file: File) => Promise<UploadResult>;
  onTyping: () => void;
  getContentType: (mimeType: string) => string;
}

export function MessageInput({
  replyTo,
  isSending,
  isUploading,
  onSend,
  onCancelReply,
  onUpload,
  onTyping,
  getContentType
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!message.trim() && !isUploading) return;
    onSend(message.trim(), replyTo?.id);
    setMessage("");
  }, [message, replyTo, onSend, isUploading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && replyTo) {
      onCancelReply();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping();
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file && file.type.startsWith("image/")) {
          e.preventDefault();
          await handleFileUpload(file);
          return;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.type === "application/pdf"
    ) {
      await handleFileUpload(file);
    } else {
      toast.error("Sadece resim, video veya PDF yüklenebilir");
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu 50MB'dan küçük olmalı");
      return;
    }

    const result = await onUpload(file);

    if (result.success && result.url) {
      const contentType = getContentType(file.type);
      onSend(file.name, replyTo?.id, result.url, contentType, result.metadata);
      setMessage("");
    } else {
      toast.error(result.error || "Yükleme başarısız");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu 50MB'dan küçük olmalı");
      return;
    }

    setShowAttachMenu(false);
    const result = await onUpload(file);

    if (result.success && result.url) {
      const contentType = getContentType(file.type);
      onSend(file.name, replyTo?.id, result.url, contentType, result.metadata);
      setMessage("");
    } else {
      toast.error(result.error || "Yükleme başarısız");
    }

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="border-t bg-background">
      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/30 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 bg-primary rounded-full" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">
                {replyTo.sender?.full_name || "Anonim"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyTo.content ||
                  (replyTo.content_type !== "text" ? `📎 ${replyTo.content_type}` : "")}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 relative" onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <Popover open={showAttachMenu} onOpenChange={setShowAttachMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Paperclip className="h-5 w-5" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                  Fotoğraf / Video
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText className="h-4 w-4" />
                  Dosya
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setShowVoiceRecorder(true);
                  }}
                >
                  <Mic className="h-4 w-4" />
                  Ses Kaydı
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <Mic className="h-4 w-4" />
                  Ses Dosyası
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Voice Recorder */}
          {showVoiceRecorder && (
            <div className="absolute bottom-full left-0 right-0 mb-2 px-4">
              <VoiceRecorder
                isUploading={isUploading}
                onSend={async (audioBlob, duration) => {
                  console.log("[MessageInput] Voice recording received:", {
                    size: audioBlob.size,
                    duration
                  });
                  const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
                    type: audioBlob.type
                  });
                  const result = await onUpload(file);
                  if (result.success && result.url) {
                    onSend("🎤 Ses kaydı", replyTo?.id, result.url, "audio", {
                      ...result.metadata,
                      duration
                    });
                    setShowVoiceRecorder(false);
                  } else {
                    toast.error(result.error || "Ses yüklenemedi");
                  }
                }}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            </div>
          )}

          {/* Text input */}
          <Textarea
            placeholder={replyTo ? "Yanıt yaz..." : "Mesaj yaz..."}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="min-h-[44px] max-h-[120px] resize-none rounded-xl flex-1"
            rows={1}
            disabled={isSending || isUploading}
          />

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !isUploading) || isSending}
            size="icon"
            className="h-10 w-10 rounded-xl shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
