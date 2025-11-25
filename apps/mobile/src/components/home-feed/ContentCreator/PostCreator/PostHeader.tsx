/**
 * PostHeader Component
 * Gönderi oluşturma header'ı
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface PostHeaderProps {
  title: string;
  onClose?: () => void;
  onBack?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
}

export function PostHeader({ title, onClose, onBack, rightAction }: PostHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top }]}>
      <Pressable onPress={onBack || onClose} style={styles.headerButton}>
        {onBack ? (
          <ChevronLeft size={28} color={colors.textPrimary} />
        ) : (
          <X size={24} color={colors.textPrimary} />
        )}
      </Pressable>

      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>

      {rightAction ? (
        <Pressable
          onPress={rightAction.onPress}
          disabled={rightAction.disabled}
          style={styles.headerButton}
        >
          <Text
            style={[
              styles.headerAction,
              { color: rightAction.disabled ? colors.textMuted : colors.accent }
            ]}
          >
            {rightAction.label}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.headerButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  headerButton: {
    width: 50,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600"
  },
  headerAction: {
    fontSize: 16,
    fontWeight: "600"
  }
});
