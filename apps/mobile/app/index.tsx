import { useMemo } from "react";
import { View, Text, StyleSheet, ImageBackground, FlatList } from "react-native";
import { StatCard } from "@/components/cards/StatCard";
import { Button } from "@/components/ui/Button";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const heroCard = {
  title: "Yaratıcı Modu",
  description: "Shadow feed'de 3 içerik yayına hazır.",
  cta: "Shadow Mode'u Başlat",
  background:
    "https://images.unsplash.com/photo-1685094488656-9231107be07f?auto=format&fit=crop&w=1740&q=80"
};

const quickActions = [
  { label: "İçerik Yükle", detail: "PPV & zamanlama" },
  { label: "Canlı Yayın", detail: "LiveKit token hazır" },
  { label: "ASMR Paneli", detail: "Yeni hikaye oluştur" }
];

const creators = [
  { id: "1", name: "Luna Shadow", metric: "+34% gelir", tone: "#f472b6" },
  { id: "2", name: "Nova Flux", metric: "Shadow PIN aktif", tone: "#facc15" },
  { id: "3", name: "Mira Echo", metric: "Live odası açık", tone: "#38bdf8" }
];

const insights = [
  { label: "Bugünki Coin", value: "4.200", trend: "+18%" },
  { label: "Aktif Shadow", value: "142", trend: "+6 yeni" },
  { label: "DM Yanıt Süresi", value: "1.3dk", trend: "hedef altında" }
];

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <PageScreen>
      {({ layout }) => {
        const cardRadius = layout.cardRadius;
        const stackStats = layout.breakpoint === "xs";
        const wrapStats = layout.breakpoint === "sm";
        const stackQuick = layout.breakpoint === "xs";
        const wrapQuick = layout.breakpoint === "sm";
        const isWide = layout.breakpoint === "lg" || layout.breakpoint === "xl";

        return (
          <>
            <View style={styles.header}>
              <Text style={styles.label}>Genel Bakış</Text>
              <Text style={styles.title}>Shadow Creator Paneli</Text>
              <Text style={styles.subtitle}>
                Shadow mode gelirlerini, canlı odaları ve DM deneyimini tek ekrandan yönetin.
              </Text>
            </View>

            <View
              style={[
                styles.statsRow,
                stackStats && styles.statsRowStack,
                wrapStats && styles.statsRowWrap
              ]}
            >
              {insights.map((item) => (
                <View key={item.label} style={styles.statWrapper}>
                  <StatCard label={item.label} value={item.value} />
                  <Text style={styles.statTrend}>{item.trend}</Text>
                </View>
              ))}
            </View>

            <ImageBackground
              source={{ uri: heroCard.background }}
              style={[styles.heroCard, { borderRadius: cardRadius, height: stackStats ? 200 : 240 }]}
              imageStyle={[styles.heroImage, { borderRadius: cardRadius }]}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{heroCard.title}</Text>
                <Text style={styles.heroDescription}>{heroCard.description}</Text>
                <Button label={heroCard.cta} onPress={() => {}} style={styles.heroButton} />
              </View>
            </ImageBackground>

            <View style={[styles.section, { gap: layout.sectionGap * 0.4 }]}>
              <Text style={styles.sectionTitle}>Hızlı Aksiyonlar</Text>
              <Text style={styles.sectionSubtitle}>Sık kullanılan akışları bir dokunuşla başlat.</Text>
              <View
                style={[
                  styles.quickActions,
                  stackQuick && styles.quickActionsStack,
                  wrapQuick && styles.quickActionsWrap
                ]}
              >
                {quickActions.map((action) => (
                  <View key={action.label} style={[styles.quickCard, { borderRadius: cardRadius - 4 }]}>
                    <Text style={styles.quickLabel}>{action.label}</Text>
                    <Text style={styles.quickDetail}>{action.detail}</Text>
                    <Text style={styles.quickTodo}>
                      TODO: implement {action.label.toLowerCase()} flow.
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.section, { gap: layout.sectionGap * 0.45 }]}>
              <Text style={styles.sectionTitle}>Trend Creator'lar</Text>
              <FlatList
                horizontal
                data={creators}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.creatorsList, isWide ? { paddingBottom: 4 } : null]}
                renderItem={({ item }) => (
                  <View style={[styles.creatorCard, { borderColor: item.tone, borderRadius: cardRadius - 2 }]}>
                    <Text style={styles.creatorName}>{item.name}</Text>
                    <Text style={styles.creatorMetric}>{item.metric}</Text>
                    <Text style={styles.creatorHint}>TODO: canlı ön izleme mini player.</Text>
                  </View>
                )}
              />
            </View>
          </>
        );
      }}
    </PageScreen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      gap: 8
    },
    label: {
      color: colors.textSecondary,
      textTransform: "uppercase",
      fontSize: 12
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary
    },
    subtitle: {
      color: colors.textSecondary,
      lineHeight: 20
    },
    statsRow: {
      flexDirection: "row",
      gap: 16
    },
    statsRowStack: {
      flexDirection: "column"
    },
    statsRowWrap: {
      flexWrap: "wrap"
    },
    statWrapper: {
      flex: 1,
      gap: 6
    },
    statTrend: {
      color: colors.success,
      fontSize: 12
    },
    heroCard: {
      overflow: "hidden",
      height: 220
    },
    heroImage: {
      borderRadius: 24
    },
    heroContent: {
      flex: 1,
      backgroundColor: colors.heroOverlay,
      padding: 20,
      justifyContent: "space-between"
    },
    heroTitle: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: "700"
    },
    heroDescription: {
      color: colors.textSecondary,
      fontSize: 16
    },
    heroButton: {
      width: "100%"
    },
    section: {
      gap: 8
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary
    },
    sectionSubtitle: {
      color: colors.textSecondary
    },
    quickActions: {
      flexDirection: "row",
      gap: 12
    },
    quickActionsStack: {
      flexDirection: "column"
    },
    quickActionsWrap: {
      flexWrap: "wrap"
    },
    quickCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      padding: 16,
      backgroundColor: colors.surfaceAlt,
      gap: 6
    },
    quickLabel: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 16
    },
    quickDetail: {
      color: colors.textSecondary
    },
    quickTodo: {
      color: colors.warning,
      fontSize: 12,
      marginTop: 10
    },
    creatorsList: {
      gap: 16
    },
    creatorCard: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 18,
      width: 220,
      backgroundColor: colors.surface,
      gap: 10
    },
    creatorName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "600"
    },
    creatorMetric: {
      color: colors.highlight
    },
    creatorHint: {
      color: colors.warning,
      fontSize: 12
    }
  });
