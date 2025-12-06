/**
 * Avatar Management Service
 * Handles avatar uploads, downloads, and management for user profiles
 * Integrates with Supabase Storage and Database
 */

import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export interface AvatarUploadOptions {
  userId: string;
  file: {
    uri: string;
    name: string;
    type: string;
  };
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  upsert?: boolean;
}

export interface AvatarUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface AvatarDeleteResult {
  success: boolean;
  error?: string;
}

interface RemoveUserAvatarOptions {
  userId: string;
  storagePath?: string | null;
  currentUrl?: string | null;
  profileType?: "real" | "shadow";
}

const BUCKET_NAME = "avatars";

export function extractStoragePathFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Initialize avatar bucket if it doesn't exist
 */
export async function initializeAvatarBucket(): Promise<void> {
  try {
    // Check if bucket exists by trying to list files
    await supabase.storage.from(BUCKET_NAME).list("", { limit: 1 });
  } catch (error) {
    // Bucket doesn't exist, create it
    try {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES
      });
    } catch (createError) {
      logger.error('Failed to create avatar bucket', createError, { tag: 'Avatar' });
    }
  }
}

/**
 * Validate file before upload
 */
function validateFile(file: AvatarUploadOptions["file"]): { valid: boolean; error?: string } {
  if (!file.type || !ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    };
  }

  return { valid: true };
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(options: AvatarUploadOptions): Promise<AvatarUploadResult> {
  try {
    const { userId, file, upsert = true } = options;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate file path
    const timestamp = Date.now();
    const filename = `${userId}_${timestamp}.jpg`;
    const path = `${userId}/${filename}`;

    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, fileBytes, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) {
      return { success: false, error: "Failed to generate public URL" };
    }

    return {
      success: true,
      url: publicUrl,
      path
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error('Avatar upload failed', error, { tag: 'Avatar' });
    return { success: false, error: errorMessage };
  }
}

/**
 * Update user profile with new avatar URL
 */
export async function updateProfileAvatar(
  userId: string,
  avatarUrl: string,
  profileType: "real" | "shadow" = "real"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", userId)
      .eq("type", profileType);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error('Profile update failed', error, { tag: 'Avatar' });
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete old avatar from storage
 */
export async function deleteAvatar(path: string): Promise<AvatarDeleteResult> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error('Avatar deletion failed', error, { tag: 'Avatar' });
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload and update avatar in one operation
 */
export async function uploadAndUpdateAvatar(
  userId: string,
  file: AvatarUploadOptions["file"],
  oldAvatarPath?: string,
  profileType: "real" | "shadow" = "real"
): Promise<AvatarUploadResult> {
  try {
    // Upload new avatar
    const uploadResult = await uploadAvatar({
      userId,
      file,
      upsert: true
    });

    if (!uploadResult.success || !uploadResult.url) {
      return uploadResult;
    }

    // Update profile
    const updateResult = await updateProfileAvatar(userId, uploadResult.url, profileType);
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Delete old avatar if provided
    if (oldAvatarPath) {
      await deleteAvatar(oldAvatarPath);
    }

    return uploadResult;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error('Upload and update failed', error, { tag: 'Avatar' });
    return { success: false, error: errorMessage };
  }
}

/**
 * Get avatar URL from storage path
 */
export function getAvatarUrl(path: string): string {
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data?.publicUrl || "";
}

export async function removeUserAvatar({ userId, storagePath, currentUrl, profileType = "real" }: RemoveUserAvatarOptions) {
  try {
    const path = storagePath ?? extractStoragePathFromUrl(currentUrl);

    if (path) {
      const deleteResult = await deleteAvatar(path);
      if (!deleteResult.success) {
        return deleteResult;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("user_id", userId)
      .eq("type", profileType);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error('Avatar remove failed', error, { tag: 'Avatar' });
    return { success: false, error: errorMessage };
  }
}
