/**
 * SubscriptionSheet Component
 * Creator abonelik tier seçimi için bottom sheet
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert
} from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crown, Check, X, Sparkles } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import * as Haptics from "expo-haptics";

interface CreatorTier {
  id: string;
  name: string;
  description?: string;
  coinPriceMonthly: number;
  coinPriceYearly?: number;
  benefits: string[];
  subscriberCount?: number;
}

interface SubscriptionSheetProps {
  visible: boolean;
  onClose: () => void;
  creatorId: string;
  creatorUsername: string;
  creatorAvatarUrl?: string;
  onSubscribed?: () => void;
}

export function SubscriptionSheet({
  visible,
  onClose,
  creatorId,
  creatorUsername,
  onSubscribed
}: SubscriptionSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const [tiers, setTiers] = useState<CreatorTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<CreatorTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const translateY = useSharedValue(1000);
  const opacity = useSharedValue(0);

  // Load tiers when visible
  useEffect(() => {
    if (visible) {
      loadTiers();
      loadUserBalance();
      translateY.value = withSpring(0, { damping: 20 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(1000, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const loadTiers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("creator_subscription_tiers")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("is_active", true)
        .order("coin_price_monthly", { ascending: true });

      if (error) throw error;

      setTiers(
        data?.map((tier) => ({
          id: tier.id,
          name: tier.name,
          description: tier.description,
          coinPriceMonthly: tier.coin_price_monthly,
          coinPriceYearly: tier.coin_price_yearly,
          benefits: tier.benefits || []
        })) || []
      );
    } catch (error) {
      console.error("Load tiers error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("coin_balances")
        .select("balance")
        .eq("user_id", session.user.id)
        .single();

      setUserBalance(data?.balance || 0);
    } catch (error) {
      console.error("Load balance error:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedTier) return;

    if (userBalance < selectedTier.coinPriceMonthly) {
      Alert.alert(
        "Yetersiz Bakiye",
        `Bu abonelik için ${selectedTier.coinPriceMonthly} coin gerekiyor. Mevcut bakiyeniz: ${userBalance} coin.`,
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Coin Satın Al",
            onPress: () => {
              /* Navigate to store */
            }
          }
        ]
      );
      return;
    }

    setIsSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscribe-to-creator", {
        body: {
          creatorId,
          tierId: selectedTier.id,
          billingPeriod: "monthly"
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Abonelik başarısız");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Başarılı!", `@${creatorUsername} kullanıcısına abone oldunuz!`);
      onSubscribed?.();
      onClose();
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Abonelik işlemi başarısız");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  // Gesture for drag to close
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        translateY.value = withTiming(1000, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        </Pressable>
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.sheet, animatedSheetStyle]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Crown size={24} color={colors.accent} />
              <Text style={styles.headerTitle}>@{creatorUsername}</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Abone ol ve özel içeriklere eriş</Text>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : tiers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Sparkles size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>Bu creator henüz abonelik tier'ı oluşturmamış.</Text>
            </View>
          ) : (
            <ScrollView style={styles.tiersContainer} showsVerticalScrollIndicator={false}>
              {tiers.map((tier) => (
                <Pressable
                  key={tier.id}
                  style={[styles.tierCard, selectedTier?.id === tier.id && styles.tierCardSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTier(tier);
                  }}
                >
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <View style={styles.tierPrice}>
                      <Text style={styles.tierPriceValue}>{tier.coinPriceMonthly}</Text>
                      <Text style={styles.tierPriceLabel}> coin/ay</Text>
                    </View>
                  </View>

                  {tier.description && (
                    <Text style={styles.tierDescription}>{tier.description}</Text>
                  )}

                  {tier.benefits.length > 0 && (
                    <View style={styles.benefitsList}>
                      {tier.benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitItem}>
                          <Check size={14} color={colors.success} />
                          <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedTier?.id === tier.id && (
                    <View style={styles.selectedBadge}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          {tiers.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Bakiyeniz:</Text>
                <Text style={styles.balanceValue}>{userBalance} coin</Text>
              </View>

              <Pressable
                style={[
                  styles.subscribeButton,
                  (!selectedTier || isSubscribing) && styles.subscribeButtonDisabled
                ]}
                onPress={handleSubscribe}
                disabled={!selectedTier || isSubscribing}
              >
                {isSubscribing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Crown size={18} color="#FFFFFF" />
                    <Text style={styles.subscribeButtonText}>
                      {selectedTier
                        ? `${selectedTier.coinPriceMonthly} Coin ile Abone Ol`
                        : "Tier Seçin"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)"
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "80%",
      paddingBottom: insets.bottom + 16
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: 12
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 8
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary
    },
    closeButton: {
      padding: 4
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      paddingHorizontal: 20,
      marginBottom: 16
    },
    loadingContainer: {
      padding: 40,
      alignItems: "center"
    },
    emptyContainer: {
      padding: 40,
      alignItems: "center",
      gap: 16
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center"
    },
    tiersContainer: {
      paddingHorizontal: 20
    },
    tierCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border
    },
    tierCardSelected: {
      borderColor: colors.accent
    },
    tierHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    },
    tierName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary
    },
    tierPrice: {
      flexDirection: "row",
      alignItems: "baseline"
    },
    tierPriceValue: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.accent
    },
    tierPriceLabel: {
      fontSize: 12,
      color: colors.textSecondary
    },
    tierDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12
    },
    benefitsList: {
      gap: 8
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    benefitText: {
      fontSize: 13,
      color: colors.textPrimary
    },
    selectedBadge: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center"
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12
    },
    balanceInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    balanceLabel: {
      fontSize: 14,
      color: colors.textSecondary
    },
    balanceValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary
    },
    subscribeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12
    },
    subscribeButtonDisabled: {
      opacity: 0.5
    },
    subscribeButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF"
    }
  });
