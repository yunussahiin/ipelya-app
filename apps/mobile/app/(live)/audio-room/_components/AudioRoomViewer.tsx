/**
 * AudioRoomViewer Component
 * Dinleyici için sesli oda görünümü - Clubhouse tarzı
 * Bas-konuş (Push-to-talk) desteği
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import type { FormattedParticipant } from "@/hooks/live";
import { SpeakerAvatar } from "./SpeakerAvatar";

interface AudioRoomViewerProps {
  title: string;
  duration: string;
  participants: FormattedParticipant[];
  isConnecting?: boolean;
  isMicrophoneEnabled?: boolean;
  isPushToTalk?: boolean;
  canSpeak?: boolean; // Host tarafından konuşma izni verildi mi
  onLeave: () => void;
  onRaiseHand?: () => void;
  onPushToTalkStart?: () => void;
  onPushToTalkEnd?: () => void;
  onToggleMicrophone?: () => void;
  bottomInset: number;
}

export function AudioRoomViewer({
  title,
  duration,
  participants,
  isConnecting = false,
  isMicrophoneEnabled = false,
  isPushToTalk = false,
  canSpeak = false,
  onLeave,
  onRaiseHand,
  onPushToTalkStart,
  onPushToTalkEnd,
  onToggleMicrophone,
  bottomInset
}: AudioRoomViewerProps) {
  const { colors, isDark } = useTheme();

  // Speakers ve listeners ayır
  // Host her zaman speaker, diğerleri mikrofon durumuna göre
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
          <View style={[styles.liveBadgeSmall, { backgroundColor: isDark ? "#374151" : "#fff" }]}>
            <View style={styles.liveDotSmall} />
            <Text style={[styles.liveTextSmall, { color: colors.textPrimary }]}>Live</Text>
          </View>
        </View>

        {/* Speakers Grid */}
        <View style={styles.speakersContainer}>
          {speakers.length > 0 ? (
            speakers.map((speaker) => (
              <SpeakerAvatar key={speaker.identity} participant={speaker} size={72} />
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz konuşmacı yok</Text>
          )}
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
              return (
                <View key={listener.identity} style={styles.listenerItem}>
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
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz dinleyici yok</Text>
        )}
      </View>

      {/* Loading Overlay */}
      {isConnecting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Bağlanıyor...</Text>
        </View>
      )}

      {/* Bottom Controls - Sol: Söz İste/Mikrofon, Orta: Mikrofon, Sağ: Çıkış */}
      <View style={[styles.bottomControls, { paddingBottom: bottomInset + 16 }]}>
        {/* Sol: Söz İste (izin yoksa) veya boş (izin varsa) */}
        <Pressable
          style={[styles.sideButton, { backgroundColor: "transparent" }]}
          onPress={!canSpeak ? onRaiseHand : undefined}
          disabled={canSpeak}
        >
          {!canSpeak ? (
            <Ionicons name="hand-left-outline" size={24} color={colors.textMuted} />
          ) : (
            <View style={{ width: 24 }} />
          )}
        </Pressable>

        {/* Orta: Büyük mikrofon butonu */}
        {canSpeak ? (
          isPushToTalk ? (
            // Bas-konuş modu
            <Pressable
              style={[
                styles.mainMicButtonLarge,
                {
                  backgroundColor: isMicrophoneEnabled ? "#A3E635" : isDark ? "#374151" : "#E5E7EB"
                }
              ]}
              onPressIn={onPushToTalkStart}
              onPressOut={onPushToTalkEnd}
            >
              <Ionicons
                name={isMicrophoneEnabled ? "mic" : "mic-off"}
                size={40}
                color={isMicrophoneEnabled ? "#1C1C1E" : colors.textMuted}
              />
            </Pressable>
          ) : (
            // Normal mikrofon toggle
            <Pressable
              style={[
                styles.mainMicButtonLarge,
                {
                  backgroundColor: isMicrophoneEnabled ? "#A3E635" : isDark ? "#374151" : "#E5E7EB"
                }
              ]}
              onPress={onToggleMicrophone}
            >
              <Ionicons
                name={isMicrophoneEnabled ? "mic" : "mic-off"}
                size={40}
                color={isMicrophoneEnabled ? "#1C1C1E" : colors.textMuted}
              />
            </Pressable>
          )
        ) : (
          // Konuşma izni yok - kapalı mikrofon göster
          <View
            style={[styles.mainMicButtonLarge, { backgroundColor: isDark ? "#374151" : "#E5E7EB" }]}
          >
            <Ionicons name="mic-off" size={40} color={colors.textMuted} />
          </View>
        )}

        {/* Sağ: Çıkış butonu */}
        <Pressable
          style={[styles.sideButton, { backgroundColor: "transparent" }]}
          onPress={onLeave}
        >
          <Ionicons name="exit-outline" size={24} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  // Header Card
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  leaveButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  leaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500"
  },
  // Mikrofon butonları
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  },
  pushToTalkButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  pushToTalkText: {
    fontSize: 14,
    fontWeight: "500"
  },
  // Söz İste butonu
  raiseHandButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8
  },
  raiseHandText: {
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
  }
});

export default AudioRoomViewer;
