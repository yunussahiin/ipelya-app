/**
 * PurchaseButton Component
 * Genel amaçlı satın alma butonu
 */

import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";

interface PurchaseButtonProps {
  title: string;
  subtitle?: string;
  price?: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  icon?: keyof typeof Ionicons.glyphMap;
  size?: "small" | "medium" | "large";
}

export function PurchaseButton({
  title,
  subtitle,
  price,
  onPress,
  isLoading = false,
  disabled = false,
  variant = "primary",
  icon,
  size = "medium"
}: PurchaseButtonProps) {
  const { colors } = useTheme();

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    medium: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 }
  };

  const currentSize = sizeStyles[size];

  const getBackgroundColor = () => {
    if (disabled) return colors.backgroundRaised;
    switch (variant) {
      case "primary":
        return colors.accent;
      case "secondary":
        return colors.surface;
      case "outline":
        return "transparent";
      default:
        return colors.accent;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case "primary":
        return "#fff";
      case "secondary":
        return colors.textPrimary;
      case "outline":
        return colors.accent;
      default:
        return "#fff";
    }
  };

  const getBorderColor = () => {
    if (variant === "outline") return colors.accent;
    return "transparent";
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" ? 2 : 0,
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          opacity: disabled ? 0.6 : 1
        }
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={currentSize.fontSize + 2}
              color={getTextColor()}
              style={styles.icon}
            />
          )}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: getTextColor(), fontSize: currentSize.fontSize }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: getTextColor(), opacity: 0.8 }]}>
                {subtitle}
              </Text>
            )}
          </View>
          {price && (
            <Text style={[styles.price, { color: getTextColor(), fontSize: currentSize.fontSize }]}>
              {price}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  icon: {
    marginRight: 4
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontWeight: "600"
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  price: {
    fontWeight: "700"
  }
});
