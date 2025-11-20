/**
 * Followers Search Bar Component
 * Search followers/following by name or username
 */

import { useMemo, useCallback } from "react";
import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Search, X } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export interface FollowersSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function FollowersSearchBar({
  value,
  onChangeText,
  placeholder = "Takipçi ara..."
}: FollowersSearchBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleClear = useCallback(() => {
    onChangeText("");
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        accessible={true}
        accessibilityLabel="Takipçi ara"
        accessibilityRole="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={handleClear}
          accessible={true}
          accessibilityLabel="Aramayı temizle"
          accessibilityRole="button"
        >
          <X size={20} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginHorizontal: 16,
      marginVertical: 12,
      borderWidth: 1,
      borderColor: colors.border
    },
    searchIcon: {
      marginRight: 8
    },
    input: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.textPrimary,
      fontFamily: "System"
    }
  });
