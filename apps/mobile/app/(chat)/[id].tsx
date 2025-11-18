import { useMemo, useState } from "react";
import {
  FlatList,
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

const quickActions: { id: string; label: string; icon: IconName; subtitle: string }[] = [
  { id: "coins", label: "20 tp gönder", icon: "flash", subtitle: "Hızlı destek" },
  { id: "voice", label: "Sesli not aç", icon: "mic-outline", subtitle: "Sesli kayda geç" },
  { id: "gift", label: "Sürpriz gönder", icon: "gift-outline", subtitle: "Mini hediye kutusu" }
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
  const [inputText, setInputText] = useState("");
  const [showActions, setShowActions] = useState(false);
  const bubbleMaxWidth = layout.isTablet ? "65%" : "75%";

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.from === "system") {
      return (
        <View style={styles.systemRow}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.from === "me";
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && <Image source={{ uri: profile.avatar }} style={styles.messageAvatar} />}
        <View style={[styles.bubbleWrapper, { maxWidth: bubbleMaxWidth }]}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
            <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.text}</Text>
          </View>
          {item.time && (
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{item.time}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Image source={{ uri: profile.avatar }} style={styles.headerAvatar} />
          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.textPrimary }]}>{profile.name}</Text>
            <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
              {profile.response}
            </Text>
          </View>
          <Pressable style={styles.headerAction}>
            <Ionicons name="call-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.headerAction}>
            <Ionicons name="videocam-outline" size={24} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.headerAction} onPress={() => setShowActions((prev) => !prev)}>
            <Ionicons
              name={showActions ? "close" : "ellipsis-horizontal"}
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>
        </View>
        {showActions ? (
          <View
            style={[
              styles.actionsCard,
              { borderColor: colors.border, backgroundColor: colors.surface }
            ]}
          >
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={styles.actionRow}
                onPress={() => setShowActions(false)}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name={action.icon} size={18} color={colors.accent} />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                    {action.label}
                  </Text>
                  <Text style={[styles.actionHint, { color: colors.textSecondary }]}>
                    {action.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Messages */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            data={profile.messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.messagesList,
              {
                paddingHorizontal: layout.contentPaddingHorizontal
              }
            ]}
            ListFooterComponent={<View style={{ height: layout.sectionGap }} />}
            showsVerticalScrollIndicator={false}
            inverted={false}
          />

          {/* Input Bar */}
          <View
            style={[
              styles.inputContainer,
              {
                paddingHorizontal: layout.contentPaddingHorizontal,
                paddingBottom: layout.bottomPadding,
                borderTopColor: colors.border
              }
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promptRow}
            >
              {smartPrompts.map((prompt) => (
                <Pressable
                  key={prompt}
                  style={[styles.promptChip, { backgroundColor: colors.surface }]}
                >
                  <Ionicons name="flash" size={14} color={colors.accent} />
                  <Text style={[styles.promptText, { color: colors.textPrimary }]}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.inputRow}>
              <Pressable style={[styles.attachButton, { backgroundColor: colors.surface }]}>
                <Ionicons name="add" size={24} color={colors.textSecondary} />
              </Pressable>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface }]}>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Mesaj yaz..."
                  placeholderTextColor={colors.textMuted}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
                <Pressable style={styles.emojiButton}>
                  <Ionicons name="happy-outline" size={22} color={colors.textSecondary} />
                </Pressable>
              </View>
              <Pressable
                style={[
                  styles.sendButton,
                  { backgroundColor: inputText.trim() ? colors.accent : colors.surfaceAlt }
                ]}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: {
      flex: 1
    },
    container: {
      flex: 1
    },
    flex: {
      flex: 1
    },
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      backgroundColor: colors.background
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      marginRight: -4
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20
    },
    headerInfo: {
      flex: 1
    },
    headerName: {
      fontSize: 16,
      fontWeight: "600"
    },
    headerStatus: {
      fontSize: 12,
      marginTop: 2
    },
    headerAction: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center"
    },
    actionsCard: {
      marginHorizontal: 16,
      marginTop: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 20,
      paddingVertical: 8
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 12
    },
    actionIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center"
    },
    actionInfo: {
      flex: 1
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: "600"
    },
    actionHint: {
      fontSize: 12,
      marginTop: 2
    },
    // Messages
    messagesList: {
      paddingVertical: 16,
      gap: 12
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 4
    },
    messageRowMe: {
      flexDirection: "row-reverse"
    },
    messageAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16
    },
    bubbleWrapper: {
      gap: 4
    },
    bubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10
    },
    bubbleMe: {
      backgroundColor: colors.accent,
      borderBottomRightRadius: 4
    },
    bubbleThem: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4
    },
    messageText: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.textPrimary
    },
    messageTextMe: {
      color: "#fff"
    },
    messageTime: {
      fontSize: 11,
      color: colors.textMuted,
      paddingHorizontal: 4
    },
    messageTimeMe: {
      textAlign: "right"
    },
    systemRow: {
      alignItems: "center",
      marginVertical: 8
    },
    systemText: {
      fontSize: 12,
      color: colors.textMuted,
      backgroundColor: colors.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12
    },
    // Input
    inputContainer: {
      gap: 10,
      paddingTop: 12,
      backgroundColor: colors.background,
      borderTopWidth: StyleSheet.hairlineWidth
    },
    promptRow: {
      gap: 10,
      paddingVertical: 4
    },
    promptChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border
    },
    promptText: {
      fontSize: 13,
      fontWeight: "600"
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8
    },
    attachButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center"
    },
    inputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-end",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 40,
      maxHeight: 100
    },
    input: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      paddingVertical: 2
    },
    emojiButton: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center"
    }
  });
}
