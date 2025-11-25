/**
 * CommentLikersSheet Component
 *
 * Amaç: Yorum beğenenlerini gösteren sheet
 * - Sağdan sola açılır
 * - Takip durumuna göre buton değişir
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheetModal, BottomSheetFlatList, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { ChevronLeft, Search, MessageCircle } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuthStore } from "@/store/auth.store";
import { supabase } from "@/lib/supabaseClient";
import { followUser, unfollowUser } from "@/services/followers.service";

interface Liker {
  id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  is_following?: boolean;
  follows_me?: boolean;
}

interface CommentLikersSheetProps {
  commentId: string | null;
  visible: boolean;
  onClose: () => void;
}

export function CommentLikersSheet({ commentId, visible, onClose }: CommentLikersSheetProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  // Get current user ID
  const currentUserId = sessionToken
    ? JSON.parse(atob(sessionToken.split(".")[1]))?.sub
    : undefined;

  // Fetch likers
  const fetchLikers = useCallback(async () => {
    if (!commentId || !currentUserId) return;

    setLoading(true);
    try {
      // Get comment likes
      const { data: likes, error: likesError } = await supabase
        .from("comment_likes")
        .select("user_id")
        .eq("comment_id", commentId);

      if (likesError) throw likesError;

      const userIds = likes?.map((l) => l.user_id) || [];
      if (userIds.length === 0) {
        setLikers([]);
        return;
      }

      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, username, display_name, avatar_url")
        .in("user_id", userIds)
        .eq("type", "real");

      if (profilesError) throw profilesError;

      // Check follow status
      const { data: following } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", userIds);

      const followingIds = new Set(following?.map((f) => f.following_id) || []);

      // Check who follows me
      const { data: followers } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("following_id", currentUserId)
        .in("follower_id", userIds);

      const followerIds = new Set(followers?.map((f) => f.follower_id) || []);

      const likersWithStatus =
        profiles?.map((p) => ({
          ...p,
          is_following: followingIds.has(p.user_id),
          follows_me: followerIds.has(p.user_id)
        })) || [];

      setLikers(likersWithStatus);
    } catch (error) {
      console.error("❌ Fetch likers error:", error);
    } finally {
      setLoading(false);
    }
  }, [commentId, currentUserId]);

  // Open/close sheet
  useEffect(() => {
    if (visible && commentId) {
      bottomSheetRef.current?.present();
      fetchLikers();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, commentId, fetchLikers]);

  // Handle follow/unfollow
  const handleFollowToggle = async (userId: string, isFollowing: boolean) => {
    setFollowLoading(userId);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }

      // Update local state
      setLikers((prev) =>
        prev.map((l) => (l.user_id === userId ? { ...l, is_following: !isFollowing } : l))
      );
    } catch (error) {
      console.error("❌ Follow toggle error:", error);
    } finally {
      setFollowLoading(null);
    }
  };

  // Filter likers by search
  const filteredLikers = likers.filter(
    (l) =>
      l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render backdrop
  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Get button text and style
  const getButtonConfig = (liker: Liker) => {
    if (liker.user_id === currentUserId) {
      return null; // Don't show button for self
    }

    if (liker.is_following) {
      return {
        text: "Mesaj",
        style: styles.messageButton,
        icon: <MessageCircle size={14} color={colors.textPrimary} />
      };
    }

    if (liker.follows_me) {
      return {
        text: "Sen de takip et",
        style: styles.followBackButton,
        textStyle: { color: "#FFFFFF" }
      };
    }

    return {
      text: "Takip Et",
      style: styles.followButton,
      textStyle: { color: "#FFFFFF" }
    };
  };

  const renderLiker = ({ item }: { item: Liker }) => {
    const buttonConfig = getButtonConfig(item);

    return (
      <View style={styles.likerItem}>
        <Image
          source={{
            uri:
              item.avatar_url || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.user_id}`
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.textPrimary }]}>{item.username}</Text>
          {item.display_name && (
            <Text style={[styles.displayName, { color: colors.textMuted }]}>
              {item.display_name}
            </Text>
          )}
        </View>

        {buttonConfig && (
          <Pressable
            style={[
              buttonConfig.style,
              {
                backgroundColor:
                  buttonConfig.style === styles.messageButton ? colors.surface : colors.accent
              }
            ]}
            onPress={() => {
              if (buttonConfig.text === "Mesaj") {
                console.log("Open chat with:", item.username);
              } else {
                handleFollowToggle(item.user_id, item.is_following || false);
              }
            }}
            disabled={followLoading === item.user_id}
          >
            {followLoading === item.user_id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                {buttonConfig.icon}
                <Text style={[styles.buttonText, buttonConfig.textStyle]}>{buttonConfig.text}</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  // Snap points - CommentSheet ile aynı
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      onDismiss={onClose}
      backgroundStyle={[styles.sheetBackground, { backgroundColor: colors.background }]}
      handleIndicatorStyle={[styles.indicator, { backgroundColor: colors.border }]}
      backdropComponent={renderBackdrop}
    >
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.container, { backgroundColor: colors.background, borderRadius: 12 }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Beğenme</Text>
          <View style={styles.backButton} />
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Ara"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Likers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={filteredLikers}
            keyExtractor={(item) => item.user_id}
            renderItem={renderLiker}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Henüz beğeni yok
                </Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0
  },
  list: {
    paddingHorizontal: 16
  },
  likerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  userInfo: {
    flex: 1
  },
  username: {
    fontSize: 14,
    fontWeight: "600"
  },
  displayName: {
    fontSize: 13,
    marginTop: 2
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  followBackButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  messageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600"
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 14
  }
});
