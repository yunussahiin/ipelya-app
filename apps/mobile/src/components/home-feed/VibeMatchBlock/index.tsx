/**
 * VibeMatchBlock Component
 *
 * Amaç: Mood selector block - Kullanıcının mevcut mood'unu seçmesi
 *
 * Özellikler:
 * - Vibe type selection (API entegrasyonu)
 * - Intensity slider
 * - Visual feedback
 * - Feed filtering
 * - Haptic feedback
 * - Theme-aware styling
 *
 * Props:
 * - currentVibe: VibeType (optional)
 * - onVibeChange: Vibe change callback
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Zap, Wind, Users, Palette, Compass, Sparkles } from "lucide-react-native";
import type { VibeType } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";
import { updateVibe } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";

interface VibeMatchBlockProps {
  currentVibe?: VibeType;
  currentIntensity?: number;
  onVibeChange?: (vibe: VibeType, intensity: number) => void;
}

const vibeTypes: {
  type: VibeType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  emoji: string;
}[] = [
  { type: "energetic", label: "Enerjik", icon: Zap, color: "#FFD43B", emoji: "⚡" },
  { type: "chill", label: "Sakin", icon: Wind, color: "#4ECDC4", emoji: "🌊" },
  { type: "social", label: "Sosyal", icon: Users, color: "#FF6B9D", emoji: "🎉" },
  { type: "creative", label: "Yaratıcı", icon: Palette, color: "#A78BFA", emoji: "🎨" },
  { type: "adventurous", label: "Maceraperest", icon: Compass, color: "#F59E0B", emoji: "🏔️" }
];

export function VibeMatchBlock({
  currentVibe,
  currentIntensity = 3,
  onVibeChange
}: VibeMatchBlockProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(currentVibe || null);
  const [intensity, setIntensity] = useState(currentIntensity);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Vibe select handler
  const handleSelectVibe = async (vibe: VibeType) => {
    if (selectedVibe === vibe) {
      // Deselect
      setSelectedVibe(null);
      return;
    }

    Haptics.selectionAsync();
    setSelectedVibe(vibe);
    setLoading(true);

    try {
      const response = await updateVibe(supabaseUrl, accessToken, {
        vibe_type: vibe,
        intensity
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onVibeChange?.(vibe, intensity);
        // Feed'i yenile
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      } else {
        Alert.alert("❌ Hata", response.error || "Vibe güncellenemedi");
        setSelectedVibe(currentVibe || null);
      }
    } catch (error) {
      Alert.alert("❌ Hata", "Bir sorun oluştu");
      setSelectedVibe(currentVibe || null);
    } finally {
      setLoading(false);
    }
  };

  // Intensity change handler
  const handleIntensityChange = async (value: number) => {
    setIntensity(value);

    if (selectedVibe) {
      try {
        await updateVibe(supabaseUrl, accessToken, {
          vibe_type: selectedVibe,
          intensity: value
        });
        onVibeChange?.(selectedVibe, value);
      } catch (error) {
        console.error("Intensity update error:", error);
      }
    }
  };

  const selectedVibeData = vibeTypes.find((v) => v.type === selectedVibe);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Sparkles size={20} color={colors.accent} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Bugün nasıl hissediyorsun?
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Mood'una göre içerik önerelim
      </Text>

      {/* Vibe options */}
      <View style={styles.vibes}>
        {vibeTypes.map((vibe) => {
          const Icon = vibe.icon;
          const isSelected = selectedVibe === vibe.type;

          return (
            <Pressable
              key={vibe.type}
              onPress={() => handleSelectVibe(vibe.type)}
              disabled={loading}
              style={[
                styles.vibeOption,
                { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                isSelected && {
                  borderColor: vibe.color,
                  backgroundColor: `${vibe.color}20`
                }
              ]}
            >
              {loading && isSelected ? (
                <ActivityIndicator size="small" color={vibe.color} />
              ) : (
                <Icon size={20} color={isSelected ? vibe.color : colors.textSecondary} />
              )}
              <Text
                style={[styles.vibeLabel, { color: isSelected ? vibe.color : colors.textPrimary }]}
              >
                {vibe.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Intensity selector (when vibe selected) */}
      {selectedVibe && selectedVibeData && (
        <View style={styles.intensityContainer}>
          <Text style={[styles.intensityLabel, { color: colors.textSecondary }]}>
            Yoğunluk: {selectedVibeData.emoji}
          </Text>
          <View style={styles.intensityButtons}>
            {[1, 2, 3, 4, 5].map((level) => (
              <Pressable
                key={level}
                onPress={() => handleIntensityChange(level)}
                style={[
                  styles.intensityButton,
                  { borderColor: colors.border },
                  intensity >= level && { backgroundColor: selectedVibeData.color }
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4
  },
  title: {
    fontSize: 17,
    fontWeight: "600"
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16
  },
  vibes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  vibeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 24
  },
  vibeLabel: {
    fontSize: 14,
    fontWeight: "500"
  },
  intensityContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)"
  },
  intensityLabel: {
    fontSize: 14,
    marginBottom: 12
  },
  intensityButtons: {
    flexDirection: "row",
    gap: 8
  },
  intensityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2
  }
});
