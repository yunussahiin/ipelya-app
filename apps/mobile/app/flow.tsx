import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const queuedStories = [
  { title: "Shadow Feed #142", eta: "+3 içerik", note: "AI render 8dk" },
  { title: "Canlı kesit", eta: "publishing", note: "Auto caption" }
];

export default function FlowScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScreen>
      {({ layout }) => (
        <>
          <View style={styles.header}>
            <Text style={styles.label}>Akış Yönetimi</Text>
            <Text style={styles.title}>Clips Pipeline</Text>
            <Text style={styles.subtitle}>Shadow feed kuyruğunu, render durumlarını ve otomasyonları burada takip et.</Text>
          </View>

          <View style={[styles.section, { gap: layout.sectionGap * 0.5 }]}>
            <Text style={styles.sectionTitle}>Bekleyen Hikayeler</Text>
            {queuedStories.map((story) => (
              <View key={story.title} style={styles.storyCard}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <Text style={styles.storyMeta}>{story.eta}</Text>
                <Text style={styles.storyNote}>{story.note}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.section, { gap: layout.sectionGap * 0.5 }]}>
            <Text style={styles.sectionTitle}>Otomasyon</Text>
            <View style={styles.storyCard}>
              <Text style={styles.storyTitle}>ASMR Preset</Text>
              <Text style={styles.storyNote}>Gece modu için planlandı · 22:00</Text>
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
    storyCard: {
      backgroundColor: colors.surface,
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
