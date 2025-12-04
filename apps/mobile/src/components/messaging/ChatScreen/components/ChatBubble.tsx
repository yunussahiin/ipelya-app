/**
 * ChatBubble
 *
 * Custom bubble component for Gifted Chat
 * WhatsApp/Telegram style with:
 * - Swipe right: Reply
 * - Swipe left: Message info (own messages only)
 * - Long press: Action sheet with emoji bar
 */

import { memo, useState, useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Bubble, type BubbleProps, type IMessage } from "react-native-gifted-chat";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import type { ThemeColors } from "@/theme/ThemeProvider";
import type { ChatTheme } from "@/theme/chatThemes";
import type { IMessageWithReply } from "@/utils/giftedChatHelpers";
import { ReactionBar } from "./ReactionBar";
import { VideoThumbnail } from "./VideoThumbnail";
import { SwipeableBubble } from "./SwipeableBubble";
import { MessageActionSheet } from "./MessageActionSheet";

interface ChatBubbleProps {
  props: BubbleProps<IMessage>;
  colors: ThemeColors;
  chatTheme?: ChatTheme;
  currentUserId?: string;
  onReply?: (message: IMessage) => void;
  onEdit?: (message: IMessage) => void;
  onDelete?: (message: IMessage) => void;
  onImagePress?: (message: IMessage) => void;
  onVideoPress?: (message: IMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onForward?: (message: IMessage) => void;
  onShowInfo?: (message: IMessage) => void;
  onShowReactionDetails?: (messageId: string) => void;
}

function ChatBubbleComponent({
  props,
  colors,
  chatTheme,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onImagePress,
  onVideoPress,
  onReact,
  onRemoveReaction,
  onForward,
  onShowInfo,
  onShowReactionDetails
}: ChatBubbleProps) {
  const message = props.currentMessage;
  const isOwnMessage = message?.user._id === currentUserId;
  const replyTo = (message as IMessageWithReply)?.replyTo;

  // Sheet states
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Handlers
  const handleReply = useCallback(() => {
    if (message && onReply) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onReply(message);
    }
  }, [message, onReply]);

  const handleCopy = useCallback(async () => {
    if (message?.text) {
      await Clipboard.setStringAsync(message.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [message]);

  const handleInfo = useCallback(() => {
    if (message && onShowInfo) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onShowInfo(message);
    }
  }, [message, onShowInfo]);

  const handleDelete = useCallback(() => {
    if (message && onDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDelete(message);
    }
  }, [message, onDelete]);

  const handleForward = useCallback(() => {
    if (message && onForward) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onForward(message);
    }
  }, [message, onForward]);

  const handleReact = useCallback(
    (emoji: string) => {
      if (message && onReact) {
        onReact(String(message._id), emoji);
      }
    },
    [message, onReact]
  );

  // Custom view for reply preview
  const renderCustomView = () => {
    if (!replyTo) return null;

    return (
      <View
        style={[
          styles.replyContainer,
          { backgroundColor: isOwnMessage ? "rgba(255,255,255,0.2)" : colors.background }
        ]}
      >
        <View
          style={[styles.replyBar, { backgroundColor: isOwnMessage ? "#fff" : colors.accent }]}
        />
        <Text
          style={[
            styles.replyText,
            { color: isOwnMessage ? "rgba(255,255,255,0.9)" : colors.textMuted }
          ]}
          numberOfLines={2}
        >
          {replyTo.text || "Medya"}
        </Text>
      </View>
    );
  };

  // Custom image renderer - tıklanabilir, dinamik boyut
  const renderMessageImage = () => {
    if (!message?.image) return null;

    // WhatsApp tarzı: max 250px genişlik, aspect ratio korunur
    const maxWidth = 250;
    const maxHeight = 300;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          console.log("[ChatBubble] Image pressed:", message.image);
          if (onImagePress && message) {
            onImagePress(message);
          }
        }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          margin: 4
        }}
      >
        <Image
          source={{ uri: message.image }}
          style={{
            width: maxWidth,
            height: maxHeight,
            borderRadius: 12
          }}
          contentFit="cover"
          // Prevent flash on re-render
          cachePolicy="memory-disk"
          recyclingKey={message.image}
          transition={0}
        />
      </TouchableOpacity>
    );
  };

  // Custom video renderer - VideoThumbnail ile gerçek thumbnail
  const renderMessageVideo = () => {
    if (!message?.video) return null;

    const handleVideoPress = () => {
      console.log("[ChatBubble] Video pressed:", message.video);
      if (onVideoPress && message) {
        onVideoPress(message);
      }
    };

    return (
      <View style={{ margin: 4 }}>
        <VideoThumbnail uri={message.video} width={200} height={150} onPress={handleVideoPress} />
      </View>
    );
  };

  const hasImage = !!message?.image;
  const hasVideo = !!message?.video;
  const hasAudio = !!message?.audio;
  const hasMedia = hasImage || hasVideo;

  // Theme colors (fallback to default colors)
  const ownBubbleColor = chatTheme?.colors.ownBubble || colors.accent;
  const ownTextColor = chatTheme?.colors.ownBubbleText || "#fff";
  const otherBubbleColor = chatTheme?.colors.otherBubble || colors.surface;
  const otherTextColor = chatTheme?.colors.otherBubbleText || colors.textPrimary;

  const bubbleContent = (
    <Bubble
      {...props}
      renderCustomView={renderCustomView}
      renderMessageImage={renderMessageImage}
      renderMessageVideo={renderMessageVideo}
      wrapperStyle={{
        left: {
          backgroundColor: otherBubbleColor,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          marginRight: 60,
          marginVertical: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 1
        },
        right: {
          backgroundColor: hasImage ? "transparent" : ownBubbleColor,
          borderRadius: 18,
          borderBottomRightRadius: 4,
          marginLeft: 60,
          marginVertical: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: hasImage ? 0 : 0.15,
          shadowRadius: 2,
          elevation: hasImage ? 0 : 2
        }
      }}
      textStyle={{
        left: { color: otherTextColor, fontSize: 15, lineHeight: 20 },
        right: { color: ownTextColor, fontSize: 15, lineHeight: 20 }
      }}
      timeTextStyle={{
        left: { color: colors.textMuted, fontSize: 11 },
        right: { color: hasImage ? colors.textMuted : "rgba(255,255,255,0.7)", fontSize: 11 }
      }}
      tickStyle={{ color: hasImage ? colors.textMuted : "rgba(255,255,255,0.7)" }}
      renderTicks={(msg) => {
        if (msg.user._id !== currentUserId) return null;
        const tickColor = hasImage ? colors.textMuted : "rgba(255,255,255,0.7)";
        return (
          <View style={styles.tickContainer}>
            {msg.pending ? (
              <Ionicons name="time-outline" size={12} color={tickColor} />
            ) : msg.received ? (
              <Ionicons name="checkmark-done" size={14} color={tickColor} />
            ) : msg.sent ? (
              <Ionicons name="checkmark" size={14} color={tickColor} />
            ) : null}
          </View>
        );
      }}
      renderUsername={() => null}
    />
  );

  // Reactions
  const reactions = (message as IMessageWithReply)?.reactions || [];

  const handleShowReactionDetails = useCallback(() => {
    if (message && onShowReactionDetails) {
      onShowReactionDetails(String(message._id));
    }
  }, [message, onShowReactionDetails]);

  // Bubble with reactions
  const bubbleWithReactions = (
    <View>
      {bubbleContent}
      {reactions.length > 0 && (
        <ReactionBar
          reactions={reactions}
          colors={colors}
          isOwnMessage={isOwnMessage}
          onShowDetails={handleShowReactionDetails}
        />
      )}
    </View>
  );

  // Main render with SwipeableBubble wrapper
  return (
    <>
      <SwipeableBubble
        colors={colors}
        isOwnMessage={isOwnMessage}
        onSwipeReply={handleReply}
        onSwipeInfo={handleInfo}
        onLongPress={() => setShowActionSheet(true)}
      >
        {bubbleWithReactions}
      </SwipeableBubble>

      {/* Action Sheet (long press) */}
      <MessageActionSheet
        visible={showActionSheet}
        message={message || null}
        isOwnMessage={isOwnMessage}
        colors={colors}
        onClose={() => setShowActionSheet(false)}
        onReply={handleReply}
        onForward={onForward ? handleForward : undefined}
        onCopy={handleCopy}
        onInfo={handleInfo}
        onDelete={isOwnMessage ? handleDelete : undefined}
        onReact={handleReact}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tickContainer: {
    marginLeft: 4,
    marginBottom: 2
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
    marginTop: 4,
    marginBottom: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    minWidth: 120
  },
  replyBar: {
    width: 2,
    alignSelf: "stretch",
    minHeight: 16,
    borderRadius: 1,
    marginRight: 6
  },
  replyText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16
  }
});

export const ChatBubble = memo(ChatBubbleComponent);
