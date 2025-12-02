/**
 * AutoPayoutSettings Component
 * Otomatik ödeme ayarları
 */

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Switch, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";

interface PaymentMethod {
  id: string;
  type: "bank" | "crypto";
  displayName: string;
  isDefault: boolean;
}

interface AutoPayoutSettingsProps {
  settings: {
    isEnabled: boolean;
    minimumCoinAmount: number;
    paymentMethodId: string | null;
  } | null;
  paymentMethods: PaymentMethod[];
  onToggle: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  onUpdate: (data: {
    minimumCoinAmount?: number;
    paymentMethodId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  isSaving: boolean;
}

export function AutoPayoutSettings({
  settings,
  paymentMethods,
  onToggle,
  onUpdate,
  isSaving
}: AutoPayoutSettingsProps) {
  const { colors } = useTheme();
  const [localMinimum, setLocalMinimum] = useState(
    settings?.minimumCoinAmount?.toString() || "1000"
  );
  const [error, setError] = useState<string | null>(null);

  const approvedMethods = paymentMethods.filter((m) => m.isDefault || true); // Sadece approved olanlar

  const handleToggle = async (value: boolean) => {
    if (value && approvedMethods.length === 0) {
      setError("Önce onaylı bir ödeme yöntemi ekleyin");
      return;
    }

    const result = await onToggle(value);
    if (!result.success) {
      setError(result.error || "Bir hata oluştu");
    }
  };

  const handleMethodChange = async (methodId: string) => {
    const result = await onUpdate({ paymentMethodId: methodId });
    if (!result.success) {
      setError(result.error || "Bir hata oluştu");
    }
  };

  const handleMinimumBlur = async () => {
    const amount = parseInt(localMinimum, 10);
    if (isNaN(amount) || amount < 500) {
      setError("Minimum 500 coin olmalı");
      setLocalMinimum(settings?.minimumCoinAmount?.toString() || "1000");
      return;
    }

    if (amount !== settings?.minimumCoinAmount) {
      const result = await onUpdate({ minimumCoinAmount: amount });
      if (!result.success) {
        setError(result.error || "Bir hata oluştu");
        setLocalMinimum(settings?.minimumCoinAmount?.toString() || "1000");
      }
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
          <Ionicons name="repeat" size={20} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Otomatik Ödeme</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Her hafta otomatik para çekimi
          </Text>
        </View>
        <Switch
          value={settings?.isEnabled || false}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#fff"
          disabled={isSaving}
        />
      </View>

      {settings?.isEnabled && (
        <>
          {/* Minimum Amount */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Minimum Bakiye (coin)
            </Text>
            <View
              style={[
                styles.input,
                { backgroundColor: colors.backgroundRaised, borderColor: colors.border }
              ]}
            >
              <TextInput
                style={[styles.inputText, { color: colors.textPrimary }]}
                value={localMinimum}
                onChangeText={setLocalMinimum}
                onBlur={handleMinimumBlur}
                keyboardType="numeric"
                placeholder="1000"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.inputSuffix, { color: colors.textMuted }]}>🪙</Text>
            </View>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Bakiyeniz bu tutara ulaştığında otomatik çekim yapılır
            </Text>
          </View>

          {/* Payment Method */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Ödeme Yöntemi</Text>
            {approvedMethods.length === 0 ? (
              <Text style={[styles.noMethod, { color: colors.textMuted }]}>
                Onaylı ödeme yöntemi yok
              </Text>
            ) : (
              <View style={styles.methodList}>
                {approvedMethods.map((method) => (
                  <Pressable
                    key={method.id}
                    style={[
                      styles.methodItem,
                      {
                        backgroundColor:
                          settings.paymentMethodId === method.id
                            ? `${colors.accent}20`
                            : colors.backgroundRaised,
                        borderColor:
                          settings.paymentMethodId === method.id ? colors.accent : colors.border
                      }
                    ]}
                    onPress={() => handleMethodChange(method.id)}
                  >
                    <Ionicons
                      name={method.type === "bank" ? "card" : "wallet"}
                      size={16}
                      color={
                        settings.paymentMethodId === method.id ? colors.accent : colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.methodText,
                        {
                          color:
                            settings.paymentMethodId === method.id
                              ? colors.accent
                              : colors.textPrimary
                        }
                      ]}
                    >
                      {method.displayName}
                    </Text>
                    {settings.paymentMethodId === method.id && (
                      <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {error && (
        <View style={[styles.errorBox, { backgroundColor: "#EF444410" }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Info */}
      <View style={[styles.infoBox, { backgroundColor: `${colors.accent}10` }]}>
        <Ionicons name="information-circle" size={16} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Otomatik ödemeler her Pazartesi saat 10:00'da işlenir.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: "600"
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2
  },
  field: {
    marginTop: 16
  },
  label: {
    fontSize: 13,
    marginBottom: 6
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12
  },
  inputText: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15
  },
  inputSuffix: {
    fontSize: 16
  },
  hint: {
    fontSize: 12,
    marginTop: 4
  },
  noMethod: {
    fontSize: 13,
    fontStyle: "italic"
  },
  methodList: {
    gap: 8
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8
  },
  methodText: {
    flex: 1,
    fontSize: 14
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 10,
    borderRadius: 8,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 12
  }
});
