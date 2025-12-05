/**
 * SpeakerAvatar Component
 * Konuşmacı avatarı - pulse animasyonu ile
 */

import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import type { FormattedParticipant } from "@/hooks/live";

interface SpeakerAvatarProps {
  participant: FormattedParticipant;
  size?: number;
}

export function SpeakerAvatar({ participant, size = 72 }: SpeakerAvatarProps) {
  const { colors, isDark } = useTheme();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const isSpeaking = participant.isSpeaking && !participant.isMuted;

  useEffect(() => {
    if (isSpeaking) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 400 }), withTiming(0.2, { duration: 400 })),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isSpeaking, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value
  }));

  const ringColor = isDark ? "#A3E635" : "#84CC16";
  const bgColor = isDark ? "rgba(163, 230, 53, 0.15)" : "rgba(132, 204, 22, 0.2)";

  return (
    <View style={[styles.container, { width: size + 20 }]}>
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        {/* Pulse ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              backgroundColor: bgColor,
              borderColor: ringColor
            },
            pulseStyle
          ]}
        />

        {/* Avatar inner */}
        <View
          style={[
            styles.avatarInner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: isSpeaking ? ringColor : "transparent",
              borderWidth: isSpeaking ? 3 : 0
            }
          ]}
        >
          {participant.metadata?.avatarUrl ? (
            <Image
              source={{ uri: participant.metadata.avatarUrl }}
              style={[
                styles.avatar,
                {
                  width: size - 6,
                  height: size - 6,
                  borderRadius: (size - 6) / 2
                }
              ]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  width: size - 6,
                  height: size - 6,
                  borderRadius: (size - 6) / 2,
                  backgroundColor: isDark ? "#374151" : "#E5E7EB"
                }
              ]}
            >
              <Text
                style={[styles.avatarInitial, { fontSize: size / 2.5, color: colors.textPrimary }]}
              >
                {(participant.name || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Mic badge */}
        <View
          style={[
            styles.micBadge,
            { backgroundColor: participant.isMuted ? "#EF4444" : "#10B981" }
          ]}
        >
          <Ionicons name={participant.isMuted ? "mic-off" : "mic"} size={12} color="#fff" />
        </View>
      </View>

      {/* Name */}
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
        {participant.name || "Kullanıcı"}
      </Text>

      {/* Role badge */}
      {participant.isHost && (
        <Text style={[styles.role, { color: isDark ? "#A3E635" : "#65A30D" }]}>Sunucu</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center"
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2
  },
  avatarInner: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  avatar: {
    resizeMode: "cover"
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center"
  },
  avatarInitial: {
    fontWeight: "700"
  },
  micBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1C1C1E"
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center"
  },
  role: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2
  }
});

export default SpeakerAvatar;
