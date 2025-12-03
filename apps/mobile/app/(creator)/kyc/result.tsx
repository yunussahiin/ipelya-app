/**
 * KYC Result Screen
 * Başvuru sonuç ekranı - Modern UI
 */

import React, { useMemo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CheckCircle, Clock, ArrowRight, Shield, Bell, Wallet } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";

export default function KYCResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { profile } = useKYCVerification();

  // Animasyonlar
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Giriş animasyonu
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleDone = () => {
    router.replace("/(creator)/revenue");
  };

  const steps = [
    { icon: Shield, title: "Otomatik İnceleme", desc: "Belgeleriniz kontrol ediliyor" },
    { icon: Bell, title: "Bildirim Alın", desc: "Onay durumu bildirilecek" },
    { icon: Wallet, title: "Para Çekin", desc: "Kazancınızı çekebilirsiniz" }
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Animation */}
          <Animated.View style={[styles.animationContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.iconCircle}>
              <View style={styles.iconInner}>
                <CheckCircle size={44} color="#fff" strokeWidth={2.5} />
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.contentInner, { opacity: fadeAnim }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Başvurunuz Alındı!</Text>

            <Text style={[styles.description, { color: colors.textSecondary }]}>
              KYC başvurunuz başarıyla gönderildi.{"\n"}Genellikle 24 saat içinde incelenir.
            </Text>

            {/* Status Card */}
            <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
              <View style={styles.statusBadge}>
                <Clock size={14} color="#F59E0B" />
                <Text style={styles.statusBadgeText}>İnceleniyor</Text>
              </View>
              <Text style={[styles.statusInfo, { color: colors.textSecondary }]}>
                Sonuç hakkında bildirim alacaksınız.
              </Text>
            </View>

            {/* Next Steps */}
            <Text style={[styles.nextStepsTitle, { color: colors.textMuted }]}>
              SONRAKI ADIMLAR
            </Text>

            {steps.map((step, index) => (
              <View key={index} style={[styles.stepCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.stepIcon, { backgroundColor: `${colors.accent}15` }]}>
                  <step.icon size={18} color={colors.accent} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Footer - Safe Area */}
      <SafeAreaView style={styles.footer} edges={["bottom"]}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={handleDone}
        >
          <Text style={styles.primaryButtonText}>Ödeme Yönetimine Dön</Text>
          <ArrowRight size={20} color="#fff" />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    safeArea: {
      flex: 1
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 48,
      paddingBottom: 24
    },
    animationContainer: {
      alignItems: "center",
      marginBottom: 24
    },
    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "#10B98120",
      alignItems: "center",
      justifyContent: "center"
    },
    iconInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "#10B981",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8
    },
    contentInner: {
      alignItems: "center"
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center"
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 20
    },
    statusCard: {
      width: "100%",
      padding: 16,
      borderRadius: 14,
      marginBottom: 24,
      gap: 10
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "#F59E0B15",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6
    },
    statusBadgeText: {
      color: "#F59E0B",
      fontSize: 13,
      fontWeight: "600"
    },
    statusInfo: {
      fontSize: 14,
      lineHeight: 20
    },
    nextStepsTitle: {
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.5,
      marginBottom: 12,
      alignSelf: "flex-start"
    },
    stepCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 12,
      gap: 12,
      marginBottom: 8
    },
    stepIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center"
    },
    stepContent: {
      flex: 1
    },
    stepTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 2
    },
    stepDesc: {
      fontSize: 12
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: colors.background
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
    }
  });
