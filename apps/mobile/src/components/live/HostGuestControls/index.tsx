/**
 * Host Guest Controls
 * Host için konuk yönetim paneli
 * Viewer listesi, davet gönderme, talep onaylama
 */

import React, { useState, useCallback, useRef, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, FlatList, Image, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme } from "@/theme/ThemeProvider";
import { JoinRequest } from "@/hooks/live";

interface Viewer {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: "viewer" | "co_host" | "invited_guest";
}

interface HostGuestControlsProps {
  viewers: Viewer[];
  coHosts: Viewer[];
  pendingRequests: JoinRequest[];
  maxGuests: number;
  onInviteGuest: (userId: string) => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onEndGuest: (userId: string) => void;
}

export function HostGuestControls({
  viewers,
  coHosts,
  pendingRequests,
  maxGuests,
  onInviteGuest,
  onApproveRequest,
  onRejectRequest,
  onEndGuest
}: HostGuestControlsProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "85%"], []);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  const openSheet = useCallback(() => {
    sheetRef.current?.expand();
  }, []);

  const canAddMoreGuests = coHosts.length < maxGuests;

  // Arama ile filtreleme
  const filteredViewers = viewers.filter((v) =>
    v.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Request item render
  const renderRequestItem = ({ item }: { item: JoinRequest }) => (
    <View style={[styles.requestItem, { backgroundColor: colors.surfaceAlt }]}>
      {item.userAvatar ? (
        <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
      )}
      <View style={styles.requestInfo}>
        <Text style={[styles.requestName, { color: colors.textPrimary }]}>{item.userName}</Text>
        {item.message && (
          <Text style={[styles.requestMessage, { color: colors.textSecondary }]} numberOfLines={1}>
            "{item.message}"
          </Text>
        )}
      </View>
      <View style={styles.requestActions}>
        <Pressable
          style={[styles.rejectBtn, { backgroundColor: colors.surface }]}
          onPress={() => onRejectRequest(item.id)}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={[styles.approveBtn, { backgroundColor: colors.accent }]}
          onPress={() => onApproveRequest(item.id)}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );

  // Viewer item render
  const renderViewerItem = ({ item }: { item: Viewer }) => (
    <View style={[styles.viewerItem, { backgroundColor: colors.surface }]}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.textMuted }]}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
      )}
      <Text style={[styles.viewerName, { color: colors.textPrimary }]} numberOfLines={1}>
        {item.displayName}
      </Text>
      {item.role === "co_host" ? (
        <Pressable
          style={[styles.endGuestBtn, { backgroundColor: "#FEE2E2" }]}
          onPress={() => onEndGuest(item.userId)}
        >
          <Ionicons name="mic-off" size={14} color="#EF4444" />
          <Text style={styles.endGuestText}>Sonlandır</Text>
        </Pressable>
      ) : canAddMoreGuests ? (
        <Pressable
          style={[styles.inviteBtn, { backgroundColor: `${colors.accent}15` }]}
          onPress={() => onInviteGuest(item.userId)}
        >
          <Ionicons name="person-add" size={14} color={colors.accent} />
          <Text style={[styles.inviteText, { color: colors.accent }]}>Davet Et</Text>
        </Pressable>
      ) : null}
    </View>
  );

  // Co-host item render
  const renderCoHostItem = ({ item }: { item: Viewer }) => (
    <View style={[styles.coHostItem, { backgroundColor: `${colors.accent}10` }]}>
      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.coHostAvatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
      )}
      <View style={styles.coHostInfo}>
        <Text style={[styles.coHostName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.displayName}
        </Text>
        <View style={[styles.coHostBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.coHostBadgeText}>Co-Host</Text>
        </View>
      </View>
      <Pressable
        style={[styles.endGuestBtnSmall, { backgroundColor: "#FEE2E2" }]}
        onPress={() => onEndGuest(item.userId)}
      >
        <Ionicons name="close" size={14} color="#EF4444" />
      </Pressable>
    </View>
  );

  return (
    <>
      {/* Trigger Button */}
      <Pressable
        style={[styles.triggerButton, { backgroundColor: colors.surface }]}
        onPress={openSheet}
      >
        <Ionicons name="people" size={20} color={colors.accent} />
        {pendingRequests.length > 0 && (
          <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
          </View>
        )}
      </Pressable>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="people" size={24} color={colors.accent} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Konuk Yönetimi
              </Text>
            </View>
            <View style={[styles.guestCount, { backgroundColor: `${colors.accent}15` }]}>
              <Text style={[styles.guestCountText, { color: colors.accent }]}>
                {coHosts.length}/{maxGuests}
              </Text>
            </View>
          </View>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="hand-left" size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Katılma Talepleri
                </Text>
                <View style={[styles.countBadge, { backgroundColor: "#EF4444" }]}>
                  <Text style={styles.countBadgeText}>{pendingRequests.length}</Text>
                </View>
              </View>
              <FlatList
                data={pendingRequests}
                renderItem={renderRequestItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Current Co-Hosts */}
          {coHosts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="videocam" size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Yayındaki Konuklar
                </Text>
              </View>
              <FlatList
                data={coHosts}
                renderItem={renderCoHostItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.coHostList}
              />
            </View>
          )}

          {/* Viewers - Can Invite */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye" size={16} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>İzleyiciler</Text>
              <Text style={[styles.viewerCount, { color: colors.textMuted }]}>
                {viewers.length} kişi
              </Text>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="İzleyici ara..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Viewer List */}
            <FlatList
              data={filteredViewers}
              renderItem={renderViewerItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {searchQuery ? "Sonuç bulunamadı" : "Henüz izleyici yok"}
                </Text>
              }
            />
          </View>

          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  triggerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700"
  },
  sheetContent: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  guestCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  guestCountText: {
    fontSize: 14,
    fontWeight: "600"
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },
  viewerCount: {
    fontSize: 13
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12
  },
  requestName: {
    fontSize: 15,
    fontWeight: "600"
  },
  requestMessage: {
    fontSize: 13,
    marginTop: 2
  },
  requestActions: {
    flexDirection: "row",
    gap: 8
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  coHostList: {
    gap: 12
  },
  coHostItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    gap: 8
  },
  coHostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  coHostInfo: {
    gap: 4
  },
  coHostName: {
    fontSize: 14,
    fontWeight: "600"
  },
  coHostBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  coHostBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600"
  },
  endGuestBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15
  },
  viewerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12
  },
  viewerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500"
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  inviteText: {
    fontSize: 12,
    fontWeight: "600"
  },
  endGuestBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4
  },
  endGuestText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600"
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 20
  }
});

export default HostGuestControls;
