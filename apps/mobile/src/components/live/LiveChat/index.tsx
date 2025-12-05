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
  /** Mesaj silindi mi */
  isDeleted?: boolean;
  /** Silen kişinin adı */
  deletedBy?: string;
}

interface LiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  /** Kullanıcıyı kov */
  onKickUser?: (userId: string) => void;
  /** Kullanıcıyı yasakla */
  onBanUser?: (userId: string) => void;
  isHost?: boolean;
  disabled?: boolean;
  rateLimitSeconds?: number;
  maxHeight?: number;
  bottomInset?: number;
  /** Overlay mod - video üzerinde transparan görünüm */
  isOverlay?: boolean;
  /** Input alanını gizle - harici input kullanılıyorsa */
  hideInput?: boolean;
}

export function LiveChat({
  messages,
  onSendMessage,
  onDeleteMessage,
  onKickUser,
  onBanUser,
  isHost = false,
  disabled = false,
  rateLimitSeconds = 3,
  maxHeight = 300,
  bottomInset = 0,
  isOverlay = false,
  hideInput = false
}: LiveChatProps) {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);

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

  // Moderasyon menüsünü kapat
  const closeModMenu = useCallback(() => {
    setSelectedMessage(null);
  }, []);

  // Mesaj sil
  const handleDeleteMessage = useCallback(() => {
    if (selectedMessage && onDeleteMessage) {
      onDeleteMessage(selectedMessage.id);
    }
    closeModMenu();
  }, [selectedMessage, onDeleteMessage, closeModMenu]);

  // Kullanıcıyı kov
  const handleKickUser = useCallback(() => {
    if (selectedMessage && onKickUser) {
      onKickUser(selectedMessage.userId);
    }
    closeModMenu();
  }, [selectedMessage, onKickUser, closeModMenu]);

  // Kullanıcıyı yasakla
  const handleBanUser = useCallback(() => {
    if (selectedMessage && onBanUser) {
      onBanUser(selectedMessage.userId);
    }
    closeModMenu();
  }, [selectedMessage, onBanUser, closeModMenu]);

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

    // Silinen mesaj
    if (item.isDeleted) {
      return (
        <View style={[styles.messageItem, styles.deletedMessage]}>
          <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.deletedText, { color: colors.textMuted }]}>
            Bu mesaj {item.deletedBy || "yayıncı"} tarafından silindi
          </Text>
        </View>
      );
    }

    const isSelected = selectedMessage?.id === item.id;

    return (
      <>
        <Pressable
          style={[styles.messageItem, isSelected && { backgroundColor: `${colors.accent}10` }]}
          onPress={() => {
            // Host ise ve kendi mesajı değilse moderasyon menüsünü aç
            if (isHost && !item.isHost) {
              setSelectedMessage(isSelected ? null : item);
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

        {/* Moderasyon menüsü */}
        {isSelected && isHost && (
          <Animated.View
            entering={FadeIn.duration(150)}
            style={[styles.modMenu, { backgroundColor: colors.surface }]}
          >
            <Pressable style={styles.modButton} onPress={handleDeleteMessage}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
              <Text style={[styles.modButtonText, { color: "#EF4444" }]}>Mesajı Sil</Text>
            </Pressable>
            {onKickUser && (
              <Pressable style={styles.modButton} onPress={handleKickUser}>
                <Ionicons name="exit-outline" size={18} color="#F59E0B" />
                <Text style={[styles.modButtonText, { color: "#F59E0B" }]}>Kov</Text>
              </Pressable>
            )}
            {onBanUser && (
              <Pressable style={styles.modButton} onPress={handleBanUser}>
                <Ionicons name="ban-outline" size={18} color="#EF4444" />
                <Text style={[styles.modButtonText, { color: "#EF4444" }]}>Yasakla</Text>
              </Pressable>
            )}
            <Pressable style={styles.modButton} onPress={closeModMenu}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
              <Text style={[styles.modButtonText, { color: colors.textMuted }]}>İptal</Text>
            </Pressable>
          </Animated.View>
        )}
      </>
    );
  };

  // Overlay modunda sadece mesajları göster (input yok)
  if (isOverlay) {
    return (
      <View style={[styles.overlayContainer, { maxHeight }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <View style={styles.overlayMessageItem}>
              {item.userAvatar ? (
                <Image source={{ uri: item.userAvatar }} style={styles.overlayAvatar} />
              ) : (
                <View style={[styles.overlayAvatarPlaceholder, { backgroundColor: colors.accent }]}>
                  <Text style={styles.overlayAvatarText}>
                    {item.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.overlayMessageContent}>
                <Text style={styles.overlayUserName}>
                  {item.userName}
                  {item.isHost && <Text style={styles.overlayHostBadge}> HOST</Text>}
                </Text>
                <Text style={styles.overlayMessageText}>{item.text}</Text>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.overlayMessagesContent}
        />
      </View>
    );
  }

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
      {!hideInput && (
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface, paddingBottom: 8 + bottomInset }
          ]}
        >
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
                  inputText.trim() && !disabled && !isRateLimited
                    ? colors.accent
                    : colors.surfaceAlt
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
      )}
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
  },
  // Overlay styles - Instagram Live tarzı
  overlayContainer: {
    flex: 1
  },
  overlayMessagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  overlayMessageItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: "95%"
  },
  overlayAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12
  },
  overlayAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  overlayAvatarText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600"
  },
  overlayMessageContent: {
    flex: 1
  },
  overlayUserName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  overlayHostBadge: {
    color: "#F59E0B",
    fontSize: 10,
    fontWeight: "700"
  },
  overlayMessageText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 17
  },
  // Silinen mesaj stili
  deletedMessage: {
    opacity: 0.6,
    paddingVertical: 6
  },
  deletedText: {
    fontSize: 12,
    fontStyle: "italic",
    marginLeft: 6
  },
  // Moderasyon menüsü
  modMenu: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 36,
    marginTop: -4,
    marginBottom: 4,
    borderRadius: 12,
    gap: 4
  },
  modButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  modButtonText: {
    fontSize: 12,
    fontWeight: "600"
  }
});

export default LiveChat;
