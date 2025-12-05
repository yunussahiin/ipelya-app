/**
 * Audio Room Create/Host Screen
 * Sesli oda oluşturma ve yayın başlatma ekranı
 * Modüler yapı - Component'ler _components klasöründe
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Alert, StatusBar } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfileStore } from "@/store/profile.store";
import { useLiveSession, useLiveKitRoom, type CreateSessionParams } from "@/hooks/live";
import { useToast } from "@/components/ui";
import type { DataMessage } from "@/hooks/live";
import { supabase } from "@/lib/supabaseClient";

// Local components
import { AudioRoomSetup, AudioRoomLive } from "./_components";

type AccessType = "public" | "subscribers_only" | "pay_per_view";

interface AudioSettings {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

const defaultAudioSettings: AudioSettings = {
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true
};

export default function AudioRoomCreateScreen() {
  const router = useRouter();
  const { resumeSessionId } = useLocalSearchParams<{ resumeSessionId?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfileStore((s) => s.profile);

  // Form state
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [accessType, setAccessType] = useState<AccessType>("public");
  const [ppvPrice, setPpvPrice] = useState("");
  const [chatEnabled, setChatEnabled] = useState(true);
  const [giftsEnabled, setGiftsEnabled] = useState(true);
  const [guestEnabled, setGuestEnabled] = useState(true);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [micMode, setMicMode] = useState<"standard" | "push_to_talk" | "both">("standard");

  // Live state
  const [isLive, setIsLive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [duration, setDuration] = useState("00:00");

  // Toast hook
  const { showToast } = useToast();

  // Söz iste handler - host tarafında
  const handleDataMessage = useCallback(
    (message: DataMessage) => {
      if (message.type === "hand_raise") {
        showToast({
          type: "info",
          message: "Söz İsteği",
          description: `${message.senderName} söz istiyor`
        });
      }
    },
    [showToast]
  );

  // Hooks - resumeSessionId varsa mevcut session'ı kullan
  const { createSession, session, endSession, resumeSession } = useLiveSession();
  const currentSessionId = session?.id || resumeSessionId || "";
  const {
    connect,
    disconnect,
    isMicrophoneEnabled,
    toggleMicrophone,
    participants,
    sendDataMessage
  } = useLiveKitRoom({
    sessionId: currentSessionId,
    autoConnect: false,
    audioOnly: true, // Sesli oda - video yok
    enableMediaOnConnect: true, // Host için mikrofonu otomatik aç
    enableKrisp: false, // Krisp development build gerektirir - şimdilik kapalı
    userInfo: {
      name: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      isHost: true
    },
    onDataMessage: handleDataMessage
  });

  // Dinleyiciye konuşma izni ver
  const handleGrantSpeak = useCallback(
    async (userId: string, userName: string) => {
      await sendDataMessage("grant_speak", { targetUserId: userId, targetUserName: userName });
      showToast({
        type: "success",
        message: "Konuşma İzni Verildi",
        description: `${userName} artık konuşabilir`
      });
    },
    [sendDataMessage, showToast]
  );

  // Resume existing session if resumeSessionId provided - only once
  const hasResumedRef = useRef(false);
  useEffect(() => {
    if (resumeSessionId && !session && !hasResumedRef.current) {
      hasResumedRef.current = true;
      console.log("[AudioRoom] Resuming session:", resumeSessionId);
      resumeSession(resumeSessionId).then((resumedSession) => {
        if (resumedSession) {
          setTitle(resumedSession.title || "");
          setIsLive(true);
        }
      });
    }
  }, [resumeSessionId, session, resumeSession]);

  // Duration timer
  useEffect(() => {
    if (!isLive) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(diff / 60);
      const seconds = diff % 60;
      setDuration(`${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Auto connect when session created - only once
  const hasConnectedRef = useRef(false);
  useEffect(() => {
    if (isLive && session?.roomName && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connect();
    }
  }, [isLive, session?.roomName, connect]);

  // Participant profiles from Supabase (video'daki gibi)
  const [participantProfiles, setParticipantProfiles] = useState<
    Record<string, { display_name: string; avatar_url: string | null }>
  >({});

  // Fetch participant profiles when participants change
  useEffect(() => {
    if (!isLive) return;

    // Host hariç katılımcıların ID'lerini al
    const participantIds = participants.filter((p) => !p.isHost).map((p) => p.identity);

    if (participantIds.length === 0) return;

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", participantIds)
        .eq("type", "real");

      if (data) {
        const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
        data.forEach((p) => {
          profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
        setParticipantProfiles(profileMap);
      }
    };

    fetchProfiles();
  }, [isLive, participants]);

  // Participants with profile data merged
  const enrichedParticipants = useMemo(() => {
    return participants.map((p) => {
      const profile = participantProfiles[p.identity];
      return {
        ...p,
        name: profile?.display_name || p.name || "Kullanıcı",
        metadata: {
          ...p.metadata,
          avatarUrl: profile?.avatar_url || p.metadata?.avatarUrl
        }
      };
    });
  }, [participants, participantProfiles]);

  // Handlers
  const handleToggleMic = useCallback(() => {
    if (isLive) {
      toggleMicrophone();
    } else {
      setIsMicOn((prev) => !prev);
    }
  }, [isLive, toggleMicrophone]);

  // Çift tıklama koruması için ref
  const isCreatingRoomRef = useRef(false);

  const handleStartRoom = useCallback(async () => {
    // Çift tıklama koruması
    if (isCreatingRoomRef.current || isLive) {
      console.log("[AudioRoom] Already creating room or live, ignoring...");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Hata", "Lütfen oda başlığı girin");
      return;
    }

    isCreatingRoomRef.current = true;

    try {
      const params: CreateSessionParams = {
        title: title.trim(),
        thumbnailUrl,
        sessionType: "audio_room",
        accessType,
        ppvCoinPrice: accessType === "pay_per_view" ? parseInt(ppvPrice) || 0 : undefined,
        chatEnabled,
        giftsEnabled,
        guestEnabled
      };

      const newSession = await createSession(params);
      if (newSession) {
        setIsLive(true);
      }
    } finally {
      isCreatingRoomRef.current = false;
    }
  }, [
    title,
    thumbnailUrl,
    accessType,
    ppvPrice,
    chatEnabled,
    giftsEnabled,
    guestEnabled,
    createSession,
    isLive
  ]);

  const handleEndRoom = useCallback(() => {
    Alert.alert("Odayı Kapat", "Sesli odayı kapatmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Kapat",
        style: "destructive",
        onPress: async () => {
          if (session?.id) {
            await endSession(session.id);
          }
          disconnect();
          router.back();
        }
      }
    ]);
  }, [session?.id, endSession, disconnect, router]);

  const handleBack = useCallback(() => {
    if (isLive) {
      handleEndRoom();
    } else {
      router.back();
    }
  }, [isLive, handleEndRoom, router]);

  // "both" modunda push-to-talk toggle için state
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);

  // isPushToTalk hesapla - handler'lardan ÖNCE tanımlanmalı
  const isPushToTalk = micMode === "push_to_talk" || (micMode === "both" && isPushToTalkActive);

  // Bas-konuş handlers
  const handlePushToTalkStart = useCallback(async () => {
    if (isPushToTalk && !isMicrophoneEnabled) {
      await toggleMicrophone();
      setIsMicOn(true);
    }
  }, [isPushToTalk, isMicrophoneEnabled, toggleMicrophone]);

  const handlePushToTalkEnd = useCallback(async () => {
    if (isPushToTalk && isMicrophoneEnabled) {
      await toggleMicrophone();
      setIsMicOn(false);
    }
  }, [isPushToTalk, isMicrophoneEnabled, toggleMicrophone]);

  const handleTogglePushToTalk = useCallback(() => {
    if (micMode === "both") {
      setIsPushToTalkActive((prev: boolean) => !prev);
    }
  }, [micMode]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: !isLive, // Live modda swipe-to-dismiss kapalı
          fullScreenGestureEnabled: false
        }}
      />
      <StatusBar barStyle="light-content" />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header - sadece setup modunda göster */}
        {!isLive && (
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
            </Pressable>

            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Yeni Sesli Oda</Text>

            <View style={{ width: 60 }} />
          </View>
        )}

        {/* Live mode - sadece safe area padding */}
        {isLive && <View style={{ height: insets.top }} />}

        {!isLive ? (
          <>
            <AudioRoomSetup
              avatarUrl={profile?.avatarUrl}
              displayName={profile?.displayName}
              title={title}
              onTitleChange={setTitle}
              thumbnailUrl={thumbnailUrl}
              onThumbnailChange={setThumbnailUrl}
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
              audioSettings={audioSettings}
              onAudioSettingsChange={setAudioSettings}
              micMode={micMode}
              onMicModeChange={setMicMode}
              isMicOn={isMicOn}
              onToggleMic={handleToggleMic}
            />
            {/* Start Button - Only in setup */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
              <Pressable
                style={[styles.startButton, { backgroundColor: colors.accent }]}
                onPress={handleStartRoom}
              >
                <Ionicons name="radio" size={22} color="#fff" />
                <Text style={styles.startButtonText}>Odayı Başlat</Text>
              </Pressable>
            </View>
          </>
        ) : (
          /* Live view has its own controls */
          <AudioRoomLive
            title={title}
            duration={duration}
            hostName={profile?.displayName}
            hostAvatar={profile?.avatarUrl}
            isMicOn={isMicrophoneEnabled}
            isPushToTalk={isPushToTalk}
            micMode={micMode}
            participants={enrichedParticipants}
            onToggleMic={toggleMicrophone}
            onPushToTalkStart={handlePushToTalkStart}
            onPushToTalkEnd={handlePushToTalkEnd}
            onTogglePushToTalk={handleTogglePushToTalk}
            onEndRoom={handleEndRoom}
            onGrantSpeak={handleGrantSpeak}
            bottomInset={insets.bottom}
          />
        )}
      </View>
    </>
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
  liveHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center"
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
  bottomActions: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    gap: 8
  },
  startButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700"
  }
});
