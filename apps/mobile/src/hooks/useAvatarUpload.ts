/**
 * Avatar Upload Hook
 * Manages avatar upload state and operations
 */

import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  uploadAndUpdateAvatar,
  initializeAvatarBucket,
  removeUserAvatar,
  extractStoragePathFromUrl
} from "@/services/avatar.service";
import { supabase } from "@/lib/supabaseClient";
import { logger } from "@/utils/logger";

export interface UseAvatarUploadState {
  loading: boolean;
  uploading: boolean;
  removing: boolean;
  error: string | null;
  avatarUrl: string | null;
  avatarPath: string | null;
}

export interface UseAvatarUploadActions {
  pickImage: () => Promise<void>;
  takePhoto: () => Promise<void>;
  uploadAvatar: (uri: string, name: string) => Promise<boolean>;
  removeAvatar: () => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export function useAvatarUpload(currentAvatarUrl?: string | null, profileType: "real" | "shadow" = "real"): UseAvatarUploadState & UseAvatarUploadActions {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const reset = useCallback(() => {
    setLoading(false);
    setUploading(false);
    setRemoving(false);
    setError(null);
    setAvatarUrl(null);
    setAvatarPath(null);
  }, []);

  const pickImage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request permissions with custom message
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        if (canAskAgain) {
          setError("Profil fotoğrafı seçmek için galeri erişim izni gerekli");
        } else {
          setError("Galeri erişim izni reddedildi. Ayarlardan izin ver.");
        }
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const filename = asset.uri.split("/").pop() || "avatar.jpg";
        
        // Upload
        await uploadAvatarFile(asset.uri, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Galeri açılırken hata oluştu";
      setError(message);
      logger.error('Pick image error', err, { tag: 'Avatar' });
    } finally {
      setLoading(false);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Request permissions with custom message
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        if (canAskAgain) {
          setError("Profil fotoğrafı çekmek için kamera erişim izni gerekli");
        } else {
          setError("Kamera erişim izni reddedildi. Ayarlardan izin ver.");
        }
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const filename = `photo_${Date.now()}.jpg`;
        
        // Upload
        await uploadAvatarFile(asset.uri, filename);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kamera açılırken hata oluştu";
      setError(message);
      logger.error('Take photo error', err, { tag: 'Avatar' });
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAvatarFile = useCallback(async (uri: string, filename: string): Promise<boolean> => {
    try {
      setUploading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw authError || new Error("Kullanıcı bulunamadı");
      }

      // Initialize bucket
      await initializeAvatarBucket();

      // Upload and update (pass old avatar path for cleanup)
      // Extract path from currentAvatarUrl first (profile's current avatar)
      // Then fallback to avatarPath (state's current avatar)
      let oldPath: string | undefined;
      if (currentAvatarUrl) {
        oldPath = extractStoragePathFromUrl(currentAvatarUrl) || undefined;
      } else if (avatarPath) {
        oldPath = avatarPath;
      }
      
      const result = await uploadAndUpdateAvatar(user.id, {
        uri,
        name: filename,
        type: "image/jpeg"
      }, oldPath, profileType);

      if (!result.success) {
        throw new Error(result.error || "Yükleme başarısız");
      }

      setAvatarUrl(result.url || null);
      setAvatarPath(result.path || null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Yükleme başarısız";
      setError(message);
      logger.error('Upload error', err, { tag: 'Avatar' });
      return false;
    } finally {
      setUploading(false);
    }
  }, [avatarPath, currentAvatarUrl]);

  const removeAvatar = useCallback(async (): Promise<boolean> => {
    try {
      setRemoving(true);
      setError(null);

      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw authError || new Error("Kullanıcı bulunamadı");
      }

      // Use currentAvatarUrl first (profile's current avatar), fallback to avatarUrl (state)
      const urlToDelete = currentAvatarUrl || avatarUrl;
      
      const result = await removeUserAvatar({
        userId: user.id,
        storagePath: avatarPath || undefined,
        currentUrl: urlToDelete || null
      });

      if (!result.success) {
        throw new Error(result.error || "Avatar silinemedi");
      }

      setAvatarUrl(null);
      setAvatarPath(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Avatar silinemedi";
      setError(message);
      logger.error('Remove avatar error', err, { tag: 'Avatar' });
      return false;
    } finally {
      setRemoving(false);
    }
  }, [avatarPath, avatarUrl, currentAvatarUrl]);

  return {
    loading,
    uploading,
     removing,
    error,
    avatarUrl,
    avatarPath,
    pickImage,
    takePhoto,
    uploadAvatar: uploadAvatarFile,
     removeAvatar,
    clearError,
    reset
  };
}
