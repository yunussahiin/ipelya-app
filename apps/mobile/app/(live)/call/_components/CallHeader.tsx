/**
 * Call Header Component
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConnectionQualityIndicator } from "@/components/live";

interface CallHeaderProps {
  callerName?: string;
  duration: string;
  connectionQuality: "excellent" | "good" | "poor" | "lost" | "unknown";
  callType: "video" | "audio";
  onBack: () => void;
  onFlipCamera?: () => void;
  topInset: number;
}

export function CallHeader({
  callerName,
  duration,
  connectionQuality,
  callType,
  onBack,
  onFlipCamera,
  topInset
}: CallHeaderProps) {
  return (
    <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
      <Pressable style={styles.topButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </Pressable>

      <View style={styles.callInfo}>
        <Text style={styles.callerName}>{callerName || "Arama"}</Text>
        <View style={styles.callStatus}>
          <Text style={styles.duration}>{duration}</Text>
          <ConnectionQualityIndicator quality={connectionQuality} size="small" />
        </View>
      </View>

      {callType === "video" && onFlipCamera && (
        <Pressable style={styles.topButton} onPress={onFlipCamera}>
          <Ionicons name="camera-reverse" size={24} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10
  },
  topButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  callInfo: {
    flex: 1,
    alignItems: "center"
  },
  callerName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  callStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4
  },
  duration: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14
  }
});

export default CallHeader;
