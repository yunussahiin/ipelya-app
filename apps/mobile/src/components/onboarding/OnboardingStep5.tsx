import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  Easing,
  withTiming
} from "react-native-reanimated";
import { useTheme } from "@/theme/ThemeProvider";
import { useOnboardingStore } from "@/store/onboarding.store";
import { useOnboardingService } from "@/hooks/useOnboardingService";
import { supabase } from "@/lib/supabaseClient";
import { LAYOUT_CONSTANTS } from "@/theme/layout";

interface OnboardingStep5Props {
  onPrev: () => void;
}

export function OnboardingStep5({ onPrev }: OnboardingStep5Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const { completeOnboarding } = useOnboardingService();
  const { resetOnboarding } = useOnboardingStore();

  // Animations
  const titleScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const emoji1Scale = useSharedValue(0);
  const emoji2Scale = useSharedValue(0);

  // Exit animation
  const exitScale = useSharedValue(1);
  const exitOpacity = useSharedValue(1);

  useEffect(() => {
    // Title animation - scale up with spring
    titleScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 10,
        mass: 1,
        overshootClamping: false
      })
    );
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));

    // Emoji 1 animation - bounce in
    emoji1Scale.value = withDelay(
      400,
      withSpring(1, {
        damping: 8,
        mass: 1,
        overshootClamping: false
      })
    );

    // Emoji 2 animation - bounce in
    emoji2Scale.value = withDelay(
      600,
      withSpring(1, {
        damping: 8,
        mass: 1,
        overshootClamping: false
      })
    );
  }, [titleScale, titleOpacity, emoji1Scale, emoji2Scale]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value
  }));

  const emoji1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emoji1Scale.value }]
  }));

  const emoji2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emoji2Scale.value }]
  }));

  const exitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exitScale.value }],
    opacity: exitOpacity.value
  }));

  const handleComplete = async () => {
    try {
      // Start exit animation
      exitScale.value = withTiming(0.8, { duration: 300, easing: Easing.out(Easing.cubic) });
      exitOpacity.value = withTiming(0, { duration: 300 });

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error("User not found");

      // Complete onboarding in database
      await completeOnboarding(user.user.id);

      // Reset local store
      resetOnboarding();

      // Navigate to home
      router.replace("/home");
    } catch (error) {
      console.error("❌ Onboarding tamamlama hatası:", error);
      // Reset animation on error
      exitScale.value = 1;
      exitOpacity.value = 1;
    }
  };

  const styles = createStyles(colors);

  return (
    <Animated.View style={[styles.wrapper, exitAnimatedStyle]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Success Animation */}
        <View style={styles.celebrationContainer}>
          <Animated.Text style={[styles.celebrationEmoji, emoji1AnimatedStyle]}>🎉</Animated.Text>
          <Animated.Text style={[styles.celebrationEmoji2, emoji2AnimatedStyle]}>✨</Animated.Text>
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, titleAnimatedStyle]}>
          <Text style={styles.title}>Hoşgeldin!</Text>
          <Text style={styles.subtitle}>Onboarding tamamlandı</Text>
        </Animated.View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <LinearGradient
            colors={[colors.accent + "15", colors.accent + "05"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureItem}
          >
            <Text style={styles.featureIcon}>🔐</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Shadow Profile Aktif</Text>
              <Text style={styles.featureDescription}>Gizli kimliğin oluşturuldu ve korunuyor</Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#f472b6" + "15", "#f472b6" + "05"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureItem}
          >
            <Text style={styles.featureIcon}>💎</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Hoş Geldin Bonusu</Text>
              <Text style={styles.featureDescription}>
                +100 Coin hediye olarak hesabına eklendi
              </Text>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["#a78bfa" + "15", "#a78bfa" + "05"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featureItem}
          >
            <Text style={styles.featureIcon}>👤</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Profil Tamamlandı</Text>
              <Text style={styles.featureDescription}>Tüm bilgiler güvenli şekilde kaydedildi</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Bilgi</Text>
          <Text style={styles.infoText}>
            Shadow profile'ın PIN veya biometric ile korunuyor. Gizli kimliğine istediğin zaman
            erişebilirsin.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={onPrev}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </Pressable>

        <Pressable
          onPress={handleComplete}
          style={({ pressed }) => [styles.completeButton, pressed && styles.completeButtonPressed]}
        >
          <Text style={styles.completeButtonText}>Başla 🚀</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background
    },
    container: {
      flex: 1,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 24
    },
    celebrationContainer: {
      alignItems: "center",
      marginBottom: 32,
      height: 100,
      justifyContent: "center"
    },
    celebrationEmoji: {
      fontSize: 60,
      marginBottom: -20
    },
    celebrationEmoji2: {
      fontSize: 40,
      marginLeft: 40
    },
    header: {
      marginBottom: 32,
      alignItems: "center"
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
      textAlign: "center"
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "500",
      textAlign: "center"
    },
    featuresContainer: {
      marginBottom: 32,
      gap: 16
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: 20,
      paddingHorizontal: 18,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border + "30",
      gap: 14,
      overflow: "hidden"
    },
    featureIcon: {
      fontSize: 28,
      marginTop: 2
    },
    featureContent: {
      flex: 1
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4
    },
    featureDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "400",
      lineHeight: 18
    },
    infoBox: {
      backgroundColor: `${colors.accent}15`,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      padding: 16,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      marginBottom: 32
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "400",
      lineHeight: 20
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: LAYOUT_CONSTANTS.screenPaddingHorizontal,
      paddingVertical: 16,
      paddingBottom: Platform.OS === "ios" ? 32 : 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border
    },
    backButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center"
    },
    backButtonPressed: {
      opacity: 0.7
    },
    backButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accentSoft
    },
    completeButton: {
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: LAYOUT_CONSTANTS.radiusMedium,
      paddingVertical: Platform.OS === "android" ? 12 : 14,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: LAYOUT_CONSTANTS.buttonMinHeight
    },
    completeButtonPressed: {
      opacity: 0.7
    },
    completeButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: "700",
      fontSize: 14,
      lineHeight: 20
    }
  });
}
