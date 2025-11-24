/**
 * Comment Sheet Component
 *
 * Amaç: Post yorumlarını gösteren bottom sheet
 *
 * Özellikler:
 * - Bottom sheet (alttan yukarı açılır)
 * - Yorum listesi
 * - Yorum yazma input
 * - Keyboard aware
 * - Pull to close
 */

import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFooterProps,
  BottomSheetTextInput
} from "@gorhom/bottom-sheet";
import { Send } from "lucide-react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfileStore } from "@/store/profile.store";

interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  content: string;
  created_at: string;
  likes_count: number;
}

interface CommentSheetProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
  currentUserAvatar?: string; // Post'tan gelen current user avatar
}

export function CommentSheet({ postId, visible, onClose, currentUserAvatar }: CommentSheetProps) {
  const { colors } = useTheme();
  const { profile } = useProfileStore();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Quick emojis - TODO: Get from user's recent/favorite emojis
  const quickEmojis = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

  // User avatar - önce prop'tan, sonra profile store'dan, son olarak placeholder
  const userAvatar =
    currentUserAvatar ||
    profile?.avatarUrl ||
    "https://api.dicebear.com/7.x/avataaars/png?seed=default";

  // Debug logging
  React.useEffect(() => {
    console.log("👤 Profile:", profile);
    console.log("🖼️ User Avatar:", userAvatar);
    if (!profile) {
      console.warn(
        "⚠️ Profile store is null! Profile data needs to be fetched and set after auth."
      );
    }
  }, [profile, userAvatar]);

  // Snap points
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  // Open/close sheet
  React.useEffect(() => {
    console.log("📝 CommentSheet visible changed:", visible);
    if (visible) {
      console.log("🔼 Presenting modal...");
      bottomSheetRef.current?.present();
      // TODO: Fetch comments
    } else {
      console.log("🔽 Dismissing modal...");
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setLoading(true);
    try {
      // TODO: Submit comment API call
      console.log("Submit comment:", comment);
      setComment("");
    } catch (error) {
      console.error("Comment error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Footer component - Input area
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={24}>
        <View>
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <View
              style={[
                styles.emojiPicker,
                { backgroundColor: colors.background, borderTopColor: colors.border }
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiList}
              >
                {quickEmojis.map((emoji, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      setComment((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    style={styles.emojiButton}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </ScrollView>
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
            {userAvatar && <Image source={{ uri: userAvatar }} style={styles.userAvatar} />}

            {/* Input */}
            <BottomSheetTextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary
                }
              ]}
              placeholder="Yorum yaz..."
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />

            {/* Send Button - Always visible */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading || !comment.trim()}
              style={[styles.sendButton, (!comment.trim() || loading) && styles.sendButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Send
                  size={20}
                  color={comment.trim() ? colors.accent : colors.textMuted}
                  fill={comment.trim() ? colors.accent : "transparent"}
                />
              )}
            </Pressable>
          </View>
        </View>
      </BottomSheetFooter>
    ),
    [comment, loading, handleSubmit, showEmojiPicker, quickEmojis, userAvatar, colors, profile]
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.user.avatar_url || "https://via.placeholder.com/40" }}
        style={styles.avatar}
      />
      <View style={styles.commentContent}>
        <Text style={[styles.username, { color: colors.textPrimary }]}>
          {item.user.display_name || item.user.username}
        </Text>
        <Text style={[styles.commentText, { color: colors.textPrimary }]}>{item.content}</Text>
        <Text style={[styles.timestamp, { color: colors.textMuted }]}>2s ago</Text>
      </View>
    </View>
  );

  console.log("🎭 CommentSheet render:", { visible, postId });

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onDismiss={handleClose}
      backgroundStyle={[styles.sheetBackground, { backgroundColor: colors.background }]}
      handleIndicatorStyle={[styles.indicator, { backgroundColor: colors.border }]}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
    >
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.container, { backgroundColor: colors.background, borderRadius: 12 }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Yorumlar</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Send
              size={24}
              color={colors.textPrimary}
              style={{ transform: [{ rotate: "45deg" }] }}
            />
          </Pressable>
        </View>

        {/* Comments List */}
        <BottomSheetFlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textPrimary }]}>Henüz yorum yok</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Konuşmayı başlat.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  indicator: {
    width: 36,
    height: 5
  },
  container: {
    flex: 1
  },
  listContainer: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center"
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  commentContent: {
    flex: 1
  },
  username: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6
  },
  timestamp: {
    fontSize: 12
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14
  },
  emojiPicker: {
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
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8
  },
  input: {
    flex: 1,
    borderRadius: 18,
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
  },
  sendButtonDisabled: {
    opacity: 0.5
  }
});
