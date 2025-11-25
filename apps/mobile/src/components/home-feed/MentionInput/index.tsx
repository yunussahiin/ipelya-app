/**
 * MentionInput Component
 *
 * Amaç: Mention autocomplete input - @username yazarken kullanıcı önerileri
 *
 * Özellikler:
 * - TextInput with mention detection
 * - Autocomplete dropdown (API entegrasyonu)
 * - User search (debounced)
 * - Insert mention
 * - Theme-aware styling
 *
 * Props:
 * - value: string
 * - onChange: Change callback
 * - placeholder: string
 * - onMentionSelect: Mention select callback
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Text,
  Pressable,
  Image,
  ActivityIndicator
} from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { searchMentions } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";

interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  onMentionSelect?: (username: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  onMentionSelect,
  multiline = true,
  numberOfLines = 4
}: MentionInputProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Debounced search
  const searchUsers = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await searchMentions(supabaseUrl, accessToken, query, 10);
        if (response.success && response.data?.users) {
          setSuggestions(response.data.users);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error("Search mentions error:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [supabaseUrl, accessToken]
  );

  // Mention detection with debounce
  useEffect(() => {
    const lastWord = value.split(" ").pop() || "";

    if (lastWord.startsWith("@") && lastWord.length > 1) {
      const query = lastWord.substring(1);
      setShowSuggestions(true);

      // Debounce search
      const timeoutId = setTimeout(() => {
        searchUsers(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, searchUsers]);

  // Mention select handler
  const handleSelectMention = (username: string) => {
    const words = value.split(" ");
    words[words.length - 1] = `@${username} `;
    onChange(words.join(" "));
    setShowSuggestions(false);
    setSuggestions([]);
    onMentionSelect?.(username);
  };

  return (
    <View style={styles.container}>
      {/* Autocomplete suggestions (above input) */}
      {showSuggestions && (
        <View
          style={[
            styles.suggestions,
            { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Aranıyor...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectMention(item.username)}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                >
                  <Image
                    source={{
                      uri:
                        item.avatar_url ||
                        "https://api.dicebear.com/7.x/avataaars/png?seed=" + item.id
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                      {item.display_name || item.username}
                    </Text>
                    <Text style={[styles.username, { color: colors.textMuted }]}>
                      @{item.username}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Kullanıcı bulunamadı
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Text input */}
      <TextInput
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceAlt,
            color: colors.textPrimary
          }
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative"
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top"
  },
  suggestions: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderBottomWidth: 1
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  userInfo: {
    flex: 1
  },
  name: {
    fontSize: 15,
    fontWeight: "600"
  },
  username: {
    fontSize: 13,
    marginTop: 2
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8
  },
  loadingText: {
    fontSize: 14
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center"
  },
  emptyText: {
    fontSize: 14
  }
});
