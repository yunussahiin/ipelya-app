/**
 * VoiceRecorder
 *
 * Amaç: Ses kaydedici component
 * Tarih: 2025-11-26
 *
 * NOT: expo-av requires development build, disabled for Expo Go
 */

import { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
// expo-av requires development build, disabled for Expo Go
// import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

// =============================================
// TYPES
// =============================================

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

// =============================================
// COMPONENT
// =============================================

/**
 * VoiceRecorder - Ses kaydedici
 *
 * NOT: expo-av requires development build.
 * Bu component Expo Go'da çalışmaz.
 */
export function VoiceRecorder({ onCancel }: VoiceRecorderProps) {
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    Alert.alert(
      "Geliştirme Yapısı Gerekli",
      "Ses kayıt özelliği için development build gereklidir.",
      [{ text: "İptal", onPress: onCancel }, { text: "Tamam" }]
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [onCancel]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.content}>
        <Ionicons name="mic-off-outline" size={32} color={colors.textMuted} />
        <Text style={[styles.message, { color: colors.textMuted }]}>
          Ses kaydı için development build gerekli
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.recordButton, { backgroundColor: colors.border }]}
          onPress={handlePress}
        >
          <Ionicons name="mic" size={24} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    margin: 8
  },
  content: {
    alignItems: "center",
    marginBottom: 16,
    gap: 8
  },
  message: {
    fontSize: 14,
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24
  },
  cancelButton: {
    padding: 12
  },
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center"
  }
});

export default VoiceRecorder;
