import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "@/components/ui/Button";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const liveRooms = [
  { title: "Aurora Club", host: "Nova Flux", audience: "482 izleyici", quality: "4.3 Mbps HDR" },
  { title: "Noir Studio", host: "Luna Shadow", audience: "318 izleyici", quality: "3.2 Mbps" }
];

const toolkits = [
  { label: "LiveKit Beta", detail: "Token hazır", accent: "#38bdf8" },
  { label: "Shadow PIN", detail: "Güvenli giriş", accent: "#f472b6" },
  { label: "ASMR Scenes", detail: "3 preset hazır", accent: "#facc15" }
];

export default function LiveScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScreen>
      {() => (
        <>
          <View style={styles.header}>
            <Text style={styles.label}>Canlı Kontrol</Text>
            <Text style={styles.title}>Live Operasyon Merkezi</Text>
            <Text style={styles.subtitle}>
              Studio akışlarını, token durumlarını ve kalite hedeflerini buradan yönet.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktif Odalar</Text>
            {liveRooms.map((room) => (
              <View key={room.title} style={styles.roomCard}>
                <View>
                  <Text style={styles.roomTitle}>{room.title}</Text>
                  <Text style={styles.roomMeta}>{room.host}</Text>
                </View>
                <View style={styles.roomMetrics}>
                  <Text style={styles.roomAudience}>{room.audience}</Text>
                  <Text style={styles.roomQuality}>{room.quality}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arka Plan İşlemleri</Text>
            <View style={styles.toolRow}>
              {toolkits.map((tool) => (
                <View key={tool.label} style={[styles.toolCard, { borderColor: tool.accent }]}>
                  <Text style={styles.toolLabel}>{tool.label}</Text>
                  <Text style={styles.toolDetail}>{tool.detail}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
            <View style={styles.actions}>
              <Button label="Oda Aç" onPress={() => {}} style={styles.actionButton} />
              <Button label="Token Yenile" onPress={() => {}} style={styles.actionButton} />
            </View>
          </View>
        </>
      )}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      gap: 6
    },
    label: {
      color: colors.textSecondary,
      textTransform: "uppercase",
      fontSize: 12
    },
    title: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: "700"
    },
    subtitle: {
      color: colors.textSecondary,
      lineHeight: 20
    },
    section: {
      gap: 12
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600"
    },
    roomCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12
    },
    roomTitle: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 16
    },
    roomMeta: {
      color: colors.textMuted
    },
    roomMetrics: {
      alignItems: "flex-end"
    },
    roomAudience: {
      color: colors.textPrimary,
      fontWeight: "600"
    },
    roomQuality: {
      color: colors.highlight
    },
    toolRow: {
      flexDirection: "row",
      gap: 12
    },
    toolCard: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      backgroundColor: colors.surfaceAlt,
      gap: 4
    },
    toolLabel: {
      color: colors.textPrimary,
      fontWeight: "600"
    },
    toolDetail: {
      color: colors.textSecondary
    },
    actions: {
      flexDirection: "row",
      gap: 12
    },
    actionButton: {
      flex: 1
    }
  });
