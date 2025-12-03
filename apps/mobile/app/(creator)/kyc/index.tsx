/**
 * KYC Index Screen
 * KYC durumu ve başlama ekranı
 */

import React, { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";
import { KYCStatusView } from "@/components/creator/kyc/KYCStatusView";

export default function KYCIndexScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { profile, isLoading, reset, refresh, documentPaths, formData, currentStep } =
    useKYCVerification();

  // Sayfa focus olduğunda KYC durumunu yenile
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Devam eden başvuru var mı?
  const hasProgress = !!(
    documentPaths.idFrontPath ||
    documentPaths.idBackPath ||
    documentPaths.selfiePath ||
    formData.firstName ||
    formData.lastName
  );

  const handleBack = () => {
    router.replace("/(creator)/revenue");
  };

  const handleStart = async () => {
    // Rejected veya approved durumunda yeni başvuru için reset yap
    if (profile?.status === "rejected" || profile?.status === "approved") {
      await reset();
      console.log("[KYC] Starting fresh application after", profile.status);
      router.push("/(creator)/kyc/form");
      return;
    }

    // Kaldığı adıma yönlendir
    const stepRoutes: Record<string, string> = {
      form: "/(creator)/kyc/form",
      "id-front": "/(creator)/kyc/id-front",
      "id-back": "/(creator)/kyc/id-back",
      selfie: "/(creator)/kyc/selfie"
    };
    const route = stepRoutes[currentStep] || "/(creator)/kyc/form";
    console.log("[KYC] Navigating to step:", currentStep, route);
    router.push(route as any);
  };

  const handleReset = async () => {
    await reset();
    console.log("[KYC] Wizard reset by user");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Kimlik Doğrulama</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Yükleniyor...</Text>
          </View>
        ) : (
          <KYCStatusView
            profile={profile}
            hasProgress={hasProgress}
            onStart={handleStart}
            onReset={handleReset}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center"
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary
    },
    scrollContent: {
      padding: 20,
      paddingBottom: insets.bottom + 20
    },
    loading: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      gap: 12
    },
    loadingText: {
      fontSize: 14
    }
  });
