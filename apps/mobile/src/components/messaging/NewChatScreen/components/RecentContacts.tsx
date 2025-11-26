/**
 * RecentContacts → FollowingUsers
 *
 * Amaç: Takip edilen kullanıcılar listesi (Edge Function ile)
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { UserSearchItem } from "./UserSearchItem";
import { NewChatSkeleton } from "./NewChatSkeleton";

interface RecentContactsProps {
  onSelect: (user: any) => void;
}

interface FollowingUser {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export function RecentContacts({ onSelect }: RecentContactsProps) {
  const { colors } = useTheme();

  // Takip edilen kullanıcıları getir (Edge Function ile)
  const { data: followingUsers, isLoading } = useQuery({
    queryKey: ["following-users-for-chat"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) return [];

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-following?limit=50`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("[FollowingUsers] Error:", result.error);
        return [];
      }

      // user_id'yi map et (edge function id olarak user_id döndürüyor)
      return result.data.users.map((u: any) => ({
        ...u,
        user_id: u.id // edge function'dan gelen id aslında user_id
      })) as FollowingUser[];
    }
  });

  if (isLoading) {
    return <NewChatSkeleton />;
  }

  if (!followingUsers || followingUsers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Henüz takip ettiğiniz kullanıcı yok
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
          Kullanıcı aramak için yukarıdaki arama kutusunu kullanın
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Takip Ettiklerim</Text>
      {followingUsers.map((item: any) => (
        <UserSearchItem key={item.id} user={item} onPress={() => onSelect(item)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 100
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    gap: 8
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500"
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center"
  }
});
