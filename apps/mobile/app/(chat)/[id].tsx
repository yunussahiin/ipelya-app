import { useMemo, useRef } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";
import { useDeviceLayout } from "@/hooks/useDeviceLayout";

type Message = {
  id: string;
  from: "me" | "them" | "system";
  text: string;
  time?: string;
};

type ChatProfile = {
  id: string;
  name: string;
  vibe: string;
  city: string;
  status: string;
  avatar: string;
  gradient: [string, string];
  rate: string;
  response: string;
  voiceTag: string;
  messages: Message[];
};

type ChatProfilePreset = Omit<ChatProfile, "messages">;
type IconName = keyof typeof Ionicons.glyphMap;

const quickActions: { id: string; label: string; icon: IconName }[] = [
  { id: "coins", label: "20 tp gönder", icon: "flash" },
  { id: "voice", label: "Sesli not aç", icon: "mic-outline" },
  { id: "gift", label: "Sürpriz gönder", icon: "gift-outline" }
];

const smartPrompts = ["AI foto iste", "Mini oyun daveti", "Konum paylaş", "Gizli mod aç"];

const profilePresets: Record<string, ChatProfilePreset> = {
  defne: {
    id: "defne",
    name: "Defne Yalçın",
    vibe: "Moda editörü",
    city: "İstanbul",
    status: "Yeni koleksiyon çekiminde",
    avatar:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=300&q=80",
    gradient: ["#932a5c", "#f472b6"],
    rate: "18 tp / dk",
    response: "🟢 50 sn cevap",
    voiceTag: "İpeksi alto"
  },
  kerem: {
    id: "kerem",
    name: "Kerem Ada",
    vibe: "Mimari hikaye anlatıcısı",
    city: "İzmir",
    status: "Yeni maket kuruyor",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    gradient: ["#1c1f3b", "#663f86"],
    rate: "14 tp / dk",
    response: "🟢 1 dk cevap",
    voiceTag: "Derin bariton"
  },
  melis: {
    id: "melis",
    name: "Melis Aydar",
    vibe: "Synth-pop vokali",
    city: "Ankara",
    status: "Stüdyoda kayıt açtı",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    gradient: ["#5b277a", "#d34ba5"],
    rate: "20 tp / dk",
    response: "🟢 45 sn cevap",
    voiceTag: "Kristal mezzo"
  },
  arda: {
    id: "arda",
    name: "Arda Soy",
    vibe: "Gezi vlogger'ı",
    city: "Antalya",
    status: "Çevrimiçi",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    gradient: ["#143a5a", "#297fb8"],
    rate: "16 tp / dk",
    response: "🟢 2 dk cevap",
    voiceTag: "Enerjik tenor"
  },
  naz: {
    id: "naz",
    name: "Naz Koral",
    vibe: "Konsept fotoğrafçı",
    city: "İzmir",
    status: "Yeni lens deniyor",
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
    gradient: ["#742673", "#f472b6"],
    rate: "21 tp / dk",
    response: "🟢 40 sn cevap",
    voiceTag: "Hafif chill"
  },
  can: {
    id: "can",
    name: "Can Demir",
    vibe: "Dijital nomad",
    city: "Bodrum",
    status: "Co-work mekanda",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
    gradient: ["#234142", "#44a08d"],
    rate: "15 tp / dk",
    response: "🟢 90 sn cevap",
    voiceTag: "Rahat bariton"
  },
  ece: {
    id: "ece",
    name: "Ece Soydan",
    vibe: "UX stratejisti",
    city: "Berlin",
    status: "Çevrimiçi",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    gradient: ["#40236b", "#9a348e"],
    rate: "19 tp / dk",
    response: "🟢 55 sn cevap",
    voiceTag: "Net soprano"
  },
  mert: {
    id: "mert",
    name: "Mert Kaya",
    vibe: "DJ & prodüktör",
    city: "Amsterdam",
    status: "After set molasında",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80",
    gradient: ["#1d3c61", "#3f6ac5"],
    rate: "17 tp / dk",
    response: "🟡 Yoğun modda",
    voiceTag: "Hipnotik vokal"
  },
  asya: {
    id: "asya",
    name: "Asya Erel",
    vibe: "AI hikaye yazarı",
    city: "İstanbul",
    status: "Yeni senaryo yazıyor",
    avatar:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80",
    gradient: ["#38206b", "#d946ef"],
    rate: "22 tp / dk",
    response: "🟢 30 sn cevap",
    voiceTag: "Yumuşak soprano"
  }
};

function createConversation(name: string): Message[] {
  return [
    {
      id: "m1",
      from: "them",
      text: `Selam, az önce hikayeni gördüm. ${name} versiyonunu görmek ister misin?`,
      time: "09:41"
    },
    {
      id: "m2",
      from: "me",
      text: "Ooo olur! Cyber vibe'ı artırıp ses filtrelerini de açalım mı?",
      time: "09:42"
    },
    {
      id: "m3",
      from: "them",
      text: "Tamamdır, sana iki farklı sahne kurayım. Hangisi daha çok hoşuna giderse oradan ilerleriz.",
      time: "09:43"
    },
    {
      id: "m4",
      from: "system",
      text: "20 tp coin gönderildi • AI filtre kilidi açıldı",
      time: "09:44"
    },
    {
      id: "m5",
      from: "me",
      text: "Bir de üzerine lo-fi sample eklersek gecelik paket hazır!",
      time: "09:44"
    },
    {
      id: "m6",
      from: "them",
      text: "Senin için canlı ses kayıt moduna geçtim, 2 dk içinde draft yolluyorum.",
      time: "09:44"
    }
  ];
}

const chatProfiles: Record<string, ChatProfile> = Object.entries(profilePresets).reduce(
  (acc, [key, preset]) => {
    acc[key] = { ...preset, messages: createConversation(preset.name) };
    return acc;
  },
  {} as Record<string, ChatProfile>
);

const fallbackProfile = chatProfiles.defne;

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const profile = id ? (chatProfiles[id] ?? fallbackProfile) : fallbackProfile;
  const { colors } = useTheme();
  const layout = useDeviceLayout();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroScale = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [1, 0.9],
    extrapolate: "clamp"
  });
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [0, -40],
    extrapolate: "clamp"
  });
  const heroRadius = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [32, 18],
    extrapolate: "clamp"
  });
  const AnimatedLinearGradient = useMemo(() => Animated.createAnimatedComponent(LinearGradient), []);
  const horizontal = Math.max(layout.contentPaddingHorizontal, 20);
  const heroPaddingTop = layout.topPadding;
  const keyboardOffset = layout.topPadding + 32;
  const bubbleMaxWidth = layout.isTablet ? "62%" : layout.isFold ? "70%" : "82%";
  const composerInset = layout.bottomPadding;
  const promptBarHeight = 58;
  const promptSpacing = 12;
  const composerHeight = 86;
  const composerSpacing = 16;
  const scrollBottomInset =
    promptBarHeight + promptSpacing + composerHeight + composerInset + composerSpacing;
  const heroAnimatedStyle = {
    transform: [{ translateY: heroTranslate }, { scale: heroScale }],
    borderBottomLeftRadius: heroRadius,
    borderBottomRightRadius: heroRadius
  };

  const renderMessage = (message: Message) => {
    if (message.from === "system") {
      return (
        <View key={message.id} style={styles.systemRow}>
          <Text style={styles.systemText}>{message.text}</Text>
        </View>
      );
    }

    const isMe = message.from === "me";
    return (
      <View key={message.id} style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe ? <Image source={{ uri: profile.avatar }} style={styles.messageAvatar} /> : null}
        <View style={[styles.bubbleWrapper, { maxWidth: bubbleMaxWidth }, isMe && styles.bubbleWrapperMe]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{message.text}</Text>
          </View>
          <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{message.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        <View style={styles.flex}>
          <Animated.ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: false
            })}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomInset }]}
          >
            <AnimatedLinearGradient
              colors={profile.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { paddingTop: heroPaddingTop, paddingHorizontal: horizontal }, heroAnimatedStyle]}
            >
              <View style={styles.heroBody}>
                <Pressable style={styles.heroBackButton} onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={18} color="#fff" />
                </Pressable>
                <View style={styles.avatarWrapper}>
                  <Image source={{ uri: profile.avatar }} style={styles.heroAvatar} />
                  <View style={styles.verifyBadge}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                </View>
                <View style={styles.heroInfo}>
                  <View style={styles.heroTitleRow}>
                    <Text style={styles.heroName}>{profile.name}</Text>
                  </View>
                  <Text style={styles.heroMeta}>
                    {profile.vibe} • {profile.city}
                  </Text>
                  <Text style={styles.heroStatus}>{profile.status}</Text>
                </View>
              </View>
              <View style={styles.heroStats}>
                <View>
                  <Text style={styles.statLabel}>Yanıt süresi</Text>
                  <Text style={styles.statValue}>{profile.response}</Text>
                </View>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles" size={14} color="#fff" />
                  <Text style={styles.heroBadgeText}>{profile.rate}</Text>
                </View>
                <View style={styles.statDivider} />
                <View>
                  <Text style={styles.statLabel}>Ses vibes</Text>
                  <Text style={styles.statValue}>{profile.voiceTag}</Text>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.heroQuickScroll}
                contentContainerStyle={[styles.heroQuickRow, { paddingHorizontal: horizontal }]}
              >
                {quickActions.map((action) => (
                  <Pressable key={action.id} style={styles.quickPill}>
                    <Ionicons name={action.icon} size={16} color="#fff" />
                    <Text style={styles.quickLabel}>{action.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </AnimatedLinearGradient>

            <View style={[styles.threadCard, { marginHorizontal: horizontal }]}>{profile.messages.map(renderMessage)}</View>
          </Animated.ScrollView>

          <View
            style={[
              styles.inputWrapper,
              {
                paddingHorizontal: horizontal,
                paddingBottom: composerInset,
                paddingTop: composerSpacing
              }
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.promptRow, { minHeight: promptBarHeight }]}
            >
              {smartPrompts.map((prompt) => (
                <Pressable key={prompt} style={styles.promptChip}>
                  <Ionicons name="flash" size={14} color={colors.accent} />
                  <Text style={styles.promptText}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={[styles.inputSection, { minHeight: composerHeight }]}>
              <Pressable style={styles.inputIcon}>
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </Pressable>
              <TextInput
                style={styles.textInput}
                placeholder="Mesajını yaz..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <Pressable style={styles.sendButton}>
                <Ionicons name="send" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1
    },
    flex: {
      flex: 1,
      backgroundColor: colors.background
    },
    scrollArea: {
      flex: 1
    },
    scrollContent: {
      gap: 14,
      flexGrow: 1
    },
    hero: {
      paddingBottom: 14,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      gap: 16
    },
    heroBody: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    heroBackButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
      backgroundColor: "rgba(0,0,0,0.18)",
      alignItems: "center",
      justifyContent: "center"
    },
    heroIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
      backgroundColor: "rgba(0,0,0,0.12)",
      alignItems: "center",
      justifyContent: "center"
    },
    avatarWrapper: {
      position: "relative"
    },
    heroAvatar: {
      width: 70,
      height: 70,
      borderRadius: 28
    },
    verifyBadge: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.surface
    },
    heroInfo: {
      flex: 1,
      gap: 4
    },
    heroTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10
    },
    heroName: {
      color: "#fff",
      fontSize: 24,
      fontWeight: "700"
    },
    heroMeta: {
      color: "rgba(255,255,255,0.75)"
    },
    heroStatus: {
      color: "#fef3c7",
      fontWeight: "700",
      marginTop: 4
    },
    heroBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 999,
      flexDirection: "row",
      gap: 6,
      alignItems: "center"
    },
    heroBadgeText: {
      color: "#fff",
      fontWeight: "600"
    },
    heroStats: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    statLabel: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 12
    },
    statValue: {
      color: "#fff",
      fontWeight: "600",
      marginTop: 6
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: "rgba(255,255,255,0.3)"
    },
    heroQuickScroll: {
      alignSelf: "stretch"
    },
    heroQuickRow: {
      paddingVertical: 8,
      gap: 10,
      flexGrow: 1,
      minWidth: "100%"
    },
    quickPill: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.18)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)"
    },
    quickLabel: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 13
    },
    threadCard: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      paddingHorizontal: 18,
      paddingVertical: 20,
      gap: 16,
      shadowColor: colors.navShadow,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 14 },
      elevation: 4,
      marginTop: -28
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10
    },
    messageRowMe: {
      justifyContent: "flex-end"
    },
    messageAvatar: {
      width: 34,
      height: 34,
      borderRadius: 14
    },
    bubbleWrapper: {},
    bubbleWrapperMe: {
      alignItems: "flex-end"
    },
    bubble: {
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12
    },
    bubbleMe: {
      backgroundColor: colors.accent
    },
    bubbleThem: {
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border
    },
    messageText: {
      color: colors.textPrimary
    },
    messageTextMe: {
      color: "#fff"
    },
    messageTime: {
      marginTop: 6,
      fontSize: 12,
      color: colors.textMuted
    },
    messageTimeMe: {
      textAlign: "right"
    },
    systemRow: {
      alignItems: "center"
    },
    systemText: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.surfaceAlt,
      fontSize: 12,
      color: colors.textMuted
    },
    promptRow: {
      paddingVertical: 6,
      gap: 10,
      marginBottom: 12
    },
    promptChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border
    },
    promptText: {
      color: colors.textPrimary,
      fontWeight: "600"
    },
    inputWrapper: {
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border
    },
    inputSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingTop: 12,
      paddingBottom: 16
    },
    inputIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface
    },
    textInput: {
      flex: 1,
      minHeight: 46,
      maxHeight: 120,
      borderRadius: 28,
      backgroundColor: colors.surface,
      paddingHorizontal: 18,
      paddingVertical: 12,
      color: colors.textPrimary
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4
    }
  });
}
