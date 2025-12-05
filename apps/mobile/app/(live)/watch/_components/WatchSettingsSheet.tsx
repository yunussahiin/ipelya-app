/**
 * Watch Settings Sheet
 * İzleyici ayarları bottom sheet component'i
 */

import React, { forwardRef, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

interface WatchSettingsSheetProps {
  onReport?: () => void;
  onShare?: () => void;
  onQuality?: () => void;
}

interface SettingsItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  rightText?: string;
}

export const WatchSettingsSheet = forwardRef<BottomSheet, WatchSettingsSheetProps>(
  ({ onReport, onShare, onQuality }, ref) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      []
    );

    const settingsItems: SettingsItem[] = [
      {
        icon: "flag-outline",
        label: "Şikayet Et",
        onPress: onReport
      },
      {
        icon: "share-outline",
        label: "Yayını Paylaş",
        onPress: onShare
      },
      {
        icon: "settings-outline",
        label: "Kalite",
        onPress: onQuality,
        rightText: "Otomatik"
      }
    ];

    const handleClose = useCallback(() => {
      if (ref && "current" in ref && ref.current) {
        ref.current.close();
      }
    }, [ref]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["45%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          {/* Menü Öğeleri */}
          {settingsItems.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: colors.border },
                pressed && { opacity: 0.7 }
              ]}
              onPress={() => {
                item.onPress?.();
                handleClose();
              }}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color={colors.accent} />
                <Text style={[styles.menuItemText, { color: colors.textPrimary }]}>
                  {item.label}
                </Text>
              </View>
              {item.rightText && (
                <Text style={[styles.menuItemRightText, { color: colors.textMuted }]}>
                  {item.rightText}
                </Text>
              )}
            </Pressable>
          ))}

          {/* İptal Butonu */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              { backgroundColor: colors.surfaceAlt },
              pressed && { opacity: 0.7 }
            ]}
            onPress={handleClose}
          >
            <Text style={[styles.cancelText, { color: colors.textPrimary }]}>İptal</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

WatchSettingsSheet.displayName = "WatchSettingsSheet";

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500"
  },
  menuItemRightText: {
    fontSize: 14
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600"
  }
});

export default WatchSettingsSheet;
