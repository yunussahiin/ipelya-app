/**
 * KYC ID Front Screen
 * Kimlik ön yüz fotoğraf çekimi - OCR ile
 *
 * Özellikler:
 * - Real-time OCR okuma
 * - TC Kimlik No algılama
 * - Ad/Soyad algılama
 * - Güven skoru gösterimi
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert, Vibration } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera as CameraIcon, RefreshCw, ArrowRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";
import { useIDCardOCR, type OCRResult } from "@/hooks/creator/useIDCardOCR";
import { Camera, useFrameProcessor, runAsync, useCameraDevice } from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { OCRResultOverlay } from "@/components/creator/kyc/OCRResultOverlay";

export default function KYCIdFrontScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { documentPaths, setDocumentPhoto, setOCRData } = useKYCVerification();

  const [showCamera, setShowCamera] = useState(!documentPaths.idFrontPath);
  const [capturedImage, setCapturedImage] = useState<string | null>(documentPaths.idFrontPath);
  const [isUploading, setIsUploading] = useState(false);

  // OCR
  const { scanText, processFrame, lastResult, resetHistory } = useIDCardOCR();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Auto-capture when OCR is complete
  const readyCountRef = useRef(0);
  const AUTO_CAPTURE_THRESHOLD = 20; // ~0.7 saniye

  // Cleanup
  useEffect(() => {
    return () => {
      resetHistory();
    };
  }, [resetHistory]);

  const handleBack = () => router.back();

  // Manuel capture
  const handleManualCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    Vibration.vibrate(50);

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "quality",
        flash: "off"
      });

      const photoPath = `file://${photo.path}`;
      setCapturedImage(photoPath);
      setShowCamera(false);

      // OCR verilerini kaydet
      if (lastResult.data.tcNumber || lastResult.data.firstName || lastResult.data.lastName) {
        setOCRData?.(lastResult.data);
      }

      setIsUploading(true);
      const result = await setDocumentPhoto(photoPath, "id-front");
      setIsUploading(false);

      if (!result.success) {
        Alert.alert("Hata", result.error || "Fotoğraf yüklenemedi");
      }
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Hata", "Çekim başarısız oldu");
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, lastResult.data, setDocumentPhoto, setOCRData]);

  // Frame processor callback
  const handleOCRUpdate = Worklets.createRunOnJS((result: OCRResult) => {
    // Auto-capture logic
    if (result.isComplete) {
      readyCountRef.current++;
      if (readyCountRef.current >= AUTO_CAPTURE_THRESHOLD && !isCapturing) {
        handleManualCapture();
      }
    } else {
      readyCountRef.current = 0;
    }
  });

  // Frame processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      runAsync(frame, () => {
        "worklet";
        const ocrResult = scanText(frame);
        // Note: processFrame is not worklet-safe, so we handle in JS
      });
    },
    [scanText]
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
    if (!device) {
      return (
        <View style={[styles.cameraContainer, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ color: "#fff" }}>Kamera yükleniyor...</Text>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        {/* Kamera */}
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          frameProcessor={frameProcessor}
        />

        {/* OCR overlay */}
        <OCRResultOverlay result={lastResult} />

        {/* Üst bar */}
        <SafeAreaView style={styles.cameraHeader} edges={["top"]}>
          <Pressable style={styles.cameraBackButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <Text style={styles.cameraTitle}>Kimlik Ön Yüz</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {/* Alt bar - Capture butonu */}
        <SafeAreaView style={styles.cameraBottom} edges={["bottom"]}>
          <View style={styles.captureContainer}>
            <Pressable
              style={[
                styles.captureButton,
                {
                  backgroundColor: lastResult.isComplete ? "#10B981" : "rgba(255,255,255,0.3)",
                  opacity: isCapturing ? 0.5 : 1
                }
              ]}
              onPress={handleManualCapture}
              disabled={isCapturing}
            >
              <CameraIcon size={32} color="#fff" />
            </Pressable>
            <Text style={styles.captureHint}>
              {lastResult.isComplete
                ? "Fotoğraf çekmek için dokunun"
                : "Kimliği çerçeveye yerleştirin"}
            </Text>
          </View>
        </SafeAreaView>
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
      flex: 1,
      backgroundColor: "#000"
    },
    cameraHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12
    },
    cameraBackButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.3)",
      borderRadius: 20
    },
    cameraTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: "#fff"
    },
    cameraBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 30
    },
    captureContainer: {
      alignItems: "center",
      gap: 12
    },
    captureButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: "#fff"
    },
    captureHint: {
      color: "#fff",
      fontSize: 14,
      textAlign: "center",
      paddingHorizontal: 40
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
