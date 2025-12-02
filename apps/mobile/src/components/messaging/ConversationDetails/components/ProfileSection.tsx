/**
 * ProfileSection
 * Amaç: Profil resmi ve isim bölümü
 */

import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/theme/ThemeProvider";

interface ProfileSectionProps {
  avatarUrl?: string | null;
  displayName: string;
  isOnline?: boolean;
}

export function ProfileSection({ avatarUrl, displayName, isOnline }: ProfileSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: avatarUrl || undefined }}
          style={[styles.avatar, { backgroundColor: colors.surface }]}
          contentFit="cover"
        />
        {isOnline && <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />}
      </View>

      {/* Name */}
      <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#050505"
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700"
  }
});
