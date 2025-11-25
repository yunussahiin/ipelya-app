/**
 * PostsGrid Component
 * Grid view for profile posts
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Grid3X3, Heart } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export interface PostItem {
  id: string;
  caption: string;
  media: {
    id?: string;
    media_url: string;
    thumbnail_url?: string;
    media_type?: "image" | "video";
  }[];
  likes_count: number;
  comments_count: number;
  views_count?: number;
  post_type?: "normal" | "vibe" | "reels";
  is_exclusive?: boolean;
  recently_viewed?: boolean;
}

interface PostsGridProps {
  posts: PostItem[];
  onPostPress?: (post: PostItem, index: number) => void;
}

export function PostsGrid({ posts, onPostPress }: PostsGridProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (posts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Grid3X3 size={18} color={colors.textSecondary} />
        <Text style={styles.title}>Gönderiler</Text>
      </View>
      <View style={styles.grid}>
        {posts.map((post, index) => (
          <Pressable key={post.id} style={styles.item} onPress={() => onPostPress?.(post, index)}>
            {post.media[0] && (
              <Image
                source={{ uri: post.media[0].thumbnail_url || post.media[0].media_url }}
                style={styles.image}
                contentFit="cover"
              />
            )}
            <View style={styles.overlay}>
              <Heart size={12} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.likes}>{post.likes_count}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      paddingHorizontal: 16
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    },
    title: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSecondary
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2
    },
    item: {
      width: "32.6%",
      aspectRatio: 1,
      borderRadius: 4,
      overflow: "hidden",
      backgroundColor: colors.surface
    },
    image: {
      width: "100%",
      height: "100%"
    },
    overlay: {
      position: "absolute",
      bottom: 4,
      left: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.6)"
    },
    likes: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FFFFFF"
    }
  });
