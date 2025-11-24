/**
 * Error Feed State Component
 *
 * Amaç: Feed yüklenirken hata olduğunda gösterilecek state
 *
 * Özellikler:
 * - Error icon
 * - Error message
 * - Retry button
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface ErrorFeedStateProps {
  error?: string;
  onRetry?: () => void;
}

export function ErrorFeedState({ error, onRetry }: ErrorFeedStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertCircle size={64} color={colors.warning} />
      </View>

      <Text style={[styles.title, { color: colors.warning }]}>Bir hata oluştu</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {error || "Feed yüklenirken bir sorun oluştu. Lütfen tekrar deneyin."}
      </Text>

      {onRetry && (
        <Pressable style={[styles.button, { backgroundColor: colors.warning }]} onPress={onRetry}>
          <Text style={[styles.buttonText, { color: colors.buttonPrimaryText }]}>Tekrar Dene</Text>
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
