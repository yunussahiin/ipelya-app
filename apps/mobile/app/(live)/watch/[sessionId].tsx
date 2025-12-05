/**
 * Viewer Watch Screen
 * Canlı yayın izleme ekranı - Modüler yapı
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, StatusBar, BackHandler, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useLiveKitRoom, useLiveSession, useLiveChat, useGuestInvitation } from "@/hooks/live";
import { LiveVideoView, LiveChat, GuestInvitationModal } from "@/components/live";
import { supabase } from "@/lib/supabaseClient";

// Local components
import { WatchHeader, WatchControls } from "./_components";

export default function ViewerWatchScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // State
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [duration, setDuration] = useState("00:00");
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Hooks
  const { joinSession, leaveSession, activeSession } = useLiveSession();
  const { messages, sendMessage, deleteMessage } = useLiveChat({
    sessionId: sessionId || ""
  });
  const {
    participants,
    isConnected,
    isConnecting,
    isReconnecting,
    // connectionQuality,
    disconnect,
    connect
  } = useLiveKitRoom({
    roomName: activeSession?.roomName,
    sessionId: sessionId || "",
    autoConnect: false
  });
  const { pendingInvitation, requestToJoin, respondToInvitation, hasPendingRequest } =
    useGuestInvitation({
      sessionId: sessionId || "",
      isHost: false
    });

  // Join session on mount
  useEffect(() => {
    if (sessionId) {
      console.log("[Watch] Joining session:", sessionId);
      joinSession({ sessionId });
    }
    return () => {
      if (sessionId) {
        leaveSession(sessionId);
        disconnect();
      }
    };
  }, [sessionId, joinSession, leaveSession, disconnect]);

  // Session alındıktan sonra LiveKit'e bağlan
  useEffect(() => {
    if (activeSession?.roomName && !isConnected && !isConnecting && !isReconnecting) {
      console.log("[Watch] Connecting to LiveKit room:", activeSession.roomName);
      connect();
    }
  }, [activeSession?.roomName, isConnected, isConnecting, isReconnecting, connect]);

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

  // Guest invitation modal
  useEffect(() => {
    if (pendingInvitation) {
      setShowGuestModal(true);
    }
  }, [pendingInvitation]);

  // Handlers
  const handleLeave = useCallback(() => {
    if (sessionId) {
      leaveSession(sessionId);
      disconnect();
    }
    router.back();
  }, [sessionId, leaveSession, disconnect, router]);

  // Back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleLeave();
      return true;
    });
    return () => backHandler.remove();
  }, [handleLeave]);

  // Session status realtime subscription - yayın bittiğinde bilgilendir
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`live_session_status:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_sessions",
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log("[Watch] Session status changed:", payload.new);
          const newStatus = (payload.new as { status: string }).status;

          if (newStatus === "ended" || newStatus === "host_disconnected") {
            const message =
              newStatus === "ended" ? "Yayın sona erdi" : "Yayıncı bağlantısı kesildi";

            Alert.alert("Yayın Durumu", message, [{ text: "Tamam", onPress: handleLeave }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, handleLeave]);

  const handleRequestToJoin = useCallback(async () => {
    if (!activeSession) return;
    await requestToJoin(activeSession.id);
  }, [activeSession, requestToJoin]);

  const handleRespondToInvitation = useCallback(
    async (accept: boolean) => {
      if (!pendingInvitation) return;
      await respondToInvitation(pendingInvitation.id, accept);
      setShowGuestModal(false);
    },
    [pendingInvitation, respondToInvitation]
  );

  const handleSendGift = useCallback(() => {
    console.log("Send gift");
  }, []);

  // Host track - participants'tan bul
  const hostParticipant = participants.find((p) => p.isHost);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.container}>
        {/* Video Area - Sadece host'un videosunu göster */}
        <View style={styles.videoContainer}>
          <LiveVideoView
            trackRef={hostParticipant?.videoTrack || null}
            participantName={activeSession?.creator?.display_name || "Host"}
            participantAvatar={activeSession?.creator?.avatar_url}
            isHost
            isMuted={hostParticipant?.isMuted}
            isVideoOff={!hostParticipant?.isCameraEnabled}
          />

          {/* Header */}
          <WatchHeader
            sessionTitle={activeSession?.title}
            hostName={activeSession?.creator?.display_name || "Host"}
            hostAvatar={activeSession?.creator?.avatar_url}
            viewerCount={activeSession?.viewerCount || 0}
            duration={duration}
            isLive={activeSession?.status === "live"}
            onLeave={handleLeave}
            topInset={insets.top}
          />

          {/* Controls */}
          <WatchControls
            isChatVisible={isChatVisible}
            onToggleChat={() => setIsChatVisible((prev) => !prev)}
            onSendGift={handleSendGift}
            onRequestToJoin={handleRequestToJoin}
            canRequestToJoin={!hasPendingRequest}
            requestPending={hasPendingRequest}
            isGuestEnabled={activeSession?.guestEnabled}
            bottomInset={insets.bottom}
          />
        </View>

        {/* Chat */}
        {isChatVisible && (
          <View style={[styles.chatContainer, { backgroundColor: colors.background }]}>
            <LiveChat
              messages={messages}
              onSendMessage={sendMessage}
              onDeleteMessage={deleteMessage}
              isHost={false}
              disabled={!isConnected}
              rateLimitSeconds={3}
              maxHeight={250}
            />
          </View>
        )}

        {/* Guest Invitation Modal */}
        {pendingInvitation && (
          <GuestInvitationModal
            visible={showGuestModal}
            hostName={pendingInvitation.hostName || "Host"}
            hostAvatar={pendingInvitation.hostAvatar}
            onAccept={() => handleRespondToInvitation(true)}
            onDecline={() => handleRespondToInvitation(false)}
            timeoutSeconds={60}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  videoContainer: {
    flex: 1,
    position: "relative"
  },
  chatContainer: {
    maxHeight: 300
  }
});
