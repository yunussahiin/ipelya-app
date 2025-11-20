/**
 * Followers Screen
 * Displays followers, following, and subscriptions in tabs
 */

import { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useFollowersRealtime } from "@/hooks/useFollowersRealtime";
import { FollowersList } from "@/components/profile/FollowersList";
import { FollowingList } from "@/components/profile/FollowingList";
import { supabase } from "@/lib/supabaseClient";

type Tab = "followers" | "following" | "subscriptions";

export default function FollowersScreen() {
  const router = useRouter();
  const { userId: profileId } = useLocalSearchParams<{ userId: string }>();
  const { colors } = useTheme();
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [displayName, setDisplayName] = useState<string>("Takipçiler");
  const [targetUserId, setTargetUserId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<Tab>("followers");

  // Hook'a currentUserId geçmeliyiz (auth user ID, profile ID değil)
  const { stats: realtimeStats } = useFollowersRealtime(currentUserId);

  // Debug log
  useEffect(() => {
    console.log("📊 Followers screen - realtimeStats updated:", realtimeStats);
  }, [realtimeStats]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  // Get current user and load stats
  useEffect(() => {
    const initScreen = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        if (profileId) {
          // Load profile to get display name and user_id
          // profileId is profiles.id, need to get user_id
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, user_id")
            .eq("id", profileId)
            .eq("type", "real")
            .single();

          if (profile) {
            console.log("📋 Profile found:", profile);
            setDisplayName(profile.display_name);
            setTargetUserId(profile.user_id);
            console.log("🎯 Target user ID set to:", profile.user_id);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    initScreen();
  }, [profileId]);

  if (!profileId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Kullanıcı bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessible={true}
          accessibilityLabel="Geri dön"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{displayName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === "followers" && styles.tabActive]}
          onPress={() => setActiveTab("followers")}
          accessible={true}
          accessibilityLabel={`Takipçiler ${realtimeStats.followers_count}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "followers" }}
        >
          <Text style={[styles.tabText, activeTab === "followers" && styles.tabTextActive]}>
            {realtimeStats.followers_count}
          </Text>
          <Text style={[styles.tabLabel, activeTab === "followers" && styles.tabLabelActive]}>
            Takipçi
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === "following" && styles.tabActive]}
          onPress={() => setActiveTab("following")}
          accessible={true}
          accessibilityLabel={`Takip Edilen ${realtimeStats.following_count}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "following" }}
        >
          <Text style={[styles.tabText, activeTab === "following" && styles.tabTextActive]}>
            {realtimeStats.following_count}
          </Text>
          <Text style={[styles.tabLabel, activeTab === "following" && styles.tabLabelActive]}>
            Takip
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === "subscriptions" && styles.tabActive]}
          onPress={() => setActiveTab("subscriptions")}
          accessible={true}
          accessibilityLabel="Abonelikler"
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "subscriptions" }}
        >
          <Text style={[styles.tabText, activeTab === "subscriptions" && styles.tabTextActive]}>
            0
          </Text>
          <Text style={[styles.tabLabel, activeTab === "subscriptions" && styles.tabLabelActive]}>
            Abone
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "followers" && targetUserId && (
          <FollowersList userId={targetUserId} currentUserId={currentUserId} />
        )}
        {activeTab === "following" && targetUserId && <FollowingList userId={targetUserId} />}
        {activeTab === "subscriptions" && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz abone yok</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
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
      justifyContent: "center",
      alignItems: "center"
    },
    title: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600"
    },
    tabsContainer: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    tab: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      gap: 4
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: colors.accent
    },
    tabText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600"
    },
    tabTextActive: {
      color: colors.accent
    },
    tabLabel: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "500"
    },
    tabLabelActive: {
      color: colors.textPrimary
    },
    tabIndicatorContainer: {
      height: 2,
      backgroundColor: colors.surface,
      position: "relative"
    },
    tabIndicator: {
      position: "absolute",
      width: "33.33%",
      height: 2,
      backgroundColor: colors.accent,
      top: 0
    },
    content: {
      flex: 1
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingVertical: 16
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      minHeight: 300
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500"
    },
    errorText: {
      color: colors.textPrimary,
      fontSize: 16,
      textAlign: "center",
      marginTop: 20
    }
  });
