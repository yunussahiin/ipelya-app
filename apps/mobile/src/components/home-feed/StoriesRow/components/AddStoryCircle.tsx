/**
 * AddStoryCircle Component
 *
 * "Hikaye Ekle" butonu.
 * - Kullanıcının avatarı + plus icon
 * - Gradient border
 */

import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Plus, User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/theme";
import type { AddStoryCircleProps } from "../types";

const RING_WIDTH = 2;
const GAP = 2;

function AddStoryCircleComponent({ avatarUrl, onPress, size = 68 }: AddStoryCircleProps) {
  const { colors } = useTheme();

  const avatarSize = size - (RING_WIDTH + GAP) * 2;
  const plusSize = 20;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* Dashed border ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.border,
            borderStyle: "dashed"
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
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
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

      {/* Plus icon */}
      <LinearGradient
        colors={[colors.accent, colors.accentSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.plusContainer,
          {
            width: plusSize,
            height: plusSize,
            borderRadius: plusSize / 2,
            right: 0,
            bottom: 14
          }
        ]}
      >
        <Plus size={12} color="#fff" strokeWidth={3} />
      </LinearGradient>

      {/* Label */}
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        Hikaye Ekle
      </Text>
    </Pressable>
  );
}

export const AddStoryCircle = memo(AddStoryCircleComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: 76,
    marginHorizontal: 4,
    position: "relative"
  },
  ring: {
    alignItems: "center",
    justifyContent: "center",
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
  plusContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000"
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    maxWidth: 72,
    textAlign: "center"
  }
});
