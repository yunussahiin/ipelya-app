import React, { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const NOTIFICATION_TYPES = [
  { key: "new_follower", label: "Yeni Takipçi" },
  { key: "follow_back", label: "Takip Geri Dönüşü" },
  { key: "profile_mention", label: "Profil Bahsedilmesi" },
  { key: "user_blocked", label: "Kullanıcı Engellendi" },
  { key: "new_message", label: "Yeni Mesaj" },
  { key: "message_like", label: "Mesaj Beğenisi" },
  { key: "message_reply", label: "Mesaj Yanıtı" },
  { key: "content_like", label: "İçerik Beğenisi" },
  { key: "content_comment", label: "İçerik Yorumu" },
  { key: "content_share", label: "İçerik Paylaşımı" },
  { key: "content_update", label: "İçerik Güncellemesi" },
  { key: "system_alert", label: "Sistem Uyarısı" },
  { key: "maintenance", label: "Bakım" },
  { key: "security_alert", label: "Güvenlik Uyarısı" },
  { key: "account_activity", label: "Hesap Aktivitesi" }
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { preferences, loading, error, setPushEnabled, setEmailEnabled, toggleNotificationType } =
    useNotificationPreferences();

  const [isSaving, setIsSaving] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Hata: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handlePushToggle = async (value: boolean) => {
    setIsSaving(true);
    try {
      await setPushEnabled(value);
    } catch (err) {
      Alert.alert("Hata", "Push bildirimleri ayarı güncellenemedi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailToggle = async (value: boolean) => {
    setIsSaving(true);
    try {
      await setEmailEnabled(value);
    } catch (err) {
      Alert.alert("Hata", "E-posta bildirimleri ayarı güncellenemedi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeToggle = async (type: string, value: boolean) => {
    setIsSaving(true);
    try {
      await toggleNotificationType(type, value);
    } catch (err) {
      Alert.alert("Hata", "Bildirim türü güncellenemedi");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bildirim Ayarları</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Genel Ayarlar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Bildirimleri</Text>
              <Text style={styles.settingDescription}>Cihazınızda push bildirimleri alın</Text>
            </View>
            <Switch
              value={preferences.push_enabled}
              onValueChange={handlePushToggle}
              disabled={isSaving}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
              thumbColor={preferences.push_enabled ? colors.accent : colors.surface}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>E-posta Bildirimleri</Text>
              <Text style={styles.settingDescription}>E-posta bildirimleri alın</Text>
            </View>
            <Switch
              value={preferences.email_enabled}
              onValueChange={handleEmailToggle}
              disabled={isSaving}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
              thumbColor={preferences.email_enabled ? colors.accent : colors.surface}
            />
          </View>
        </View>

        {/* Bildirim Türleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirim Türleri</Text>
          <Text style={styles.sectionDescription}>Almak istediğiniz bildirimleri seçin</Text>

          {NOTIFICATION_TYPES.map((type) => (
            <View key={type.key} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{type.label}</Text>
              <Switch
                value={preferences.notification_types[type.key] ?? true}
                onValueChange={(value) => handleTypeToggle(type.key, value)}
                disabled={isSaving}
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={
                  (preferences.notification_types[type.key] ?? true)
                    ? colors.accent
                    : colors.surface
                }
              />
            </View>
          ))}
        </View>

        {/* Bilgi */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>💡 Değişiklikler otomatik olarak kaydedilir</Text>
        </View>
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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    backButton: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: "500"
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16
    },
    section: {
      marginBottom: 24
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 8
    },
    sectionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    settingInfo: {
      flex: 1,
      marginRight: 12
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textPrimary,
      marginBottom: 4
    },
    settingDescription: {
      fontSize: 12,
      color: colors.textSecondary
    },
    infoSection: {
      paddingVertical: 16,
      paddingHorizontal: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 24
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center"
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 16
    },
    errorText: {
      color: colors.warning,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 16
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.accent,
      borderRadius: 8
    },
    retryButtonText: {
      color: colors.buttonPrimaryText,
      fontSize: 14,
      fontWeight: "600"
    }
  });
