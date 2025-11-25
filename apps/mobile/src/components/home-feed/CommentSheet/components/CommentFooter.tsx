/**
 * CommentFooter Component
 *
 * Amaç: Yorum yazma input, emoji picker
 *
 * Özellikler:
 * - Popular emojis (always visible)
 * - Send button (only when text exists)
 * - User avatar
 * - Keyboard aware (internal state management)
 * - Mention detection (callback ile parent'a bildirir)
 */

import React, { useState, useCallback, useEffect, useRef, useImperativeHandle } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import {
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetTextInput
} from "@gorhom/bottom-sheet";
import { Send, X } from "lucide-react-native";
import { ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";

export interface MentionUser {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

export interface CommentFooterRef {
  insertMention: (username: string) => void;
  setReplyTo: (username: string | null) => void;
}

interface CommentFooterProps extends BottomSheetFooterProps {
  onSubmitComment: (text: string, parentCommentId?: string) => void;
  onMentionQuery: (query: string | null) => void;
  loading: boolean;
  userAvatar?: string;
  postOwnerUsername?: string;
  replyTo?: { username: string; commentId: string } | null;
  onCancelReply?: () => void;
}

// Popular emojis - Instagram style
const POPULAR_EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

export const CommentFooter = React.forwardRef<CommentFooterRef, CommentFooterProps>(
  function CommentFooter(
    {
      onSubmitComment,
      onMentionQuery,
      loading,
      userAvatar,
      postOwnerUsername,
      replyTo,
      onCancelReply,
      ...props
    },
    ref
  ) {
    const { colors } = useTheme();

    // Internal state - klavye kapanma sorununu çözer
    const [comment, setComment] = useState("");
    const [replyUsername, setReplyUsername] = useState<string | null>(null);
    const inputRef = useRef<React.ElementRef<typeof BottomSheetTextInput>>(null);

    // Reply mode değiştiğinde input'u güncelle
    useEffect(() => {
      if (replyTo) {
        setReplyUsername(replyTo.username);
        setComment(`@${replyTo.username} `);
        inputRef.current?.focus();
      }
    }, [replyTo]);

    // Mention detection - parent'a bildir
    useEffect(() => {
      const lastWord = comment.split(" ").pop() || "";

      if (lastWord.startsWith("@") && lastWord.length > 1) {
        const query = lastWord.substring(1);
        onMentionQuery(query);
      } else {
        onMentionQuery(null);
      }
    }, [comment, onMentionQuery]);

    // Ref ile insertMention ve setReplyTo'yu parent'a expose et
    useImperativeHandle(
      ref,
      () => ({
        insertMention: (username: string) => {
          console.log("🟢 insertMention called in CommentFooter:", username);
          setComment((prev) => {
            console.log("🟢 Previous comment:", prev);
            const words = prev.split(" ");
            words[words.length - 1] = `@${username} `;
            const newComment = words.join(" ");
            console.log("🟢 New comment:", newComment);
            return newComment;
          });
        },
        setReplyTo: (username: string | null) => {
          if (username) {
            setReplyUsername(username);
            setComment(`@${username} `);
            inputRef.current?.focus();
          } else {
            setReplyUsername(null);
            setComment("");
          }
        }
      }),
      []
    );

    // Cancel reply
    const handleCancelReply = () => {
      setReplyUsername(null);
      setComment("");
      onCancelReply?.();
    };

    // Emoji press
    const handleEmojiPress = useCallback((emoji: string) => {
      setComment((prev) => prev + emoji);
    }, []);

    // Submit
    const handleSubmit = useCallback(() => {
      if (comment.trim()) {
        onSubmitComment(comment.trim());
        setComment("");
      }
    }, [comment, onSubmitComment]);

    return (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View style={[styles.footerContainer, { backgroundColor: colors.background }]}>
          {/* Popular Emojis - Always Visible */}
          <View
            style={[
              styles.emojiBar,
              { backgroundColor: colors.background, borderTopColor: colors.border }
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiList}
              keyboardShouldPersistTaps="handled"
            >
              {POPULAR_EMOJIS.map((emoji, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleEmojiPress(emoji)}
                  style={styles.emojiButton}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Reply Banner - Instagram style */}
          {replyUsername && (
            <View style={[styles.replyBanner, { backgroundColor: colors.surface }]}>
              <Text style={[styles.replyText, { color: colors.textMuted }]}>
                {replyUsername}'e yanıt veriyorsun
              </Text>
              <Pressable onPress={handleCancelReply} hitSlop={8}>
                <X size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          {/* Input Container */}
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.background, borderTopColor: colors.border }
            ]}
          >
            {/* User Avatar */}
            {userAvatar && <Image source={{ uri: userAvatar }} style={styles.avatar} />}

            {/* Input */}
            <BottomSheetTextInput
              ref={inputRef}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }
              ]}
              placeholder={
                postOwnerUsername
                  ? `${postOwnerUsername} için bir yorum ekle...`
                  : "Bir yorum ekle..."
              }
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />

            {/* Send Button - Only when text exists */}
            {comment.trim().length > 0 && (
              <Pressable onPress={handleSubmit} disabled={loading} style={styles.sendButton}>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Send size={20} color={colors.accent} fill={colors.accent} />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </BottomSheetFooter>
    );
  }
);

const styles = StyleSheet.create({
  footerContainer: {
    paddingBottom: 34 // Safe area için
  },
  mentionContainer: {
    maxHeight: 200,
    borderTopWidth: 0.5
  },
  mentionLoading: {
    padding: 16,
    alignItems: "center"
  },
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12
  },
  mentionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  mentionInfo: {
    flex: 1
  },
  mentionUsername: {
    fontSize: 14,
    fontWeight: "600"
  },
  mentionName: {
    fontSize: 12,
    marginTop: 2
  },
  mentionEmpty: {
    padding: 16,
    alignItems: "center"
  },
  mentionEmptyText: {
    fontSize: 14
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5
  },
  replyText: {
    fontSize: 13
  },
  emojiBar: {
    paddingVertical: 12,
    borderTopWidth: 0.5
  },
  emojiList: {
    paddingHorizontal: 16,
    gap: 8
  },
  emojiButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  emoji: {
    fontSize: 28
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  }
});
