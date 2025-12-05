/**
 * Guest Invitation Modal
 * Konuk davet popup'ı - Viewer'a gelen davet bildirimi
 * Kabul/Reddet seçenekleri ve countdown timer içerir
 */

import React, { useEffect, useState } from "react";
import { View, Text, Modal, Pressable, StyleSheet, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeProvider";
import { GuestInvitation } from "@/hooks/live";

interface GuestInvitationModalProps {
  invitation: GuestInvitation | null;
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
  onTimeout: () => void;
}

export function GuestInvitationModal({
  invitation,
  visible,
  onAccept,
  onReject,
  onTimeout
}: GuestInvitationModalProps) {
  const { colors } = useTheme();
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Countdown timer
  useEffect(() => {
    if (!visible || !invitation) return;

    const expiresAt = new Date(invitation.expiresAt).getTime();
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
    setRemainingSeconds(remaining);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, invitation, onTimeout]);

  // Pulse animation for urgent state
  useEffect(() => {
    if (remainingSeconds <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, [remainingSeconds, pulseAnim]);

  if (!invitation) return null;

  const isUrgent = remainingSeconds <= 10;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          {/* Header with live badge */}
          <View style={styles.header}>
            <View style={[styles.liveBadge, { backgroundColor: "#EF4444" }]}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveBadgeText}>CANLI</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Yayına Davet</Text>
          </View>

          {/* Host info */}
          <View style={styles.hostInfo}>
            {invitation.hostAvatar ? (
              <Image source={{ uri: invitation.hostAvatar }} style={styles.hostAvatar} />
            ) : (
              <View style={[styles.hostAvatarPlaceholder, { backgroundColor: colors.accent }]}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
            )}
            <Text style={[styles.hostName, { color: colors.textPrimary }]}>
              {invitation.hostName}
            </Text>
            <Text style={[styles.sessionTitle, { color: colors.textSecondary }]}>
              {invitation.sessionTitle}
            </Text>
          </View>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            sizi yayına konuk olarak davet ediyor
          </Text>

          {/* Countdown */}
          <View
            style={[
              styles.countdown,
              { backgroundColor: isUrgent ? "#FEE2E2" : `${colors.accent}15` }
            ]}
          >
            <Ionicons name="time-outline" size={16} color={isUrgent ? "#EF4444" : colors.accent} />
            <Text style={[styles.countdownText, { color: isUrgent ? "#EF4444" : colors.accent }]}>
              {remainingSeconds} saniye
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.rejectButton, { backgroundColor: colors.surfaceAlt }]}
              onPress={onReject}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
              <Text style={[styles.rejectButtonText, { color: colors.textSecondary }]}>Reddet</Text>
            </Pressable>

            <Pressable
              style={[styles.acceptButton, { backgroundColor: colors.accent }]}
              onPress={onAccept}
            >
              <Ionicons name="videocam" size={20} color="#fff" />
              <Text style={styles.acceptButtonText}>Katıl</Text>
            </Pressable>
          </View>

          {/* Note */}
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Kabul ettiğinizde kameranız ve mikrofonunuz açılacak
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: "center"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff"
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700"
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  hostInfo: {
    alignItems: "center",
    marginBottom: 12
  },
  hostAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12
  },
  hostAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  hostName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4
  },
  sessionTitle: {
    fontSize: 14
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16
  },
  countdown: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 20
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600"
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600"
  },
  note: {
    fontSize: 12,
    textAlign: "center"
  }
});

export default GuestInvitationModal;
