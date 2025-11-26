/**
 * UserSearchItem
 *
 * Amaç: Kullanıcı arama sonucu öğesi
 * Tarih: 2025-11-26
 */

import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";

interface UserSearchItemProps {
  user: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  onPress: () => void;
  disabled?: boolean;
}

export const UserSearchItem = memo(function UserSearchItem({
  user,
  onPress,
  disabled
}: UserSearchItemProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: pressed ? colors.surface : "transparent" },
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Image
        source={{ uri: user.avatar_url || undefined }}
        style={[styles.avatar, { backgroundColor: colors.surface }]}
        contentFit="cover"
        placeholderContentFit="cover"
      />
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{user.display_name}</Text>
        <Text style={[styles.username, { color: colors.textMuted }]}>@{user.username}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  disabled: {
    opacity: 0.5
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: "500"
  },
  username: {
    fontSize: 14,
    marginTop: 2
  }
});
