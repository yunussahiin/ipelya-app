/**
 * VibeMatchBlock Component
 *
 * Amaç: Mood selector block - Kullanıcının mevcut mood'unu seçmesi
 *
 * Özellikler:
 * - Vibe type selection
 * - Intensity slider
 * - Visual feedback
 * - Feed filtering
 *
 * Props:
 * - currentVibe: VibeType (optional)
 * - onVibeSelect: Vibe select callback
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Zap, Wind, Users, Palette, Compass } from "lucide-react-native";
import type { VibeType } from "@ipelya/types";

interface VibeMatchBlockProps {
  currentVibe?: VibeType;
  onVibeSelect?: (vibe: VibeType, intensity: number) => void;
}

const vibeTypes: { type: VibeType; label: string; icon: any; color: string }[] = [
  { type: "energetic", label: "Enerjik", icon: Zap, color: "#FFD43B" },
  { type: "chill", label: "Sakin", icon: Wind, color: "#4ECDC4" },
  { type: "social", label: "Sosyal", icon: Users, color: "#FF6B9D" },
  { type: "creative", label: "Yaratıcı", icon: Palette, color: "#A78BFA" },
  { type: "adventurous", label: "Maceraperest", icon: Compass, color: "#F59E0B" }
];

export function VibeMatchBlock({ currentVibe, onVibeSelect }: VibeMatchBlockProps) {
  const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(currentVibe || null);
  const [intensity, setIntensity] = useState(4);

  // Vibe select handler
  const handleSelectVibe = (vibe: VibeType) => {
    setSelectedVibe(vibe);
    if (onVibeSelect) {
      onVibeSelect(vibe, intensity);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Bugün nasıl hissediyorsun?</Text>
      <Text style={styles.subtitle}>Mood'una göre içerik önerelim</Text>

      {/* Vibe options */}
      <View style={styles.vibes}>
        {vibeTypes.map((vibe) => {
          const Icon = vibe.icon;
          const isSelected = selectedVibe === vibe.type;

          return (
            <Pressable
              key={vibe.type}
              onPress={() => handleSelectVibe(vibe.type)}
              style={[
                styles.vibeOption,
                isSelected && {
                  borderColor: vibe.color,
                  backgroundColor: `${vibe.color}15`
                }
              ]}
            >
              <Icon size={24} color={vibe.color} />
              <Text style={styles.vibeLabel}>{vibe.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: "#6C757D",
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    borderRadius: 20,
    backgroundColor: "#F8F9FA"
  },
  vibeLabel: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "500"
  }
});
