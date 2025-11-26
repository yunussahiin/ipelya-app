/**
 * ChatLoading
 *
 * Loading state component for Chat Screen with skeleton bubbles
 */

import { memo, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ThemeColors } from "@/theme/ThemeProvider";
import { ChatHeader } from "./ChatHeader";

interface ChatLoadingProps {
  conversationId: string;
  colors: ThemeColors;
}

function ChatLoadingComponent({ conversationId, colors }: ChatLoadingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6]
  });

  // Sabit skeleton mesajları (her render'da aynı)
  const skeletonItems = useMemo(
    () => [
      { isRight: true, width: 180 },
      { isRight: true, width: 120 },
      { isRight: false, width: 200 },
      { isRight: true, width: 150 },
      { isRight: false, width: 100 },
      { isRight: false, width: 160 },
      { isRight: true, width: 140 },
      { isRight: true, width: 190 }
    ],
    []
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ChatHeader conversationId={conversationId} />
      <View style={styles.skeletonContainer}>
        {skeletonItems.map((item, index) => (
          <View
            key={index}
            style={[styles.skeletonRow, item.isRight ? styles.rowRight : styles.rowLeft]}
          >
            <Animated.View
              style={[
                styles.skeletonBubble,
                {
                  backgroundColor: item.isRight ? colors.accent : colors.surface,
                  width: item.width,
                  opacity: item.isRight
                    ? opacity
                    : animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 0.7]
                      })
                }
              ]}
            />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
    justifyContent: "flex-end",
    paddingBottom: 80 // Input alanı için boşluk
  },
  skeletonRow: {
    marginVertical: 4
  },
  rowLeft: {
    alignItems: "flex-start"
  },
  rowRight: {
    alignItems: "flex-end"
  },
  skeletonBubble: {
    height: 44,
    borderRadius: 18
  }
});

export const ChatLoading = memo(ChatLoadingComponent);
