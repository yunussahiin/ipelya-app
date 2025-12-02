/**
 * PopularChannelsRow
 *
 * Popüler yayın kanallarını yatay kaydırılabilir şekilde gösterir
 * Gerçek broadcast channel verilerini kullanır
 */

import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ChevronRight, Users } from "lucide-react-native";
import { Image } from "expo-image";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useBroadcastStore } from "@/store/messaging";
import type { BroadcastChannel } from "@ipelya/types";

interface PopularChannelsRowProps {
  title?: string;
  onSeeAll?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const CARD_WIDTH = 200;
const CARD_HEIGHT = 120;

function ChannelCard({ channel }: { channel: BroadcastChannel }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createCardStyles(colors), [colors]);
  const router = useRouter();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/broadcast/${channel.id}`);
  }, [channel.id, router]);

  const formatSubscribers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Cover Image */}
      <Image
        source={{ uri: channel.cover_url || channel.avatar_url || "https://picsum.photos/400/240" }}
        style={styles.coverImage}
        contentFit="cover"
        transition={200}
      />

      {/* Gradient Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Creator Avatar */}
        <Image
          source={{
            uri: channel.creator?.avatar_url || channel.avatar_url || "https://i.pravatar.cc/100"
          }}
          style={styles.avatar}
          contentFit="cover"
        />

        {/* Channel Info */}
        <View style={styles.info}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channel.name}
          </Text>
          <Text style={styles.creatorName} numberOfLines={1}>
            {channel.creator?.display_name || "Creator"}
          </Text>
        </View>

        {/* Subscriber Badge */}
        <View style={styles.subscriberBadge}>
          <Users size={12} color="#fff" />
          <Text style={styles.subscriberCount}>{formatSubscribers(channel.member_count)}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function PopularChannelsRow({
  title = "Popüler Kanallar",
  onSeeAll
}: PopularChannelsRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Store'dan kanalları al (hem kendi kanalları hem üye olunan)
  const myChannels = useBroadcastStore((state) => state.myChannels);
  const joinedChannels = useBroadcastStore((state) => state.joinedChannels);

  // Tüm kanalları birleştir ve member_count'a göre sırala
  const channels = useMemo(() => {
    const allChannels = [...myChannels, ...joinedChannels];
    return allChannels.sort((a, b) => b.member_count - a.member_count).slice(0, 10); // İlk 10 popüler kanal
  }, [myChannels, joinedChannels]);

  const renderItem = useCallback(
    ({ item }: { item: BroadcastChannel }) => <ChannelCard channel={item} />,
    []
  );

  const keyExtractor = useCallback((item: BroadcastChannel) => item.id, []);

  if (channels.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <Pressable style={styles.seeAllButton} onPress={onSeeAll}>
            <Text style={styles.seeAllText}>Tümü</Text>
            <ChevronRight size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      <FlatList
        data={channels}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginTop: 24
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 16
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary
    },
    seeAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2
    },
    seeAllText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 12
    }
  });

const createCardStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: colors.surface
    },
    coverImage: {
      ...StyleSheet.absoluteFillObject
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)"
    },
    content: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      padding: 12,
      gap: 10
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: "#fff"
    },
    info: {
      flex: 1
    },
    channelName: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff"
    },
    creatorName: {
      fontSize: 12,
      color: "rgba(255,255,255,0.8)",
      marginTop: 2
    },
    subscriberBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12
    },
    subscriberCount: {
      fontSize: 11,
      fontWeight: "600",
      color: "#fff"
    }
  });
