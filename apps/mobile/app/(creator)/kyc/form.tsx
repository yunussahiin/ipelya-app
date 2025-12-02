/**
 * KYC Form Screen
 * Kişisel bilgi formu
 */

import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useKYCVerification } from "@/hooks/creator";

export default function KYCFormScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  const { formData, setFormData } = useKYCVerification();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localDate, setLocalDate] = useState<Date | null>(
    formData.birthDate ? new Date(formData.birthDate) : null
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleBack = () => router.back();

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
    } else {
      const age = Math.floor((Date.now() - localDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        newErrors.birthDate = "18 yaşından büyük olmalısınız";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      router.push("/(creator)/kyc/id-front");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setLocalDate(selectedDate);
      setFormData({
        ...formData,
        birthDate: selectedDate.toISOString().split("T")[0]
      });
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
            onPress={() => setShowDatePicker(true)}
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

        {/* ID Number (Optional) */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            TC Kimlik No <Text style={{ color: colors.textMuted }}>(Opsiyonel)</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                borderColor: colors.border
              }
            ]}
            value={formData.idNumber}
            onChangeText={(text) => setFormData({ ...formData, idNumber: text.replace(/\D/g, "") })}
            placeholder="11 haneli TC kimlik numaranız"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            maxLength={11}
          />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={localDate || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1920, 0, 1)}
          />
        )}
      </ScrollView>

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
    </SafeAreaView>
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
    }
  });
