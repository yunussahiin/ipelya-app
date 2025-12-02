/**
 * EmojiPickerSheet Component
 *
 * Amaç: Native emoji picker (rn-emoji-keyboard)
 * - Tüm cihaz emojileri
 * - Kategorize edilmiş
 * - Arama, son kullanılanlar, skin tones
 *
 * Tarih: 2025-12-02
 */

import { useCallback } from "react";
import EmojiPicker from "rn-emoji-keyboard";
import type { EmojiType } from "rn-emoji-keyboard";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

interface EmojiPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export function EmojiPickerSheet({ visible, onClose, onSelect }: EmojiPickerSheetProps) {
  const { colors } = useTheme();

  const handleEmojiSelected = useCallback(
    (emoji: EmojiType) => {
      console.log("😊 [EmojiPickerSheet] Emoji picked:", emoji);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(emoji.emoji);
    },
    [onSelect]
  );

  return (
    <EmojiPicker
      open={visible}
      onClose={onClose}
      onEmojiSelected={handleEmojiSelected}
      theme={{
        backdrop: "rgba(0,0,0,0.5)",
        knob: colors.border,
        container: colors.surface,
        header: colors.textPrimary,
        skinTonesContainer: colors.backgroundRaised,
        category: {
          icon: colors.textMuted,
          iconActive: colors.accent,
          container: colors.surface,
          containerActive: colors.accent + "20"
        },
        search: {
          background: colors.backgroundRaised,
          text: colors.textPrimary,
          placeholder: colors.textMuted
        }
      }}
      categoryPosition="top"
      enableSearchBar
      enableRecentlyUsed
      enableCategoryChangeGesture
      categoryOrder={[
        "recently_used",
        "smileys_emotion",
        "people_body",
        "animals_nature",
        "food_drink",
        "travel_places",
        "activities",
        "objects",
        "symbols",
        "flags"
      ]}
      translation={{
        recently_used: "Son Kullanılan",
        smileys_emotion: "Yüzler",
        people_body: "İnsanlar",
        animals_nature: "Hayvanlar",
        food_drink: "Yiyecek",
        travel_places: "Seyahat",
        activities: "Aktiviteler",
        objects: "Objeler",
        symbols: "Semboller",
        flags: "Bayraklar",
        search: "Ara..."
      }}
    />
  );
}

export default EmojiPickerSheet;
