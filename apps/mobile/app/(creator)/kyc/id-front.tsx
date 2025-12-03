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
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Vibration,
  Dimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera as CameraIcon, RefreshCw, ArrowRight, Zap } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";
import { useIDCardOCR, type OCRResult } from "@/hooks/creator/useIDCardOCR";
import { Camera, useFrameProcessor, runAsync, useCameraDevice } from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { OCRResultOverlay } from "@/components/creator/kyc/OCRResultOverlay";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { addTimestampToImage } from "@/utils/imageUtils";
import DocumentScanner from "react-native-document-scanner-plugin";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Kimlik kartı çerçeve boyutları (OCRResultOverlay ile aynı)
const CARD_ASPECT_RATIO = 1.586;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;
const CARD_CENTER_Y = SCREEN_HEIGHT * 0.4;

export default function KYCIdFrontScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { documentPaths, setDocumentPhoto, setOCRData } = useKYCVerification();

  const [showCamera, setShowCamera] = useState(!documentPaths.idFrontPath);
  const [capturedImage, setCapturedImage] = useState<string | null>(documentPaths.idFrontPath);
  const [captureTime, setCaptureTime] = useState<Date | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // OCR
  const { scanText, processFrame, lastResult, resetHistory } = useIDCardOCR();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Toggle flash
  const toggleFlash = useCallback(() => {
    setFlashOn((prev) => !prev);
  }, []);

  // Auto-capture when OCR is complete
  const readyCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const hasAutoCapturedRef = useRef(false);
  const isCapturingRef = useRef(false);
  const AUTO_CAPTURE_THRESHOLD = 30; // ~1 saniye

  // Cleanup
  useEffect(() => {
    return () => {
      resetHistory();
    };
  }, [resetHistory]);

  const handleBack = () => router.back();

  // Manuel capture - Vision Camera ile çek, sonra Document Scanner ile düzelt
  const handleManualCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturingRef.current) return;

    isCapturingRef.current = true;
    setIsCapturing(true);
    Vibration.vibrate(50);

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "quality",
        flash: flashOn ? "on" : "off"
      });

      const photoPath = photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`;
      const now = new Date();
      setCaptureTime(now);

      let finalImageUri = photoPath;

      // 1. Document Scanner ile perspektif düzeltme
      try {
        const { scannedImages, status } = await DocumentScanner.scanDocument({
          croppedImageQuality: 100,
          maxNumDocuments: 1
        });

        if (status === "success" && scannedImages && scannedImages.length > 0) {
          finalImageUri = scannedImages[0];
        }
      } catch (scanError) {
        console.warn("[ID-Front] Document scan failed, using original:", scanError);
      }

      // 2. Skia ile tarih damgası ekle
      try {
        finalImageUri = await addTimestampToImage(finalImageUri, now);
      } catch (timestampError) {
        console.warn("[ID-Front] Timestamp failed:", timestampError);
      }

      setCapturedImage(finalImageUri);
      setShowCamera(false);

      // OCR verilerini kaydet
      if (lastResult.data.tcNumber || lastResult.data.firstName || lastResult.data.lastName) {
        setOCRData?.(lastResult.data);
      }

      setIsUploading(true);
      const result = await setDocumentPhoto(finalImageUri, "id-front", now);
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
  }, [flashOn, lastResult.data, setDocumentPhoto, setOCRData]);

  // Frame processor - OCR sonuçlarını JS'e gönder
  const handleOCRResult = Worklets.createRunOnJS((ocrResult: any, frameNum: number) => {
    if (!ocrResult?.resultText) return;

    // processFrame ile sonuçları işle
    const result = processFrame({ resultText: ocrResult.resultText });

    // Auto-capture logic - sadece bir kez çalışsın
    if (result.isComplete && !hasAutoCapturedRef.current && !isCapturingRef.current) {
      readyCountRef.current++;
      if (readyCountRef.current >= AUTO_CAPTURE_THRESHOLD) {
        hasAutoCapturedRef.current = true;
        handleManualCapture();
      }
    } else if (!result.isComplete) {
      readyCountRef.current = 0;
    }
  });

  // Frame processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      runAsync(frame, () => {
        "worklet";
        try {
          const ocrResult = scanText(frame);
          handleOCRResult(ocrResult, frameCountRef.current++);
        } catch (error) {
          // Frame processor error - silent
        }
      });
    },
    [scanText, handleOCRResult]
  );

  const handleRetake = () => {
    setCapturedImage(null);
    setCaptureTime(null);
    hasAutoCapturedRef.current = false;
    isCapturingRef.current = false;
    readyCountRef.current = 0;
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
          torch={flashOn ? "on" : "off"}
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
          <Pressable style={styles.cameraBackButton} onPress={toggleFlash}>
            <Zap
              size={24}
              color={flashOn ? "#FBBF24" : "#fff"}
              fill={flashOn ? "#FBBF24" : "none"}
            />
          </Pressable>
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
            {/* Tarih/Saat damgası */}
            {captureTime && (
              <View style={styles.timestampContainer}>
                <Text style={styles.timestampText}>
                  {captureTime.toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}{" "}
                  {captureTime.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </Text>
              </View>
            )}
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
    timestampContainer: {
      position: "absolute",
      bottom: 12,
      right: 12,
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6
    },
    timestampText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "500",
      fontVariant: ["tabular-nums"]
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
