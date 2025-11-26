/**
 * NewChatScreen
 *
 * Amaç: Yeni sohbet başlatma ekranı
 * Tarih: 2025-11-26
 *
 * Kullanıcı arama ve yeni sohbet oluşturma.
 */

import { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useDebounce } from "@/hooks";
import { supabase } from "@/lib/supabaseClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useConversationStore } from "@/store/messaging";
import { UserSearchItem } from "./components/UserSearchItem";
import { RecentContacts } from "./components/RecentContacts";
import { NewChatSkeleton } from "./components/NewChatSkeleton";

// =============================================
// TYPES
// =============================================

interface SearchUser {
  id: string;
  user_id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  type?: "user" | "creator" | "admin";
}

// =============================================
// COMPONENT
// =============================================

export function NewChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Kullanıcı arama (Edge Function ile - admin hariç)
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["user-search-chat", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) return [];

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/search-users?q=${encodeURIComponent(debouncedQuery)}&limit=20`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("[UserSearch] Error:", result.error);
        return [];
      }

      return result.data as SearchUser[];
    },
    enabled: debouncedQuery.length >= 2
  });

  // Sohbet oluştur veya mevcut olanı bul (Edge Function kullan)
  const handleUserSelect = useCallback(
    async (user: SearchUser) => {
      if (isCreating) return;

      setIsCreating(true);
      const startTime = Date.now();
      console.log("[NewChat] Starting conversation creation with:", user.username, user.user_id);

      try {
        // Edge function ile sohbet oluştur/bul
        console.log("[NewChat] Getting auth session...");
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        console.log("[NewChat] Auth session took:", Date.now() - startTime, "ms");

        if (!token) {
          console.error("[NewChat] No auth token");
          return;
        }

        console.log("[NewChat] Calling create-conversation edge function...");
        const fetchStart = Date.now();
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-conversation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              type: "direct",
              participant_ids: [user.user_id]
            })
          }
        );
        console.log("[NewChat] Edge function took:", Date.now() - fetchStart, "ms");

        const result = await response.json();
        console.log("[NewChat] Response:", JSON.stringify(result).substring(0, 200));

        if (!response.ok || !result.success) {
          console.error("[NewChat] Error:", result.error);
          return;
        }

        console.log(
          "[NewChat] Conversation:",
          result.existing ? "found" : "created",
          result.data.id,
          "- Total time:",
          Date.now() - startTime,
          "ms"
        );

        // Conversation'ı store'a ekle (ChatScreen'de tekrar fetch etmeye gerek kalmasın)
        const conv = result.data;
        useConversationStore.getState().addConversation({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          avatar_url: conv.avatar_url,
          last_message_at: conv.last_message_at,
          unread_count: 0,
          is_muted: false,
          other_participant: {
            user_id: user.user_id,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            username: user.username
          }
        });

        console.log("[NewChat] Navigating to chat screen...");
        router.replace(`/(messages)/${result.data.id}`);
      } catch (error) {
        console.error("[NewChat] Failed to create conversation:", error);
      } finally {
        setIsCreating(false);
      }
    },
    [router, queryClient, isCreating]
  );

  const showRecentContacts = !debouncedQuery || debouncedQuery.length < 2;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Yeni Sohbet</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Kullanıcı ara..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Loading overlay */}
      {isCreating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
            Sohbet oluşturuluyor...
          </Text>
        </View>
      )}

      {/* Content */}
      {showRecentContacts ? (
        <RecentContacts onSelect={handleUserSelect} />
      ) : isLoading ? (
        <NewChatSkeleton />
      ) : (
        <FlashList
          data={searchResults}
          renderItem={({ item }) => (
            <UserSearchItem
              user={item}
              onPress={() => handleUserSelect(item)}
              disabled={isCreating}
            />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={60}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Kullanıcı bulunamadı
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  backButton: {
    padding: 4
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  placeholder: {
    width: 32
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16
  },
  listContent: {
    paddingBottom: 100
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center"
  },
  emptyText: {
    fontSize: 14
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    gap: 12
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500"
  }
});

export default NewChatScreen;
