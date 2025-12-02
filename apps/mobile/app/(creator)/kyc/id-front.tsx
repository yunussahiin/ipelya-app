/**
 * KYC ID Front Screen
 * Kimlik ön yüz fotoğraf çekimi
 */

import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera, RefreshCw, ArrowRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";
import { VisionCamera, type CapturedMedia } from "@/components/camera/VisionCamera";
import { IDCaptureOverlay } from "@/components/creator/kyc";

export default function KYCIdFrontScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { documentPaths, setDocumentPhoto } = useKYCVerification();

  const [showCamera, setShowCamera] = useState(!documentPaths.idFrontPath);
  const [capturedImage, setCapturedImage] = useState<string | null>(documentPaths.idFrontPath);
  const [isUploading, setIsUploading] = useState(false);

  const handleBack = () => router.back();

  const handleCapture = useCallback(
    async (media: CapturedMedia) => {
      if (media.type === "photo") {
        setCapturedImage(media.path);
        setShowCamera(false);

        setIsUploading(true);
        const result = await setDocumentPhoto(media.path, "id-front");
        setIsUploading(false);

        if (!result.success) {
          Alert.alert("Hata", result.error || "Fotoğraf yüklenemedi");
        }
      }
    },
    [setDocumentPhoto]
  );

  const handleRetake = () => {
    setCapturedImage(null);
    setShowCamera(true);
  };

  const handleNext = () => {
    if (capturedImage) {
      router.push("/(creator)/kyc/id-back");
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <VisionCamera
          mode="photo"
          initialPosition="back"
          showControls={true}
          onCapture={handleCapture}
          onClose={() => router.back()}
        />
        <IDCaptureOverlay side="front" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Kimlik Ön Yüz</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: "50%", backgroundColor: colors.accent }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>Adım 2/4</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Kimliğinizin Ön Yüzü</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Fotoğrafı kontrol edin. Tüm bilgiler okunabilir olmalı.
        </Text>

        {/* Preview */}
        {capturedImage && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: capturedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <Text style={styles.uploadingText}>Yükleniyor...</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.retakeButton, { borderColor: colors.border }]}
            onPress={handleRetake}
          >
            <RefreshCw size={20} color={colors.textPrimary} />
            <Text style={[styles.retakeText, { color: colors.textPrimary }]}>Tekrar Çek</Text>
          </Pressable>

          <Pressable
            style={[
              styles.nextButton,
              { backgroundColor: colors.accent, opacity: isUploading ? 0.5 : 1 }
            ]}
            onPress={handleNext}
            disabled={isUploading}
          >
            <Text style={styles.nextButtonText}>Devam Et</Text>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    cameraContainer: {
      flex: 1
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center"
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12
    },
    progressBar: {
      flex: 1,
      height: 4,
      borderRadius: 2
    },
    progressFill: {
      height: "100%",
      borderRadius: 2
    },
    progressText: {
      fontSize: 12
    },
    content: {
      flex: 1,
      padding: 20
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 24
    },
    previewContainer: {
      flex: 1,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#000",
      marginBottom: 20
    },
    previewImage: {
      flex: 1,
      width: "100%"
    },
    uploadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center"
    },
    uploadingText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "500"
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      paddingBottom: insets.bottom
    },
    retakeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 1,
      gap: 8
    },
    retakeText: {
      fontSize: 16,
      fontWeight: "500"
    },
    nextButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      gap: 8
    },
    nextButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600"
    }
  });
