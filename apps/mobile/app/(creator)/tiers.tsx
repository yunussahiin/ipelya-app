/**
 * Creator Tiers Management Screen
 * Tier yönetimi ekranı
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { TierCard, TierEditor } from "@/components/creator";
import { useCreatorTiers, CreateTierParams } from "@/hooks/useCreatorTiers";

export default function TiersScreen() {
  const { colors } = useTheme();
  const { tiers, isLoading, createTier, updateTier, deleteTier, isCreating, isUpdating } =
    useCreatorTiers();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingTier, setEditingTier] = useState<(typeof tiers)[number] | undefined>();

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["bottom"]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Abonelik Tier'ları</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Takipçileriniz için farklı abonelik seviyeleri oluşturun
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{tiers.length}/5</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tier</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {tiers.reduce((sum, t) => sum + (t.subscriberCount || 0), 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Abone</Text>
          </View>
        </View>

        {/* Tiers List */}
        <View style={styles.tiersSection}>
          {isLoading ? (
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Yükleniyor...</Text>
          ) : tiers.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="layers-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Henüz tier yok</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.accent }]}
            onPress={handleCreateTier}
          >
            <Ionicons name="add" size={24} color={colors.accent} />
            <Text style={[styles.addButtonText, { color: colors.accent }]}>Yeni Tier Ekle</Text>
          </TouchableOpacity>
        )}

        {/* Tips */}
        <View style={[styles.tipsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>💡 İpuçları</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            • Farklı fiyat aralıklarında tier'lar oluşturun{"\n"}• Her tier'a özel avantajlar
            ekleyin{"\n"}• Yıllık abonelik için indirim sunun{"\n"}• Tier açıklamalarını net yazın
          </Text>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22
  },
  statsCard: {
    flexDirection: "row",
    margin: 16,
    padding: 20,
    borderRadius: 16
  },
  statItem: {
    flex: 1,
    alignItems: "center"
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700"
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16
  },
  tiersSection: {
    padding: 16
  },
  loadingText: {
    textAlign: "center",
    padding: 20
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20
  },
  tiersList: {
    gap: 16
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed"
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600"
  },
  tipsSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22
  }
});
