/**
 * Audio Room Live Component
 * Canlı sesli oda görünümü - Clubhouse tarzı tasarım
 */

import React, { useEffect } from "react";
import { View, Text, Image, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import * as Haptics from "expo-haptics";
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
import { type FormattedParticipant } from "@/hooks/live";

type MicMode = "standard" | "push_to_talk" | "both";

interface AudioRoomLiveProps {
  title: string;
  duration: string;
  hostName?: string;
  hostAvatar?: string;
  isMicOn: boolean;
  isPushToTalk?: boolean;
  micMode?: MicMode; // Mikrofon modu
  participants?: FormattedParticipant[];
  onToggleMic: () => void;
  onPushToTalkStart?: () => void;
  onPushToTalkEnd?: () => void;
  onTogglePushToTalk?: () => void; // Bas-konuş modunu aç/kapa (both modunda)
  onEndRoom: () => void;
  onHandRaiseReceived?: (userId: string, userName: string) => void; // Söz istegi geldiğinde
  onGrantSpeak?: (userId: string, userName: string) => void; // Dinleyiciye konuşma izni ver
  bottomInset: number;
}

// Speaking Avatar Component with pulse animation
function SpeakerAvatar({
  participant,
  isSpeaking,
  isMuted,
  isHost,
  size = 80
}: {
  participant: { name: string; metadata?: { avatarUrl?: string } };
  isSpeaking: boolean;
  isMuted: boolean;
  isHost?: boolean;
  size?: number;
}) {
  const { colors, isDark } = useTheme();
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    if (isSpeaking && !isMuted) {
      // Pulse animation when speaking
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
  }, [isSpeaking, isMuted, pulseScale, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value
  }));

  // Soft gradient colors based on theme
  const ringColor = isDark ? "#A3E635" : "#84CC16"; // Lime green
  const bgColor = isDark ? "rgba(163, 230, 53, 0.15)" : "rgba(132, 204, 22, 0.2)";

  return (
    <View style={[styles.speakerItem, { width: size + 20 }]}>
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        {/* Pulse ring - only when speaking */}
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

        {/* Avatar */}
        <View
          style={[
            styles.avatarInner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: isSpeaking && !isMuted ? ringColor : "transparent",
              borderWidth: isSpeaking && !isMuted ? 3 : 0
            }
          ]}
        >
          {participant.metadata?.avatarUrl ? (
            <Image
              source={{ uri: participant.metadata.avatarUrl }}
              style={[
                styles.speakerAvatar,
                { width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }
              ]}
            />
          ) : (
            <View
              style={[
                styles.speakerAvatarPlaceholder,
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
            styles.speakerMicBadge,
            {
              backgroundColor: isMuted ? "#EF4444" : "#10B981",
              bottom: 0,
              right: 0
            }
          ]}
        >
          <Ionicons name={isMuted ? "mic-off" : "mic"} size={12} color="#fff" />
        </View>
      </View>

      <Text style={[styles.speakerName, { color: colors.textPrimary }]} numberOfLines={1}>
        {participant.name || "Kullanıcı"}
      </Text>
      {isHost && (
        <Text style={[styles.speakerRole, { color: isDark ? "#A3E635" : "#65A30D" }]}>Sunucu</Text>
      )}
    </View>
  );
}

export function AudioRoomLive({
  title,
  duration,
  hostName,
  hostAvatar,
  isMicOn,
  isPushToTalk = false,
  micMode = "standard",
  participants = [],
  onToggleMic,
  onPushToTalkStart,
  onPushToTalkEnd,
  onTogglePushToTalk,
  onEndRoom,
  onGrantSpeak,
  bottomInset
}: AudioRoomLiveProps) {
  const { colors, isDark } = useTheme();

  // "both" modunda toggle için
  const isBothMode = micMode === "both";

  // Host'u ve dinleyicileri ayır - role bazlı
  const speakers = participants.filter(
    (p) =>
      p.isHost ||
      p.metadata?.role === "host" ||
      p.metadata?.role === "speaker" ||
      p.metadata?.role === "co_host"
  );
  const listeners = participants.filter(
    (p) =>
      !p.isHost &&
      p.metadata?.role !== "host" &&
      p.metadata?.role !== "speaker" &&
      p.metadata?.role !== "co_host"
  );

  // Header card background
  const headerBg = isDark ? "#1F2937" : "#F0FDF4";

  return (
    <View style={styles.container}>
      {/* Header Card - Clubhouse style */}
      <View style={[styles.headerCard, { backgroundColor: headerBg }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleSection}>
            <Text style={[styles.roomTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {title || "Sesli Oda"}
            </Text>
            <View style={styles.statsInline}>
              <Ionicons name="people" size={14} color={colors.textMuted} />
              <Text style={[styles.statTextSmall, { color: colors.textMuted }]}>
                {Math.max(1, participants.length)} katılımcı
              </Text>
              <Text style={[styles.statDot, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.statTextSmall, { color: colors.textMuted }]}>{duration}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.liveBadgeSmall, { backgroundColor: isDark ? "#374151" : "#fff" }]}>
              <View style={styles.liveDotSmall} />
              <Text style={[styles.liveTextSmall, { color: colors.textPrimary }]}>Canlı</Text>
            </View>
            {/* Çıkış butonu - header'da */}
            <Pressable
              style={[styles.headerExitButton, { backgroundColor: isDark ? "#374151" : "#FEE2E2" }]}
              onPress={onEndRoom}
            >
              <Ionicons name="close" size={18} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Speakers Grid */}
        <View style={styles.speakersContainer}>
          {/* Host always first */}
          <SpeakerAvatar
            participant={{
              name: hostName || "Sunucu",
              metadata: { avatarUrl: hostAvatar }
            }}
            isSpeaking={isMicOn}
            isMuted={!isMicOn}
            isHost
            size={72}
          />
          {/* Other speakers */}
          {speakers
            .filter((s) => !s.isHost)
            .slice(0, 3)
            .map((speaker) => (
              <SpeakerAvatar
                key={speaker.identity}
                participant={speaker}
                isSpeaking={speaker.isSpeaking}
                isMuted={speaker.isMuted}
                size={72}
              />
            ))}
        </View>
      </View>

      {/* Listeners Section */}
      <View style={styles.listenersSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DİNLEYİCİLER ({listeners.length})
        </Text>
        {listeners.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.listenersGrid}
            showsVerticalScrollIndicator={false}
          >
            {listeners.map((listener) => {
              const isSpeaking = listener.isSpeaking && !listener.isMuted;

              // Uzun basma handler - konuşma izni ver
              const handleLongPress = () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  "Konuşma İzni",
                  `${listener.name || "Kullanıcı"} adlı kullanıcıya konuşma izni vermek istiyor musunuz?`,
                  [
                    { text: "İptal", style: "cancel" },
                    {
                      text: "İzin Ver",
                      onPress: () => {
                        onGrantSpeak?.(listener.identity, listener.name || "Kullanıcı");
                      }
                    }
                  ]
                );
              };

              return (
                <Pressable
                  key={listener.identity}
                  style={styles.listenerItem}
                  onLongPress={handleLongPress}
                  delayLongPress={500}
                >
                  <View style={styles.listenerAvatarWrapper}>
                    {/* Speaking border */}
                    <View
                      style={[
                        styles.listenerAvatarBorder,
                        {
                          borderColor: isSpeaking ? "#A3E635" : "transparent",
                          backgroundColor: isSpeaking ? "rgba(163, 230, 53, 0.15)" : "transparent"
                        }
                      ]}
                    >
                      {listener.metadata?.avatarUrl ? (
                        <Image
                          source={{ uri: listener.metadata.avatarUrl }}
                          style={styles.listenerAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.listenerAvatarPlaceholder,
                            { backgroundColor: colors.surface }
                          ]}
                        >
                          <Text style={[styles.listenerInitial, { color: colors.textPrimary }]}>
                            {(listener.name || "K").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    {/* Speaking indicator badge */}
                    {isSpeaking && (
                      <View style={styles.speakingBadge}>
                        <Ionicons name="volume-high" size={10} color="#fff" />
                      </View>
                    )}
                    {/* Muted indicator badge */}
                    {listener.isMuted && !isSpeaking && (
                      <View style={[styles.mutedBadge, { backgroundColor: "#6B7280" }]}>
                        <Ionicons name="mic-off" size={8} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.listenerName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {listener.name || "Kullanıcı"}
                  </Text>
                  <Text style={[styles.listenerRole, { color: colors.textMuted }]}>Dinleyici</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz dinleyici yok</Text>
        )}
      </View>

      {/* Bottom Controls - Sol: Sheet, Orta: Mikrofon, Sağ: Toggle/Boş */}
      <View style={[styles.bottomControls, { paddingBottom: bottomInset + 16 }]}>
        {/* Sol: Boş buton (sheet için placeholder) */}
        <Pressable
          style={[styles.sideButton, { backgroundColor: "transparent" }]}
          onPress={() => {
            /* TODO: Sheet açılacak */
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textMuted} />
        </Pressable>

        {/* Orta: Büyük mikrofon butonu */}
        {isPushToTalk ? (
          // Bas-konuş modu
          <Pressable
            style={[
              styles.mainMicButtonLarge,
              { backgroundColor: isMicOn ? "#A3E635" : isDark ? "#374151" : "#E5E7EB" }
            ]}
            onPressIn={onPushToTalkStart}
            onPressOut={onPushToTalkEnd}
          >
            <Ionicons
              name={isMicOn ? "mic" : "mic-off"}
              size={40}
              color={isMicOn ? "#1C1C1E" : colors.textMuted}
            />
          </Pressable>
        ) : (
          // Normal mikrofon toggle
          <Pressable
            style={[
              styles.mainMicButtonLarge,
              { backgroundColor: isMicOn ? "#A3E635" : isDark ? "#374151" : "#E5E7EB" }
            ]}
            onPress={onToggleMic}
          >
            <Ionicons
              name={isMicOn ? "mic" : "mic-off"}
              size={40}
              color={isMicOn ? "#1C1C1E" : colors.textMuted}
            />
          </Pressable>
        )}

        {/* Sağ: "both" modunda toggle, değilse boş */}
        {isBothMode ? (
          <Pressable
            style={[styles.modeToggleButton, { backgroundColor: isDark ? "#374151" : "#F3F4F6" }]}
            onPress={onTogglePushToTalk}
          >
            <Ionicons
              name={isPushToTalk ? "hand-left" : "mic"}
              size={20}
              color={colors.textPrimary}
            />
            <Text style={[styles.modeToggleText, { color: colors.textMuted }]}>
              {isPushToTalk ? "PTT" : "Std"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.sideButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  // Header Card - Clubhouse style
  headerCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24
  },
  headerTitleSection: {
    flex: 1,
    marginRight: 12
  },
  roomTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8
  },
  statsInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  statTextSmall: {
    fontSize: 13
  },
  statDot: {
    fontSize: 13
  },
  liveBadgeSmall: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981"
  },
  liveTextSmall: {
    fontSize: 13,
    fontWeight: "600"
  },
  speakersContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12
  },
  // Speaker Avatar
  speakerItem: {
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
  speakerAvatar: {
    resizeMode: "cover"
  },
  speakerAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center"
  },
  avatarInitial: {
    fontWeight: "700"
  },
  speakerMicBadge: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1C1C1E"
  },
  speakerName: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center"
  },
  speakerRole: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2
  },
  // Listeners Section
  listenersSection: {
    flex: 1,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 16
  },
  listenersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingBottom: 100
  },
  listenerItem: {
    alignItems: "center",
    width: 72
  },
  listenerAvatarWrapper: {
    marginBottom: 6,
    position: "relative"
  },
  listenerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  listenerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center"
  },
  listenerInitial: {
    fontSize: 18,
    fontWeight: "600"
  },
  listenerName: {
    fontSize: 11,
    textAlign: "center"
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 20
  },
  // Bottom Controls
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 40
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  endButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  // Mod değiştir butonu
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: "500"
  },
  // Bas-konuş butonu
  pushToTalkButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  pushToTalkText: {
    fontSize: 14,
    fontWeight: "600"
  },
  // Listener avatar border (speaking indicator)
  listenerAvatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center"
  },
  // Speaking badge
  speakingBadge: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    marginLeft: -14,
    backgroundColor: "#A3E635",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  // Muted badge
  mutedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1C1C1E"
  },
  // Listener role text
  listenerRole: {
    fontSize: 10,
    marginTop: 2
  },
  // New bottom controls
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  mainMicButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center"
  },
  mainMicButtonLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  modeToggleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2
  },
  // Header styles
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerExitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default AudioRoomLive;
