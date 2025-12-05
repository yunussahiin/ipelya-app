/**
 * Call Controls Component
 */

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CallControlsProps {
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  callType: "video" | "audio";
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  bottomInset: number;
}

export function CallControls({
  isMicrophoneEnabled,
  isCameraEnabled,
  callType,
  onToggleMicrophone,
  onToggleCamera,
  onEndCall,
  bottomInset
}: CallControlsProps) {
  return (
    <View style={[styles.bottomControls, { paddingBottom: bottomInset + 20 }]}>
      {/* Mute */}
      <Pressable
        style={[styles.controlButton, !isMicrophoneEnabled && styles.controlButtonActive]}
        onPress={onToggleMicrophone}
      >
        <Ionicons name={isMicrophoneEnabled ? "mic" : "mic-off"} size={24} color="#fff" />
      </Pressable>

      {/* End call */}
      <Pressable style={styles.endCallButton} onPress={onEndCall}>
        <Ionicons
          name="call"
          size={28}
          color="#fff"
          style={{ transform: [{ rotate: "135deg" }] }}
        />
      </Pressable>

      {/* Camera toggle (video only) */}
      {callType === "video" ? (
        <Pressable
          style={[styles.controlButton, !isCameraEnabled && styles.controlButtonActive]}
          onPress={onToggleCamera}
        >
          <Ionicons name={isCameraEnabled ? "videocam" : "videocam-off"} size={24} color="#fff" />
        </Pressable>
      ) : (
        <Pressable style={styles.controlButton}>
          <Ionicons name="volume-high" size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    paddingTop: 20
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center"
  },
  controlButtonActive: {
    backgroundColor: "rgba(255,255,255,0.4)"
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center"
  }
});

export default CallControls;
