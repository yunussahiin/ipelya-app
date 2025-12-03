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
import {
  Camera,
  useFrameProcessor,
  runAsync,
  useCameraDevice,
  Point
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { OCRResultOverlay } from "@/components/creator/kyc/OCRResultOverlay";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { addTimestampToImage } from "@/utils/imageUtils";

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

  const { documentPaths, setDocumentPhoto, setOCRData, goToStep } = useKYCVerification();

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

  // Tap to focus
  const handleFocus = useCallback(
    async (point: Point) => {
      try {
        if (cameraRef.current && device?.supportsFocus) {
          await cameraRef.current.focus(point);
          console.log("[ID-Front] Focus at:", point);
        }
      } catch (e) {
        // Focus failed - ignore
      }
    },
    [device]
  );

  // Auto-capture when OCR is complete
  const readyCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const hasAutoCapturedRef = useRef(false);
  const isCapturingRef = useRef(false);
  const cooldownUntilRef = useRef(0); // Hata sonrası bekleme süresi
  const AUTO_CAPTURE_THRESHOLD = 25; // ~0.8 saniye - OCR stabilize olsun
  const MIN_CONFIDENCE_FOR_CAPTURE = 0.85; // Minimum %85 güven gerekli
  const COOLDOWN_DURATION = 2000; // Hata sonrası 2 saniye bekle

  // Mount olduğunda ve kamera açıldığında ref'leri reset et
  useEffect(() => {
    // Sayfa yüklendiğinde veya kamera açıldığında tüm ref'leri sıfırla
    if (showCamera) {
      hasAutoCapturedRef.current = false;
      isCapturingRef.current = false;
      readyCountRef.current = 0;
      frameCountRef.current = 0;
      resetHistory(); // Önceki sayfanın OCR sonuçlarını temizle
      console.log("[ID-Front] Refs reset - camera opened");
    }

    return () => {
      resetHistory();
    };
  }, [resetHistory, showCamera]);

  const handleBack = () => {
    goToStep("form"); // Önceki adıma dön
    router.replace("/(creator)/kyc/form");
  };

  // Manuel capture - Vision Camera ile çek, crop et, tarih damgası ekle
  const handleManualCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturingRef.current) return;

    // Yanlış yüz kontrolü - ön yüzde MRZ varsa arka yüz taratılmış demektir
    if (lastResult.data.hasMRZ) {
      console.log("[ID-Front] ALERT: Yanlış Yüz - MRZ algılandı, arka yüz taratılmış", {
        hasMRZ: lastResult.data.hasMRZ,
        isComplete: lastResult.isComplete
      });
      Alert.alert("Yanlış Yüz", "Kimliğin arka yüzünü taradınız. Lütfen ön yüzü tarayın.", [
        { text: "Tekrar Dene" }
      ]);
      // Reset capture state + cooldown so user has time to flip card
      hasAutoCapturedRef.current = false;
      readyCountRef.current = 0;
      cooldownUntilRef.current = Date.now() + COOLDOWN_DURATION;
      console.log("[ID-Front] Cooldown started - wrong side");
      return; // Fotoğraf çekme!
    }

    isCapturingRef.current = true;
    setIsCapturing(true);
    setShowCamera(false); // Hemen kamerayı kapat - çift çekim önleme
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

      // 1. Fotoğrafı crop et - kimlik kartı çerçevesine göre
      try {
        const photoWidth = photo.width;
        const photoHeight = photo.height;

        // Fotoğraf orientation'ına göre boyutları ayarla
        const isLandscape = photoWidth > photoHeight;
        const effectiveWidth = isLandscape ? photoHeight : photoWidth;
        const effectiveHeight = isLandscape ? photoWidth : photoHeight;

        // Ekran oranlarını hesapla
        const cardLeftRatio = (SCREEN_WIDTH - CARD_WIDTH) / 2 / SCREEN_WIDTH;
        const cardTopRatio = (CARD_CENTER_Y - CARD_HEIGHT / 2) / SCREEN_HEIGHT;
        const cardWidthRatio = CARD_WIDTH / SCREEN_WIDTH;
        const cardHeightRatio = CARD_HEIGHT / SCREEN_HEIGHT;

        // Crop koordinatlarını hesapla
        let cropX = Math.floor(cardLeftRatio * effectiveWidth);
        let cropY = Math.floor(cardTopRatio * effectiveHeight);
        let cropWidth = Math.floor(cardWidthRatio * effectiveWidth);
        let cropHeight = Math.floor(cardHeightRatio * effectiveHeight);

        // Sınırları kontrol et
        cropX = Math.max(0, Math.min(cropX, effectiveWidth - 10));
        cropY = Math.max(0, Math.min(cropY, effectiveHeight - 10));
        cropWidth = Math.min(cropWidth, effectiveWidth - cropX);
        cropHeight = Math.min(cropHeight, effectiveHeight - cropY);

        console.log("[ID-Front] Crop params:", {
          photoWidth,
          photoHeight,
          cropX,
          cropY,
          cropWidth,
          cropHeight
        });

        if (
          cropWidth > 100 &&
          cropHeight > 100 &&
          cropX + cropWidth <= effectiveWidth &&
          cropY + cropHeight <= effectiveHeight
        ) {
          // Yeni ImageManipulator API
          const context = ImageManipulator.manipulate(photoPath);
          context.crop({ originX: cropX, originY: cropY, width: cropWidth, height: cropHeight });
          const imageRef = await context.renderAsync();
          const croppedImage = await imageRef.saveAsync({
            compress: 0.75,
            format: SaveFormat.JPEG
          });
          finalImageUri = croppedImage.uri;
          console.log("[ID-Front] Crop successful");
        } else {
          console.log("[ID-Front] Skipping crop - invalid dimensions");
        }
      } catch (cropError) {
        console.warn("[ID-Front] Crop failed, using original:", cropError);
      }

      // 2. Skia ile tarih damgası ekle
      try {
        finalImageUri = await addTimestampToImage(finalImageUri, now);
      } catch (timestampError) {
        console.warn("[ID-Front] Timestamp failed:", timestampError);
      }

      // OCR verilerini logla
      console.log("[ID-Front] OCR Sonuçları:", {
        tcNumber: lastResult.data.tcNumber || "-",
        firstName: lastResult.data.firstName || "-",
        lastName: lastResult.data.lastName || "-",
        birthDate: lastResult.data.birthDate || "-",
        hasMRZ: lastResult.data.hasMRZ ? "Evet" : "Hayır",
        confidence: `${Math.round(lastResult.confidence * 100)}%`
      });

      // OCR kalitesi kontrolü - kötü sonuçları engelle
      const firstName = (lastResult.data.firstName || "").toUpperCase();
      const lastName = (lastResult.data.lastName || "").toUpperCase();

      // Kötü OCR tespiti - yaygın yanlış okumalar
      const badWords = [
        "REPUBLIC",
        "TURKEY",
        "IDENTITY",
        "CARD",
        "TURKIYE",
        "TORKIYE",
        "TÜRKIYE",
        "CUMHURIYET",
        "CUMHURIYETI",
        "CUNEHURIYETI",
        "KIMLIK",
        "KARTI",
        "SURNAME",
        "NAME",
        "GIVEN",
        "DATE",
        "BIRTH",
        "DOCUMENT"
      ];

      const containsBadWord = badWords.some(
        (word) => firstName.includes(word) || lastName.includes(word)
      );

      const isBadOCR =
        firstName.length > 25 || // İsim çok uzun (yanlış okuma)
        lastName.length > 25 ||
        firstName.split(" ").length > 3 || // Çok fazla kelime
        containsBadWord ||
        !lastResult.data.tcNumber; // TC kimlik no okunamadı

      if (isBadOCR || lastResult.confidence < 0.6) {
        console.log("[ID-Front] ALERT: Okuma Kalitesi Düşük", {
          isBadOCR,
          confidence: lastResult.confidence,
          firstName,
          lastName,
          tcNumber: lastResult.data.tcNumber
        });
        Alert.alert(
          "Okuma Kalitesi Düşük",
          "Kimlik kartı net okunamadı. Lütfen:\n\n• Kartı çerçeveye düzgün yerleştirin\n• Işığın yeterli olduğundan emin olun\n• Telefonu sabit tutun",
          [{ text: "Tekrar Dene" }]
        );
        // Reset capture state + cooldown so user has time to adjust
        setShowCamera(true); // Kamerayı tekrar aç
        setIsCapturing(false);
        isCapturingRef.current = false;
        hasAutoCapturedRef.current = false;
        readyCountRef.current = 0;
        cooldownUntilRef.current = Date.now() + COOLDOWN_DURATION;
        console.log("[ID-Front] Cooldown started - 2 seconds");
        return;
      }

      setCapturedImage(finalImageUri);
      // showCamera zaten false - çekim başında kapatıldı

      // OCR verilerini kaydet - sadece yüksek güvenli ve geçerli veriler
      const hasValidTC = lastResult.data.tcNumber && lastResult.data.tcNumber.length === 11;
      const hasValidName = lastResult.data.firstName && lastResult.data.firstName.length <= 30;
      if (lastResult.confidence >= 0.7 && hasValidTC && hasValidName) {
        // Confidence'ı da ekleyerek gönder
        setOCRData?.({ ...lastResult.data, confidence: lastResult.confidence });
      } else {
        console.log("[ID-Front] OCR güveni düşük veya veriler geçersiz, kayıt atlandı");
      }

      setIsUploading(true);
      const result = await setDocumentPhoto(finalImageUri, "id-front", now);
      setIsUploading(false);

      if (!result.success) {
        console.log("[ID-Front] ALERT: Upload hatası", { error: result.error });
        Alert.alert("Hata", result.error || "Fotoğraf yüklenemedi");
      }
    } catch (error) {
      console.error("Capture error:", error);
      console.log("[ID-Front] ALERT: Çekim başarısız", { error });
      Alert.alert("Hata", "Çekim başarısız oldu");
      setShowCamera(true); // Hata durumunda kamerayı tekrar aç
    } finally {
      setIsCapturing(false);
      isCapturingRef.current = false;
    }
  }, [flashOn, lastResult, setDocumentPhoto, setOCRData]);

  // Frame processor - OCR sonuçlarını JS'e gönder
  const handleOCRResult = Worklets.createRunOnJS((ocrResult: any, frameNum: number) => {
    if (!ocrResult?.resultText) return;

    // processFrame ile sonuçları işle
    const result = processFrame({ resultText: ocrResult.resultText });

    // Debug: Her 30 frame'de bir durumu logla
    if (frameNum % 30 === 0) {
      console.log("[ID-Front] Auto-capture state:", {
        isComplete: result.isComplete,
        hasAutoCaptured: hasAutoCapturedRef.current,
        isCapturing: isCapturingRef.current,
        readyCount: readyCountRef.current,
        confidence: Math.round(result.confidence * 100) + "%"
      });
    }

    // Cooldown kontrolü - hata sonrası bekleme süresi
    const now = Date.now();
    if (cooldownUntilRef.current > now) {
      readyCountRef.current = 0;
      return; // Cooldown süresi dolmadı, bekle
    }

    // Auto-capture logic - sadece bir kez çalışsın
    // Minimum confidence kontrolü ekle - düşük güvende çekme
    if (
      result.isComplete &&
      result.confidence >= MIN_CONFIDENCE_FOR_CAPTURE &&
      !hasAutoCapturedRef.current &&
      !isCapturingRef.current
    ) {
      readyCountRef.current++;
      if (readyCountRef.current >= AUTO_CAPTURE_THRESHOLD) {
        hasAutoCapturedRef.current = true;
        handleManualCapture();
      }
    } else if (!result.isComplete || result.confidence < MIN_CONFIDENCE_FOR_CAPTURE) {
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
      <Pressable
        style={styles.cameraContainer}
        onPress={(e) => handleFocus({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY })}
      >
        {/* Kamera */}
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
          torch={flashOn ? "on" : "off"}
          frameProcessor={frameProcessor}
          pixelFormat="yuv"
        />

        {/* OCR overlay */}
        <OCRResultOverlay result={lastResult} variant="front" />

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
      </Pressable>
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
