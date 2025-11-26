/**
 * CoverUploader Component
 * Instagram-style minimal cover image upload
 * Just tap to open gallery, edit badge for visual cue
 */

import { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert, Dimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system/next";
import * as Haptics from "expo-haptics";
import { Camera } from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { decode } from "base64-arraybuffer";

interface CoverUploaderProps {
  currentCoverUrl?: string | null;
  profileType: "real" | "shadow";
  onUploadSuccess?: (url: string | undefined) => void;
  onUploadError?: (error: Error) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_HEIGHT = 160;

export function CoverUploader({
  currentCoverUrl,
  profileType,
  onUploadSuccess,
  onUploadError
}: CoverUploaderProps) {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const [uploading, setUploading] = useState(false);

  const uploadCover = useCallback(
    async (imageUri: string) => {
      try {
        setUploading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Read file using new File API
        const file = new File(imageUri);
        const base64 = await file.base64();

        // Get file extension
        const ext = imageUri.split(".").pop()?.toLowerCase() || "jpg";
        const contentType = ext === "png" ? "image/png" : "image/jpeg";
        const fileName = `${Date.now()}.${ext}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to profile-covers bucket
        const { error: uploadError } = await supabase.storage
          .from("profile-covers")
          .upload(filePath, decode(base64), {
            cacheControl: "3600",
            upsert: true,
            contentType
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage.from("profile-covers").getPublicUrl(filePath);

        if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

        // Update profile in database
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ cover_url: urlData.publicUrl })
          .eq("user_id", user.id)
          .eq("type", profileType);

        if (updateError) throw updateError;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUploadSuccess?.(urlData.publicUrl);
      } catch (error) {
        console.error("Cover upload error:", error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const err = error instanceof Error ? error : new Error(String(error));
        onUploadError?.(err);
        Alert.alert("Hata", "Kapak fotoğrafı yüklenemedi");
      } finally {
        setUploading(false);
      }
    },
    [profileType, onUploadSuccess, onUploadError]
  );

  const handlePress = useCallback(async () => {
    if (uploading) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("İzin Gerekli", "Galeri erişimi için izin veriniz");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8
      });

      if (!result.canceled && result.assets[0]) {
        await uploadCover(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Hata", "Galeri açılamadı");
    }
  }, [uploading, uploadCover]);

  return (
    <Pressable style={styles.container} onPress={handlePress} disabled={uploading}>
      {currentCoverUrl ? (
        <Image
          source={{ uri: currentCoverUrl }}
          style={styles.coverImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <LinearGradient
          colors={[colors.surface, colors.surfaceAlt || colors.surface]}
          style={styles.placeholder}
        />
      )}

      {/* Loading Overlay */}
      {uploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {/* Edit Badge - Instagram style */}
      <View style={styles.editBadge}>
        <Camera size={14} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const useStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: SCREEN_WIDTH,
      height: COVER_HEIGHT,
      backgroundColor: colors.surface,
      position: "relative",
      marginLeft: -16
    },
    coverImage: {
      width: "100%",
      height: "100%"
    },
    placeholder: {
      flex: 1
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center"
    },
    editBadge: {
      position: "absolute",
      right: 12,
      bottom: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center"
    }
  });
