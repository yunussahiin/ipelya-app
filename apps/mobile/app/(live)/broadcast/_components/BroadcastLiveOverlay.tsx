/**
 * Broadcast Live Overlay
 * Yayın sırasında gösterilen chat alanı + FAB kontroller
 */

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { TrackReferenceOrPlaceholder } from "@livekit/react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet from "@gorhom/bottom-sheet";
import { useTheme } from "@/theme/ThemeProvider";
import { LiveChat, type ChatMessage } from "@/components/live";
import { ViewersSheet, type Viewer } from "./ViewersSheet";
import { GiftsSheet, mockGifts, type GiftItem } from "./GiftsSheet";

interface BroadcastLiveOverlayProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<boolean>;
  onDeleteMessage?: (messageId: string) => void;
  viewerCount: number;
  viewers?: Viewer[];
  duration: string;
  isConnected: boolean;
  // Yayın bilgileri
  broadcastTitle?: string;
  broadcastType?: "video_live" | "audio_room";
  /** Canlı video track - ViewersSheet'te önizleme için */
  localVideoTrack?: TrackReferenceOrPlaceholder | null;
  // Kontrol butonları
  isCameraOn?: boolean;
  isMicOn?: boolean;
  onToggleCamera?: () => void;
  onToggleMic?: () => void;
  onFlipCamera?: () => void;
  onEndBroadcast?: () => void;
  /** Video yükseklik yüzdesi (0-1) - parent'a bildirir */
  onVideoHeightChange?: (heightPercent: number) => void;
  /** İzleyiciyi şikayet et */
  onReportViewer?: (viewer: Viewer) => void;
}

export interface BroadcastLiveOverlayRef {
  openViewers: () => void;
  openGifts: () => void;
}

export const BroadcastLiveOverlay = forwardRef<BroadcastLiveOverlayRef, BroadcastLiveOverlayProps>(
  (
    {
      messages,
      onSendMessage,
      onDeleteMessage,
      viewerCount,
      viewers = [],
      duration,
      isConnected,
      broadcastTitle,
      broadcastType = "video_live",
      localVideoTrack,
      isCameraOn = true,
      isMicOn = true,
      onToggleCamera,
      onToggleMic,
      onFlipCamera,
      onEndBroadcast,
      onVideoHeightChange,
      onReportViewer
    },
    ref
  ) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const viewersSheetRef = useRef<BottomSheet>(null);
    const giftsSheetRef = useRef<BottomSheet>(null);
    const [inputText, setInputText] = useState("");
    const [isOverlayMode, setIsOverlayMode] = useState(false);
    const [showControls, setShowControls] = useState(false);

    // Parent'a ref expose et
    useImperativeHandle(
      ref,
      () => ({
        openViewers: () => viewersSheetRef.current?.snapToIndex(0),
        openGifts: () => giftsSheetRef.current?.snapToIndex(0)
      }),
      []
    );

    // Mode değiştiğinde parent'a bildir
    useEffect(() => {
      // Overlay modda video %100, split modda %50
      onVideoHeightChange?.(isOverlayMode ? 1 : 0.5);
    }, [isOverlayMode, onVideoHeightChange]);

    const handleSendMessage = useCallback(async () => {
      if (!inputText.trim() || !isConnected) return;
      const text = inputText.trim();
      setInputText("");
      Keyboard.dismiss();
      await onSendMessage(text);
    }, [inputText, isConnected, onSendMessage]);

    const handleOpenViewers = useCallback(() => {
      viewersSheetRef.current?.snapToIndex(0);
    }, []);

    // Gifts data
    const [gifts] = useState<GiftItem[]>(mockGifts); // Mock data
    const totalGiftValue = gifts.reduce((sum, g) => sum + g.value, 0);

    const handleOpenGifts = useCallback(() => {
      giftsSheetRef.current?.snapToIndex(0);
    }, []);

    // FAB Controls animasyonu
    const controlsAnimStyle = useAnimatedStyle(() => ({
      opacity: withTiming(showControls ? 1 : 0, { duration: 200 }),
      transform: [{ scale: withSpring(showControls ? 1 : 0.8) }]
    }));

    // Overlay Mode - Video üzerinde transparan chat
    if (isOverlayMode) {
      return (
        <>
          {/* Üst bilgi - İzleyici sayısı ve süre */}
          <View style={[styles.topInfo, { top: insets.top + 8 }]}>
            <Pressable style={styles.viewerBadge} onPress={handleOpenViewers}>
              <Ionicons name="eye" size={14} color="#fff" />
              <Text style={styles.viewerText}>{viewerCount}</Text>
            </Pressable>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{duration}</Text>
            </View>
          </View>

          {/* FAB Controls - Sağ tarafta */}
          <View style={[styles.fabContainerRight, { top: insets.top + 60 }]}>
            <Pressable
              style={[
                styles.fabMain,
                { backgroundColor: showControls ? colors.accent : "rgba(0,0,0,0.6)" }
              ]}
              onPress={() => setShowControls(!showControls)}
            >
              <Ionicons name={showControls ? "close" : "settings"} size={22} color="#fff" />
            </Pressable>

            {showControls && (
              <Animated.View style={[styles.fabControls, controlsAnimStyle]}>
                <Pressable
                  style={[styles.fabButton, !isMicOn && styles.fabButtonOff]}
                  onPress={onToggleMic}
                >
                  <Ionicons name={isMicOn ? "mic" : "mic-off"} size={20} color="#fff" />
                </Pressable>
                <Pressable
                  style={[styles.fabButton, !isCameraOn && styles.fabButtonOff]}
                  onPress={onToggleCamera}
                >
                  <Ionicons
                    name={isCameraOn ? "videocam" : "videocam-off"}
                    size={20}
                    color="#fff"
                  />
                </Pressable>
                <Pressable style={styles.fabButton} onPress={onFlipCamera}>
                  <Ionicons name="camera-reverse" size={20} color="#fff" />
                </Pressable>
                <Pressable style={[styles.fabButton, styles.fabButtonEnd]} onPress={onEndBroadcast}>
                  <Ionicons name="stop" size={20} color="#fff" />
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* Chat Overlay - Sol alt */}
          <View style={[styles.chatOverlay, { bottom: insets.bottom + 70 }]}>
            <LiveChat
              messages={messages}
              onSendMessage={onSendMessage}
              onDeleteMessage={onDeleteMessage}
              isHost={true}
              disabled={!isConnected}
              rateLimitSeconds={0}
              maxHeight={220}
              isOverlay
            />
          </View>

          {/* Bottom Bar - Input + Daralt butonu */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={0}
          >
            <View style={[styles.overlayBottomBar, { paddingBottom: insets.bottom + 8 }]}>
              <View style={styles.overlayInputWrapper}>
                <TextInput
                  style={styles.overlayInput}
                  placeholder="Mesaj yaz..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={inputText}
                  onChangeText={setInputText}
                  editable={isConnected}
                  maxLength={200}
                  returnKeyType="send"
                  onSubmitEditing={handleSendMessage}
                />
                {inputText.trim() ? (
                  <Pressable style={styles.inputSendButton} onPress={handleSendMessage}>
                    <Ionicons name="arrow-up" size={18} color="#fff" />
                  </Pressable>
                ) : null}
              </View>
              {/* Hediye butonu */}
              <Pressable style={styles.overlayGiftButton} onPress={handleOpenGifts}>
                <Ionicons name="gift" size={20} color="#fff" />
                {totalGiftValue > 0 && (
                  <View style={styles.giftBadge}>
                    <Text style={styles.giftBadgeText}>₺{totalGiftValue}</Text>
                  </View>
                )}
              </Pressable>
              {/* Daralt butonu - Input yanında */}
              <Pressable style={styles.overlayModeButton} onPress={() => setIsOverlayMode(false)}>
                <Ionicons name="contract-outline" size={20} color="#fff" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>

          {/* Bottom Sheets */}
          <ViewersSheet
            ref={viewersSheetRef}
            viewers={viewers}
            viewerCount={viewerCount}
            broadcastTitle={broadcastTitle}
            broadcastDuration={duration}
            broadcastType={broadcastType}
            videoTrackRef={localVideoTrack}
            onReportViewer={onReportViewer}
          />
          <GiftsSheet ref={giftsSheetRef} gifts={gifts} totalValue={totalGiftValue} />
        </>
      );
    }

    // Split Mode (Varsayılan) - Alt yarı chat alanı
    // NOT: Üst bilgi ve FAB kontrolleri broadcast/index.tsx'te render ediliyor
    return (
      <>
        {/* Split Chat Area - Alt yarı */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.splitChatContainer, { backgroundColor: colors.background }]}
          keyboardVerticalOffset={0}
        >
          {/* Chat Header */}
          <View style={[styles.chatHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.chatHeaderLeft}>
              <Ionicons name="chatbubbles" size={18} color={colors.accent} />
              <Text style={[styles.chatHeaderTitle, { color: colors.textPrimary }]}>Sohbet</Text>
            </View>
            <Text style={[styles.chatHeaderCount, { color: colors.textMuted }]}>
              {messages.length} mesaj
            </Text>
          </View>

          {/* Chat Messages */}
          <View style={styles.chatMessagesContainer}>
            <LiveChat
              messages={messages}
              onSendMessage={onSendMessage}
              onDeleteMessage={onDeleteMessage}
              isHost={true}
              disabled={!isConnected}
              rateLimitSeconds={0}
              maxHeight={999}
              hideInput
            />
          </View>

          {/* Input Area */}
          <View
            style={[
              styles.splitInputContainer,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 8 }
            ]}
          >
            <TextInput
              style={[
                styles.splitInput,
                { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }
              ]}
              placeholder="Mesaj yaz..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              editable={isConnected}
              maxLength={200}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            {/* Hediye butonu */}
            <Pressable
              style={[styles.splitGiftButton, { backgroundColor: colors.surfaceAlt }]}
              onPress={handleOpenGifts}
            >
              <Ionicons name="gift" size={18} color={colors.accent} />
              {totalGiftValue > 0 && (
                <Text style={[styles.splitGiftText, { color: colors.accent }]}>
                  ₺{totalGiftValue}
                </Text>
              )}
            </Pressable>
            {/* Genişlet butonu */}
            <Pressable
              style={[styles.splitExpandButton, { backgroundColor: colors.surfaceAlt }]}
              onPress={() => setIsOverlayMode(true)}
            >
              <Ionicons name="expand-outline" size={18} color={colors.textPrimary} />
            </Pressable>
            {/* Gönder butonu */}
            <Pressable
              style={[
                styles.splitSendButton,
                { backgroundColor: inputText.trim() ? colors.accent : colors.surfaceAlt }
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? "#fff" : colors.textMuted}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Bottom Sheets */}
        <ViewersSheet
          ref={viewersSheetRef}
          viewers={viewers}
          viewerCount={viewerCount}
          broadcastTitle={broadcastTitle}
          broadcastDuration={duration}
          broadcastType={broadcastType}
          videoTrackRef={localVideoTrack}
          onReportViewer={onReportViewer}
        />
        <GiftsSheet ref={giftsSheetRef} gifts={gifts} totalValue={totalGiftValue} />
      </>
    );
  }
);

BroadcastLiveOverlay.displayName = "BroadcastLiveOverlay";

const styles = StyleSheet.create({
  // Top Info - Overlay modda video üzerinde
  topInfo: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5
  },
  viewerText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  durationBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16
  },
  durationText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500"
  },
  modeToggle: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  },
  // FAB - Video alanında sağda
  fabContainerRight: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    zIndex: 20
  },

  // Overlay Mode Styles
  chatOverlay: {
    position: "absolute",
    left: 0,
    right: 80,
    maxHeight: 250
  },
  keyboardAvoid: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0
  },
  overlayBottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12
  },
  overlayInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  overlayInput: {
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
  overlayModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8
  },

  // Split Mode Styles
  splitChatContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden"
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: "600"
  },
  chatHeaderCount: {
    fontSize: 13
  },
  chatMessagesContainer: {
    flex: 1
  },
  splitInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8
  },
  splitInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24
  },
  splitSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  splitGiftButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    gap: 4
  },
  splitGiftText: {
    fontSize: 12,
    fontWeight: "600"
  },
  splitExpandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },

  // Overlay Gift Button
  overlayGiftButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8
  },
  giftBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20
  },
  giftBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center"
  },

  // FAB Styles
  fabContainer: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    zIndex: 20
  },
  fabMain: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  fabControls: {
    marginTop: 12,
    gap: 10
  },
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center"
  },
  fabButtonOff: {
    backgroundColor: "rgba(239,68,68,0.8)"
  },
  fabButtonEnd: {
    backgroundColor: "#EF4444"
  }
});

export default BroadcastLiveOverlay;
