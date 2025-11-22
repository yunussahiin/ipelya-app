/**
 * Shadow Audit Logs Screen
 * Displays audit logs for shadow profile activities
 */

import { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from "react-native";
import { ArrowLeft, Shield, AlertCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { getAuditLogs, type AuditLogEntry, type AuditAction } from "@/services/audit.service";

const ACTION_LABELS: Record<AuditAction, { label: string; emoji: string; color: string }> = {
  shadow_mode_enabled: { label: "Gölge Mod Açıldı", emoji: "🎭", color: "#7C3AED" },
  shadow_mode_disabled: { label: "Gölge Mod Kapatıldı", emoji: "👤", color: "#6B7280" },
  pin_created: { label: "PIN Oluşturuldu", emoji: "🔐", color: "#10B981" },
  pin_changed: { label: "PIN Değiştirildi", emoji: "🔑", color: "#F59E0B" },
  pin_verified: { label: "PIN Doğrulandı", emoji: "✅", color: "#10B981" },
  pin_failed: { label: "PIN Başarısız", emoji: "❌", color: "#EF4444" },
  biometric_enabled: { label: "Biometric Açıldı", emoji: "👆", color: "#10B981" },
  biometric_disabled: { label: "Biometric Kapatıldı", emoji: "🚫", color: "#6B7280" },
  biometric_verified: { label: "Biometric Doğrulandı", emoji: "✅", color: "#10B981" },
  biometric_failed: { label: "Biometric Başarısız", emoji: "❌", color: "#EF4444" },
  profile_updated: { label: "Profil Güncellendi", emoji: "✏️", color: "#3B82F6" },
  avatar_uploaded: { label: "Avatar Yüklendi", emoji: "📸", color: "#3B82F6" },
  session_started: { label: "Oturum Başladı", emoji: "▶️", color: "#10B981" },
  session_ended: { label: "Oturum Bitti", emoji: "⏹️", color: "#6B7280" },
  session_timeout: { label: "Oturum Zaman Aşımı", emoji: "⏱️", color: "#EF4444" }
};

interface AuditLogDisplay extends AuditLogEntry {
  displayTime: string;
}

export default function ShadowAuditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [logs, setLogs] = useState<AuditLogDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await getAuditLogs(user.id, 100);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to load logs");
      }

      // Format logs with display time
      const displayLogs = result.data.map((log) => ({
        ...log,
        displayTime: formatTime(log.created_at)
      }));

      setLogs(displayLogs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load audit logs";
      setError(message);
      console.error("❌ Load audit logs error:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoString?: string): string {
    if (!isoString) return "Bilinmiyor";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Şimdi";
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString("tr-TR");
  }

  function renderLogItem({ item }: { item: AuditLogDisplay }) {
    const actionInfo = ACTION_LABELS[item.action];

    return (
      <View style={[styles.logItem, { borderLeftColor: actionInfo.color }]}>
        <View style={styles.logItemContent}>
          <View style={styles.logItemHeader}>
            <Text style={styles.logItemEmoji}>{actionInfo.emoji}</Text>
            <View style={styles.logItemTextContainer}>
              <Text style={[styles.logItemAction, { color: colors.textPrimary }]}>
                {actionInfo.label}
              </Text>
              <Text style={styles.logItemTime}>{item.displayTime}</Text>
            </View>
          </View>
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <Text style={styles.logItemMetadata}>
              {JSON.stringify(item.metadata).substring(0, 50)}...
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <PageScreen showNavigation={false}>
        {() => (
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.title}>Aktivite Geçmişi</Text>
            </View>
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          </View>
        )}
      </PageScreen>
    );
  }

  return (
    <PageScreen showNavigation={false}>
      {() => (
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Aktivite Geçmişi</Text>
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.surface }]}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Shield size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aktivite Yok</Text>
              <Text style={styles.emptyText}>Gölge profil aktiviteleri burada gösterilecek</Text>
            </View>
          ) : (
            <FlatList
              data={logs}
              renderItem={renderLogItem}
              keyExtractor={(item, index) => item.id || `log-${index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </PageScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    backButton: {
      padding: 8,
      marginRight: 12
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FEE2E2"
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: "#EF4444",
      fontWeight: "500"
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: 12
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: "center"
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8
    },
    logItem: {
      borderLeftWidth: 4,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    logItemContent: {
      gap: 8
    },
    logItemHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8
    },
    logItemEmoji: {
      fontSize: 18,
      marginTop: 2
    },
    logItemTextContainer: {
      flex: 1
    },
    logItemAction: {
      fontSize: 14,
      fontWeight: "600"
    },
    logItemTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2
    },
    logItemMetadata: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily: "monospace"
    }
  });
}
