/**
 * SuggestionsRow Component
 *
 * Amaç: Horizontal profile suggestions - Önerilen profiller
 *
 * Özellikler:
 * - Horizontal scroll
 * - Profile cards
 * - Common interests display
 * - Distance display
 * - Vibe match score
 *
 * Props:
 * - profiles: Profile[] array
 * - onProfilePress: Profile callback
 * - onViewAll: View all callback
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { Heart, MapPin } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface Profile {
  id: string;
  name?: string;
  age?: number;
  avatar_url?: string;
  common_interests?: number;
  distance?: string;
  vibe_match?: number;
}

interface SuggestionsRowProps {
  profiles: Profile[];
  onProfilePress?: (profileId: string) => void;
  onViewAll?: () => void;
}

export function SuggestionsRow({ profiles, onProfilePress, onViewAll }: SuggestionsRowProps) {
  const { colors } = useTheme();

  if (!profiles || profiles.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Önerilen Profiller</Text>
        <Pressable onPress={onViewAll}>
          <Text style={[styles.viewAll, { color: colors.accent }]}>Tümünü Gör</Text>
        </Pressable>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {profiles.map((profile) => (
          <Pressable
            key={profile.id}
            onPress={() => onProfilePress?.(profile.id)}
            style={[styles.profileCard, { backgroundColor: colors.surface }]}
          >
            {/* Avatar */}
            {profile.avatar_url && (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            )}

            {/* Name */}
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile.name}
            </Text>

            {/* Common interests */}
            {profile.common_interests && profile.common_interests > 0 && (
              <View style={styles.interestsRow}>
                <Heart size={12} color={colors.accent} />
                <Text style={[styles.interests, { color: colors.accent }]}>
                  {profile.common_interests} ortak ilgi
                </Text>
              </View>
            )}

            {/* Distance */}
            {profile.distance && (
              <View style={styles.distanceRow}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={[styles.distance, { color: colors.textMuted }]}>
                  {profile.distance}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },
  viewAll: {
    fontSize: 14
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12
  },
  profileCard: {
    width: 120,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center"
  },
  interestsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4
  },
  interests: {
    fontSize: 12
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  distance: {
    fontSize: 12
  }
});
