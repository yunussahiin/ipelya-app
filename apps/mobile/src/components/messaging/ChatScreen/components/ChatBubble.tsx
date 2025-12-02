/**
 * ChatBubble
 *
 * Custom bubble component for Gifted Chat
 * WhatsApp style with reply preview inside bubble
 */

import { memo } from "react";
import { View, StyleSheet, Platform, Text, TouchableOpacity } from "react-native";
import { Bubble, type BubbleProps, type IMessage } from "react-native-gifted-chat";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import type { ThemeColors } from "@/theme/ThemeProvider";
import type { ChatTheme } from "@/theme/chatThemes";
import type { IMessageWithReply } from "@/utils/giftedChatHelpers";
import { ReactionBar } from "./ReactionBar";
import { VideoThumbnail } from "./VideoThumbnail";

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
  onRemoveReaction
}: ChatBubbleProps) {
  const message = props.currentMessage;
  const isOwnMessage = message?.user._id === currentUserId;
  const replyTo = (message as IMessageWithReply)?.replyTo;

  const handleCopy = async () => {
    if (message?.text) {
      await Clipboard.setStringAsync(message.text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleReply = () => {
    if (message && onReply) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onReply(message);
    }
  };

  const handleEdit = () => {
    if (message && onEdit) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onEdit(message);
    }
  };

  const handleDelete = () => {
    if (message && onDelete) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDelete(message);
    }
  };

  // Build menu actions
  const actions: MenuAction[] = [
    {
      id: "reply",
      title: "Yanıtla",
      image: Platform.select({ ios: "arrowshape.turn.up.left", android: "ic_menu_revert" })
    },
    {
      id: "copy",
      title: "Kopyala",
      image: Platform.select({ ios: "doc.on.doc", android: "ic_menu_agenda" })
    }
  ];

  if (isOwnMessage) {
    actions.push({
      id: "edit",
      title: "Düzenle",
      image: Platform.select({ ios: "pencil", android: "ic_menu_edit" })
    });
    actions.push({
      id: "delete",
      title: "Sil",
      attributes: { destructive: true },
      image: Platform.select({ ios: "trash", android: "ic_menu_delete" })
    });
  }

  const handleMenuAction = ({ nativeEvent }: { nativeEvent: { event: string } }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (nativeEvent.event) {
      case "reply":
        handleReply();
        break;
      case "copy":
        handleCopy();
        break;
      case "edit":
        handleEdit();
        break;
      case "delete":
        handleDelete();
        break;
    }
  };

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

  const handleReact = (emoji: string) => {
    if (message && onReact) {
      onReact(String(message._id), emoji);
    }
  };

  const handleRemoveReaction = (emoji: string) => {
    if (message && onRemoveReaction) {
      onRemoveReaction(String(message._id), emoji);
    }
  };

  // Bubble with reactions
  const bubbleWithReactions = (
    <View>
      {bubbleContent}
      {(reactions.length > 0 || !hasImage) && (
        <ReactionBar
          reactions={reactions}
          colors={colors}
          isOwnMessage={isOwnMessage}
          onReact={handleReact}
          onRemoveReaction={handleRemoveReaction}
        />
      )}
    </View>
  );

  // Image/Video/Audio mesajları için MenuView kullanma - touch event'leri engelliyor
  if (hasImage || hasVideo || hasAudio) {
    return bubbleWithReactions;
  }

  // Text mesajları için MenuView ile context menu
  return (
    <MenuView actions={actions} onPressAction={handleMenuAction} shouldOpenOnLongPress={true}>
      {bubbleWithReactions}
    </MenuView>
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
