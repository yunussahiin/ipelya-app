import { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";
import { useTabsNavigation } from "@/navigation/useTabsNavigation";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const queuedStories = [
  { title: "Shadow Feed #142", eta: "+3 içerik", note: "AI render 8dk" },
  { title: "Canlı kesit", eta: "publishing", note: "Auto caption" }
];

export default function FlowScreen() {
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
            <Text style={styles.label}>Akış Yönetimi</Text>
            <Text style={styles.title}>Clips Pipeline</Text>
            <Text style={styles.subtitle}>Shadow feed kuyruğunu, render durumlarını ve otomasyonları burada takip et.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bekleyen Hikayeler</Text>
            {queuedStories.map((story) => (
              <View key={story.title} style={styles.storyCard}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyMeta}>{story.eta}</Text>
                <Text style={styles.storyNote}>{story.note}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Otomasyon</Text>
            <View style={styles.storyCard}>
              <Text style={styles.storyTitle}>ASMR Preset</Text>
              <Text style={styles.storyNote}>Gece modu için planlandı · 22:00</Text>
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
    storyCard: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4
    },
    storyTitle: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 16
    },
    storyMeta: {
      color: colors.highlight,
      fontWeight: "600"
    },
    storyNote: {
      color: colors.textSecondary,
      fontSize: 12
    }
  });
