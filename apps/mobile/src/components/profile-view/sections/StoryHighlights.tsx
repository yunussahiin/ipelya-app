/**
 * StoryHighlights Component
 * Horizontal scrollable story highlights row
 */

import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export interface Highlight {
  id: string;
  title: string;
  cover_url: string;
  stories_count: number;
}

interface StoryHighlightsProps {
  highlights: Highlight[];
  isOwnProfile?: boolean;
  onHighlightPress?: (highlight: Highlight) => void;
  onAddPress?: () => void;
}

export function StoryHighlights({
  highlights,
  isOwnProfile = false,
  onHighlightPress,
  onAddPress
}: StoryHighlightsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePress = (highlight: Highlight) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onHighlightPress?.(highlight);
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddPress?.();
  };

  if (highlights.length === 0 && !isOwnProfile) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {/* Add New Highlight - Only for own profile */}
      {isOwnProfile && (
        <Pressable style={styles.item} onPress={handleAddPress}>
          <View style={styles.addCircle}>
            <Plus size={24} color={colors.textSecondary} />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            Yeni
          </Text>
        </Pressable>
      )}

      {/* Highlights */}
      {highlights.map((highlight) => (
        <Pressable key={highlight.id} style={styles.item} onPress={() => handlePress(highlight)}>
          <View style={styles.circleWrapper}>
            <LinearGradient
              colors={["#833AB4", "#FD1D1D", "#F77737"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            >
              <View style={styles.innerCircle}>
                <Image
                  source={{ uri: highlight.cover_url }}
                  style={styles.coverImage}
                  contentFit="cover"
                />
              </View>
            </LinearGradient>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {highlight.title}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 16
    },
    item: {
      alignItems: "center",
      width: 72
    },
    circleWrapper: {
      width: 68,
      height: 68,
      marginBottom: 6
    },
    gradientRing: {
      width: 68,
      height: 68,
      borderRadius: 34,
      padding: 2,
      justifyContent: "center",
      alignItems: "center"
    },
    innerCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.background,
      padding: 2,
      overflow: "hidden"
    },
    coverImage: {
      width: "100%",
      height: "100%",
      borderRadius: 30
    },
    addCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6
    },
    title: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      maxWidth: 72
    }
  });

export default StoryHighlights;
