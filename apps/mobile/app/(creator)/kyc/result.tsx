/**
 * KYC Result Screen
 * Başvuru sonuç ekranı
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CheckCircle, Clock, ArrowRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";
import LottieView from "lottie-react-native";

export default function KYCResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { profile } = useKYCVerification();

  const handleDone = () => {
    router.replace("/(creator)/revenue");
  };

  const handleGoToDashboard = () => {
    router.replace("/(creator)/dashboard");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <View style={styles.animationContainer}>
          <View style={[styles.iconCircle, { backgroundColor: "#10B98120" }]}>
            <CheckCircle size={64} color="#10B981" />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Başvurunuz Alındı!</Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          KYC başvurunuz başarıyla gönderildi. Başvurunuz genellikle 24 saat içinde incelenir.
        </Text>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statusRow}>
            <Clock size={20} color="#F59E0B" />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusLabel, { color: colors.textPrimary }]}>Durum</Text>
              <Text style={[styles.statusValue, { color: "#F59E0B" }]}>İnceleniyor</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statusRow}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Sonuç hakkında bildirim alacaksınız. Başvurunuz onaylandığında para çekme işlemi
              yapabilirsiniz.
            </Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextSteps}>
          <Text style={[styles.nextStepsTitle, { color: colors.textPrimary }]}>
            Sonraki Adımlar
          </Text>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Başvurunuz otomatik olarak incelenir
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Onaylandığında bildirim alırsınız
            </Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Para çekme işlemi yapabilirsiniz
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={handleDone}
        >
          <Text style={styles.primaryButtonText}>Ödeme Yönetimine Dön</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleGoToDashboard}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
            Dashboard'a Git
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    content: {
      flex: 1,
      padding: 24,
      alignItems: "center",
      justifyContent: "center"
    },
    animationContainer: {
      marginBottom: 24
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center"
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      marginBottom: 12,
      textAlign: "center"
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: "center",
      marginBottom: 32,
      paddingHorizontal: 20
    },
    statusCard: {
      width: "100%",
      padding: 20,
      borderRadius: 16,
      marginBottom: 32
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    statusTextContainer: {
      flex: 1
    },
    statusLabel: {
      fontSize: 13,
      marginBottom: 2
    },
    statusValue: {
      fontSize: 16,
      fontWeight: "600"
    },
    divider: {
      height: 1,
      marginVertical: 16
    },
    infoText: {
      fontSize: 14,
      lineHeight: 20
    },
    nextSteps: {
      width: "100%",
      gap: 12
    },
    nextStepsTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    stepText: {
      fontSize: 14,
      flex: 1
    },
    footer: {
      padding: 20,
      paddingBottom: insets.bottom + 20,
      gap: 12
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      gap: 8
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600"
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      borderWidth: 1
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: "500"
    }
  });
