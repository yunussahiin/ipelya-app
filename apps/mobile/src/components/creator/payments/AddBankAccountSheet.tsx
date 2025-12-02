/**
 * AddBankAccountSheet Component
 * Banka hesabı ekleme bottom sheet
 *
 * IBAN Format (Türkiye):
 * - Toplam 26 karakter
 * - TR + 2 kontrol basamağı + 4 banka kodu + 1 rezerv (0) + 17 hesap no
 * - Örnek: TR33 0006 1005 1978 6457 8413 26
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AlertCircle, CheckCircle, Info } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AddBankAccountSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    bankName: string;
    iban: string;
    accountHolder: string;
    isDefault: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  isSubmitting: boolean;
  /** KYC'den gelen doğrulanmış isim - varsa hesap sahibi otomatik doldurulur */
  verifiedName?: string;
  /** KYC durumu - approved değilse uyarı gösterilir */
  kycStatus?: "none" | "pending" | "approved" | "rejected";
}

const BANKS = [
  "Akbank",
  "Garanti BBVA",
  "Türkiye İş Bankası",
  "Yapı Kredi",
  "Ziraat Bankası",
  "Halkbank",
  "VakıfBank",
  "QNB Finansbank",
  "Denizbank",
  "TEB",
  "ING",
  "HSBC",
  "Enpara",
  "Papara",
  "Diğer"
];

export function AddBankAccountSheet({
  visible,
  onClose,
  onSubmit,
  isSubmitting,
  verifiedName,
  kycStatus = "none"
}: AddBankAccountSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ibanValid, setIbanValid] = useState<boolean | null>(null);

  // KYC onaylı ise hesap sahibini otomatik doldur
  useEffect(() => {
    if (verifiedName && kycStatus === "approved") {
      setAccountHolder(verifiedName);
    }
  }, [verifiedName, kycStatus]);

  /**
   * IBAN'ı görsel formata çevirir (4'lü gruplar)
   * TR33 0006 1005 1978 6457 8413 26
   */
  const formatIbanDisplay = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const limited = cleaned.slice(0, 26);
    // 4'lü gruplar halinde formatla
    const groups = [];
    for (let i = 0; i < limited.length; i += 4) {
      groups.push(limited.slice(i, i + 4));
    }
    return groups.join(" ");
  };

  /**
   * IBAN'ın boşluksuz halini döndürür
   */
  const cleanIban = (text: string) => {
    return text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 26);
  };

  /**
   * TR IBAN formatını doğrular
   * - 26 karakter
   * - TR ile başlar
   * - Sonrası 24 rakam
   * - Mod97 checksum kontrolü
   */
  const validateIban = (iban: string): { valid: boolean; error?: string } => {
    const clean = cleanIban(iban);

    // Uzunluk kontrolü
    if (clean.length < 26) {
      return { valid: false, error: `IBAN ${26 - clean.length} karakter eksik` };
    }

    // TR ile başlamalı
    if (!clean.startsWith("TR")) {
      return { valid: false, error: "IBAN 'TR' ile başlamalı" };
    }

    // TR'den sonra 24 rakam olmalı
    if (!/^TR[0-9]{24}$/.test(clean)) {
      return { valid: false, error: "IBAN formatı hatalı" };
    }

    // Mod97 checksum kontrolü
    if (!validateIbanChecksum(clean)) {
      return { valid: false, error: "IBAN kontrol basamağı hatalı" };
    }

    return { valid: true };
  };

  /**
   * IBAN Mod97 checksum kontrolü
   * ISO 7064 standardı
   */
  const validateIbanChecksum = (iban: string): boolean => {
    // IBAN'ı yeniden düzenle: ilk 4 karakteri sona taşı
    const rearranged = iban.slice(4) + iban.slice(0, 4);

    // Harfleri sayıya çevir (A=10, B=11, ... Z=35)
    let numericIban = "";
    for (const char of rearranged) {
      if (char >= "A" && char <= "Z") {
        numericIban += (char.charCodeAt(0) - 55).toString();
      } else {
        numericIban += char;
      }
    }

    // Mod 97 hesapla (büyük sayılar için parça parça)
    let remainder = 0;
    for (let i = 0; i < numericIban.length; i += 7) {
      const chunk = remainder.toString() + numericIban.slice(i, i + 7);
      remainder = parseInt(chunk, 10) % 97;
    }

    return remainder === 1;
  };

  const handleIbanChange = (text: string) => {
    const clean = cleanIban(text);
    setIban(clean);

    if (clean.length === 26) {
      const result = validateIban(clean);
      setIbanValid(result.valid);
      if (!result.valid) {
        setError(result.error || "Geçersiz IBAN");
      } else {
        setError(null);
      }
    } else {
      setIbanValid(null);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // KYC kontrolü
    if (kycStatus !== "approved") {
      setError("Banka hesabı eklemek için önce KYC doğrulamanızı tamamlayın");
      return;
    }

    if (!bankName) {
      setError("Banka seçiniz");
      return;
    }

    const ibanResult = validateIban(iban);
    if (!ibanResult.valid) {
      setError(ibanResult.error || "Geçersiz IBAN formatı");
      return;
    }

    if (!accountHolder.trim()) {
      setError("Hesap sahibi adını giriniz");
      return;
    }

    // KYC ismiyle eşleşme kontrolü (varsa)
    if (verifiedName) {
      const normalizedVerified = verifiedName.toLocaleLowerCase("tr-TR").trim();
      const normalizedHolder = accountHolder.toLocaleLowerCase("tr-TR").trim();
      if (normalizedVerified !== normalizedHolder) {
        setError("Hesap sahibi adı, doğrulanmış kimlik bilgilerinizle eşleşmiyor");
        return;
      }
    }

    const result = await onSubmit({ bankName, iban, accountHolder, isDefault });

    if (result.success) {
      setBankName("");
      setIban("");
      setAccountHolder("");
      setIsDefault(false);
      onClose();
    } else {
      setError(result.error || "Bir hata oluştu");
    }
  };

  const isKycRequired = kycStatus !== "approved";

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

            <Text style={[styles.title, { color: colors.textPrimary }]}>Banka Hesabı Ekle</Text>

            {/* KYC Uyarısı */}
            {isKycRequired && (
              <View style={[styles.warningBox, { backgroundColor: "#F59E0B15" }]}>
                <AlertCircle size={18} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.warningTitle, { color: "#F59E0B" }]}>
                    KYC Doğrulaması Gerekli
                  </Text>
                  <Text style={[styles.warningText, { color: colors.textMuted }]}>
                    Banka hesabı eklemek için önce kimlik doğrulamanızı tamamlamanız gerekmektedir.
                  </Text>
                </View>
              </View>
            )}

            {/* Bank Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Banka</Text>
              <View
                style={[
                  styles.picker,
                  { backgroundColor: colors.backgroundRaised, borderColor: colors.border }
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={bankName}
                  onChangeText={setBankName}
                  placeholder="Banka seçin veya yazın"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* IBAN */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>IBAN</Text>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {iban.length}/26
                </Text>
              </View>
              <View
                style={[
                  styles.picker,
                  {
                    backgroundColor: colors.backgroundRaised,
                    borderColor:
                      ibanValid === true
                        ? "#10B981"
                        : ibanValid === false
                          ? "#EF4444"
                          : colors.border,
                    borderWidth: ibanValid !== null ? 2 : 1
                  }
                ]}
              >
                <TextInput
                  style={[styles.input, styles.ibanInput, { color: colors.textPrimary }]}
                  value={formatIbanDisplay(iban)}
                  onChangeText={handleIbanChange}
                  placeholder="TR__ ____ ____ ____ ____ ____ __"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  keyboardType="default"
                />
                {ibanValid === true && (
                  <View style={styles.ibanValidIcon}>
                    <CheckCircle size={20} color="#10B981" />
                  </View>
                )}
                {ibanValid === false && (
                  <View style={styles.ibanValidIcon}>
                    <AlertCircle size={20} color="#EF4444" />
                  </View>
                )}
              </View>
              <Text style={[styles.ibanHint, { color: colors.textMuted }]}>
                Örnek: TR33 0006 1005 1978 6457 8413 26
              </Text>
            </View>

            {/* Account Holder */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Hesap Sahibi</Text>
                {verifiedName && kycStatus === "approved" && (
                  <View style={[styles.verifiedBadge, { backgroundColor: "#10B98120" }]}>
                    <CheckCircle size={12} color="#10B981" />
                    <Text style={styles.verifiedText}>KYC Doğrulanmış</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.picker,
                  { backgroundColor: colors.backgroundRaised, borderColor: colors.border }
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                  placeholder="Ad Soyad"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  editable={!verifiedName || kycStatus !== "approved"}
                />
              </View>
              {verifiedName && kycStatus === "approved" && (
                <View style={styles.infoRow}>
                  <Info size={12} color={colors.textMuted} />
                  <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    Hesap sahibi adı, doğrulanmış kimlik bilgilerinizle eşleşmelidir
                  </Text>
                </View>
              )}
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
    padding: 20,
    maxHeight: "90%"
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
  warningBox: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18
  },
  field: {
    marginBottom: 16
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  label: {
    fontSize: 13
  },
  charCount: {
    fontSize: 11
  },
  picker: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center"
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15
  },
  ibanInput: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 1
  },
  ibanValidIcon: {
    paddingRight: 12
  },
  ibanHint: {
    fontSize: 11,
    marginTop: 4
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#10B981"
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4
  },
  infoText: {
    fontSize: 11,
    flex: 1
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 16
  },
  toggleLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 12
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
