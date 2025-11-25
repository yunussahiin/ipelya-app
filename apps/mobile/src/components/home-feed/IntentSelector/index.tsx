/**
 * IntentSelector Component
 *
 * Amaç: Dating intent seçici - Kullanıcının ne aradığını belirlemesi
 *
 * Özellikler:
 * - Intent type selection (API entegrasyonu)
 * - Multiple selection support
 * - Visual feedback
 * - Haptic feedback
 * - Theme-aware styling
 *
 * Props:
 * - currentIntents: IntentType[] (optional)
 * - onIntentChange: Intent change callback
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Heart, Users, Coffee, Sparkles, Target } from "lucide-react-native";
import type { IntentType } from "@ipelya/types";
import { useTheme } from "@/theme/ThemeProvider";
import { updateIntent } from "@ipelya/api/home-feed";
import { useAuthStore } from "@/store/auth.store";
import { useQueryClient } from "@tanstack/react-query";

interface IntentSelectorProps {
  currentIntents?: IntentType[];
  onIntentChange?: (intents: IntentType[]) => void;
  maxSelections?: number;
}

const intentTypes: {
  type: IntentType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  emoji: string;
}[] = [
  {
    type: "meet_new",
    label: "Yeni İnsanlar",
    description: "Yeni insanlarla tanışmak istiyorum",
    icon: Users,
    color: "#4ECDC4",
    emoji: "👋"
  },
  {
    type: "activity_partner",
    label: "Aktivite Arkadaşı",
    description: "Birlikte aktivite yapacak biri arıyorum",
    icon: Coffee,
    color: "#F59E0B",
    emoji: "🎯"
  },
  {
    type: "flirt",
    label: "Flört",
    description: "Romantik bir bağlantı arıyorum",
    icon: Heart,
    color: "#FF6B9D",
    emoji: "💕"
  },
  {
    type: "serious_relationship",
    label: "Ciddi İlişki",
    description: "Uzun vadeli bir ilişki arıyorum",
    icon: Sparkles,
    color: "#8B5CF6",
    emoji: "💍"
  }
];

export function IntentSelector({
  currentIntents = [],
  onIntentChange,
  maxSelections = 3
}: IntentSelectorProps) {
  const { colors } = useTheme();
  const { sessionToken } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedIntents, setSelectedIntents] = useState<IntentType[]>(currentIntents);
  const [loading, setLoading] = useState(false);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const accessToken = sessionToken || "";

  // Intent toggle handler
  const handleToggleIntent = async (intent: IntentType) => {
    let newIntents: IntentType[];

    if (selectedIntents.includes(intent)) {
      // Remove
      newIntents = selectedIntents.filter((i) => i !== intent);
    } else {
      // Add (check max)
      if (selectedIntents.length >= maxSelections) {
        Alert.alert("⚠️ Limit", `En fazla ${maxSelections} seçim yapabilirsiniz.`);
        return;
      }
      newIntents = [...selectedIntents, intent];
    }

    Haptics.selectionAsync();
    setSelectedIntents(newIntents);
    setLoading(true);

    try {
      const response = await updateIntent(supabaseUrl, accessToken, {
        intents: newIntents.map((intent, index) => ({
          intent_type: intent,
          priority: newIntents.length - index // Higher priority for first selections
        }))
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onIntentChange?.(newIntents);
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      } else {
        // Rollback
        setSelectedIntents(selectedIntents);
        Alert.alert("❌ Hata", response.error || "Güncellenemedi");
      }
    } catch (error) {
      setSelectedIntents(selectedIntents);
      Alert.alert("❌ Hata", "Bir sorun oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Target size={20} color={colors.accent} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Ne Arıyorsun?</Text>
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </View>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        En fazla {maxSelections} seçim yapabilirsin
      </Text>

      {/* Intent options */}
      <View style={styles.intents}>
        {intentTypes.map((intent) => {
          const Icon = intent.icon;
          const isSelected = selectedIntents.includes(intent.type);

          return (
            <Pressable
              key={intent.type}
              onPress={() => handleToggleIntent(intent.type)}
              disabled={loading}
              style={[
                styles.intentOption,
                { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                isSelected && {
                  borderColor: intent.color,
                  backgroundColor: `${intent.color}15`
                }
              ]}
            >
              <View style={styles.intentHeader}>
                <Icon size={20} color={isSelected ? intent.color : colors.textSecondary} />
                <Text
                  style={[
                    styles.intentLabel,
                    { color: isSelected ? intent.color : colors.textPrimary }
                  ]}
                >
                  {intent.label}
                </Text>
                <Text style={styles.intentEmoji}>{intent.emoji}</Text>
              </View>
              <Text
                style={[
                  styles.intentDescription,
                  { color: isSelected ? intent.color : colors.textMuted }
                ]}
                numberOfLines={1}
              >
                {intent.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected count */}
      <Text style={[styles.selectedCount, { color: colors.textMuted }]}>
        {selectedIntents.length}/{maxSelections} seçildi
      </Text>
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
    fontWeight: "600",
    flex: 1
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16
  },
  intents: {
    gap: 10
  },
  intentOption: {
    padding: 14,
    borderWidth: 2,
    borderRadius: 14
  },
  intentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4
  },
  intentLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1
  },
  intentEmoji: {
    fontSize: 18
  },
  intentDescription: {
    fontSize: 13,
    marginLeft: 30
  },
  selectedCount: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 12
  }
});
