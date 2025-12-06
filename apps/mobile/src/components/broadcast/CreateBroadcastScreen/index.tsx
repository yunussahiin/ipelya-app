/**
 * CreateBroadcastScreen
 *
 * Amaç: Yeni yayın kanalı oluşturma ekranı
 * Tarih: 2025-11-26
 */

import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActionSheetIOS,
  Platform
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useTheme } from "@/theme/ThemeProvider";
import { useCreateBroadcastChannel } from "@/hooks/messaging";
import { supabase } from "@/lib/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import type { BroadcastAccessType } from "@ipelya/types";

// =============================================
// CONSTANTS
// =============================================

const ACCESS_TYPES: { value: BroadcastAccessType; label: string; icon: string }[] = [
  { value: "public", label: "Herkese Açık", icon: "globe-outline" },
  { value: "subscribers_only", label: "Sadece Aboneler", icon: "lock-closed-outline" },
  { value: "tier_specific", label: "Belirli Tier", icon: "star-outline" }
];

const DEFAULT_REACTIONS = ["❤️", "🔥", "👏", "😍", "🎉", "💯"];

// =============================================
// COMPONENT
// =============================================

export function CreateBroadcastScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<BroadcastAccessType>("public");
  const [selectedReactions, setSelectedReactions] = useState<string[]>(DEFAULT_REACTIONS);
  const [pollsEnabled, setPollsEnabled] = useState(true);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);

  const { mutate: createChannel, isPending } = useCreateBroadcastChannel();

  // Profil fotoğrafını al
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .eq("type", "real")
          .single();
        if (profile?.avatar_url) {
          setProfileAvatarUrl(profile.avatar_url);
        }
      }
    };
    fetchProfile();
  }, []);

  // Avatar seç - ActionSheet ile
  const handlePickAvatar = useCallback(() => {
    const options = profileAvatarUrl
      ? ["Galeriden Seç", "Profil Fotoğrafımı Kullan", "İptal"]
      : ["Galeriden Seç", "İptal"];
    const cancelIndex = profileAvatarUrl ? 2 : 1;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            // Galeriden seç
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8
            });
            if (!result.canceled && result.assets[0]) {
              setAvatarUri(result.assets[0].uri);
            }
          } else if (buttonIndex === 1 && profileAvatarUrl) {
            // Profil fotoğrafını kullan
            setAvatarUri(profileAvatarUrl);
          }
        }
      );
    } else {
      // Android için Alert kullan
      Alert.alert("Fotoğraf Seç", "", [
        {
          text: "Galeriden Seç",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8
            });
            if (!result.canceled && result.assets[0]) {
              setAvatarUri(result.assets[0].uri);
            }
          }
        },
        ...(profileAvatarUrl
          ? [
              {
                text: "Profil Fotoğrafımı Kullan",
                onPress: () => setAvatarUri(profileAvatarUrl)
              }
            ]
          : []),
        { text: "İptal", style: "cancel" as const }
      ]);
    }
  }, [profileAvatarUrl]);

  // Kanal oluştur
  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Kanal adı gerekli");
      return;
    }

    // Avatar'ı base64'e çevir (sadece local file ise)
    let avatarBase64: string | undefined;
    let avatarUrl: string | undefined;

    if (avatarUri) {
      if (avatarUri.startsWith("http")) {
        // Profil fotoğrafı URL'i - direkt kullan
        avatarUrl = avatarUri;
      } else {
        // Local file - base64'e çevir
        try {
          const base64 = await FileSystem.readAsStringAsync(avatarUri, {
            encoding: "base64"
          });
          avatarBase64 = `data:image/jpeg;base64,${base64}`;
        } catch (e) {
          console.error("Avatar base64 hatası:", e);
        }
      }
    }

    createChannel(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_base64: avatarBase64,
        avatar_url: avatarUrl,
        access_type: accessType,
        allowed_reactions: selectedReactions,
        polls_enabled: pollsEnabled
      },
      {
        onSuccess: (channel) => {
          router.replace(`/(broadcast)/${channel.id}`);
        },
        onError: (error) => {
          console.error("Kanal oluşturma hatası:", error);
          Alert.alert("Hata", error.message || "Kanal oluşturulamadı");
        }
      }
    );
  }, [
    name,
    description,
    avatarUri,
    accessType,
    selectedReactions,
    pollsEnabled,
    createChannel,
    router
  ]);

  // Tepki toggle
  const toggleReaction = (emoji: string) => {
    setSelectedReactions((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: colors.textMuted }]}>İptal</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Yeni Kanal</Text>
        <Pressable onPress={handleCreate} disabled={isPending || !name.trim()}>
          <Text
            style={[
              styles.createText,
              {
                color: name.trim() && !isPending ? colors.accent : colors.textMuted,
                opacity: isPending ? 0.5 : 1
              }
            ]}
          >
            {isPending ? "Oluşturuluyor..." : "Oluştur"}
          </Text>
        </Pressable>
      </View>

      {/* Avatar */}
      <Pressable style={styles.avatarContainer} onPress={handlePickAvatar}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
            <Ionicons name="camera" size={32} color={colors.textMuted} />
          </View>
        )}
        <Text style={[styles.avatarHint, { color: colors.textMuted }]}>Kanal fotoğrafı ekle</Text>
      </Pressable>

      {/* Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Kanal Adı</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]}
          placeholder="Kanal adı girin"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Açıklama</Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: colors.surface, color: colors.textPrimary }
          ]}
          placeholder="Kanal açıklaması (opsiyonel)"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={200}
        />
      </View>

      {/* Access Type */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Erişim Tipi</Text>
        <View style={styles.accessTypes}>
          {ACCESS_TYPES.map((type) => (
            <Pressable
              key={type.value}
              style={[
                styles.accessType,
                { backgroundColor: colors.surface },
                accessType === type.value && {
                  borderColor: colors.accent,
                  borderWidth: 2
                }
              ]}
              onPress={() => setAccessType(type.value)}
            >
              <Ionicons
                name={type.icon as any}
                size={20}
                color={accessType === type.value ? colors.accent : colors.textMuted}
              />
              <Text
                style={[
                  styles.accessTypeText,
                  {
                    color: accessType === type.value ? colors.accent : colors.textPrimary
                  }
                ]}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Reactions */}
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>İzin Verilen Tepkiler</Text>
        <View style={styles.reactions}>
          {DEFAULT_REACTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              style={[
                styles.reactionButton,
                { backgroundColor: colors.surface },
                selectedReactions.includes(emoji) && {
                  borderColor: colors.accent,
                  borderWidth: 2
                }
              ]}
              onPress={() => toggleReaction(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Polls */}
      <Pressable
        style={[styles.toggleRow, { backgroundColor: colors.surface }]}
        onPress={() => setPollsEnabled(!pollsEnabled)}
      >
        <View style={styles.toggleContent}>
          <Ionicons name="stats-chart-outline" size={22} color={colors.textPrimary} />
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
            Anketleri Etkinleştir
          </Text>
        </View>
        <View
          style={[styles.toggle, { backgroundColor: pollsEnabled ? colors.accent : colors.border }]}
        >
          <View
            style={[styles.toggleThumb, { transform: [{ translateX: pollsEnabled ? 20 : 0 }] }]}
          />
        </View>
      </Pressable>
    </ScrollView>
  );
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingBottom: 100
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  cancelText: {
    fontSize: 16
  },
  title: {
    fontSize: 18,
    fontWeight: "600"
  },
  createText: {
    fontSize: 16,
    fontWeight: "600"
  },
  avatarContainer: {
    alignItems: "center",
    paddingVertical: 24
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center"
  },
  avatarHint: {
    fontSize: 14,
    marginTop: 8
  },
  inputGroup: {
    paddingHorizontal: 16,
    marginBottom: 20
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top"
  },
  accessTypes: {
    flexDirection: "row",
    gap: 8
  },
  accessType: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4
  },
  accessTypeText: {
    fontSize: 12,
    fontWeight: "500"
  },
  reactions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  reactionEmoji: {
    fontSize: 24
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12
  },
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  toggleLabel: {
    fontSize: 16
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff"
  }
});

export default CreateBroadcastScreen;
