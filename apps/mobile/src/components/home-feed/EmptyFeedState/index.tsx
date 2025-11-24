/**
 * Empty Feed State Component
 *
 * Amaç: Feed boş olduğunda gösterilecek state
 *
 * Özellikler:
 * - Icon
 * - Title
 * - Description
 * - Action button
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Inbox } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface EmptyFeedStateProps {
  onCreatePost?: () => void;
}

export function EmptyFeedState({ onCreatePost }: EmptyFeedStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Inbox size={64} color={colors.textMuted} />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Henüz gönderi yok</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        İlk gönderiyi paylaşan sen ol!
      </Text>

      {onCreatePost && (
        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={onCreatePost}
        >
          <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>
            Gönderi Oluştur
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32
  },
  iconContainer: {
    marginBottom: 24
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center"
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600"
  }
});
