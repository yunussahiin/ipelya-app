/**
 * Audio Room Controls Component
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface AudioRoomControlsProps {
  isMicrophoneEnabled: boolean;
  onToggleMicrophone: () => void;
  onLeave: () => void;
  onRaiseHand?: () => void;
  bottomInset: number;
}

export function AudioRoomControls({
  isMicrophoneEnabled,
  onToggleMicrophone,
  onLeave,
  onRaiseHand,
  bottomInset
}: AudioRoomControlsProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.bottomControls, { paddingBottom: bottomInset + 16 }]}>
      {/* Mic toggle */}
      <Pressable
        style={[
          styles.controlButton,
          { backgroundColor: isMicrophoneEnabled ? colors.accent : colors.surface }
        ]}
        onPress={onToggleMicrophone}
      >
        <Ionicons
          name={isMicrophoneEnabled ? "mic" : "mic-off"}
          size={24}
          color={isMicrophoneEnabled ? "#fff" : colors.textPrimary}
        />
      </Pressable>

      {/* Leave button */}
      <Pressable style={[styles.leaveButton, { backgroundColor: "#EF4444" }]} onPress={onLeave}>
        <Text style={styles.leaveButtonText}>Ayrıl</Text>
      </Pressable>

      {/* Raise hand */}
      <Pressable
        style={[styles.controlButton, { backgroundColor: colors.surface }]}
        onPress={onRaiseHand}
      >
        <Ionicons name="hand-left" size={24} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  leaveButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28
  },
  leaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});

export default AudioRoomControls;
