/**
 * SuggestionsRow Component
 *
 * Amaç: Horizontal profile suggestions - Önerilen profiller
 *
 * Özellikler:
 * - Horizontal scroll
 * - Profile cards (API entegrasyonu)
 * - Common interests display
 * - Distance display
 * - Vibe match score
 * - Auto-fetch on mount
 * - Theme-aware styling
 *
 * Props:
 * - onProfilePress: Profile callback
 * - onViewAll: View all callback
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator
} from "react-native";
import { Heart, MapPin, Sparkles, UserPlus } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { getSuggestions } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";

interface Profile {
  id: string;
  user_id?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  common_interests?: number;
  distance?: string;
  vibe_match?: number;
}

interface SuggestionsRowProps {
  profiles?: Profile[];
  onProfilePress?: (profileId: string) => void;
  onViewAll?: () => void;
}

export function SuggestionsRow({
  profiles: propProfiles,
  onProfilePress,
  onViewAll
}: SuggestionsRowProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>(propProfiles || []);
  const [loading, setLoading] = useState(!propProfiles);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Fetch suggestions on mount
  useEffect(() => {
    if (propProfiles) {
      setProfiles(propProfiles);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await getSuggestions(supabaseUrl, accessToken, { limit: 10 });
        if (response.success && response.data?.profiles) {
          setProfiles(response.data.profiles as Profile[]);
        }
      } catch (error) {
        console.error("Suggestions fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [propProfiles, supabaseUrl, accessToken]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!profiles || profiles.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Sparkles size={18} color={colors.accent} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Önerilen Profiller</Text>
        </View>
        <Pressable onPress={onViewAll} hitSlop={8}>
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
            key={profile.id || profile.user_id}
            onPress={() => onProfilePress?.(profile.user_id || profile.id)}
            style={[styles.profileCard, { backgroundColor: colors.surface }]}
          >
            {/* Avatar */}
            <Image
              source={{
                uri:
                  profile.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${profile.id}`
              }}
              style={styles.avatar}
            />

            {/* Vibe match badge */}
            {profile.vibe_match && profile.vibe_match > 70 && (
              <View style={[styles.vibeBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.vibeBadgeText}>{profile.vibe_match}%</Text>
              </View>
            )}

            {/* Name & Age */}
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile.display_name || profile.username}
            </Text>

            {/* Common interests */}
            {profile.common_interests && profile.common_interests > 0 && (
              <View style={styles.infoRow}>
                <Heart size={12} color={colors.accent} fill={colors.accent} />
                <Text style={[styles.infoText, { color: colors.accent }]}>
                  {profile.common_interests} ortak
                </Text>
              </View>
            )}

            {/* Distance */}
            {profile.distance && (
              <View style={styles.infoRow}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  {profile.distance}
                </Text>
              </View>
            )}

            {/* Follow button */}
            <Pressable style={[styles.followButton, { backgroundColor: colors.accent + "20" }]}>
              <UserPlus size={14} color={colors.accent} />
            </Pressable>
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
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  title: {
    fontSize: 17,
    fontWeight: "600"
  },
  viewAll: {
    fontSize: 14,
    fontWeight: "500"
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12
  },
  profileCard: {
    width: 130,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative"
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10
  },
  vibeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  vibeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    textAlign: "center"
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4
  },
  infoText: {
    fontSize: 12
  },
  followButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 20
  }
});
