/**
 * Avatar Uploader Component
 * Handles avatar selection and upload with UI feedback
 */

import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from "react-native";
import { Camera, Upload, AlertCircle, Trash2 } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

export interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  profileType?: "real" | "shadow";
}

export function AvatarUploader({
  currentAvatarUrl,
  onUploadSuccess,
  onUploadError,
  profileType = "real"
}: AvatarUploaderProps) {
  const { colors } = useTheme();
  const {
    loading,
    uploading,
    removing,
    error,
    avatarUrl,
    pickImage,
    takePhoto,
    removeAvatar,
    clearError
  } = useAvatarUpload(currentAvatarUrl, profileType);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const displayUrl = avatarUrl || currentAvatarUrl;
  const isProcessing = loading || uploading || removing;

  const handlePickImage = async () => {
    clearError();
    await pickImage();
  };

  const handleTakePhoto = async () => {
    clearError();
    await takePhoto();
  };

  const handleRemoveAvatar = async () => {
    Alert.alert("Fotoğrafı Kaldır", "Profil fotoğrafını silmek istediğinize emin misiniz?", [
      { text: "İptal", onPress: () => {}, style: "cancel" },
      {
        text: "Sil",
        onPress: async () => {
          clearError();
          const success = await removeAvatar();
          if (success) {
            onUploadSuccess?.("");
          }
        },
        style: "destructive"
      }
    ]);
  };

  const handleUploadSuccess = (url: string) => {
    onUploadSuccess?.(url);
  };

  const handleUploadError = (err: string) => {
    onUploadError?.(err);
    Alert.alert("Hata", err);
  };

  // Trigger callbacks via effects to avoid calling setState during render
  useEffect(() => {
    if (avatarUrl && !uploading) {
      handleUploadSuccess(avatarUrl);
    }
  }, [avatarUrl, uploading]);

  useEffect(() => {
    if (error && !uploading && !removing) {
      handleUploadError(error);
    }
  }, [error, uploading, removing]);

  return (
    <View style={styles.container}>
      {/* Avatar Display */}
      <View style={styles.avatarContainer}>
        {displayUrl ? (
          <Image
            source={{ uri: displayUrl }}
            style={styles.avatar}
            accessible={true}
            accessibilityLabel="Profil fotoğrafı"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Camera size={56} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.avatarPlaceholderText}>Fotoğraf Ekle</Text>
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.uploadingText}>Yükleniyor...</Text>
          </View>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={clearError}>
            <Text style={styles.errorDismiss}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        <Pressable
          style={[styles.button, styles.buttonPrimary, isProcessing && styles.buttonDisabled]}
          onPress={handlePickImage}
          disabled={isProcessing}
          accessible={true}
          accessibilityLabel="Galeriden seç"
          accessibilityRole="button"
        >
          <Upload size={18} color={colors.background} />
          <Text style={styles.buttonText}>Galeriden Seç</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonSecondary, isProcessing && styles.buttonDisabled]}
          onPress={handleTakePhoto}
          disabled={isProcessing}
          accessible={true}
          accessibilityLabel="Fotoğraf çek"
          accessibilityRole="button"
        >
          <Camera size={18} color={colors.accent} />
          <Text style={styles.buttonTextSecondary}>Fotoğraf Çek</Text>
        </Pressable>
      </View>

      {/* Remove Button - only show if avatar exists */}
      {displayUrl && (
        <Pressable
          style={[styles.removeButton, isProcessing && styles.buttonDisabled]}
          onPress={handleRemoveAvatar}
          disabled={isProcessing}
          accessible={true}
          accessibilityLabel="Fotoğrafı kaldır"
          accessibilityRole="button"
        >
          <Trash2 size={16} color="#ef4444" />
          <Text style={styles.removeButtonText}>Fotoğrafı Kaldır</Text>
        </Pressable>
      )}

      {/* Info Text */}
      <Text style={styles.infoText}>
        JPG, PNG, GIF veya WebP formatında. Maksimum 2MB (otomatik sıkıştırılır).
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 16
    },
    avatarContainer: {
      alignItems: "center",
      position: "relative"
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60
    },
    avatarPlaceholder: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      gap: 8
    },
    avatarPlaceholderText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4
    },
    uploadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 60,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      gap: 8
    },
    uploadingText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: "600"
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: "#ef4444"
    },
    errorText: {
      flex: 1,
      color: "#ef4444",
      fontSize: 13,
      fontWeight: "500"
    },
    errorDismiss: {
      color: "#ef4444",
      fontSize: 16,
      fontWeight: "600"
    },
    buttonGroup: {
      flexDirection: "row",
      gap: 12
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      minHeight: 48
    },
    buttonPrimary: {
      backgroundColor: colors.accent
    },
    buttonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    buttonDisabled: {
      opacity: 0.6
    },
    buttonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: "600"
    },
    buttonTextSecondary: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "600"
    },
    infoText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center"
    },
    removeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      minHeight: 48,
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: "#ef4444"
    },
    removeButtonText: {
      color: "#ef4444",
      fontSize: 14,
      fontWeight: "600"
    }
  });
