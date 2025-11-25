/**
 * MoreMenu Component
 * Action sheet menu for profile actions
 */

import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View, Modal } from "react-native";
import { MoreHorizontal, Share2, Ban, Flag, Link, BellOff } from "lucide-react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import type { MoreMenuAction, MoreMenuOption } from "../types";

interface MoreMenuProps {
  visible: boolean;
  onClose: () => void;
  onAction: (action: MoreMenuAction) => void;
  isOwnProfile?: boolean;
}

const MENU_OPTIONS: MoreMenuOption[] = [
  { id: "share", label: "Profili Paylaş", icon: "share" },
  { id: "copy_link", label: "Bağlantıyı Kopyala", icon: "link" },
  { id: "mute", label: "Bildirimleri Kapat", icon: "mute" },
  { id: "block", label: "Engelle", icon: "block", destructive: true },
  { id: "report", label: "Şikayet Et", icon: "report", destructive: true }
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getIcon(iconName: string, color: string, size: number) {
  switch (iconName) {
    case "share":
      return <Share2 size={size} color={color} />;
    case "link":
      return <Link size={size} color={color} />;
    case "mute":
      return <BellOff size={size} color={color} />;
    case "block":
      return <Ban size={size} color={color} />;
    case "report":
      return <Flag size={size} color={color} />;
    default:
      return null;
  }
}

export function MoreMenuButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      style={[
        {
          padding: 12,
          borderRadius: 22,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border
        },
        animatedStyle
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <MoreHorizontal size={20} color={colors.textPrimary} />
    </AnimatedPressable>
  );
}

export function MoreMenu({ visible, onClose, onAction, isOwnProfile = false }: MoreMenuProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Filter options for own profile
  const options = isOwnProfile
    ? MENU_OPTIONS.filter((opt) => ["share", "copy_link"].includes(opt.id))
    : MENU_OPTIONS;

  const handleAction = (action: MoreMenuAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAction(action);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          {/* Handle bar - Apple style */}
          <View style={styles.handleBar} />

          {/* Options */}
          {options.map((option, index) => (
            <Pressable
              key={option.id}
              style={[
                styles.option,
                index === options.length - 1 && styles.lastOption,
                option.destructive && styles.destructiveOption
              ]}
              onPress={() => handleAction(option.id)}
            >
              {getIcon(option.icon, option.destructive ? "#EF4444" : colors.textPrimary, 20)}
              <Text style={[styles.optionText, option.destructive && styles.destructiveText]}>
                {option.label}
              </Text>
            </Pressable>
          ))}

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>İptal</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end"
    },
    menuContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 34,
      paddingTop: 8
    },
    handleBar: {
      width: 36,
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 12
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    lastOption: {
      borderBottomWidth: 0
    },
    destructiveOption: {},
    optionText: {
      fontSize: 16,
      color: colors.textPrimary
    },
    destructiveText: {
      color: "#EF4444"
    },
    cancelButton: {
      marginTop: 8,
      marginHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: "center"
    },
    cancelText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary
    }
  });
