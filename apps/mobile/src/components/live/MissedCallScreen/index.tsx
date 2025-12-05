/**
 * Missed Call Screen
 * Kaçırılan arama bildirimi ve geri arama seçeneği
 */

import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";

interface MissedCallScreenProps {
  callerName: string;
  callerAvatar?: string;
  callTime: Date;
  callType: "video" | "audio";
  onCallBack: () => void;
  onDismiss: () => void;
  onViewProfile?: () => void;
}

export function MissedCallScreen({
  callerName,
  callerAvatar,
  callTime,
  callType,
  onCallBack,
  onDismiss,
  onViewProfile
}: MissedCallScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Pulse animation for call back button
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={onDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Missed call icon */}
        <View style={[styles.missedIcon, { backgroundColor: "#FEE2E2" }]}>
          <Ionicons
            name={callType === "video" ? "videocam-off" : "call"}
            size={32}
            color="#EF4444"
          />
        </View>

        {/* Caller info */}
        <View style={styles.callerInfo}>
          {callerAvatar ? (
            <Pressable onPress={onViewProfile}>
              <Image source={{ uri: callerAvatar }} style={styles.avatar} />
            </Pressable>
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}

          <Text style={[styles.callerName, { color: colors.textPrimary }]}>{callerName}</Text>

          <Text style={[styles.missedText, { color: "#EF4444" }]}>
            Kaçırılan {callType === "video" ? "görüntülü" : "sesli"} arama
          </Text>

          <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(callTime)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Call back button */}
          <Animated.View style={pulseStyle}>
            <Pressable
              style={[styles.callBackButton, { backgroundColor: "#10B981" }]}
              onPress={onCallBack}
            >
              <Ionicons name={callType === "video" ? "videocam" : "call"} size={28} color="#fff" />
              <Text style={styles.callBackText}>Geri Ara</Text>
            </Pressable>
          </Animated.View>

          {/* Secondary actions */}
          <View style={styles.secondaryActions}>
            <Pressable
              style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
              onPress={onViewProfile}
            >
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                Profil
              </Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
              onPress={onDismiss}
            >
              <Ionicons name="close-outline" size={22} color={colors.textMuted} />
              <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  missedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24
  },
  callerInfo: {
    alignItems: "center",
    marginBottom: 48
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  callerName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8
  },
  missedText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4
  },
  timeText: {
    fontSize: 14
  },
  actions: {
    width: "100%",
    alignItems: "center"
  },
  callBackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
    gap: 12,
    marginBottom: 24,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  callBackText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 16
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500"
  }
});

export default MissedCallScreen;
