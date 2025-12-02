/**
 * CoinRateSheet Component
 * Coin/TL kur bilgisi bottom sheet
 */

import React from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CoinRateSheetProps {
  visible: boolean;
  onClose: () => void;
  rate: number;
  updatedAt: string;
}

export function CoinRateSheet({ visible, onClose, rate, updatedAt }: CoinRateSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerIcon}>💱</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Coin/TL Dönüşüm Oranı</Text>
          </View>

          <View style={[styles.rateCard, { backgroundColor: colors.backgroundRaised }]}>
            <Text style={[styles.rateText, { color: colors.textPrimary }]}>
              1 Coin = ₺{rate.toFixed(2)}
            </Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>
              Son güncelleme: {formatDate(updatedAt)}
            </Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: `${colors.accent}15` }]}>
            <Ionicons name="information-circle" size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Bu oran sadece bilgilendirme amaçlıdır. Gerçek ödeme tutarı, ödeme talebi
              oluşturulduğunda geçerli kur üzerinden hesaplanır.
            </Text>
          </View>

          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.accent }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Tamam</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(128,128,128,0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20
  },
  headerIcon: {
    fontSize: 24
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  rateCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16
  },
  rateText: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4
  },
  dateText: {
    fontSize: 13
  },
  infoBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 20
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  }
});
