/**
 * Call Screen
 * 1-1 Görüntülü/Sesli arama ekranı - Modüler yapı
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useLiveKitRoom } from "@/hooks/live";
import { LiveVideoView } from "@/components/live";

// Local components
import { CallHeader, CallControls, LocalPiP } from "./_components";

export default function CallScreen() {
  const { callId, callType = "video" } = useLocalSearchParams<{
    callId: string;
    callType?: "video" | "audio";
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [duration, setDuration] = useState("00:00");
  const [showControls, setShowControls] = useState(true);
  const [callStartTime] = useState(Date.now());

  // Hooks
  const {
    participants,
    isReconnecting,
    connectionQuality,
    isMicrophoneEnabled,
    isCameraEnabled,
    toggleMicrophone,
    toggleCamera,
    flipCamera,
    disconnect
  } = useLiveKitRoom({
    callId: callId || "",
    autoConnect: true
  });

  // Duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - callStartTime) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setDuration(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStartTime]);

  // Auto hide controls
  useEffect(() => {
    if (!showControls) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showControls]);

  // Get participants
  const remoteParticipant = participants.find((p) => p.identity !== participants[0]?.identity);
  const localParticipant = participants[0];

  // Map connection quality
  const qualityLevel = (() => {
    switch (connectionQuality) {
      case "excellent":
        return "excellent";
      case "good":
        return "good";
      case "poor":
        return "poor";
      default:
        return "unknown";
    }
  })() as "excellent" | "good" | "poor" | "lost" | "unknown";

  // Handlers
  const handleEndCall = useCallback(() => {
    disconnect();
    router.back();
  }, [disconnect, router]);

  const handleToggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Pressable style={styles.container} onPress={handleToggleControls}>
        {/* Remote video (full screen) */}
        <View style={styles.remoteVideo}>
          {callType === "video" && remoteParticipant ? (
            <LiveVideoView
              trackRef={remoteParticipant.videoTrack}
              participantName={remoteParticipant.name}
              isMuted={remoteParticipant.isMuted}
              isVideoOff={!remoteParticipant.isCameraEnabled}
              showOverlay={false}
            />
          ) : (
            <View style={styles.audioOnlyContainer}>
              <View style={[styles.audioAvatar, { backgroundColor: colors.accent }]}>
                <Ionicons name="person" size={60} color="#fff" />
              </View>
              <Text style={styles.audioName}>{remoteParticipant?.name || "Bağlanıyor..."}</Text>
            </View>
          )}
        </View>

        {/* Local video (PiP) */}
        {callType === "video" && localParticipant && (
          <LocalPiP
            videoTrack={localParticipant.videoTrack}
            isMicrophoneEnabled={isMicrophoneEnabled}
            isCameraEnabled={isCameraEnabled}
            topInset={insets.top}
            bottomInset={insets.bottom}
          />
        )}

        {/* Header */}
        {showControls && (
          <CallHeader
            callerName={remoteParticipant?.name}
            duration={duration}
            connectionQuality={qualityLevel}
            callType={callType as "video" | "audio"}
            onBack={() => router.back()}
            onFlipCamera={flipCamera}
            topInset={insets.top}
          />
        )}

        {/* Reconnecting banner */}
        {isReconnecting && (
          <View style={styles.reconnectBanner}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.reconnectText}>Yeniden bağlanılıyor...</Text>
          </View>
        )}

        {/* Controls */}
        {showControls && (
          <CallControls
            isMicrophoneEnabled={isMicrophoneEnabled}
            isCameraEnabled={isCameraEnabled}
            callType={callType as "video" | "audio"}
            onToggleMicrophone={toggleMicrophone}
            onToggleCamera={toggleCamera}
            onEndCall={handleEndCall}
            bottomInset={insets.bottom}
          />
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  remoteVideo: {
    flex: 1
  },
  audioOnlyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e"
  },
  audioAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  audioName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600"
  },
  reconnectBanner: {
    position: "absolute",
    top: "50%",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8
  },
  reconnectText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500"
  }
});
