/**
 * ChatListHeader
 *
 * Amaç: Sohbet listesi header (arama dahil)
 * Tarih: 2025-11-26
 */

import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useUnreadTotal } from "@/store/messaging";
import { Ionicons } from "@expo/vector-icons";
import { StoriesRow } from "@/components/home-feed/StoriesRow";

interface ChatListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewChat?: () => void;
  showStories?: boolean;
  onStoryPress?: (user: any, index: number) => void;
  onAddStoryPress?: () => void;
}

export function ChatListHeader({
  searchQuery,
  onSearchChange,
  onNewChat,
  showStories = true,
  onStoryPress,
  onAddStoryPress
}: ChatListHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const unreadTotal = useUnreadTotal();

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      router.push("/(messages)/new");
    }
  };

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={styles.titleContainer}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Mesajlar</Text>
          {unreadTotal > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{unreadTotal > 99 ? "99+" : unreadTotal}</Text>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.newButton, { backgroundColor: colors.accent }]}
          onPress={handleNewChat}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Sohbet ara..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Stories Row */}
      {showStories && <StoriesRow onStoryPress={onStoryPress} onAddStoryPress={onAddStoryPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center"
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700"
  },
  newButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0
  }
});
