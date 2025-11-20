/**
 * Follower Action Sheet Component
 * Seçenekler: Mesaj, Engelle, Engeli Kaldır
 */

import { useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { MessageCircle, Ban, RotateCcw, X } from "lucide-react-native";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

export interface FollowerActionSheetProps {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  isFollowing: boolean;
  isBlocked: boolean;
  onMessage: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  loading?: boolean;
}

export function FollowerActionSheet({
  visible,
  onClose,
  displayName,
  isFollowing,
  isBlocked,
  onMessage,
  onBlock,
  onUnblock,
  loading = false
}: FollowerActionSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleMessage = useCallback(() => {
    onMessage();
    onClose();
  }, [onMessage, onClose]);

  const handleBlock = useCallback(() => {
    onBlock();
    onClose();
  }, [onBlock, onClose]);

  const handleUnblock = useCallback(() => {
    onUnblock();
    onClose();
  }, [onUnblock, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={15} style={styles.overlay}>
        <Pressable
          style={[styles.overlayPressable, { backgroundColor: "rgba(0, 0, 0, 0.2)" }]}
          onPress={onClose}
        />
      </BlurView>

      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>{displayName}</Text>
          <Pressable
            onPress={onClose}
            accessible={true}
            accessibilityLabel="Kapat"
            accessibilityRole="button"
          >
            <X size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <Pressable onPress={(e) => e.stopPropagation()}>
          {/* Message Option */}
          {isFollowing && (
            <Pressable
              style={[styles.action, styles.actionPrimary]}
              onPress={handleMessage}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Mesaj gönder"
              accessibilityRole="button"
            >
              <MessageCircle size={20} color={colors.accent} />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Mesaj Gönder</Text>
                <Text style={styles.actionSubtitle}>Doğrudan mesaj gönder</Text>
              </View>
            </Pressable>
          )}

          {/* Block/Unblock Option */}
          {isBlocked ? (
            <Pressable
              style={[styles.action, styles.actionDanger]}
              onPress={handleUnblock}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Engeli kaldır"
              accessibilityRole="button"
            >
              <RotateCcw size={20} color="#10b981" />
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: "#10b981" }]}>Engeli Kaldır</Text>
                <Text style={styles.actionSubtitle}>Bu kullanıcıyı engelden çıkar</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.action, styles.actionDanger]}
              onPress={handleBlock}
              disabled={loading}
              accessible={true}
              accessibilityLabel="Engelle"
              accessibilityRole="button"
            >
              <Ban size={20} color="#ef4444" />
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, { color: "#ef4444" }]}>Engelle</Text>
                <Text style={styles.actionSubtitle}>Bu kullanıcıyı engelle</Text>
              </View>
            </Pressable>
          )}

          {/* Cancel Button */}
          <Pressable
            style={[styles.cancelButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
            accessible={true}
            accessibilityLabel="İptal"
            accessibilityRole="button"
          >
            <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>İptal</Text>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end"
    },
    overlayPressable: {
      flex: 1
    },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
      maxHeight: "80%"
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: 16
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    headerText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 12,
      gap: 12
    },
    actionPrimary: {
      backgroundColor: `${colors.accent}15`
    },
    actionDanger: {
      backgroundColor: "rgba(239, 68, 68, 0.1)"
    },
    actionContent: {
      flex: 1,
      gap: 4
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary
    },
    actionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 12
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600"
    }
  });
