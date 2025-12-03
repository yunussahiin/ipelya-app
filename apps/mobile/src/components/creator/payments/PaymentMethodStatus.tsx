/**
 * PaymentMethodStatus Component
 * Ödeme yöntemi durum kartı
 *
 * Durumlar:
 * - none: Eklenmemiş
 * - pending: Onay Bekliyor
 * - approved: Onaylandı
 * - rejected: Reddedildi
 */

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { AlertCircle, Clock, CheckCircle2, XCircle, Plus, ChevronRight } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export type PaymentMethodStatusType = "none" | "pending" | "approved" | "rejected";

interface PaymentMethodStatusProps {
  status: PaymentMethodStatusType;
  methodName?: string;
  rejectionReason?: string;
  onAddPress?: () => void;
  onViewPress?: () => void;
}

const STATUS_CONFIG: Record<
  PaymentMethodStatusType,
  {
    icon: React.ComponentType<any>;
    title: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  none: {
    icon: AlertCircle,
    title: "Ödeme Yöntemi Eklenmemiş",
    description: "Kazancınızı çekebilmek için bir ödeme yöntemi ekleyin.",
    color: "#6B7280",
    bgColor: "rgba(107, 114, 128, 0.1)"
  },
  pending: {
    icon: Clock,
    title: "Onay Bekliyor",
    description: "Ödeme yönteminiz inceleniyor. Bu işlem 1-3 iş günü sürebilir.",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.1)"
  },
  approved: {
    icon: CheckCircle2,
    title: "Ödeme Yöntemi Onaylandı",
    description: "Kazancınızı istediğiniz zaman çekebilirsiniz.",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.1)"
  },
  rejected: {
    icon: XCircle,
    title: "Ödeme Yöntemi Reddedildi",
    description: "Lütfen bilgilerinizi kontrol edip tekrar deneyin.",
    color: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.1)"
  }
};

export function PaymentMethodStatus({
  status,
  methodName,
  rejectionReason,
  onAddPress,
  onViewPress
}: PaymentMethodStatusProps) {
  const { colors } = useTheme();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const handlePress = () => {
    if (status === "none" && onAddPress) {
      onAddPress();
    } else if (onViewPress) {
      onViewPress();
    }
  };

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.color
        }
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Icon size={24} color={config.color} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{config.title}</Text>

        {methodName && status !== "none" && (
          <Text style={[styles.methodName, { color: config.color }]}>{methodName}</Text>
        )}

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {rejectionReason && status === "rejected" ? rejectionReason : config.description}
        </Text>
      </View>

      <View style={styles.action}>
        {status === "none" ? (
          <View style={[styles.addButton, { backgroundColor: colors.accent }]}>
            <Plus size={18} color="#fff" />
          </View>
        ) : (
          <ChevronRight size={20} color={colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.5)"
  },
  content: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 15,
    fontWeight: "600"
  },
  methodName: {
    fontSize: 13,
    fontWeight: "500"
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  action: {
    marginLeft: 4
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  }
});

export default PaymentMethodStatus;
