/**
 * MessageInfoSheet
 *
 * Bottom sheet ile açılan mesaj bilgisi sayfası
 * Okundu/Teslim edildi bilgilerini gösterir
 */

import { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import type { ThemeColors } from "@/theme/ThemeProvider";
import type { IMessage } from "react-native-gifted-chat";
import dayjs from "dayjs";
import "dayjs/locale/tr";

dayjs.locale("tr");

interface MessageInfoSheetProps {
  visible: boolean;
  message: IMessage | null;
  colors: ThemeColors;
  onClose: () => void;
  // Mesaj durumu bilgileri
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

interface StatusRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  time: string;
  colors: ThemeColors;
}

function StatusRow({ icon, iconColor, label, time, colors }: StatusRowProps) {
  return (
    <View style={[styles.statusRow, { borderBottomColor: colors.border }]}>
      <View style={styles.statusLeft}>
        <Ionicons name={icon} size={22} color={iconColor} />
        <Text style={[styles.statusLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <Text style={[styles.statusTime, { color: colors.textMuted }]}>{time}</Text>
    </View>
  );
}

function MessageInfoSheetComponent({
  visible,
  message,
  colors,
  onClose,
  deliveredAt,
  readAt
}: MessageInfoSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  // Sabit snap points - animasyon sorunlarını önlemek için
  const snapPoints = useMemo(() => ["80%"], []);

  // Sheet açma/kapama
  useEffect(() => {
    if (visible) {
      // Küçük delay ile BottomSheet'in hazır olmasını bekle
      const timer = setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="close"
      />
    ),
    []
  );

  if (!message) return null;

  const formatTime = (date?: Date) => {
    if (!date) return "-";
    return dayjs(date).format("bugün HH:mm");
  };

  const messageTime = message.createdAt ? dayjs(message.createdAt).format("bugün HH:mm") : "-";
  const hasImage = !!message.image;
  const hasVideo = !!message.video;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mesaj bilgisi</Text>
        <View style={styles.headerRight} />
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Message Preview */}
        <View style={styles.messagePreviewContainer}>
          <View style={[styles.messagePreview, { backgroundColor: colors.accent }]}>
            {/* Medya önizlemesi */}
            {hasImage && message.image && (
              <Image
                source={{ uri: message.image }}
                style={styles.mediaPreview}
                contentFit="cover"
              />
            )}
            {hasVideo && message.video && (
              <View style={styles.videoPreviewContainer}>
                <Image
                  source={{ uri: message.video }}
                  style={styles.mediaPreview}
                  contentFit="cover"
                />
                <View style={styles.videoPlayIcon}>
                  <Ionicons name="play" size={24} color="#fff" />
                </View>
              </View>
            )}
            {/* Metin */}
            {message.text ? (
              <Text style={styles.messageText} numberOfLines={3}>
                {message.text}
              </Text>
            ) : null}
            <Text style={styles.messageTime}>
              {messageTime}{" "}
              <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />
            </Text>
          </View>
        </View>

        {/* Status List */}
        <View style={styles.statusList}>
          <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            {/* Okundu */}
            <StatusRow
              icon="checkmark-done"
              iconColor={colors.accent}
              label="Okundu"
              time={formatTime(
                readAt || (message.received ? (message.createdAt as Date) : undefined)
              )}
              colors={colors}
            />

            {/* Teslim Edildi */}
            <StatusRow
              icon="checkmark-done"
              iconColor={colors.textMuted}
              label="Teslim edildi"
              time={formatTime(
                deliveredAt || (message.sent ? (message.createdAt as Date) : undefined)
              )}
              colors={colors}
            />
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

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
    width: 44
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600"
  },
  headerRight: {
    width: 44
  },
  content: {
    paddingBottom: 32
  },
  messagePreviewContainer: {
    padding: 16,
    alignItems: "flex-end"
  },
  messagePreview: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: "80%",
    overflow: "hidden"
  },
  mediaPreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 8
  },
  videoPreviewContainer: {
    position: "relative"
  },
  videoPlayIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -20,
    marginLeft: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20
  },
  messageTime: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 4,
    alignSelf: "flex-end"
  },
  statusList: {
    paddingHorizontal: 16,
    paddingTop: 16
  },
  statusCard: {
    borderRadius: 12,
    overflow: "hidden"
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  statusLabel: {
    fontSize: 16
  },
  statusTime: {
    fontSize: 14
  }
});

export const MessageInfoSheet = memo(MessageInfoSheetComponent);
