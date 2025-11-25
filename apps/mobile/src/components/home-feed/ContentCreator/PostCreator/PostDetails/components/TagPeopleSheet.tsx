/**
 * TagPeopleSheet Component
 * Instagram tarzı tap to tag - carousel yerine tek görsel, tooltip etiketler
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Modal,
  Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, BadgeCheck, Search } from "lucide-react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuthStore } from "@/store/auth.store";
import type { MediaAsset } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MEDIA_SIZE = SCREEN_WIDTH - 48;

const log = (action: string, data?: Record<string, unknown>) => {
  console.log(`[TagPeopleSheet] ${action}`, data ? JSON.stringify(data, null, 2) : "");
};

export interface TaggedUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface TagPosition {
  user: TaggedUser;
  mediaIndex: number;
  x: number;
  y: number;
}

interface SearchResult {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role?: string;
  is_following?: boolean;
  is_follower?: boolean;
}

interface TagPeopleSheetProps {
  visible: boolean;
  onClose: () => void;
  assets: MediaAsset[];
  tagPositions: TagPosition[];
  onTagPositionsChange: (positions: TagPosition[]) => void;
}

export function TagPeopleSheet({
  visible,
  onClose,
  assets,
  tagPositions,
  onTagPositionsChange
}: TagPeopleSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { sessionToken } = useAuthStore();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentUsers, setRecentUsers] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

  useEffect(() => {
    log("VISIBILITY_CHANGE", { visible });
    if (visible) {
      fetchRecentUsers();
      setCurrentMediaIndex(0);
      setShowSearch(false);
      setTapPosition(null);
    }
  }, [visible]);

  const fetchRecentUsers = async () => {
    log("FETCH_RECENT_USERS_START");
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/search-users?recent=true&limit=10`,
        {
          headers: { Authorization: `Bearer ${sessionToken}`, "Content-Type": "application/json" }
        }
      );
      const data = await response.json();
      log("FETCH_RECENT_USERS_RESPONSE", { success: data.success, count: data.data?.length || 0 });
      if (data.success) setRecentUsers(data.data || []);
    } catch (error) {
      log("FETCH_RECENT_USERS_ERROR", { error: String(error) });
    }
  };

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimeout) clearTimeout(searchTimeout);
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      const timeout = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/search-users?q=${encodeURIComponent(query)}&limit=20`,
            {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Content-Type": "application/json"
              }
            }
          );
          const data = await response.json();
          if (data.success) setSearchResults(data.data || []);
        } catch (error) {
          log("SEARCH_ERROR", { error: String(error) });
        } finally {
          setLoading(false);
        }
      }, 300);
      setSearchTimeout(timeout);
    },
    [searchTimeout, sessionToken, supabaseUrl]
  );

  const handleMediaTap = (locationX: number, locationY: number) => {
    const x = Math.max(10, Math.min(90, (locationX / MEDIA_SIZE) * 100));
    const y = Math.max(10, Math.min(90, (locationY / MEDIA_SIZE) * 100));
    log("MEDIA_TAP", { locationX, locationY, x, y, mediaIndex: currentMediaIndex });
    setTapPosition({ x, y });
    setShowSearch(true);
    setSearchQuery("");
  };

  const handleSelectUser = (user: SearchResult) => {
    if (!tapPosition) return;
    log("SELECT_USER", { userId: user.user_id, username: user.username, position: tapPosition });
    const newTag: TagPosition = {
      user: {
        id: user.user_id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      },
      mediaIndex: currentMediaIndex,
      x: tapPosition.x,
      y: tapPosition.y
    };
    const filtered = tagPositions.filter(
      (p) => !(p.user.id === user.user_id && p.mediaIndex === currentMediaIndex)
    );
    onTagPositionsChange([...filtered, newTag]);
    setShowSearch(false);
    setTapPosition(null);
  };

  const handleRemoveTag = (userId: string, mediaIndex: number) => {
    log("REMOVE_TAG", { userId, mediaIndex });
    onTagPositionsChange(
      tagPositions.filter((p) => !(p.user.id === userId && p.mediaIndex === mediaIndex))
    );
  };

  const currentAsset = assets[currentMediaIndex];
  const currentTags = tagPositions.filter((t) => t.mediaIndex === currentMediaIndex);

  const renderUserItem = ({ item }: { item: SearchResult }) => (
    <Pressable style={styles.userItem} onPress={() => handleSelectUser(item)}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.avatarText, { color: colors.textMuted }]}>
            {item.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.usernameRow}>
          <Text style={[styles.username, { color: colors.textPrimary }]}>{item.username}</Text>
          {item.role === "creator" && <BadgeCheck size={14} color={colors.accent} />}
        </View>
        <Text style={[styles.displayName, { color: colors.textMuted }]} numberOfLines={1}>
          {item.display_name || item.username}
          {item.is_following && item.is_follower && " · Karşılıklı"}
          {item.is_following && !item.is_follower && " · Takip ediyorsun"}
          {!item.is_following && item.is_follower && " · Seni takip ediyor"}
        </Text>
      </View>
    </Pressable>
  );

  const displayList = searchQuery.trim().length >= 2 ? searchResults : recentUsers;

  if (assets.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Kişileri etiketle</Text>
          <Pressable onPress={onClose} style={styles.headerRight}>
            <Text style={[styles.doneText, { color: colors.accent }]}>Bitti</Text>
          </Pressable>
        </View>

        {/* Media with Tags */}
        <View style={styles.mediaSection}>
          <Pressable
            style={styles.mediaContainer}
            onPress={(e) => handleMediaTap(e.nativeEvent.locationX, e.nativeEvent.locationY)}
          >
            <Image source={{ uri: currentAsset?.uri }} style={styles.media} contentFit="cover" />

            {/* Tag Tooltips */}
            {currentTags.map((tag) => (
              <Pressable
                key={tag.user.id}
                style={[styles.tagTooltip, { left: `${tag.x}%`, top: `${tag.y}%` }]}
                onPress={() => handleRemoveTag(tag.user.id, currentMediaIndex)}
              >
                <View style={[styles.tagBubble, { backgroundColor: "rgba(0,0,0,0.75)" }]}>
                  <Text style={styles.tagText}>@{tag.user.username}</Text>
                </View>
                <View style={styles.tagArrow} />
              </Pressable>
            ))}
          </Pressable>

          {/* Pagination dots for multiple media */}
          {assets.length > 1 && (
            <View style={styles.pagination}>
              {assets.map((_, index) => (
                <Pressable key={index} onPress={() => setCurrentMediaIndex(index)}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          index === currentMediaIndex ? colors.accent : colors.textMuted
                      }
                    ]}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Hint */}
        <Text style={[styles.hintText, { color: colors.textMuted }]}>
          İnsanları etiketlemek için fotoğrafa dokun.
        </Text>

        {/* Search Modal - Full Screen */}
        <Modal visible={showSearch} animationType="slide" presentationStyle="fullScreen">
          <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
            {/* Search Header - İptal sağda */}
            <View
              style={[
                styles.searchHeader,
                { paddingTop: insets.top, borderBottomColor: colors.border }
              ]}
            >
              <View style={[styles.searchInputContainer, { backgroundColor: colors.surfaceAlt }]}>
                <Search size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.textPrimary }]}
                  placeholder="Bir kişiyi ara"
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => handleSearch("")}>
                    <X size={18} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
              <Pressable onPress={() => setShowSearch(false)} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: colors.textPrimary }]}>İptal</Text>
              </Pressable>
            </View>

            {/* User List */}
            {loading ? (
              <View style={styles.skeletonContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={styles.skeletonItem}>
                    <View style={[styles.skeletonAvatar, { backgroundColor: colors.surfaceAlt }]} />
                    <View style={styles.skeletonContent}>
                      <View
                        style={[
                          styles.skeletonLine,
                          { backgroundColor: colors.surfaceAlt, width: "60%" }
                        ]}
                      />
                      <View
                        style={[
                          styles.skeletonLine,
                          { backgroundColor: colors.surfaceAlt, width: "40%", marginTop: 6 }
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <FlatList
                data={displayList}
                keyExtractor={(item) => item.user_id}
                renderItem={renderUserItem}
                contentContainerStyle={styles.userListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    {searchQuery.trim().length >= 2 ? "Kullanıcı bulunamadı" : ""}
                  </Text>
                }
              />
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  headerLeft: { width: 60 },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  headerRight: { width: 60, alignItems: "flex-end" },
  doneText: { fontSize: 16, fontWeight: "600" },
  mediaSection: { alignItems: "center", paddingVertical: 24, paddingHorizontal: 24 },
  mediaContainer: {
    width: MEDIA_SIZE,
    height: MEDIA_SIZE,
    borderRadius: 4,
    overflow: "visible",
    position: "relative"
  },
  media: { width: "100%", height: "100%", borderRadius: 4 },
  tagTooltip: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -50 }, { translateY: 8 }]
  },
  tagBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4
  },
  tagText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tagArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(0,0,0,0.75)",
    transform: [{ rotate: "180deg" }],
    marginTop: -1
  },
  pagination: { flexDirection: "row", justifyContent: "center", marginTop: 16, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  hintText: { textAlign: "center", fontSize: 14, marginTop: 16 },
  searchContainer: { flex: 1 },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8
  },
  searchInput: { flex: 1, fontSize: 16 },
  cancelButton: { paddingVertical: 8, paddingLeft: 4 },
  cancelText: { fontSize: 16, fontWeight: "500" },
  userListContent: { paddingHorizontal: 16, paddingTop: 8 },
  userItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: { fontSize: 16, fontWeight: "600" },
  userInfo: { flex: 1 },
  usernameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  username: { fontSize: 15, fontWeight: "600" },
  displayName: { fontSize: 13, marginTop: 2 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 15 },
  skeletonContainer: { paddingHorizontal: 16 },
  skeletonItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  skeletonAvatar: { width: 44, height: 44, borderRadius: 22 },
  skeletonContent: { flex: 1 },
  skeletonLine: { height: 14, borderRadius: 4 }
});
