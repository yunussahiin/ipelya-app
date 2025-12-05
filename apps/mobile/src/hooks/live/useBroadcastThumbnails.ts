/**
 * useBroadcastThumbnails Hook
 * Kullanıcının yayın thumbnail'lerini yönetir
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";

export interface BroadcastThumbnail {
  id: string;
  thumbnailUrl: string;
  name?: string;
  isDefault: boolean;
  createdAt: string;
}

export function useBroadcastThumbnails() {
  const { user } = useAuth();
  const [thumbnails, setThumbnails] = useState<BroadcastThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's thumbnails
  const fetchThumbnails = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("user_broadcast_thumbnails")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setThumbnails(
        (data || []).map((item) => ({
          id: item.id,
          thumbnailUrl: item.thumbnail_url,
          name: item.name,
          isDefault: item.is_default,
          createdAt: item.created_at
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thumbnail'ler yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Upload new thumbnail
  const uploadThumbnail = useCallback(
    async (name?: string): Promise<BroadcastThumbnail | null> => {
      if (!user?.id) return null;

      try {
        // Pick image (yeni API kullanımı)
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8
        });

        if (result.canceled || !result.assets[0]) return null;

        setIsUploading(true);
        setError(null);

        const asset = result.assets[0];
        const fileExt = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        // Read file as base64 (legacy API)
        const base64 = await readAsStringAsync(asset.uri, {
          encoding: "base64"
        });

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("broadcast-thumbnails")
          .upload(fileName, decode(base64), {
            contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl }
        } = supabase.storage.from("broadcast-thumbnails").getPublicUrl(fileName);

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from("user_broadcast_thumbnails")
          .insert({
            user_id: user.id,
            thumbnail_url: publicUrl,
            name: name || null,
            is_default: thumbnails.length === 0 // First one is default
          })
          .select()
          .single();

        if (dbError) throw dbError;

        const newThumbnail: BroadcastThumbnail = {
          id: dbData.id,
          thumbnailUrl: dbData.thumbnail_url,
          name: dbData.name,
          isDefault: dbData.is_default,
          createdAt: dbData.created_at
        };

        setThumbnails((prev) => [newThumbnail, ...prev]);
        return newThumbnail;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yükleme başarısız");
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id, thumbnails.length]
  );

  // Delete thumbnail
  const deleteThumbnail = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        const thumbnail = thumbnails.find((t) => t.id === id);
        if (!thumbnail) return false;

        // Delete from storage
        const fileName = thumbnail.thumbnailUrl.split("/").pop();
        if (fileName) {
          await supabase.storage
            .from("broadcast-thumbnails")
            .remove([`${user.id}/${fileName}`]);
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from("user_broadcast_thumbnails")
          .delete()
          .eq("id", id);

        if (dbError) throw dbError;

        setThumbnails((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Silme başarısız");
        return false;
      }
    },
    [user?.id, thumbnails]
  );

  // Set default thumbnail
  const setDefaultThumbnail = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user?.id) return false;

      try {
        // Remove default from all
        await supabase
          .from("user_broadcast_thumbnails")
          .update({ is_default: false })
          .eq("user_id", user.id);

        // Set new default
        const { error: dbError } = await supabase
          .from("user_broadcast_thumbnails")
          .update({ is_default: true })
          .eq("id", id);

        if (dbError) throw dbError;

        setThumbnails((prev) =>
          prev.map((t) => ({
            ...t,
            isDefault: t.id === id
          }))
        );
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Güncelleme başarısız");
        return false;
      }
    },
    [user?.id]
  );

  // Get default thumbnail
  const getDefaultThumbnail = useCallback((): BroadcastThumbnail | undefined => {
    return thumbnails.find((t) => t.isDefault) || thumbnails[0];
  }, [thumbnails]);

  // Initial fetch
  useEffect(() => {
    fetchThumbnails();
  }, [fetchThumbnails]);

  return {
    thumbnails,
    isLoading,
    isUploading,
    error,
    uploadThumbnail,
    deleteThumbnail,
    setDefaultThumbnail,
    getDefaultThumbnail,
    refresh: fetchThumbnails
  };
}
