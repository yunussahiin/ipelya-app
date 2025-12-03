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

interface LivenessCheckProps {
  onComplete: (result: LivenessResult) => void;
  onCancel: () => void;
  onSkip?: () => void;
}

export function LivenessCheck({ onComplete, onCancel, onSkip }: LivenessCheckProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets);

  const device = useCameraDevice("front");
  const cameraRef = useRef<FaceCamera>(null);

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

  // Start liveness on mount
  useEffect(() => {
    startLiveness();
    return () => {
      stopListeners();
    };
  }, []);

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

  // Handle retry
  const handleRetry = useCallback(() => {
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
          <X size={24} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Canlılık Kontrolü</Text>

        <Pressable onPress={handleRetry} style={styles.headerButton}>
          <RotateCcw size={24} color={colors.textPrimary} />
        </Pressable>
      </SafeAreaView>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <LivenessProgress currentStep={currentStepIndex} totalSteps={totalSteps} />
        <Text style={[styles.stepText, { color: colors.textSecondary }]}>
          Adım {Math.min(currentStepIndex + 1, totalSteps)} / {totalSteps}
        </Text>
      </View>

      {/* Skip Button (optional) */}
      {onSkip && !isComplete && (
        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Atla</Text>
          </Pressable>
        </SafeAreaView>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
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
      backgroundColor: "rgba(0,0,0,0.3)"
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center"
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600"
    },
    progressContainer: {
      position: "absolute",
      top: insets.top + 60,
      left: 0,
      right: 0,
      alignItems: "center",
      gap: 8
    },
    stepText: {
      fontSize: 14,
      fontWeight: "500"
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      paddingBottom: 20
    },
    skipButton: {
      paddingHorizontal: 24,
      paddingVertical: 12
    },
    skipText: {
      fontSize: 16,
      fontWeight: "500"
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
