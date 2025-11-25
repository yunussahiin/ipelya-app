/**
 * PostFeedModal Component
 * Instagram-style vertical scrollable post feed
 */

import { useCallback, useMemo, useRef, useEffect } from "react";
import { Dimensions, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Heart, MessageCircle, Send, Bookmark } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import type { PostItem } from "./PostsGrid";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PostFeedModalProps {
  visible: boolean;
  posts: PostItem[];
  initialIndex: number;
  onClose: () => void;
  username?: string;
  avatarUrl?: string;
}

interface PostCardProps {
  post: PostItem;
  username?: string;
  avatarUrl?: string;
  colors: ThemeColors;
}

function PostCard({ post, username, avatarUrl, colors }: PostCardProps) {
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Implement like
  };

  const handleComment = () => {
    // TODO: Open comments
  };

  const handleShare = () => {
    // TODO: Share post
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Save post
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]} />
          )}
          <Text style={styles.username}>@{username || "user"}</Text>
        </View>
      </View>

      {/* Image */}
      <View style={styles.imageContainer}>
        {post.media[0] && (
          <Image
            source={{ uri: post.media[0].media_url }}
            style={styles.image}
            contentFit="contain"
          />
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Pressable onPress={handleLike} style={styles.actionButton}>
            <Heart size={26} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleComment} style={styles.actionButton}>
            <MessageCircle size={26} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <Send size={24} color={colors.textPrimary} />
          </Pressable>
        </View>
        <Pressable onPress={handleSave} style={styles.actionButton}>
          <Bookmark size={26} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Likes */}
      <View style={styles.likesContainer}>
        <Text style={styles.likes}>{post.likes_count} beğeni</Text>
      </View>

      {/* Caption */}
      {post.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>@{username || "user"} </Text>
            {post.caption}
          </Text>
        </View>
      )}

      {/* Comments */}
      {post.comments_count > 0 && (
        <Pressable onPress={handleComment}>
          <Text style={styles.viewComments}>{post.comments_count} yorumun tümünü gör</Text>
        </Pressable>
      )}
    </View>
  );
}

export function PostFeedModal({
  visible,
  posts,
  initialIndex,
  onClose,
  username,
  avatarUrl
}: PostFeedModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  // Scroll to initial index when modal opens
  useEffect(() => {
    if (visible && flatListRef.current && initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false
        });
      }, 100);
    }
  }, [visible, initialIndex]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const renderItem = useCallback(
    ({ item }: { item: PostItem }) => (
      <PostCard post={item} username={username} avatarUrl={avatarUrl} colors={colors} />
    ),
    [username, avatarUrl, colors]
  );

  const keyExtractor = useCallback((item: PostItem) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index
    }),
    []
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number }) => {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: false
        });
      }, 100);
    },
    []
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close Button */}
        <Pressable style={[styles.closeButton, { top: insets.top + 10 }]} onPress={handleClose}>
          <X size={28} color="#FFFFFF" />
        </Pressable>

        {/* Posts Feed */}
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={onScrollToIndexFailed}
          initialScrollIndex={initialIndex}
        />
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    closeButton: {
      position: "absolute",
      right: 16,
      zIndex: 100,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center"
    }
  });

const createCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16
    },
    avatarPlaceholder: {
      backgroundColor: colors.surface
    },
    username: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    },
    imageContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      maxHeight: SCREEN_HEIGHT * 0.6
    },
    image: {
      width: SCREEN_WIDTH,
      height: "100%"
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    leftActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16
    },
    actionButton: {
      padding: 4
    },
    likesContainer: {
      paddingHorizontal: 14
    },
    likes: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    },
    captionContainer: {
      paddingHorizontal: 14,
      paddingTop: 6
    },
    caption: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20
    },
    captionUsername: {
      fontWeight: "600"
    },
    viewComments: {
      fontSize: 14,
      color: colors.textSecondary,
      paddingHorizontal: 14,
      paddingTop: 6
    }
  });
