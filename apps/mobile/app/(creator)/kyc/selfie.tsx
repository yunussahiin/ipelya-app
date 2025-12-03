/**
 * KYC Selfie Screen
 * Selfie fotoğraf çekimi - Yüz algılama ve Liveness kontrolü ile
 *
 * Akış:
 * 1. Liveness Check (4 adım: göz kırp, gülümse, sağa çevir, sola çevir)
 * 2. Liveness başarılı → Selfie çekimi
 * 3. Selfie yükleme ve başvuru gönderme
 */

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Image, Alert, Vibration } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, RefreshCw, Check, Camera as CameraIcon } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification, useKYCSelfieDetection, type LivenessResult } from "@/hooks/creator";
import { Camera as VisionCamera, useCameraDevice, Frame } from "react-native-vision-camera";
import { Camera, Face, FaceDetectionOptions } from "react-native-vision-camera-face-detector";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { addTimestampToImage } from "@/utils/imageUtils";
import { SelfieFaceOverlay, LivenessCheck } from "@/components/creator/kyc";

export default function KYCSelfieScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const {
    documentPaths,
    setDocumentPhoto,
    deleteDocument,
    submitApplication,
    canSubmit,
    isSubmitting,
    formData,
    goToStep,
    setFaceDetectionPassed,
    setLivenessFrames
  } = useKYCVerification();

  // Debug: canSubmit durumunu logla
  useEffect(() => {
    console.log("[Selfie] canSubmit check:", {
      canSubmit,
      formData: {
        firstName: formData.firstName || "-",
        lastName: formData.lastName || "-",
        birthDate: formData.birthDate || "-"
      },
      documentPaths: {
        idFront: documentPaths.idFrontPath ? "✓" : "✗",
        idBack: documentPaths.idBackPath ? "✓" : "✗",
        selfie: documentPaths.selfiePath ? "✓" : "✗"
      }
    });
  }, [canSubmit, formData, documentPaths]);

  // Liveness state
  const [showLiveness, setShowLiveness] = useState(!documentPaths.selfiePath);
  const [livenessCompleted, setLivenessCompleted] = useState(false);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(documentPaths.selfiePath);
  const [isUploading, setIsUploading] = useState(false);

  // Face detection - overlay için
  const { validateFace, lastValidation, updateValidation, stopListeners } = useKYCSelfieDetection();

  const device = useCameraDevice("front");
  const cameraRef = useRef<Camera>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Auto-capture refs
  const isCapturingRef = useRef(false);
  const hasAutoCapturedRef = useRef(false);
  const readyCountRef = useRef(0);
  const AUTO_CAPTURE_THRESHOLD = 90; // 3 saniye (30fps)

  // Countdown state - manuel ve otomatik için
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null); // 3, 2, 1 sayacı

  // Face detection options
  const faceDetectionOptions = useRef<FaceDetectionOptions>({
    performanceMode: "fast",
    classificationMode: "all",
    minFaceSize: 0.25,
    trackingEnabled: false
  }).current;

  // Cleanup
  useEffect(() => {
    return () => {
      stopListeners();
    };
  }, [stopListeners]);

  // Reset auto-capture when camera opens
  useEffect(() => {
    if (showCamera) {
      isCapturingRef.current = false;
      hasAutoCapturedRef.current = false;
      readyCountRef.current = 0;
      setCountdown(null);
      setAutoCountdown(null);
    }
  }, [showCamera]);

  const handleBack = () => {
    goToStep("id-back"); // Önceki adıma dön
    router.replace("/(creator)/kyc/id-back");
  };

  // Liveness tamamlandığında
  const handleLivenessComplete = useCallback(
    (result: LivenessResult) => {
      console.log("[Selfie] Liveness completed:", result);
      setLivenessResult(result);
      setLivenessCompleted(true);
      setShowLiveness(false);
      setShowCamera(true); // Selfie çekimine geç

      // Liveness frames'i kaydet
      if (result.frames && result.frames.length > 0) {
        setLivenessFrames(result.frames);
      }
    },
    [setLivenessFrames]
  );

  // Liveness iptal edildiğinde
  const handleLivenessCancel = useCallback(() => {
    console.log("[Selfie] Liveness cancelled");
    handleBack();
  }, [handleBack]);

  // Liveness atlandığında (opsiyonel)
  const handleLivenessSkip = useCallback(() => {
    console.log("[Selfie] Liveness skipped");
    setShowLiveness(false);
    setShowCamera(true);
  }, []);

  // Auto capture - yüz algılandığında otomatik çekim
  const handleAutoCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "quality",
        flash: "off"
      });

      const photoPath = `file://${photo.path}`;
      const captureTime = new Date();

      // Selfie'yi optimize et
      let finalImageUri = photoPath;
      try {
        const context = ImageManipulator.manipulate(photoPath);
        context.resize({ width: 800 });
        const imageRef = await context.renderAsync();
        const result = await imageRef.saveAsync({
          compress: 0.75,
          format: SaveFormat.JPEG
        });
        finalImageUri = result.uri;
        console.log("[Selfie] Auto-capture optimized");
      } catch (e) {
        console.warn("[Selfie] Optimization failed:", e);
      }

      // Timestamp ekle
      try {
        finalImageUri = await addTimestampToImage(finalImageUri, captureTime);
      } catch (e) {
        console.warn("[Selfie] Timestamp failed:", e);
      }

      setCapturedImage(finalImageUri);
      setShowCamera(false);
      setIsCapturing(true);

      setIsUploading(true);
      const result = await setDocumentPhoto(finalImageUri, "selfie", captureTime);
      setIsUploading(false);
      setIsCapturing(false);
      isCapturingRef.current = false;

      if (!result.success) {
        Alert.alert("Hata", result.error || "Fotoğraf yüklenemedi");
      } else {
        console.log("[Selfie] Auto-capture successful!");
        // Face detection başarılı olarak işaretle
        setFaceDetectionPassed(true);
      }
    } catch (e) {
      console.error("[Selfie] Auto-capture error:", e);
      isCapturingRef.current = false;
      hasAutoCapturedRef.current = false;
      setIsCapturing(false);
    }
  }, [setDocumentPhoto, setFaceDetectionPassed]);

  // Face detection callback - handleAutoCapture'dan sonra tanımlanmalı
  const handleFacesDetected = useCallback(
    (faces: Face[], frame: Frame) => {
      if (isCapturingRef.current || hasAutoCapturedRef.current || countdown !== null) return;

      const result = validateFace(faces);
      updateValidation(result);

      // Auto-capture logic - yüz hazır olduğunda sayaç başlat
      if (result.isValid) {
        readyCountRef.current++;

        // Sayaç güncelle (her 30 frame = 1 saniye)
        const secondsRemaining = Math.ceil((AUTO_CAPTURE_THRESHOLD - readyCountRef.current) / 30);
        if (secondsRemaining !== autoCountdown && secondsRemaining > 0) {
          setAutoCountdown(secondsRemaining);
        }

        if (readyCountRef.current >= AUTO_CAPTURE_THRESHOLD && !isCapturingRef.current) {
          console.log("[Selfie] Face ready - auto capturing!");
          setAutoCountdown(null);
          hasAutoCapturedRef.current = true;
          isCapturingRef.current = true;
          Vibration.vibrate(50);
          handleAutoCapture();
        }
      } else {
        readyCountRef.current = 0;
        if (autoCountdown !== null) {
          setAutoCountdown(null);
        }
      }
    },
    [validateFace, updateValidation, countdown, handleAutoCapture, autoCountdown]
  );

  // Countdown başlat - 3 saniye sonra otomatik çek (yüz kontrolü ile)
  const startCountdown = useCallback(() => {
    if (isCapturingRef.current || hasAutoCapturedRef.current) return;

    // Yüz kontrolü - yüz yoksa veya hazır değilse uyarı ver
    if (!lastValidation.isValid) {
      Alert.alert(
        "Yüz Algılanamadı",
        lastValidation.message || "Lütfen yüzünüzü çerçeveye yerleştirin ve tekrar deneyin.",
        [{ text: "Tamam" }]
      );
      return;
    }

    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (prev === 1) {
            console.log("[Selfie] Countdown finished, capturing...");
            handleAutoCapture();
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleAutoCapture, lastValidation]);

  // Manuel capture - optimize et ve timestamp ekle
  const handleManualCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    Vibration.vibrate(50); // Haptic feedback

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "quality",
        flash: "off"
      });

      const photoPath = `file://${photo.path}`;
      const captureTime = new Date();

      // Selfie'yi optimize et (resize + compress) - Yeni API
      let finalImageUri = photoPath;
      try {
        // Selfie için daha küçük boyut yeterli (800x800 max)
        const context = ImageManipulator.manipulate(photoPath);
        context.resize({ width: 800 });
        const imageRef = await context.renderAsync();
        const result = await imageRef.saveAsync({
          compress: 0.75,
          format: SaveFormat.JPEG
        });
        finalImageUri = result.uri;
        console.log("[Selfie] Optimized");
      } catch (e) {
        console.warn("[Selfie] Optimization failed, using original:", e);
      }

      // Timestamp ekle
      try {
        finalImageUri = await addTimestampToImage(finalImageUri, captureTime);
        console.log("[Selfie] Timestamp added");
      } catch (e) {
        console.warn("[Selfie] Timestamp failed:", e);
      }

      setCapturedImage(finalImageUri);
      setShowCamera(false);

      setIsUploading(true);
      const result = await setDocumentPhoto(finalImageUri, "selfie", captureTime);
      setIsUploading(false);

      if (!result.success) {
        Alert.alert("Hata", result.error || "Fotoğraf yüklenemedi");
      } else {
        // Face detection başarılı olarak işaretle (manuel çekimde de yüz kontrolü yapıldı)
        setFaceDetectionPassed(lastValidation.isValid);
      }
    } catch (error) {
      console.error("Capture error:", error);
      Alert.alert("Hata", "Çekim başarısız oldu");
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, setDocumentPhoto, setFaceDetectionPassed, lastValidation]);

  const handleRetake = async () => {
    // Önceki selfie'yi sil
    if (documentPaths.selfiePath) {
      await deleteDocument("selfie");
    }
    setCapturedImage(null);
    setShowCamera(true);
    // Auto-capture state'lerini sıfırla
    isCapturingRef.current = false;
    hasAutoCapturedRef.current = false;
    readyCountRef.current = 0;
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      // Eksik bilgileri göster
      const missing: string[] = [];
      if (!formData.firstName) missing.push("Ad");
      if (!formData.lastName) missing.push("Soyad");
      if (!formData.birthDate) missing.push("Doğum Tarihi");
      if (!documentPaths.idFrontPath) missing.push("Kimlik Ön Yüz");
      if (!documentPaths.idBackPath) missing.push("Kimlik Arka Yüz");
      if (!documentPaths.selfiePath) missing.push("Selfie");

      Alert.alert("Eksik Bilgi", `Lütfen şu bilgileri tamamlayın:\n\n• ${missing.join("\n• ")}`);
      return;
    }

    const result = await submitApplication("basic");

    if (result.success) {
      router.replace("/(creator)/kyc/result");
    } else {
      Alert.alert("Hata", result.error || "Başvuru gönderilemedi");
    }
  };

  // Liveness Check ekranı
  if (showLiveness) {
    return (
      <LivenessCheck
        onComplete={handleLivenessComplete}
        onCancel={handleLivenessCancel}
        // onSkip={handleLivenessSkip} // Opsiyonel: Atla butonu
      />
    );
  }

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
        {/* Kamera - face detection ile */}
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          faceDetectionCallback={handleFacesDetected}
          faceDetectionOptions={faceDetectionOptions}
        />

        {/* Yüz algılama overlay */}
        <SelfieFaceOverlay validation={lastValidation} autoCountdown={autoCountdown} />

        {/* Üst bar */}
        <SafeAreaView style={styles.cameraHeader} edges={["top"]}>
          <Pressable style={styles.cameraBackButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <Text style={styles.cameraTitle}>Selfie</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {/* Countdown göstergesi */}
        {countdown !== null && (
          <View style={styles.countdownContainer}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          </View>
        )}

        {/* Alt bar - Modern Capture butonu */}
        <SafeAreaView style={styles.cameraBottom} edges={["bottom"]}>
          <View style={styles.captureContainer}>
            {/* Capture Button - Instagram tarzı */}
            <Pressable
              style={[
                styles.captureButtonOuter,
                { opacity: isCapturing || countdown !== null ? 0.5 : 1 }
              ]}
              onPress={countdown === null ? startCountdown : undefined}
              disabled={isCapturing || countdown !== null}
            >
              <View style={styles.captureButtonInner}>
                {isCapturing || countdown !== null ? (
                  <View style={styles.capturingIndicator} />
                ) : (
                  <CameraIcon size={28} color="#fff" />
                )}
              </View>
            </Pressable>
            <Text style={styles.captureHint}>
              {countdown !== null ? "Hazırlanın..." : "Fotoğraf çekmek için dokunun"}
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
        <Text style={styles.headerTitle}>Selfie</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: "100%", backgroundColor: colors.accent }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>Adım 4/4</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Selfie Fotoğrafınız</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Yüzünüz net görünüyor olmalı. Gözlük veya şapka takmayın.
        </Text>

        {/* Preview */}
        {capturedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="cover" />
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
            <RefreshCw size={24} color={colors.textPrimary} />
          </Pressable>

          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: colors.accent,
                opacity: isUploading || isSubmitting || !canSubmit ? 0.5 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={isUploading || isSubmitting || !canSubmit}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Gönderiliyor...</Text>
            ) : (
              <>
                <Check size={22} color="#fff" />
                <Text style={styles.submitButtonText}>Başvuruyu Gönder</Text>
              </>
            )}
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
      paddingBottom: 20
    },
    captureButtonOuter: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 4,
      borderColor: "rgba(255,255,255,0.9)",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent"
    },
    captureButtonInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#10B981",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8
    },
    capturingIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#fff"
    },
    captureHint: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 14,
      marginTop: 12,
      textAlign: "center"
    },
    countdownContainer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.3)"
    },
    countdownCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "rgba(16, 185, 129, 0.9)",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10
    },
    countdownText: {
      fontSize: 64,
      fontWeight: "700",
      color: "#fff"
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
      width: 56,
      height: 56,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 28,
      borderWidth: 1.5
    },
    submitButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      gap: 8
    },
    submitButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600"
    }
  });
