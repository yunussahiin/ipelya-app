/**
 * KYCStatusCard Component
 * KYC doğrulama durumu kartı
 */

import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useRouter } from "expo-router";

interface KYCStatusCardProps {
  status: "none" | "pending" | "approved" | "rejected";
  level?: "basic" | "full" | null;
  verifiedName?: string | null;
  monthlyLimit?: number | null;
  pendingSubmittedAt?: string | null;
  rejectionReason?: string | null;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  none: {
    icon: "shield-outline",
    color: "#6B7280",
    title: "Kimlik Doğrulanmamış",
    description: "Para çekmek için kimlik doğrulaması yapmanız gerekiyor.",
    actionLabel: "Doğrulamayı Başlat",
    bgColor: "#6B728010"
  },
  pending: {
    icon: "time",
    color: "#F59E0B",
    title: "Doğrulama Bekleniyor",
    description: "Başvurunuz inceleniyor. Genellikle 24 saat içinde sonuçlanır.",
    actionLabel: null,
    bgColor: "#F59E0B10"
  },
  approved: {
    icon: "shield-checkmark",
    color: "#10B981",
    title: "Kimlik Doğrulandı",
    description: "Hesabınız doğrulanmış. Para çekme işlemleri aktif.",
    actionLabel: null,
    bgColor: "#10B98110"
  },
  rejected: {
    icon: "shield-outline",
    color: "#EF4444",
    title: "Doğrulama Reddedildi",
    description: "Başvurunuz reddedildi. Yeni bir başvuru yapabilirsiniz.",
    actionLabel: "Tekrar Dene",
    bgColor: "#EF444410"
  }
};

export function KYCStatusCard({
  status,
  level,
  verifiedName,
  monthlyLimit,
  pendingSubmittedAt,
  rejectionReason,
  isLoading
}: KYCStatusCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.card, { backgroundColor: config.bgColor }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{config.title}</Text>
          {level && status === "approved" && (
            <View style={[styles.levelBadge, { backgroundColor: `${config.color}20` }]}>
              <Text style={[styles.levelText, { color: config.color }]}>
                {level === "basic" ? "Temel" : "Tam"} Doğrulama
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {config.description}
      </Text>

      {status === "approved" && verifiedName && (
        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Doğrulanan İsim</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{verifiedName}</Text>
          </View>
          {monthlyLimit && level === "basic" && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Aylık Limit</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                ₺{monthlyLimit.toLocaleString("tr-TR")}
              </Text>
            </View>
          )}
        </View>
      )}

      {status === "pending" && pendingSubmittedAt && (
        <Text style={[styles.subtext, { color: colors.textMuted }]}>
          Gönderildi:{" "}
          {new Date(pendingSubmittedAt).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </Text>
      )}

      {status === "rejected" && rejectionReason && (
        <View style={[styles.rejectionBox, { backgroundColor: "#EF444410" }]}>
          <Ionicons name="warning" size={16} color="#EF4444" />
          <Text style={styles.rejectionText}>{rejectionReason}</Text>
        </View>
      )}

      {config.actionLabel && (
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={() => router.push("/(creator)/kyc")}
        >
          <Text style={styles.actionButtonText}>{config.actionLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  headerText: {
    flex: 1,
    gap: 4
  },
  title: {
    fontSize: 17,
    fontWeight: "600"
  },
  levelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  levelText: {
    fontSize: 11,
    fontWeight: "500"
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  infoBox: {
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  infoLabel: {
    fontSize: 13
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "500"
  },
  subtext: {
    fontSize: 12,
    marginBottom: 12
  },
  rejectionBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12
  },
  rejectionText: {
    flex: 1,
    color: "#EF4444",
    fontSize: 13
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600"
  }
});
