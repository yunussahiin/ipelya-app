/**
 * KYC Form Screen
 * Kişisel bilgi formu
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Calendar, Check } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification, validateTCNumber } from "@/hooks/creator";

export default function KYCFormScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { formData, setFormData, goToStep } = useKYCVerification();

  // 18 yaş sınırı için maksimum doğum tarihi (bugünden 18 yıl önce)
  const maxBirthDate = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }, []);

  const [localDate, setLocalDate] = useState<Date | null>(
    formData.birthDate ? new Date(formData.birthDate) : null
  );
  const [tempDate, setTempDate] = useState<Date>(localDate || new Date(2000, 0, 1));
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // BottomSheet ref
  const datePickerSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["45%"], []);

  const openDatePicker = useCallback(() => {
    Keyboard.dismiss(); // Klavyeyi kapat
    setTempDate(localDate || new Date(2000, 0, 1));
    datePickerSheetRef.current?.expand();
  }, [localDate]);

  const closeDatePicker = useCallback(() => {
    datePickerSheetRef.current?.close();
  }, []);

  const confirmDate = useCallback(() => {
    setLocalDate(tempDate);
    setFormData({
      ...formData,
      birthDate: tempDate.toISOString().split("T")[0]
    });
    closeDatePicker();
  }, [tempDate, formData, setFormData, closeDatePicker]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const handleBack = () => {
    router.replace("/(creator)/kyc"); // KYC ana sayfasına dön
  };

  /**
   * 18 yaş kontrolü - gün gün hesaplama
   */
  const isAtLeast18 = (birthDate: Date): boolean => {
    const today = new Date();
    const birth = new Date(birthDate);

    // 18 yıl önce bugünün tarihi
    const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    // Doğum tarihi, 18 yıl önceki tarihten önce veya eşit olmalı
    return birth <= minDate;
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "Ad gerekli";
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Soyad gerekli";
    }
    if (!localDate) {
      newErrors.birthDate = "Doğum tarihi gerekli";
    } else if (!isAtLeast18(localDate)) {
      newErrors.birthDate = "18 yaşından büyük olmalısınız";
    }

    // TC Kimlik No zorunlu ve geçerli olmalı
    if (!formData.idNumber?.trim()) {
      newErrors.idNumber = "TC Kimlik No gerekli";
    } else if (!/^\d{11}$/.test(formData.idNumber.trim())) {
      newErrors.idNumber = "TC Kimlik No 11 haneli olmalı";
    } else if (!validateTCNumber(formData.idNumber.trim())) {
      newErrors.idNumber = "Geçersiz TC Kimlik No";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      goToStep("id-front"); // Step'i güncelle
      router.push("/(creator)/kyc/id-front");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
      // Android'de picker otomatik kapanır, iOS'ta açık kalır
      if (Platform.OS === "android") {
        setLocalDate(selectedDate);
        setFormData({
          ...formData,
          birthDate: selectedDate.toISOString().split("T")[0]
        });
        closeDatePicker();
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Kişisel Bilgiler</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: "25%", backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>Adım 1/4</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Kimliğinizdeki bilgileri girin
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Lütfen bilgilerinizi kimliğinizde yazdığı şekilde girin.
            </Text>

            {/* First Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Ad</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: errors.firstName ? "#EF4444" : colors.border
                  }
                ]}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="Adınız"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            {/* Last Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Soyad</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: errors.lastName ? "#EF4444" : colors.border
                  }
                ]}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Soyadınız"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>

            {/* Birth Date */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Doğum Tarihi</Text>
              <Pressable
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: errors.birthDate ? "#EF4444" : colors.border
                  }
                ]}
                onPress={openDatePicker}
              >
                <Text
                  style={[
                    styles.dateText,
                    { color: localDate ? colors.textPrimary : colors.textMuted }
                  ]}
                >
                  {localDate ? formatDate(localDate) : "Tarih seçin"}
                </Text>
                <Calendar size={20} color={colors.textMuted} />
              </Pressable>
              {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
            </View>

            {/* ID Number (Required) */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>TC Kimlik No</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    borderColor: errors.idNumber ? "#EF4444" : colors.border
                  }
                ]}
                value={formData.idNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, idNumber: text.replace(/\D/g, "").slice(0, 11) })
                }
                placeholder="11 haneli TC kimlik numaranız"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={11}
              />
              {errors.idNumber && <Text style={styles.errorText}>{errors.idNumber}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Pressable
            style={[styles.nextButton, { backgroundColor: colors.accent }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Devam Et</Text>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Date Picker Bottom Sheet */}
        <BottomSheet
          ref={datePickerSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
        >
          <BottomSheetView style={styles.datePickerSheet}>
            {/* Header */}
            <View style={styles.datePickerHeader}>
              <Pressable onPress={closeDatePicker} style={styles.datePickerHeaderButton}>
                <Text style={[styles.datePickerHeaderButtonText, { color: colors.textMuted }]}>
                  İptal
                </Text>
              </Pressable>
              <Text style={[styles.datePickerTitle, { color: colors.textPrimary }]}>
                Doğum Tarihi
              </Text>
              <Pressable onPress={confirmDate} style={styles.datePickerHeaderButton}>
                <View style={[styles.confirmButton, { backgroundColor: colors.accent }]}>
                  <Check size={18} color="#fff" />
                  <Text style={styles.confirmButtonText}>Seç</Text>
                </View>
              </Pressable>
            </View>

            {/* Selected Date Preview */}
            <View style={[styles.selectedDatePreview, { backgroundColor: `${colors.accent}15` }]}>
              <Calendar size={20} color={colors.accent} />
              <Text style={[styles.selectedDateText, { color: colors.accent }]}>
                {formatDate(tempDate)}
              </Text>
            </View>

            {/* Date Picker */}
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={maxBirthDate}
                minimumDate={new Date(1920, 0, 1)}
                textColor={colors.textPrimary}
                locale="tr-TR"
              />
            </View>
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center"
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12
    },
    progressBar: {
      flex: 1,
      height: 4,
      borderRadius: 2
    },
    progressFill: {
      height: "100%",
      borderRadius: 2
    },
    progressText: {
      fontSize: 12
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 120
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 24
    },
    field: {
      marginBottom: 20
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 8
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14
    },
    dateText: {
      fontSize: 16
    },
    errorText: {
      color: "#EF4444",
      fontSize: 12,
      marginTop: 4
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      paddingBottom: insets.bottom + 20,
      borderTopWidth: 1,
      borderTopColor: colors.border
    },
    nextButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      borderRadius: 14,
      gap: 8
    },
    nextButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600"
    },
    // Date Picker Sheet Styles
    datePickerSheet: {
      flex: 1,
      paddingHorizontal: 20
    },
    datePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    datePickerHeaderButton: {
      minWidth: 60
    },
    datePickerHeaderButtonText: {
      fontSize: 15,
      fontWeight: "500"
    },
    datePickerTitle: {
      fontSize: 17,
      fontWeight: "600"
    },
    confirmButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4
    },
    confirmButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600"
    },
    selectedDatePreview: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginTop: 16,
      gap: 8
    },
    selectedDateText: {
      fontSize: 16,
      fontWeight: "600"
    },
    datePickerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8
    }
  });
