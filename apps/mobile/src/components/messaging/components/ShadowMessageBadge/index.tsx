/**
 * ShadowMessageBadge
 *
 * Amaç: Shadow mesaj göstergesi
 * Tarih: 2025-11-26
 *
 * Ghost icon ve "X gün sonra silinecek" text.
 */

import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

// =============================================
// TYPES
// =============================================

interface ShadowMessageBadgeProps {
  /** Mesajın oluşturulma tarihi */
  createdAt: string;
  /** Retention süresi (gün) */
  retentionDays: number;
  /** Kompakt mod (sadece icon) */
  compact?: boolean;
}

// =============================================
// COMPONENT
// =============================================

export const ShadowMessageBadge = memo(function ShadowMessageBadge({
  createdAt,
  retentionDays,
  compact = false
}: ShadowMessageBadgeProps) {
  const { colors } = useTheme();

  // Kalan gün hesapla
  const createdDate = new Date(createdAt);
  const expirationDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remainingMs = expirationDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.ghostIcon}>👻</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={styles.ghostIcon}>👻</Text>
      <Text style={[styles.text, { color: colors.textMuted }]}>
        {remainingDays === 0
          ? "Bugün silinecek"
          : remainingDays === 1
            ? "Yarın silinecek"
            : `${remainingDays} gün sonra silinecek`}
      </Text>
    </View>
  );
});

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6
  },
  compactContainer: {
    position: "absolute",
    top: -8,
    right: -8
  },
  ghostIcon: {
    fontSize: 14
  },
  text: {
    fontSize: 12
  }
});

export default ShadowMessageBadge;
