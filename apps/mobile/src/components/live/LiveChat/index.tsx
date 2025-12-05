/**
 * Live Chat
 * Canlı yayın sohbet component'i
 * Realtime mesajlar, rate limiting, gift notifications
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import Animated, { FadeIn } from "react-native-reanimated";

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  isHost?: boolean;
  isGift?: boolean;
  giftName?: string;
  giftAmount?: number;
  createdAt: string;
}

interface LiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isHost?: boolean;
  disabled?: boolean;
  rateLimitSeconds?: number;
  maxHeight?: number;
}

export function LiveChat({
  messages,
  onSendMessage,
  onDeleteMessage,
  isHost = false,
  disabled = false,
  rateLimitSeconds = 3,
  maxHeight = 300
}: LiveChatProps) {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Rate limit countdown
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
        if (cooldownSeconds === 1) {
          setIsRateLimited(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || disabled || isRateLimited) return;

    onSendMessage(inputText.trim());
    setInputText("");
    Keyboard.dismiss();

    // Apply rate limit (host exempt)
    if (!isHost && rateLimitSeconds > 0) {
      setIsRateLimited(true);
      setCooldownSeconds(rateLimitSeconds);
    }
  }, [inputText, disabled, isRateLimited, isHost, rateLimitSeconds, onSendMessage]);

  // Render message item
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    // Gift message
    if (item.isGift) {
      return (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.giftMessage, { backgroundColor: `${colors.accent}20` }]}
        >
          <Ionicons name="gift" size={16} color={colors.accent} />
          <Text style={[styles.giftText, { color: colors.textPrimary }]}>
            <Text style={{ fontWeight: "700" }}>{item.userName}</Text> {item.giftAmount}x{" "}
            {item.giftName} gönderdi!
          </Text>
        </Animated.View>
      );
    }

    return (
      <Pressable
        style={styles.messageItem}
        onLongPress={() => {
          if (isHost && onDeleteMessage) {
            onDeleteMessage(item.id);
          }
        }}
      >
        {/* Avatar */}
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{item.userName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        {/* Message content */}
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.userName}</Text>
            {item.isHost && (
              <View style={[styles.hostBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.hostBadgeText}>HOST</Text>
              </View>
            )}
          </View>
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>{item.text}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { maxHeight }]}
    >
      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Henüz mesaj yok</Text>
          </View>
        }
      />

      {/* Input area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder={
            isRateLimited
              ? `${cooldownSeconds}s bekleyin...`
              : disabled
                ? "Chat kapalı"
                : "Mesaj yaz..."
          }
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          editable={!disabled && !isRateLimited}
          maxLength={200}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[
            styles.sendButton,
            {
              backgroundColor:
                inputText.trim() && !disabled && !isRateLimited ? colors.accent : colors.surfaceAlt
            }
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || disabled || isRateLimited}
        >
          <Ionicons
            name="send"
            size={18}
            color={inputText.trim() && !disabled && !isRateLimited ? "#fff" : colors.textMuted}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  messagesList: {
    flex: 1
  },
  messagesContent: {
    padding: 12,
    gap: 8
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 14
  },
  messageItem: {
    flexDirection: "row",
    gap: 8
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  messageContent: {
    flex: 1
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2
  },
  userName: {
    fontSize: 13,
    fontWeight: "600"
  },
  hostBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3
  },
  hostBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700"
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18
  },
  giftMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginVertical: 4
  },
  giftText: {
    fontSize: 13
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)"
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)"
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default LiveChat;
