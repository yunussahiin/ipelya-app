/**
 * AboutSection Component
 * Extended bio section with expandable text
 */

import { useState, useMemo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

interface AboutSectionProps {
  bio?: string | null;
  maxLines?: number;
  showToggle?: boolean;
}

export function AboutSection({ bio, maxLines = 3, showToggle = true }: AboutSectionProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const handleTextLayout = useCallback(
    (e: { nativeEvent: { lines: unknown[] } }) => {
      if (e.nativeEvent.lines.length > maxLines) {
        setShowMore(true);
      }
    },
    [maxLines]
  );

  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  if (!bio) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hakkında</Text>

      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <Text
          style={styles.bioText}
          numberOfLines={expanded ? undefined : maxLines}
          onTextLayout={handleTextLayout}
        >
          {bio}
        </Text>
      </Animated.View>

      {showToggle && showMore && (
        <Pressable style={styles.toggleButton} onPress={toggleExpanded}>
          <Text style={styles.toggleText}>{expanded ? "Daha az göster" : "Devamını oku"}</Text>
          {expanded ? (
            <ChevronUp size={16} color={colors.accent} />
          ) : (
            <ChevronDown size={16} color={colors.accent} />
          )}
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4
    },
    bioText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary
    },
    toggleButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingTop: 4
    },
    toggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accent
    }
  });

export default AboutSection;
