/**
 * AudienceScreen Component
 * Hedef kitle seçimi - Takipçiler veya Aboneler (Full screen)
 */

import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Modal, Animated } from "react-native";
import type { ThemeColors } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, Star, Check, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuthStore } from "@/store/auth.store";
import type { PostSettings } from "../../types";

interface AudienceSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedAudience: PostSettings["audience"];
  onSelect: (audience: PostSettings["audience"]) => void;
}

interface AudienceStats {
  is_creator: boolean;
  followers: number;
  subscribers: number;
}

export function AudienceSheet({
  visible,
  onClose,
  selectedAudience,
  onSelect
}: AudienceSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { sessionToken } = useAuthStore();
  const [stats, setStats] = useState<AudienceStats | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

  useEffect(() => {
    if (visible) {
      fetchStats();
    }
  }, [visible]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/get-audience-stats`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Audience stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (audience: PostSettings["audience"]) => {
    onSelect(audience);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top }]}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Hedef Kitle</Text>
          <View style={styles.backButton} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Gönderiyi kimler görebilir?
          </Text>

          {loading ? (
            <AudienceSkeleton colors={colors} />
          ) : (
            <View style={styles.options}>
              {/* Takipçiler */}
              <Pressable style={styles.option} onPress={() => handleSelect("followers")}>
                <Users size={24} color={colors.textPrimary} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                    Takipçiler
                  </Text>
                  <Text style={[styles.optionCount, { color: colors.accent }]}>
                    {stats?.followers || 0} Kişi
                  </Text>
                </View>
                {selectedAudience === "followers" ? (
                  <View style={[styles.checkCircle, { borderColor: colors.accent }]}>
                    <Check size={16} color={colors.accent} />
                  </View>
                ) : (
                  <View style={[styles.emptyCircle, { borderColor: colors.border }]} />
                )}
              </Pressable>

              {/* Abonelerim - Sadece creator'lar için */}
              {stats?.is_creator && (
                <Pressable style={styles.option} onPress={() => handleSelect("subscribers")}>
                  <Star size={24} color={colors.accent} />
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                      Abonelerim
                    </Text>
                    <Text style={[styles.optionCount, { color: colors.accent }]}>
                      {stats?.subscribers || 0} Kişi
                    </Text>
                  </View>
                  {selectedAudience === "subscribers" ? (
                    <View style={[styles.checkCircle, { borderColor: colors.accent }]}>
                      <Check size={16} color={colors.accent} />
                    </View>
                  ) : (
                    <View style={[styles.emptyCircle, { borderColor: colors.border }]} />
                  )}
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  backButton: {
    width: 50,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600"
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24
  },
  options: {
    gap: 12
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500"
  },
  optionCount: {
    fontSize: 14,
    marginTop: 2
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2
  },
  // Skeleton styles
  skeletonContainer: {
    gap: 12
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14
  },
  skeletonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12
  },
  skeletonContent: {
    flex: 1,
    gap: 6
  },
  skeletonTitle: {
    height: 16,
    borderRadius: 4,
    width: "60%"
  },
  skeletonCount: {
    height: 14,
    borderRadius: 4,
    width: "30%"
  },
  skeletonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12
  }
});

/**
 * Audience Skeleton Component
 * Loading state için skeleton placeholder
 */
function AudienceSkeleton({ colors }: { colors: ThemeColors }) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  const skeletonStyle = {
    backgroundColor: colors.surface,
    opacity
  };

  return (
    <View style={styles.skeletonContainer}>
      {/* Takipçiler skeleton */}
      <View style={styles.skeletonItem}>
        <Animated.View style={[styles.skeletonIcon, skeletonStyle]} />
        <View style={styles.skeletonContent}>
          <Animated.View style={[styles.skeletonTitle, skeletonStyle]} />
          <Animated.View style={[styles.skeletonCount, skeletonStyle]} />
        </View>
        <Animated.View style={[styles.skeletonCircle, skeletonStyle]} />
      </View>

      {/* Aboneler skeleton */}
      <View style={styles.skeletonItem}>
        <Animated.View style={[styles.skeletonIcon, skeletonStyle]} />
        <View style={styles.skeletonContent}>
          <Animated.View style={[styles.skeletonTitle, skeletonStyle]} />
          <Animated.View style={[styles.skeletonCount, skeletonStyle]} />
        </View>
        <Animated.View style={[styles.skeletonCircle, skeletonStyle]} />
      </View>
    </View>
  );
}
