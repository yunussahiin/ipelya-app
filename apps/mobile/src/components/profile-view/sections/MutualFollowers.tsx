/**
 * MutualFollowers Component
 * Shows "Tanıdığın X kişi takip ediyor" with avatar stack
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export interface MutualFollower {
  id: string;
  username: string;
  avatar_url: string;
}

interface MutualFollowersProps {
  followers: MutualFollower[];
  totalMutualCount?: number;
  onPress?: () => void;
}

export function MutualFollowers({ followers, totalMutualCount, onPress }: MutualFollowersProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (followers.length === 0) return null;

  const displayCount = totalMutualCount || followers.length;
  const otherCount = displayCount - followers.length;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Avatar Stack */}
      <View style={styles.avatarStack}>
        {followers.slice(0, 3).map((follower, index) => (
          <View
            key={follower.id}
            style={[styles.avatarWrapper, { marginLeft: index > 0 ? -10 : 0, zIndex: 3 - index }]}
          >
            {follower.avatar_url ? (
              <Image
                source={{ uri: follower.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {follower.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Text */}
      <Text style={styles.text}>
        Tanıdığın{" "}
        <Text style={styles.boldText}>
          {displayCount} {otherCount > 0 ? "diğer " : ""}kişi
        </Text>{" "}
        takip ediyor
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10
    },
    avatarStack: {
      flexDirection: "row",
      alignItems: "center"
    },
    avatarWrapper: {
      borderWidth: 2,
      borderColor: colors.background,
      borderRadius: 14,
      overflow: "hidden"
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12
    },
    avatarPlaceholder: {
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center"
    },
    avatarInitial: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary
    },
    text: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1
    },
    boldText: {
      fontWeight: "600",
      color: colors.textPrimary
    }
  });

export default MutualFollowers;
