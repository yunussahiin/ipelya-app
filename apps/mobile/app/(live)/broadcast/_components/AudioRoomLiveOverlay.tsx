/**
 * Audio Room Live Overlay
 * Clubhouse/Twitter Spaces tarzı sesli oda arayüzü
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Participant types
type ParticipantRole = "host" | "co_host" | "speaker" | "listener";

interface Participant {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: ParticipantRole;
  isSpeaking?: boolean;
  isMuted?: boolean;
  isHandRaised?: boolean;
}

interface AudioRoomLiveOverlayProps {
  title: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  participants: Participant[];
  viewerCount: number;
  duration: string;
  isMicOn: boolean;
  isHandRaised?: boolean;
  onToggleMic: () => void;
  onRaiseHand?: () => void;
  onLeave: () => void;
  onInvite?: () => void;
}

export function AudioRoomLiveOverlay({
  title,
  hostId,
  hostName,
  hostAvatar,
  participants,
  viewerCount,
  duration,
  isMicOn,
  isHandRaised = false,
  onToggleMic,
  onRaiseHand,
  onLeave,
  onInvite
}: AudioRoomLiveOverlayProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Separate participants by role
  const hosts = participants.filter((p) => p.role === "host" || p.role === "co_host");
  const speakers = participants.filter((p) => p.role === "speaker");
  const listeners = participants.filter((p) => p.role === "listener");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={onLeave}>
          <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>CANLI</Text>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={16} color={colors.textMuted} />
          <Text style={[styles.statText, { color: colors.textMuted }]}>{viewerCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color={colors.textMuted} />
          <Text style={[styles.statText, { color: colors.textMuted }]}>{duration}</Text>
        </View>
        {onInvite && (
          <Pressable style={styles.inviteButton} onPress={onInvite}>
            <Ionicons name="person-add" size={18} color={colors.accent} />
          </Pressable>
        )}
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hosts Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.accent + "15" }]}>
            <Ionicons name="mic" size={16} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>Sunucular</Text>
          </View>
          <View style={styles.hostsGrid}>
            {/* Main host */}
            <ParticipantAvatar
              participant={{
                id: hostId,
                userId: hostId,
                displayName: hostName,
                avatarUrl: hostAvatar,
                role: "host",
                isSpeaking: true
              }}
              size="large"
              isHost
            />
            {/* Co-hosts */}
            {hosts
              .filter((h) => h.id !== hostId)
              .map((host) => (
                <ParticipantAvatar key={host.id} participant={host} size="large" />
              ))}
          </View>
        </View>

        {/* Speakers Section */}
        {speakers.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
              <Ionicons name="chatbubble" size={16} color={colors.textMuted} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Konuşmacılar</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {speakers.length}
              </Text>
            </View>
            <View style={styles.participantsGrid}>
              {speakers.map((speaker) => (
                <ParticipantAvatar key={speaker.id} participant={speaker} size="medium" />
              ))}
            </View>
          </View>
        )}

        {/* Listeners Section */}
        {listeners.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { backgroundColor: colors.surface }]}>
              <Ionicons name="headset" size={16} color={colors.textMuted} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dinleyiciler</Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {listeners.length}
              </Text>
            </View>
            <View style={styles.listenersGrid}>
              {listeners.map((listener) => (
                <ParticipantAvatar key={listener.id} participant={listener} size="small" />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
        {/* Raise hand */}
        {onRaiseHand && (
          <Pressable
            style={[
              styles.controlButton,
              styles.secondaryButton,
              { backgroundColor: isHandRaised ? colors.accent + "20" : colors.surface }
            ]}
            onPress={onRaiseHand}
          >
            <Text style={{ fontSize: 24 }}>✋</Text>
          </Pressable>
        )}

        {/* Mic toggle */}
        <Pressable
          style={[
            styles.controlButton,
            styles.primaryButton,
            { backgroundColor: isMicOn ? colors.accent : "#EF4444" }
          ]}
          onPress={onToggleMic}
        >
          <Ionicons name={isMicOn ? "mic" : "mic-off"} size={28} color="#fff" />
        </Pressable>

        {/* Leave */}
        <Pressable
          style={[
            styles.controlButton,
            styles.secondaryButton,
            { backgroundColor: colors.surface }
          ]}
          onPress={onLeave}
        >
          <Ionicons name="exit-outline" size={24} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

// Participant Avatar Component
interface ParticipantAvatarProps {
  participant: Participant;
  size: "large" | "medium" | "small";
  isHost?: boolean;
}

function ParticipantAvatar({ participant, size, isHost }: ParticipantAvatarProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when speaking
  useEffect(() => {
    if (participant.isSpeaking && !participant.isMuted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [participant.isSpeaking, participant.isMuted, pulseAnim]);

  const sizeConfig = {
    large: { avatar: 80, container: 100, fontSize: 14, iconSize: 20 },
    medium: { avatar: 64, container: 80, fontSize: 12, iconSize: 16 },
    small: { avatar: 48, container: 64, fontSize: 11, iconSize: 14 }
  }[size];

  const isSpeaking = participant.isSpeaking && !participant.isMuted;

  return (
    <View style={[styles.avatarContainer, { width: sizeConfig.container }]}>
      <Animated.View
        style={[
          styles.avatarWrapper,
          {
            width: sizeConfig.avatar,
            height: sizeConfig.avatar,
            borderRadius: sizeConfig.avatar / 2,
            borderColor: isSpeaking ? colors.accent : "transparent",
            borderWidth: isSpeaking ? 3 : 0,
            transform: [{ scale: isSpeaking ? pulseAnim : 1 }]
          }
        ]}
      >
        {participant.avatarUrl ? (
          <Image
            source={{ uri: participant.avatarUrl }}
            style={[
              styles.avatar,
              {
                width: sizeConfig.avatar - 6,
                height: sizeConfig.avatar - 6,
                borderRadius: (sizeConfig.avatar - 6) / 2
              }
            ]}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              {
                width: sizeConfig.avatar - 6,
                height: sizeConfig.avatar - 6,
                borderRadius: (sizeConfig.avatar - 6) / 2,
                backgroundColor: colors.accent
              }
            ]}
          >
            <Ionicons name="person" size={sizeConfig.iconSize} color="#fff" />
          </View>
        )}

        {/* Mic status badge */}
        {(participant.role === "host" ||
          participant.role === "co_host" ||
          participant.role === "speaker") && (
          <View
            style={[
              styles.micBadge,
              {
                backgroundColor: participant.isMuted ? "#EF4444" : colors.accent,
                width: sizeConfig.iconSize + 8,
                height: sizeConfig.iconSize + 8,
                borderRadius: (sizeConfig.iconSize + 8) / 2
              }
            ]}
          >
            <Ionicons
              name={participant.isMuted ? "mic-off" : "mic"}
              size={sizeConfig.iconSize - 4}
              color="#fff"
            />
          </View>
        )}

        {/* Hand raised badge */}
        {participant.isHandRaised && (
          <View style={styles.handBadge}>
            <Text style={{ fontSize: sizeConfig.iconSize - 2 }}>✋</Text>
          </View>
        )}
      </Animated.View>

      {/* Name */}
      <Text
        style={[
          styles.participantName,
          { color: colors.textPrimary, fontSize: sizeConfig.fontSize }
        ]}
        numberOfLines={1}
      >
        {participant.displayName}
      </Text>

      {/* Role label */}
      {isHost && (
        <Text
          style={[styles.roleLabel, { color: colors.accent, fontSize: sizeConfig.fontSize - 2 }]}
        >
          Sunucu
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  headerCenter: {
    flex: 1,
    alignItems: "center"
  },
  title: {
    fontSize: 18,
    fontWeight: "700"
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff"
  },
  liveText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 20
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  statText: {
    fontSize: 14,
    fontWeight: "500"
  },
  inviteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  content: {
    flex: 1
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1
  },
  sectionCount: {
    fontSize: 14
  },
  hostsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16
  },
  participantsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  listenersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  avatarContainer: {
    alignItems: "center",
    gap: 4
  },
  avatarWrapper: {
    justifyContent: "center",
    alignItems: "center"
  },
  avatar: {},
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center"
  },
  micBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1C1C1E"
  },
  handBadge: {
    position: "absolute",
    top: -4,
    right: -4
  },
  participantName: {
    fontWeight: "500",
    textAlign: "center"
  },
  roleLabel: {
    fontWeight: "600"
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    gap: 20
  },
  controlButton: {
    justifyContent: "center",
    alignItems: "center"
  },
  primaryButton: {
    width: 64,
    height: 64,
    borderRadius: 32
  },
  secondaryButton: {
    width: 52,
    height: 52,
    borderRadius: 26
  }
});

export default AudioRoomLiveOverlay;
