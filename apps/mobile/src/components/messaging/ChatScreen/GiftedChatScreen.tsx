/**
 * GiftedChatScreen
 *
 * Amaç: DM sohbet ekranı (react-native-gifted-chat ile)
 * Tarih: 2025-11-26
 *
 * Gifted Chat kullanarak mesaj listesi, input alanı ve realtime desteği.
 */

import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import {
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import {
  GiftedChat,
  SystemMessage,
  type IMessage,
  type BubbleProps,
  type InputToolbarProps,
  type ComposerProps,
  type SendProps,
  type ActionsProps,
  type DayProps,
  type TimeProps,
  type SystemMessageProps
} from "react-native-gifted-chat";
import * as Haptics from "expo-haptics";
import dayjs from "dayjs";
import "dayjs/locale/tr";

// Dayjs Türkçe locale'i aktif et
dayjs.locale("tr");

import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { getChatTheme, type ChatTheme } from "@/theme/chatThemes";
import { useAuth } from "@/hooks/useAuth";
import {
  useConversationPresence,
  useTypingIndicator,
  useAddReaction,
  useRemoveReaction,
  useThemeChangeListener
} from "@/hooks/messaging";
import { useConversationStore } from "@/store/messaging";
import { ChatHeader } from "./components/ChatHeader";
import { ChatBubble } from "./components/ChatBubble";
import { ChatBackground } from "./components/ChatBackground";
import { ChatSkeleton } from "./components/ChatSkeleton";
import {
  ChatInputToolbar,
  ChatComposer,
  ChatSendButton,
  ChatActionsButton,
  ChatLoadEarlier,
  ChatScrollToBottom
} from "./components/ChatInputToolbar";
import { ChatDay, ChatTime } from "./components/ChatDateTime";
import { ImageViewer, VideoThumbnail, ThemeChangeBanner } from "./components";
import { AudioRecorder } from "./components/AudioRecorder";
import { AudioPlayer } from "./components/AudioPlayer";
import { MessageInfoSheet } from "./components/MessageInfoSheet";
import { ReactionDetailsSheet } from "./components/ReactionDetailsSheet";
import { useChatMessages } from "./hooks/useChatMessages";
import { MediaPicker, type SelectedMedia } from "@/components/messaging/components/MediaPicker";
import { uploadMedia, queueMediaProcessing } from "@/services/media-upload.service";

// =============================================
// COMPONENT
// =============================================

// Wrapper component to wait for auth
export function GiftedChatScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  // Get conversation from store for theme
  const conversation = useConversationStore((s) =>
    s.conversations.find((c) => c.id === conversationId)
  );
  const chatTheme = getChatTheme(conversation?.theme, isDark, {
    background: colors.background,
    surface: colors.surface,
    accent: colors.accent,
    textPrimary: colors.textPrimary,
    textMuted: colors.textMuted
  });

  return (
    <GiftedChatScreenContent
      user={user}
      conversationId={conversationId || ""}
      chatTheme={chatTheme}
      colors={colors}
    />
  );
}

// Main chat screen content
function GiftedChatScreenContent({
  user,
  conversationId,
  chatTheme,
  colors
}: {
  user: ReturnType<typeof useAuth>["user"];
  conversationId: string;
  chatTheme: ChatTheme;
  colors: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const userId = user?.id || "";

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS

  // Theme change listener
  const { themeChanges, dismissChange, dismissAllChanges } = useThemeChangeListener(
    conversationId,
    userId
  );

  // Typing indicator - karşı tarafın yazıp yazmadığı
  const typingUserIds = useTypingIndicator(conversationId || "");
  const isOtherTyping = typingUserIds.length > 0;

  // Typing broadcast - kendi yazdığımızı bildirmek için
  const { startTyping, stopTyping } = useConversationPresence(conversationId || "");

  // Messages hook
  const {
    messages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    onSend: handleSend,
    onLoadEarlier,
    // Draft support
    draft,
    setDraft,
    clearDraft
  } = useChatMessages({
    conversationId,
    userId,
    userDisplayName: user?.user_metadata?.display_name,
    userAvatarUrl: user?.user_metadata?.avatar_url,
    userUsername: user?.user_metadata?.username
  });

  // Reply state
  const [replyToMessage, setReplyToMessage] = useState<IMessage | null>(null);

  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false); // Audio upload için

  // Reaction hooks
  const { mutate: addReaction } = useAddReaction();
  const { mutate: removeReaction } = useRemoveReaction();

  // Image viewer state - mesaj bilgisiyle birlikte
  const [viewerMessage, setViewerMessage] = useState<IMessage | null>(null);

  // Audio recording state
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  // Message info sheet state
  const [infoMessage, setInfoMessage] = useState<IMessage | null>(null);

  // Reaction details sheet state
  const [reactionDetailsMessageId, setReactionDetailsMessageId] = useState<string | null>(null);

  // Debug logs
  useEffect(() => {
    console.log("[GiftedChatScreen] Theme changes:", themeChanges.length, themeChanges);
  }, [themeChanges]);

  useEffect(() => {
    console.log("[GiftedChatScreen] Current user ID:", userId);
  }, [userId]);

  // Tüm medya mesajlarını filtrele (image/video)
  const allMediaMessages = useMemo(() => {
    return messages.filter((m) => m.image || m.video);
  }, [messages]);

  // Handle camera press - open media picker with camera
  const handleCameraPress = useCallback(() => {
    setShowMediaPicker(true);
  }, []);

  // Handle mic press - show audio recorder
  const handleMicPress = useCallback(() => {
    setShowAudioRecorder(true);
  }, []);

  // Handle audio recording complete
  const handleAudioComplete = useCallback(
    async (uri: string, duration: number) => {
      setShowAudioRecorder(false);
      console.log("[Audio] Recording complete:", uri, duration);

      if (!user?.id) {
        Alert.alert("Hata", "Kullanıcı oturumu bulunamadı");
        return;
      }

      // Get session for upload
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert("Hata", "Oturum bulunamadı");
        return;
      }

      // Upload audio file
      try {
        setIsUploadingMedia(true);
        console.log("[Audio] Uploading:", uri);
        const result = await uploadMedia(uri, user.id, "message-media", session.access_token);
        console.log("[Audio] Upload success:", result.url);

        // Send audio message
        handleSend([], undefined, {
          content_type: "audio",
          media_url: result.url,
          media_metadata: { duration }
        });
      } catch (error) {
        console.error("[Audio] Upload failed:", error);
        Alert.alert("Hata", "Ses dosyası yüklenemedi");
      } finally {
        setIsUploadingMedia(false);
      }
    },
    [user?.id, handleSend]
  );

  // Send message wrapper
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      // Pass reply_to_id if replying to a message
      const replyToId = replyToMessage ? String(replyToMessage._id) : undefined;
      console.log("[Send] Sending with replyToId:", replyToId);
      handleSend(newMessages, replyToId);
      setReplyToMessage(null); // Clear reply after sending
      clearDraft(); // Clear draft after sending
      stopTyping();
    },
    [handleSend, stopTyping, replyToMessage, clearDraft]
  );

  // Message actions handlers
  const handleReply = useCallback((message: IMessage) => {
    console.log("[Reply] Setting reply to:", message._id, message.text?.substring(0, 30));
    setReplyToMessage(message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Focus input and show reply preview
  }, []);

  const handleEdit = useCallback((message: IMessage) => {
    // TODO: Implement edit
    console.log("Edit message:", message._id);
  }, []);

  const handleDelete = useCallback((message: IMessage) => {
    // TODO: Implement delete via edge function
    console.log("Delete message:", message._id);
  }, []);

  // Reaction handlers
  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      if (!conversationId) return;
      addReaction({ messageId, emoji, conversationId });
    },
    [conversationId, addReaction]
  );

  const handleRemoveReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!conversationId) return;
      removeReaction({ messageId, emoji, conversationId });
    },
    [conversationId, removeReaction]
  );

  // Show reaction details sheet
  const handleShowReactionDetails = useCallback((messageId: string) => {
    setReactionDetailsMessageId(messageId);
  }, []);

  // Media seçildiğinde - upload et ve gönder
  const handleMediaSelect = useCallback(
    async (media: SelectedMedia) => {
      if (!user?.id || !conversationId) return;

      const mediaType = media.type === "image" ? "image" : "video";

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("[Media] Starting upload:", mediaType);

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("No access token");
        }

        // Upload (artık hızlı - ~2 saniye)
        const uploadStart = Date.now();
        const result = await uploadMedia(media.uri, user.id, "message-media", session.access_token);
        console.log("[Media] Upload complete:", {
          size: `${(result.size / 1024).toFixed(1)}KB`,
          duration: `${Date.now() - uploadStart}ms`
        });

        // Mesajı gönder
        const mediaMessage: IMessage = {
          _id: `media_${Date.now()}`,
          text: "",
          createdAt: new Date(),
          user: {
            _id: user.id,
            name: user.user_metadata?.display_name || "Ben",
            avatar: user.user_metadata?.avatar_url
          },
          image: mediaType === "image" ? result.url : undefined,
          video: mediaType === "video" ? result.url : undefined
        };

        handleSend([mediaMessage]);

        // Queue for background optimization (non-blocking)
        queueMediaProcessing(user.id, result.path, session.access_token, undefined, {
          preset: "chat"
        }).catch((err) => console.warn("[Media] Queue failed:", err));
      } catch (error) {
        console.error("[Media] Upload error:", error);
        Alert.alert("Hata", "Medya yüklenirken bir hata oluştu");
      }
    },
    [user?.id, conversationId, handleSend]
  );

  // =============================================
  // RENDER FUNCTIONS (memoized)
  // =============================================

  const renderBubble = useCallback(
    (props: BubbleProps<IMessage>) => (
      <ChatBubble
        props={props}
        colors={colors}
        chatTheme={chatTheme}
        currentUserId={user?.id}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImagePress={setViewerMessage}
        onVideoPress={setViewerMessage}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
        onShowInfo={setInfoMessage}
        onShowReactionDetails={handleShowReactionDetails}
      />
    ),
    [
      colors,
      chatTheme,
      user?.id,
      handleReply,
      handleEdit,
      handleDelete,
      handleReact,
      handleRemoveReaction,
      handleShowReactionDetails
    ]
  );

  const renderInputToolbar = useCallback(
    (props: InputToolbarProps<IMessage>) => (
      <ChatInputToolbar props={props} colors={colors} chatTheme={chatTheme} />
    ),
    [colors, chatTheme]
  );

  // Ref to track current text for draft saving on unmount
  const textRef = useRef("");

  // Typing handler for composer
  const handleTyping = useCallback(
    (text: string) => {
      // Store text in ref for draft saving on unmount
      textRef.current = text;
      // Typing indicator
      if (text.length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

  // Save draft on unmount (when leaving chat)
  useEffect(() => {
    return () => {
      // Save draft when component unmounts
      if (textRef.current.trim()) {
        setDraft(textRef.current);
      }
    };
  }, [setDraft]);

  const renderComposer = useCallback(
    (props: ComposerProps) => (
      <ChatComposer props={props} colors={colors} onTextChanged={handleTyping} />
    ),
    [colors, handleTyping]
  );

  const renderSend = useCallback(
    (props: SendProps<IMessage>) => (
      <ChatSendButton
        props={props}
        colors={colors}
        onCameraPress={handleCameraPress}
        onMicPress={handleMicPress}
      />
    ),
    [colors, handleCameraPress, handleMicPress]
  );

  const renderActions = useCallback(
    (props: ActionsProps) => (
      <ChatActionsButton props={props} colors={colors} onPress={() => setShowMediaPicker(true)} />
    ),
    [colors]
  );

  const renderDay = useCallback(
    (props: DayProps<IMessage>) => <ChatDay props={props} colors={colors} />,
    [colors]
  );

  const renderTime = useCallback(
    (props: TimeProps<IMessage>) => <ChatTime props={props} colors={colors} />,
    [colors]
  );

  const renderLoadEarlier = useCallback(() => <ChatLoadEarlier colors={colors} />, [colors]);

  const renderScrollToBottom = useCallback(() => <ChatScrollToBottom colors={colors} />, [colors]);

  // Audio message renderer
  const renderMessageAudio = useCallback(
    (props: any) => {
      const { currentMessage } = props;
      if (!currentMessage?.audio) return null;

      const isOwnMessage = currentMessage.user._id === user?.id;
      return (
        <View style={{ padding: 8, minWidth: 200 }}>
          <AudioPlayer
            uri={currentMessage.audio}
            duration={currentMessage.audioDuration}
            colors={colors}
            isOwnMessage={isOwnMessage}
          />
        </View>
      );
    },
    [colors, user?.id]
  );

  // Video message renderer - VideoThumbnail ile gerçek thumbnail
  const renderMessageVideo = useCallback((props: { currentMessage?: IMessage }) => {
    const { currentMessage } = props;

    console.log("[GiftedChat] renderMessageVideo called:", {
      messageId: currentMessage?._id,
      hasVideo: !!currentMessage?.video,
      video: currentMessage?.video
    });

    if (!currentMessage?.video) return null;

    const handleVideoPress = () => {
      console.log("[GiftedChat] Video pressed:", {
        messageId: currentMessage._id,
        video: currentMessage.video,
        hasImage: !!currentMessage.image
      });
      setViewerMessage(currentMessage);
    };

    const duration = (currentMessage as IMessage & { videoDuration?: number }).videoDuration;

    return (
      <VideoThumbnail
        uri={currentMessage.video}
        width={200}
        height={150}
        duration={duration}
        onPress={handleVideoPress}
      />
    );
  }, []);

  // System message (örn: "Sohbet başladı", "X sohbete katıldı")
  const renderSystemMessage = useCallback(
    (props: SystemMessageProps<IMessage>) => (
      <SystemMessage
        {...props}
        containerStyle={{
          marginVertical: 8
        }}
        textStyle={{
          color: colors.textMuted,
          fontSize: 12,
          textAlign: "center"
        }}
      />
    ),
    [colors]
  );

  // Reply preview (input toolbar üstünde) - Thumbnail desteği ile
  const renderAccessory = useCallback(() => {
    if (!replyToMessage) return null;

    // Medya tipini belirle
    const hasImage = !!replyToMessage.image;
    const hasVideo = !!replyToMessage.video;
    const hasAudio = !!(replyToMessage as IMessage & { audio?: string }).audio;

    // Preview text'i belirle
    const getPreviewText = () => {
      if (replyToMessage.text) return replyToMessage.text;
      if (hasImage) return "📷 Fotoğraf";
      if (hasVideo) return "🎬 Video";
      if (hasAudio) return "🎤 Sesli mesaj";
      return "Mesaj";
    };

    return (
      <View
        style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          marginHorizontal: 8,
          marginTop: 8,
          borderRadius: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        {/* Thumbnail (görsel/video varsa) */}
        {(hasImage || hasVideo) && (
          <TouchableOpacity
            onPress={() => {
              // Thumbnail'e tıklayınca medyayı aç
              if (hasImage || hasVideo) {
                setViewerMessage(replyToMessage);
              }
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              marginRight: 10,
              overflow: "hidden",
              backgroundColor: colors.surfaceAlt
            }}
          >
            <Image
              source={{
                uri: hasImage
                  ? replyToMessage.image
                  : (replyToMessage as any).videoThumbnail || replyToMessage.video
              }}
              style={{ width: 40, height: 40 }}
              resizeMode="cover"
            />
            {/* Video overlay icon */}
            {hasVideo && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.3)"
                }}
              >
                <Ionicons name="play" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Audio icon */}
        {hasAudio && !hasImage && !hasVideo && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 6,
              marginRight: 10,
              backgroundColor: colors.surfaceAlt,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Ionicons name="mic" size={20} color={colors.accent} />
          </View>
        )}

        {/* Text content */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>
            Yanıtlanıyor
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
            {getPreviewText()}
          </Text>
        </View>

        {/* Close button */}
        <TouchableOpacity
          onPress={() => {
            setReplyToMessage(null);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }, [replyToMessage, colors]);

  // Custom footer for typing indicator + theme banner
  const renderFooter = useCallback(() => {
    const hasThemeChanges = themeChanges.length > 0;
    if (!isOtherTyping && !hasThemeChanges) return null;

    return (
      <View>
        {/* Theme Change Banner */}
        <ThemeChangeBanner
          conversationId={conversationId || ""}
          changes={themeChanges.map((c) => ({
            id: c.id,
            themeId: c.themeId,
            changedBy: c.changedByName,
            isOwnChange: c.isOwnChange,
            timestamp: c.timestamp
          }))}
          onDismiss={dismissChange}
          onDismissAll={dismissAllChanges}
        />

        {/* Typing indicator */}
        {isOtherTyping && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center"
              }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 13, marginRight: 4 }}>Yazıyor</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>...</Text>
            </View>
          </View>
        )}
      </View>
    );
  }, [isOtherTyping, colors, themeChanges, conversationId, dismissChange, dismissAllChanges]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: chatTheme.colors.background, paddingTop: insets.top }
      ]}
    >
      {/* Animated background */}
      <ChatBackground theme={chatTheme} />

      {/* Header */}
      <ChatHeader conversationId={conversationId || ""} />

      {/* Keyboard avoiding wrapper */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Loading skeleton - mesajlar yüklenirken */}
        {isLoading && messages.length === 0 && (
          <View style={styles.skeletonContainer}>
            <ChatSkeleton count={7} />
          </View>
        )}
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: userId,
            name: user?.user_metadata?.display_name || "Ben",
            avatar: user?.user_metadata?.avatar_url
          }}
          // Scroll ve performance ayarları - GiftedChat v3.x listProps kullanıyor
          listProps={{
            onEndReached: onLoadEarlier,
            onEndReachedThreshold: 0.3,
            // Prevent layout animation flash
            removeClippedSubviews: false,
            // Performance optimizations
            initialNumToRender: 20,
            maxToRenderPerBatch: 10,
            windowSize: 11,
            // Disable content inset adjustments - layout jump fix
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: "never",
            automaticallyAdjustsScrollIndicatorInsets: false,
            // Maintain scroll position
            maintainVisibleContentPosition: {
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            },
            // Stable key extractor to prevent re-renders
            keyExtractor: (item: IMessage) => String(item._id)
          }}
          // Customization
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          renderActions={renderActions}
          renderDay={renderDay}
          renderTime={renderTime}
          renderSystemMessage={renderSystemMessage}
          renderMessageAudio={renderMessageAudio}
          renderMessageVideo={renderMessageVideo}
          renderFooter={renderFooter}
          renderAccessory={renderAccessory}
          renderAvatar={null}
          // Styling
          timeFormat="HH:mm"
          dateFormat="D MMMM"
          // Behavior
          scrollToBottomComponent={renderScrollToBottom}
          // Input toolbar height
          minInputToolbarHeight={56}
          // Messages container - sabit boyut ile layout flash önleme
          messagesContainerStyle={{
            backgroundColor: "transparent"
          }}
          // Locale - Türkçe
          locale="tr"
          placeholder="Mesaj yaz..."
          // Text input style
          textInputProps={{
            placeholderTextColor: colors.textMuted,
            // Draft support - set initial value
            defaultValue: draft
          }}
          // Load earlier
          loadEarlier={hasNextPage}
          onLoadEarlier={onLoadEarlier}
          isLoadingEarlier={isFetchingNextPage}
          renderLoadEarlier={renderLoadEarlier}
          // Quick replies handler
          onQuickReply={(replies) => {
            // Quick reply seçildiğinde
            const reply = replies[0];
            if (reply) {
              handleSend([
                {
                  _id: Date.now(),
                  text: reply.title,
                  createdAt: new Date(),
                  user: {
                    _id: user?.id || "",
                    name: user?.user_metadata?.display_name || "Ben"
                  }
                }
              ]);
            }
          }}
          // Parse patterns - URL, telefon, email tanıma
          parsePatterns={(linkStyle) => [
            {
              type: "url",
              style: { color: colors.accent, textDecorationLine: "underline" }
            },
            {
              type: "phone",
              style: { color: colors.accent }
            },
            {
              type: "email",
              style: { color: colors.accent }
            }
          ]}
          // Accessibility
          accessible
        />
      </KeyboardAvoidingView>

      {/* Bottom safe area spacer */}
      <View
        style={{ height: insets.bottom, backgroundColor: chatTheme.colors.safeAreaBackground }}
      />

      {/* Media Picker Modal */}
      <MediaPicker
        visible={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
      />

      {/* WhatsApp Style Image Viewer */}
      <ImageViewer
        visible={!!viewerMessage}
        currentMessage={viewerMessage}
        allMediaMessages={allMediaMessages}
        onClose={() => setViewerMessage(null)}
        onMediaChange={setViewerMessage}
      />

      {/* Audio Recorder Modal */}
      {showAudioRecorder && (
        <View style={styles.audioRecorderOverlay}>
          <AudioRecorder
            colors={colors}
            onRecordingComplete={handleAudioComplete}
            onCancel={() => setShowAudioRecorder(false)}
          />
        </View>
      )}

      {/* Message Info Bottom Sheet */}
      <MessageInfoSheet
        visible={!!infoMessage}
        message={infoMessage}
        colors={colors}
        onClose={() => setInfoMessage(null)}
      />

      {/* Reaction Details Bottom Sheet */}
      <ReactionDetailsSheet
        visible={!!reactionDetailsMessageId}
        messageId={reactionDetailsMessageId}
        colors={colors}
        currentUserId={user?.id}
        onClose={() => setReactionDetailsMessageId(null)}
        onRemoveReaction={(emoji) => {
          if (reactionDetailsMessageId && conversationId) {
            removeReaction({ messageId: reactionDetailsMessageId, emoji, conversationId });
          }
        }}
      />
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  chatContainer: {
    flex: 1
  },
  skeletonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    paddingHorizontal: 12,
    justifyContent: "flex-end",
    gap: 8,
    zIndex: 1
  },
  skeletonBubble: {
    height: 44,
    borderRadius: 18
  },
  audioRecorderOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 100
  }
});

export default GiftedChatScreen;
