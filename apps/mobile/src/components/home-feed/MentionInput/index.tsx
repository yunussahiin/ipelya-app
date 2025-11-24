/**
 * MentionInput Component
 *
 * Amaç: Mention autocomplete input - @username yazarken kullanıcı önerileri
 *
 * Özellikler:
 * - TextInput with mention detection
 * - Autocomplete dropdown
 * - User search
 * - Insert mention
 *
 * Props:
 * - value: string
 * - onChange: Change callback
 * - placeholder: string
 * - onMentionSelect: Mention select callback
 */

import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, FlatList, Text, Pressable, Image } from "react-native";

interface MentionInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  onMentionSelect?: (username: string) => void;
}

export function MentionInput({ value, onChange, placeholder, onMentionSelect }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");

  // Mention detection
  useEffect(() => {
    const lastWord = value.split(" ").pop() || "";

    if (lastWord.startsWith("@") && lastWord.length > 1) {
      const query = lastWord.substring(1);
      setMentionQuery(query);
      setShowSuggestions(true);

      // TODO: API call to search users
      // searchMentions(query).then(setSuggestions);
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

  // Mention select handler
  const handleSelectMention = (username: string) => {
    const words = value.split(" ");
    words[words.length - 1] = `@${username} `;
    onChange(words.join(" "));
    setShowSuggestions(false);
    onMentionSelect?.(username);
  };

  return (
    <View style={styles.container}>
      {/* Text input */}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline
        numberOfLines={4}
      />

      {/* Autocomplete suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestions}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelectMention(item.username)}
                style={styles.suggestionItem}
              >
                {item.avatar_url && (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                )}
                <View>
                  <Text style={styles.name}>{item.display_name}</Text>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative"
  },
  input: {
    borderWidth: 1,
    borderColor: "#E9ECEF",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#212529",
    minHeight: 100,
    textAlignVertical: "top"
  },
  suggestions: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F9FA"
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529"
  },
  username: {
    fontSize: 12,
    color: "#6C757D"
  }
});
