/**
 * Audio Preview Component
 * Sesli yayın önizlemesi - Full screen
 */

import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface AudioPreviewProps {
  isMicOn: boolean;
  onToggleMic: () => void;
  avatarUrl?: string;
  displayName?: string;
}

export function AudioPreview({ isMicOn, onToggleMic, avatarUrl, displayName }: AudioPreviewProps) {
  const { colors } = useTheme();

  // Pulse animation for mic indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMicOn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isMicOn, pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt }]}>
      {/* Center content */}
      <View style={styles.centerContent}>
        {/* Avatar with pulse ring */}
        <View style={styles.avatarContainer}>
          {isMicOn && (
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: colors.accent,
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.15],
                    outputRange: [0.6, 0]
                  })
                }
              ]}
            />
          )}
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
          )}

          {/* Mic status badge */}
          <View style={[styles.micBadge, { backgroundColor: isMicOn ? colors.accent : "#EF4444" }]}>
            <Ionicons name={isMicOn ? "mic" : "mic-off"} size={16} color="#fff" />
          </View>
        </View>

        {/* User info */}
        {displayName && (
          <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
        )}

        {/* Status text */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isMicOn ? "#10B981" : "#EF4444" }]} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {isMicOn ? "Mikrofon açık" : "Mikrofon kapalı"}
          </Text>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controlsContainer}>
        <Pressable
          style={[
            styles.controlButton,
            { backgroundColor: isMicOn ? "rgba(255,255,255,0.15)" : "#EF4444" }
          ]}
          onPress={onToggleMic}
        >
          <Ionicons name={isMicOn ? "mic" : "mic-off"} size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  centerContent: {
    alignItems: "center",
    gap: 16
  },
  avatarContainer: {
    position: "relative",
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center"
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center"
  },
  micBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#1C1C1E"
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    fontSize: 15
  },
  controlsContainer: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    gap: 16
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default AudioPreview;
