/**
 * Creator Tiers Management Screen
 * Tier yönetimi ekranı - Dashboard'dan erişilen iç sayfa
 */

import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Layers } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { TierCard, TierEditor } from "@/components/creator";
import { useCreatorTiers, CreateTierParams } from "@/hooks/useCreatorTiers";

export default function TiersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  console.log("🔷 TiersScreen rendered");

  const { tiers, isLoading, createTier, updateTier, deleteTier, isCreating, isUpdating } =
    useCreatorTiers();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingTier, setEditingTier] = useState<(typeof tiers)[number] | undefined>();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(creator)/dashboard");
    }
  };

  const handleCreateTier = () => {
    if (tiers.length >= 5) {
      Alert.alert("Limit", "En fazla 5 tier oluşturabilirsiniz.");
      return;
    }
    setEditingTier(undefined);
    setEditorVisible(true);
  };

  const handleEditTier = (tier: (typeof tiers)[number]) => {
    setEditingTier(tier);
    setEditorVisible(true);
  };

  const handleDeleteTier = (tierId: string) => {
    Alert.alert(
      "Tier Sil",
      "Bu tier'ı silmek istediğinize emin misiniz? Aktif aboneler varsa silinemez.",
      [
        { text: "İptal", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => deleteTier(tierId) }
      ]
    );
  };

  const handleSaveTier = async (data: CreateTierParams) => {
    if (editingTier) {
      await updateTier(editingTier.id, data);
    } else {
      await createTier(data);
    }
    setEditorVisible(false);
    setEditingTier(undefined);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Abonelik Tier'ları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Description */}
        <Text style={styles.description}>
          Takipçileriniz için farklı abonelik seviyeleri oluşturun
        </Text>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tiers.length}/5</Text>
            <Text style={styles.statLabel}>Tier</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tiers.reduce((sum, t) => sum + (t.subscriberCount || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Toplam Abone</Text>
          </View>
        </View>

        {/* Tiers List */}
        <View style={styles.tiersSection}>
          {isLoading ? (
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          ) : tiers.length === 0 ? (
            <View style={styles.emptyState}>
              <Layers size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz tier yok</Text>
              <Text style={styles.emptyText}>
                İlk tier'ınızı oluşturarak takipçilerinize özel içerikler sunun
              </Text>
            </View>
          ) : (
            <View style={styles.tiersList}>
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  isOwner
                  onEdit={() => handleEditTier(tier)}
                  onDelete={() => handleDeleteTier(tier.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Add Button */}
        {tiers.length < 5 && (
          <Pressable style={styles.addButton} onPress={handleCreateTier}>
            <Plus size={24} color={colors.accent} />
            <Text style={styles.addButtonText}>Yeni Tier Ekle</Text>
          </Pressable>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 İpuçları</Text>
          <Text style={styles.tipsText}>
            • Farklı fiyat aralıklarında tier'lar oluşturun{"\n"}• Her tier'a özel avantajlar
            ekleyin{"\n"}• Yıllık abonelik için indirim sunun{"\n"}• Tier açıklamalarını net yazın
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Tier Editor Modal */}
      <TierEditor
        visible={editorVisible}
        onClose={() => {
          setEditorVisible(false);
          setEditingTier(undefined);
        }}
        onSave={handleSaveTier}
        existingTier={editingTier}
        isLoading={isCreating || isUpdating}
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
    description: {
      fontSize: 15,
      color: colors.textSecondary,
      paddingHorizontal: 20,
      paddingTop: 16,
      lineHeight: 22
    },
    statsCard: {
      flexDirection: "row",
      margin: 20,
      padding: 20,
      borderRadius: 16,
      backgroundColor: colors.surface
    },
    statItem: {
      flex: 1,
      alignItems: "center"
    },
    statValue: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary
    },
    statLabel: {
      fontSize: 13,
      marginTop: 4,
      color: colors.textSecondary
    },
    statDivider: {
      width: 1,
      marginHorizontal: 16,
      backgroundColor: colors.border
    },
    tiersSection: {
      paddingHorizontal: 20
    },
    loadingText: {
      textAlign: "center",
      padding: 20,
      color: colors.textMuted
    },
    emptyState: {
      alignItems: "center",
      padding: 32,
      borderRadius: 16,
      backgroundColor: colors.surface
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: 16,
      color: colors.textPrimary
    },
    emptyText: {
      fontSize: 14,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
      color: colors.textSecondary
    },
    tiersList: {
      gap: 16
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginHorizontal: 20,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.accent
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.accent
    },
    tipsSection: {
      margin: 20,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.surface
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      color: colors.textPrimary
    },
    tipsText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary
    }
  });
