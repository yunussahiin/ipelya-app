/**
 * ThemeChangeBanner
 *
 * Amaç: Tema değişiklik bildirimi - Mesaj listesi içinde gösterilir
 * Tarih: 2025-12-02
 */

import { memo, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { getThemeInfo, type ChatThemeId } from "@/theme/chatThemes";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BANNER_SEEN_KEY = "theme_banner_seen_";
const BANNER_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika

interface ThemeChangeItem {
  id: string;
  themeId: ChatThemeId;
  changedBy: string;
  isOwnChange: boolean;
  timestamp: number;
}

interface ThemeChangeBannerProps {
  conversationId: string;
  changes: ThemeChangeItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

function ThemeChangeBannerComponent({
  conversationId,
  changes,
  onDismiss,
  onDismissAll
}: ThemeChangeBannerProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const height = useSharedValue(1);

  // Banner'ı daha önce görmüş mü kontrol et
  useEffect(() => {
    const checkSeen = async () => {
      if (changes.length === 0) return;

      const lastChange = changes[changes.length - 1];
      const key = `${BANNER_SEEN_KEY}${conversationId}_${lastChange.id}`;
      const seenAt = await AsyncStorage.getItem(key);

      if (seenAt) {
        const seenTime = parseInt(seenAt, 10);
        // 5 dakika geçmişse gizle
        if (Date.now() - seenTime > BANNER_EXPIRY_MS) {
          setIsVisible(false);
          onDismissAll();
        }
      } else {
        // İlk kez görüyor, kaydet
        await AsyncStorage.setItem(key, Date.now().toString());

        // 5 dakika sonra otomatik gizle
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismissAll();
        }, BANNER_EXPIRY_MS);

        return () => clearTimeout(timer);
      }
    };

    checkSeen();
  }, [changes, conversationId, onDismissAll]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    height.value = withTiming(isExpanded ? 0 : 1, { duration: 200 });
  }, [isExpanded, height]);

  const handleChangeTheme = useCallback(() => {
    // Detay sayfasına git (oradan sheet açılacak)
    router.push(`/(messages)/${conversationId}/details`);
  }, [router, conversationId]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    maxHeight: height.value * 200
  }));

  if (changes.length === 0 || !isVisible) return null;

  return (
    <View style={[styles.container, { backgroundColor: "rgba(0,0,0,0.3)" }]}>
      {/* Gizle/Göster butonu */}
      {changes.length > 0 && (
        <Pressable style={styles.toggleButton} onPress={toggleExpand}>
          <Text style={[styles.toggleText, { color: colors.textMuted }]}>
            {isExpanded
              ? `${changes.length} güncellemeyi gizle`
              : `${changes.length} güncellemeyi göster`}
          </Text>
        </Pressable>
      )}

      {/* Değişiklik mesajları */}
      <Animated.View style={[styles.changesContainer, animatedStyle]}>
        {changes.map((change) => {
          const info = getThemeInfo(change.themeId);
          return (
            <View key={change.id} style={styles.changeItem}>
              <Text style={[styles.changeText, { color: colors.textSecondary }]}>
                {change.isOwnChange
                  ? `Temayı ${info.name} olarak değiştirdin.`
                  : `${change.changedBy} temayı ${info.name} olarak değiştirdi.`}{" "}
                <Text
                  style={[styles.changeAction, { color: colors.accent }]}
                  onPress={handleChangeTheme}
                >
                  Temayı Değiştir
                </Text>
              </Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden"
  },
  toggleButton: {
    alignItems: "center",
    paddingVertical: 10
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "500"
  },
  changesContainer: {
    overflow: "hidden"
  },
  changeItem: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  changeText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17
  },
  changeAction: {
    fontWeight: "600"
  }
});

export const ThemeChangeBanner = memo(ThemeChangeBannerComponent);
