/**
 * ChannelJoinBanner Component
 *
 * Amaç: Public kanallarda üye olmayan kullanıcılara gösterilen katılım banner'ı
 * Alt kısımda "Geri Çevir" ve "Katıl" butonları ile birlikte bilgi metni
 *
 * Tarih: 2025-12-02
 */

import { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

interface ChannelJoinBannerProps {
  channelName: string;
  creatorUsername: string;
  creatorAvatarUrl?: string;
  creatorVerified?: boolean;
  onJoin: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function ChannelJoinBanner({
  channelName,
  creatorUsername,
  creatorAvatarUrl,
  creatorVerified = false,
  onJoin,
  onDecline,
  isLoading = false
}: ChannelJoinBannerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleJoin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin();
  }, [onJoin]);

  const handleDecline = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecline();
  }, [onDecline]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Divider line */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.declineButton, { borderColor: colors.border }]}
          onPress={handleDecline}
          disabled={isLoading}
        >
          <Text style={[styles.declineText, { color: colors.textPrimary }]}>Geri Çevir</Text>
        </Pressable>

        <Pressable
          style={[styles.joinButton, { backgroundColor: colors.accent }]}
          onPress={handleJoin}
          disabled={isLoading}
        >
          <Text style={styles.joinText}>{isLoading ? "Katılınıyor..." : "Katıl"}</Text>
        </Pressable>
      </View>

      {/* Info text */}
      <View style={styles.infoContainer}>
        {creatorAvatarUrl && (
          <Image
            source={{ uri: creatorAvatarUrl }}
            style={styles.creatorAvatar}
            contentFit="cover"
          />
        )}
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          <Text style={{ fontWeight: "600", color: colors.textPrimary }}>@{creatorUsername}</Text>
          {creatorVerified && " "}
          {creatorVerified && <CheckCircle size={12} color={colors.accent} />} tarafından
          oluşturulan bu kanala herkes katılabilir. Katılırsan bu kanal gelen kutuna eklenecek ve
          bildirimler alabileceksin.
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 34, // Safe area
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16
    },
    divider: {
      height: 1,
      marginBottom: 16
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16
    },
    declineButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center"
    },
    declineText: {
      fontSize: 15,
      fontWeight: "600"
    },
    joinButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center"
    },
    joinText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#FFFFFF"
    },
    infoContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8
    },
    creatorAvatar: {
      width: 20,
      height: 20,
      borderRadius: 10
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18
    }
  });

export default ChannelJoinBanner;
