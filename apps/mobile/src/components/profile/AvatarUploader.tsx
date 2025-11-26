/**
 * Avatar Uploader Component
 * Instagram-style minimal avatar upload
 * Just tap to open gallery, edit badge for visual cue
 */

import { useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { Pencil, Plus } from "lucide-react-native";
import { Image } from "expo-image";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

export interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  profileType?: "real" | "shadow";
  size?: number;
}

export function AvatarUploader({
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  profileType = "real",
  size = 100
}: AvatarUploaderProps) {
  const { colors } = useTheme();
  const { uploading, error, avatarUrl, pickImage, clearError } = useAvatarUpload(
    currentAvatarUrl,
    profileType
  );
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  const displayUrl = avatarUrl || currentAvatarUrl;

  const handlePress = async () => {
    clearError();
    await pickImage();
  };

  // Trigger callbacks via effects
  useEffect(() => {
    if (avatarUrl && !uploading) {
      onUploadSuccess?.(avatarUrl);
    }
  }, [avatarUrl, uploading]);

  useEffect(() => {
    if (error && !uploading) {
      onUploadError?.(error);
      Alert.alert("Hata", error);
    }
  }, [error, uploading]);

  return (
    <Pressable style={styles.container} onPress={handlePress} disabled={uploading}>
      {displayUrl ? (
        <Image
          source={{ uri: displayUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.placeholder}>
          <Plus size={32} color={colors.textMuted} strokeWidth={1.5} />
        </View>
      )}

      {/* Loading Overlay */}
      {uploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}

      {/* Edit Badge - Instagram style */}
      <View style={styles.editBadge}>
        <Pencil size={12} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, size: number) =>
  StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      position: "relative"
    },
    avatar: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 3,
      borderColor: colors.background
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center"
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: size / 2,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center"
    },
    editBadge: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.background
    }
  });
