import { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { PageScreen } from "@/components/layout/PageScreen";
import { useTheme, type ThemeColors } from "@/theme/ThemeProvider";

const recentMatches = [
  { id: "likes", type: "likes", count: 32 },
  {
    id: "defne",
    name: "Defne",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80",
    profileId: "defne"
  },
  {
    id: "kerem",
    name: "Kerem",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    profileId: "kerem"
  },
  {
    id: "melis",
    name: "Melis",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    profileId: "melis"
  },
  {
    id: "arda",
    name: "Arda",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    profileId: "arda"
  }
];

const chatThreads = [
  {
    id: "defne",
    name: "Defne Yalçın",
    preview: "Yeni sergiye birlikte gidelim mi?",
    time: "09:18",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=300&q=80",
    unread: false
  },
  {
    id: "melis",
    name: "Melis Aydar",
    preview: "Az önce yeni şarkıyı attım 🎧",
    time: "12:44",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    unread: true
  },
  {
    id: "arda",
    name: "Arda Soy",
    preview: "Bodrum planı hala geçerliyse yazarım.",
    time: "08:06",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
    unread: true
  },
  {
    id: "naz",
    name: "Naz Koral",
    preview: "Senelerdir tuttuğun playlisti merak ediyorum.",
    time: "09:32",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80",
    unread: false
  },
  {
    id: "can",
    name: "Can Demir",
    preview: "Akşam sahilde yürüyüşe çıkar mıyız?",
    time: "10:21",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
    unread: false
  }
];

export default function ChatListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const openChat = (targetId: string | undefined) => {
    if (!targetId) return;
    router.push({
      pathname: "/(chat)/[id]",
      params: { id: targetId }
    });
  };

  return (
    <PageScreen
      contentStyle={(layout) => [
        styles.content,
        {
          paddingTop: 0,
          paddingBottom: Math.max(layout.bottomPadding + 24, 72),
          paddingHorizontal: 0
        }
      ]}
    >
      {({ layout }) => {
        const horizontal = Math.max(layout.contentPaddingHorizontal, 20);
        const heroPaddingTop = layout.topPadding + 4;

        return (
          <>
            <LinearGradient
              colors={[colors.accent, colors.highlight, colors.accentSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { paddingTop: heroPaddingTop, paddingHorizontal: horizontal }]}
            >
              <View style={styles.topRow}>
                <Pressable style={styles.roundButton} onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={22} color="#fff" />
                </Pressable>
                <View>
                  <Text style={styles.heroKicker}>Mesaj Kutusu</Text>
                  <Text style={styles.heroTitle}>Mesajlar</Text>
                </View>
                <Pressable style={styles.roundButton}>
                  <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.matchesHeader}>
                <Text style={styles.sectionLabel}>Son eşleşmeler</Text>
                <Pressable style={styles.glassButton}>
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={styles.glassButtonText}>Ara</Text>
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchesRow}>
                {recentMatches.map((match) =>
                  match.type === "likes" ? (
                    <View key={match.id} style={[styles.matchCard, styles.likesCard]}>
                      <Ionicons name="heart" size={26} color="#fff" />
                      <Text style={styles.likesCount}>{match.count}</Text>
                      <Text style={styles.likesLabel}>Beğeniler</Text>
                    </View>
                  ) : (
                    <Pressable key={match.id} style={styles.matchCard} onPress={() => openChat(match.profileId)}>
                      <Image source={{ uri: match.avatar }} style={styles.matchAvatar} />
                      <Text numberOfLines={1} style={styles.matchName}>
                        {match.name}
                      </Text>
                    </Pressable>
                  )
                )}
              </ScrollView>
            </LinearGradient>

            <View style={[styles.messagesCard, { paddingHorizontal: horizontal }]}>
              {chatThreads.map((thread, index) => (
                <Pressable
                  key={thread.id}
                  onPress={() => openChat(thread.id)}
                  style={[styles.chatRow, index !== chatThreads.length - 1 ? styles.chatRowDivider : null]}
                >
                  <Image source={{ uri: thread.avatar }} style={styles.chatAvatar} />
                  <View style={styles.chatText}>
                    <Text style={styles.chatName}>{thread.name}</Text>
                    <Text numberOfLines={1} style={styles.chatPreview}>
                      {thread.preview}
                    </Text>
                  </View>
                  <View style={styles.chatMeta}>
                    <Text style={styles.chatTime}>{thread.time}</Text>
                    {thread.unread ? <View style={styles.unreadDot} /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        );
      }}
    </PageScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      gap: 20,
      backgroundColor: colors.background
    },
    hero: {
      paddingBottom: 24,
      paddingHorizontal: 20,
      paddingTop: 20,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
      gap: 18
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    roundButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center"
    },
    heroKicker: {
      color: "rgba(255,255,255,0.72)",
      textTransform: "uppercase",
      fontSize: 12,
      letterSpacing: 1.4
    },
    heroTitle: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "700",
      marginTop: 4
    },
    matchesHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    sectionLabel: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 16,
      fontWeight: "600"
    },
    glassButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.14)"
    },
    glassButtonText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 13
    },
    matchesRow: {
      gap: 18,
      paddingRight: 6
    },
    matchCard: {
      width: 86,
      alignItems: "center",
      gap: 10
    },
    likesCard: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 26,
      paddingVertical: 14
    },
    likesCount: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 18
    },
    likesLabel: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 12
    },
    matchAvatar: {
      width: 74,
      height: 74,
      borderRadius: 26
    },
    matchName: {
      color: "#fde8ff",
      fontSize: 13,
      fontWeight: "600"
    },
    messagesCard: {
      backgroundColor: colors.surface,
      borderRadius: 32,
      paddingHorizontal: 0,
      paddingVertical: 4,
      shadowColor: colors.navShadow,
      shadowOpacity: 0.16,
      shadowOffset: { width: 0, height: 14 },
      shadowRadius: 28,
      elevation: 5,
      width: "100%",
      marginTop: -12
    },
    chatRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 12,
      gap: 16
    },
    chatRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderMuted
    },
    chatAvatar: {
      width: 56,
      height: 56,
      borderRadius: 24
    },
    chatText: {
      flex: 1
    },
    chatName: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary
    },
    chatPreview: {
      marginTop: 4,
      color: colors.textSecondary
    },
    chatMeta: {
      alignItems: "flex-end",
      gap: 12
    },
    chatTime: {
      color: colors.textMuted,
      fontWeight: "600"
    },
    unreadDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent
    }
  });
}
