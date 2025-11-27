/**
 * BottomControls
 *
 * Kamera alt kontrolleri
 * - Mod seçici (Fotoğraf/Video)
 * - Yakalama butonu
 * - Kamera çevirme butonu
 */

import { memo, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { ModeSelector } from "./ModeSelector";
import { CaptureButton } from "./CaptureButton";
import { FlipCameraButton } from "./FlipCameraButton";
import type { BottomControlsProps } from "../types";

const LOG_PREFIX = "[BottomControls]";

function BottomControlsComponent({
  currentMode,
  onModeChange,
  isRecording,
  isCapturing,
  onCapture,
  onFlipCamera,
  accentColor
}: BottomControlsProps) {
  useEffect(() => {
    console.log(`${LOG_PREFIX} Mounted`, { currentMode, isRecording, isCapturing });
  }, []);

  useEffect(() => {
    console.log(`${LOG_PREFIX} Mode changed:`, currentMode);
  }, [currentMode]);

  useEffect(() => {
    console.log(`${LOG_PREFIX} Recording state:`, isRecording);
  }, [isRecording]);

  return (
    <View style={styles.container}>
      {/* Mod Seçici */}
      <ModeSelector
        currentMode={currentMode}
        onModeChange={onModeChange}
        accentColor={accentColor}
        disabled={isRecording}
      />

      {/* Yakalama Butonu */}
      <CaptureButton
        mode={currentMode}
        isRecording={isRecording}
        isCapturing={isCapturing}
        onPress={onCapture}
      />

      {/* Kamera Çevirme */}
      <FlipCameraButton onFlip={onFlipCamera} disabled={isRecording} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 30
  }
});

export const BottomControls = memo(BottomControlsComponent);
