/**
 * ThemeChangeBanner
 *
 * Amaç: Tema değişiklik bildirimi - Alt kısımda gösterilir
 * Tarih: 2025-12-02
 */

import { memo, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { getThemeInfo, type ChatThemeId } from "@/theme/chatThemes";

interface ThemeChangeItem {
  id: string;
  themeId: ChatThemeId;
  changedBy: string;
  isOwnChange: boolean;
  timestamp: number;
}

interface ThemeChangeBannerProps {
  changes: ThemeChangeItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onChangeTheme: () => void;
}

function ThemeChangeBannerComponent({
  changes,
  onDismiss,
  onDismissAll,
  onChangeTheme
}: ThemeChangeBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (changes.length > 0) {
      // Göster
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      // 8 saniye sonra otomatik gizle
      const timer = setTimeout(() => {
        hideAndDismissAll();
      }, 8000);

      return () => clearTimeout(timer);
    } else {
      // Gizle
      translateY.value = withTiming(100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [changes.length]);

  const hideAndDismissAll = () => {
    translateY.value = withTiming(100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismissAll)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value
  }));

  if (changes.length === 0) return null;

  // Son değişiklik
  const latestChange = changes[changes.length - 1];
  const themeInfo = getThemeInfo(latestChange.themeId);

  return (
    <Animated.View style={[styles.container, { paddingBottom: insets.bottom + 16 }, animatedStyle]}>
      <View style={[styles.banner, { backgroundColor: colors.surface }]}>
        {/* Birden fazla değişiklik varsa */}
        {changes.length > 1 && (
          <Pressable style={styles.hideAllButton} onPress={hideAndDismissAll}>
            <Text style={[styles.hideAllText, { color: colors.textMuted }]}>
              {changes.length} güncellemeyi gizle
            </Text>
          </Pressable>
        )}

        {/* Değişiklik mesajları */}
        {changes.map((change) => {
          const info = getThemeInfo(change.themeId);
          return (
            <View key={change.id} style={styles.changeItem}>
              <Text style={[styles.changeText, { color: colors.textPrimary }]}>
                {change.isOwnChange
                  ? `Temayı ${info.name} olarak değiştirdin.`
                  : `${change.changedBy} temayı ${info.name} olarak değiştirdi.`}
              </Text>
              <Pressable onPress={onChangeTheme}>
                <Text style={[styles.changeAction, { color: colors.accent }]}>Temayı Değiştir</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16
  },
  banner: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  hideAllButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)"
  },
  hideAllText: {
    fontSize: 13,
    fontWeight: "500"
  },
  changeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6
  },
  changeText: {
    fontSize: 14,
    flex: 1,
    marginRight: 12
  },
  changeAction: {
    fontSize: 14,
    fontWeight: "600"
  }
});

export const ThemeChangeBanner = memo(ThemeChangeBannerComponent);
