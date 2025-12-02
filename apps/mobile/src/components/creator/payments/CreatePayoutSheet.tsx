/**
 * CreatePayoutSheet Component
 * Para çekme talebi oluşturma bottom sheet
 */

import React, { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";

interface PaymentMethod {
  id: string;
  type: "bank" | "crypto";
  displayName: string;
  isDefault: boolean;
}

interface CreatePayoutSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    coinAmount: number;
    paymentMethodId: string;
  }) => Promise<{ success: boolean; error?: string }>;
  withdrawableBalance: number;
  coinRate: number;
  paymentMethods: PaymentMethod[];
  isSubmitting: boolean;
}

export function CreatePayoutSheet({
  visible,
  onClose,
  onSubmit,
  withdrawableBalance,
  coinRate,
  paymentMethods,
  isSubmitting
}: CreatePayoutSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [coinAmount, setCoinAmount] = useState(Math.min(1000, withdrawableBalance));
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    paymentMethods.find((m) => m.isDefault)?.id || paymentMethods[0]?.id || ""
  );
  const [error, setError] = useState<string | null>(null);

  const tlAmount = useMemo(() => coinAmount * coinRate, [coinAmount, coinRate]);

  const handleSubmit = async () => {
    setError(null);

    if (coinAmount < 500) {
      setError("Minimum çekim tutarı 500 coin");
      return;
    }

    if (!selectedMethodId) {
      setError("Lütfen bir ödeme yöntemi seçin");
      return;
    }

    const result = await onSubmit({ coinAmount, paymentMethodId: selectedMethodId });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
  };

  const quickAmounts = [
    Math.min(500, withdrawableBalance),
    Math.min(1000, withdrawableBalance),
    Math.min(5000, withdrawableBalance),
    withdrawableBalance
  ].filter((v, i, a) => a.indexOf(v) === i && v >= 500);

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

          <Text style={[styles.title, { color: colors.textPrimary }]}>Para Çek</Text>

          {/* Amount Display */}
          <View style={[styles.amountDisplay, { backgroundColor: colors.backgroundRaised }]}>
            <Text style={[styles.coinAmount, { color: colors.textPrimary }]}>
              🪙 {coinAmount.toLocaleString("tr-TR")}
            </Text>
            <Text style={[styles.tlAmount, { color: colors.textMuted }]}>
              ≈ ₺{tlAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Slider */}
          <Slider
            style={styles.slider}
            minimumValue={500}
            maximumValue={withdrawableBalance}
            step={100}
            value={coinAmount}
            onValueChange={setCoinAmount}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.accent}
          />

          {/* Quick Amounts */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((amount) => (
              <Pressable
                key={amount}
                style={[
                  styles.quickButton,
                  {
                    backgroundColor:
                      coinAmount === amount ? colors.accent : colors.backgroundRaised,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setCoinAmount(amount)}
              >
                <Text
                  style={[
                    styles.quickText,
                    { color: coinAmount === amount ? "#fff" : colors.textSecondary }
                  ]}
                >
                  {amount === withdrawableBalance ? "Tümü" : `${amount.toLocaleString("tr-TR")}`}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Payment Method Selector */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Ödeme Yöntemi</Text>
          <View style={styles.methodList}>
            {paymentMethods.map((method) => (
              <Pressable
                key={method.id}
                style={[
                  styles.methodItem,
                  {
                    backgroundColor:
                      selectedMethodId === method.id
                        ? `${colors.accent}20`
                        : colors.backgroundRaised,
                    borderColor: selectedMethodId === method.id ? colors.accent : colors.border
                  }
                ]}
                onPress={() => setSelectedMethodId(method.id)}
              >
                <Ionicons
                  name={method.type === "bank" ? "card" : "wallet"}
                  size={18}
                  color={selectedMethodId === method.id ? colors.accent : colors.textMuted}
                />
                <Text
                  style={[
                    styles.methodText,
                    { color: selectedMethodId === method.id ? colors.accent : colors.textPrimary }
                  ]}
                >
                  {method.displayName}
                </Text>
                {selectedMethodId === method.id && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Rate Lock Info */}
          <View style={[styles.infoBox, { backgroundColor: `${colors.accent}10` }]}>
            <Ionicons name="lock-closed" size={16} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Kur talep anında kilitlenecek: 1 coin = ₺{coinRate.toFixed(2)}
            </Text>
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: "#EF444410" }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.buttons}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>İptal</Text>
            </Pressable>

            <Pressable
              style={[styles.submitButton, { backgroundColor: colors.accent }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? "Oluşturuluyor..." : "Talep Oluştur"}
              </Text>
            </Pressable>
          </View>
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20
  },
  amountDisplay: {
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16
  },
  coinAmount: {
    fontSize: 32,
    fontWeight: "700"
  },
  tlAmount: {
    fontSize: 16,
    marginTop: 4
  },
  slider: {
    width: "100%",
    height: 40
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 20
  },
  quickButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center"
  },
  quickText: {
    fontSize: 13,
    fontWeight: "500"
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 8
  },
  methodList: {
    gap: 8,
    marginBottom: 16
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10
  },
  methodText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500"
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16
  },
  infoText: {
    flex: 1,
    fontSize: 13
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13
  },
  buttons: {
    flexDirection: "row",
    gap: 12
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center"
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500"
  },
  submitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center"
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600"
  }
});
