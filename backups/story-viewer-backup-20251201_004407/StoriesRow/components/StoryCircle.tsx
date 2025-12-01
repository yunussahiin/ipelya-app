/**
 * StoryCircle Component
 *
 * Tek bir kullanıcının hikaye dairesi.
 * - Avatar gösterir
 * - Görüntülenmemiş hikayeler: Gradient ring
 * - Görüntülenmiş hikayeler: Gray ring
 * - Username (truncated)
 */

import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { User, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme";
import type { StoryCircleProps } from "../types";

const RING_WIDTH = 2.5;
const GAP = 2;

function StoryCircleComponent({
  user,
  onPress,
  onAddPress,
  size = 68,
  isOwn = false,
  showAddButton = false
}: StoryCircleProps) {
  const { colors } = useTheme();

  const avatarSize = size - (RING_WIDTH + GAP) * 2;
  const hasUnviewed = user.has_unviewed;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Ring - Gradient for unviewed, gray for viewed */}
      {hasUnviewed ? (
        <LinearGradient
          colors={[colors.accent, colors.accentSoft, colors.highlight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
        >
          <View
            style={[
              styles.avatarContainer,
              {
                width: avatarSize + GAP * 2,
                height: avatarSize + GAP * 2,
                borderRadius: (avatarSize + GAP * 2) / 2,
                backgroundColor: colors.background
              }
            ]}
          >
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={[
                  styles.avatar,
                  { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
                ]}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.placeholderAvatar,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: colors.surface
                  }
                ]}
              >
                <User size={avatarSize * 0.5} color={colors.textMuted} />
              </View>
            )}
          </View>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.ring,
            styles.viewedRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: colors.borderMuted
            }
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              {
                width: avatarSize + GAP * 2,
                height: avatarSize + GAP * 2,
                borderRadius: (avatarSize + GAP * 2) / 2,
                backgroundColor: colors.background
              }
            ]}
          >
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={[
                  styles.avatar,
                  { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
                ]}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.placeholderAvatar,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                    backgroundColor: colors.surface
                  }
                ]}
              >
                <User size={avatarSize * 0.5} color={colors.textMuted} />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Plus icon for adding more stories (only for own story) */}
      {showAddButton && onAddPress && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onAddPress();
          }}
          style={[styles.plusContainer, { borderColor: colors.background }]}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.plusGradient}
          >
            <Plus size={12} color="#fff" strokeWidth={3} />
          </LinearGradient>
        </Pressable>
      )}

      {/* Username */}
      <Text
        style={[styles.username, { color: isOwn ? colors.accent : colors.textSecondary }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {isOwn ? "Hikayem" : user.username}
      </Text>
    </Pressable>
  );
}

export const StoryCircle = memo(StoryCircleComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 76,
    marginHorizontal: 4
  },
  ring: {
    alignItems: "center",
    justifyContent: "center"
  },
  viewedRing: {
    borderWidth: RING_WIDTH
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  avatar: {
    backgroundColor: "#1a1a1a"
  },
  placeholderAvatar: {
    alignItems: "center",
    justifyContent: "center"
  },
  username: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    maxWidth: 72,
    textAlign: "center"
  },
  plusContainer: {
    position: "absolute",
    right: 0,
    bottom: 14,
    borderWidth: 2,
    borderRadius: 10
  },
  plusGradient: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  }
});
