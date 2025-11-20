/**
 * Followers Filter & Sort Sheet Component
 * Filter and sort followers/following list
 */

import { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export type FilterType = "all" | "mutual" | "recent" | "verified";
export type SortType = "default" | "a-z" | "z-a";

export interface FollowersFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedSort: SortType;
  onSortChange: (sort: SortType) => void;
}

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "Tümü", value: "all" },
  { label: "Karşılıklı Takipçiler", value: "mutual" },
  { label: "Yeni Takipçiler", value: "recent" },
  { label: "Doğrulanmış Kullanıcılar", value: "verified" }
];

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: "Varsayılan", value: "default" },
  { label: "A-Z", value: "a-z" },
  { label: "Z-A", value: "z-a" }
];

export function FollowersFilterSheet({
  visible,
  onClose,
  selectedFilter,
  onFilterChange,
  selectedSort,
  onSortChange
}: FollowersFilterSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleFilterSelect = useCallback(
    (filter: FilterType) => {
      onFilterChange(filter);
    },
    [onFilterChange]
  );

  const handleSortSelect = useCallback(
    (sort: SortType) => {
      onSortChange(sort);
    },
    [onSortChange]
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={15} style={styles.overlay}>
        <Pressable
          style={[styles.overlayPressable, { backgroundColor: "rgba(0, 0, 0, 0.2)" }]}
          onPress={onClose}
        />
      </BlurView>

      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.handle} />
        <Pressable onPress={(e) => e.stopPropagation()}>
          {/* Filter Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filtrele</Text>
            {FILTER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, selectedFilter === option.value && styles.optionActive]}
                onPress={() => handleFilterSelect(option.value)}
                accessible={true}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedFilter === option.value }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedFilter === option.value && styles.optionTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Sort Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sırala</Text>
            {SORT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.option, selectedSort === option.value && styles.optionActive]}
                onPress={() => handleSortSelect(option.value)}
                accessible={true}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedSort === option.value }}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedSort === option.value && styles.optionTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Close Button */}
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Kapat"
            accessibilityRole="button"
          >
            <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>Kapat</Text>
          </Pressable>
        </Pressable>
      </View>
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
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
      maxHeight: "80%"
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 24
    },
    section: {
      marginBottom: 24
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 12
    },
    option: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: "transparent"
    },
    optionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent
    },
    optionText: {
      fontSize: 14,
      color: colors.textPrimary
    },
    optionTextActive: {
      color: "#fff",
      fontWeight: "600"
    },
    closeButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 12
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: "600"
    }
  });
