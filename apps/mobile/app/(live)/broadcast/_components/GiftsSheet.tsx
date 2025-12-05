/**
 * Gifts Sheet
 * Yayın sırasında alınan hediye ve bağışları gösteren bottom sheet
 */

import React, { forwardRef, useCallback } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

export interface GiftItem {
  id: string;
  senderName: string;
  senderAvatar?: string;
  giftName: string;
  giftEmoji: string;
  amount: number;
  value: number; // TL değeri
  timestamp: string;
}

interface GiftsSheetProps {
  gifts: GiftItem[];
  totalValue: number;
}

// Mock data
export const mockGifts: GiftItem[] = [
  {
    id: "1",
    senderName: "Ayşe K.",
    senderAvatar: undefined,
    giftName: "Kalp",
    giftEmoji: "❤️",
    amount: 5,
    value: 25,
    timestamp: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: "2",
    senderName: "Mehmet Y.",
    senderAvatar: undefined,
    giftName: "Yıldız",
    giftEmoji: "⭐",
    amount: 10,
    value: 50,
    timestamp: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: "3",
    senderName: "Zeynep A.",
    senderAvatar: undefined,
    giftName: "Elmas",
    giftEmoji: "💎",
    amount: 1,
    value: 100,
    timestamp: new Date(Date.now() - 180000).toISOString()
  },
  {
    id: "4",
    senderName: "Ali B.",
    senderAvatar: undefined,
    giftName: "Roket",
    giftEmoji: "🚀",
    amount: 3,
    value: 150,
    timestamp: new Date(Date.now() - 240000).toISOString()
  },
  {
    id: "5",
    senderName: "Fatma S.",
    senderAvatar: undefined,
    giftName: "Taç",
    giftEmoji: "👑",
    amount: 1,
    value: 200,
    timestamp: new Date(Date.now() - 300000).toISOString()
  }
];

export const GiftsSheet = forwardRef<BottomSheet, GiftsSheetProps>(({ gifts, totalValue }, ref) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const formatTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dk önce`;
    return `${Math.floor(minutes / 60)} saat önce`;
  };

  const renderGift = useCallback(
    ({ item }: { item: GiftItem }) => (
      <View style={[styles.giftItem, { borderBottomColor: colors.border }]}>
        {/* Avatar */}
        {item.senderAvatar ? (
          <Image source={{ uri: item.senderAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{item.senderName.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.giftInfo}>
          <View style={styles.giftHeader}>
            <Text style={[styles.senderName, { color: colors.textPrimary }]}>
              {item.senderName}
            </Text>
            <Text style={[styles.giftTime, { color: colors.textMuted }]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          <View style={styles.giftDetails}>
            <Text style={styles.giftEmoji}>{item.giftEmoji}</Text>
            <Text style={[styles.giftName, { color: colors.textSecondary }]}>
              {item.amount}x {item.giftName}
            </Text>
          </View>
        </View>

        {/* Value */}
        <View style={[styles.valueBadge, { backgroundColor: colors.accent + "20" }]}>
          <Text style={[styles.valueText, { color: colors.accent }]}>₺{item.value}</Text>
        </View>
      </View>
    ),
    [colors]
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={["50%", "80%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="gift" size={20} color={colors.accent} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Hediyeler & Bağışlar
          </Text>
        </View>
        <View style={[styles.totalBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.totalText}>₺{totalValue}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{gifts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Hediye</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {gifts.reduce((sum, g) => sum + g.amount, 0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Toplam Adet</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>₺{totalValue}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Kazanç</Text>
        </View>
      </View>

      {/* List */}
      {gifts.length > 0 ? (
        <BottomSheetFlatList
          data={gifts}
          renderItem={renderGift}
          keyExtractor={(item: GiftItem) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="gift-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Henüz hediye almadınız
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            İzleyicileriniz hediye gönderdiğinde burada görünecek
          </Text>
        </View>
      )}
    </BottomSheet>
  );
});

GiftsSheet.displayName = "GiftsSheet";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600"
  },
  totalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  totalText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700"
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700"
  },
  statLabel: {
    fontSize: 12
  },
  statDivider: {
    width: 1,
    height: 30
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8
  },
  giftItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  giftInfo: {
    flex: 1,
    gap: 4
  },
  giftHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  senderName: {
    fontSize: 15,
    fontWeight: "600"
  },
  giftTime: {
    fontSize: 12
  },
  giftDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  giftEmoji: {
    fontSize: 18
  },
  giftName: {
    fontSize: 14
  },
  valueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  valueText: {
    fontSize: 13,
    fontWeight: "600"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 40,
    paddingHorizontal: 32
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center"
  }
});

export default GiftsSheet;
