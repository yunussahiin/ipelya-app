/**
 * Audio Preview Component
 * Sesli yayın önizlemesi
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface AudioPreviewProps {
  isMicOn: boolean;
  onToggleMic: () => void;
}

export function AudioPreview({ isMicOn, onToggleMic }: AudioPreviewProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.placeholder, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.audioCircle, { backgroundColor: colors.accent }]}>
          <Ionicons name="mic" size={48} color="#fff" />
        </View>
        <Text style={[styles.audioText, { color: colors.textPrimary }]}>Sesli Yayın</Text>
        <Text style={[styles.audioSubtext, { color: colors.textMuted }]}>
          {isMicOn ? "Mikrofon açık" : "Mikrofon kapalı"}
        </Text>
      </View>

      <View style={styles.controlsOverlay}>
        <View style={styles.controlButtons}>
          <Pressable
            style={[
              styles.controlButton,
              { backgroundColor: isMicOn ? "rgba(255,255,255,0.2)" : "#EF4444" }
            ]}
            onPress={onToggleMic}
          >
            <Ionicons name={isMicOn ? "mic" : "mic-off"} size={22} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 9 / 16,
    maxHeight: "50%",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative"
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12
  },
  audioCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center"
  },
  audioText: {
    fontSize: 18,
    fontWeight: "600"
  },
  audioSubtext: {
    fontSize: 14
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  controlButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default AudioPreview;
