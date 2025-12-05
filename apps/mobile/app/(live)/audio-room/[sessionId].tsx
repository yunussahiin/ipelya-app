/**
 * Audio Room Screen
 * Sesli oda ekranı - Modüler yapı
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useLiveKitRoom, useLiveSession, useLiveChat } from "@/hooks/live";
import { LiveChat } from "@/components/live";

// Local components
import {
  AudioRoomHeader,
  ParticipantAvatar,
  AudioRoomControls,
  type AudioParticipant
} from "./_components";

export default function AudioRoomScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [duration, setDuration] = useState("00:00");

  // Hooks
  const { joinSession, leaveSession, activeSession } = useLiveSession();
  const { messages, sendMessage } = useLiveChat({ sessionId: sessionId || "" });
  const { participants, isConnected, isMicrophoneEnabled, toggleMicrophone, disconnect } =
    useLiveKitRoom({
      sessionId: sessionId || "",
      autoConnect: true
    });

  // Join session on mount
  useEffect(() => {
    if (sessionId) {
      joinSession({ sessionId });
    }
    return () => {
      if (sessionId) {
        leaveSession(sessionId);
        disconnect();
      }
    };
  }, [sessionId, joinSession, leaveSession, disconnect]);

  // Duration timer
  useEffect(() => {
    if (!activeSession?.startedAt) return;

    const startTime = new Date(activeSession.startedAt).getTime();

    const updateDuration = () => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (hours > 0) {
        setDuration(
          `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
        );
      } else {
        setDuration(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startedAt]);

  // Format participants
  const audioParticipants: AudioParticipant[] = participants.map((p) => ({
    id: p.identity,
    name: p.name,
    avatar: p.metadata?.avatarUrl,
    isHost: p.isHost,
    isSpeaker: p.isHost || p.metadata?.role === "speaker" || p.metadata?.role === "co_host",
    isMuted: p.isMuted,
    isSpeaking: false // TODO: Audio level detection
  }));

  const speakers = audioParticipants.filter((p) => p.isSpeaker);
  const listeners = audioParticipants.filter((p) => !p.isSpeaker);

  // Handlers
  const handleLeave = useCallback(() => {
    if (sessionId) {
      leaveSession(sessionId);
      disconnect();
    }
    router.back();
  }, [sessionId, leaveSession, disconnect, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <AudioRoomHeader
          duration={duration}
          isChatVisible={isChatVisible}
          onToggleChat={() => setIsChatVisible((prev) => !prev)}
          onLeave={handleLeave}
          topInset={insets.top}
        />

        {/* Room title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {activeSession?.title || "Sesli Oda"}
          </Text>
          <Text style={[styles.participantCount, { color: colors.textMuted }]}>
            {audioParticipants.length} katılımcı
          </Text>
        </View>

        {/* Speakers section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Konuşmacılar</Text>
          <View style={styles.speakersGrid}>
            {speakers.map((speaker) => (
              <ParticipantAvatar key={speaker.id} participant={speaker} />
            ))}
          </View>
        </View>

        {/* Listeners section */}
        {listeners.length > 0 && (
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Dinleyiciler ({listeners.length})
            </Text>
            <FlatList
              data={listeners}
              renderItem={({ item }) => <ParticipantAvatar participant={item} />}
              keyExtractor={(item) => item.id}
              numColumns={4}
              contentContainerStyle={styles.listenersGrid}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Chat overlay */}
        {isChatVisible && (
          <View style={[styles.chatOverlay, { backgroundColor: colors.background }]}>
            <LiveChat
              messages={messages}
              onSendMessage={sendMessage}
              isHost={false}
              disabled={!isConnected}
              maxHeight={300}
            />
          </View>
        )}

        {/* Bottom controls */}
        <AudioRoomControls
          isMicrophoneEnabled={isMicrophoneEnabled}
          onToggleMicrophone={toggleMicrophone}
          onLeave={handleLeave}
          bottomInset={insets.bottom}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  participantCount: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  speakersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16
  },
  listenersGrid: {
    gap: 12
  },
  chatOverlay: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)"
  }
});
