import React from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "expo-router";

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const router = useRouter();

  const handlePress = () => {
    router.push("/(notifications)");
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      {/* Bell icon */}
      <Text style={styles.bellIcon}>🔔</Text>

      {/* Badge */}
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center"
  },
  bellIcon: {
    fontSize: 24
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF6B35",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff"
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  }
});
