/**
 * Comment Sheet Component
 *
 * Amaç: Post yorumlarını gösteren bottom sheet
 */

import React, { useRef, useCallback, useMemo, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
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
import {
  CommentItem,
  Comment,
  CommentFooter,
  CommentFooterRef,
  MentionUser,
  CommentLikersSheet
} from "./components";
import { useCommentSheet } from "./hooks";
import { styles } from "./styles";
import type { CommentSheetProps } from "./types";

export function CommentSheet({ postId, visible, onClose, postOwnerUsername }: CommentSheetProps) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const footerRef = useRef<CommentFooterRef>(null);

  // Hook'tan tüm state ve actions
  const {
    loading,
    comments,
    showDeleteMenu,
    mentionQuery,
    mentionUsers,
    mentionLoading,
    replyTo,
    likersCommentId,
    showLikersSheet,
    userAvatar,
    fetchComments,
    handleSubmitComment,
    handleMentionQuery,
    handleLikeComment,
    handleDeleteComment,
    handleReply,
    handleShowLikers,
    closeLikersSheet,
    setShowDeleteMenu,
    setReplyTo,
    setMentionQuery,
    setMentionUsers
  } = useCommentSheet({ postId });

  // Snap points
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  // Open/close sheet
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      fetchComments();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, fetchComments]);

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    onClose();
  }, [onClose]);

  // Mention seçildiğinde
  const handleSelectMention = useCallback(
    (username: string) => {
      if (footerRef.current) {
        footerRef.current.insertMention(username);
      }
      setMentionQuery(null);
      setMentionUsers([]);
    },
    [setMentionQuery, setMentionUsers]
  );

  // Backdrop
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Footer
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
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    ),
    [loading, handleSubmitComment, handleMentionQuery, userAvatar, postOwnerUsername, replyTo, setReplyTo]
  );

  // Comment item
  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        onLike={handleLikeComment}
        onReply={handleReply}
        onDelete={handleDeleteComment}
        showDeleteMenu={showDeleteMenu === item.id}
        onShowDeleteMenu={setShowDeleteMenu}
        onHideDeleteMenu={() => setShowDeleteMenu(null)}
        onShowLikers={handleShowLikers}
      />
    ),
    [handleLikeComment, handleReply, handleDeleteComment, showDeleteMenu, setShowDeleteMenu, handleShowLikers]
  );

  // Mention item
  const renderMentionItem = useCallback(
    ({ item }: { item: MentionUser }) => (
      <Pressable onPress={() => handleSelectMention(item.username)} style={styles.mentionItem}>
        <Image
          source={{
            uri: item.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.id}`
          }}
          style={styles.mentionAvatar}
        />
        <View style={styles.mentionInfo}>
          <Text style={[styles.mentionUsername, { color: colors.textPrimary }]}>{item.username}</Text>
          {item.display_name && (
            <Text style={[styles.mentionName, { color: colors.textMuted }]}>{item.display_name}</Text>
          )}
        </View>
      </Pressable>
    ),
    [colors, handleSelectMention]
  );

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
            <Send size={24} color={colors.textPrimary} style={{ transform: [{ rotate: "45deg" }] }} />
          </Pressable>
        </View>

        {/* Content */}
        {mentionQuery ? (
          <BottomSheetFlatList
            data={mentionUsers}
            keyExtractor={(item: MentionUser) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.list}
            renderItem={renderMentionItem}
            ListEmptyComponent={
              mentionLoading ? (
                <View style={styles.skeletonContainer}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonItem}>
                      <View style={[styles.skeletonAvatar, { backgroundColor: colors.surfaceAlt }]} />
                      <View style={styles.skeletonInfo}>
                        <View style={[styles.skeletonUsername, { backgroundColor: colors.surfaceAlt }]} />
                        <View style={[styles.skeletonName, { backgroundColor: colors.surfaceAlt }]} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Kullanıcı bulunamadı</Text>
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
                <Text style={[styles.emptyText, { color: colors.textPrimary }]}>Henüz yorum yok</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Konuşmayı başlat.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>

      {/* Likers Sheet */}
      <CommentLikersSheet commentId={likersCommentId} visible={showLikersSheet} onClose={closeLikersSheet} />
    </BottomSheetModal>
  );
}
