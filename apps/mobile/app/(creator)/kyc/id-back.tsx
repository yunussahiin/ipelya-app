/**
 * KYC ID Back Screen
 * Kimlik arka yüz fotoğraf çekimi - MRZ okuma
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
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
import { ArrowLeft, RefreshCw, ArrowRight, Camera as CameraIcon, Zap } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";
import {
  Camera,
  useCameraDevice,
  useFrameProcessor,
  runAsync,
  Point
} from "react-native-vision-camera";
import { Worklets } from "react-native-worklets-core";
import { OCRResultOverlay } from "@/components/creator/kyc/OCRResultOverlay";
import { useIDCardOCR } from "@/hooks/creator/useIDCardOCR";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { addTimestampToImage } from "@/utils/imageUtils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Kimlik kartı çerçeve boyutları
const CARD_ASPECT_RATIO = 1.586;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH / CARD_ASPECT_RATIO;
const CARD_CENTER_Y = SCREEN_HEIGHT * 0.4;

export default function KYCIdBackScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { documentPaths, setDocumentPhoto, setOCRData, goToStep } = useKYCVerification();

  const [showCamera, setShowCamera] = useState(!documentPaths.idBackPath);
  const [capturedImage, setCapturedImage] = useState<string | null>(documentPaths.idBackPath);
  const [captureTime, setCaptureTime] = useState<Date | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // OCR - MRZ okuma için
  const { scanText, processFrame, lastResult, resetHistory } = useIDCardOCR();
  const device = useCameraDevice("back");
  const cameraRef = useRef<Camera>(null);
  const frameCountRef = useRef(0);

  // Auto-capture refs
  const readyCountRef = useRef(0);
  const wrongSideCountRef = useRef(0); // Yanlış yüz sayacı
  const hasAutoCapturedRef = useRef(false);
  const isCapturingRef = useRef(false);
  const wrongSideAlertShownRef = useRef(false); // Yanlış yüz uyarısı gösterildi mi
  const cooldownUntilRef = useRef(0); // Hata sonrası bekleme süresi
  const AUTO_CAPTURE_THRESHOLD = 15; // ~0.5 saniye - MRZ hızlı okunuyor
  const WRONG_SIDE_THRESHOLD = 10; // Yanlış yüz için kısa süre
  const MIN_CONFIDENCE_FOR_CAPTURE = 0.6; // MRZ için daha düşük threshold
  const COOLDOWN_DURATION = 2000; // Hata sonrası 2 saniye bekle

  // Mount olduğunda ve kamera açıldığında ref'leri reset et
  useEffect(() => {
    if (showCamera) {
      hasAutoCapturedRef.current = false;
      isCapturingRef.current = false;
      readyCountRef.current = 0;
      frameCountRef.current = 0;
      wrongSideCountRef.current = 0;
      wrongSideAlertShownRef.current = false;
      resetHistory(); // Önceki sayfanın OCR sonuçlarını temizle
      console.log("[ID-Back] Refs reset - camera opened");
    }

    return () => {
      resetHistory();
    };
  }, [resetHistory, showCamera]);

  const handleBack = () => {
    goToStep("id-front"); // Önceki adıma dön
    router.replace("/(creator)/kyc/id-front");
  };

  const toggleFlash = useCallback(() => {
    setFlashOn((prev) => !prev);
  }, []);

  // Tap to focus
  const handleFocus = useCallback(
    async (point: Point) => {
      try {
        if (cameraRef.current && device?.supportsFocus) {
          await cameraRef.current.focus(point);
          console.log("[ID-Back] Focus at:", point);
        }
      } catch (e) {
        // Focus failed - ignore
      }
    },
    [device]
  );

  // Manuel capture - Vision Camera ile çek, crop et, tarih damgası ekle
  const handleManualCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturingRef.current) return;

    // Yanlış yüz kontrolü - arka yüzde MRZ olmalı, yoksa ön yüz taratılmış
    if (!lastResult.data.hasMRZ && lastResult.isComplete) {
      console.log("[ID-Back] ALERT: Yanlış Yüz (manuel) - MRZ yok ama isComplete", {
        hasMRZ: lastResult.data.hasMRZ,
        isComplete: lastResult.isComplete,
        confidence: lastResult.confidence
      });
      Alert.alert("Yanlış Yüz", "Kimliğin ön yüzünü taradınız. Lütfen arka yüzü tarayın.", [
        { text: "Tekrar Dene" }
      ]);
      // Reset capture state so user can try again
      hasAutoCapturedRef.current = false;
      readyCountRef.current = 0;
      wrongSideCountRef.current = 0;
      wrongSideAlertShownRef.current = false;
      return;
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

        console.log("[ID-Back] Crop params:", {
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
          console.log("[ID-Back] Crop successful");
        } else {
          console.log("[ID-Back] Skipping crop - invalid dimensions");
        }
      } catch (cropError) {
        console.warn("[ID-Back] Crop failed, using original:", cropError);
      }

      // 2. Skia ile tarih damgası ekle
      try {
        finalImageUri = await addTimestampToImage(finalImageUri, now);
      } catch (timestampError) {
        console.warn("[ID-Back] Timestamp failed:", timestampError);
      }

      setCapturedImage(finalImageUri);
      // showCamera zaten false - çekim başında kapatıldı

      // OCR verilerini logla
      console.log("[ID-Back] OCR Sonuçları:", {
        tcNumber: lastResult.data.tcNumber || "-",
        firstName: lastResult.data.firstName || "-",
        lastName: lastResult.data.lastName || "-",
        birthDate: lastResult.data.birthDate || "-",
        expiryDate: lastResult.data.expiryDate || "-",
        gender: lastResult.data.gender || "-",
        hasMRZ: lastResult.data.hasMRZ ? "Evet" : "Hayır",
        confidence: `${Math.round(lastResult.confidence * 100)}%`
      });

      // MRZ verilerini kaydet - sadece yüksek güvenli ve geçerli veriler
      // Düşük güvenli arka yüz OCR'ı ön yüzdeki doğru verileri bozmasın
      const hasValidTC = lastResult.data.tcNumber && lastResult.data.tcNumber.length === 11;
      const hasValidFirstName = lastResult.data.firstName && lastResult.data.firstName.length <= 25;
      const hasValidLastName = lastResult.data.lastName && lastResult.data.lastName.length <= 25;
      const isHighConfidence = lastResult.confidence >= 0.7;

      if (isHighConfidence && hasValidTC && hasValidFirstName && hasValidLastName) {
        // Confidence'ı da ekleyerek gönder
        setOCRData?.({ ...lastResult.data, confidence: lastResult.confidence });
      } else {
        console.log("[ID-Back] OCR güveni düşük veya veriler geçersiz, ön yüz verileri korunuyor", {
          confidence: lastResult.confidence,
          tcValid: hasValidTC,
          firstNameValid: hasValidFirstName,
          lastNameValid: hasValidLastName
        });
      }

      setIsUploading(true);
      const result = await setDocumentPhoto(finalImageUri, "id-back", now);
      setIsUploading(false);

      if (!result.success) {
        console.log("[ID-Back] ALERT: Upload hatası", { error: result.error });
        Alert.alert("Hata", result.error || "Fotoğraf yüklenemedi");
      }
    } catch (error) {
      console.error("Capture error:", error);
      console.log("[ID-Back] ALERT: Çekim başarısız", { error });
      Alert.alert("Hata", "Çekim başarısız oldu");
      setShowCamera(true); // Hata durumunda kamerayı tekrar aç
    } finally {
      setIsCapturing(false);
      isCapturingRef.current = false;
    }
  }, [flashOn, lastResult, setDocumentPhoto, setOCRData]);

  const handleRetake = () => {
    setCapturedImage(null);
    setCaptureTime(null);
    setShowCamera(true);
    // Reset all capture refs
    hasAutoCapturedRef.current = false;
    isCapturingRef.current = false;
    readyCountRef.current = 0;
    wrongSideCountRef.current = 0;
    wrongSideAlertShownRef.current = false;
  };

  const handleNext = () => {
    if (capturedImage) {
      router.push("/(creator)/kyc/selfie");
    }
  };

  // Frame processor - MRZ OCR sonuçlarını JS'e gönder
  const handleOCRResult = Worklets.createRunOnJS((ocrResult: any, frameNum: number) => {
    if (!ocrResult?.resultText) return;

    // processFrame ile sonuçları işle
    const result = processFrame({ resultText: ocrResult.resultText });

    // Cooldown kontrolü - hata sonrası bekleme süresi
    const now = Date.now();
    if (cooldownUntilRef.current > now) {
      readyCountRef.current = 0;
      wrongSideCountRef.current = 0;
      return; // Cooldown süresi dolmadı, bekle
    }

    // Auto-capture logic - Arka yüzde MRZ + minimum confidence gerekli
    if (
      result.data.hasMRZ &&
      result.confidence >= MIN_CONFIDENCE_FOR_CAPTURE &&
      !hasAutoCapturedRef.current &&
      !isCapturingRef.current
    ) {
      readyCountRef.current++;
      wrongSideCountRef.current = 0; // Doğru yüz, yanlış yüz sayacını sıfırla
      if (readyCountRef.current >= AUTO_CAPTURE_THRESHOLD) {
        hasAutoCapturedRef.current = true;
        handleManualCapture();
      }
    } else if (!result.data.hasMRZ && result.confidence > 0.3) {
      // Ön yüz algılandı (MRZ yok ama OCR tamamlandı) - yanlış yüz!
      readyCountRef.current = 0;
      wrongSideCountRef.current++;

      if (wrongSideCountRef.current >= WRONG_SIDE_THRESHOLD && !wrongSideAlertShownRef.current) {
        wrongSideAlertShownRef.current = true;
        cooldownUntilRef.current = Date.now() + COOLDOWN_DURATION;
        console.log("[ID-Back] ALERT: Yanlış Yüz (auto) - MRZ yok, confidence > 0.3", {
          hasMRZ: result.data.hasMRZ,
          confidence: result.confidence,
          wrongSideCount: wrongSideCountRef.current
        });
        Alert.alert(
          "Yanlış Yüz",
          "Kimliğin ön yüzünü taradınız. Lütfen arka yüzü (MRZ kodlu) tarayın.",
          [
            {
              text: "Tamam",
              onPress: () => {
                // Reset all capture refs so user can retry
                wrongSideAlertShownRef.current = false;
                wrongSideCountRef.current = 0;
                hasAutoCapturedRef.current = false;
                readyCountRef.current = 0;
              }
            }
          ]
        );
      }
    } else {
      readyCountRef.current = 0;
      wrongSideCountRef.current = 0;
    }
  });

  // Frame processor
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      runAsync(frame, () => {
        "worklet";
        frameCountRef.current++;
        // Her 5 frame'de bir OCR yap (performans için)
        if (frameCountRef.current % 5 !== 0) return;

        try {
          const result = scanText(frame);
          if (result?.resultText) {
            handleOCRResult(result, frameCountRef.current);
          }
        } catch (e) {
          // OCR error - ignore
        }
      });
    },
    [scanText, handleOCRResult]
  );

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

        {/* OCR overlay - MRZ için */}
        <OCRResultOverlay result={lastResult} variant="back" />

        {/* Üst bar */}
        <SafeAreaView style={styles.cameraHeader} edges={["top"]}>
          <Pressable style={styles.cameraBackButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
          <Text style={styles.cameraTitle}>Kimlik Arka Yüz</Text>
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
                  backgroundColor: "rgba(255,255,255,0.3)",
                  opacity: isCapturing ? 0.5 : 1
                }
              ]}
              onPress={handleManualCapture}
              disabled={isCapturing}
            >
              <CameraIcon size={32} color="#fff" />
            </Pressable>
            <Text style={styles.captureHint}>Kimliğinizin arkasını çerçeveye yerleştirin</Text>
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
        <Text style={styles.headerTitle}>Kimlik Arka Yüz</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: "75%", backgroundColor: colors.accent }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>Adım 3/4</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Kimliğinizin Arka Yüzü</Text>
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
    },
    // Camera styles
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
      color: "#fff",
      fontSize: 17,
      fontWeight: "600"
    },
    cameraBottom: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 20
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
      textAlign: "center"
    }
  });
