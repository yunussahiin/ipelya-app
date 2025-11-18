import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  useColorScheme
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Moon,
  Eye,
  Heart,
  Sparkles,
  Headphones,
  Wand2,
  Users,
  DollarSign,
  PlusCircle,
  Zap,
  MapPin,
  ChevronDown
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/auth.store";
import { clearSession } from "@/services/secure-store.service";

const newsFeed = [
  {
    id: "1",
    tag: "Futbol",
    title: "Derbiye 24 saat kala ilk 11 netleşti",
    meta: "Canlı skor: 2-1"
  },
  { id: "2", tag: "Ekonomi", title: "Kripto piyasasında %8 yeşil kapanış", meta: "BTC 72.4K" },
  {
    id: "3",
    tag: "Teknoloji",
    title: "Vision Pro Türkiye lansman tarihi sızdı",
    meta: "30 Kas 2024"
  }
];

const interestCards = [
  { id: "f1", label: "Fantasy Basket", icon: "basketball" },
  { id: "f2", label: "Premier Lig", icon: "trophy" },
  { id: "f3", label: "Start-up Radar", icon: "flask" },
  { id: "f4", label: "Kripto Alarm", icon: "sparkles" }
];

const vibes = [
  { id: "v1", label: "Masum", color: ["#ffd3f3", "#ffa9d7"] },
  { id: "v2", label: "Dominant", color: ["#10142a", "#501437"] },
  { id: "v3", label: "Girl Next Door", color: ["#f2f4ff", "#c5d3ff"] },
  { id: "v4", label: "Romantik", color: ["#fff2da", "#ffb581"] },
  { id: "v5", label: "Gizemli", color: ["#140a1b", "#34244a"] }
];

const creators = [
  {
    id: "c1",
    name: "Ivy Sol",
    vibe: "Dominant",
    subscribers: "4.2K",
    online: true,
    price: "89₺"
  },
  { id: "c2", name: "Mia Loon", vibe: "Masum", subscribers: "2.9K", online: false, price: "59₺" },
  { id: "c3", name: "Rosa Vega", vibe: "Gizemli", subscribers: "5.8K", online: true, price: "99₺" }
];

const asmrMarket = [
  { id: "a1", title: "Bu gece trend", description: "Gece yarısı fısıltıları", price: "25 tp" },
  { id: "a2", title: "Roleplay sesleri", description: "Sanal sevgili modu", price: "35 tp" },
  { id: "a3", title: "Uyku ASMR", description: "Delta dalga paketleri", price: "18 tp" },
  { id: "a4", title: "Fantezi sesleri", description: "Dark romance", price: "42 tp" }
];

const aiFantasy = {
  title: "Bugünün Fantezi Paketi",
  description: "“Cyber Geisha” temalı 4 sahne, 12 ses, 3 AI görsel",
  avatar:
    "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=900&q=80",
  cost: "20 Sap Coin"
};

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 24
  },
  scrollContent: {
    gap: 32
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  locationLabel: {
    fontSize: 12,
    color: "#6a5061",
    textTransform: "uppercase",
    letterSpacing: 1.5
  },
  locationRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  },
  locationValue: {
    fontWeight: "600",
    color: "#2b1120"
  },
  balanceCard: {
    flex: 1,
    backgroundColor: "#2a0c23",
    padding: 14,
    borderRadius: 20
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12
  },
  balanceValue: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22
  },
  tokens: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  tokenDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.1)"
  },
  tokenPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.06)"
  },
  tokenValue: {
    color: "#2b1120",
    fontWeight: "600"
  },
  profileSwitch: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center"
  },
  profilePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.04)"
  },
  profilePillActive: {
    backgroundColor: "#2a0c23"
  },
  profilePillLabel: {
    fontWeight: "600",
    color: "#2a0c23"
  },
  profilePillLabelActive: {
    color: "#fff"
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  toggleLabel: {
    color: "#4b2d3f",
    fontWeight: "600"
  },
  toggle: {
    width: 80,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: 4,
    justifyContent: "center"
  },
  toggleActive: {
    backgroundColor: "#1e0c18"
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    transform: [{ translateX: 0 }]
  },
  toggleThumbActive: {
    transform: [{ translateX: 40 }]
  },
  section: {
    gap: 18
  },
  sectionHeader: {
    gap: 4
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#201424"
  },
  sectionSubtitle: {
    color: "#6a5062"
  },
  newsCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 8
  },
  newsTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(209,124,255,0.1)"
  },
  newsTagText: {
    color: "#d17cff",
    fontSize: 12,
    fontWeight: "700"
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a0d15"
  },
  newsMeta: {
    color: "#7a6572"
  },
  interestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)"
  },
  interestLabel: {
    fontWeight: "600",
    color: "#1d0c18"
  },
  vibeCard: {
    width: screenWidth * 0.55,
    borderRadius: 28,
    padding: 18,
    justifyContent: "space-between"
  },
  vibeLabel: {
    fontSize: 18,
    color: "#1c0b16",
    fontWeight: "700"
  },
  vibeButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)"
  },
  vibeButtonText: {
    color: "#201424",
    fontWeight: "700"
  },
  creatorHighlight: {
    width: screenWidth * 0.6,
    height: 220,
    borderRadius: 28,
    overflow: "hidden"
  },
  creatorHighlightImage: {
    borderRadius: 28
  },
  creatorHighlightContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 18,
    gap: 8
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  creatorHighlightName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    flex: 1
  },
  creatorStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  creatorHighlightVibe: {
    color: "rgba(255,255,255,0.8)"
  },
  creatorStatsRow: {
    flexDirection: "row",
    gap: 8
  },
  creatorStatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)"
  },
  creatorStatText: {
    color: "#fff",
    fontWeight: "600"
  },
  asmrGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  asmrCard: {
    flexBasis: "48%",
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(42,12,35,0.08)",
    borderWidth: 1,
    borderColor: "rgba(33,9,27,0.1)",
    gap: 6
  },
  asmrBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d569ff",
    alignItems: "center",
    justifyContent: "center"
  },
  asmrTitle: {
    fontWeight: "700",
    color: "#1b0814"
  },
  asmrDescription: {
    color: "#6b4d61"
  },
  asmrPriceRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  asmrPrice: {
    color: "#d569ff",
    fontWeight: "700"
  },
  creatorDashboardCard: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: "rgba(42,12,35,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    gap: 10
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a0b15"
  },
  dashboardBody: {
    color: "#664a5a",
    lineHeight: 20
  },
  dashboardButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2a0c23"
  },
  dashboardButtonText: {
    color: "#fff",
    fontWeight: "600"
  },
  aiCard: {
    height: 220,
    borderRadius: 30,
    overflow: "hidden"
  },
  aiImage: {
    borderRadius: 30
  },
  aiContent: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-end",
    gap: 10
  },
  aiTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700"
  },
  aiDescription: {
    color: "rgba(255,255,255,0.85)"
  },
  aiButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f8c7ff"
  },
  aiButtonText: {
    color: "#12070d",
    fontWeight: "700"
  },
  shadowCard: {
    borderRadius: 26,
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    gap: 10
  },
  shadowCardActive: {
    backgroundColor: "rgba(18,12,24,0.85)"
  },
  shadowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  shadowTitle: {
    fontWeight: "700",
    color: "#f8c7ff"
  },
  shadowDescription: {
    color: "#d7bed8"
  },
  shadowButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "rgba(248,199,255,0.2)"
  },
  shadowButtonText: {
    color: "#f8c7ff",
    fontWeight: "700"
  }
});

type SectionProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const Section = ({ title, subtitle, children }: SectionProps) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
    {children}
  </View>
);

const NewsCard = ({ tag, title, meta }: { tag: string; title: string; meta: string }) => (
  <View style={styles.newsCard}>
    <View style={styles.newsTag}>
      <Text style={styles.newsTagText}>{tag}</Text>
    </View>
    <Text style={styles.newsTitle}>{title}</Text>
    <Text style={styles.newsMeta}>{meta}</Text>
  </View>
);

const InterestChip = ({ label }: { label: string }) => (
  <Pressable style={styles.interestChip}>
    <Heart size={16} color="#201424" />
    <Text style={styles.interestLabel}>{label}</Text>
  </Pressable>
);

const VibeCard = ({ label, color }: { label: string; color: [string, string] }) => (
  <LinearGradient
    colors={color}
    style={styles.vibeCard}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <Text style={styles.vibeLabel}>{label}</Text>
    <View style={styles.vibeButton}>
      <Text style={styles.vibeButtonText}>Keşfet</Text>
    </View>
  </LinearGradient>
);

const CreatorCard = ({
  name,
  vibe,
  subscribers,
  online,
  price
}: {
  name: string;
  vibe: string;
  subscribers: string;
  online: boolean;
  price: string;
}) => (
  <ImageBackground
    source={{ uri: `https://source.unsplash.com/collection/94734566/400x600?${name}` }}
    style={styles.creatorHighlight}
    imageStyle={styles.creatorHighlightImage}
  >
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.65)"]}
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.creatorHighlightContent}>
      <View style={styles.creatorRow}>
        <Text style={styles.creatorHighlightName}>{name}</Text>
        <View
          style={[styles.creatorStatusDot, { backgroundColor: online ? "#31f27c" : "#d4d6de" }]}
        />
      </View>
      <Text style={styles.creatorHighlightVibe}>{vibe}</Text>
      <View style={styles.creatorStatsRow}>
        <View style={styles.creatorStatPill}>
          <Users size={14} color="#fff" />
          <Text style={styles.creatorStatText}>{subscribers}</Text>
        </View>
        <View style={styles.creatorStatPill}>
          <DollarSign size={14} color="#fff" />
          <Text style={styles.creatorStatText}>{price}</Text>
        </View>
      </View>
    </View>
  </ImageBackground>
);

const ASMRCard = ({
  title,
  description,
  price
}: {
  title: string;
  description: string;
  price: string;
}) => (
  <View style={styles.asmrCard}>
    <View style={styles.asmrBadge}>
      <Headphones size={16} color="#fff" />
    </View>
    <Text style={styles.asmrTitle}>{title}</Text>
    <Text style={styles.asmrDescription}>{description}</Text>
    <View style={styles.asmrPriceRow}>
      <Text style={styles.asmrPrice}>{price}</Text>
      <PlusCircle size={20} color="#d569ff" />
    </View>
  </View>
);

const AIFantasyCard = () => (
  <ImageBackground
    source={{ uri: aiFantasy.avatar }}
    style={styles.aiCard}
    imageStyle={styles.aiImage}
  >
    <LinearGradient
      colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.3)"]}
      style={StyleSheet.absoluteFillObject}
    />
    <View style={styles.aiContent}>
      <Text style={styles.aiTitle}>{aiFantasy.title}</Text>
      <Text style={styles.aiDescription}>{aiFantasy.description}</Text>
      <Pressable style={styles.aiButton}>
        <Text style={styles.aiButtonText}>{aiFantasy.cost}</Text>
        <Zap size={16} color="#12070d" />
      </Pressable>
    </View>
  </ImageBackground>
);

const ShadowModeCard = ({ active }: { active: boolean }) => (
  <View style={[styles.shadowCard, active && styles.shadowCardActive]}>
    <View style={styles.shadowHeader}>
      <Moon size={18} color="#f8c7ff" />
      <Text style={styles.shadowTitle}>Shadow Mode</Text>
    </View>
    <Text style={styles.shadowDescription}>
      {active
        ? "SS/record engeli aktif. AI içerikler ve fantezi odaları açıldı."
        : "Aktifleştirince haber akışı gizlenir, tamamen fantezi moduna geçersin."}
    </Text>
    <Pressable style={styles.shadowButton}>
      <Text style={styles.shadowButtonText}>
        {active ? "Shadow feed açık" : "Shadow feed'e geç"}
      </Text>
    </Pressable>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const [shadowMode, setShadowMode] = useState(false);
  const [profileType, setProfileType] = useState<"male" | "female">("male");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const userInfoColors = isDarkMode
    ? {
        cardBg: "rgba(244, 114, 182, 0.1)",
        border: "rgba(244, 114, 182, 0.2)",
        title: "#f472b6",
        buttonBorder: "rgba(244,114,182,0.4)",
        buttonText: "#f472b6",
        sectionLabel: "#c4b5fd",
        textPrimary: "#e2e8f0",
        textSecondary: "#94a3b8",
        divider: "rgba(255,255,255,0.12)"
      }
    : {
        cardBg: "rgba(244, 114, 182, 0.08)",
        border: "rgba(244, 114, 182, 0.45)",
        title: "#b83280",
        buttonBorder: "rgba(184,50,128,0.35)",
        buttonText: "#b83280",
        sectionLabel: "#7c3aed",
        textPrimary: "#1f2933",
        textSecondary: "#475467",
        divider: "rgba(15,23,42,0.08)"
      };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await clearSession();
      useAuthStore.getState().clearSession();
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setUser(userData.user);

        // Profile bilgilerini çek
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("type", "real")
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);
        setLoading(false);
      } catch (err) {
        console.error("User/Profile fetch error:", err);
        // Auth hatası varsa (kullanıcı silinmiş/geçersiz token/profile yok), logout yap
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        const isAuthError =
          errorMessage.includes("does not exist") ||
          errorMessage.includes("Auth session missing") ||
          errorMessage.includes("PGRST116");

        if (isAuthError) {
          try {
            await supabase.auth.signOut();
            await clearSession();
            useAuthStore.getState().clearSession();
          } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
          }
          router.replace("/(auth)/login");
        }
      }
    };

    fetchUserAndProfile();
  }, []);

  const handleTestExit = async () => {
    try {
      await supabase.auth.signOut();
      await clearSession();
      useAuthStore.getState().clearSession();
      router.replace("/(auth)/login");
    } catch (err) {
      console.error("Test exit error:", err);
    }
  };

  return (
    <PageScreen
      contentStyle={() => [
        styles.page,
        {
          paddingBottom: 0
        }
      ]}
    >
      {({ layout }) => (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: layout.insets.bottom + 60 }
          ]}
        >
          {user && profile && (
            <View
              style={{
                backgroundColor: userInfoColors.cardBg,
                padding: 16,
                borderRadius: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: userInfoColors.border
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12
                }}
              >
                <Text style={{ color: userInfoColors.title, fontWeight: "700", fontSize: 18 }}>
                  ✓ Kullanıcı Bilgileri
                </Text>
                <Pressable
                  onPress={handleTestExit}
                  style={{
                    borderWidth: 1,
                    borderColor: userInfoColors.buttonBorder,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999
                  }}
                >
                  <Text
                    style={{ color: userInfoColors.buttonText, fontWeight: "600", fontSize: 12 }}
                  >
                    Test Exit
                  </Text>
                </Pressable>
              </View>

              {/* Auth User Data */}
              <View
                style={{
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: userInfoColors.divider
                }}
              >
                <Text
                  style={{
                    color: userInfoColors.sectionLabel,
                    fontWeight: "600",
                    fontSize: 13,
                    marginBottom: 6
                  }}
                >
                  AUTH DATA
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>User ID:</Text> {user.id}
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Email:</Text> {user.email}
                </Text>
                <Text style={{ color: userInfoColors.textSecondary, fontSize: 12 }}>
                  Kayıt: {new Date(user.created_at).toLocaleString("tr-TR")}
                </Text>
              </View>

              {/* Profile Data */}
              <View
                style={{
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: userInfoColors.divider
                }}
              >
                <Text
                  style={{
                    color: userInfoColors.sectionLabel,
                    fontWeight: "600",
                    fontSize: 13,
                    marginBottom: 6
                  }}
                >
                  PROFILE DATA
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Profile ID:</Text> {profile.id}
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Username:</Text> {profile.username}
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Display Name:</Text> {profile.display_name}
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Type:</Text> {profile.type}
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Role:</Text> {profile.role || "user"}
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Gender:</Text> {profile.gender}
                </Text>
                <Text style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}>
                  <Text style={{ fontWeight: "600" }}>Creator:</Text>{" "}
                  {profile.is_creator ? "Evet" : "Hayır"}
                </Text>
              </View>

              {/* Contact & Verification */}
              <View
                style={{
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: userInfoColors.divider
                }}
              >
                <Text
                  style={{
                    color: userInfoColors.sectionLabel,
                    fontWeight: "600",
                    fontSize: 13,
                    marginBottom: 6
                  }}
                >
                  CONTACT & VERIFICATION
                </Text>
                {profile.email && (
                  <Text
                    style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                  >
                    <Text style={{ fontWeight: "600" }}>Email:</Text> {profile.email}
                  </Text>
                )}
                {profile.email_confirmed_at && (
                  <Text
                    style={{ color: userInfoColors.textSecondary, fontSize: 12, marginBottom: 3 }}
                  >
                    Email Doğrulama: {new Date(profile.email_confirmed_at).toLocaleString("tr-TR")}
                  </Text>
                )}
                {profile.phone && (
                  <Text
                    style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                  >
                    <Text style={{ fontWeight: "600" }}>Telefon:</Text> {profile.phone}
                  </Text>
                )}
                {profile.phone_confirmed_at && (
                  <Text
                    style={{ color: userInfoColors.textSecondary, fontSize: 12, marginBottom: 3 }}
                  >
                    Telefon Doğrulama:{" "}
                    {new Date(profile.phone_confirmed_at).toLocaleString("tr-TR")}
                  </Text>
                )}
                {profile.last_ip_address && (
                  <Text style={{ color: userInfoColors.textSecondary, fontSize: 12 }}>
                    Son IP: {profile.last_ip_address}
                  </Text>
                )}
              </View>

              {/* Bio & Avatar */}
              {(profile.bio || profile.avatar_url) && (
                <View
                  style={{
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: userInfoColors.divider
                  }}
                >
                  <Text
                    style={{
                      color: userInfoColors.sectionLabel,
                      fontWeight: "600",
                      fontSize: 13,
                      marginBottom: 6
                    }}
                  >
                    PROFILE CONTENT
                  </Text>
                  {profile.avatar_url && (
                    <Text
                      style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                    >
                      <Text style={{ fontWeight: "600" }}>Avatar URL:</Text>
                    </Text>
                  )}
                  {profile.avatar_url && (
                    <Text
                      style={{ color: userInfoColors.textSecondary, fontSize: 11, marginBottom: 6 }}
                    >
                      {profile.avatar_url.substring(0, 60)}...
                    </Text>
                  )}
                  {profile.bio && (
                    <Text
                      style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                    >
                      <Text style={{ fontWeight: "600" }}>Bio:</Text>
                    </Text>
                  )}
                  {profile.bio && (
                    <Text style={{ color: userInfoColors.textSecondary, fontSize: 12 }}>
                      {profile.bio}
                    </Text>
                  )}
                </View>
              )}

              {/* Shadow Mode & Security */}
              {(profile.shadow_unlocked !== undefined || profile.banned_until) && (
                <View
                  style={{
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: userInfoColors.divider
                  }}
                >
                  <Text
                    style={{
                      color: userInfoColors.sectionLabel,
                      fontWeight: "600",
                      fontSize: 13,
                      marginBottom: 6
                    }}
                  >
                    SECURITY & STATUS
                  </Text>
                  {profile.shadow_unlocked !== undefined && (
                    <Text
                      style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                    >
                      <Text style={{ fontWeight: "600" }}>Shadow Mode:</Text>{" "}
                      {profile.shadow_unlocked ? "Açık" : "Kapalı"}
                    </Text>
                  )}
                  {profile.banned_until && (
                    <Text style={{ color: "#ef4444", fontSize: 13, marginBottom: 3 }}>
                      <Text style={{ fontWeight: "600" }}>Yasaklı Hasta:</Text>{" "}
                      {new Date(profile.banned_until).toLocaleString("tr-TR")}
                    </Text>
                  )}
                  {profile.is_super_admin && (
                    <Text
                      style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                    >
                      <Text style={{ fontWeight: "600" }}>Super Admin:</Text> Evet
                    </Text>
                  )}
                  {profile.is_sso_user && (
                    <Text
                      style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                    >
                      <Text style={{ fontWeight: "600" }}>SSO Kullanıcı:</Text> Evet
                    </Text>
                  )}
                  {profile.is_anonymous && (
                    <Text style={{ color: userInfoColors.textPrimary, fontSize: 13 }}>
                      <Text style={{ fontWeight: "600" }}>Anonim:</Text> Evet
                    </Text>
                  )}
                </View>
              )}

              {/* Device Info */}
              {profile.last_device_info && (
                <View
                  style={{
                    marginBottom: 12,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: userInfoColors.divider
                  }}
                >
                  <Text
                    style={{
                      color: userInfoColors.sectionLabel,
                      fontWeight: "600",
                      fontSize: 13,
                      marginBottom: 6
                    }}
                  >
                    DEVICE INFO
                  </Text>
                  <Text
                    style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                  >
                    <Text style={{ fontWeight: "600" }}>Platform:</Text>{" "}
                    {profile.last_device_info.platform}
                  </Text>
                  <Text
                    style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                  >
                    <Text style={{ fontWeight: "600" }}>Model:</Text>{" "}
                    {profile.last_device_info.model}
                  </Text>
                  <Text
                    style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                  >
                    <Text style={{ fontWeight: "600" }}>OS Version:</Text>{" "}
                    {profile.last_device_info.os_version}
                  </Text>
                  <Text
                    style={{ color: userInfoColors.textPrimary, fontSize: 13, marginBottom: 3 }}
                  >
                    <Text style={{ fontWeight: "600" }}>App Version:</Text>{" "}
                    {profile.last_device_info.app_version}
                  </Text>
                  <Text style={{ color: userInfoColors.textSecondary, fontSize: 12 }}>
                    Son Giriş: {new Date(profile.last_login_at).toLocaleString("tr-TR")}
                  </Text>
                </View>
              )}

              {/* Timestamps */}
              <View>
                <Text
                  style={{
                    color: userInfoColors.sectionLabel,
                    fontWeight: "600",
                    fontSize: 13,
                    marginBottom: 6
                  }}
                >
                  TIMESTAMPS
                </Text>
                <Text
                  style={{ color: userInfoColors.textSecondary, fontSize: 12, marginBottom: 2 }}
                >
                  Profile Created: {new Date(profile.created_at).toLocaleString("tr-TR")}
                </Text>
                <Text style={{ color: userInfoColors.textSecondary, fontSize: 12 }}>
                  Updated: {new Date(profile.updated_at).toLocaleString("tr-TR")}
                </Text>
              </View>
            </View>
          )}
          <View style={styles.header}>
            <View>
              <Text style={styles.locationLabel}>Lokasyon</Text>
              <Pressable style={styles.locationRow}>
                <MapPin size={16} color="#351829" />
                <Text style={styles.locationValue}>İstanbul, TR</Text>
                <ChevronDown size={14} color="#351829" />
              </Pressable>
            </View>
            <Pressable style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Sap Coin</Text>
              <Text style={styles.balanceValue}>820</Text>
            </Pressable>
            <View style={styles.tokens}>
              <View style={styles.tokenDivider} />
              {[100, 300, 500].map((amount) => (
                <Pressable key={amount} style={styles.tokenPill}>
                  <Text style={styles.tokenValue}>{amount} tp</Text>
                </Pressable>
              ))}
              <View style={styles.tokenDivider} />
            </View>
          </View>
          <View style={styles.profileSwitch}>
            {(["male", "female"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setProfileType(type)}
                style={[styles.profilePill, profileType === type && styles.profilePillActive]}
              >
                <Text
                  style={[
                    styles.profilePillLabel,
                    profileType === type && styles.profilePillLabelActive
                  ]}
                >
                  {type === "male" ? "Erkek kullanıcı" : "Creator (Kadın)"}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Shadow feed</Text>
            <Pressable
              style={[styles.toggle, shadowMode && styles.toggleActive]}
              onPress={() => setShadowMode((prev) => !prev)}
            >
              <View style={[styles.toggleThumb, shadowMode && styles.toggleThumbActive]} />
            </Pressable>
            <Text style={styles.toggleLabel}>Real feed</Text>
          </View>

          {profileType === "male" && !shadowMode && (
            <>
              <Section title="Haber & İlgi Akışı" subtitle="Her sabah dopamine dokun.">
                <FlatList
                  data={newsFeed}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <NewsCard {...item} />}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
                />
                <View style={styles.interestRow}>
                  {interestCards.map((card) => (
                    <InterestChip key={card.id} {...card} />
                  ))}
                </View>
              </Section>

              <Section title="Trend Vibe Match" subtitle="Bugün yükselen enerjiler">
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={vibes}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <VibeCard {...item} />}
                  ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
                />
              </Section>
            </>
          )}

          {profileType === "male" ? (
            <Section title="Creator Highlight" subtitle="Bugün popüler olanlar">
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={creators}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <CreatorCard {...item} />}
                ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
              />
            </Section>
          ) : (
            <Section title="Creator Dashboard" subtitle="Gelir + içerik + öneri tek ekranda">
              <View style={styles.creatorDashboardCard}>
                <Text style={styles.dashboardTitle}>Creator paneli henüz geliştirilmedi</Text>
                <Text style={styles.dashboardBody}>
                  Blueprint: Bugünkü kazanç, abone sayısı, PPV satışları, AI içerik önerisi, vibe
                  önerileri ve hızlı içerik yükleme kısayolları burada gösterilecek.
                </Text>
                <Pressable style={styles.dashboardButton}>
                  <Text style={styles.dashboardButtonText}>Planı görüntüle</Text>
                </Pressable>
              </View>
            </Section>
          )}

          {profileType === "male" && !shadowMode && (
            <Section title="ASMR / Audio Fantasy" subtitle="Yüksek dönüşümlü paketler">
              <View style={styles.asmrGrid}>
                {asmrMarket.map((item) => (
                  <ASMRCard key={item.id} {...item} />
                ))}
              </View>
            </Section>
          )}

          {profileType === "male" && (
            <Section title="AI Fantasy Generator" subtitle="Para basan killer feature">
              <AIFantasyCard />
            </Section>
          )}

          <Section
            title="Shadow Mode"
            subtitle="Aktifleştirince tamamen farklı bir home layout açılır"
          >
            <ShadowModeCard active={shadowMode} />
          </Section>
        </ScrollView>
      )}
    </PageScreen>
  );
}
