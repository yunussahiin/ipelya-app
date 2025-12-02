/**
 * KYC Index Screen
 * KYC durumu ve başlama ekranı
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Shield, CheckCircle, Clock, AlertCircle } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";

export default function KYCIndexScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { profile, isLoading, reset } = useKYCVerification();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(creator)/revenue");
    }
  };

  const handleStart = () => {
    reset();
    router.push("/(creator)/kyc/form");
  };

  const getStatusContent = () => {
    if (!profile) return null;

    switch (profile.status) {
      case "approved":
        return (
          <View style={[styles.statusCard, { backgroundColor: "#10B98120" }]}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={[styles.statusTitle, { color: "#10B981" }]}>Doğrulandı</Text>
            <Text style={styles.statusDesc}>
              Hesabınız {profile.level === "basic" ? "temel" : "tam"} seviyede doğrulanmış.
            </Text>
            {profile.verifiedName && (
              <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Doğrulanan İsim</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {profile.verifiedName}
                </Text>
              </View>
            )}
            {profile.level === "basic" && profile.monthlyPayoutLimit && (
              <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  Aylık Çekim Limiti
                </Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  ₺{profile.monthlyPayoutLimit.toLocaleString("tr-TR")}
                </Text>
              </View>
            )}
          </View>
        );

      case "pending":
        return (
          <View style={[styles.statusCard, { backgroundColor: "#F59E0B20" }]}>
            <Clock size={48} color="#F59E0B" />
            <Text style={[styles.statusTitle, { color: "#F59E0B" }]}>İnceleniyor</Text>
            <Text style={styles.statusDesc}>
              Başvurunuz inceleniyor. Genellikle 24 saat içinde sonuçlanır.
            </Text>
            {profile.pendingApplication && (
              <Text style={[styles.dateText, { color: colors.textMuted }]}>
                Gönderildi:{" "}
                {new Date(profile.pendingApplication.submittedAt).toLocaleDateString("tr-TR")}
              </Text>
            )}
          </View>
        );

      case "rejected":
        return (
          <View style={[styles.statusCard, { backgroundColor: "#EF444420" }]}>
            <AlertCircle size={48} color="#EF4444" />
            <Text style={[styles.statusTitle, { color: "#EF4444" }]}>Reddedildi</Text>
            <Text style={styles.statusDesc}>
              Başvurunuz reddedildi. Yeni bir başvuru yapabilirsiniz.
            </Text>
            {profile.lastRejection?.reason && (
              <View style={[styles.rejectBox, { backgroundColor: "#EF444410" }]}>
                <Text style={styles.rejectText}>{profile.lastRejection.reason}</Text>
              </View>
            )}
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleStart}
            >
              <Text style={styles.buttonText}>Tekrar Başvur</Text>
            </Pressable>
          </View>
        );

      default: // 'none'
        return (
          <View style={styles.startCard}>
            <Shield size={64} color={colors.accent} />
            <Text style={[styles.startTitle, { color: colors.textPrimary }]}>Kimlik Doğrulama</Text>
            <Text style={[styles.startDesc, { color: colors.textSecondary }]}>
              Para çekmek için kimlik doğrulaması yapmanız gerekiyor. Bu işlem sadece bir kez
              yapılır.
            </Text>

            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${colors.accent}20` }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textPrimary }]}>
                  Kişisel bilgilerinizi girin
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${colors.accent}20` }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textPrimary }]}>
                  Kimliğinizin fotoğrafını çekin
                </Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: `${colors.accent}20` }]}>
                  <Text style={[styles.stepNumberText, { color: colors.accent }]}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textPrimary }]}>Selfie çekin</Text>
              </View>
            </View>

            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleStart}
            >
              <Text style={styles.buttonText}>Doğrulamayı Başlat</Text>
            </Pressable>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>KYC Doğrulama</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loading}>
            <Text style={{ color: colors.textMuted }}>Yükleniyor...</Text>
          </View>
        ) : (
          getStatusContent()
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
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60
    },
    statusCard: {
      padding: 24,
      borderRadius: 20,
      alignItems: "center",
      gap: 12
    },
    statusTitle: {
      fontSize: 22,
      fontWeight: "700"
    },
    statusDesc: {
      fontSize: 14,
      textAlign: "center",
      color: "#666",
      lineHeight: 20
    },
    dateText: {
      fontSize: 12,
      marginTop: 8
    },
    infoBox: {
      width: "100%",
      padding: 12,
      borderRadius: 10,
      marginTop: 8
    },
    infoLabel: {
      fontSize: 12,
      marginBottom: 4
    },
    infoValue: {
      fontSize: 15,
      fontWeight: "600"
    },
    rejectBox: {
      width: "100%",
      padding: 12,
      borderRadius: 10
    },
    rejectText: {
      color: "#EF4444",
      fontSize: 13
    },
    startCard: {
      alignItems: "center",
      gap: 16
    },
    startTitle: {
      fontSize: 24,
      fontWeight: "700",
      marginTop: 8
    },
    startDesc: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 20
    },
    stepsList: {
      width: "100%",
      marginTop: 20,
      gap: 12
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center"
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: "600"
    },
    stepText: {
      fontSize: 15,
      flex: 1
    },
    button: {
      width: "100%",
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      marginTop: 24
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600"
    }
  });
