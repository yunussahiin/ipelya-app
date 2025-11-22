import { useMemo, useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { ArrowLeft, History, Clock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";

interface ActivityLog {
  id: string;
  action: string;
  profile_type: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Shadow Activity History Screen
 *
 * Gölge profil aktivitelerini gösterir:
 * - Mode geçişleri
 * - PIN değişiklikleri
 * - Başarısız denemeler
 * - Biometric kullanımı
 */
export default function ShadowActivityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error("Activity load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      shadow_mode_enter: "🎭 Gölge Mode Girişi",
      shadow_mode_exit: "👤 Normal Mode Dönüşü",
      shadow_mode_toggle: "🎭 Mode Geçişi",
      shadow_pin_change: "🔑 PIN Değişikliği",
      shadow_pin_failed: "❌ PIN Başarısız",
      biometric_success: "✅ Biometric Başarılı",
      biometric_failed: "❌ Biometric Başarısız",
      shadow_pin_created: "🔐 PIN Oluşturuldu",
      biometric_enabled: "👆 Biometric Etkinleştirildi",
      biometric_disabled: "🚫 Biometric Devre Dışı"
    };
    return labels[action] || `📝 ${action}`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins}m önce`;
    if (diffHours < 24) return `${diffHours}h önce`;
    if (diffDays < 7) return `${diffDays}d önce`;

    return date.toLocaleDateString("tr-TR");
  };

  return (
    <PageScreen showNavigation={false}>
      {() => (
        <>
          <View style={styles.headerContainer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.header}>
              <Text style={styles.label}>Gölge Profil</Text>
              <Text style={styles.title}>Aktivite</Text>
              <Text style={styles.subtitle}>Son gölge profil aktivitelerinizi görüntüleyin.</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <History size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aktivite Yok</Text>
              <Text style={styles.emptyText}>Henüz gölge profil aktivitesi bulunmuyor.</Text>
            </View>
          ) : (
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityAction}>{getActionLabel(item.action)}</Text>
                    <View style={styles.activityTime}>
                      <Clock size={12} color={colors.textMuted} />
                      <Text style={styles.activityTimeText}>{formatTime(item.timestamp)}</Text>
                    </View>
                  </View>
                </View>
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
      )}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingBottom: 16
    },
    backButton: {
      padding: 8,
      marginTop: -8
    },
    header: {
      gap: 8,
      flex: 1
    },
    label: {
      color: colors.textSecondary,
      textTransform: "uppercase",
      fontSize: 12
    },
    title: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: "700"
    },
    subtitle: {
      color: colors.textSecondary,
      lineHeight: 20
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 64
    },
    emptyContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 64,
      gap: 12
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "600"
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14
    },
    listContainer: {
      gap: 12
    },
    activityCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 12,
      gap: 8
    },
    activityHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    activityAction: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 14
    },
    activityTime: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4
    },
    activityTimeText: {
      color: colors.textMuted,
      fontSize: 12
    }
  });
