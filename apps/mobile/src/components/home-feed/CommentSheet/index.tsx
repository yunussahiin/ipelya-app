/**
 * Comment Sheet Component
 *
 * Amaç: Post yorumlarını gösteren bottom sheet
 *
 * Özellikler:
 * - Bottom sheet (alttan yukarı açılır)
 * - Yorum listesi (CommentItem)
 * - Yorum yazma input (CommentFooter)
 * - Keyboard aware
 * - Pull to close
 */

import React, { useState, useRef, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooterProps
} from "@gorhom/bottom-sheet";
import { Send } from "lucide-react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { useProfileStore } from "@/store/profile.store";
import { useAuthStore } from "@/store/auth.store";
import { getPostDetails, commentPost, searchMentions, likeComment } from "@ipelya/api/home-feed";
import { CommentItem, Comment } from "./CommentItem";
import { CommentFooter, CommentFooterRef, MentionUser } from "./CommentFooter";

interface CommentSheetProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
  postOwnerUsername?: string; // Post sahibinin username'i
}

export function CommentSheet({ postId, visible, onClose, postOwnerUsername }: CommentSheetProps) {
  const { colors } = useTheme();
  const { profile } = useProfileStore();
  const { sessionToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const footerRef = useRef<CommentFooterRef>(null);

  // Mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // User avatar - mevcut kullanıcının avatarı (yorum yazan kişi)
  const userAvatar =
    profile?.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.id || "default"}`;

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

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!postId || !accessToken) return;

    try {
      console.log("💬 Fetching comments for post:", postId);
      const response = await getPostDetails(supabaseUrl, accessToken, postId);

      if (response.success && response.data) {
        // response.data Post tipinde, comments ayrı bir property olabilir
        const postData = response.data as { comments?: Comment[] };
        const fetchedComments = postData.comments || [];
        setComments(fetchedComments);
        console.log("✅ Comments fetched:", fetchedComments.length);
      } else {
        console.error("❌ Failed to fetch comments:", response.error);
      }
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
    }
  }, [postId, supabaseUrl, accessToken]);

  // Open/close sheet
  React.useEffect(() => {
    console.log("📝 CommentSheet visible changed:", visible);
    if (visible) {
      console.log("🔼 Presenting modal...");
      bottomSheetRef.current?.present();
      fetchComments();
    } else {
      console.log("🔽 Dismissing modal...");
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, fetchComments]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    onClose();
  }, [onClose]);

  // Submit comment - CommentFooter'dan çağrılır
  const handleSubmitComment = useCallback(
    async (commentText: string) => {
      if (!commentText.trim() || loading || !accessToken) return;

      setLoading(true);
      try {
        console.log("💬 Creating comment:", commentText);
        const response = await commentPost(supabaseUrl, accessToken, {
          post_id: postId,
          content: commentText.trim()
        });

        if (response.success) {
          console.log("✅ Comment created successfully");
          // Refresh comments
          await fetchComments();
        } else {
          console.error("❌ Failed to create comment:", response.error);
        }
      } catch (error) {
        console.error("❌ Error creating comment:", error);
      } finally {
        setLoading(false);
      }
    },
    [loading, accessToken, supabaseUrl, postId, fetchComments]
  );

  // Mention query handler - debounced search
  const handleMentionQuery = useCallback(
    async (query: string | null) => {
      setMentionQuery(query);

      if (!query) {
        setMentionUsers([]);
        setMentionLoading(false);
        return;
      }

      setMentionLoading(true);
      try {
        const response = await searchMentions(supabaseUrl, accessToken, query, 6);
        if (response.success && response.data?.users) {
          setMentionUsers(response.data.users);
        } else {
          setMentionUsers([]);
        }
      } catch (error) {
        console.error("Mention search error:", error);
        setMentionUsers([]);
      } finally {
        setMentionLoading(false);
      }
    },
    [supabaseUrl, accessToken]
  );

  // Mention seçildiğinde
  const handleSelectMention = useCallback((username: string) => {
    console.log("🔵 handleSelectMention called:", username);
    console.log("🔵 footerRef.current:", footerRef.current);
    if (footerRef.current) {
      footerRef.current.insertMention(username);
      console.log("✅ insertMention called");
    } else {
      console.error("❌ footerRef.current is null!");
    }
    setMentionQuery(null);
    setMentionUsers([]);
  }, []);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Footer component - Input area
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <CommentFooter
        ref={footerRef}
        {...props}
        onSubmitComment={handleSubmitComment}
        onMentionQuery={handleMentionQuery}
        loading={loading}
        userAvatar={userAvatar}
        postOwnerUsername={postOwnerUsername}
      />
    ),
    [loading, handleSubmitComment, handleMentionQuery, userAvatar, postOwnerUsername]
  );

  // Toggle comment like - recursive helper for nested comments
  const updateCommentLike = (comments: Comment[], commentId: string): Comment[] => {
    return comments.map((c) => {
      if (c.id === commentId) {
        const isLiked = c.is_liked || false;
        return {
          ...c,
          is_liked: !isLiked,
          likes_count: isLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1
        };
      }
      // Check replies
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: updateCommentLike(c.replies, commentId)
        };
      }
      return c;
    });
  };

  const handleLikeComment = async (commentId: string) => {
    // Optimistic update
    setComments((prev) => updateCommentLike(prev, commentId));

    // API call
    try {
      const response = await likeComment(supabaseUrl, accessToken, commentId);
      console.log("❤️ Like comment response:", response);
      if (!response.success) {
        // Revert on error
        setComments((prev) => updateCommentLike(prev, commentId));
      }
    } catch (error) {
      console.error("❌ Like comment error:", error);
      // Revert on error
      setComments((prev) => updateCommentLike(prev, commentId));
    }
  };

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    // TODO: API call to delete comment
    console.log("🗑️ Deleting comment:", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setShowDeleteMenu(null);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <CommentItem
      comment={item}
      onLike={handleLikeComment}
      onReply={(id) => console.log("Reply to:", id)}
      onDelete={handleDeleteComment}
      showDeleteMenu={showDeleteMenu === item.id}
      onShowDeleteMenu={setShowDeleteMenu}
      onHideDeleteMenu={() => setShowDeleteMenu(null)}
    />
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

        {/* Mention aktifken kullanıcıları göster, değilse yorumları */}
        {mentionQuery ? (
          <BottomSheetFlatList
            data={mentionUsers}
            keyExtractor={(item: MentionUser) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: MentionUser }) => (
              <Pressable
                onPress={() => handleSelectMention(item.username)}
                style={styles.mentionItem}
              >
                <Image
                  source={{
                    uri:
                      item.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${item.id}`
                  }}
                  style={styles.mentionAvatar}
                />
                <View style={styles.mentionInfo}>
                  <Text style={[styles.mentionUsername, { color: colors.textPrimary }]}>
                    {item.username}
                  </Text>
                  {item.display_name && (
                    <Text style={[styles.mentionName, { color: colors.textMuted }]}>
                      {item.display_name}
                    </Text>
                  )}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              mentionLoading ? (
                <View style={styles.skeletonContainer}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonItem}>
                      <View
                        style={[styles.skeletonAvatar, { backgroundColor: colors.surfaceAlt }]}
                      />
                      <View style={styles.skeletonInfo}>
                        <View
                          style={[styles.skeletonUsername, { backgroundColor: colors.surfaceAlt }]}
                        />
                        <View
                          style={[styles.skeletonName, { backgroundColor: colors.surfaceAlt }]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    Kullanıcı bulunamadı
                  </Text>
                </View>
              )
            }
          />
        ) : (
          <BottomSheetFlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item: Comment) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
                  Henüz yorum yok
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Konuşmayı başlat.
                </Text>
              </View>
            }
          />
        )}
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
    paddingTop: 12,
    paddingBottom: 200 // Footer yüksekliği için padding (emoji bar ~68 + input ~56 + safe area ~54 + extra)
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
    flex: 1,
    marginLeft: 12
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  username: {
    fontSize: 14,
    fontWeight: "600"
  },
  timeAgo: {
    fontSize: 12
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: "500"
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
  },
  commentWrapper: {
    position: "relative"
  },
  deleteMenu: {
    position: "absolute",
    right: 16,
    top: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000
  },
  deleteMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  deleteMenuText: {
    fontSize: 14,
    fontWeight: "600"
  },
  // Mention styles
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12
  },
  mentionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  mentionInfo: {
    flex: 1
  },
  mentionUsername: {
    fontSize: 15,
    fontWeight: "600"
  },
  mentionName: {
    fontSize: 13,
    marginTop: 2
  },
  // Skeleton styles
  skeletonContainer: {
    paddingHorizontal: 16
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  skeletonInfo: {
    flex: 1,
    gap: 8
  },
  skeletonUsername: {
    width: 120,
    height: 14,
    borderRadius: 4
  },
  skeletonName: {
    width: 80,
    height: 12,
    borderRadius: 4
  }
});
