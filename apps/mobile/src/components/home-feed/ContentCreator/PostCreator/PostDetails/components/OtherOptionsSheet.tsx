/**
 * OtherOptionsSheet Component
 * Diğer Seçenekler - Yorum, beğenme, paylaşım gizleme
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, Switch, Modal, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, MessageCircleOff, HeartOff, EyeOff } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { PostSettings } from "../../types";

interface OtherOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  settings: PostSettings;
  onSettingsChange: (settings: PostSettings) => void;
}

export function OtherOptionsSheet({
  visible,
  onClose,
  settings,
  onSettingsChange
}: OtherOptionsSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleToggle = (key: keyof PostSettings, value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top }]}>
          <Pressable onPress={onClose} style={styles.backButton}>
            <ChevronLeft size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Diğer Seçenekler</Text>
          <View style={styles.backButton} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Başkalarının gönderinle etkileşimleri
          </Text>

          {/* Yorum yapmayı kapat */}
          <View style={styles.option}>
            <MessageCircleOff size={24} color={colors.textPrimary} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                Yorum yapmayı kapat
              </Text>
            </View>
            <Switch
              value={settings.hideComments}
              onValueChange={(value) => handleToggle("hideComments", value)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFF"
            />
          </View>

          {/* Beğenme sayısını gizle */}
          <View style={styles.option}>
            <HeartOff size={24} color={colors.textPrimary} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                Bu gönderide beğenme sayısını gizle
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                Bu gönderideki toplam beğenme ve görüntüleme sayısını sadece sen göreceksin. Bunu
                daha sonra gönderinin en üstündeki ••• menüsüne giderek değiştirebilirsin.{" "}
                <Text
                  style={{ color: colors.accent }}
                  onPress={() => Linking.openURL("https://help.instagram.com")}
                >
                  Daha fazla bilgi al
                </Text>
              </Text>
            </View>
            <Switch
              value={settings.hideLikes}
              onValueChange={(value) => handleToggle("hideLikes", value)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFF"
            />
          </View>

          {/* Paylaşım sayısını gizle */}
          <View style={styles.option}>
            <EyeOff size={24} color={colors.textPrimary} />
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>
                Bu gönderide paylaşım sayısını gizle
              </Text>
              <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                Sadece sen bu gönderideki beğenme ve paylaşım sayısını göreceksin. Daha sonra bunu
                değiştirmek istersen gönderinin en üstündeki ••• menüsüne gidebilirsin.{" "}
                <Text
                  style={{ color: colors.accent }}
                  onPress={() => Linking.openURL("https://help.instagram.com")}
                >
                  Daha fazla bilgi al
                </Text>
              </Text>
            </View>
            <Switch
              value={settings.hideShareCount}
              onValueChange={(value) => handleToggle("hideShareCount", value)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#FFF"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5
  },
  backButton: {
    width: 50,
    height: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600"
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 20
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    gap: 14
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20
  }
});
