/**
 * Participant Avatar Component
 * Animasyonlu avatar ve durumlar
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";

export interface AudioParticipant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isSpeaker: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface ParticipantAvatarProps {
  participant: AudioParticipant;
}

export function ParticipantAvatar({ participant }: ParticipantAvatarProps) {
  const { colors } = useTheme();
  const speakingScale = useSharedValue(1);

  useEffect(() => {
    if (participant.isSpeaking) {
      speakingScale.value = withRepeat(withTiming(1.1, { duration: 300 }), -1, true);
    } else {
      speakingScale.value = withTiming(1, { duration: 200 });
    }
  }, [participant.isSpeaking, speakingScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speakingScale.value }]
  }));

  return (
    <View style={styles.participantItem}>
      <Animated.View
        style={[
          styles.avatarContainer,
          animatedStyle,
          participant.isSpeaking && styles.speakingBorder
        ]}
      >
        {participant.avatar ? (
          <Image source={{ uri: participant.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{participant.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        {/* Muted indicator */}
        {participant.isMuted && (
          <View style={[styles.mutedBadge, { backgroundColor: "#EF4444" }]}>
            <Ionicons name="mic-off" size={10} color="#fff" />
          </View>
        )}

        {/* Host badge */}
        {participant.isHost && (
          <View style={[styles.hostBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="star" size={8} color="#fff" />
          </View>
        )}
      </Animated.View>

      <Text style={[styles.participantName, { color: colors.textPrimary }]} numberOfLines={1}>
        {participant.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  participantItem: {
    alignItems: "center",
    width: 70
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 6,
    position: "relative"
  },
  speakingBorder: {
    borderWidth: 3,
    borderColor: "#10B981"
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 28
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600"
  },
  mutedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center"
  },
  hostBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  participantName: {
    fontSize: 11,
    textAlign: "center",
    width: 70
  }
});

export default ParticipantAvatar;
