/**
 * ProfileTabs Component
 * Instagram-style tab bar for profile content
 *
 * Tabs:
 * - Grid (Gönderiler)
 * - Crown (Abonelere Özel) - Creator only
 * - Reels (Videolar)
 * - Reposts (Paylaşımlar)
 * - Tagged (Etiketlenenler)
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Grid3X3, Crown, Play, Repeat2, UserSquare2, Copy } from "lucide-react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { type PostItem } from "../posts/PostsGrid";

// Re-export PostItem for convenience
export type { PostItem };

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============ TYPES ============
export interface MediaItem {
  id?: string;
  media_url: string;
  thumbnail_url?: string;
  media_type?: "image" | "video";
}

export type TabType = "grid" | "exclusive" | "reels" | "reposts" | "tagged";

interface ProfileTabsProps {
  posts: PostItem[];
  exclusivePosts?: PostItem[];
  reels?: PostItem[];
  reposts?: PostItem[];
  taggedPosts?: PostItem[];
  isCreator?: boolean;
  isSubscribed?: boolean;
  username?: string;
  onPostPress?: (post: PostItem, index: number, tab: TabType) => void;
  onSubscribe?: () => void;
}

// ============ MAIN COMPONENT ============
export function ProfileTabs({
  posts,
  exclusivePosts = [],
  reels = [],
  reposts = [],
  taggedPosts = [],
  isCreator = false,
  isSubscribed = false,
  username = "",
  onPostPress,
  onSubscribe
}: ProfileTabsProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<TabType>("grid");
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const tabs: { type: TabType; icon: React.ReactNode; show: boolean }[] = [
    {
      type: "grid",
      icon: (
        <Grid3X3
          size={22}
          color={activeTab === "grid" ? colors.textPrimary : colors.textSecondary}
        />
      ),
      show: true
    },
    {
      type: "exclusive",
      icon: (
        <Crown
          size={22}
          color={activeTab === "exclusive" ? colors.textPrimary : colors.textSecondary}
        />
      ),
      show: isCreator
    },
    {
      type: "reels",
      icon: (
        <Play size={22} color={activeTab === "reels" ? colors.textPrimary : colors.textSecondary} />
      ),
      show: true
    },
    {
      type: "reposts",
      icon: (
        <Repeat2
          size={22}
          color={activeTab === "reposts" ? colors.textPrimary : colors.textSecondary}
        />
      ),
      show: true
    },
    {
      type: "tagged",
      icon: (
        <UserSquare2
          size={22}
          color={activeTab === "tagged" ? colors.textPrimary : colors.textSecondary}
        />
      ),
      show: true
    }
  ];

  const visibleTabs = tabs.filter((t) => t.show);
  const tabWidth = SCREEN_WIDTH / visibleTabs.length;

  const handleTabPress = useCallback(
    (tab: TabType, index: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(tab);

      Animated.spring(indicatorAnim, {
        toValue: index * tabWidth,
        useNativeDriver: true,
        tension: 300,
        friction: 30
      }).start();
    },
    [indicatorAnim, tabWidth]
  );

  const renderContent = () => {
    switch (activeTab) {
      case "grid":
        return <PostsGridContent posts={posts} onPostPress={onPostPress} colors={colors} />;
      case "exclusive":
        return (
          <ExclusiveContent
            posts={exclusivePosts}
            isSubscribed={isSubscribed}
            username={username}
            onSubscribe={onSubscribe}
            onPostPress={onPostPress}
            colors={colors}
          />
        );
      case "reels":
        return <ReelsContent reels={reels} onPostPress={onPostPress} colors={colors} />;
      case "reposts":
        return <RepostsContent reposts={reposts} onPostPress={onPostPress} colors={colors} />;
      case "tagged":
        return <TaggedContent posts={taggedPosts} onPostPress={onPostPress} colors={colors} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {visibleTabs.map((tab, index) => (
          <Pressable
            key={tab.type}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => handleTabPress(tab.type, index)}
          >
            {tab.icon}
          </Pressable>
        ))}
        {/* Animated Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              transform: [{ translateX: indicatorAnim }]
            }
          ]}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

// ============ GRID CONTENT ============
function PostsGridContent({
  posts,
  onPostPress,
  colors
}: {
  posts: PostItem[];
  onPostPress?: (post: PostItem, index: number, tab: TabType) => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createGridStyles(colors), [colors]);

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Grid3X3 size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Henüz gönderi yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post, index) => (
        <Pressable
          key={post.id}
          style={styles.item}
          onPress={() => onPostPress?.(post, index, "grid")}
        >
          {post.media[0] && (
            <Image
              source={{ uri: post.media[0].thumbnail_url || post.media[0].media_url }}
              style={styles.image}
              contentFit="cover"
            />
          )}

          {/* Multi-media indicator */}
          {post.media.length > 1 && (
            <View style={styles.multiIndicator}>
              <Copy size={14} color="#FFFFFF" />
            </View>
          )}

          {/* Video indicator */}
          {post.media[0]?.media_type === "video" && (
            <View style={styles.videoIndicator}>
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
            </View>
          )}

          {/* Recently viewed badge */}
          {post.recently_viewed && (
            <View style={styles.viewedBadge}>
              <Text style={styles.viewedText}>Az önce görüldü</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ============ EXCLUSIVE CONTENT ============
function ExclusiveContent({
  posts,
  isSubscribed,
  username,
  onSubscribe,
  onPostPress,
  colors
}: {
  posts: PostItem[];
  isSubscribed: boolean;
  username: string;
  onSubscribe?: () => void;
  onPostPress?: (post: PostItem, index: number, tab: TabType) => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createExclusiveStyles(colors), [colors]);

  if (!isSubscribed) {
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.lockIconContainer}>
          <Crown size={48} color={colors.textSecondary} />
        </View>
        <Text style={styles.lockedTitle}>Abonelere özel</Text>
        <Text style={styles.lockedDescription}>
          Özel içeriklere erişmek için {username} abonesi ol.
        </Text>
        <Pressable style={styles.subscribeButton} onPress={onSubscribe}>
          <Text style={styles.subscribeText}>Abone Ol</Text>
        </Pressable>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Crown size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Henüz özel içerik yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post, index) => (
        <Pressable
          key={post.id}
          style={styles.item}
          onPress={() => onPostPress?.(post, index, "exclusive")}
        >
          {post.media[0] && (
            <Image
              source={{ uri: post.media[0].thumbnail_url || post.media[0].media_url }}
              style={styles.image}
              contentFit="cover"
            />
          )}
          <View style={styles.exclusiveBadge}>
            <Crown size={12} color="#FFD700" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ============ REELS CONTENT ============
function ReelsContent({
  reels,
  onPostPress,
  colors
}: {
  reels: PostItem[];
  onPostPress?: (post: PostItem, index: number, tab: TabType) => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createReelsStyles(colors), [colors]);

  if (reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Play size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Henüz video yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {reels.map((reel, index) => (
        <Pressable
          key={reel.id}
          style={styles.item}
          onPress={() => onPostPress?.(reel, index, "reels")}
        >
          {reel.media[0] && (
            <Image
              source={{ uri: reel.media[0].thumbnail_url || reel.media[0].media_url }}
              style={styles.image}
              contentFit="cover"
            />
          )}
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.gradient} />
          <View style={styles.viewsContainer}>
            <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.viewsText}>{formatNumber(reel.views_count || 0)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ============ REPOSTS CONTENT ============
function RepostsContent({
  reposts,
  onPostPress,
  colors
}: {
  reposts: PostItem[];
  onPostPress?: (post: PostItem, index: number, tab: TabType) => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createGridStyles(colors), [colors]);

  if (reposts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Repeat2 size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Henüz paylaşım yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {reposts.map((post, index) => (
        <Pressable
          key={post.id}
          style={styles.item}
          onPress={() => onPostPress?.(post, index, "reposts")}
        >
          {post.media[0] && (
            <Image
              source={{ uri: post.media[0].thumbnail_url || post.media[0].media_url }}
              style={styles.image}
              contentFit="cover"
            />
          )}
          <View style={styles.repostIndicator}>
            <Repeat2 size={14} color="#FFFFFF" />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ============ TAGGED CONTENT ============
function TaggedContent({
  posts,
  onPostPress,
  colors
}: {
  posts: PostItem[];
  onPostPress?: (post: PostItem, index: number, tab: TabType) => void;
  colors: ThemeColors;
}) {
  const styles = useMemo(() => createGridStyles(colors), [colors]);

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <UserSquare2 size={48} color={colors.textSecondary} />
        <Text style={styles.emptyText}>Etiketlenen gönderi yok</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {posts.map((post, index) => (
        <Pressable
          key={post.id}
          style={styles.item}
          onPress={() => onPostPress?.(post, index, "tagged")}
        >
          {post.media[0] && (
            <Image
              source={{ uri: post.media[0].thumbnail_url || post.media[0].media_url }}
              style={styles.image}
              contentFit="cover"
            />
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ============ HELPERS ============
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

// ============ STYLES ============
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 16
    },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: "relative"
    },
    tab: {
      height: 48,
      justifyContent: "center",
      alignItems: "center"
    },
    indicator: {
      position: "absolute",
      bottom: 0,
      height: 2,
      backgroundColor: colors.textPrimary
    },
    content: {
      flex: 1,
      minHeight: 300
    }
  });

const createGridStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2,
      padding: 1
    },
    item: {
      width: (SCREEN_WIDTH - 6) / 3,
      aspectRatio: 1,
      backgroundColor: colors.surface
    },
    image: {
      width: "100%",
      height: "100%"
    },
    multiIndicator: {
      position: "absolute",
      top: 8,
      right: 8
    },
    videoIndicator: {
      position: "absolute",
      top: 8,
      right: 8
    },
    repostIndicator: {
      position: "absolute",
      top: 8,
      right: 8
    },
    viewedBadge: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: [{ translateY: -10 }],
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4
    },
    viewedText: {
      fontSize: 10,
      color: "#FFFFFF",
      fontWeight: "500"
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      gap: 12
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary
    }
  });

const createExclusiveStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2,
      padding: 1
    },
    item: {
      width: (SCREEN_WIDTH - 6) / 3,
      aspectRatio: 1,
      backgroundColor: colors.surface
    },
    image: {
      width: "100%",
      height: "100%"
    },
    exclusiveBadge: {
      position: "absolute",
      top: 8,
      right: 8
    },
    lockedContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 40,
      gap: 12
    },
    lockIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8
    },
    lockedTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary
    },
    lockedDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20
    },
    subscribeButton: {
      marginTop: 8
    },
    subscribeText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.accent
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      gap: 12
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary
    }
  });

const createReelsStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2,
      padding: 1
    },
    item: {
      width: (SCREEN_WIDTH - 6) / 3,
      aspectRatio: 9 / 16,
      backgroundColor: colors.surface,
      borderRadius: 4,
      overflow: "hidden"
    },
    image: {
      width: "100%",
      height: "100%"
    },
    gradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 40
    },
    viewsContainer: {
      position: "absolute",
      bottom: 8,
      left: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4
    },
    viewsText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FFFFFF"
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
      gap: 12
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary
    }
  });

export default ProfileTabs;
