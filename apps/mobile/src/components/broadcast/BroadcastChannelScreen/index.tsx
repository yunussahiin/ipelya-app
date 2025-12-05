/**
 * BroadcastChannelScreen
 *
 * Amaç: Yayın kanalı içi ekranı
 * Tarih: 2025-12-02 (V3 güncelleme)
 *
 * Özellikler:
 * - Mesaj listesi
 * - Creator için mesaj gönderme
 * - Üye için tepki
 * - Sabitli mesaj banner
 * - Zamanlanmış mesajlar modal
 */

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Clock,
  Trash2,
  BarChart3,
  Users,
  Eye,
  MessageCircle,
  TrendingUp,
  Edit3,
  Calendar,
  Send,
  Check,
  Zap
} from "lucide-react-native";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import {
  useBroadcastMessages,
  useBroadcastRealtime,
  useScheduledBroadcastMessages,
  useCancelScheduledMessage
} from "@/hooks/messaging";
import { useBroadcastStore } from "@/store/messaging";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui";
import { BroadcastChannelHeader } from "./components/BroadcastChannelHeader";
import { BroadcastMessageCard } from "../components/BroadcastMessageCard";
import { BroadcastComposer } from "../components/BroadcastComposer";
import { BroadcastSkeleton } from "./components/BroadcastSkeleton";
import type { BroadcastMessage } from "@ipelya/types";

// =============================================
// COMPONENT
// =============================================

export function BroadcastChannelScreen() {
  const { colors } = useTheme();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  // Current user - global auth store'dan al
  const { user } = useAuth();
  const userId = user?.id;

  // Edit scheduled message state
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const editSheetRef = useRef<BottomSheet>(null);
  const editSnapPoints = useMemo(() => ["60%", "80%"], []);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState(new Date());

  // Composer schedule state
  const [composerScheduledDate, setComposerScheduledDate] = useState<Date | null>(null);
  const [tempScheduleDate, setTempScheduleDate] = useState(new Date());
  const [schedulePickerMode, setSchedulePickerMode] = useState<"date" | "time">("date");
  const schedulePickerSheetRef = useRef<BottomSheet>(null);
  const schedulePickerSnapPoints = useMemo(() => ["55%", "75%"], []);

  // Bottom sheets
  const analyticsSheetRef = useRef<BottomSheet>(null);
  const scheduledSheetRef = useRef<BottomSheet>(null);
  const analyticsSnapPoints = useMemo(() => ["50%", "80%"], []);
  const scheduledSnapPoints = useMemo(() => ["50%", "85%"], []);

  // Analytics sheet handlers
  const handleOpenAnalytics = useCallback(() => {
    console.log("📊 [BroadcastChannel] Opening analytics sheet");
    analyticsSheetRef.current?.expand();
  }, []);

  const handleCloseAnalytics = useCallback(() => {
    analyticsSheetRef.current?.close();
  }, []);

  // Scheduled sheet handlers
  const handleOpenScheduled = useCallback(() => {
    console.log("⏰ [BroadcastChannel] Opening scheduled sheet");
    scheduledSheetRef.current?.expand();
  }, []);

  // Edit scheduled message handlers
  const handleOpenEdit = useCallback((msg: any) => {
    console.log("✏️ [BroadcastChannel] Opening edit sheet for:", msg.id);
    setEditingMessage(msg);
    setEditContent(msg.content || "");
    setEditDate(new Date(msg.scheduled_at));
    editSheetRef.current?.expand();
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMessage || !channelId) return;

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        showToast({ type: "error", message: "Oturum bulunamadı" });
        return;
      }

      const { error } = await supabase
        .from("broadcast_scheduled_messages")
        .update({
          content: editContent,
          scheduled_at: editDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", editingMessage.id);

      if (error) throw error;

      showToast({ type: "success", message: "Mesaj güncellendi" });
      editSheetRef.current?.close();
      setEditingMessage(null);
      refetchScheduled();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Güncelleme başarısız" });
    }
  }, [editingMessage, editContent, editDate, channelId, showToast, refetchScheduled]);

  // Schedule picker handlers (for composer)
  const handleOpenSchedulePicker = useCallback(() => {
    console.log("⏰ [BroadcastChannel] Opening schedule picker sheet");
    setTempScheduleDate(new Date(Date.now() + 60 * 60 * 1000)); // 1 saat sonra
    setSchedulePickerMode("date");
    schedulePickerSheetRef.current?.expand();
  }, []);

  const handleConfirmSchedule = useCallback(() => {
    setComposerScheduledDate(tempScheduleDate);
    schedulePickerSheetRef.current?.close();
    console.log("⏰ [BroadcastChannel] Schedule confirmed:", tempScheduleDate);
  }, [tempScheduleDate]);

  const handleClearSchedule = useCallback(() => {
    setComposerScheduledDate(null);
  }, []);

  // Hızlı seçim butonları
  const quickSelectOptions = useMemo(() => {
    const now = new Date();
    return [
      { label: "+1 Saat", date: new Date(now.getTime() + 60 * 60 * 1000) },
      { label: "+3 Saat", date: new Date(now.getTime() + 3 * 60 * 60 * 1000) },
      {
        label: "Yarın 09:00",
        date: (() => {
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          d.setHours(9, 0, 0, 0);
          return d;
        })()
      },
      {
        label: "Yarın 18:00",
        date: (() => {
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          d.setHours(18, 0, 0, 0);
          return d;
        })()
      }
    ];
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    []
  );

  // Kanal bilgisi
  const channel = useBroadcastStore((s) =>
    [...s.myChannels, ...s.joinedChannels].find((c) => c.id === channelId)
  );

  // Owner kontrolü
  const isOwner = channel?.creator_id === userId;

  // Mesajlar
  const {
    data: messages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching
  } = useBroadcastMessages(channelId || "");

  // Zamanlanmış mesajlar
  const {
    data: scheduledMessages,
    isLoading: isLoadingScheduled,
    refetch: refetchScheduled
  } = useScheduledBroadcastMessages(channelId || "");
  const { mutate: cancelScheduled, isPending: isCancelling } = useCancelScheduledMessage();

  // Realtime
  useBroadcastRealtime(channelId || "");

  // Aktif kanal
  useEffect(() => {
    if (channelId) {
      useBroadcastStore.getState().setActiveChannel(channelId);
    }
    return () => useBroadcastStore.getState().setActiveChannel(null);
  }, [channelId]);

  // Daha fazla yükle
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Zamanlanmış mesaj iptal
  const handleCancelScheduled = useCallback(
    (messageId: string) => {
      if (!channelId) return;
      cancelScheduled(
        { messageId, channelId },
        {
          onSuccess: () => {
            showToast({ type: "success", message: "Zamanlanmış mesaj iptal edildi" });
            refetchScheduled();
          },
          onError: (err) => showToast({ type: "error", message: err.message })
        }
      );
    },
    [cancelScheduled, showToast, refetchScheduled, channelId]
  );

  // Render message
  const renderItem = useCallback(
    ({ item }: { item: BroadcastMessage }) => (
      <BroadcastMessageCard message={item} channelId={channelId || ""} isCreator={isOwner} />
    ),
    [channelId, isOwner]
  );

  // Key extractor
  const keyExtractor = useCallback((item: BroadcastMessage) => item.id, []);

  // Sabitli mesaj
  const pinnedMessage = messages?.find((m) => m.is_pinned);

  // Inverted list için mesajları ters çevir (en yeni altta)
  const sortedMessages = messages ? [...messages].reverse() : [];

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <BroadcastChannelHeader
          channel={channel}
          isCreator={isOwner}
          onOpenScheduled={handleOpenScheduled}
          onOpenAnalytics={handleOpenAnalytics}
        />
        <BroadcastSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <BroadcastChannelHeader
          channel={channel}
          isCreator={isOwner}
          onOpenScheduled={handleOpenScheduled}
          onOpenAnalytics={handleOpenAnalytics}
        />
      </SafeAreaView>

      {/* Sabitli Mesaj Banner - Geliştirilmiş UI */}
      {pinnedMessage && (
        <Pressable style={[styles.pinnedBanner, { backgroundColor: `${colors.accent}15` }]}>
          <View style={styles.pinnedIconContainer}>
            <Ionicons name="pin" size={14} color={colors.accent} />
          </View>
          <View style={styles.pinnedContent}>
            <Text style={[styles.pinnedLabel, { color: colors.accent }]}>Sabitli Mesaj</Text>
            <Text style={[styles.pinnedText, { color: colors.textPrimary }]} numberOfLines={1}>
              {pinnedMessage.content || "Medya içerik"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </Pressable>
      )}

      <FlashList
        data={sortedMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={200}
        inverted
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={<View style={{ height: 16 }} />}
        ListFooterComponent={isFetchingNextPage ? <BroadcastSkeleton count={2} /> : null}
      />

      {/* Owner için composer */}
      {isOwner && (
        <View style={{ paddingBottom: insets.bottom }}>
          <BroadcastComposer
            channelId={channelId || ""}
            onOpenSchedule={handleOpenSchedulePicker}
            scheduledDate={composerScheduledDate}
            onClearSchedule={handleClearSchedule}
          />
        </View>
      )}

      {/* Zamanlanmış Mesajlar Bottom Sheet */}
      <BottomSheet
        ref={scheduledSheetRef}
        index={-1}
        snapPoints={scheduledSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView style={styles.scheduledContainer}>
          {/* Header */}
          <View style={styles.scheduledHeader}>
            <View style={styles.scheduledHeaderLeft}>
              <Calendar size={24} color={colors.accent} />
              <Text style={[styles.scheduledTitle, { color: colors.textPrimary }]}>
                Zamanlanmış Mesajlar
              </Text>
            </View>
            {scheduledMessages && scheduledMessages.length > 0 && (
              <View style={[styles.scheduledBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.scheduledBadgeText}>{scheduledMessages.length}</Text>
              </View>
            )}
          </View>

          {/* Content */}
          {isLoadingScheduled ? (
            <View style={styles.scheduledLoading}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[styles.scheduledLoadingText, { color: colors.textMuted }]}>
                Yükleniyor...
              </Text>
            </View>
          ) : scheduledMessages && scheduledMessages.length > 0 ? (
            <View style={styles.scheduledList}>
              {scheduledMessages.map((msg: any) => (
                <View
                  key={msg.id}
                  style={[styles.scheduledCard, { backgroundColor: colors.surface }]}
                >
                  {/* Tarih Badge */}
                  <View
                    style={[styles.scheduledDateBadge, { backgroundColor: `${colors.accent}20` }]}
                  >
                    <Clock size={14} color={colors.accent} />
                    <Text style={[styles.scheduledDateText, { color: colors.accent }]}>
                      {new Date(msg.scheduled_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}{" "}
                      •{" "}
                      {new Date(msg.scheduled_at).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </Text>
                  </View>

                  {/* Mesaj İçeriği */}
                  <Text
                    style={[styles.scheduledCardText, { color: colors.textPrimary }]}
                    numberOfLines={3}
                  >
                    {msg.content || (msg.media_url ? "📷 Medya içerik" : "Mesaj")}
                  </Text>

                  {/* Medya göstergesi */}
                  {msg.media_url && (
                    <View style={[styles.scheduledMediaBadge, { backgroundColor: colors.surface }]}>
                      <Ionicons name="image" size={14} color={colors.textMuted} />
                      <Text style={[styles.scheduledMediaText, { color: colors.textMuted }]}>
                        Medya ekli
                      </Text>
                    </View>
                  )}

                  {/* Aksiyonlar */}
                  <View style={styles.scheduledCardActions}>
                    <Pressable
                      style={[styles.scheduledActionBtn, { backgroundColor: `${colors.accent}15` }]}
                      onPress={() => handleOpenEdit(msg)}
                    >
                      <Edit3 size={16} color={colors.accent} />
                      <Text style={[styles.scheduledActionText, { color: colors.accent }]}>
                        Düzenle
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.scheduledActionBtn,
                        { backgroundColor: "rgba(239,68,68,0.1)" }
                      ]}
                      onPress={() => handleCancelScheduled(msg.id)}
                      disabled={isCancelling}
                    >
                      <Trash2 size={16} color="#EF4444" />
                      <Text style={[styles.scheduledActionText, { color: "#EF4444" }]}>
                        İptal Et
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.scheduledEmpty}>
              <View style={[styles.scheduledEmptyIcon, { backgroundColor: `${colors.accent}15` }]}>
                <Calendar size={40} color={colors.accent} />
              </View>
              <Text style={[styles.scheduledEmptyTitle, { color: colors.textPrimary }]}>
                Zamanlanmış mesaj yok
              </Text>
              <Text style={[styles.scheduledEmptyDesc, { color: colors.textMuted }]}>
                Mesaj yazarken saat ikonuna tıklayarak{"\n"}mesajlarınızı zamanlayabilirsiniz
              </Text>
              <View style={[styles.scheduledEmptyTip, { backgroundColor: colors.surface }]}>
                <Send size={16} color={colors.accent} />
                <Text style={[styles.scheduledEmptyTipText, { color: colors.textMuted }]}>
                  İpucu: Zamanlanmış mesajlar belirlediğiniz saatte otomatik gönderilir
                </Text>
              </View>
            </View>
          )}

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Analytics Bottom Sheet */}
      <BottomSheet
        ref={analyticsSheetRef}
        index={-1}
        snapPoints={analyticsSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView style={styles.analyticsContainer}>
          <View style={styles.analyticsHeader}>
            <BarChart3 size={24} color={colors.accent} />
            <Text style={[styles.analyticsTitle, { color: colors.textPrimary }]}>
              Kanal İstatistikleri
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Users size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {channel?.member_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Üye</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <MessageCircle size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {messages?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mesaj</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Eye size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {channel?.view_count || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Görüntülenme</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <TrendingUp size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {scheduledMessages?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Zamanlanmış</Text>
            </View>
          </View>

          {/* Additional Info */}
          <View style={[styles.analyticsInfo, { backgroundColor: colors.surface }]}>
            <Text style={[styles.analyticsInfoTitle, { color: colors.textPrimary }]}>
              Kanal Bilgileri
            </Text>
            <View style={styles.analyticsInfoRow}>
              <Text style={[styles.analyticsInfoLabel, { color: colors.textMuted }]}>
                Erişim Tipi
              </Text>
              <Text style={[styles.analyticsInfoValue, { color: colors.textPrimary }]}>
                {channel?.access_type === "public"
                  ? "Herkese Açık"
                  : channel?.access_type === "subscribers_only"
                    ? "Abonelere Özel"
                    : "Özel Tier"}
              </Text>
            </View>
            <View style={styles.analyticsInfoRow}>
              <Text style={[styles.analyticsInfoLabel, { color: colors.textMuted }]}>
                Oluşturulma
              </Text>
              <Text style={[styles.analyticsInfoValue, { color: colors.textPrimary }]}>
                {channel?.created_at
                  ? new Date(channel.created_at).toLocaleDateString("tr-TR")
                  : "-"}
              </Text>
            </View>
          </View>

          {/* Spacer for bottom */}
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Edit Scheduled Message Bottom Sheet */}
      <BottomSheet
        ref={editSheetRef}
        index={-1}
        snapPoints={editSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView style={styles.editContainer}>
          {/* Header */}
          <View style={styles.editHeader}>
            <View style={styles.editHeaderLeft}>
              <Edit3 size={24} color={colors.accent} />
              <Text style={[styles.editTitle, { color: colors.textPrimary }]}>Mesajı Düzenle</Text>
            </View>
            <Pressable
              style={[styles.editSaveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSaveEdit}
            >
              <Check size={18} color="#fff" />
              <Text style={styles.editSaveBtnText}>Kaydet</Text>
            </Pressable>
          </View>

          {/* Content Input */}
          <Text style={[styles.editLabel, { color: colors.textMuted }]}>Mesaj İçeriği</Text>
          <View style={[styles.editInputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.editInput, { color: colors.textPrimary }]}
              placeholder="Mesaj içeriği..."
              placeholderTextColor={colors.textMuted}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              maxLength={2000}
            />
          </View>

          {/* Date/Time */}
          <Text style={[styles.editLabel, { color: colors.textMuted }]}>Gönderim Zamanı</Text>
          <View style={[styles.editDateCard, { backgroundColor: colors.surface }]}>
            <View style={styles.editDateRow}>
              <Calendar size={18} color={colors.accent} />
              <Text style={[styles.editDateText, { color: colors.textPrimary }]}>
                {editDate.toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </Text>
            </View>
            <View style={styles.editDateRow}>
              <Clock size={18} color={colors.accent} />
              <Text style={[styles.editDateText, { color: colors.textPrimary }]}>
                {editDate.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </Text>
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.editPickerWrapper}>
            <DateTimePicker
              value={editDate}
              mode="datetime"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, date) => date && setEditDate(date)}
              style={{ height: 150 }}
              textColor={colors.textPrimary}
            />
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Schedule Picker Bottom Sheet (for Composer) */}
      <BottomSheet
        ref={schedulePickerSheetRef}
        index={-1}
        snapPoints={schedulePickerSnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      >
        <BottomSheetScrollView style={styles.schedulePickerContainer}>
          {/* Header */}
          <View style={styles.schedulePickerHeader}>
            <View style={styles.schedulePickerHeaderLeft}>
              <Calendar size={24} color={colors.accent} />
              <Text style={[styles.schedulePickerTitle, { color: colors.textPrimary }]}>
                Mesajı Zamanla
              </Text>
            </View>
            <Pressable
              style={[styles.schedulePickerConfirmBtn, { backgroundColor: colors.accent }]}
              onPress={handleConfirmSchedule}
            >
              <Check size={18} color="#fff" />
              <Text style={styles.schedulePickerConfirmText}>Onayla</Text>
            </Pressable>
          </View>

          {/* Bilgi Notu */}
          <View style={[styles.schedulePickerInfo, { backgroundColor: `${colors.accent}10` }]}>
            <MessageCircle size={16} color={colors.accent} />
            <Text style={[styles.schedulePickerInfoText, { color: colors.textMuted }]}>
              Yazdığınız mesaj seçtiğiniz tarihte otomatik gönderilecek
            </Text>
          </View>

          {/* Seçili Tarih Gösterimi */}
          <View style={[styles.schedulePickerDateCard, { backgroundColor: colors.surface }]}>
            <View style={styles.schedulePickerDateRow}>
              <Calendar size={18} color={colors.accent} />
              <Text style={[styles.schedulePickerDateText, { color: colors.textPrimary }]}>
                {tempScheduleDate.toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </Text>
            </View>
            <View style={styles.schedulePickerDateRow}>
              <Clock size={18} color={colors.accent} />
              <Text style={[styles.schedulePickerDateText, { color: colors.textPrimary }]}>
                {tempScheduleDate.toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </Text>
            </View>
          </View>

          {/* Hızlı Seçim */}
          <Text style={[styles.schedulePickerLabel, { color: colors.textMuted }]}>Hızlı Seçim</Text>
          <View style={styles.schedulePickerQuickGrid}>
            {quickSelectOptions.map((option, index) => (
              <Pressable
                key={index}
                style={[styles.schedulePickerQuickBtn, { backgroundColor: colors.surface }]}
                onPress={() => setTempScheduleDate(option.date)}
              >
                <Zap size={14} color={colors.accent} />
                <Text style={[styles.schedulePickerQuickText, { color: colors.textPrimary }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Mode Tabs */}
          <View style={[styles.schedulePickerTabs, { backgroundColor: colors.surface }]}>
            <Pressable
              style={[
                styles.schedulePickerTab,
                schedulePickerMode === "date" && { backgroundColor: colors.accent }
              ]}
              onPress={() => setSchedulePickerMode("date")}
            >
              <Calendar
                size={16}
                color={schedulePickerMode === "date" ? "#fff" : colors.textMuted}
              />
              <Text
                style={[
                  styles.schedulePickerTabText,
                  { color: schedulePickerMode === "date" ? "#fff" : colors.textMuted }
                ]}
              >
                Tarih
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.schedulePickerTab,
                schedulePickerMode === "time" && { backgroundColor: colors.accent }
              ]}
              onPress={() => setSchedulePickerMode("time")}
            >
              <Clock size={16} color={schedulePickerMode === "time" ? "#fff" : colors.textMuted} />
              <Text
                style={[
                  styles.schedulePickerTabText,
                  { color: schedulePickerMode === "time" ? "#fff" : colors.textMuted }
                ]}
              >
                Saat
              </Text>
            </Pressable>
          </View>

          {/* Date/Time Picker */}
          <View style={styles.schedulePickerWrapper}>
            <DateTimePicker
              value={tempScheduleDate}
              mode={schedulePickerMode}
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, date) => date && setTempScheduleDate(date)}
              style={{ height: 150 }}
              textColor={colors.textPrimary}
            />
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100
  },
  pinnedBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    gap: 10
  },
  pinnedIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center"
  },
  pinnedContent: {
    flex: 1
  },
  pinnedLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2
  },
  pinnedText: {
    fontSize: 14
  },
  // Scheduled Bottom Sheet Styles
  scheduledContainer: {
    flex: 1,
    padding: 16
  },
  scheduledHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  scheduledHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  scheduledTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  scheduledBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  scheduledBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600"
  },
  scheduledLoading: {
    padding: 60,
    alignItems: "center",
    gap: 12
  },
  scheduledLoadingText: {
    fontSize: 14
  },
  scheduledList: {
    gap: 12
  },
  scheduledCard: {
    padding: 16,
    borderRadius: 16
  },
  scheduledDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12
  },
  scheduledDateText: {
    fontSize: 13,
    fontWeight: "600"
  },
  scheduledCardText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12
  },
  scheduledMediaBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12
  },
  scheduledMediaText: {
    fontSize: 12
  },
  scheduledCardActions: {
    flexDirection: "row",
    gap: 10
  },
  scheduledActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10
  },
  scheduledActionText: {
    fontSize: 14,
    fontWeight: "600"
  },
  scheduledEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  scheduledEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  scheduledEmptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8
  },
  scheduledEmptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20
  },
  scheduledEmptyTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12
  },
  scheduledEmptyTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  // Analytics Bottom Sheet Styles
  analyticsContainer: {
    flex: 1,
    padding: 16
  },
  analyticsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700"
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500"
  },
  analyticsInfo: {
    padding: 16,
    borderRadius: 16
  },
  analyticsInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12
  },
  analyticsInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)"
  },
  analyticsInfoLabel: {
    fontSize: 14
  },
  analyticsInfoValue: {
    fontSize: 14,
    fontWeight: "500"
  },
  // Edit Bottom Sheet Styles
  editContainer: {
    flex: 1,
    padding: 16
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  editHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  editTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  editSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  editSaveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  editLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8
  },
  editInputContainer: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    minHeight: 100
  },
  editInput: {
    fontSize: 15,
    lineHeight: 22
  },
  editDateCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12
  },
  editDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  editDateText: {
    fontSize: 15,
    fontWeight: "500"
  },
  editPickerWrapper: {
    alignItems: "center",
    justifyContent: "center"
  },
  // Schedule Picker Bottom Sheet Styles
  schedulePickerContainer: {
    flex: 1,
    padding: 16
  },
  schedulePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  schedulePickerHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  schedulePickerTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  schedulePickerConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  schedulePickerConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },
  schedulePickerDateCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12
  },
  schedulePickerDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  schedulePickerDateText: {
    fontSize: 15,
    fontWeight: "500"
  },
  schedulePickerLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10
  },
  schedulePickerQuickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  schedulePickerQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12
  },
  schedulePickerQuickText: {
    fontSize: 13,
    fontWeight: "500"
  },
  schedulePickerTabs: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12
  },
  schedulePickerTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10
  },
  schedulePickerTabText: {
    fontSize: 14,
    fontWeight: "600"
  },
  schedulePickerWrapper: {
    alignItems: "center",
    justifyContent: "center"
  },
  schedulePickerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16
  },
  schedulePickerInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  }
});

export default BroadcastChannelScreen;
