/**
 * PaymentMethodCard Component
 * Tek ödeme yöntemi kartı
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface PaymentMethodCardProps {
  method: {
    id: string;
    type: "bank" | "crypto";
    displayName: string;
    isDefault: boolean;
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    details: {
      bank_name?: string;
      iban?: string;
      account_holder?: string;
      crypto_network?: string;
      wallet_address?: string;
    };
  };
  onPress?: () => void;
  onSetDefault?: () => void;
  onDelete?: () => void;
}

export function PaymentMethodCard({
  method,
  onPress,
  onSetDefault,
  onDelete
}: PaymentMethodCardProps) {
  const { colors } = useTheme();

  const STATUS_CONFIG = {
    pending: { icon: "time", color: "#F59E0B", label: "Onay Bekliyor" },
    approved: { icon: "checkmark-circle", color: "#10B981", label: "Onaylandı" },
    rejected: { icon: "close-circle", color: "#EF4444", label: "Reddedildi" }
  };

  const statusConfig = STATUS_CONFIG[method.status];

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: method.type === "bank" ? `${colors.accent}20` : "#8B5CF620" }
          ]}
        >
          <Ionicons
            name={method.type === "bank" ? "card" : "wallet"}
            size={22}
            color={method.type === "bank" ? colors.accent : "#8B5CF6"}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>
              {method.details.bank_name || method.details.crypto_network}
            </Text>
            {method.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: `${colors.accent}20` }]}>
                <Text style={[styles.defaultText, { color: colors.accent }]}>Varsayılan</Text>
              </View>
            )}
          </View>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {method.type === "bank"
              ? `****${method.details.iban?.slice(-4) || ""}`
              : `****${method.details.wallet_address?.slice(-4) || ""}`}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusBadge}>
          <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {method.status === "approved" && !method.isDefault && onSetDefault && (
          <Pressable onPress={onSetDefault}>
            <Text style={[styles.actionText, { color: colors.accent }]}>Varsayılan Yap</Text>
          </Pressable>
        )}
      </View>

      {method.status === "rejected" && method.rejectionReason && (
        <View style={[styles.rejectionBox, { backgroundColor: "#EF444410" }]}>
          <Text style={[styles.rejectionText, { color: "#EF4444" }]}>{method.rejectionReason}</Text>
        </View>
      )}

      {onDelete && method.status !== "approved" && (
        <Pressable style={styles.deleteButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 10
  },
  header: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  info: {
    flex: 1,
    justifyContent: "center"
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2
  },
  name: {
    fontSize: 15,
    fontWeight: "600"
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  defaultText: {
    fontSize: 11,
    fontWeight: "500"
  },
  detail: {
    fontSize: 13
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500"
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500"
  },
  rejectionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8
  },
  rejectionText: {
    fontSize: 12
  },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4
  }
});
