"use client";

import { useState, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { UploadProgress, UploadResult, MediaMetadata } from "../types";

const BUCKET_NAME = "ops-admin-chat";

export function useMediaUpload(conversationId: string | null) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const supabase = createBrowserSupabaseClient();

  const getContentType = (mimeType: string): string => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "file";
  };

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      console.log("[useMediaUpload] Starting upload:", {
        conversationId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        bucket: BUCKET_NAME
      });

      if (!conversationId) {
        console.error("[useMediaUpload] No conversation ID");
        return { success: false, error: "Conversation ID gerekli" };
      }

      setIsUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${conversationId}/${fileName}`;

        console.log("[useMediaUpload] Uploading to path:", filePath);

        // Upload to storage
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (error) {
          console.error("[useMediaUpload] Storage upload error:", {
            error,
            statusCode: (error as { statusCode?: string }).statusCode,
            message: error.message
          });
          throw error;
        }

        console.log("[useMediaUpload] Upload successful:", data);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(data.path);

        console.log("[useMediaUpload] Public URL:", urlData.publicUrl);

        // Build metadata
        const metadata: MediaMetadata = {
          size: file.size,
          mime_type: file.type,
          filename: file.name
        };

        // Get image dimensions if applicable
        if (file.type.startsWith("image/")) {
          const dimensions = await getImageDimensions(file);
          if (dimensions) {
            metadata.width = dimensions.width;
            metadata.height = dimensions.height;
          }
        }

        // Get video/audio duration if applicable
        if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
          const duration = await getMediaDuration(file);
          if (duration) {
            metadata.duration = duration;
          }
        }

        setProgress({ loaded: file.size, total: file.size, percentage: 100 });

        console.log("[useMediaUpload] Complete:", { url: urlData.publicUrl, metadata });

        // Queue for optimization via PGMQ (non-blocking)
        if (file.type.startsWith("image/")) {
          queueForOptimization(filePath, file.type).catch((err) => {
            console.warn("[useMediaUpload] Queue optimization failed (non-critical):", err);
          });
        }

        return {
          success: true,
          url: urlData.publicUrl,
          metadata
        };
      } catch (error) {
        console.error("[useMediaUpload] Error:", error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        return {
          success: false,
          error: errorMessage
        };
      } finally {
        setIsUploading(false);
        setProgress(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, supabase]
  );

  // Queue media for background optimization via PGMQ
  const queueForOptimization = useCallback(
    async (sourcePath: string, mimeType: string) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.warn("[useMediaUpload] No session for queue");
          return;
        }

        const isVideo = mimeType.startsWith("video/");
        const jobType = isVideo ? "video_transcode" : "image_optimize";

        console.log("[useMediaUpload] Queueing for optimization:", { sourcePath, jobType });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/queue-media-job`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              job_type: jobType,
              source_path: sourcePath,
              preset: "ops-chat" // Admin chat uses ops-chat preset for ops-admin-chat bucket
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[useMediaUpload] Queue error:", response.status, errorData);
          return;
        }

        const result = await response.json();
        console.log("[useMediaUpload] Queued successfully:", result);
      } catch (error) {
        console.error("[useMediaUpload] Queue error:", error);
      }
    },
    [supabase]
  );

  const uploadImage = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "Geçersiz dosya türü" };
      }
      return uploadFile(file);
    },
    [uploadFile]
  );

  const uploadVideo = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!file.type.startsWith("video/")) {
        return { success: false, error: "Geçersiz dosya türü" };
      }
      return uploadFile(file);
    },
    [uploadFile]
  );

  const uploadAudio = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!file.type.startsWith("audio/")) {
        return { success: false, error: "Geçersiz dosya türü" };
      }
      return uploadFile(file);
    },
    [uploadFile]
  );

  const uploadDocument = useCallback(
    async (file: File): Promise<UploadResult> => {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: "Desteklenmeyen dosya türü" };
      }
      return uploadFile(file);
    },
    [uploadFile]
  );

  return {
    isUploading,
    progress,
    uploadFile,
    uploadImage,
    uploadVideo,
    uploadAudio,
    uploadDocument,
    getContentType
  };
}

// Helper functions
async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

async function getMediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const media = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    media.onloadedmetadata = () => {
      resolve(Math.round(media.duration));
      URL.revokeObjectURL(media.src);
    };
    media.onerror = () => resolve(null);
    media.src = URL.createObjectURL(file);
  });
}
