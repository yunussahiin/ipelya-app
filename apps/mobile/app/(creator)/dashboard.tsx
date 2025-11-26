/**
 * Creator Dashboard Screen
 * Ana creator hub - tüm creator özellikleri buradan erişilir
 */

import React, { useMemo, useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Crown,
  TrendingUp,
  Users,
  Layers,
  ChevronRight,
  Wallet,
  Gift,
  Calendar,
  Radio,
  Upload,
  Settings
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useCreatorEarnings } from "@/hooks/useCreatorEarnings";
import { useCreatorTiers } from "@/hooks/useCreatorTiers";
import { supabase } from "@/lib/supabaseClient";

export default function CreatorDashboardScreen() {
  console.log("📊 CreatorDashboardScreen rendered");
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: earningsData, isLoading: earningsLoading, refreshEarnings } = useCreatorEarnings();
  const { tiers } = useCreatorTiers();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<{ display_name?: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .eq("type", "real")
        .single();
      setProfile(data);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshEarnings();
    setRefreshing(false);
  }, [refreshEarnings]);

  const totalSubscribers = tiers.reduce((sum, t) => sum + (t.subscriberCount || 0), 0);
  const monthlyRevenue = tiers.reduce(
    (sum, t) => sum + (t.subscriberCount || 0) * (t.coinPriceMonthly || 0),
    0
  );

  const navigateTo = useCallback(
    (
      route:
        | "/(creator)/tiers"
        | "/(creator)/subscribers"
        | "/(creator)/earnings"
        | "/(creator)/upload"
        | "/(creator)/schedule"
        | "/(live)"
        | "/(settings)"
    ) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(route);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.name}>{profile?.display_name || "Creator"} 👋</Text>
          </View>
          <Pressable style={styles.settingsButton} onPress={() => navigateTo("/(settings)")}>
            <Settings size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={[colors.accent, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Wallet size={20} color="rgba(255,255,255,0.8)" />
            <Text style={styles.balanceLabel}>Toplam Kazanç</Text>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.balanceValue}>
              {earningsLoading ? "..." : (earningsData?.earnings?.total || 0).toLocaleString()}
            </Text>
          </View>
          <Text style={styles.balanceSubtext}>
            ≈ ₺{((earningsData?.earnings?.total || 0) * 0.5).toLocaleString()}
          </Text>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Users size={20} color={colors.accent} />
            <Text style={styles.statValue}>{totalSubscribers}</Text>
            <Text style={styles.statLabel}>Abone</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Layers size={20} color={colors.accent} />
            <Text style={styles.statValue}>{tiers.length}</Text>
            <Text style={styles.statLabel}>Tier</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <TrendingUp size={20} color={colors.success} />
            <Text style={styles.statValue}>{monthlyRevenue}</Text>
            <Text style={styles.statLabel}>Aylık</Text>
          </View>
        </View>

        {/* Management Section */}
        <Text style={styles.sectionTitle}>Yönetim</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Crown size={22} color={colors.accent} />}
            title="Abonelik Tier'ları"
            subtitle={`${tiers.length} tier aktif`}
            onPress={() => navigateTo("/(creator)/tiers")}
            colors={colors}
          />
          <MenuItem
            icon={<Users size={22} color={colors.accent} />}
            title="Abonelerim"
            subtitle={`${totalSubscribers} aktif abone`}
            onPress={() => navigateTo("/(creator)/subscribers")}
            colors={colors}
          />
          <MenuItem
            icon={<TrendingUp size={22} color={colors.success} />}
            title="Gelir Raporu"
            subtitle="Detaylı kazanç analizi"
            onPress={() => navigateTo("/(creator)/earnings")}
            colors={colors}
          />
        </View>

        {/* Content Section */}
        <Text style={styles.sectionTitle}>İçerik</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon={<Upload size={22} color={colors.accent} />}
            title="İçerik Yükle"
            subtitle="Fotoğraf, video veya reel"
            onPress={() => navigateTo("/(creator)/upload")}
            colors={colors}
          />
          <MenuItem
            icon={<Calendar size={22} color={colors.accent} />}
            title="Zamanlama"
            subtitle="İçerik takvimi"
            onPress={() => navigateTo("/(creator)/schedule")}
            colors={colors}
          />
          <MenuItem
            icon={<Radio size={22} color="#FF4444" />}
            title="Canlı Yayın"
            subtitle="Şimdi yayına başla"
            onPress={() => navigateTo("/(live)")}
            colors={colors}
          />
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Son Aktivite</Text>
        <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: colors.accent + "20" }]}>
              <Gift size={18} color={colors.accent} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Yeni hediye aldınız</Text>
              <Text style={styles.activitySubtitle}>@user123'den 50 coin</Text>
            </View>
            <Text style={styles.activityTime}>2dk</Text>
          </View>
          <View style={styles.activityDivider} />
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: colors.success + "20" }]}>
              <Users size={18} color={colors.success} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Yeni abone</Text>
              <Text style={styles.activitySubtitle}>Premium tier'a katıldı</Text>
            </View>
            <Text style={styles.activityTime}>15dk</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ThemeColors;
}

function MenuItem({ icon, title, subtitle, onPress, colors }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.8 : 1
        },
        menuItemStyles.container
      ]}
      onPress={onPress}
    >
      <View
        style={[
          menuItemStyles.iconContainer,
          { backgroundColor: colors.surfaceAlt || colors.background }
        ]}
      >
        {icon}
      </View>
      <View style={menuItemStyles.content}>
        <Text style={[menuItemStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[menuItemStyles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const menuItemStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    flex: 1,
    marginLeft: 14
  },
  title: {
    fontSize: 15,
    fontWeight: "600"
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2
  }
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary
    },
    name: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: 2
    },
    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center"
    },
    balanceCard: {
      marginHorizontal: 20,
      padding: 24,
      borderRadius: 20
    },
    balanceHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    },
    balanceLabel: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)"
    },
    balanceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    coinEmoji: {
      fontSize: 32
    },
    balanceValue: {
      fontSize: 36,
      fontWeight: "700",
      color: "#FFFFFF"
    },
    balanceSubtext: {
      fontSize: 14,
      color: "rgba(255,255,255,0.7)",
      marginTop: 8
    },
    statsRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 12
    },
    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      alignItems: "center",
      gap: 8
    },
    statValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      paddingHorizontal: 20,
      marginTop: 28,
      marginBottom: 14
    },
    menuSection: {
      paddingHorizontal: 20
    },
    activityCard: {
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 4
    },
    activityItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center"
    },
    activityContent: {
      flex: 1,
      marginLeft: 12
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary
    },
    activitySubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2
    },
    activityTime: {
      fontSize: 12,
      color: colors.textMuted
    },
    activityDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 12
    }
  });
