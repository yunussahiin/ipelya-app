/**
 * Creator Revenue/Payment Management Screen
 * Ödeme yönetimi - Para çekme, ödeme yöntemleri
 */

import React, { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, CreditCard, ShieldCheck, ChevronRight, Lock } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import {
  PayoutSummaryCard,
  PaymentMethodCard,
  PaymentMethodStatus,
  AddBankAccountSheet,
  AddCryptoWalletSheet,
  CreatePayoutSheet,
  AutoPayoutSettings,
  PayoutHistoryList
} from "@/components/creator/payments";
import type { PaymentMethodStatusType } from "@/components/creator/payments";
import {
  usePaymentMethods,
  usePayoutRequests,
  useAutoPayoutSettings,
  useKYCVerification
} from "@/hooks/creator";
import { useCreatorEarnings } from "@/hooks/useCreatorEarnings";

export default function CreatorRevenueScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  // Hooks
  const { data: earningsData } = useCreatorEarnings();
  const {
    methods: paymentMethods,
    approvedMethods,
    isLoading: methodsLoading,
    isSubmitting: methodSubmitting,
    addBankAccount,
    addCryptoWallet,
    setAsDefault,
    deleteMethod,
    refresh: refreshMethods
  } = usePaymentMethods();

  const {
    requests: payoutRequests,
    pendingRequest,
    withdrawableBalance,
    isLoading: payoutsLoading,
    isSubmitting: payoutSubmitting,
    createRequest,
    cancelRequest,
    refresh: refreshPayouts
  } = usePayoutRequests();

  const {
    settings: autoPayoutSettings,
    isSaving: autoSaving,
    updateSettings,
    toggleAutoPayout
  } = useAutoPayoutSettings();

  const { profile: kycProfile } = useKYCVerification();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddCrypto, setShowAddCrypto] = useState(false);
  const [showCreatePayout, setShowCreatePayout] = useState(false);
  const [activeTab, setActiveTab] = useState<"methods" | "history">("methods");

  const coinRate = earningsData?.coinRate?.rate || 0.5;

  // Ödeme yöntemi durumunu hesapla
  const getPaymentMethodStatus = (): PaymentMethodStatusType => {
    if (paymentMethods.length === 0) return "none";
    const pendingMethod = paymentMethods.find((m) => m.status === "pending");
    if (pendingMethod) return "pending";
    const rejectedMethod = paymentMethods.find((m) => m.status === "rejected");
    if (rejectedMethod) return "rejected";
    const approvedMethod = paymentMethods.find((m) => m.status === "approved");
    if (approvedMethod) return "approved";
    return "pending"; // Default
  };

  const paymentMethodStatus = getPaymentMethodStatus();
  const primaryMethod = paymentMethods.find((m) => m.isDefault) || paymentMethods[0];

  // KYC tamamlanmış mı?
  const isKYCApproved = kycProfile?.status === "approved";
  const isKYCPending = kycProfile?.status === "pending";

  const handleGoToKYC = () => {
    router.push("/(creator)/kyc");
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(creator)/dashboard");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshMethods(), refreshPayouts()]);
    setRefreshing(false);
  }, [refreshMethods, refreshPayouts]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Ödeme Yönetimi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Payment Method Status Alert - Sadece KYC onaylı ise ve ödeme yöntemi sorunu varsa */}
        {isKYCApproved && paymentMethodStatus !== "approved" && (
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <PaymentMethodStatus
              status={paymentMethodStatus}
              methodName={primaryMethod?.displayName}
              rejectionReason={
                primaryMethod?.status === "rejected" ? primaryMethod.rejectionReason : undefined
              }
              onAddPress={() => setShowAddBank(true)}
              onViewPress={() => setActiveTab("methods")}
            />
          </View>
        )}

        {/* Payout Summary */}
        <PayoutSummaryCard
          withdrawableBalance={withdrawableBalance}
          pendingRequest={pendingRequest}
          coinRate={coinRate}
          onWithdraw={() => setShowCreatePayout(true)}
          isLoading={payoutsLoading}
        />

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === "methods" && styles.tabActive]}
            onPress={() => setActiveTab("methods")}
          >
            <CreditCard
              size={16}
              color={activeTab === "methods" ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "methods" && { color: colors.accent }]}>
              Ödeme Yöntemleri
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "history" && styles.tabActive]}
            onPress={() => setActiveTab("history")}
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={activeTab === "history" ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === "history" && { color: colors.accent }]}>
              Geçmiş
            </Text>
          </Pressable>
        </View>

        {activeTab === "methods" ? (
          <>
            {/* KYC Uyarısı - KYC tamamlanmamışsa */}
            {!isKYCApproved && (
              <View style={styles.section}>
                <Pressable
                  style={[styles.kycRequiredCard, { backgroundColor: colors.surface }]}
                  onPress={handleGoToKYC}
                >
                  <View
                    style={[styles.kycIconContainer, { backgroundColor: `${colors.accent}15` }]}
                  >
                    <ShieldCheck size={28} color={colors.accent} />
                  </View>
                  <View style={styles.kycContent}>
                    <Text style={[styles.kycTitle, { color: colors.textPrimary }]}>
                      {isKYCPending ? "KYC Doğrulama Bekliyor" : "KYC Doğrulama Gerekli"}
                    </Text>
                    <Text style={[styles.kycDescription, { color: colors.textSecondary }]}>
                      {isKYCPending
                        ? "Kimlik doğrulamanız inceleniyor. Bu işlem 1-3 iş günü sürebilir."
                        : "Ödeme yöntemi ekleyebilmek için önce kimlik doğrulamasını tamamlayın."}
                    </Text>
                  </View>
                  {!isKYCPending && (
                    <View style={[styles.kycButton, { backgroundColor: colors.accent }]}>
                      <Text style={styles.kycButtonText}>Doğrula</Text>
                      <ChevronRight size={16} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>
            )}

            {/* Payment Methods - KYC yoksa disabled */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Ödeme Yöntemlerim
                </Text>
                {isKYCApproved && (
                  <View style={styles.addButtons}>
                    <Pressable
                      style={[styles.addButton, { backgroundColor: `${colors.accent}20` }]}
                      onPress={() => setShowAddBank(true)}
                    >
                      <Plus size={14} color={colors.accent} />
                      <Text style={[styles.addButtonText, { color: colors.accent }]}>Banka</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.addButton, { backgroundColor: "#8B5CF620" }]}
                      onPress={() => setShowAddCrypto(true)}
                    >
                      <Plus size={14} color="#8B5CF6" />
                      <Text style={[styles.addButtonText, { color: "#8B5CF6" }]}>Kripto</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* KYC yoksa kilit mesajı */}
              {!isKYCApproved ? (
                <View style={[styles.lockedCard, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.lockedIconContainer,
                      { backgroundColor: `${colors.textMuted}15` }
                    ]}
                  >
                    <Lock size={24} color={colors.textMuted} />
                  </View>
                  <Text style={[styles.lockedTitle, { color: colors.textMuted }]}>
                    Ödeme Yöntemleri Kilitli
                  </Text>
                  <Text style={[styles.lockedDescription, { color: colors.textMuted }]}>
                    Ödeme yöntemi ekleyebilmek için önce KYC doğrulamasını tamamlayın.
                  </Text>
                </View>
              ) : methodsLoading ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.textMuted }}>Yükleniyor...</Text>
                </View>
              ) : paymentMethods.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
                  <Ionicons name="card-outline" size={32} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Henüz ödeme yöntemi eklenmemiş
                  </Text>
                </View>
              ) : (
                paymentMethods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onSetDefault={() => setAsDefault(method.id)}
                    onDelete={() => deleteMethod(method.id)}
                  />
                ))
              )}
            </View>

            {/* Auto Payout Settings - KYC yoksa gösterme */}
            {isKYCApproved && (
              <AutoPayoutSettings
                settings={autoPayoutSettings}
                paymentMethods={approvedMethods.map((m) => ({
                  id: m.id,
                  type: m.type,
                  displayName: m.displayName,
                  isDefault: m.isDefault
                }))}
                onToggle={toggleAutoPayout}
                onUpdate={updateSettings}
                isSaving={autoSaving}
              />
            )}
          </>
        ) : (
          /* Payout History */
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
              Ödeme Geçmişi
            </Text>
            <PayoutHistoryList
              requests={payoutRequests}
              onItemPress={(req) => console.log("Payout detail:", req.id)}
              isLoading={payoutsLoading}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sheets */}
      <AddBankAccountSheet
        visible={showAddBank}
        onClose={() => setShowAddBank(false)}
        onSubmit={addBankAccount}
        isSubmitting={methodSubmitting}
        verifiedName={kycProfile?.verifiedName}
        kycStatus={kycProfile?.status || "none"}
      />

      <AddCryptoWalletSheet
        visible={showAddCrypto}
        onClose={() => setShowAddCrypto(false)}
        onSubmit={addCryptoWallet}
        isSubmitting={methodSubmitting}
      />

      <CreatePayoutSheet
        visible={showCreatePayout}
        onClose={() => setShowCreatePayout(false)}
        onSubmit={createRequest}
        withdrawableBalance={withdrawableBalance}
        coinRate={coinRate}
        paymentMethods={approvedMethods.map((m) => ({
          id: m.id,
          type: m.type,
          displayName: m.displayName,
          isDefault: m.isDefault
        }))}
        isSubmitting={payoutSubmitting}
      />
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
    scrollContent: {
      paddingBottom: insets.bottom
    },
    tabContainer: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginTop: 16,
      padding: 4,
      borderRadius: 12,
      backgroundColor: colors.surface
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 10,
      gap: 6
    },
    tabActive: {
      backgroundColor: colors.background
    },
    tabText: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textMuted
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 20
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600"
    },
    addButtons: {
      flexDirection: "row",
      gap: 8
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 4
    },
    addButtonText: {
      fontSize: 12,
      fontWeight: "500"
    },
    emptyCard: {
      padding: 32,
      borderRadius: 14,
      alignItems: "center",
      gap: 12
    },
    emptyText: {
      fontSize: 14
    },
    // KYC Required Card
    kycRequiredCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderRadius: 16,
      gap: 12
    },
    kycIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center"
    },
    kycContent: {
      flex: 1,
      gap: 4
    },
    kycTitle: {
      fontSize: 15,
      fontWeight: "600"
    },
    kycDescription: {
      fontSize: 12,
      lineHeight: 16
    },
    kycButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4
    },
    kycButtonText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600"
    },
    // Locked Card (KYC yokken)
    lockedCard: {
      padding: 40,
      borderRadius: 16,
      alignItems: "center",
      gap: 12
    },
    lockedIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4
    },
    lockedTitle: {
      fontSize: 16,
      fontWeight: "600"
    },
    lockedDescription: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18
    }
  });
