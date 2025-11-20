import { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { CheckCheck } from "lucide-react-native";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, unreadCount } =
    useNotifications();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleNotificationPress = useCallback(
    async (notification: NotificationItem) => {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification.id);
      }

      // Handle deep linking based on notification type
      if (notification.data?.url) {
        router.push(notification.data.url as string);
      } else if (notification.data?.actor_id) {
        switch (notification.type) {
          case "new_follower":
          case "follow_back":
            router.push(`/(profile)/${notification.data.actor_id}`);
            break;
          case "new_message":
          case "message_like":
          case "message_reply":
            router.push(`/messages/${notification.data.actor_id}`);
            break;
        }
      } else if (notification.data?.content_id) {
        router.push(`/content/${notification.data.content_id}`);
      }
    },
    [markAsRead, router]
  );

  const renderNotification = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <Pressable
        style={[styles.notificationItem, !item.read && styles.notificationItemUnread]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationTime}>
            {new Date(item.created_at).toLocaleDateString("tr-TR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </Text>
        </View>
        <Pressable style={styles.deleteButton} onPress={() => deleteNotification(item.id)}>
          <Trash2 size={18} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    ),
    [handleNotificationPress, deleteNotification, colors, styles]
  );

  if (loading) {
    return (
      <PageScreen>
        {() => (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}
      </PageScreen>
    );
  }

  return (
    <PageScreen>
      {() => (
        <>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              accessible={true}
              accessibilityLabel="Geri dön"
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Bildirimler ({unreadCount})</Text>
            <Pressable
              style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
              onPress={markAllAsRead}
              disabled={unreadCount === 0}
              accessible={true}
              accessibilityLabel="Tümünü oku"
              accessibilityRole="button"
            >
              <CheckCheck
                size={20}
                color={unreadCount > 0 ? colors.accent : colors.textSecondary}
              />
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bildirim yok</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
              extraData={[notifications, unreadCount]}
              removeClippedSubviews={false}
            />
          )}
        </>
      )}
    </PageScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 16,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    title: {
      color: colors.textPrimary,
      fontSize: 20,
      fontWeight: "700"
    },
    markAllButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    markAllButtonDisabled: {
      opacity: 0.5
    },
    spacer: {
      width: 40
    },
    listContainer: {
      gap: 12
    },
    notificationItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    notificationItemUnread: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderWidth: 2
    },
    notificationContent: {
      flex: 1,
      gap: 4
    },
    notificationTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "600"
    },
    notificationBody: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18
    },
    notificationTime: {
      color: colors.textSecondary,
      fontSize: 12
    },
    deleteButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16
    }
  });
}
