/**
 * SocialLinks Component
 * Display external social media links
 */

import { useMemo, useCallback } from "react";
import { Linking, Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { Instagram, Twitter, Youtube, Globe, Link2, ExternalLink } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export interface SocialLink {
  id: string;
  type: "instagram" | "twitter" | "youtube" | "website" | "other";
  url: string;
  label?: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  compact?: boolean;
}

const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  website: Globe,
  other: Link2
};

const SOCIAL_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  twitter: "#1DA1F2",
  youtube: "#FF0000",
  website: "#6366F1",
  other: "#8B5CF6"
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  twitter: "Twitter",
  youtube: "YouTube",
  website: "Website",
  other: "Link"
};

export function SocialLinks({ links, compact = false }: SocialLinksProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, compact), [colors, compact]);

  const handlePress = useCallback(async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  }, []);

  if (!links || links.length === 0) return null;

  const extractDisplayUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.compactContainer}
        contentContainerStyle={styles.compactContent}
      >
        {links.map((link) => {
          const Icon = SOCIAL_ICONS[link.type] || Link2;
          const color = SOCIAL_COLORS[link.type] || colors.accent;

          return (
            <Pressable
              key={link.id}
              style={[styles.compactItem, { borderColor: color }]}
              onPress={() => handlePress(link.url)}
            >
              <Icon size={18} color={color} />
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bağlantılar</Text>

      <View style={styles.linksContainer}>
        {links.map((link) => {
          const Icon = SOCIAL_ICONS[link.type] || Link2;
          const color = SOCIAL_COLORS[link.type] || colors.accent;
          const label = link.label || SOCIAL_LABELS[link.type] || "Link";

          return (
            <Pressable key={link.id} style={styles.linkItem} onPress={() => handlePress(link.url)}>
              <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Icon size={20} color={color} />
              </View>
              <View style={styles.linkInfo}>
                <Text style={styles.linkLabel}>{label}</Text>
                <Text style={styles.linkUrl} numberOfLines={1}>
                  {extractDisplayUrl(link.url)}
                </Text>
              </View>
              <ExternalLink size={16} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, compact: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary
    },
    linksContainer: {
      gap: 8
    },
    linkItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center"
    },
    linkInfo: {
      flex: 1,
      gap: 2
    },
    linkLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    },
    linkUrl: {
      fontSize: 12,
      color: colors.textSecondary
    },
    // Compact styles
    compactContainer: {
      marginHorizontal: compact ? 0 : 16
    },
    compactContent: {
      gap: 8,
      paddingHorizontal: 16
    },
    compactItem: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1
    }
  });

export default SocialLinks;
