/**
 * Gift Overlay
 * Hediye animasyonları overlay'i
 * Lottie/Reanimated ile animasyonlar
 */

import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing
} from "react-native-reanimated";

export interface GiftItem {
  id: string;
  giftId: string;
  giftName: string;
  giftIcon: string; // URL or emoji
  giftValue: number;
  senderName: string;
  senderAvatar?: string;
  quantity: number;
}

interface GiftOverlayProps {
  gifts: GiftItem[];
  onGiftAnimationComplete?: (giftId: string) => void;
}

export function GiftOverlay({ gifts, onGiftAnimationComplete }: GiftOverlayProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      {gifts.map((gift) => (
        <GiftAnimation
          key={gift.id}
          gift={gift}
          onComplete={() => onGiftAnimationComplete?.(gift.id)}
        />
      ))}
    </View>
  );
}

// Individual gift animation component
function GiftAnimation({ gift, onComplete }: { gift: GiftItem; onComplete: () => void }) {
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(50);
  const rotation = useSharedValue(0);

  // Particle animations for expensive gifts
  const particles = useRef(
    Array.from({ length: gift.giftValue >= 100 ? 8 : 0 }, (_, i) => ({
      x: useSharedValue(0),
      y: useSharedValue(0),
      opacity: useSharedValue(1),
      scale: useSharedValue(1),
      rotation: useSharedValue(0),
      angle: (i / 8) * Math.PI * 2
    }))
  ).current;

  // Start animation on mount
  useEffect(() => {
    // Main gift animation
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 10 }));
    translateY.value = withSpring(0, { damping: 12 });

    // Small rotation wiggle
    rotation.value = withSequence(
      withTiming(-5, { duration: 100 }),
      withTiming(5, { duration: 100 }),
      withTiming(-3, { duration: 100 }),
      withTiming(3, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    // Particle explosion for expensive gifts
    if (gift.giftValue >= 100) {
      particles.forEach((particle) => {
        const angle = particle.angle;
        const distance = 80 + Math.random() * 40;

        particle.x.value = withDelay(
          200,
          withTiming(Math.cos(angle) * distance, {
            duration: 600,
            easing: Easing.out(Easing.cubic)
          })
        );
        particle.y.value = withDelay(
          200,
          withTiming(Math.sin(angle) * distance, {
            duration: 600,
            easing: Easing.out(Easing.cubic)
          })
        );
        particle.opacity.value = withDelay(200, withTiming(0, { duration: 600 }));
        particle.scale.value = withDelay(200, withTiming(0.3, { duration: 600 }));
        particle.rotation.value = withDelay(200, withTiming(360, { duration: 600 }));
      });
    }

    // Fade out and complete
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onComplete)();
      });
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const mainStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ]
  }));

  // Get gift size based on value
  const getGiftSize = () => {
    if (gift.giftValue >= 500) return 100;
    if (gift.giftValue >= 100) return 80;
    if (gift.giftValue >= 50) return 60;
    return 48;
  };

  const giftSize = getGiftSize();

  return (
    <Animated.View style={[styles.giftContainer, mainStyle]}>
      {/* Particles */}
      {particles.map((particle, index) => {
        const particleStyle = useAnimatedStyle(() => ({
          opacity: particle.opacity.value,
          transform: [
            { translateX: particle.x.value },
            { translateY: particle.y.value },
            { scale: particle.scale.value },
            { rotate: `${particle.rotation.value}deg` }
          ]
        }));

        return (
          <Animated.View key={index} style={[styles.particle, particleStyle]}>
            <Text style={styles.particleEmoji}>✨</Text>
          </Animated.View>
        );
      })}

      {/* Gift icon */}
      <View style={[styles.giftIconContainer, { width: giftSize, height: giftSize }]}>
        {gift.giftIcon.startsWith("http") ? (
          <Image source={{ uri: gift.giftIcon }} style={styles.giftIconImage} />
        ) : (
          <Text style={[styles.giftEmoji, { fontSize: giftSize * 0.6 }]}>{gift.giftIcon}</Text>
        )}
      </View>

      {/* Gift info */}
      <View style={styles.giftInfo}>
        <Text style={styles.senderName}>{gift.senderName}</Text>
        <View style={styles.giftDetails}>
          <Text style={styles.giftName}>{gift.giftName}</Text>
          {gift.quantity > 1 && <Text style={styles.giftQuantity}>x{gift.quantity}</Text>}
        </View>
      </View>
    </Animated.View>
  );
}

// Gift queue hook for managing multiple gifts
export function useGiftQueue(maxVisible: number = 3) {
  const [visibleGifts, setVisibleGifts] = React.useState<GiftItem[]>([]);
  const queueRef = useRef<GiftItem[]>([]);

  const addGift = useCallback(
    (gift: GiftItem) => {
      if (visibleGifts.length < maxVisible) {
        setVisibleGifts((prev) => [...prev, gift]);
      } else {
        queueRef.current.push(gift);
      }
    },
    [visibleGifts.length, maxVisible]
  );

  const removeGift = useCallback((giftId: string) => {
    setVisibleGifts((prev) => prev.filter((g) => g.id !== giftId));

    // Process queue
    if (queueRef.current.length > 0) {
      const nextGift = queueRef.current.shift()!;
      setTimeout(() => {
        setVisibleGifts((prev) => [...prev, nextGift]);
      }, 200);
    }
  }, []);

  return {
    visibleGifts,
    addGift,
    removeGift
  };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center"
  },
  giftContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  particle: {
    position: "absolute"
  },
  particleEmoji: {
    fontSize: 20
  },
  giftIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8
  },
  giftIconImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain"
  },
  giftEmoji: {
    textAlign: "center"
  },
  giftInfo: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  senderName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2
  },
  giftDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  giftName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12
  },
  giftQuantity: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "700"
  }
});

export default GiftOverlay;
