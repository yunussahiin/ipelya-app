import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, StyleSheet, ImageBackground, FlatList } from "react-native";
import { StatCard } from "@/components/cards/StatCard";
import { Button } from "@/components/ui/Button";

const heroCard = {
  title: "Yaratıcı Modu",
  description: "Shadow feed'de 3 içerik yayına hazır.",
  cta: "Shadow Mode'u Başlat",
  background:
    "https://images.unsplash.com/photo-1529152392272-5e8e7830b6ce?auto=format&fit=crop&w=800&q=60"
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
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.label}>Genel Bakış</Text>
          <Text style={styles.title}>Shadow Creator Paneli</Text>
          <Text style={styles.subtitle}>
            Shadow mode gelirlerini, canlı odaları ve DM deneyimini tek ekrandan yönetin.
          </Text>
        </View>

        <View style={styles.statsRow}>
          {insights.map((item) => (
            <View key={item.label} style={styles.statWrapper}>
              <StatCard label={item.label} value={item.value} />
              <Text style={styles.statTrend}>{item.trend}</Text>
            </View>
          ))}
        </View>

        <ImageBackground source={{ uri: heroCard.background }} style={styles.heroCard} imageStyle={styles.heroImage}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{heroCard.title}</Text>
            <Text style={styles.heroDescription}>{heroCard.description}</Text>
            <Button label={heroCard.cta} onPress={() => {}} style={styles.heroButton} />
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı Aksiyonlar</Text>
          <Text style={styles.sectionSubtitle}>Sık kullanılan akışları bir dokunuşla başlat.</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <View key={action.label} style={styles.quickCard}>
                <Text style={styles.quickLabel}>{action.label}</Text>
                <Text style={styles.quickDetail}>{action.detail}</Text>
                <Text style={styles.quickTodo}>TODO: implement {action.label.toLowerCase()} flow.</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend Creator'lar</Text>
          <FlatList
            horizontal
            data={creators}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creatorsList}
            renderItem={({ item }) => (
              <View style={[styles.creatorCard, { borderColor: item.tone }]}>
                <Text style={styles.creatorName}>{item.name}</Text>
                <Text style={styles.creatorMetric}>{item.metric}</Text>
                <Text style={styles.creatorHint}>TODO: canlı ön izleme mini player.</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#050505"
  },
  scroll: {
    padding: 20,
    gap: 24
  },
  header: {
    gap: 8
  },
  label: {
    color: "#a1a1aa",
    textTransform: "uppercase",
    fontSize: 12
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff"
  },
  subtitle: {
    color: "#d4d4d8",
    lineHeight: 20
  },
  statsRow: {
    flexDirection: "row",
    gap: 16
  },
  statWrapper: {
    flex: 1,
    gap: 6
  },
  statTrend: {
    color: "#22c55e",
    fontSize: 12
  },
  heroCard: {
    borderRadius: 24,
    overflow: "hidden",
    height: 220
  },
  heroImage: {
    borderRadius: 24
  },
  heroContent: {
    flex: 1,
    backgroundColor: "rgba(5,5,5,0.55)",
    padding: 20,
    justifyContent: "space-between"
  },
  heroTitle: {
    color: "#f5f5f5",
    fontSize: 24,
    fontWeight: "700"
  },
  heroDescription: {
    color: "#d4d4d8",
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
    color: "#fff"
  },
  sectionSubtitle: {
    color: "#a1a1aa"
  },
  quickActions: {
    flexDirection: "row",
    gap: 12
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#262626",
    padding: 16,
    backgroundColor: "#111111",
    gap: 6
  },
  quickLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  },
  quickDetail: {
    color: "#a1a1aa"
  },
  quickTodo: {
    color: "#fbbf24",
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
    backgroundColor: "#0a0a0a",
    gap: 10
  },
  creatorName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600"
  },
  creatorMetric: {
    color: "#a78bfa"
  },
  creatorHint: {
    color: "#eab308",
    fontSize: 12
  }
});
