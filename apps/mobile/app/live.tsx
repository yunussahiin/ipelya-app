import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { useTabsNavigation } from "@/navigation/useTabsNavigation";
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
  const layout = useDeviceLayout();
  const { tabs, activeKey, onChange } = useTabsNavigation();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showGlows = scheme === "dark";

  const contentStyle = [
    styles.scroll,
    {
      paddingTop: layout.topPadding,
      paddingBottom: layout.navPadding,
      paddingHorizontal: layout.contentPaddingHorizontal,
      gap: layout.sectionGap
    },
    layout.contentWidth ? { width: layout.contentWidth, alignSelf: "center" } : null
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View style={styles.chrome}>
        {showGlows ? (
          <>
            <View pointerEvents="none" style={[styles.edgeGlow, styles.topGlow, { height: layout.insets.top + 80 }]} />
            <View pointerEvents="none" style={[styles.edgeGlow, styles.bottomGlow, { height: layout.insets.bottom + 140 }]} />
          </>
        ) : null}
        <ScrollView style={styles.scrollView} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false}>
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
        </ScrollView>
        <BottomNavigation items={tabs} activeKey={activeKey} onChange={onChange} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background
    },
    chrome: {
      flex: 1,
      position: "relative"
    },
    edgeGlow: {
      position: "absolute",
      left: 0,
      right: 0,
      zIndex: -1,
      backgroundColor: colors.background
    },
    topGlow: {
      top: 0,
      shadowColor: colors.glowShadow,
      shadowOffset: { height: 24, width: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 50,
      elevation: 35
    },
    bottomGlow: {
      bottom: 0,
      shadowColor: colors.glowShadow,
      shadowOffset: { height: -24, width: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 60,
      elevation: 40
    },
    scrollView: {
      flex: 1
    },
    scroll: {
      flexGrow: 1
    },
    topActions: {
      alignItems: "flex-end",
      marginBottom: 12
    },
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
      backgroundColor: colors.surfaceAlt,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16
    },
    roomTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600"
    },
    roomMeta: {
      color: colors.textSecondary,
      marginTop: 4
    },
    roomMetrics: {
      alignItems: "flex-end",
      gap: 4
    },
    roomAudience: {
      color: colors.success,
      fontWeight: "600"
    },
    roomQuality: {
      color: colors.textSecondary
    },
    toolRow: {
      flexDirection: "row",
      gap: 12
    },
    toolCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      backgroundColor: colors.surface,
      gap: 6
    },
    toolLabel: {
      color: colors.textPrimary,
      fontWeight: "600"
    },
    toolDetail: {
      color: colors.textSecondary,
      fontSize: 12
    },
    actions: {
      flexDirection: "row",
      gap: 12
    },
    actionButton: {
      flex: 1
    }
  });
