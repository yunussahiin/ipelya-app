/**
 * ChannelLockedScreen Component
 *
 * Amaç: Ücretli kanallarda (subscribers_only, tier_specific) üye olmayan
 * kullanıcılara gösterilen kilitli ekran. İçerik tamamen gizli.
 *
 * Tarih: 2025-12-02
 */

import { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Lock, Crown, CheckCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/theme/ThemeProvider";

type AccessType = "subscribers_only" | "tier_specific";

interface ChannelLockedScreenProps {
  accessType: AccessType;
  channelName: string;
  channelAvatarUrl?: string;
  creatorUsername: string;
  creatorVerified?: boolean;
  tierName?: string; // tier_specific için
  tierPrice?: number; // Coin fiyatı
  onSubscribe: () => void;
  isLoading?: boolean;
}

export function ChannelLockedScreen({
  accessType,
  channelName,
  channelAvatarUrl,
  creatorUsername,
  creatorVerified = false,
  tierName,
  tierPrice,
  onSubscribe,
  isLoading = false
}: ChannelLockedScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSubscribe = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubscribe();
  }, [onSubscribe]);

  const getTitle = () => {
    if (accessType === "tier_specific" && tierName) {
      return `${tierName} Üyelerine Özel`;
    }
    return "Abonelere Özel";
  };

  const getDescription = () => {
    if (accessType === "tier_specific" && tierName) {
      return `Bu kanal sadece ${tierName} üyelerine özel.\nErişim için ${tierName} abonesi ol.`;
    }
    return `Bu kanal sadece @${creatorUsername} abonelerine özel.\nÖzel içeriklere erişmek için abone ol.`;
  };

  const getButtonText = () => {
    if (isLoading) return "Yükleniyor...";
    if (accessType === "tier_specific" && tierName) {
      return tierPrice ? `${tierName} Abone Ol (${tierPrice} Coin)` : `${tierName} Abone Ol`;
    }
    return "Abone Ol";
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient colors={["transparent", colors.background]} style={styles.gradient} />

      {/* Content */}
      <View style={styles.content}>
        {/* Lock icon with channel avatar */}
        <View style={styles.iconContainer}>
          {channelAvatarUrl ? (
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: channelAvatarUrl }}
                style={styles.channelAvatar}
                contentFit="cover"
              />
              <View style={[styles.lockBadge, { backgroundColor: colors.surface }]}>
                <Lock size={16} color={colors.textMuted} />
              </View>
            </View>
          ) : (
            <View style={[styles.lockCircle, { borderColor: colors.border }]}>
              <Lock size={48} color={colors.textMuted} />
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleRow}>
          <Crown size={20} color="#FFD700" />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{getTitle()}</Text>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {getDescription()}
        </Text>

        {/* Creator info */}
        <View style={styles.creatorRow}>
          <Text style={[styles.creatorText, { color: colors.textMuted }]}>@{creatorUsername}</Text>
          {creatorVerified && <CheckCircle size={14} color={colors.accent} />}
        </View>

        {/* Subscribe button */}
        <Pressable
          style={[styles.subscribeButton, { backgroundColor: colors.accent }]}
          onPress={handleSubscribe}
          disabled={isLoading}
        >
          <Crown size={18} color="#FFFFFF" />
          <Text style={styles.subscribeText}>{getButtonText()}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32
    },
    gradient: {
      ...StyleSheet.absoluteFillObject
    },
    content: {
      alignItems: "center",
      gap: 16
    },
    iconContainer: {
      marginBottom: 8
    },
    avatarWrapper: {
      position: "relative"
    },
    channelAvatar: {
      width: 100,
      height: 100,
      borderRadius: 24,
      opacity: 0.5
    },
    lockBadge: {
      position: "absolute",
      bottom: -8,
      right: -8,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4
    },
    lockCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center"
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8
    },
    title: {
      fontSize: 22,
      fontWeight: "700"
    },
    description: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22
    },
    creatorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4
    },
    creatorText: {
      fontSize: 14,
      fontWeight: "500"
    },
    subscribeButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 24,
      marginTop: 8
    },
    subscribeText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF"
    }
  });

export default ChannelLockedScreen;
