/**
 * GiftedChatScreen
 *
 * Amaç: DM sohbet ekranı (react-native-gifted-chat ile)
 * Tarih: 2025-11-26
 *
 * Gifted Chat kullanarak mesaj listesi, input alanı ve realtime desteği.
 */

import { useCallback, useState, useMemo } from "react";
import {
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  View,
  Text,
  TouchableOpacity,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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

import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  useConversationPresence,
  useTypingIndicator,
  useAddReaction,
  useRemoveReaction
} from "@/hooks/messaging";
import { ChatHeader } from "./components/ChatHeader";
import { ChatLoading } from "./components/ChatLoading";
import { ChatBubble } from "./components/ChatBubble";
import {
  ChatInputToolbar,
  ChatComposer,
  ChatSendButton,
  ChatActionsButton,
  ChatLoadEarlier,
  ChatScrollToBottom
} from "./components/ChatInputToolbar";
import { ChatDay, ChatTime } from "./components/ChatDateTime";
import { ImageViewer } from "./components/ImageViewer";
import { AudioRecorder } from "./components/AudioRecorder";
import { AudioPlayer } from "./components/AudioPlayer";
import { useChatMessages } from "./hooks/useChatMessages";
import { MediaPicker, type SelectedMedia } from "@/components/messaging/components/MediaPicker";
import { uploadMedia } from "@/services/media-upload.service";

// =============================================
// COMPONENT
// =============================================

export function GiftedChatScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const insets = useSafeAreaInsets();

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
    onLoadEarlier
  } = useChatMessages({
    conversationId: conversationId || "",
    userId: user?.id,
    userDisplayName: user?.user_metadata?.display_name,
    userAvatarUrl: user?.user_metadata?.avatar_url,
    userUsername: user?.user_metadata?.username
  });

  // Reply state
  const [replyToMessage, setReplyToMessage] = useState<IMessage | null>(null);

  // Media picker state
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Reaction hooks
  const { mutate: addReaction } = useAddReaction();
  const { mutate: removeReaction } = useRemoveReaction();

  // Image viewer state - mesaj bilgisiyle birlikte
  const [viewerMessage, setViewerMessage] = useState<IMessage | null>(null);

  // Audio recording state
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

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
      stopTyping();
    },
    [handleSend, stopTyping, replyToMessage]
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
      console.log("[Reaction] Adding:", messageId, emoji);
      addReaction({ messageId, emoji, conversationId });
    },
    [conversationId, addReaction]
  );

  const handleRemoveReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (!conversationId) return;
      console.log("[Reaction] Removing:", messageId, emoji);
      removeReaction({ messageId, emoji, conversationId });
    },
    [conversationId, removeReaction]
  );

  // Media seçildiğinde upload ve gönder
  const handleMediaSelect = useCallback(
    async (media: SelectedMedia) => {
      if (!user?.id || !conversationId) return;

      setIsUploadingMedia(true);
      try {
        // Get access token
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("No access token");
        }

        // Upload media
        console.log("[Media] Uploading:", media.type, media.uri);
        const result = await uploadMedia(media.uri, user.id, "message-media", session.access_token);
        console.log("[Media] Upload success:", result.url);

        // Create message with media
        const mediaMessage: IMessage = {
          _id: `temp_media_${Date.now()}`,
          text: "",
          createdAt: new Date(),
          user: {
            _id: user.id,
            name: user.user_metadata?.display_name || "Ben",
            avatar: user.user_metadata?.avatar_url
          },
          image: media.type === "image" ? result.url : undefined,
          video: media.type === "video" ? result.url : undefined
        };

        // Send message
        handleSend([mediaMessage]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.error("[Media] Upload error:", error);
        Alert.alert("Hata", "Medya yüklenirken bir hata oluştu");
      } finally {
        setIsUploadingMedia(false);
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
        currentUserId={user?.id}
        onReply={handleReply}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onImagePress={setViewerMessage}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
      />
    ),
    [colors, user?.id, handleReply, handleEdit, handleDelete, handleReact, handleRemoveReaction]
  );

  const renderInputToolbar = useCallback(
    (props: InputToolbarProps<IMessage>) => <ChatInputToolbar props={props} colors={colors} />,
    [colors]
  );

  // Typing handler for composer
  const handleTyping = useCallback(
    (text: string) => {
      if (text.length > 0) {
        startTyping();
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

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

  // Reply preview (input toolbar üstünde)
  const renderAccessory = useCallback(() => {
    if (!replyToMessage) return null;

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
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>
            Yanıtlanıyor
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
            {replyToMessage.text}
          </Text>
        </View>
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

  // Custom footer for typing indicator (theme uyumlu)
  const renderFooter = useCallback(() => {
    if (!isOtherTyping) return null;

    return (
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
    );
  }, [isOtherTyping, colors]);

  // Loading state
  if (isLoading) {
    return <ChatLoading conversationId={conversationId || ""} colors={colors} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Safe area for header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <ChatHeader conversationId={conversationId || ""} />
      </SafeAreaView>

      {/* Keyboard avoiding wrapper */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user?.id || "",
            name: user?.user_metadata?.display_name || "Ben",
            avatar: user?.user_metadata?.avatar_url
          }}
          // Infinite scroll
          infiniteScroll
          wrapInSafeArea={false}
          listViewProps={{
            onEndReached: onLoadEarlier,
            onEndReachedThreshold: 0.3,
            // Prevent layout animation flash
            removeClippedSubviews: false,
            // Performance optimizations
            initialNumToRender: 15,
            maxToRenderPerBatch: 10,
            windowSize: 11,
            // Disable content inset adjustments
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: "never"
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
          renderFooter={renderFooter}
          renderAccessory={renderAccessory}
          renderAvatar={null}
          // Styling
          timeFormat="HH:mm"
          dateFormat="D MMMM"
          // Behavior
          isSendButtonAlwaysVisible
          scrollToBottom
          isScrollToBottomEnabled
          scrollToBottomComponent={renderScrollToBottom}
          // Input toolbar height
          minInputToolbarHeight={56}
          // Messages container - sabit boyut ile layout flash önleme
          messagesContainerStyle={{
            backgroundColor: colors.background
          }}
          // Locale - Türkçe
          locale="tr"
          placeholder="Mesaj yaz..."
          // Text input style (typing artık ChatComposer'da handle ediliyor)
          textInputProps={{
            placeholderTextColor: colors.textMuted
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
      <View style={{ height: insets.bottom, backgroundColor: colors.background }} />

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
  chatContainer: {
    flex: 1
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
