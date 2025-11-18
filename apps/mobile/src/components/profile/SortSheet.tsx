/**
 * Sort Bottom Sheet Component
 * Displays sorting options for following list
 */

import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Modal, SafeAreaView } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

type SortOption = "default" | "newest" | "oldest";

export interface SortSheetProps {
  visible: boolean;
  selectedSort: SortOption;
  onSelect: (sort: SortOption) => void;
  onClose: () => void;
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "default", label: "Varsayılan" },
  { value: "newest", label: "Takip Etme Tarihi: En Yeni" },
  { value: "oldest", label: "Takip Etme Tarihi: En Eski" }
];

export function SortSheet({ visible, selectedSort, onSelect, onClose }: SortSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={15} style={styles.overlay}>
        <Pressable
          style={[styles.overlayPressable, { backgroundColor: "rgba(0, 0, 0, 0.2)" }]}
          onPress={onClose}
        />
        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>Sırala</Text>

            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, selectedSort === option.value && styles.optionActive]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
                accessible={true}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedSort === option.value }}
              >
                <View style={styles.optionContent}>
                  <Text
                    style={[
                      styles.optionText,
                      selectedSort === option.value && styles.optionTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedSort === option.value && (
                    <View style={[styles.checkmark, { backgroundColor: colors.accent }]} />
                  )}
                </View>
              </Pressable>
            ))}

            <Pressable
              style={[styles.cancelButton, { borderTopColor: colors.border }]}
              onPress={onClose}
              accessible={true}
              accessibilityLabel="İptal"
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </BlurView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end"
    },
    overlayPressable: {
      flex: 1
    },
    sheet: {
      borderRadius: 24,
      marginHorizontal: 12,
      marginBottom: 12,
      paddingHorizontal: 0,
      paddingTop: 20,
      paddingBottom: 24
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 24
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 20,
      paddingHorizontal: 16
    },
    option: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 8,
      marginHorizontal: 16
    },
    optionActive: {
      backgroundColor: `${colors.accent}15`
    },
    optionContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12
    },
    optionText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500",
      flex: 1
    },
    optionTextActive: {
      color: colors.accent,
      fontWeight: "600"
    },
    checkmark: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      flexShrink: 0
    },
    cancelButton: {
      marginTop: 20,
      marginHorizontal: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 48
    },
    cancelText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    }
  });
