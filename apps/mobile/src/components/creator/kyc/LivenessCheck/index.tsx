/**
 * LivenessCheck Component
 * KYC için aktif canlılık kontrolü
 *
 * 4 Aşamalı Kontrol:
 * 1. Göz kırpma
 * 2. Gülümseme
 * 3. Başı sağa çevir
 * 4. Başı sola çevir
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, RotateCcw, X } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { Camera, useCameraDevice, Frame } from "react-native-vision-camera";
import { Camera as FaceCamera, Face } from "react-native-vision-camera-face-detector";
import { useLivenessDetection, type LivenessResult } from "@/hooks/creator";
import { LivenessProgress } from "./LivenessProgress";
import { LivenessOverlay } from "./LivenessOverlay";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const successSound = require("../../../../../assets/sound/liveness-true.mp3");

interface LivenessCheckProps {
  onComplete: (result: LivenessResult) => void;
  onCancel: () => void;
}

export function LivenessCheck({ onComplete, onCancel }: LivenessCheckProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets);

  const device = useCameraDevice("front");
  const cameraRef = useRef<FaceCamera>(null);

  // Başarı sesi player
  const successPlayer = useAudioPlayer(successSound);

  const [faceValid, setFaceValid] = useState(false);
  const [message, setMessage] = useState("");

  const {
    currentStep,
    currentStepConfig,
    currentStepIndex,
    totalSteps,
    completedSteps,
    isProcessing,
    isComplete,
    error,
    startLiveness,
    stopLiveness,
    resetLiveness,
    processFrame,
    getResult,
    clearError,
    stopListeners
  } = useLivenessDetection();

  // Audio mode ayarla ve liveness başlat
  useEffect(() => {
    const initAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false
        });
      } catch (e) {
        console.warn("[LivenessCheck] Audio mode setup failed:", e);
      }
    };

    initAudio();
    startLiveness();

    return () => {
      stopListeners();
    };
  }, [startLiveness, stopListeners]);

  // Her adım tamamlandığında ses çal
  const prevCompletedStepsRef = useRef(0);
  useEffect(() => {
    if (completedSteps.length > prevCompletedStepsRef.current) {
      // Yeni adım tamamlandı - ses çal
      successPlayer.seekTo(0);
      successPlayer.play();
      prevCompletedStepsRef.current = completedSteps.length;
    }
  }, [completedSteps.length, successPlayer]);

  // Handle completion
  useEffect(() => {
    if (isComplete) {
      const result = getResult();
      console.log("[LivenessCheck] Complete!", result);

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Delay before callback
      setTimeout(() => {
        onComplete(result);
      }, 1500);
    }
  }, [isComplete, getResult, onComplete]);

  // Handle error
  useEffect(() => {
    if (error) {
      Alert.alert("Zaman Aşımı", error, [
        { text: "Tekrar Dene", onPress: () => clearError() },
        { text: "İptal", onPress: onCancel, style: "cancel" }
      ]);
    }
  }, [error, clearError, onCancel]);

  // Face detection callback
  const handleFacesDetected = useCallback(
    (faces: Face[], frame: Frame) => {
      if (!isProcessing || isComplete) return;

      const result = processFrame(faces);
      setFaceValid(result.faceValid);
      setMessage(result.message);
    },
    [isProcessing, isComplete, processFrame]
  );

  // Handle retry - ilk adıma dön
  const handleRetry = useCallback(() => {
    prevCompletedStepsRef.current = 0; // Ses sayacını sıfırla
    resetLiveness();
    startLiveness();
  }, [resetLiveness, startLiveness]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    stopLiveness();
    onCancel();
  }, [stopLiveness, onCancel]);

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Kamera bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <FaceCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isProcessing && !isComplete}
        faceDetectionCallback={handleFacesDetected}
        faceDetectionOptions={{
          performanceMode: "accurate",
          classificationMode: "all",
          landmarkMode: "all",
          minFaceSize: 0.25,
          trackingEnabled: true
        }}
      />

      {/* Dark overlay for better contrast */}
      <View style={styles.darkOverlay} />

      {/* Overlay */}
      <LivenessOverlay
        stepConfig={currentStepConfig}
        isProcessing={isProcessing}
        isComplete={isComplete}
        faceValid={faceValid}
        message={message}
      />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <X size={24} color="#fff" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Canlılık Kontrolü</Text>
          <Text style={styles.headerSubtitle}>
            Adım {Math.min(currentStepIndex + 1, totalSteps)} / {totalSteps}
          </Text>
        </View>

        <Pressable onPress={handleRetry} style={styles.headerButton}>
          <RotateCcw size={24} color="#fff" />
        </Pressable>
      </SafeAreaView>

      {/* Progress Bar - Top */}
      <View style={styles.progressContainer}>
        <LivenessProgress currentStep={currentStepIndex} totalSteps={totalSteps} />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000"
    },
    darkOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)"
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.15)",
      justifyContent: "center",
      alignItems: "center"
    },
    headerCenter: {
      alignItems: "center"
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff"
    },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: "500",
      color: "rgba(255,255,255,0.7)",
      marginTop: 2
    },
    progressContainer: {
      position: "absolute",
      top: insets.top + 70,
      left: 20,
      right: 20
    },
    errorText: {
      color: colors.textPrimary,
      fontSize: 16,
      textAlign: "center",
      marginTop: 100
    }
  });
}

export { LivenessProgress } from "./LivenessProgress";
export { LivenessOverlay } from "./LivenessOverlay";
