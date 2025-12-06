/**
 * Host Disconnect Overlay
 * Yayıncı bağlantısı kesildiğinde gösterilen overlay
 * 30 saniye countdown ile yeniden bağlanma beklenir
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface HostDisconnectOverlayProps {
  visible: boolean;
  remainingSeconds: number;
  message?: string;
  hostName?: string;
  hostAvatar?: string;
}

export function HostDisconnectOverlay({
  visible,
  remainingSeconds,
  message,
  hostName
}: HostDisconnectOverlayProps) {
  const { colors } = useTheme();

  // Pulse animation for the icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}`;
  };

  return (
    <BlurView intensity={40} tint="dark" style={styles.overlay}>
      <View style={styles.content}>
        {/* Animated Icon */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="wifi-outline" size={48} color="#F59E0B" />
          </View>
          {/* Pulse rings */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.6, 0]
                }),
                transform: [{ scale: pulseAnim }]
              }
            ]}
          />
        </Animated.View>

        {/* Message */}
        <Text style={styles.title}>Bağlantı Bekleniyor</Text>
        <Text style={styles.message}>
          {message || `${hostName || "Yayıncı"} bağlantısı kesildi`}
        </Text>

        {/* Countdown */}
        <View style={styles.countdownContainer}>
          <View style={styles.countdownCircle}>
            <Text style={styles.countdownNumber}>{formatTime(remainingSeconds)}</Text>
          </View>
          <Text style={styles.countdownLabel}>Yeniden bağlanma bekleniyor...</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${(remainingSeconds / 30) * 100}%` }]} />
        </View>

        {/* Info text */}
        <Text style={styles.infoText}>
          Yayıncı {remainingSeconds} saniye içinde bağlanmazsa yayın sonlanacak
        </Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 32
  },
  iconContainer: {
    position: "relative",
    marginBottom: 24
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(245, 158, 11, 0.3)"
  },
  pulseRing: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#F59E0B"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center"
  },
  message: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 32
  },
  countdownContainer: {
    alignItems: "center",
    marginBottom: 24
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#F59E0B",
    marginBottom: 12
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F59E0B"
  },
  countdownLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)"
  },
  progressContainer: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden"
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#F59E0B",
    borderRadius: 2
  },
  infoText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center"
  }
});

export default HostDisconnectOverlay;
