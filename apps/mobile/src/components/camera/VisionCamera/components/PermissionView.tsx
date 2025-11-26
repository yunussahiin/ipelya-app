/**
 * PermissionView
 *
 * Kamera izni isteme ekranı
 * - Türkçe metinler
 * - İzin ver butonu
 * - Theme desteği
 */

import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Camera as CameraIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { UI_TEXTS } from "../types";

interface PermissionViewProps {
  /** İzin isteme fonksiyonu */
  onRequestPermission: () => void;
  /** Theme renkleri */
  colors: {
    background: string;
    textPrimary: string;
    textMuted: string;
    accent: string;
  };
}

function PermissionViewComponent({ onRequestPermission, colors }: PermissionViewProps) {
  /**
   * İzin isteme handler
   */
  const handleRequestPermission = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRequestPermission();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* İkon */}
      <CameraIcon size={64} color={colors.textMuted} />

      {/* Başlık */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {UI_TEXTS.permissionRequired}
      </Text>

      {/* Açıklama */}
      <Text style={[styles.description, { color: colors.textMuted }]}>
        Fotoğraf ve video çekebilmek için kamera erişimine ihtiyacımız var.
      </Text>

      {/* İzin Ver Butonu */}
      <Pressable
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={handleRequestPermission}
        accessibilityLabel={UI_TEXTS.grantPermission}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{UI_TEXTS.grantPermission}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 32
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center"
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600"
  }
});

export const PermissionView = memo(PermissionViewComponent);
