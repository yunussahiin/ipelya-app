/**
 * Creator Broadcast Screen
 * Yayın başlatma ve ayarlar ekranı
 * Full screen preview + overlay controls
 */

import React, { useState, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission
} from "react-native-vision-camera";
import { useTheme } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import {
  useLiveSession,
  useLiveKitRoom,
  useLiveChat,
  type CreateSessionParams
} from "@/hooks/live";
import { useProfileStore } from "@/store/profile.store";

// Local components
import {
  BroadcastPreview,
  BroadcastSettings,
  BroadcastLiveOverlay,
  type BroadcastLiveOverlayRef,
  type BroadcastMediaSettings
} from "./_components";

type SessionType = "video_live" | "audio_room";
type AccessType = "public" | "subscribers_only" | "pay_per_view";

const defaultMediaSettings: BroadcastMediaSettings = {
  videoQuality: "720p",
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true
};

export default function CreatorBroadcastScreen() {
  const router = useRouter();
  const { resumeSessionId } = useLocalSearchParams<{ resumeSessionId?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);

  // Form state
  const [title, setTitle] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("video_live");
  const [accessType, setAccessType] = useState<AccessType>("public");
  const [ppvPrice, setPpvPrice] = useState("");
  const [chatEnabled, setChatEnabled] = useState(true);
  const [giftsEnabled, setGiftsEnabled] = useState(true);
  const [guestEnabled, setGuestEnabled] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [mediaSettings, setMediaSettings] = useState<BroadcastMediaSettings>(defaultMediaSettings);

  // Screen state
  const [isLive, setIsLive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoHeightPercent, setVideoHeightPercent] = useState(1); // 1 = full, 0.5 = half

  // Video alanı animasyonu - sadece canlıda animasyonlu, preview'da full
  const videoAnimStyle = useAnimatedStyle(() => ({
    flex: isLive ? 0 : 1,
    height: isLive ? withTiming(SCREEN_HEIGHT * videoHeightPercent, { duration: 300 }) : undefined
  }));

  // BroadcastLiveOverlay ref - sheet'leri açmak için
  const liveOverlayRef = useRef<BroadcastLiveOverlayRef>(null);
  const handleOpenViewers = useCallback(() => {
    liveOverlayRef.current?.openViewers();
  }, []);

  // Camera state
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraPosition, setCameraPosition] = useState<"front" | "back">("front");
  const [isTorchOn, setIsTorchOn] = useState(false);

  // Vision Camera hooks
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermission();
  const device = useCameraDevice(cameraPosition);

  // Session hooks
  const { createSession, endSession, session, isLoading, resumeSession } = useLiveSession();
  const currentSessionId = session?.id || resumeSessionId || "";

  // Resume existing session if resumeSessionId provided - only once
  const hasResumedRef = React.useRef(false);
  React.useEffect(() => {
    if (resumeSessionId && !session && !hasResumedRef.current) {
      hasResumedRef.current = true;
      console.log("[Broadcast] Resuming session:", resumeSessionId);
      resumeSession(resumeSessionId).then((resumedSession) => {
        if (resumedSession) {
          setTitle(resumedSession.title || "");
          setSessionType(resumedSession.sessionType);
          setIsLive(true);
        }
      });
    }
  }, [resumeSessionId, session, resumeSession]);

  const {
    connect,
    disconnect,
    isConnected,
    isMicrophoneEnabled,
    isCameraEnabled,
    toggleMicrophone,
    toggleCamera,
    flipCamera,
    localParticipant,
    participants
  } = useLiveKitRoom({
    roomName: session?.roomName,
    sessionId: currentSessionId || undefined,
    enableMediaOnConnect: true, // Host için kamera/mic otomatik aktif
    mediaSettings: {
      videoQuality: mediaSettings.videoQuality,
      noiseSuppression: mediaSettings.noiseSuppression,
      echoCancellation: mediaSettings.echoCancellation,
      autoGainControl: mediaSettings.autoGainControl
    }
  });

  // Chat hook
  const { messages, sendMessage, deleteMessage } = useLiveChat({
    sessionId: session?.id || ""
  });

  // Duration & viewer count state
  const [duration, setDuration] = React.useState("00:00");
  const [viewerCount, setViewerCount] = React.useState(0);
  const [liveStartTime, setLiveStartTime] = React.useState<number | null>(null);

  // Set start time when going live
  React.useEffect(() => {
    if (isLive && !liveStartTime) {
      setLiveStartTime(Date.now());
    }
    if (!isLive) {
      setLiveStartTime(null);
      setDuration("00:00");
    }
  }, [isLive, liveStartTime]);

  // Duration timer
  React.useEffect(() => {
    if (!isLive || !liveStartTime) return;

    const updateDuration = () => {
      const now = Date.now();
      const diff = Math.floor((now - liveStartTime) / 1000);
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
  }, [isLive, liveStartTime]);

  // Viewer profiles from Supabase
  const [viewerProfiles, setViewerProfiles] = React.useState<
    Record<string, { display_name: string; avatar_url: string | null }>
  >({});

  // Fetch viewer profiles when participants change
  React.useEffect(() => {
    if (!isLive) return;

    const viewerIds = participants
      .filter((p) => p.identity !== localParticipant?.identity)
      .map((p) => p.identity);

    if (viewerIds.length === 0) return;

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", viewerIds)
        .eq("type", "real");

      if (data) {
        const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
        data.forEach((p) => {
          profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
        setViewerProfiles(profileMap);
      }
    };

    fetchProfiles();
  }, [isLive, participants, localParticipant?.identity]);

  // Viewer count and list from participants (excluding self)
  const viewersList = React.useMemo(() => {
    if (!isLive) return [];
    // Host hariç katılımcılar
    return participants
      .filter((p) => p.identity !== localParticipant?.identity)
      .map((p) => {
        const profile = viewerProfiles[p.identity];
        return {
          id: p.identity,
          odaId: p.identity,
          userName: profile?.display_name || p.name || p.identity,
          userId: p.identity,
          userAvatar: profile?.avatar_url || undefined,
          joinedAt: new Date().toISOString()
        };
      });
  }, [isLive, participants, localParticipant?.identity, viewerProfiles]);

  React.useEffect(() => {
    setViewerCount(viewersList.length);
  }, [viewersList.length]);

  // Local participant'ın video track'i
  const localVideoTrack = participants.find(
    (p) => p.identity === localParticipant?.identity
  )?.videoTrack;

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      if (!hasCameraPermission) await requestCameraPermission();
      if (!hasMicPermission) await requestMicPermission();
    })();
  }, [hasCameraPermission, hasMicPermission, requestCameraPermission, requestMicPermission]);

  // Handlers
  const handleToggleCamera = useCallback(() => {
    console.log(
      "[Broadcast] handleToggleCamera called, isLive:",
      isLive,
      "current isCameraOn:",
      isCameraOn
    );
    if (isLive) {
      console.log("[Broadcast] Calling LiveKit toggleCamera");
      toggleCamera();
    } else {
      console.log("[Broadcast] Toggling local camera state");
      setIsCameraOn((prev) => {
        console.log("[Broadcast] Camera state changing from", prev, "to", !prev);
        return !prev;
      });
    }
  }, [isLive, isCameraOn, toggleCamera]);

  const handleToggleMic = useCallback(() => {
    console.log("[Broadcast] handleToggleMic called, isLive:", isLive, "current isMicOn:", isMicOn);
    if (isLive) {
      console.log("[Broadcast] Calling LiveKit toggleMicrophone");
      toggleMicrophone();
    } else {
      console.log("[Broadcast] Toggling local mic state");
      setIsMicOn((prev) => {
        console.log("[Broadcast] Mic state changing from", prev, "to", !prev);
        return !prev;
      });
    }
  }, [isLive, isMicOn, toggleMicrophone]);

  const handleFlipCamera = useCallback(() => {
    console.log("[Broadcast] handleFlipCamera called, isLive:", isLive);
    // Kamera döndürülürken torch'u kapat (ön kamerada torch yok)
    setIsTorchOn(false);
    if (isLive) {
      flipCamera();
    } else {
      setCameraPosition((prev) => (prev === "front" ? "back" : "front"));
    }
  }, [isLive, flipCamera]);

  const handleToggleTorch = useCallback(() => {
    console.log("[Broadcast] handleToggleTorch called, current:", isTorchOn);
    setIsTorchOn((prev) => !prev);
  }, [isTorchOn]);

  const handleStartBroadcast = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Hata", "Lütfen yayın başlığı girin");
      return;
    }

    const params: CreateSessionParams = {
      title: title.trim(),
      thumbnailUrl,
      sessionType,
      accessType,
      ppvCoinPrice: accessType === "pay_per_view" ? parseInt(ppvPrice) || 0 : undefined,
      chatEnabled,
      giftsEnabled,
      guestEnabled
    };

    console.log("[Broadcast] Creating session...");
    const newSession = await createSession(params);

    if (newSession) {
      console.log("[Broadcast] Session created:", newSession.id, "roomName:", newSession.roomName);

      // Vision Camera'yı kapatmak için önce local state'i false yap
      // Bu sayede Vision Camera unmount olur ve LiveKit kamerayı alabilir
      setIsCameraOn(false);

      // Kısa bir gecikme ile Vision Camera'nın kapanmasını bekle
      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsLive(true);
      // NOT: connect() session state güncellenince useEffect ile çağrılacak
    }
  }, [
    title,
    thumbnailUrl,
    sessionType,
    accessType,
    ppvPrice,
    chatEnabled,
    giftsEnabled,
    guestEnabled,
    createSession
  ]);

  // Session oluşturulunca otomatik bağlan - only once
  const hasConnectedRef = React.useRef(false);
  React.useEffect(() => {
    if (isLive && session?.roomName && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      console.log("[Broadcast] Auto-connecting to room:", session.roomName);
      connect();
    }
  }, [isLive, session?.roomName, connect]);

  const handleEndBroadcast = useCallback(async () => {
    Alert.alert("Yayını Sonlandır", "Yayını sonlandırmak istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sonlandır",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("[Broadcast] Ending session...");
            await endSession();
            console.log("[Broadcast] Session ended successfully");
          } catch (err) {
            console.error("[Broadcast] End session error:", err);
          }
          disconnect();
          setIsLive(false);
          router.back();
        }
      }
    ]);
  }, [endSession, disconnect, router]);

  const handleBack = useCallback(() => {
    if (isLive) {
      handleEndBroadcast();
    } else {
      disconnect();
      router.back();
    }
  }, [isLive, handleEndBroadcast, disconnect, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Video Preview - Animasyonlu yükseklik */}
        <Animated.View style={[styles.videoContainer, videoAnimStyle]}>
          <BroadcastPreview
            device={device}
            hasCameraPermission={hasCameraPermission}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isLive={isLive}
            isMicrophoneEnabled={isMicrophoneEnabled}
            isCameraEnabled={isCameraEnabled}
            localVideoTrack={localVideoTrack}
            isTorchOn={isTorchOn}
            avatarUrl={profile?.avatarUrl}
            onToggleCamera={handleToggleCamera}
            onToggleMic={handleToggleMic}
            onFlipCamera={handleFlipCamera}
            onToggleTorch={handleToggleTorch}
          />
        </Animated.View>

        {/* Header Overlay */}
        <View style={[styles.headerOverlay, { paddingTop: insets.top + 8 }]}>
          {/* Sol - Yayın önizlemede geri butonu, canlıda izleyici/süre */}
          {!isLive ? (
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </Pressable>
          ) : (
            <View style={styles.liveStats}>
              <Pressable style={styles.statBadge} onPress={handleOpenViewers}>
                <Ionicons name="eye" size={14} color="#fff" />
                <Text style={styles.statText}>{viewerCount}</Text>
              </Pressable>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>{duration}</Text>
              </View>
            </View>
          )}

          {/* Orta - Sadece önizlemede başlık */}
          {!isLive && <Text style={styles.headerTitle}>Yayın Önizleme</Text>}

          {/* Sağ - Canlı badge */}
          {isLive ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>CANLI</Text>
            </View>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        {/* Live Overlay - Chat, Input, Viewer Count, FAB Controls */}
        {isLive && (
          <BroadcastLiveOverlay
            ref={liveOverlayRef}
            messages={messages}
            onSendMessage={sendMessage}
            onDeleteMessage={deleteMessage}
            viewerCount={viewerCount}
            viewers={viewersList}
            duration={duration}
            isConnected={isConnected}
            broadcastTitle={title}
            broadcastType={sessionType}
            localVideoTrack={localVideoTrack}
            isCameraOn={isCameraEnabled}
            isMicOn={isMicrophoneEnabled}
            onToggleCamera={handleToggleCamera}
            onToggleMic={handleToggleMic}
            onFlipCamera={handleFlipCamera}
            onEndBroadcast={handleEndBroadcast}
            onVideoHeightChange={setVideoHeightPercent}
          />
        )}

        {/* Bottom Actions - Fixed at bottom, not overlay */}
        {!isLive && (
          <View
            style={[
              styles.bottomActions,
              { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }
            ]}
          >
            {/* Settings Button */}
            <Pressable
              style={[styles.settingsRow, { backgroundColor: colors.surface }]}
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
              <View style={styles.settingsInfo}>
                <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>
                  Yayın Ayarları
                </Text>
                <Text
                  style={[styles.settingsValue, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {title || "Başlık belirle, erişim tipi seç..."}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Start Button */}
            <Pressable
              style={[
                styles.startButton,
                { backgroundColor: colors.accent, opacity: isLoading ? 0.6 : 1 }
              ]}
              onPress={handleStartBroadcast}
              disabled={isLoading}
            >
              <Ionicons name="radio" size={22} color="#fff" />
              <Text style={styles.startButtonText}>
                {isLoading ? "Başlatılıyor..." : "Yayını Başlat"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Settings Modal */}
        <Modal
          visible={showSettings}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContent}
            >
              <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Yayın Ayarları
                </Text>
                <Pressable onPress={() => setShowSettings(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </Pressable>
              </View>

              <ScrollView
                style={[styles.modalScroll, { backgroundColor: colors.background }]}
                keyboardShouldPersistTaps="handled"
              >
                <BroadcastSettings
                  title={title}
                  onTitleChange={setTitle}
                  sessionType={sessionType}
                  onSessionTypeChange={(type) => {
                    if (type === "audio_room") {
                      // Audio room için ayrı ekrana yönlendir
                      setShowSettings(false);
                      router.replace("/(live)/audio-room");
                    } else {
                      setSessionType(type);
                    }
                  }}
                  accessType={accessType}
                  onAccessTypeChange={setAccessType}
                  ppvPrice={ppvPrice}
                  onPpvPriceChange={setPpvPrice}
                  chatEnabled={chatEnabled}
                  onChatEnabledChange={setChatEnabled}
                  giftsEnabled={giftsEnabled}
                  onGiftsEnabledChange={setGiftsEnabled}
                  guestEnabled={guestEnabled}
                  onGuestEnabledChange={setGuestEnabled}
                  thumbnailUrl={thumbnailUrl}
                  onThumbnailChange={setThumbnailUrl}
                  avatarUrl={profile?.avatarUrl}
                  mediaSettings={mediaSettings}
                  onMediaSettingsChange={setMediaSettings}
                />
              </ScrollView>

              <View
                style={[
                  styles.modalFooter,
                  { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }
                ]}
              >
                <Pressable
                  style={[styles.modalDoneButton, { backgroundColor: colors.accent }]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.modalDoneText}>Tamam</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  videoContainer: {
    width: "100%",
    overflow: "hidden"
  },
  // Header Overlay
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 100 // BroadcastLiveOverlay'in üstünde olması için yüksek z-index
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff"
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  liveStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5
  },
  statText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  },
  // Bottom Actions (not overlay)
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12
  },
  settingsInfo: {
    flex: 1,
    gap: 2
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: "600"
  },
  settingsValue: {
    fontSize: 13
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden"
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  modalScroll: {
    paddingHorizontal: 4
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  modalDoneButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12
  },
  modalDoneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});
