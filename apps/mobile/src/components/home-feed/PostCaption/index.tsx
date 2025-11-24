/**
 * PostCaption Component
 *
 * Amaç: Post caption - Mention ve hashtag desteği ile metin
 *
 * Özellikler:
 * - Expandable text (Read more)
 * - Clickable mentions (@username)
 * - Clickable hashtags (#tag)
 * - Interest tags
 *
 * Props:
 * - caption: string
 * - maxLines: number (default: 3)
 * - onMentionPress: Mention callback
 * - onHashtagPress: Hashtag callback
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

interface PostCaptionProps {
  caption: string;
  maxLines?: number;
  onMentionPress?: (username: string) => void;
  onHashtagPress?: (hashtag: string) => void;
}

export function PostCaption({
  caption,
  maxLines = 3,
  onMentionPress,
  onHashtagPress
}: PostCaptionProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);

  // Parse caption for mentions and hashtags
  const parseCaption = (text: string) => {
    const parts = [];
    const regex = /(@\w+)|(#\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index)
        });
      }

      // Add mention or hashtag
      if (match[1]) {
        parts.push({ type: "mention", content: match[1] });
      } else if (match[2]) {
        parts.push({ type: "hashtag", content: match[2] });
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: "text", content: text.substring(lastIndex) });
    }

    return parts;
  };

  const parts = parseCaption(caption);

  return (
    <View style={styles.container}>
      <Text
        style={[styles.caption, { color: colors.textPrimary }]}
        numberOfLines={expanded ? undefined : maxLines}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines.length > maxLines) {
            setNeedsExpansion(true);
          }
        }}
      >
        {parts.map((part, index) => {
          if (part.type === "mention") {
            return (
              <Text
                key={index}
                style={[styles.mention, { color: colors.accent }]}
                onPress={() => onMentionPress?.(part.content.substring(1))}
              >
                {part.content}
              </Text>
            );
          } else if (part.type === "hashtag") {
            return (
              <Text
                key={index}
                style={[styles.hashtag, { color: colors.highlight }]}
                onPress={() => onHashtagPress?.(part.content.substring(1))}
              >
                {part.content}
              </Text>
            );
          } else {
            return <Text key={index}>{part.content}</Text>;
          }
        })}
      </Text>

      {/* Read more button */}
      {needsExpansion && !expanded && (
        <Pressable onPress={() => setExpanded(true)}>
          <Text style={[styles.readMore, { color: colors.textMuted }]}>Devamını oku</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  caption: {
    fontSize: 14,
    lineHeight: 20
  },
  mention: {
    fontWeight: "600"
  },
  hashtag: {
    fontWeight: "600"
  },
  readMore: {
    fontSize: 14,
    marginTop: 4
  }
});
