/**
 * AddCryptoWalletSheet Component
 * Kripto cüzdan ekleme bottom sheet
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CryptoNetwork = "TRC20" | "ERC20" | "BEP20";

interface AddCryptoWalletSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    cryptoNetwork: CryptoNetwork;
    walletAddress: string;
    isDefault: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
}

const NETWORKS: { key: CryptoNetwork; label: string; description: string }[] = [
  { key: "TRC20", label: "TRC20 (Tron)", description: "Düşük işlem ücreti" },
  { key: "ERC20", label: "ERC20 (Ethereum)", description: "Yaygın kullanım" },
  { key: "BEP20", label: "BEP20 (BSC)", description: "Binance Smart Chain" }
];

export function AddCryptoWalletSheet({
  visible,
  onClose,
  onSubmit,
  isSubmitting
}: AddCryptoWalletSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [network, setNetwork] = useState<CryptoNetwork>("TRC20");
  const [walletAddress, setWalletAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAddress = (address: string, network: CryptoNetwork) => {
    // Basic validation
    if (!address || address.length < 20) return false;

    // Network specific validation
    switch (network) {
      case "TRC20":
        return address.startsWith("T") && address.length === 34;
      case "ERC20":
      case "BEP20":
        return address.startsWith("0x") && address.length === 42;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateAddress(walletAddress, network)) {
      setError("Geçersiz cüzdan adresi formatı");
      return;
    }

    const result = await onSubmit({ cryptoNetwork: network, walletAddress, isDefault });

    if (result.success) {
      setNetwork("TRC20");
      setWalletAddress("");
      setIsDefault(false);
      onClose();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            <Text style={[styles.title, { color: colors.textPrimary }]}>Kripto Cüzdan Ekle</Text>

            {/* Network Selection */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Ağ Seçin</Text>
              <View style={styles.networkList}>
                {NETWORKS.map((n) => (
                  <Pressable
                    key={n.key}
                    style={[
                      styles.networkItem,
                      {
                        backgroundColor:
                          network === n.key ? `${colors.accent}20` : colors.backgroundRaised,
                        borderColor: network === n.key ? colors.accent : colors.border
                      }
                    ]}
                    onPress={() => setNetwork(n.key)}
                  >
                    <View style={styles.networkInfo}>
                      <Text
                        style={[
                          styles.networkLabel,
                          { color: network === n.key ? colors.accent : colors.textPrimary }
                        ]}
                      >
                        {n.label}
                      </Text>
                      <Text style={[styles.networkDesc, { color: colors.textMuted }]}>
                        {n.description}
                      </Text>
                    </View>
                    {network === n.key && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Wallet Address */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Cüzdan Adresi</Text>
              <View
                style={[
                  styles.input,
                  { backgroundColor: colors.backgroundRaised, borderColor: colors.border }
                ]}
              >
                <TextInput
                  style={[styles.inputText, { color: colors.textPrimary }]}
                  value={walletAddress}
                  onChangeText={setWalletAddress}
                  placeholder={network === "TRC20" ? "T..." : "0x..."}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Default Toggle */}
            <Pressable style={styles.toggleRow} onPress={() => setIsDefault(!isDefault)}>
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                Varsayılan ödeme yöntemi olarak ayarla
              </Text>
              <Ionicons
                name={isDefault ? "checkbox" : "square-outline"}
                size={24}
                color={isDefault ? colors.accent : colors.textMuted}
              />
            </Pressable>

            {/* Warning */}
            <View style={[styles.warningBox, { backgroundColor: "#F59E0B10" }]}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                USDT gönderimi yapılacaktır. Lütfen doğru ağı seçtiğinizden emin olun.
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
                <Text style={styles.submitText}>{isSubmitting ? "Ekleniyor..." : "Ekle"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
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
  field: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    marginBottom: 8
  },
  networkList: {
    gap: 8
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1
  },
  networkInfo: {
    flex: 1
  },
  networkLabel: {
    fontSize: 14,
    fontWeight: "500"
  },
  networkDesc: {
    fontSize: 12,
    marginTop: 2
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden"
  },
  inputText: {
    padding: 12,
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace"
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 12
  },
  toggleLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 12
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 16
  },
  warningText: {
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
