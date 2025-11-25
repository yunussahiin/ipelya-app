import { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import {
  HeroSlider,
  TrendingCreatorsRow,
  RisingStarsGrid,
  CategoryChips,
  ForYouSection,
  DiscoverySkeleton,
  MOCK_CREATORS,
  MOCK_HERO_SLIDES,
  type CreatorCategory
} from "@/components/creator-discovery";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function CreatorDiscoveryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const [isLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CreatorCategory>("all");

  // Mock data - gerçek implementasyonda hook'tan gelecek
  const trendingCreators = MOCK_CREATORS.slice(0, 5);
  const risingStars = MOCK_CREATORS.slice(2, 6);
  const forYouCreators = MOCK_CREATORS.slice(3, 7);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  }, []);

  const handleFollow = useCallback((creatorId: string) => {
    console.log("Follow creator:", creatorId);
    // TODO: Implement follow logic
  }, []);

  const handleCategorySelect = useCallback((category: CreatorCategory) => {
    setSelectedCategory(category);
    // TODO: Filter creators by category
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <DiscoverySkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Keşfet</Text>
          <Text style={styles.subtitle}>En popüler içerik üreticilerini keşfet</Text>
        </View>

        {/* Hero Slider */}
        <HeroSlider slides={MOCK_HERO_SLIDES} />

        {/* Category Chips */}
        <CategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />

        {/* Trending Creators */}
        <TrendingCreatorsRow
          creators={trendingCreators}
          title="Trend Olanlar"
          onSeeAll={() => console.log("See all trending")}
        />

        {/* Rising Stars Grid */}
        <RisingStarsGrid
          creators={risingStars}
          title="Yükselen Yıldızlar"
          onSeeAll={() => console.log("See all rising stars")}
          onFollow={handleFollow}
        />

        {/* For You Section */}
        <ForYouSection
          creators={forYouCreators}
          title="Senin İçin"
          onSeeAll={() => console.log("See all for you")}
        />

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </AnimatedScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    scrollView: {
      flex: 1
    },
    scrollContent: {
      paddingTop: insets.top + 16
    },
    header: {
      paddingHorizontal: 16,
      marginBottom: 20
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: -0.5
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 4
    },
    bottomSpacer: {
      height: 100 + insets.bottom
    }
  });
