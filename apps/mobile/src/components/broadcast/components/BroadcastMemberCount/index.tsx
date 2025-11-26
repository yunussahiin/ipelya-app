/**
 * BroadcastMemberCount
 *
 * Amaç: Üye sayısı göstergesi
 * Tarih: 2025-11-26
 */

import { memo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface BroadcastMemberCountProps {
  count: number;
  animated?: boolean;
}

export const BroadcastMemberCount = memo(function BroadcastMemberCount({
  count,
  animated = true
}: BroadcastMemberCountProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(count);

  // Sayı değiştiğinde animasyon
  useEffect(() => {
    if (animated && count !== prevCount.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();
      prevCount.current = count;
    }
  }, [count, animated, scaleAnim]);

  return (
    <View style={styles.container}>
      <Ionicons name="people" size={16} color={colors.textMuted} />
      <Animated.Text
        style={[styles.count, { color: colors.textPrimary, transform: [{ scale: scaleAnim }] }]}
      >
        {count.toLocaleString()}
      </Animated.Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  count: {
    fontSize: 14,
    fontWeight: "600"
  }
});

export default BroadcastMemberCount;
