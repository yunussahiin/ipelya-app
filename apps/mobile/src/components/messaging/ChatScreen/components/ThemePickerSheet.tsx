/**
 * ThemePickerSheet
 *
 * Amaç: Sohbet teması seçici - Gorhom Bottom Sheet
 * Tarih: 2025-12-02
 */

import { memo, useCallback, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";
import { THEME_LIST, getChatTheme, type ChatTheme, type ChatThemeId } from "@/theme/chatThemes";
import { ChatBackground } from "./ChatBackground";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export interface ThemePickerSheetRef {
  open: () => void;
  close: () => void;
}

interface ThemePickerSheetProps {
  currentTheme: ChatThemeId;
  onSelect: (themeId: ChatThemeId) => Promise<void>;
}

// Tema kartı
function ThemeCard({
  theme,
  isSelected,
  onPress
}: {
  theme: ChatTheme;
  isSelected: boolean;
  onPress: () => void;
}) {
  const hasGradient = theme.colors.backgroundGradient && theme.colors.backgroundGradient.length > 0;

  return (
    <Pressable style={styles.themeCard} onPress={onPress}>
      <View
        style={[
          styles.cardPreview,
          isSelected && { borderColor: theme.colors.accent, borderWidth: 2 }
        ]}
      >
        {hasGradient ? (
          <LinearGradient
            colors={theme.colors.backgroundGradient as [string, string, ...string[]]}
            style={styles.cardBg}
          />
        ) : (
          <View style={[styles.cardBg, { backgroundColor: theme.colors.background }]} />
        )}

        {/* Partikül emoji */}
        {theme.particles && (
          <View style={styles.particlePreview}>
            <Text style={styles.particleEmoji}>{theme.particles.emoji}</Text>
          </View>
        )}

        {/* Tema emoji */}
        <View style={styles.themeEmojiContainer}>
          <Text style={styles.themeEmoji}>{theme.emoji}</Text>
        </View>
      </View>
      <Text style={styles.themeName} numberOfLines={1}>
        {theme.name}
      </Text>
    </Pressable>
  );
}

// Önizleme ekranı
function ThemePreview({
  theme,
  onCancel,
  onApply,
  isLoading
}: {
  theme: ChatTheme;
  onCancel: () => void;
  onApply: () => void;
  isLoading: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.previewContainer}>
      {/* Arka plan */}
      <ChatBackground theme={theme} />

      {/* Header */}
      <View style={[styles.previewHeader, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.previewTitle}>{theme.name} Önizlemesi</Text>
        <Text style={styles.previewSubtitle}>{theme.particles ? "Animasyon" : "Statik"}</Text>
      </View>

      {/* Örnek mesajlar */}
      <View style={styles.previewMessages}>
        {/* Kendi mesajımız */}
        <View style={styles.ownMessageRow}>
          <View
            style={[
              styles.messageBubble,
              styles.ownBubble,
              { backgroundColor: theme.colors.ownBubble }
            ]}
          >
            <Text style={[styles.messageText, { color: theme.colors.ownBubbleText }]}>
              Her tema benzersiz bir deneyim yaratır.
            </Text>
          </View>
        </View>

        <View style={styles.ownMessageRow}>
          <View
            style={[
              styles.messageBubble,
              styles.ownBubble,
              { backgroundColor: theme.colors.ownBubble }
            ]}
          >
            <Text style={[styles.messageText, { color: theme.colors.ownBubbleText }]}>
              Gönderdiğin mesajları bu renkte göreceksin.
            </Text>
          </View>
        </View>

        {/* Zaman */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>06:41</Text>
          <Text style={styles.timeEmoji}>{theme.emoji}</Text>
        </View>

        {/* Karşı tarafın mesajı */}
        <View style={styles.otherMessageRow}>
          <View
            style={[
              styles.messageBubble,
              styles.otherBubble,
              { backgroundColor: theme.colors.otherBubble }
            ]}
          >
            <Text style={[styles.messageText, { color: theme.colors.otherBubbleText }]}>
              Diğer kişilerden aldığın mesajları bu renkte göreceksin.
            </Text>
          </View>
        </View>

        <View style={styles.otherMessageRow}>
          <View
            style={[
              styles.messageBubble,
              styles.otherBubble,
              { backgroundColor: theme.colors.otherBubble }
            ]}
          >
            <Text style={[styles.messageText, { color: theme.colors.otherBubbleText }]}>
              Bu temayı seçmek için Uygula'ya veya diğerlerinin önizlemesini görmek için İptal'e
              dokun.
            </Text>
          </View>
        </View>
      </View>

      {/* Alt butonlar */}
      <View style={[styles.previewButtons, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.previewButton, styles.cancelButton]}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>İptal</Text>
        </Pressable>

        <Pressable
          style={[
            styles.previewButton,
            styles.applyButton,
            { backgroundColor: theme.colors.accent }
          ]}
          onPress={onApply}
          disabled={isLoading}
        >
          <Text style={styles.applyButtonText}>{isLoading ? "Uygulanıyor..." : "Uygula"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ThemePickerSheetComponent = forwardRef<ThemePickerSheetRef, ThemePickerSheetProps>(
  ({ currentTheme, onSelect }, ref) => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [sheetIndex, setSheetIndex] = useState(-1);
    const [previewTheme, setPreviewTheme] = useState<ChatTheme | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Snap points: 50% ve 80%
    const snapPoints = useMemo(() => ["50%", "80%"], []);

    // Ref methods
    useImperativeHandle(ref, () => ({
      open: () => setSheetIndex(0),
      close: () => {
        setSheetIndex(-1);
        setPreviewTheme(null);
      }
    }));

    const handleSheetChange = useCallback((index: number) => {
      setSheetIndex(index);
      if (index === -1) {
        setPreviewTheme(null);
      }
    }, []);

    const handleThemePress = useCallback(
      (theme: ChatTheme) => {
        // Dark/light mode'a göre tema al (app renkleriyle)
        const themeWithMode = getChatTheme(theme.id, isDark, {
          background: colors.background,
          surface: colors.surface,
          accent: colors.accent,
          textPrimary: colors.textPrimary,
          textMuted: colors.textMuted
        });
        setPreviewTheme(themeWithMode);
      },
      [isDark, colors]
    );

    const handleCancelPreview = useCallback(() => {
      setPreviewTheme(null);
    }, []);

    const handleApplyTheme = useCallback(async () => {
      if (!previewTheme) return;

      setIsLoading(true);
      try {
        await onSelect(previewTheme.id);
        setSheetIndex(-1);
        setPreviewTheme(null);
      } catch (error) {
        console.error("[ThemePicker] Apply error:", error);
      } finally {
        setIsLoading(false);
      }
    }, [previewTheme, onSelect]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />
      ),
      []
    );

    // Önizleme modunda full screen göster
    if (previewTheme) {
      return (
        <ThemePreview
          theme={previewTheme}
          onCancel={handleCancelPreview}
          onApply={handleApplyTheme}
          isLoading={isLoading}
        />
      );
    }

    return (
      <BottomSheet
        index={sheetIndex}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted, width: 40 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Tema</Text>
        </View>

        {/* Tema grid */}
        <BottomSheetScrollView
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        >
          {THEME_LIST.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={currentTheme === theme.id}
              onPress={() => handleThemePress(theme)}
            />
          ))}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  // Header
  header: {
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)"
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 16
  },

  // Theme Card
  themeCard: {
    width: CARD_WIDTH,
    marginHorizontal: 4,
    marginBottom: 16
  },
  cardPreview: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative"
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject
  },
  particlePreview: {
    position: "absolute",
    top: 8,
    right: 8
  },
  particleEmoji: {
    fontSize: 20
  },
  themeEmojiContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center"
  },
  themeEmoji: {
    fontSize: 16
  },
  themeName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center"
  },

  // Preview
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100
  },
  previewHeader: {
    alignItems: "center",
    paddingVertical: 16
  },
  previewTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  },
  previewSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 2
  },
  previewMessages: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  ownMessageRow: {
    alignItems: "flex-end",
    marginBottom: 8
  },
  otherMessageRow: {
    alignItems: "flex-start",
    marginBottom: 8
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18
  },
  ownBubble: {
    borderBottomRightRadius: 4
  },
  otherBubble: {
    borderBottomLeftRadius: 4
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
    gap: 6
  },
  timeText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12
  },
  timeEmoji: {
    fontSize: 16
  },
  previewButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12
  },
  previewButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center"
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.15)"
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  applyButton: {},
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});

export const ThemePickerSheet = memo(ThemePickerSheetComponent);
