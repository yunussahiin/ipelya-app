/**
 * Viewer Watch Screen
 * Canlı yayın izleme ekranı - Modüler yapı
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  BackHandler,
  Alert,
  TextInput,
  Pressable,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  useLiveKitRoom,
  useLiveSession,
  useLiveChat,
  useGuestInvitation,
  useBanCheck,
  useHostDisconnect
} from "@/hooks/live";
import {
  LiveVideoView,
  LiveChat,
  GuestInvitationModal,
  BanInfoModal,
  ReportModal,
  HostDisconnectOverlay
} from "@/components/live";
import { useToast } from "@/components/ui";
import { supabase } from "@/lib/supabaseClient";

// Local components
import { WatchHeader, WatchControls, WatchSettingsSheet } from "./_components";

export default function ViewerWatchScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Refs
  const settingsSheetRef = useRef<BottomSheet>(null);

  // State
  const [duration, setDuration] = useState("00:00");
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [inputText, setInputText] = useState("");

  // Modal states
  const [showBanModal, setShowBanModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Toast
  const { showToast } = useToast();

  // Hooks
  const { joinSession, leaveSession, activeSession } = useLiveSession();
  const { messages, sendMessage, deleteMessage } = useLiveChat({
    sessionId: sessionId || ""
  });
  // Ban check hook
  const { banInfo, checkBan } = useBanCheck();

  // Host disconnect hook - telefon kilitlendiğinde overlay göster
  const {
    isHostDisconnected,
    remainingSeconds,
    message: disconnectMessage
  } = useHostDisconnect({
    sessionId: sessionId || null,
    onHostReconnected: () => {
      console.log("[Watch] Host reconnected");
      showToast({ type: "success", message: "Yayıncı geri bağlandı" });
    },
    onSessionEnded: (reason) => {
      console.log("[Watch] Session ended:", reason);
      if (reason === "host_timeout") {
        Alert.alert("Yayın Sonlandı", "Yayıncı bağlantısı zaman aşımına uğradı.", [
          { text: "Tamam", onPress: () => router.back() }
        ]);
      }
    }
  });

  // Admin kick/ban handler
  const handleAdminKick = useCallback(async () => {
    console.log("[Watch] Admin kick/ban detected");

    // Ban bilgisini kontrol et
    if (sessionId) {
      const banned = await checkBan(sessionId, activeSession?.creatorId);
      if (banned) {
        // Ban modal'ı göster
        setShowBanModal(true);
        return;
      }
    }

    // Ban değilse sadece kick
    Alert.alert("⚠️ Yayından Çıkarıldınız", "Bir moderatör tarafından bu yayından çıkarıldınız.", [
      { text: "Tamam", onPress: () => router.back() }
    ]);
  }, [sessionId, activeSession?.creatorId, checkBan, banInfo, router]);

  // Room terminated handler
  const handleRoomTerminated = useCallback(() => {
    console.log("[Watch] Room terminated by admin");
    Alert.alert("🛑 Yayın Sonlandırıldı", "Bu yayın bir yönetici tarafından sonlandırıldı.", [
      { text: "Tamam", onPress: () => router.back() }
    ]);
  }, [router]);

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
    autoConnect: false,
    onAdminKick: handleAdminKick,
    onRoomTerminated: handleRoomTerminated
  });
  const { pendingInvitation, requestToJoin, respondToInvitation, hasPendingRequest } =
    useGuestInvitation({
      sessionId: sessionId || "",
      isHost: false
    });

  // Handlers
  const handleOpenSettings = useCallback(() => {
    settingsSheetRef.current?.expand();
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !isConnected) return;
    const text = inputText.trim();
    setInputText(""); // Önce temizle
    Keyboard.dismiss();
    await sendMessage(text);
  }, [inputText, isConnected, sendMessage]);

  // Refs for preventing double execution in Strict Mode
  const hasJoinedRef = useRef(false);
  const hasConnectedRef = useRef(false);

  // Join session on mount - only once
  useEffect(() => {
    if (sessionId && !hasJoinedRef.current) {
      hasJoinedRef.current = true;
      console.log("[Watch] Joining session:", sessionId);
      joinSession({ sessionId });
    }
    return () => {
      if (sessionId && hasJoinedRef.current) {
        hasJoinedRef.current = false;
        hasConnectedRef.current = false;
        leaveSession(sessionId);
        disconnect();
      }
    };
  }, [sessionId]); // joinSession, leaveSession, disconnect are stable

  // Session alındıktan sonra LiveKit'e bağlan - only once
  useEffect(() => {
    if (activeSession?.roomName && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      console.log("[Watch] Connecting to LiveKit room:", activeSession.roomName);
      connect();
    }
    // İzleyici sayısını başlat
    if (activeSession?.viewerCount !== undefined) {
      setViewerCount(activeSession.viewerCount);
    }
  }, [activeSession?.roomName, activeSession?.viewerCount]); // connect is stable

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
          const newData = payload.new as {
            status: string;
            total_viewers?: number;
            peak_viewers?: number;
          };

          // İzleyici sayısını güncelle
          if (newData.total_viewers !== undefined) {
            setViewerCount(newData.total_viewers);
          }

          if (newData.status === "ended" || newData.status === "host_disconnected") {
            const message =
              newData.status === "ended" ? "Yayın sona erdi" : "Yayıncı bağlantısı kesildi";

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
        {/* Video - Tam ekran */}
        <View style={styles.videoContainer}>
          <LiveVideoView
            trackRef={hostParticipant?.videoTrack || null}
            participantAvatar={activeSession?.creator?.avatar_url}
            isMuted={hostParticipant?.isMuted}
            isVideoOff={hostParticipant ? !hostParticipant.isCameraEnabled : false}
            isLoading={isConnecting || isReconnecting || !hostParticipant}
            showMuteIndicator={false}
          />

          {/* Host Disconnect Overlay - Yayıncı bağlantısı kesildiğinde */}
          <HostDisconnectOverlay
            visible={isHostDisconnected}
            remainingSeconds={remainingSeconds}
            message={disconnectMessage || undefined}
            hostName={activeSession?.creator?.display_name}
          />
        </View>

        {/* Header - Üst overlay */}
        <WatchHeader
          sessionTitle={activeSession?.title}
          hostName={activeSession?.creator?.display_name || "Host"}
          hostAvatar={activeSession?.creator?.avatar_url}
          viewerCount={viewerCount}
          duration={duration}
          isLive={activeSession?.status === "live"}
          isHostMuted={hostParticipant?.isMuted}
          onLeave={handleLeave}
          topInset={insets.top}
        />

        {/* Chat Overlay - Video üzerinde sol alt */}
        <View style={[styles.chatOverlay, { bottom: insets.bottom + 60 }]}>
          <LiveChat
            messages={messages}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            isHost={false}
            disabled={!isConnected}
            rateLimitSeconds={3}
            maxHeight={300}
            isOverlay
          />
        </View>

        {/* Controls - Sağ alt */}
        <WatchControls
          onSendGift={handleSendGift}
          onRequestToJoin={handleRequestToJoin}
          canRequestToJoin={!hasPendingRequest}
          requestPending={hasPendingRequest}
          isGuestEnabled={activeSession?.guestEnabled}
          bottomInset={insets.bottom + 60}
        />

        {/* Bottom Bar - Input + Actions */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          {/* Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Bir mesaj yazın"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={inputText}
              onChangeText={setInputText}
              editable={isConnected}
              maxLength={200}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            {/* Send button inside input */}
            {inputText.trim() && (
              <Pressable style={styles.inputSendButton} onPress={handleSendMessage}>
                <Ionicons name="arrow-up" size={18} color="#fff" />
              </Pressable>
            )}
          </View>

          {/* Settings/More button */}
          <Pressable style={styles.actionButton} onPress={handleOpenSettings}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </Pressable>

          {/* Heart/Like button */}
          <Pressable
            style={[styles.actionButton, styles.heartButton]}
            onPress={() => console.log("Send heart")}
          >
            <Ionicons name="heart" size={22} color="#fff" />
          </Pressable>
        </View>

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

        {/* Settings Bottom Sheet */}
        <WatchSettingsSheet
          ref={settingsSheetRef}
          onReport={() => setShowReportModal(true)}
          onShare={() => console.log("Paylaş")}
          onQuality={() => console.log("Kalite")}
        />

        {/* Ban Info Modal */}
        <BanInfoModal
          visible={showBanModal}
          banInfo={banInfo}
          onClose={() => setShowBanModal(false)}
          onDismiss={() => router.back()}
        />

        {/* Report Modal */}
        <ReportModal
          visible={showReportModal}
          sessionId={sessionId || ""}
          reportedUserId={activeSession?.creatorId || ""}
          reportedUserName={activeSession?.creator?.display_name}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            showToast({
              type: "success",
              message: "Şikayet gönderildi",
              description: "Ekibimiz en kısa sürede inceleyecek."
            });
          }}
        />
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
    ...StyleSheet.absoluteFillObject
  },
  chatOverlay: {
    position: "absolute",
    left: 0,
    right: 80,
    maxHeight: 300
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 10
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#fff",
    paddingVertical: 10
  },
  inputSendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center"
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center"
  },
  heartButton: {
    backgroundColor: "#EF4444"
  }
});
