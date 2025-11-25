import { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import type { Creator, HeroSlide } from "../types";

interface HeroSliderProps {
  slides: HeroSlide[];
  onFollow?: (creatorId: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SLIDE_HEIGHT = SCREEN_HEIGHT * 0.48;

// Floating avatar positions - Apple style symmetric layout
const AVATAR_POSITIONS: Array<{
  top: number;
  left?: number;
  right?: number;
  size: number;
}> = [
  { top: 30, left: 20, size: 60 }, // Top left
  { top: 35, right: 24, size: 52 }, // Top right
  { top: 130, left: 12, size: 48 }, // Bottom left
  { top: 140, right: 16, size: 44 } // Bottom right
];

function FloatingAvatar({
  creator,
  position,
  index
}: {
  creator: Creator;
  position: (typeof AVATAR_POSITIONS)[0];
  index: number;
}) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeIn.delay(100 + index * 80).duration(350)}
      style={[
        styles.floatingAvatar,
        {
          top: position.top,
          left: position.left,
          right: position.right,
          width: position.size,
          height: position.size
        }
      ]}
    >
      <View
        style={[
          styles.avatarRingOuter,
          {
            width: position.size,
            height: position.size,
            borderRadius: position.size / 2,
            borderColor: colors.accent
          }
        ]}
      >
        <Image
          source={creator.avatarUrl ? { uri: creator.avatarUrl } : undefined}
          style={[
            styles.floatingAvatarImage,
            {
              width: position.size - 4,
              height: position.size - 4,
              borderRadius: (position.size - 4) / 2
            }
          ]}
          contentFit="cover"
        />
      </View>
    </Animated.View>
  );
}

function MainAvatar({ creator }: { creator: Creator }) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.mainAvatarContainer}>
      <View style={[styles.mainAvatarRing, { borderColor: colors.accent }]}>
        <Image
          source={creator.avatarUrl ? { uri: creator.avatarUrl } : undefined}
          style={styles.mainAvatarImage}
          contentFit="cover"
        />
      </View>
    </Animated.View>
  );
}

function SlideItem({
  slide,
  index,
  currentIndex
}: {
  slide: HeroSlide;
  index: number;
  currentIndex: number;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const isActive = index === currentIndex;

  const handleCTA = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (slide.ctaAction) {
      slide.ctaAction();
    } else {
      router.push(`/profile/${slide.mainCreator.username}`);
    }
  }, [slide, router]);

  return (
    <View style={styles.slideContainer}>
      <LinearGradient
        colors={slide.gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.slideGradient}
      >
        {/* Floating Avatars */}
        {isActive &&
          slide.surroundingCreators
            .slice(0, 4)
            .map((creator, idx) => (
              <FloatingAvatar
                key={creator.id}
                creator={creator}
                position={AVATAR_POSITIONS[idx]}
                index={idx}
              />
            ))}

        {/* Main Avatar */}
        {isActive && <MainAvatar creator={slide.mainCreator} />}

        {/* Content */}
        <View style={styles.slideContent}>
          <Text style={[styles.slideLabel, { color: colors.accentSoft }]}>{slide.title}</Text>
          <Text style={styles.slideTitle}>{slide.subtitle}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>

          {/* CTA Button */}
          <Pressable
            style={[styles.ctaButton, { backgroundColor: "rgba(255,255,255,0.2)" }]}
            onPress={handleCTA}
          >
            <Text style={styles.ctaText}>{slide.ctaText}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function PaginationDots({ total, currentIndex }: { total: number; currentIndex: number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.pagination}>
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: isActive ? colors.textPrimary : "rgba(255,255,255,0.3)",
                width: isActive ? 24 : 8
              }
            ]}
          />
        );
      })}
    </View>
  );
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50
    }),
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: HeroSlide; index: number }) => (
      <SlideItem slide={item} index={index} currentIndex={currentIndex} />
    ),
    [currentIndex]
  );

  const keyExtractor = useCallback((item: HeroSlide) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
      />
      <PaginationDots total={slides.length} currentIndex={currentIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SLIDE_HEIGHT
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SLIDE_HEIGHT
  },
  slideGradient: {
    flex: 1
  },
  floatingAvatar: {
    position: "absolute",
    zIndex: 10
  },
  avatarRingOuter: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  floatingAvatarImage: {
    overflow: "hidden"
  },
  mainAvatarContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5
  },
  mainAvatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  mainAvatarImage: {
    width: 132,
    height: 132,
    borderRadius: 66
  },
  slideContent: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24
  },
  slideLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 6
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6
  },
  slideDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20
  },
  ctaButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 22,
    minWidth: 160
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center"
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6
  },
  dot: {
    height: 8,
    borderRadius: 4
  }
});
