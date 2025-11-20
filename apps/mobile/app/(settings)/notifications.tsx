import React, { useState } from "react";
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

const NOTIFICATION_TYPES = [
  { key: "new_follower", label: "New Follower" },
  { key: "follow_back", label: "Follow Back" },
  { key: "profile_mention", label: "Profile Mention" },
  { key: "user_blocked", label: "User Blocked" },
  { key: "new_message", label: "New Message" },
  { key: "message_like", label: "Message Like" },
  { key: "message_reply", label: "Message Reply" },
  { key: "content_like", label: "Content Like" },
  { key: "content_comment", label: "Content Comment" },
  { key: "content_share", label: "Content Share" },
  { key: "content_update", label: "Content Update" },
  { key: "system_alert", label: "System Alert" },
  { key: "maintenance", label: "Maintenance" },
  { key: "security_alert", label: "Security Alert" },
  { key: "account_activity", label: "Account Activity" }
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { preferences, loading, error, setPushEnabled, setEmailEnabled, toggleNotificationType } =
    useNotificationPreferences();

  const [isSaving, setIsSaving] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
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
      Alert.alert("Error", "Failed to update push notifications setting");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailToggle = async (value: boolean) => {
    setIsSaving(true);
    try {
      await setEmailEnabled(value);
    } catch (err) {
      Alert.alert("Error", "Failed to update email notifications setting");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeToggle = async (type: string, value: boolean) => {
    setIsSaving(true);
    try {
      await toggleNotificationType(type, value);
    } catch (err) {
      Alert.alert("Error", "Failed to update notification type");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications on your device
              </Text>
            </View>
            <Switch
              value={preferences.push_enabled}
              onValueChange={handlePushToggle}
              disabled={isSaving}
              trackColor={{ false: "#ccc", true: "#FFB399" }}
              thumbColor={preferences.push_enabled ? "#FF6B35" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive email notifications</Text>
            </View>
            <Switch
              value={preferences.email_enabled}
              onValueChange={handleEmailToggle}
              disabled={isSaving}
              trackColor={{ false: "#ccc", true: "#FFB399" }}
              thumbColor={preferences.email_enabled ? "#FF6B35" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionDescription}>
            Choose which notifications you want to receive
          </Text>

          {NOTIFICATION_TYPES.map((type) => (
            <View key={type.key} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{type.label}</Text>
              <Switch
                value={preferences.notification_types[type.key] ?? true}
                onValueChange={(value) => handleTypeToggle(type.key, value)}
                disabled={isSaving}
                trackColor={{ false: "#ccc", true: "#FFB399" }}
                thumbColor={
                  (preferences.notification_types[type.key] ?? true) ? "#FF6B35" : "#f4f3f4"
                }
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>💡 Changes are saved automatically</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  backButton: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "500"
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000"
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
    color: "#000",
    marginBottom: 8
  },
  sectionDescription: {
    fontSize: 13,
    color: "#999",
    marginBottom: 12
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5"
  },
  settingInfo: {
    flex: 1,
    marginRight: 12
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 12,
    color: "#999"
  },
  infoSection: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 24
  },
  infoText: {
    fontSize: 13,
    color: "#666",
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
    color: "#ff4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#FF6B35",
    borderRadius: 8
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  }
});
