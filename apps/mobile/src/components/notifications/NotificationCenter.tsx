import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator
} from "react-native";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationCenter() {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh logic would go here
    setRefreshing(false);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>📬 No notifications yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with unread count */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Mark all as read button */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllButtonText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notifications list */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onMarkAsRead={() => markAsRead(item.id)}
            onDelete={() => deleteNotification(item.id)}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000"
  },
  badge: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600"
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  markAllButtonText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "500"
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
    textAlign: "center"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  emptyText: {
    fontSize: 16,
    color: "#999"
  }
});
