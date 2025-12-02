/**
 * BroadcastListHeader
 *
 * Amaç: Yayın kanalları listesi header
 * Tarih: 2025-11-26
 */

import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface BroadcastListHeaderProps {
  onSearch?: (query: string) => void;
}

export function BroadcastListHeader({ onSearch }: BroadcastListHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreator, setIsCreator] = useState(false);

  // Creator kontrolü
  useEffect(() => {
    const checkCreator = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_creator, type")
          .eq("id", user.id)
          .single();

        setIsCreator(profile?.is_creator === true || profile?.type === "creator");
      }
    };
    checkCreator();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    onSearch?.(text);
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Kanallar</Text>
        {isCreator && (
          <Pressable
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push("/broadcast/create")}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Kanal ara..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -8
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700"
  },
  createButton: {
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
