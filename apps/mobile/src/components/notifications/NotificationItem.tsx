import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const handleDelete = () => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this notification?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: onDelete,
        style: "destructive"
      }
    ]);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, !notification.read && styles.unreadContainer]}>
      {/* Unread indicator */}
      {!notification.read && <View style={styles.unreadDot} />}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{formatTime(notification.created_at)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!notification.read && (
          <TouchableOpacity style={styles.actionButton} onPress={onMarkAsRead}>
            <Text style={styles.actionButtonText}>✓</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    alignItems: "center",
    backgroundColor: "#fafafa"
  },
  unreadContainer: {
    backgroundColor: "#fff9f5"
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B35",
    marginRight: 12
  },
  content: {
    flex: 1,
    marginRight: 12
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4
  },
  body: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    lineHeight: 18
  },
  time: {
    fontSize: 12,
    color: "#999"
  },
  actions: {
    flexDirection: "row",
    gap: 8
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8e8e8"
  },
  actionButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600"
  },
  deleteButton: {
    backgroundColor: "#ffe8e0"
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#FF6B35",
    fontWeight: "600"
  }
});
