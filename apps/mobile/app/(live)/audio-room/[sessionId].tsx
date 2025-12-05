/**
 * Audio Room Viewer Screen
 * Sesli oda dinleyici ekranı
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, StatusBar, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfileStore } from "@/store/profile.store";
import { useLiveKitRoom, useLiveSession, type LiveSession, type DataMessage } from "@/hooks/live";
import { useToast } from "@/components/ui";
import { AudioRoomViewer } from "./_components";

export default function AudioRoomViewerScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);

  // State
  const [duration, setDuration] = useState("00:00");
  const [sessionData, setSessionData] = useState<LiveSession | null>(null);

  // Bas-konuş state - hook'tan önce tanımlanmalı
  const [isPushToTalk, setIsPushToTalk] = useState(true); // Varsayılan: bas-konuş
  const [canSpeak, setCanSpeak] = useState(false); // Host tarafından konuşma izni

  // Konuşma izni modal state
  const [showSpeakPermissionModal, setShowSpeakPermissionModal] = useState(false);

  // Toast hook
  const { showToast } = useToast();

  // Data message handler - konuşma izni geldiğinde
  const handleDataMessage = useCallback((message: DataMessage) => {
    if (message.type === "grant_speak") {
      // TODO: targetUserId kontrolü yapılabilir - şimdilik tüm dinleyicilere gidiyor
      setCanSpeak(true);
      setIsPushToTalk(false); // Normal mikrofon moduna geç

      // Custom modal göster
      setShowSpeakPermissionModal(true);
    }
  }, []);

  // Modal kapatma handler
  const handleClosePermissionModal = useCallback(() => {
    setShowSpeakPermissionModal(false);
    showToast({
      type: "success",
      message: "Konuşma İzni Verildi",
      description: "Artık konuşabilirsiniz"
    });
  }, [showToast]);

  // Hooks
  const { joinSession, leaveSession } = useLiveSession();
  const {
    participants,
    isConnected,
    isConnecting,
    disconnect,
    connect,
    isMicrophoneEnabled,
    toggleMicrophone,
    sendDataMessage
  } = useLiveKitRoom({
    sessionId: sessionId || "",
    autoConnect: false,
    audioOnly: true,
    enableMediaOnConnect: false, // Dinleyici için mikrofon kapalı!
    userInfo: {
      name: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      isHost: false
    },
    onDataMessage: handleDataMessage
  });
  const [handRaiseTimeout, setHandRaiseTimeout] = useState<Date | null>(null); // Söz iste timeout
  const HAND_RAISE_COOLDOWN = 30000; // 30 saniye cooldown

  // Join session and connect to LiveKit - only once
  const hasConnectedRef = useRef(false);
  useEffect(() => {
    if (sessionId && !hasConnectedRef.current) {
      hasConnectedRef.current = true;

      // joinSession async - sonucu bekle ve sessionData'ya kaydet
      joinSession({ sessionId }).then((session) => {
        if (session) {
          console.log("[AudioRoomViewer] Session joined:", session.title, session.startedAt);
          setSessionData(session);
        }
      });

      connect();
    }
    return () => {
      if (sessionId) {
        leaveSession(sessionId);
        disconnect();
      }
    };
  }, [sessionId, joinSession, leaveSession, disconnect, connect]);

  // Duration timer - sessionData'dan startedAt kullan
  useEffect(() => {
    if (!sessionData?.startedAt) return;

    const startTime = new Date(sessionData.startedAt).getTime();

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
  }, [sessionData?.startedAt]);

  // Handlers
  const handleLeave = useCallback(() => {
    if (sessionId) {
      leaveSession(sessionId);
      disconnect();
    }
    router.back();
  }, [sessionId, leaveSession, disconnect, router]);

  // Bas-konuş handlers
  const handlePushToTalkStart = useCallback(async () => {
    if (canSpeak && isPushToTalk) {
      await toggleMicrophone();
    }
  }, [canSpeak, isPushToTalk, toggleMicrophone]);

  const handlePushToTalkEnd = useCallback(async () => {
    if (canSpeak && isPushToTalk && isMicrophoneEnabled) {
      await toggleMicrophone();
    }
  }, [canSpeak, isPushToTalk, isMicrophoneEnabled, toggleMicrophone]);

  const handleToggleMicrophone = useCallback(async () => {
    if (canSpeak && !isPushToTalk) {
      await toggleMicrophone();
    }
  }, [canSpeak, isPushToTalk, toggleMicrophone]);

  // Söz iste handler - spam koruması ile
  const handleRaiseHand = useCallback(async () => {
    // Timeout kontrolü
    if (handRaiseTimeout && new Date() < handRaiseTimeout) {
      const remainingSeconds = Math.ceil((handRaiseTimeout.getTime() - Date.now()) / 1000);
      showToast({
        type: "warning",
        message: "Bekleyin",
        description: `${remainingSeconds} saniye sonra tekrar söz isteyebilirsiniz`
      });
      return;
    }

    // LiveKit data message ile host'a bildir
    await sendDataMessage("hand_raise");

    showToast({
      type: "success",
      message: "Söz İsteği Gönderildi",
      description: "Sunucu isteğinizi değerlendirecek"
    });

    // Cooldown başlat
    setHandRaiseTimeout(new Date(Date.now() + HAND_RAISE_COOLDOWN));
  }, [handRaiseTimeout, showToast, HAND_RAISE_COOLDOWN, sendDataMessage]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
          fullScreenGestureEnabled: false
        }}
      />
      <StatusBar barStyle="light-content" />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Safe area padding */}
        <View style={{ height: insets.top }} />

        {/* Main content */}
        <AudioRoomViewer
          title={sessionData?.title || "Sesli Oda"}
          duration={duration}
          participants={participants}
          isConnecting={isConnecting}
          isMicrophoneEnabled={isMicrophoneEnabled}
          isPushToTalk={isPushToTalk}
          canSpeak={canSpeak}
          onLeave={handleLeave}
          onRaiseHand={handleRaiseHand}
          onPushToTalkStart={handlePushToTalkStart}
          onPushToTalkEnd={handlePushToTalkEnd}
          onToggleMicrophone={handleToggleMicrophone}
          bottomInset={insets.bottom}
        />
      </View>

      {/* Konuşma İzni Modal */}
      <Modal
        visible={showSpeakPermissionModal}
        transparent
        animationType="fade"
        onRequestClose={handleClosePermissionModal}
      >
        <BlurView intensity={20} style={styles.modalOverlay} tint="dark">
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Icon */}
            <View style={[styles.modalIconContainer, { backgroundColor: "#A3E63520" }]}>
              <Ionicons name="mic" size={40} color="#A3E635" />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Konuşma İzni Verildi!
            </Text>

            {/* Description */}
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Sunucu size konuşma izni verdi. Artık mikrofonunuzu açarak konuşabilirsiniz.
            </Text>

            {/* Button */}
            <Pressable
              style={[styles.modalButton, { backgroundColor: "#A3E635" }]}
              onPress={handleClosePermissionModal}
            >
              <Ionicons name="mic" size={20} color="#1C1C1E" />
              <Text style={styles.modalButtonText}>Anladım</Text>
            </Pressable>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  modalContent: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: "center"
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center"
  },
  modalDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 8,
    width: "100%"
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E"
  }
});
