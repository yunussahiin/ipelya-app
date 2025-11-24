/**
 * PostHeader Component
 *
 * Amaç: Post header - Kullanıcı bilgileri, konum, timestamp
 *
 * Özellikler:
 * - Avatar
 * - Name + age
 * - Location (optional)
 * - Timestamp
 * - Menu button
 *
 * Props:
 * - user: PostUser objesi
 * - location: string (optional)
 * - timestamp: string
 * - onUserPress: User callback
 * - onMenuPress: Menu callback
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { MapPin, MoreVertical } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface PostHeaderProps {
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    verified?: boolean;
  };
  location?: string;
  timestamp?: string;
  onUserPress?: () => void;
  onMenuPress?: () => void;
}

export function PostHeader({
  user,
  location,
  timestamp,
  onUserPress,
  onMenuPress
}: PostHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Pressable onPress={onUserPress} style={styles.userInfo}>
        {user?.avatar_url && <Image source={{ uri: user.avatar_url }} style={styles.avatar} />}
        <View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {user?.display_name || "User"}
          </Text>
          {location && (
            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.textMuted} />
              <Text style={[styles.location, { color: colors.textMuted }]}>{location}</Text>
            </View>
          )}
        </View>
      </Pressable>

      <Pressable onPress={onMenuPress}>
        <MoreVertical size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  name: {
    fontSize: 14,
    fontWeight: "600"
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2
  },
  location: {
    fontSize: 12
  }
});
